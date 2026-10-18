# UniCart Stitch Designs

**Project:** Main Task List  
**Project ID:** `17698998232618089440`  
**Total Screens:** 9

These screens were generated and exported from Google Stitch for the **UniCart** e-commerce application. Each screen includes both the high-resolution rendered screenshot (`screen.png`) and the complete HTML/Tailwind implementation (`screen.html`).

---

## Screen Directory

| # | Title | Device | Dimensions | Image | HTML Code |
|---|---|---|---|---|---|
| 1 | **UniCart - Home & Product Listing (Desktop)** | `DESKTOP` | 2560x5260 | [Screenshot](01-unicart-home-product-listing-desktop/screen.png) | [HTML Code](01-unicart-home-product-listing-desktop/screen.html) |
| 2 | **UniCart - Product Listing (Mobile)** | `MOBILE` | 780x3266 | [Screenshot](02-unicart-product-listing-mobile/screen.png) | [HTML Code](02-unicart-product-listing-mobile/screen.html) |
| 3 | **UniCart - Product Detail Page** | `DESKTOP` | 2560x5420 | [Screenshot](03-unicart-product-detail-page/screen.png) | [HTML Code](03-unicart-product-detail-page/screen.html) |
| 4 | **UniCart - Register** | `DESKTOP` | 2560x2328 | [Screenshot](04-unicart-register/screen.png) | [HTML Code](04-unicart-register/screen.html) |
| 5 | **UniCart - Login & Security States** | `DESKTOP` | 2560x2082 | [Screenshot](05-unicart-login-security-states/screen.png) | [HTML Code](05-unicart-login-security-states/screen.html) |
| 6 | **UniCart - Shopping Cart & Checkout Prep** | `DESKTOP` | 2560x3486 | [Screenshot](06-unicart-shopping-cart-checkout-prep/screen.png) | [HTML Code](06-unicart-shopping-cart-checkout-prep/screen.html) |
| 7 | **UniCart - Checkout, Payment & Order States** | `DESKTOP` | 2560x3760 | [Screenshot](07-unicart-checkout-payment-order-states/screen.png) | [HTML Code](07-unicart-checkout-payment-order-states/screen.html) |
| 8 | **UniCart - My Orders & Order Details** | `DESKTOP` | 2560x3706 | [Screenshot](08-unicart-my-orders-order-details/screen.png) | [HTML Code](08-unicart-my-orders-order-details/screen.html) |
| 9 | **UniCart - Profile & Account Settings** | `DESKTOP` | 2560x4686 | [Screenshot](09-unicart-profile-account-settings/screen.png) | [HTML Code](09-unicart-profile-account-settings/screen.html) |

---

## Screen Breakdown & Details

### 1. UniCart - Home & Product Listing (Desktop)
- **Screen ID:** `65f5bf0634c641d4a831f3abb1184660`
- **Device Type:** `DESKTOP` (2560x5260)
- **Folder:** [`01-unicart-home-product-listing-desktop/`](./01-unicart-home-product-listing-desktop/)
- **Files:**
  - Image: [`screen.png` (38.2 KB)](./01-unicart-home-product-listing-desktop/screen.png)
  - Code: [`screen.html` (72.6 KB)](./01-unicart-home-product-listing-desktop/screen.html)
  - Metadata: [`metadata.json`](./01-unicart-home-product-listing-desktop/metadata.json)
- **Original Prompt:**
> Design the full desktop Home / Product Listing page (1440px viewport) for "UniCart", a modern, minimal, trustworthy B2C Indian e-commerce marketplace.

