import type { Product, User, Order } from '../types';

export const MOCK_CATEGORIES = [
  { id: 'all', name: 'All Categories', icon: 'grid_view' },
  { id: 'audio-wearables', name: 'Audio & Wearables', icon: 'headphones' },
  { id: 'smartphones', name: 'Smartphones & Tablets', icon: 'smartphone' },
  { id: 'laptops-computers', name: 'Laptops & Computers', icon: 'laptop_mac' },
  { id: 'accessories', name: 'Accessories & Peripherals', icon: 'keyboard' },
  { id: 'smart-home', name: 'Smart Home & IoT', icon: 'home_iot_device' }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Boat Rockerz 450 Bluetooth On-Ear Headphone with Mic',
    slug: 'boat-rockerz-450-bluetooth-on-ear-headphone',
    description: 'Up to 15 Hours of Playback, 40mm Dynamic Drivers, Padded Ear Cushions, Integrated Controls, and Dual Modes (Bluetooth v5.0 and AUX). Built for deep bass lovers.',
    price: 1499,
    originalPrice: 3990,
    discountPercentage: 62,
    stock: 18,
    category: 'audio-wearables',
    brand: 'Boat',
    rating: 4.4,
    reviewCount: 3840,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80'
    ],
    specifications: {
      'Battery Life': 'Up to 15 Hours',
      'Driver Size': '40 mm Dynamic',
      'Connectivity': 'Bluetooth 5.0 + 3.5mm AUX',
      'Charging Time': '2 Hours (Micro-USB)',
      'Weight': '168g',
      'Warranty': '1 Year Manufacturer Warranty'
    }
  },
  {
    id: 'prod-002',
    name: 'Sony WH-1000XM5 Wireless Active Noise Cancelling Headphones',
    slug: 'sony-wh-1000xm5-wireless-anc-headphones',
    description: 'Industry-leading noise cancellation with 8 microphones and Auto NC Optimizer. Ultra-clear hands-free calling with 4 beamforming microphones. 30-hour battery life with quick charge.',
    price: 26990,
    originalPrice: 34990,
    discountPercentage: 23,
    stock: 7,
    category: 'audio-wearables',
    brand: 'Sony',
    rating: 4.8,
    reviewCount: 1920,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80'
    ],
    specifications: {
      'Noise Cancellation': 'Dual Processor V1 + HD QN1',
      'Battery Life': '30 Hours (ANC ON), 40 Hours (ANC OFF)',
      'Charging': 'USB-PD Fast Charging (3 min = 3 hours)',
      'Hi-Res Audio': 'LDAC and DSEE Extreme supported',
      'Weight': '250g',
      'Warranty': '1 Year Brand Warranty'
    }
  },
  {
    id: 'prod-003',
    name: 'Apple AirPods Pro (2nd Gen) with MagSafe Case (USB-C)',
    slug: 'apple-airpods-pro-2nd-gen-usbc',
    description: 'Up to 2x more Active Noise Cancellation. Transparency mode and Personalized Spatial Audio with dynamic head tracking. Dust, sweat, and water resistant (IP54).',
    price: 20990,
    originalPrice: 24900,
    discountPercentage: 16,
    stock: 12,
    category: 'audio-wearables',
    brand: 'Apple',
    rating: 4.9,
    reviewCount: 4120,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80',
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&q=80'
    ],
    specifications: {
      'Chipset': 'Apple H2 Headphone Chip',
      'Audio Technology': 'Active Noise Cancellation, Adaptive Audio',
      'Battery': 'Up to 6 hours listening (30 hours with case)',
      'Water Resistance': 'IP54',
      'Charging': 'USB-C, MagSafe, Qi-certified',
      'Warranty': '1 Year Apple Limited Warranty'
    }
  },
  {
    id: 'prod-004',
    name: 'Noise ColorFit Pulse 2 Max 1.85" Bluetooth Calling Smartwatch',
    slug: 'noise-colorfit-pulse-2-max-smartwatch',
    description: '1.85" TFT LCD Display with 550 nits brightness. Tru Sync Bluetooth calling with lower battery consumption and longer range. 100 sports modes and comprehensive health suite.',
    price: 1299,
    originalPrice: 5999,
    discountPercentage: 78,
    stock: 25,
    category: 'audio-wearables',
    brand: 'Noise',
    rating: 4.3,
    reviewCount: 8400,
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80'
    ],
    specifications: {
      'Display': '1.85 inch TFT LCD (240x284 px)',
      'Battery Life': 'Up to 10 days typical use',
      'Calling': 'Bluetooth Calling with Speaker & Mic',
      'Sensors': 'SpO2, Heart Rate, Stress, Sleep',
      'Water Resistance': 'IP68',
      'Warranty': '1 Year Brand Warranty'
    }
  },
  {
    id: 'prod-005',
    name: 'Samsung Galaxy Watch6 LTE (44mm, Graphite)',
    slug: 'samsung-galaxy-watch6-lte-44mm',
    description: 'Sapphire Crystal display, Advanced Sleep Coaching, ECG and Blood Pressure monitoring, Body Composition Analysis (BIA sensor), Wear OS Powered by Samsung.',
    price: 29999,
    originalPrice: 36999,
    discountPercentage: 19,
    stock: 5,
    category: 'audio-wearables',
    brand: 'Samsung',
    rating: 4.7,
    reviewCount: 950,
    images: [
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80'
    ],
    specifications: {
      'Display': '1.5 inch Super AMOLED (480x480)',
      'Connectivity': '4G LTE eSIM + Bluetooth 5.3 + Wi-Fi',
      'Durability': '5ATM + IP68 / MIL-STD-810H',
      'Sensors': 'BioActive Sensor, Temperature, Barometer',
      'OS': 'Wear OS 4 with One UI 5 Watch',
      'Warranty': '1 Year Samsung India Warranty'
    }
  },
  {
    id: 'prod-006',
    name: 'JBL Flip 6 Wireless Portable Bluetooth Speaker',
    slug: 'jbl-flip-6-portable-bluetooth-speaker',
    description: 'Bold JBL Original Pro Sound with 2-way speaker system. IP67 waterproof and dustproof design. 12 hours of playtime with PartyBoost multi-speaker pairing.',
    price: 9999,
    originalPrice: 13999,
    discountPercentage: 29,
    stock: 14,
    category: 'audio-wearables',
    brand: 'JBL',
    rating: 4.6,
    reviewCount: 3120,
    images: [
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80'
    ],
    specifications: {
      'Output Power': '20W RMS woofer + 10W RMS tweeter',
      'Battery Life': 'Up to 12 Hours',
      'Waterproof': 'IP67 Dust & Water Protection',
      'Bluetooth': 'Version 5.1',
      'Weight': '550g',
      'Warranty': '1 Year JBL Official Warranty'
    }
  },
  {
    id: 'prod-007',
    name: 'Logitech MX Master 3S Wireless Performance Mouse',
    slug: 'logitech-mx-master-3s-wireless-mouse',
    description: 'Quiet Clicks, 8K DPI any-surface tracking (including glass), MagSpeed electromagnetic scrolling, USB-C rechargeable, Easy-Switch across 3 computers.',
    price: 8995,
    originalPrice: 10995,
    discountPercentage: 18,
    stock: 22,
    category: 'accessories',
    brand: 'Logitech',
    rating: 4.8,
    reviewCount: 5200,
    images: [
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80'
    ],
    specifications: {
      'Sensor': 'Darkfield high precision (200-8000 DPI)',
      'Buttons': '7 buttons with gesture button',
      'Battery': 'Rechargeable Li-Po (500 mAh) up to 70 days',
      'Connectivity': 'Bluetooth Low Energy & Logi Bolt USB',
      'Warranty': '2 Year Limited Hardware Warranty'
    }
  },
  {
    id: 'prod-008',
    name: 'Keychron K2 Wireless Mechanical Keyboard (Version 2)',
    slug: 'keychron-k2-wireless-mechanical-keyboard',
    description: '75% compact layout with 84 keys. Gateron G Pro mechanical switches (Hot-swappable). RGB Backlit aluminum frame. Dual Mac/Windows compatibility via Bluetooth 5.1 or USB-C.',
    price: 7499,
    originalPrice: 9999,
    discountPercentage: 25,
    stock: 9,
    category: 'accessories',
    brand: 'Keychron',
    rating: 4.7,
    reviewCount: 1670,
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'
    ],
    specifications: {
      'Layout': '75% (84 Keys)',
      'Switches': 'Gateron G Pro Brown / Red / Blue',
      'Battery': '4000mAh (Up to 240 hours without backlight)',
      'Backlight': '18 Types of RGB Lighting',
      'Compatibility': 'macOS / Windows / iOS / Android',
      'Warranty': '1 Year Keychron India Warranty'
    }
  },
  {
    id: 'prod-009',
    name: 'Apple MacBook Air M3 (13-inch, 16GB RAM, 512GB SSD)',
    slug: 'apple-macbook-air-m3-13-inch',
    description: 'Liquid Retina display with 500 nits of brightness. Apple M3 chip with 8-core CPU and 10-core GPU. Up to 18 hours of battery life. MagSafe 3 charging and dual Thunderbolt ports.',
    price: 124900,
    originalPrice: 134900,
    discountPercentage: 7,
    stock: 4,
    category: 'laptops-computers',
    brand: 'Apple',
    rating: 4.9,
    reviewCount: 880,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80'
    ],
    specifications: {
      'Processor': 'Apple M3 8-core CPU, 10-core GPU',
      'Memory': '16GB Unified Memory',
      'Storage': '512GB High-Speed SSD',
      'Display': '13.6-inch Liquid Retina with True Tone',
      'Weight': '1.24 kg',
      'Warranty': '1 Year Apple Limited Warranty'
    }
  }
];

