import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

// Custom performance trends
const readDuration = new Trend('duration_reads');
const checkoutDuration = new Trend('duration_checkout');
const browsingCount = new Counter('browsing_requests_total');
const checkoutCount = new Counter('checkout_requests_total');

export const options = {
  stages: [
    { duration: '30s', target: 200 },   // Warm-up ramp
    { duration: '1m', target: 1000 },   // Ramp to 1,000 concurrent Virtual Users
    { duration: '2m', target: 1000 },   // Steady load at 1,000 VUs
    { duration: '30s', target: 0 }      // Graceful ramp-down
  ],
  thresholds: {
    // NFR-S1: Less than 1% errors under 1,000 concurrent VUs
    http_req_failed: ['rate<0.01'],
    // NFR-S2: Target throughput > 500 req/s
    http_reqs: ['rate>500'],
    // NFR-S3: Latency targets
    'duration_reads': ['p(95)<300'],      // p95 < 300ms on reads
    'duration_checkout': ['p(95)<800'],   // p95 < 800ms on checkout
    http_req_duration: ['p(95)<400']
  }
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000';

// Stable test fixtures from seed data
const KNOWN_SLUGS = [
  'sony-wh-1000xm5-wireless-noise-canceling-headphones',
  'apple-macbook-pro-14-m3-pro',
  'samsung-galaxy-s24-ultra',
  'dell-ultrasharp-27-4k-monitor'
];

export default function () {
  const isCheckout = Math.random() < 0.1; // 10% checkout, 90% browsing

  if (isCheckout) {
    executeCheckoutScenario();
  } else {
    executeBrowsingScenario();
  }

  // Realistic human think time with random jitter
  sleep(Math.random() * 0.5 + 0.5);
}

/**
 * 90% Browsing Scenario:
 * Product catalogue list (cached), Category list (cached), Product Detail by slug (cached)
 */
function executeBrowsingScenario() {
  const params = {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'k6-load-tester'
    },
    tags: { type: 'read' }
  };

  // 1. Catalogue Listing with Pagination & Filter (Hits Redis cache-aside)
  const listRes = http.get(`${BASE_URL}/api/v1/products?limit=20&page=1`, params);
  readDuration.add(listRes.timings.duration);
  browsingCount.add(1);

  check(listRes, {
    'list products status 200': (r) => r.status === 200,
    'list products returned data': (r) => {
      try {
        const body = r.json();
        return Array.isArray(body.data) && body.data.length > 0;
      } catch {
        return false;
      }
    }
  });

  // 2. Category Listing
  const catRes = http.get(`${BASE_URL}/api/v1/categories`, params);
  readDuration.add(catRes.timings.duration);
  browsingCount.add(1);

  check(catRes, {
    'categories status 200': (r) => r.status === 200
  });

  // 3. Product Detail by Slug (Hits Redis cache-aside)
  const slug = KNOWN_SLUGS[Math.floor(Math.random() * KNOWN_SLUGS.length)];
  const detailRes = http.get(`${BASE_URL}/api/v1/products/slug/${slug}`, params);
  readDuration.add(detailRes.timings.duration);
  browsingCount.add(1);

  check(detailRes, {
    'product detail status 200': (r) => r.status === 200
  });
}

/**
 * 10% Checkout Scenario:
 * Register/Login, Add to Cart, ACID Transactional Checkout with Idempotency-Key, Mock Payment
 */
function executeCheckoutScenario() {
  const timestamp = Date.now();
  const vuId = __VU;
  const iterId = __ITER;
  const email = `loaduser_${vuId}_${iterId}_${timestamp}@unicart-test.dev`;
  const password = 'Password123!';

  const jsonHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'k6-load-tester'
  };

  // 1. Register test user
  const regRes = http.post(
    `${BASE_URL}/api/v1/auth/register`,
    JSON.stringify({
      name: `Load Test User ${vuId}`,
      email,
      password
    }),
    { headers: jsonHeaders }
  );

  let token = null;
  if (regRes.status === 201) {
    try {
      token = regRes.json('data.accessToken');
    } catch {
      token = null;
    }
  }

  // If user already exists, login
  if (!token) {
    const loginRes = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({ email, password }),
      { headers: jsonHeaders }
    );
    if (loginRes.status === 200) {
      try {
        token = loginRes.json('data.accessToken');
      } catch {
        token = null;
      }
    }
  }

  if (!token) {
    return;
  }

  const authHeaders = {
    ...jsonHeaders,
    'Authorization': `Bearer ${token}`
  };

  // 2. Fetch a valid product ID from catalog
  const productsRes = http.get(`${BASE_URL}/api/v1/products?limit=1`, { headers: authHeaders });
  let productId = null;
  try {
    const items = productsRes.json('data');
    if (items && items.length > 0) {
      productId = items[0]._id || items[0].id;
    }
  } catch {
    productId = null;
  }

  if (!productId) return;

  // 3. Add to Cart
  const cartRes = http.post(
    `${BASE_URL}/api/v1/cart/items`,
    JSON.stringify({
      productId,
      quantity: 1
    }),
    { headers: authHeaders }
  );

  check(cartRes, {
    'cart item added': (r) => r.status === 200
  });

  // 4. ACID Transaction Checkout with Idempotency Key
  const idempotencyKey = `k6-idem-${vuId}-${iterId}-${timestamp}-${Math.random().toString(36).substring(2, 9)}`;
  const checkoutHeaders = {
    ...authHeaders,
    'Idempotency-Key': idempotencyKey
  };

  const checkoutStartTime = Date.now();
  const orderRes = http.post(
    `${BASE_URL}/api/v1/orders`,
    JSON.stringify({
      shippingAddress: {
        street: '123 Tech Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'IN'
      }
    }),
    {
      headers: checkoutHeaders,
      tags: { type: 'checkout' }
    }
  );

  const duration = Date.now() - checkoutStartTime;
  checkoutDuration.add(duration);
  checkoutCount.add(1);

  let orderId = null;
  const isOrderOk = check(orderRes, {
    'order created status 201': (r) => r.status === 201
  });

  if (isOrderOk) {
    try {
      orderId = orderRes.json('data.order._id') || orderRes.json('data.order.id');
    } catch {
      orderId = null;
    }
  }

  // 5. Mock Payment
  if (orderId) {
    const payRes = http.post(
      `${BASE_URL}/api/v1/orders/${orderId}/pay`,
      JSON.stringify({ paymentMethod: 'card' }),
      {
        headers: authHeaders,
        tags: { type: 'checkout' }
      }
    );

    check(payRes, {
      'mock pay status 200': (r) => r.status === 200
    });
  }
}