Key specifications to implement faithfully:
1. Top Navbar:
   - UniCart Logo with clean shopping bag icon in primary indigo (#4F46E5).
   - Category selector dropdown integrated with center search bar (placeholder: "Search for electronics, fashion, home essentials & more...") with search icon button.
   - Right navigation items: "Delivery to Mumbai 400001", Wishlist with count badge, Cart button with item count badge "3" in emerald (#10B981) or indigo, and Account menu showing logged-in profile ("Hi, Rahul" with dropdown displaying My Orders, Profile, Admin Dashboard badge link, and Logout, plus preview toggle to logged-out Login/Register).

2. Breadcrumbs & Alert Banner:
   - Clean breadcrumb: Home > Electronics > Audio & Wearables.
   - Inline Error State demo box (collapsible or alert banner): "Unable to update cart quantity for item 'Boat Rockerz 450'. Please check your internet connection or retry [Retry CTA]."

3. Main Layout (Two-column with generous whitespace):
   - Left Sidebar Filters (280px width, sticky, subtle borders, rounded-lg):
     * Categories list with checkboxes and count badges: Wireless Headphones (42), Smartwatches (28), Bluetooth Speakers (19), Earbuds (35), Power Banks (14).
     * Price Range filter: explicit accessible labels "Min Price (₹)" and "Max Price (₹)" input boxes (e.g. ₹499 to ₹9,999) and an "Apply Filter" button.
     * Availability filter: In Stock, Include Out of Stock.
     * Customer Ratings: 4★ & above, 3★ & above.
     * Clear all filters link.

   - Main Content Area:
     * Header bar: Result header "Audio & Wearables (84 items found)", active filter tags ("₹499 - ₹4,999 ✕", "In Stock ✕", "Clear All"), sort dropdown ("Sort by: Newest", "Price: Low to High", "Price: High to Low", "Popularity", "Customer Rating").
     * Product Grid (4 columns, rounded-lg cards, subtle slate border #E2E8F0, clean padding, hover elevation):
       - Card 1: Wireless Over-Ear ANC Headphones. Price: ₹2,499.00 (MRP: ₹4,999.00, 50% off). Stock badge: Emerald pill "● In stock". "Add to Cart" indigo button.
       - Card 2: Smart Fitness Watch with AMOLED Display. Price: ₹3,199.00 (MRP: ₹5,999.00). Stock badge: Amber pill "● Only 3 left". "Add to Cart" indigo button.
       - Card 3: True Wireless Earbuds with ENC Mic. Price: ₹1,299.00 (MRP: ₹2,999.00). Stock badge: Red pill "● Out of stock". "Out of Stock" button disabled (slate background, cursor not allowed).
       - Card 4: Portable Waterproof Bluetooth Speaker 20W. Price: ₹1,899.00. Stock badge: Emerald pill "● In stock". "Add to Cart" button.
       - Card 5: Studio Monitor Wired Headphones. Price: ₹4,499.00. Stock badge: Emerald pill "● In stock". "Add to Cart" button.
       - Card 6: Noise Cancelling Gaming Headset with Boom Mic. Price: ₹2,199.00. Stock badge: Amber pill "● Only 2 left". "Add to Cart" button.
       - Card 7: BassBoost Neckband Earphones with Fast Charging. Price: ₹899.00. Stock badge: Emerald pill "● In stock". "Add to Cart" button.
       - Card 8: High-Res Wireless Soundbar with Subwoofer. Price: ₹8,999.00. Stock badge: Red pill "● Out of stock". "Out of Stock" button disabled.

     * Numbered Pagination:
       - Accessible pagination controls: "Previous", [1 (active indigo)], [2], [3], [4], "...", [11], "Next", with text showing "Showing 1–8 of 84 products".

4. Dedicated States Section (Accessible UI Showcase tabs or bottom showcase):
   - Showcase tabs or toggle panels demonstrating:
     1) Loading Skeleton State: 4-column shimmer placeholder cards with pulsing gray blocks for image, title, price, and CTA.
     2) Empty State: Friendly empty search illustration/icon, heading "No products found matching your filters", subtext "Try clearing some filters or searching for something else", and "Reset All Filters" primary button.
     3) Inline Error State: Styled error banner with retry action and error codes.

5. Footer:
   - Value propositions: Fast pan-India delivery, 7-Day Hassle-free Returns, 100% Safe UPI & RuPay/Visa checkout.
   - Clean column links (Shop, About UniCart, Customer Care, Policies, Sell on UniCart).
   - Copyright notice: "© 2024 UniCart Retail Internet Private Limited. All rights reserved." Prices displayed in Indian Rupees (₹).

---
### 2. UniCart - Product Listing (Mobile)
- **Screen ID:** `783dca06724d4cb68417ebae897548e9`
- **Device Type:** `MOBILE` (780x3266)
- **Folder:** [`02-unicart-product-listing-mobile/`](./02-unicart-product-listing-mobile/)
- **Files:**
  - Image: [`screen.png` (27.8 KB)](./02-unicart-product-listing-mobile/screen.png)
  - Code: [`screen.html` (43.5 KB)](./02-unicart-product-listing-mobile/screen.html)
  - Metadata: [`metadata.json`](./02-unicart-product-listing-mobile/metadata.json)
- **Original Prompt:**
> Design the responsive mobile version (390px viewport) of the Home / Product Listing screen for "UniCart", the Indian B2C e-commerce marketplace.

Key mobile specifications:
1. Mobile Header:
   - UniCart logo with bag mark, search icon, wishlist icon, and shopping cart icon with "3" badge.
   - Search bar input directly below header with camera/voice & search button.
   - Location chip: "Deliver to Mumbai 400001 ▾".

2. Inline Error banner (dismissible / with retry CTA):
   - "Unable to sync wishlist items. Tap to retry [Retry]" in red-50 border/bg with red-600 text.

3. Mobile Filter & Sorting Bar:
   - Sticky top bar with quick category horizontal scroll chips ("All", "Headphones", "Smartwatches", "Speakers", "Earbuds").
   - Filter button ("Filters (2) ⚙") showing active badge count and Sort dropdown ("Sort: Low to High ▾").
   - Result count: "84 products found".

4. Product Grid (2 columns as requested for mobile):
   - Clean rounded-lg cards with subtle borders:
     - Card 1: Wireless ANC Headphones. ₹2,499.00 (₹4,999.00 50% off). Green badge "● In stock". "Add" button (+ icon).
     - Card 2: AMOLED Smartwatch. ₹3,199.00. Amber badge "● Only 3 left". "Add" button (+ icon).
     - Card 3: TWS Earbuds. ₹1,299.00. Red badge "● Out of stock". Disabled "Sold out" button.
     - Card 4: 20W Bluetooth Speaker. ₹1,899.00. Green badge "● In stock". "Add" button (+ icon).
     - Card 5: Studio Headphones. ₹4,499.00. Green badge "● In stock". "Add" button (+ icon).
     - Card 6: Gaming Headset. ₹2,199.00. Amber badge "● Only 2 left". "Add" button (+ icon).