export const MOCK_USER: User = {
  id: 'usr-rahul-01',
  name: 'Rahul Sharma',
  email: 'rahul.sharma@example.com',
  role: 'customer',
  addresses: [
    {
      id: 'addr-1',
      line1: 'Flat 402, Sunshine Heights, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      country: 'India',
      isDefault: true
    },
    {
      id: 'addr-2',
      line1: 'B-12, Sector 62, Electronic City',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201309',
      country: 'India'
    }
  ]
};

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-984214',
    userId: 'usr-rahul-01',
    createdAt: '2026-10-17T14:32:00Z',
    status: 'paid',
    subtotal: 26990,
    shipping: 0,
    total: 26990,
    idempotencyKey: 'c8d0e2e9-4e1b-4f24-9b21-4f114a757672',
    paymentRef: 'PAY-MOCK-782914',
    shippingAddress: MOCK_USER.addresses[0],
    items: [
      {
        productId: 'prod-002',
        name: 'Sony WH-1000XM5 Wireless Active Noise Cancelling Headphones',
        price: 26990,
        qty: 1,
        image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'
      }
    ]
  },
  {
    id: 'ORD-981052',
    userId: 'usr-rahul-01',
    createdAt: '2026-10-12T10:15:00Z',
    status: 'delivered',
    subtotal: 10498,
    shipping: 0,
    total: 10498,
    idempotencyKey: '8a9c2b1d-91b4-4e2a-a0cf-ac73c693e928',
    paymentRef: 'PAY-MOCK-349012',
    shippingAddress: MOCK_USER.addresses[0],
    items: [
      {
        productId: 'prod-001',
        name: 'Boat Rockerz 450 Bluetooth On-Ear Headphone with Mic',
        price: 1499,
        qty: 1,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'
      },
      {
        productId: 'prod-007',
        name: 'Logitech MX Master 3S Wireless Performance Mouse',
        price: 8995,
        qty: 1,
        image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80'
      }
    ]
  }
];
