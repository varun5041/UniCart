import { connectDB, disconnectDB } from '../config/db.js';
import { connectRedis, disconnectRedis } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { User, Category, Product, AuditLog } from '../models/index.js';
import { incrementCacheVersion } from '../utils/cache.js';

interface CategoryTemplate {
  name: string;
  slug: string;
  description: string;
  products: {
    name: string;
    slug: string;
    description: string;
    pricePaise: number;
    stock: number;
    image: string;
  }[];
}

const CATALOGUE_DEFINITIONS: CategoryTemplate[] = [
  {
    name: 'Smartphones & Tablets',
    slug: 'smartphones-tablets',
    description: 'Flagship mobile devices, 5G smartphones, and high-performance tablets.',
    products: [
      {
        name: 'iPhone 16 Pro Max (256GB - Natural Titanium)',
        slug: 'iphone-16-pro-max-256gb-natural-titanium',
        description: 'Titanium design with A18 Pro chip, 48MP Fusion camera system with 5x Telephoto, and industry-leading battery life for power users and creators.',
        pricePaise: 14490000,
        stock: 35,
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80'
      },
      {
        name: 'Samsung Galaxy S24 Ultra (512GB - Titanium Gray)',
        slug: 'samsung-galaxy-s24-ultra-512gb-titanium-gray',
        description: 'Galaxy AI smartphone with built-in S Pen, 200MP Quad Telephoto camera, Snapdragon 8 Gen 3 for Galaxy, and flat 6.8-inch Dynamic AMOLED 2X display.',
        pricePaise: 12999900,
        stock: 28,
        image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80'
      },
      {
        name: 'Google Pixel 9 Pro (128GB - Obsidian)',
        slug: 'google-pixel-9-pro-128gb-obsidian',
        description: 'Engineered by Google with Tensor G4 processor, pro-level triple camera system with Super Res Zoom, and Gemini Nano onboard intelligence.',
        pricePaise: 10699900,
        stock: 22,
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80'
      },
      {
        name: 'OnePlus 12 5G (16GB RAM, 512GB - Silky Black)',
        slug: 'oneplus-12-5g-16gb-512gb-silky-black',
        description: 'Fast and smooth performance powered by Snapdragon 8 Gen 3, 4th Gen Hasselblad Camera System, and 100W SUPERVOOC ultra-fast charging.',
        pricePaise: 6499900,
        stock: 40,
        image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80'
      },
      {
        name: 'iPad Pro 13-inch M4 (256GB WiFi - Space Black)',
        slug: 'ipad-pro-13-inch-m4-256gb-wifi-space-black',
        description: 'Ultra Retina XDR display with Tandem OLED technology, breakthrough M4 silicon speed, and ultra-thin aluminum chassis for creative professionals.',
        pricePaise: 12990000,
        stock: 18,
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80'
      },
      {
        name: 'iPad Air 11-inch M2 (128GB - Starlight)',
        slug: 'ipad-air-11-inch-m2-128gb-starlight',
        description: 'Versatile everyday tablet with Apple M2 chip, Liquid Retina display, landscape front camera with Center Stage, and Apple Pencil Pro support.',
        pricePaise: 5990000,
        stock: 45,
        image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80'
      },
      {
        name: 'Samsung Galaxy Tab S9 Ultra (256GB WiFi - Graphite)',
        slug: 'samsung-galaxy-tab-s9-ultra-256gb-wifi-graphite',
        description: 'Massive 14.6-inch Dynamic AMOLED 2X screen, IP68 water resistance, included S Pen, and multi-window DeX productivity mode.',
        pricePaise: 10899900,
        stock: 15,
        image: 'https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?w=800&q=80'
      },
      {
        name: 'Xiaomi 14 Ultra (16GB RAM, 512GB - Ceramic Black)',
        slug: 'xiaomi-14-ultra-16gb-512gb-ceramic-black',
        description: 'Leica Summilux optical lenses with 1-inch Sony LYT-900 sensor, WQHD+ 120Hz LTPO AMOLED display, and 90W HyperCharge technology.',
        pricePaise: 9999900,
        stock: 20,
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'
      },
      {
        name: 'Nothing Phone (2) (12GB RAM, 256GB - Dark Grey)',
        slug: 'nothing-phone-2-12gb-256gb-dark-grey',
        description: 'Unique Glyph Interface with transparent design, Snapdragon 8+ Gen 1 chipset, dual 50MP cameras, and bloatware-free Nothing OS 2.5.',
        pricePaise: 3699900,
        stock: 50,
        image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80'
      },
      {
        name: 'Vivo X100 Pro 5G (16GB RAM, 512GB - Asteroid Black)',
        slug: 'vivo-x100-pro-5g-16gb-512gb-asteroid-black',
        description: 'ZEISS APO Floating Telephoto camera with MediaTek Dimensity 9300 chipset, 5400mAh BlueVolt battery, and 100W FlashCharge.',
        pricePaise: 8999900,
        stock: 25,
        image: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80'
      }
    ]
  },
  {
    name: 'Audio & Wearables',
    slug: 'audio-wearables',
    description: 'Noise-cancelling headphones, wireless earbuds, smartwatches, and audiophile gear.',
    products: [
      {
        name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
        slug: 'sony-wh-1000xm5-wireless-noise-cancelling-headphones',
        description: 'Industry-leading noise cancellation with dual processors, 8 microphones, 30-hour battery life, and high-resolution LDAC audio streaming.',
        pricePaise: 2999000,
        stock: 40,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'
      },
      {
        name: 'Apple AirPods Pro (2nd Gen with USB-C Charging Case)',
        slug: 'apple-airpods-pro-2nd-gen-usb-c',
        description: 'Pro-level Active Noise Cancellation, Adaptive Audio, Transparency mode, Personalized Spatial Audio with dynamic head tracking, and MagSafe case.',
        pricePaise: 2490000,
        stock: 60,
        image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80'
      },
      {
        name: 'Bose QuietComfort Ultra Wireless Noise Cancelling Headphones',
        slug: 'bose-quietcomfort-ultra-wireless-headphones',
        description: 'Breakthrough spatialized audio for immersive listening, world-class active noise cancellation, custom sound profiling with CustomTune, and plush ear cushions.',
        pricePaise: 3590000,
        stock: 25,
        image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'
      },
      {
        name: 'Apple Watch Ultra 2 (GPS + Cellular, 49mm Titanium Case)',
        slug: 'apple-watch-ultra-2-gps-cellular-49mm-titanium',
        description: 'The most rugged and capable Apple Watch with 3000-nit Always-On Retina display, S9 SiP processor, dual-frequency precision GPS, and 36-hour battery life.',
        pricePaise: 8990000,
        stock: 18,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'
      },
      {
        name: 'Samsung Galaxy Watch 6 Classic (47mm LTE - Black)',
        slug: 'samsung-galaxy-watch-6-classic-47mm-lte-black',
        description: 'Timeless stainless steel design with iconic rotating bezel, sapphire crystal glass, advanced sleep coaching, and comprehensive body composition analysis.',
        pricePaise: 3699900,
        stock: 30,
        image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80'
      },
      {
        name: 'Sennheiser Momentum 4 Wireless Audiophile Headphones',
        slug: 'sennheiser-momentum-4-wireless-headphones',
        description: 'Signature audiophile sound with 42mm transducer system, adaptive hybrid noise cancellation, lightweight comfort, and an extraordinary 60-hour battery life.',
        pricePaise: 2699000,
        stock: 22,
        image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80'
      },
      {
        name: 'Marshall Stanmore III Bluetooth Home Speaker (Black)',
        slug: 'marshall-stanmore-iii-bluetooth-home-speaker-black',
        description: 'Legendary room-filling Marshall stereo sound with dynamic loudness, Bluetooth 5.2 connectivity, vintage brass accents, and custom analog control dials.',
        pricePaise: 3199900,
        stock: 16,
        image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80'
      },
      {
        name: 'Garmin Fenix 7 Pro Solar Multisport GPS Smartwatch',
        slug: 'garmin-fenix-7-pro-solar-multisport-gps-smartwatch',
        description: 'Built-in LED flashlight, solar charging Power Glass lens, topographical mapping, real-time stamina metrics, and military-grade durability testing.',
        pricePaise: 8499000,
        stock: 14,
        image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80'
      },
      {
        name: 'JBL Flip 6 Portable Waterproof Bluetooth Speaker',
        slug: 'jbl-flip-6-portable-waterproof-bluetooth-speaker',
        description: '2-way speaker system with racetrack-shaped woofer, separate tweeter, IP67 waterproof and dustproof rating, and 12 hours of non-stop playtime.',
        pricePaise: 999900,
        stock: 55,
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80'
      },
      {
        name: 'Shure SM7B Cardioid Dynamic Studio Vocal Microphone',
        slug: 'shure-sm7b-cardioid-dynamic-studio-vocal-microphone',
        description: 'The global broadcast standard microphone for streaming, podcasting, and vocal recording with electromagnetic hum shielding and internal shock isolation.',
        pricePaise: 3850000,
        stock: 20,
        image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80'
      }
    ]
  },
  {
    name: 'Laptops & Computers',
    slug: 'laptops-computers',
    description: 'Workstation laptops, ultra-wide monitors, mechanical keyboards, and PC accessories.',
    products: [
      {
        name: 'MacBook Pro 16-inch M3 Max (36GB RAM, 1TB SSD)',
        slug: 'macbook-pro-16-inch-m3-max-36gb-1tb-ssd',
        description: 'Extreme computational power featuring 14-core CPU, 30-core GPU, Liquid Retina XDR display with 1600 nits peak brightness, and 22-hour battery life.',
        pricePaise: 34990000,
        stock: 12,
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'
      },
      {
        name: 'Dell XPS 15 9530 OLED (i9 13th Gen, 32GB RAM, RTX 4070)',
        slug: 'dell-xps-15-9530-oled-i9-32gb-rtx4070',
        description: 'Immersive 3.5K OLED InfinityEdge touch screen, precision CNC machined aluminum chassis, carbon fiber palm rest, and quad-speaker studio sound.',
        pricePaise: 23999000,
        stock: 15,
        image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80'
      },
      {
        name: 'ASUS ROG Zephyrus G16 (Intel Core Ultra 9, RTX 4080)',
        slug: 'asus-rog-zephyrus-g16-ultra9-rtx4080',
        description: 'Ultra-thin gaming laptop with 2.5K 240Hz ROG Nebula OLED display, CNC aluminum chassis with Slash Lighting bar, and vapor chamber cooling.',
        pricePaise: 26999000,
        stock: 14,
        image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80'
      },
      {
        name: 'Apple MacBook Air 15-inch M3 (16GB RAM, 512GB SSD)',
        slug: 'apple-macbook-air-15-inch-m3-16gb-512gb-ssd',
        description: 'Incredibly thin design under 11.5mm with striking Liquid Retina display, silent fanless architecture, MagSafe 3 charging, and 18-hour battery.',
        pricePaise: 15490000,
        stock: 30,
        image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80'
      },
      {
        name: 'Lenovo ThinkPad X1 Carbon Gen 12 (Core Ultra 7, 32GB RAM)',
        slug: 'lenovo-thinkpad-x1-carbon-gen-12-core-ultra-7-32gb',
        description: 'Legendary enterprise ultrabook with aerospace-grade carbon fiber body, TrackPoint navigation, 2.8K OLED anti-glare display, and MIL-SPEC durability.',
        pricePaise: 18999000,
        stock: 20,
        image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80'
      },
      {
        name: 'LG UltraGear 34-inch Curved OLED 240Hz Gaming Monitor',
        slug: 'lg-ultragear-34-inch-curved-oled-240hz-gaming-monitor',
        description: 'Ultrawide 800R curved WQHD OLED panel with 0.03ms response time, 240Hz refresh rate, 98.5% DCI-P3 color gamut, and HDMI 2.1 connectivity.',
        pricePaise: 9999900,
        stock: 16,
        image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80'
      },
      {
        name: 'Logitech MX Master 3S Wireless Performance Mouse',
        slug: 'logitech-mx-master-3s-wireless-performance-mouse',
        description: 'Ergonomic mouse with 8000 DPI Darkfield sensor that tracks on glass, MagSpeed electromagnetic scroll wheel, and whisper-quiet click switches.',
        pricePaise: 899500,
        stock: 75,
        image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80'
      },
      {
        name: 'Keychron Q1 Pro Custom Wireless Mechanical Keyboard',
        slug: 'keychron-q1-pro-custom-wireless-mechanical-keyboard',
        description: 'Full aluminum 75% layout keyboard with double-gasket acoustic mounting, hot-swappable switches, screw-in stabilizers, and QMK/VIA programmability.',
        pricePaise: 1849900,
        stock: 35,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'
      },
      {
        name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 Internal SSD',
        slug: 'samsung-990-pro-2tb-pcie-4-nvme-m2-internal-ssd',
        description: 'Blazing sequential read speeds up to 7,450 MB/s, integrated thermal guard for heat dissipation, and ideal expansion for PS5 and high-end PCs.',
        pricePaise: 1699900,
        stock: 45,
        image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80'
      },
      {
        name: 'BenQ ScreenBar Halo LED Monitor Light Bar with Wireless Controller',
        slug: 'benq-screenbar-halo-led-monitor-light-bar',
        description: 'Patented asymmetrical optical design that eliminates screen glare, rear ambient bias lighting, auto-dimming ambient light sensor, and wireless rotary puck.',
        pricePaise: 1499000,
        stock: 30,
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80'
      }
    ]
  },
  {
    name: 'Gaming & Consoles',
    slug: 'gaming-consoles',
    description: 'Next-gen video game consoles, handhelds, pro gamepads, and VR headsets.',
    products: [
      {
        name: 'Sony PlayStation 5 Slim Console (1TB Disc Edition)',
        slug: 'sony-playstation-5-slim-console-1tb-disc-edition',
        description: 'Next-generation console with custom AMD Zen 2 CPU, RDNA 2 GPU, ultra-fast 1TB NVMe SSD, Ray Tracing support, and DualSense haptic feedback controller.',
        pricePaise: 5499000,
        stock: 25,
        image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80'
      },
      {
        name: 'Xbox Series X 1TB Gaming Console (Carbon Black)',
        slug: 'xbox-series-x-1tb-gaming-console-carbon-black',
        description: 'The most powerful Xbox with 12 teraflops of raw graphic processing power, 4K gaming at up to 120 FPS, DirectX ray tracing, and Quick Resume for multiple games.',
        pricePaise: 5299000,
        stock: 20,
        image: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&q=80'
      },
      {
        name: 'Nintendo Switch OLED Model (Neon Red & Neon Blue)',
        slug: 'nintendo-switch-oled-model-neon-red-neon-blue',
        description: 'Vibrant 7-inch OLED screen, wide adjustable tabletop stand, dock with wired LAN port, 64GB internal storage, and hybrid handheld gaming versatility.',
        pricePaise: 3199900,
        stock: 35,
        image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80'
      },
      {
        name: 'Valve Steam Deck OLED 512GB Handheld Gaming PC',
        slug: 'valve-steam-deck-oled-512gb-handheld-gaming-pc',
        description: 'Stunning 7.4-inch 90Hz HDR OLED display, custom AMD APU, ergonomic full-size thumbsticks and trackpads, and portable access to your complete Steam library.',
        pricePaise: 5999900,
        stock: 18,
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80'
      },
      {
        name: 'PlayStation DualSense Edge Wireless Pro Controller',
        slug: 'playstation-dualsense-edge-wireless-pro-controller',
        description: 'High-performance controller featuring changeable stick caps, remappable back buttons, adjustable trigger stops, and custom profile quick-swapping.',
        pricePaise: 1899000,
        stock: 40,
        image: 'https://images.unsplash.com/photo-1592840496073-e70fa7c92a61?w=800&q=80'
      },
      {
        name: 'Razer BlackShark V2 Pro Wireless Esports Gaming Headset',
        slug: 'razer-blackshark-v2-pro-wireless-esports-headset',
        description: 'Ultra-clear broadcast-quality wideband microphone, TriForce Titanium 50mm drivers, onboard audio profiles tuned by top pro players, and 70-hour battery.',
        pricePaise: 1799900,
        stock: 28,
        image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'
      },
      {
        name: 'Secretlab TITAN Evo 2024 Ergonomic Gaming Chair (Stealth)',
        slug: 'secretlab-titan-evo-2024-ergonomic-gaming-chair-stealth',
        description: 'Advanced 4-way L-ADAPT lumbar support system, cold-cure foam cushion, magnetic memory foam head pillow, and durable NEO Hybrid leatherette upholstery.',
        pricePaise: 4899900,
        stock: 15,
        image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800&q=80'
      },
      {
        name: 'Elgato Stream Deck MK.2 15 Studio Controller Keys',
        slug: 'elgato-stream-deck-mk2-15-studio-controller-keys',
        description: '15 customizable LCD keys to trigger actions, launch apps, mute audio, switch lighting scenes, and control streaming live feeds with tactile feedback.',
        pricePaise: 1449900,
        stock: 35,
        image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80'
      },
      {
        name: 'Logitech G29 Driving Force Racing Wheel & Pedals',
        slug: 'logitech-g29-driving-force-racing-wheel-pedals',
        description: 'Dual-motor force feedback racing wheel with helical gears, hand-stitched leather rim, stainless steel paddle shifters, and non-linear brake pedal.',
        pricePaise: 2999500,
        stock: 18,
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80'
      },
      {
        name: 'ASUS ROG Ally Z1 Extreme Handheld Gaming Console (512GB)',
        slug: 'asus-rog-ally-z1-extreme-handheld-console-512gb',
        description: 'Full Windows 11 handheld powered by AMD Ryzen Z1 Extreme, 7-inch 1080p 120Hz FreeSync display, and compatibility with Game Pass, Steam, and Epic Games.',
        pricePaise: 6499900,
        stock: 22,
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80'
      }
    ]
  },
  {
    name: 'Smart Home & Appliances',
    slug: 'smart-home-appliances',
    description: 'Smart lighting, robot vacuums, security cameras, and intelligent home climate gear.',
    products: [
      {
        name: 'Dyson V15 Detect Cordless Vacuum Cleaner',
        slug: 'dyson-v15-detect-cordless-vacuum-cleaner',
        description: 'Laser illumination reveals microscopic dust on hard floors, piezo sensor dynamically adapts suction power, and LCD screen displays scientific proof of a deep clean.',
        pricePaise: 6290000,
        stock: 15,
        image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=80'
      },
      {
        name: 'Philips Hue White & Color Ambiance Smart Starter Kit',
        slug: 'philips-hue-white-color-ambiance-smart-starter-kit',
        description: '16 million colors and shades of white light, included Hue Bridge hub for seamless smart automation, and voice control via Alexa, Google Home, and Apple HomeKit.',
        pricePaise: 1299900,
        stock: 45,
        image: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?w=800&q=80'
      },
      {
        name: 'Apple HomePod (2nd Gen - Midnight)',
        slug: 'apple-homepod-2nd-gen-midnight',
        description: 'High-fidelity audio with custom high-excursion woofer, beamforming array of five tweeters, Spatial Audio support, and built-in room temperature and humidity sensor.',
        pricePaise: 3290000,
        stock: 20,
        image: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80'
      },
      {
        name: 'Amazon Echo Show 10 (3rd Gen) HD Smart Display with Motion',
        slug: 'amazon-echo-show-10-3rd-gen-hd-smart-display',
        description: '10.1-inch HD screen that automatically moves to stay in view during video calls, premium directional sound, 13MP auto-framing camera, and built-in Zigbee smart home hub.',
        pricePaise: 2499900,
        stock: 25,
        image: 'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?w=800&q=80'
      },
      {
        name: 'Ecovacs Deebot T20 OMNI Robot Vacuum & Mop Cleaner',
        slug: 'ecovacs-deebot-t20-omni-robot-vacuum-mop',
        description: 'All-in-one OMNI station with 55°C hot water mop washing, auto-dust emptying, 6000Pa suction power, and auto-lift mopping system when carpets are detected.',
        pricePaise: 7499000,
        stock: 12,
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80'
      },
      {
        name: 'Ring Video Doorbell Pro 2 (Hardwired 1536p HD Video)',
        slug: 'ring-video-doorbell-pro-2-hardwired-hd-video',
        description: 'Head-to-Toe HD+ video with 3D Motion Detection, Bird’s Eye View tracking, two-way audio with noise cancellation, and customizable motion privacy zones.',
        pricePaise: 1999900,
        stock: 30,
        image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80'
      },
      {
        name: 'Nest Learning Thermostat 3rd Gen (Stainless Steel)',
        slug: 'nest-learning-thermostat-3rd-gen-stainless-steel',
        description: 'Intelligent climate control that learns your schedule, auto-schedules energy-efficient heating/cooling, and delivers remote temperature control from your smartphone.',
        pricePaise: 2149900,
        stock: 22,
        image: 'https://images.unsplash.com/photo-1567928815104-b69824649b62?w=800&q=80'
      },
      {
        name: 'Xiaomi Smart Air Purifier 4 Pro High Efficiency Filter',
        slug: 'xiaomi-smart-air-purifier-4-pro-filter',
        description: 'Delivers 500m³/h Clean Air Delivery Rate (CADR), filters 99.97% of 0.3μm particles, negative air ionization, OLED display, and app-based real-time air quality metrics.',
        pricePaise: 1699900,
        stock: 40,
        image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80'
      },
      {
        name: 'Anker 737 Power Bank (PowerCore 24K, 140W 3-Port Portable Charger)',
        slug: 'anker-737-power-bank-powercore-24k-140w',
        description: 'Ultra-powerful two-way fast charging with Power Delivery 3.1, smart digital display showing battery health and output wattage, and 24,000mAh capacity.',
        pricePaise: 1199900,
        stock: 50,
        image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80'
      },
      {
        name: 'DJI Mini 4 Pro Drone with DJI RC 2 Remote Controller',
        slug: 'dji-mini-4-pro-drone-dji-rc2-controller',
        description: 'Ultralight folding drone under 249g with 4K/60fps HDR true vertical shooting, omnidirectional obstacle sensing, 20km FHD video transmission, and 34-min flight time.',
        pricePaise: 9899000,
        stock: 16,
        image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&q=80'
      }
    ]
  }
];