5. Interactive States Preview / Drawer / Section:
   - Filter Bottom Sheet / Modal drawer preview showing Category checkboxes, Min ₹ and Max ₹ inputs, and "Apply Filters" button.
   - Tab or toggle to view:
     * Loading Skeleton (pulsing cards for mobile 2-col grid).
     * Empty State ("No products found", Reset CTA).

6. Mobile Bottom Pagination:
   - Compact pagination: "< Prev", Page "1 of 11", "Next >".

7. Mobile Bottom Navigation Bar:
   - 5 icons: Home (active indigo), Categories, Wishlist (badge 2), Orders, Account.

---
### 3. UniCart - Product Detail Page
- **Screen ID:** `9a2a3a6c9afb4f19bf79d9b796cc5d1b`
- **Device Type:** `DESKTOP` (2560x5420)
- **Folder:** [`03-unicart-product-detail-page/`](./03-unicart-product-detail-page/)
- **Files:**
  - Image: [`screen.png` (34.3 KB)](./03-unicart-product-detail-page/screen.png)
  - Code: [`screen.html` (46.2 KB)](./03-unicart-product-detail-page/screen.html)
  - Metadata: [`metadata.json`](./03-unicart-product-detail-page/metadata.json)
- **Original Prompt:**
> Design a comprehensive, clean, modern, and accessible Product Detail Page (PDP) for 'UniCart' on desktop (1440px), maintaining exact continuity with the established Clear Commerce design system (primary indigo #4F46E5, accent emerald #10B981 for in-stock, red #EF4444, amber #F59E0B, slate neutrals, Inter font, rounded-lg cards, subtle borders, high contrast WCAG AA).

Header & Navigation:
- Include the standard UniCart global top navbar with brand logo, department dropdown search bar in center, Delivery to Mumbai 400001, Wishlist (2), Cart badge with item count, and Account / Profile dropdown.
- Breadcrumb navigation: Home > Electronics > Audio & Wearables > Headphones > 'Wireless Over-Ear ANC Headphones with 40H Playtime'.

Product Overview (2-column layout):
- Left Column (Image Gallery):
  - Large, high-resolution main product showcase image with subtle zoom/expand trigger.
  - Interactive thumbnail strip (4-5 thumbnails: front view, angled view, folded case view, lifestyle/earcups close-up, color variant) with an active indigo outline ring on the selected thumbnail.
  - Badge overlays: '50% OFF' and 'Best Seller'.
  - Trust indicators below image gallery: '100% Genuine Product', '7-Day Replacement', '1-Year UniCart Warranty', 'Free Delivery by Tomorrow 11 AM'.

- Right Column (Product Info & Purchase Actions):
  - Brand name 'AcroSonic Audio' & Full product name: 'Wireless Over-Ear ANC Headphones with 40H Playtime, Hi-Res Audio, Multipoint Connection (Midnight Black)'.
  - Rating badge: 4.5 stars (1,420 ratings & 348 reviews) with verified purchase tag.
  - Pricing section in INR (₹):
    - Current deal price: '₹2,499.00' (prominent, bold headline-md).
    - M.R.P.: '₹4,999.00' with strike-through.
    - Discount badge: '50% OFF' and 'Save ₹2,500.00' inclusive of all taxes.
    - EMI options hint: 'EMI starting from ₹121/month with No Cost EMI'.
  - Stock & Availability Status:
    - Multi-modal stock status: Emerald dot icon + badge 'In stock (Only 5 left - order soon)'.
  - Color / Variant selector:
    - Visible label 'Color: Midnight Black'. Options: Midnight Black (selected), Arctic White, Navy Blue.
  - Quantity Selector Stepper:
    - Visible label 'Quantity:'.
    - Stepper with minus (-) button, number input showing '1' (restricted 1 to 10, capped at remaining stock 5), and plus (+) button. Accessible buttons with disabled state when hitting boundaries.
  - Call to Action (CTAs):
    - Primary CTA: 'Add to Cart' button (large, bold indigo #4F46E5 with shopping cart icon, hover effect, active state).
    - Secondary CTA: 'Buy Now' button (amber or solid accent high-contrast).
    - Wishlist icon button (heart icon) and Share button.
  - Delivery & Pincode Checker:
    - 'Deliver to 400001 - Mumbai': Check delivery date, Cash on Delivery available, Fast express shipping.

Active Toast Notification:
- Prominently display the requested toast notification at top-right or bottom-right:
  - 'Added to cart' with green checkmark icon, thumbnail, 'Wireless Over-Ear ANC Headphones (Qty: 1)', subtotal '₹2,499.00', and a 'View Cart & Checkout' button, plus a dismiss '✕' icon.

Product Details & Specifications Section (below the fold):
- Tabbed or structured section:
  - 'Key Highlights' / Bullet points (Active Noise Cancellation up to 35dB, 40-hour battery life with Fast Charge 10 mins = 5 hrs, 40mm dynamic drivers, Bluetooth 5.3, dual mic ENC for crystal clear calls).
  - 'Technical Specifications' clean data table (Brand, Model, Form Factor, Connectivity, Battery Life, Frequency Response, Weight, Warranty).
  - System edge state toggle or preview tabs for loading skeleton & out-of-stock state.

Footer:
- Matching UniCart e-commerce directory footer with copyright, trust badges (Pan-India delivery, 7-day returns, secure UPI/RuPay), customer care links, and company policies.

---
### 4. UniCart - Register
- **Screen ID:** `6cae1f5da64e4a22a2eaee547608157a`
- **Device Type:** `DESKTOP` (2560x2328)
- **Folder:** [`04-unicart-register/`](./04-unicart-register/)
- **Files:**
  - Image: [`screen.png` (32.6 KB)](./04-unicart-register/screen.png)
  - Code: [`screen.html` (22.6 KB)](./04-unicart-register/screen.html)
  - Metadata: [`metadata.json`](./04-unicart-register/metadata.json)
- **Original Prompt:**
> Design the UniCart Registration page in a centered card layout adhering to the UniCart / Clear Commerce design system.
Header: Minimal UniCart header with logo linking home, 'Already have an account? Sign in' top right, and security badge.
Main Body:
Centered card container (max-w-md or max-w-lg), clean rounded-2xl or rounded-xl border border-slate-200 bg-white shadow-sm p-8.
Title: "Create your UniCart account" with subtitle "Shop millions of products with fast India delivery & secure UPI payments".
Form inputs (all with visible, accessible labels, no placeholder-only):
- Full Name (text input, icon, e.g. "Rahul Sharma")
- Email Address or Mobile Number (+91 support indication / valid email label)
- Password input with toggle show/hide visibility icon.
- Interactive Live Password Strength Meter & Checklist:
  * Dynamic visual strength bar (Weak / Fair / Strong)
  * Checklist items with real-time green checkmark or subtle bullet indicator:
    - At least 8 characters
    - At least one uppercase letter (A-Z)
    - At least one lowercase letter (a-z)
    - At least one number (0-9)
- Confirm Password input
- Terms & Privacy policy checkbox with clear links
- Primary CTA: "Create Account" in primary indigo (#4F46E5) with hover/focus ring
- Social/Fast login options: "Or sign up with Google" / "Continue with OTP"
- Trust assurance row at bottom of card: "100% Secure & Encrypted • 256-bit SSL"
- Footer: Copyright and help links.
Match the established UniCart styling: Inter typography, primary indigo #4F46E5, emerald #10B981 indicators, slate neutrals.

---
### 5. UniCart - Login & Security States
- **Screen ID:** `54303e1c7a39478aa0cfac73c693e928`
- **Device Type:** `DESKTOP` (2560x2082)
- **Folder:** [`05-unicart-login-security-states/`](./05-unicart-login-security-states/)
- **Files:**
  - Image: [`screen.png` (26.9 KB)](./05-unicart-login-security-states/screen.png)
  - Code: [`screen.html` (26.3 KB)](./05-unicart-login-security-states/screen.html)
  - Metadata: [`metadata.json`](./05-unicart-login-security-states/metadata.json)
- **Original Prompt:**
> Design the UniCart Login / Sign In page in a centered card layout adhering to the UniCart / Clear Commerce design system.
Header: Minimal UniCart header with logo, 'New to UniCart? Create account' top right, and 24x7 help link.
Main Body:
Centered card container (max-w-md), rounded-2xl/rounded-xl, border border-slate-200 bg-white shadow-sm p-8.
Title: "Welcome back to UniCart" with subtitle "Enter your email or phone to access your orders, wishlist & recommendations".

Include Form Inputs & Interactions:
- Email or Mobile Number input with accessible floating/top label.
- Password input with toggle show/hide icon and "Forgot password?" right-aligned link.
- "Remember me on this device" checkbox.
- Primary CTA: "Sign In" in primary indigo (#4F46E5).
- Alternate sign-in method: "Request OTP" button, "Continue with Google".

Key Required Security & Edge States directly visible or toggleable on screen:
1. Generic Error Banner:
   - Dismissible high-contrast warning banner: "Invalid credentials. Please check your email and password and try again." (Red #EF4444 background tint, alert icon, clear retry hint).
2. Locked-Account Alert State:
   - Amber/Red security warning banner: "Account temporarily locked: Too many attempts. Try again in 15 minutes." with countdown timer badge and "Reset Password" CTA.
3. Rate-Limit Message State:
   - Info/Warning rate limit toast or banner: "Too many requests. Please wait a moment before trying again (HTTP 429 - Rate limit reached)."
Provide an interactive or clearly sectioned State Switcher (tabs or toggle chips: "Default Form", "Invalid Credentials Error", "Locked Account State (15 min)", "Rate Limited (429)") so reviewers and developers can test and inspect all security edge cases in full visual detail.

Footer: Trust indicators (256-bit encryption, RBI compliant UPI security) and legal links.
Match the Clear Commerce tokens: Inter font, #4F46E5 indigo, #EF4444 red, #F59E0B amber, light mode crisp layout.

---
### 6. UniCart - Shopping Cart & Checkout Prep
- **Screen ID:** `ad903846762743e59faace16e5e2921f`
- **Device Type:** `DESKTOP` (2560x3486)
- **Folder:** [`06-unicart-shopping-cart-checkout-prep/`](./06-unicart-shopping-cart-checkout-prep/)
- **Files:**
  - Image: [`screen.png` (49.4 KB)](./06-unicart-shopping-cart-checkout-prep/screen.png)
  - Code: [`screen.html` (50.3 KB)](./06-unicart-shopping-cart-checkout-prep/screen.html)
  - Metadata: [`metadata.json`](./06-unicart-shopping-cart-checkout-prep/metadata.json)
- **Original Prompt:**
> Design the Cart page for UniCart (1440px desktop e-commerce web app for Indian market, INR ₹ prices, matching Clear Commerce design system with indigo #4F46E5 primary, emerald #10B981, red #EF4444, amber #F59E0B, clean whitespace, Inter font, rounded-lg cards, subtle borders, high accessibility).

Key Layout & Features:
1. Top Navbar: UniCart logo, search bar, department dropdown, pincode delivery indicator ('Deliver to Mumbai 400001'), wishlist, active Cart badge with item count, account menu with Namaste Rahul profile.
2. Breadcrumb / Progress Steps: Cart (Active Step 1) > Delivery Address (Step 2) > Payment (Step 3).
3. Cart Layout (2-column layout on desktop: ~8 cols for cart items and warnings, ~4 cols for sticky right-side order summary card):
   - Left Column (Main Cart):
     * Header: 'Shopping Cart (3 items)' with 'Deselect all items' and live free shipping progress bar ('Add ₹201 more to unlock FREE Express Delivery!').
     * Warning Alerts / Edge States:
       - Amber warning banner: 'Price Updated: Wireless ANC Headphones price updated from ₹2,699 to ₹2,499. You save ₹200!'
       - Red warning badge / card notification on an item: 'Only 2 left in stock. Quantity adjusted from 3 to 2.'
     * Cart Line Items (rounded-lg border card with subtle borders):
       - Item 1: Wireless Over-Ear ANC Headphones with 40H Playtime (Midnight Black). Image, brand AcroSonic, unit price ₹2,499 (M.R.P. ₹4,999, 50% off), in stock, quantity stepper (- 1 + up to 10), line total ₹2,499.00, actions: Save for later | Remove (with trash icon).
       - Item 2: Smart Fitness Watch with 1.43" AMOLED Display (Active Black). Unit price ₹3,199.00. Warning banner: 'Stock Alert: Only 2 available'. Quantity stepper capped at 2. Line total ₹6,398.00. Remove button, Save for later.
       - Item 3: Portable Waterproof Bluetooth Speaker 20W. Unit price ₹1,899.00. Quantity 1. Line total ₹1,899.00. Remove button, Save for later.
     * Saved for Later / Recommended Additions carousel or list underneath.
   - Right Column (Order Summary Card):
     * Sticky summary card (rounded-lg bg-white border border-slate-200 p-6 shadow-sm):
     * Header: 'Order Summary'
     * Subtotal (4 items): ₹10,796.00
     * Discount on MRP: -₹5,800.00 (emerald text)
     * Delivery Fee: ₹99.00 (FREE if above ₹1,000 promo tag applied or coupon)
     * Coupon code input with 'Apply' button (e.g., 'UNICARTNEW applied - ₹200 off')
     * Total Amount: ₹10,596.00 (large bold INR price, inclusive of all GST/taxes)
     * Savings indicator: 'You will save ₹6,000 on this order' in emerald badge
     * Primary CTA Button: 'Proceed to Checkout (₹10,596.00)' with lock icon or arrow, styled in UniCart primary indigo #4F46E5.
     * Trust assurances: 100% Secure UPI / Cards / NetBanking payments, 7-Day Easy Returns, Buyer Protection.
4. Interactive System State Switcher / Edge States Preview:
   - Include quick toggle or visible section showcasing:
     * 'Active Cart with Price/Stock Warning' (default active view)
     * 'Empty Cart State': Illustrative empty bag icon, headline 'Your UniCart cart is empty', body 'Looks like you haven\'t added anything to your cart yet. Explore our curated gadgets, electronics, and fashion deals.', prominent primary button 'Browse Products' / 'Continue Shopping' linking back to catalog, and a 'Trending picks for you' product row.
     * 'Loading Shimmer Skeleton' for line items and summary.
5. Simple Footer with Pan-India trust badges, UPI / RuPay logos, and copyright.

---
### 7. UniCart - Checkout, Payment & Order States
- **Screen ID:** `6228a7adc2a34c93aeb424734f539b05`
- **Device Type:** `DESKTOP` (2560x3760)
- **Folder:** [`07-unicart-checkout-payment-order-states/`](./07-unicart-checkout-payment-order-states/)
- **Files:**
  - Image: [`screen.png` (63.3 KB)](./07-unicart-checkout-payment-order-states/screen.png)
  - Code: [`screen.html` (70.4 KB)](./07-unicart-checkout-payment-order-states/screen.html)
  - Metadata: [`metadata.json`](./07-unicart-checkout-payment-order-states/metadata.json)
- **Original Prompt:**
> Create the comprehensive desktop Checkout & Payment experience for UniCart (Indian e-commerce platform with INR ₹ currency, Inter font, primary indigo #4F46E5, accent emerald #10B981, red #EF4444).

Design Requirements & Layout:
1. Top Step / Progress Stepper:
   - Step 1: Cart (Completed checkmark)
   - Step 2: Shipping & Delivery Address (Active step)
   - Step 3: Payment & Verification
   - Step 4: Order Confirmed
   - With an interactive State/Screen Switcher bar at the top or subheader allowing instant review of:
     [1. Address & Checkout], [2. Mock Payment Screen], [3. Order Success (Confirmed)], [4. Out-of-Stock Failure State]

2. Screen 1: Address & Checkout View:
   - Left Column (Main, 2/3 width):
     - Saved Shipping Addresses section (supporting up to 5 saved addresses cards with radio selection):
       - Address 1 (Default / Home): Rahul Sharma, Flat 402, Lotus Grandeur, Veera Desai Road, Andheri West, Mumbai, Maharashtra - 400053. Phone: +91 98765 43210. Tag: 'Home', 'Default'. Edit / Delete actions.
       - Address 2 (Work / Office): Rahul Sharma, Tech Park Tower B, 5th Floor, BKC, Bandra East, Mumbai, Maharashtra - 400051. Phone: +91 98765 43210. Tag: 'Office'.
       - Address 3: Sharma Residence, Sector 14, Navi Mumbai - 400703. Tag: 'Other'.
       - '+ Add New Address' action card / button that opens or toggles an accessible Add Address form:
         - Form fields with visible labels (no placeholder-only labels): Full Name, Mobile Number (+91 format), Address Line 1 (House No, Building, Street), Landmark (Optional), City, State dropdown (Maharashtra, Karnataka, Delhi, etc.), PIN Code (6 digits), Country (India fixed/selected), Address Type chips (Home / Work / Other), and 'Make this my default address' checkbox.
     - Delivery Speed / Shipping Options:
       - Express Delivery (Guaranteed Tomorrow by 11 AM - ₹49 or FREE with Prime/UniCart VIP)
       - Standard Delivery (2-3 Business Days - FREE)
     - Order Items Preview Collapsible summary (showing thumbnail previews of the 3 items: AcroSonic ANC Headphones, Smart Fitness Watch, ToughBraided Cable).
     - 'Continue to Payment' / 'Place Order' primary button:
       - Distinct normal state and interactive toggle showing the loading/disabled state ("Processing securely... Please do not refresh" with loading spinner and disabled styling to prevent double submit).

   - Right Column (Sticky Order Summary, 1/3 width):
     - Order Summary card:
       - Items Total (MRP): ₹13,997.00
       - Product Discount: -₹4,300.00
       - Delivery Fee: FREE (Promotional)
       - Packaging & Handling: FREE
       - Coupon Savings: -₹200.00 (UNICARTNEW applied)
       - Total Amount Payable: ₹9,497.00 (Inclusive of all taxes & GST)
       - Savings badge: "Yay! You are saving ₹4,500.00 on this order"
       - Trust badges: 100% Safe Payments (UPI, RuPay, NetBanking, Cards), 7-Day Easy Returns, Encrypted 256-bit SSL.

3. Screen 2: Mock Payment Screen:
   - Order total display: ₹9,497.00 with Order Reference #UC-849204
   - Payment method options tabs/cards:
     - UPI (Google Pay, PhonePe, Paytm, BHIM) - Enter UPI ID or Scan QR code
     - Credit / Debit Cards (RuPay, Visa, Mastercard)
     - Net Banking (HDFC, ICICI, SBI, Axis)
     - Cash on Delivery (COD) with verification OTP note
   - Primary action button: "Pay now (simulated) - ₹9,497.00" with security lock icon
   - Simulated double-submit protection with loading spinner state.

4. Screen 3: Order Success Screen:
   - Green emerald checkmark icon with celebration animation/illustration
   - Heading: "Order Placed Successfully!"
   - Order ID: #UC-98234710 with copy button
   - Confirmation email sent to rahul.sharma@example.com and SMS to +91 98765 43210
   - Estimated Delivery: Tomorrow, by 8:00 PM to Mumbai 400053
   - Order tracking timeline (Ordered -> Packed -> Shipped -> Out for Delivery -> Delivered)
   - Buttons: "Track Order" (primary indigo) and "Continue Shopping" (secondary outline)

5. Screen 4: Out-of-Stock Failure State:
   - High-contrast alert card with red error iconography:
     - "Unable to Complete Order: Item Out of Stock"
     - "While you were checking out, 'Smart Fitness Watch with 1.43\" AMOLED Display' ran out of stock at your nearest fulfillment center."
     - Actions: "Remove Out-of-Stock Item & Proceed with Remaining (₹3,099.00)" or "Save to Wishlist & Return to Cart"

Make all states seamlessly switchable or displayed in clear interactive tabs/sections for demonstration, adhering strictly to UniCart's design system tokens, typography, and crisp borders.

---
### 8. UniCart - My Orders & Order Details
- **Screen ID:** `4e9f0e7bcd9e49f3a34b9252f569b9b5`
- **Device Type:** `DESKTOP` (2560x3706)
- **Folder:** [`08-unicart-my-orders-order-details/`](./08-unicart-my-orders-order-details/)
- **Files:**
  - Image: [`screen.png` (64.2 KB)](./08-unicart-my-orders-order-details/screen.png)
  - Code: [`screen.html` (64.3 KB)](./08-unicart-my-orders-order-details/screen.html)
  - Metadata: [`metadata.json`](./08-unicart-my-orders-order-details/metadata.json)
- **Original Prompt:**
> Create the customer "My Orders" and "Order Detail" experience for UniCart, an Indian B2C e-commerce platform. Desktop 1440px layout using design system tokens.

Screen Title: UniCart - My Orders & Order Details

Key requirements and architecture:
1. Global Header: UniCart brand logo, search bar, Pincode indicator ('Deliver to Mumbai 400001'), Wishlist, Cart (with badge), and active account menu ('Namaste, Rahul N.'). Active navigation highlighting 'My Orders'.

2. Top interactive view switcher tab bar:
   - "Order History (All Orders)"
   - "Order Details: Pending Payment (#UC-89214)"
   - "Order Details: Delivered (#UC-74190)"
   - "Cancel Order Confirmation Dialog (Modal)"
   - "Empty Orders State"

3. Section A: "My Orders" List / Paginated Table:
   - Header with page title "My Orders", search bar to filter by Order ID or Product Name, and status filter pills: "All Orders (14)", "Pending Payment (1)", "In Transit / Shipped (2)", "Delivered (10)", "Cancelled (1)".
   - Time range filter dropdown ("Past 3 months", "2024", "2023").
   - Order list / card cards containing:
     * Header bar: Order Placed Date (e.g., "14 Oct 2024"), Total Amount in INR (e.g., "₹9,497.00"), Ship To ("Rahul Sharma"), and Order ID ("#UC-89214") with copy link and "View Order Details" CTA.
     * Status Badges adhering strictly to the specifications:
       - "Pending payment" = amber badge (#F59E0B / amber-500 bg-amber-50 text-amber-700 border-amber-200)
       - "Paid" = indigo badge (#4F46E5 / indigo-600 bg-indigo-50 text-indigo-700 border-indigo-200)
       - "Shipped" = blue badge (bg-blue-50 text-blue-700 border-blue-200)
       - "Delivered" = emerald badge (#10B981 / bg-emerald-50 text-emerald-700 border-emerald-200)
       - "Cancelled" = grey badge (bg-slate-100 text-slate-600 border-slate-300)
     * Body: Thumbnail preview of products, product titles, quantity, live snapshot price in INR.
     * Contextual CTA buttons:
       - For Pending payment: Primary "Pay Now (₹9,497.00)", Secondary "Cancel Order", "View Details".
       - For Delivered: "Track Package", "Buy It Again", "Download Invoice (PDF)", "Write Product Review".
       - For Shipped: "Track Live Shipment", "Need Help?".
     * Numbered pagination at the bottom: "Showing 1-4 of 14 orders", page numbers [1], [2], [3], Next, Prev.

4. Section B: "Order Detail" View (demonstrating both pending payment and delivered states):
   - Breadcrumbs: Home > My Account > My Orders > Order #UC-89214
   - Header: "Order Details — #UC-89214" with order date, invoice download button, and status badge.
   - Status Timeline / Stepper:
     * Ordered / Placed -> Payment Confirmation -> Processing / Packed -> Shipped (with courier tracking AWB BlueDart) -> Delivered.
     * When status is Pending payment: highlight "Awaiting Payment" state with warning: "Payment expires in 28:40 mins to avoid stock release".
   - Items list with snapshot prices:
     * High fidelity thumbnails, product title, seller name, snapshot unit price, quantity, total price.
   - Shipping Address card & Delivery Method (e.g. Flat 402, Lotus Grandeur, Andheri West, Mumbai 400053, Phone: +91 98765 43210).
   - Payment Information & Summary breakdown:
     * Items Subtotal (₹13,997.00), Discounts (-₹4,300.00), Delivery Fee (FREE), Coupon UNICARTNEW (-₹200.00), Total (₹9,497.00).
     * Payment method indicated (UPI Pending / Credit Card / NetBanking).
   - Action Bar:
     * When status is "Pending payment": show high-contrast "Pay Now (₹9,497.00)" button and secondary "Cancel Order" button.
     * When status is NOT pending payment (e.g. Delivered or Shipped): these two buttons are hidden, replaced by "Download Tax Invoice", "Return / Replace Item", "Track Delivery".

5. Cancel Order Modal Dialog Preview:
   - Accessible modal overlay for cancelling an order:
     * Title: "Cancel Order #UC-89214?"
     * Confirmation body: "Are you sure you want to cancel this order? Any applied discount coupons will be restored to your account."
     * Reason dropdown (e.g. "Ordered by mistake", "Found cheaper elsewhere", "Delayed shipping", "Change delivery address").
     * Actions: "Nevermind, Keep Order" (secondary) and "Confirm Cancellation" (destructive red button).

6. UniCart Trust Footer:
   - 100% Genuine Electronics, 7-Day Hassle-Free Returns, Bank-grade 256-bit SSL encryption, Indian payment rails (UPI, RuPay, NetBanking). Full multi-column directory footer.

---
### 9. UniCart - Profile & Account Settings
- **Screen ID:** `6c2e5dfead8443d88e3e89b112cf44e7`
- **Device Type:** `DESKTOP` (2560x4686)
- **Folder:** [`09-unicart-profile-account-settings/`](./09-unicart-profile-account-settings/)
- **Files:**
  - Image: [`screen.png` (47.1 KB)](./09-unicart-profile-account-settings/screen.png)
  - Code: [`screen.html` (48.2 KB)](./09-unicart-profile-account-settings/screen.html)
  - Metadata: [`metadata.json`](./09-unicart-profile-account-settings/metadata.json)
- **Original Prompt:**
> Design a comprehensive, responsive desktop Profile and Account Settings page for "UniCart", an Indian B2C e-commerce platform, using the Clear Commerce design system and adhering to established UniCart styling.

Header & Navigation:
- UniCart desktop navbar (UniCart logo with purple/indigo brand color, search bar with category dropdown, "Deliver to Mumbai 400001", Wishlist, Cart with count badge '2', and user profile menu 'Namaste, Rahul Sharma').
- Breadcrumbs: Home > My Account > Profile & Settings.
- Account sub-navigation or tabbed sidebar / tabs: "Personal Information & Security" (active), "My Orders", "Saved Addresses", "Payment Methods & UPI", "Notification Preferences".

Main Content Sections:
1. Profile Header / Overview Banner:
   - User avatar (monogram 'RS' with subtle indigo background or photo), user name "Rahul Sharma", member badge ("UniCart Plus Member" with gold/amber icon), joined date "Member since Nov 2022", quick stats (14 Orders, 3 Saved Addresses, ₹1,200 UniCart Wallet/Cashback balance).

2. Personal Information Card:
   - Editable Name field with clear "Edit" / "Save" toggle action, inline validation indicator, and helper text. Current value: "Rahul Sharma".
   - Read-only Email Address field: "rahul.sharma@example.in", clearly styled as disabled/read-only with a lock icon and tooltip/note: "Email address cannot be changed directly for account security. Contact support to update."
   - Phone Number field: "+91 98765 43210" with a verified badge (emerald checkmark "Verified via OTP").
   - Action row: "Save Changes" primary button (disabled until edited) and "Cancel".

3. Saved Addresses Management Section:
   - Section header: "Saved Delivery Addresses" with count badge "3 of 5 saved" and a prominent secondary "+ Add New Address" button.
   - Cards list of saved addresses (max 5 capacity shown):
     * Address 1 (Default): "Rahul Sharma", Tag: "Home • Default" (indigo badge), "Flat 402, Lotus Grandeur, Veera Desai Road, Andheri West, Mumbai, Maharashtra - 400053", Mobile: "+91 98765 43210", actions: "Edit", "Delete" (disabled or with confirm), "Default Set".
     * Address 2: "Rahul Sharma", Tag: "Office" (slate badge), "Tech Park Tower B, 5th Floor, BKC, Bandra East, Mumbai, Maharashtra - 400051", Mobile: "+91 98765 43210", Delivery by 6:00 PM note, actions: "Set as Default", "Edit", "Delete".
     * Address 3: "Sharma Residence", Tag: "Other" (slate badge), "Plot 88, Sector 14, Palm Beach Road, Navi Mumbai, Maharashtra - 400703", Mobile: "+91 98200 11223", actions: "Set as Default", "Edit", "Delete".
   - Add/Edit Address Modal or slide-out inline preview form card (showing Full Name, 10-digit Mobile, Pincode with Auto City/State lookup, Flat/House/Building, Area/Street, Landmark, Address Type radio: Home/Office/Other, and "Set as default" checkbox).

4. Security & Active Sessions Section:
   - Card titled "Security & Session Management".
   - Recent login sessions overview: "Chrome on macOS • Mumbai, India (Current device - Active now)", "UniCart Mobile App • Android • Mumbai, India (Active 2 hours ago)".
   - Danger zone / Security action: A prominent red/destructive styled button or action tile for "Log out of all devices" with subtext "This will sign you out of UniCart on all browsers and mobile apps except this one (or including all sessions). You will need to log in again with your password or OTP."
   - Confirmation Dialog Modal (previewed or interactive modal card overlay):
     * Title: "Log out of all devices?"
     * Warning icon with amber/red badge.
     * Explanation: "Are you sure you want to sign out from all 3 active sessions across desktop and mobile devices? You will need to sign in again with your credentials."
     * Action buttons: "Log Out Everywhere" (destructive red button) and "Cancel" (neutral outline button).

5. Footer:
   - Consistent UniCart multi-column footer with Indian payment assurances (UPI, RuPay, NetBanking, 256-bit SSL), copyright, and policy links.

Design System Continuity:
- Theme colors: Indigo primary (#4f46e5), surface (#faf8ff), surface containers, emerald success (#10b981), amber warnings, and slate outlines.
- Clean typography, high contrast, accessible labels, rounded-lg styling consistent with SCREEN_2, SCREEN_4, SCREEN_5, SCREEN_6, SCREEN_7, and SCREEN_8.

---