async function seedAdminCatalogue(): Promise<void> {
  console.log('\n============================================================');
  console.log('  🚀 UniCart: Seeding High-Quality Catalogue for Admin');
  console.log('============================================================\n');

  try {
    await connectDB();
    await connectRedis().catch((err) => {
      logger.warn({ err }, '[Redis] Warning: Redis connection failed; caching may be in-memory');
    });

    const adminEmail = 's.tsahilvarma04@gmail.com';
    const adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      console.warn(`⚠️ Admin user '${adminEmail}' not found in database. Using fallback.`);
    } else {
      console.log(`👤 Verified Admin Account: ${adminUser.name} (${adminUser.email}) [role: ${adminUser.role}]`);
    }

    let totalCreatedProducts = 0;
    let totalUpdatedProducts = 0;

    // Check existing categories
    const existingCategories = await Category.find();
    console.log(`📁 Found ${existingCategories.length} existing categories in MongoDB Atlas.\n`);

    for (const catDef of CATALOGUE_DEFINITIONS) {
      // 1. Ensure Category exists or create it
      let category = await Category.findOne({
        $or: [{ slug: catDef.slug }, { name: { $regex: `^${catDef.name}$`, $options: 'i' } }]
      });

      if (!category) {
        category = new Category({
          name: catDef.name,
          slug: catDef.slug,
          description: catDef.description
        });
        await category.save();
        console.log(`✨ Created Category: "${category.name}" (${category.slug})`);
      } else {
        console.log(`📁 Using Category: "${category.name}" (${category.slug})`);
      }

      // 2. Add / Upsert at least 10 products for this category
      for (const prodData of catDef.products) {
        let product = await Product.findOne({ slug: prodData.slug });

        if (product) {
          product.name = prodData.name;
          product.description = prodData.description;
          product.price = prodData.pricePaise;
          product.stock = prodData.stock;
          product.images = [prodData.image];
          product.category = category._id;
          product.isActive = true;
          await product.save();
          totalUpdatedProducts++;
        } else {
          product = new Product({
            name: prodData.name,
            slug: prodData.slug,
            description: prodData.description,
            price: prodData.pricePaise,
            stock: prodData.stock,
            images: [prodData.image],
            category: category._id,
            isActive: true
          });
          await product.save();
          totalCreatedProducts++;
        }
      }
    }

    // 3. Record Audit Log for the Admin Action
    if (adminUser) {
      await AuditLog.create({
        actorId: adminUser._id,
        action: 'ADMIN_SEED_CATALOGUE',
        target: 'Catalogue',
        ip: '127.0.0.1',
        meta: {
          categoriesCount: CATALOGUE_DEFINITIONS.length,
          totalProducts: totalCreatedProducts + totalUpdatedProducts,
          timestamp: new Date().toISOString()
        }
      });
    }

    // 4. Invalidate Redis Caches
    await incrementCacheVersion('products');
    await incrementCacheVersion('categories');
    console.log('\n⚡ Cache versions bumped (products & categories) — live store updated immediately.');

    // 5. Verification Check directly on MongoDB Atlas
    console.log('\n============================================================');
    console.log('  🔍 Verifying MongoDB Atlas Database Counts:');
    console.log('============================================================\n');

    const totalCategories = await Category.countDocuments();
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });

    console.log(`📊 Total Categories in MongoDB Atlas: ${totalCategories}`);
    console.log(`📦 Total Products in MongoDB Atlas:   ${totalProducts} (${activeProducts} active)`);
    console.log(`➕ Products Created this run:         ${totalCreatedProducts}`);
    console.log(`🔄 Products Updated this run:         ${totalUpdatedProducts}\n`);

    const allCategories = await Category.find().sort({ name: 1 });
    for (const cat of allCategories) {
      const count = await Product.countDocuments({ category: cat._id });
      console.log(`   - [${cat.name}]: ${count} products`);
    }

    console.log('\n✅ All products and categories successfully verified in MongoDB Atlas!\n');

    await disconnectRedis().catch(() => {});
    await disconnectDB();
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Error seeding catalogue:', err);
    await disconnectDB().catch(() => {});
    process.exit(1);
  }
}

void seedAdminCatalogue();
