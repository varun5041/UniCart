export interface DefaultCategoryDef {
  name: string;
  slug: string;
  description: string;
  image: string;
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const DEFAULT_CATEGORIES: DefaultCategoryDef[] = [
  {
    name: 'Fashion',
    slug: 'fashion',
    description: 'Trending streetwear, formal wear, footwear, and accessories for all seasons.',
    image: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <path d="M22 12C26 16 38 16 42 12L52 18L47 28L42 26V52H22V26L17 28L12 18L22 12Z" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M22 46H42V52H22V46Z" fill="#FACC15" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
      </svg>
    `)
  },
  {
    name: 'Mobiles',
    slug: 'mobiles',
    description: 'Next-gen 5G smartphones, power accessories, protective cases, and gadgets.',
    image: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <rect x="20" y="8" width="24" height="48" rx="5" stroke="#1E293B" stroke-width="2.5"/>
        <path d="M29 14H35" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M20 46H44V51C44 53.76 41.76 56 39 56H25C22.24 56 20 53.76 20 51V46Z" fill="#FACC15" stroke="#1E293B" stroke-width="2.5"/>
        <circle cx="32" cy="51" r="2" fill="#1E293B"/>
      </svg>
    `)
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'High performance laptops, tablets, smart wearables, monitors, and audio gear.',
    image: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <rect x="15" y="14" width="34" height="24" rx="3" stroke="#1E293B" stroke-width="2.5"/>
        <path d="M10 42H54C54 44.5 52 48 49 48H15C12 48 10 44.5 10 42Z" fill="#FACC15" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M28 42H36" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `)
  },
  {
    name: 'Beauty',
    slug: 'beauty',
    description: 'Skincare, premium cosmetics, fragrances, luxury personal care, and grooming.',
    image: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <rect x="24" y="32" width="16" height="24" rx="3" stroke="#1E293B" stroke-width="2.5"/>
        <rect x="27" y="24" width="10" height="8" stroke="#1E293B" stroke-width="2.5"/>
        <path d="M27 24L37 18V12C37 10 35 9 32 9C29 9 27 10 27 12V24Z" fill="#FACC15" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
        <line x1="24" y1="42" x2="40" y2="42" stroke="#1E293B" stroke-width="2.5"/>
      </svg>
    `)
  },
  {
    name: 'Home',
    slug: 'home',
    description: 'Modern table lamps, interior decor, smart lighting, and kitchen utensils.',
    image: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <path d="M24 10H40L44 26H20L24 10Z" fill="#FACC15" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M32 26V52" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M22 52H42" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    `)
  },
  {
    name: 'Appliances',
    slug: 'appliances',
    description: 'Smart televisions, refrigerators, washing machines, microwaves, and home cooling.',
    image: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <rect x="12" y="14" width="40" height="28" rx="2" stroke="#1E293B" stroke-width="2.5"/>
        <path d="M12 36H52V40C52 41.1 51.1 42 50 42H14C12.9 42 12 41.1 12 40V36Z" fill="#FACC15" stroke="#1E293B" stroke-width="2.5"/>
        <path d="M26 48L22 54M38 48L42 54" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    `)
  },
  {
    name: 'Toys & Baby',
    slug: 'toys-baby',
    description: 'Plush toys, brain teasers, puzzles, infant care products, and children games.',
    image: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <circle cx="21" cy="18" r="5" stroke="#1E293B" stroke-width="2.5"/>
        <circle cx="43" cy="18" r="5" stroke="#1E293B" stroke-width="2.5"/>
        <circle cx="32" cy="24" r="11" stroke="#1E293B" stroke-width="2.5"/>
        <ellipse cx="32" cy="42" rx="14" ry="12" stroke="#1E293B" stroke-width="2.5"/>
        <circle cx="32" cy="42" r="6" fill="#FACC15" stroke="#1E293B" stroke-width="2"/>
        <circle cx="29" cy="22" r="1.5" fill="#1E293B"/>
        <circle cx="35" cy="22" r="1.5" fill="#1E293B"/>
      </svg>
    `)
  },
  {
    name: 'Food & Health',
    slug: 'food-health',
    description: 'Health supplements, protein shakes, vitamins, organic snacks, and wellness items.',
    image: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <rect x="25" y="10" width="14" height="6" rx="2" stroke="#1E293B" stroke-width="2.5"/>
        <rect x="20" y="16" width="24" height="38" rx="6" stroke="#1E293B" stroke-width="2.5"/>
        <rect x="20" y="26" width="24" height="16" fill="#FACC15" stroke="#1E293B" stroke-width="2.5"/>
      </svg>
    `)
  },
  {
    name: 'Auto Accessories',
    slug: 'auto-accessories',
    description: 'Motorcycle helmets, riding jackets, vehicle detailing tools, and car electronics.',
    image: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <path d="M16 34C16 21 24 12 36 12C46 12 50 19 50 30C50 36 49 46 45 48C40 50 24 50 18 44C16 41 16 37 16 34Z" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M34 24H48C48 24 49 34 46 38H34L34 24Z" fill="#FACC15" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
      </svg>
    `)
  },
  {
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    description: 'Cricket kits, athletic equipment, fitness gear, gym dumbbells, and workout mats.',
    image: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <path d="M46 10L50 14L45 19L41 15L46 10Z" stroke="#1E293B" stroke-width="2.5"/>
        <path d="M41 15L45 19L33 46C31 49 28 50 25 47L22 44C19 41 20 38 23 36L41 15Z" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="21" cy="48" r="6" fill="#FACC15" stroke="#1E293B" stroke-width="2.5"/>
      </svg>
    `)
  },
  {
    name: 'Furniture',
    slug: 'furniture',
    description: 'Ergonomic office chairs, luxury recliners, sofas, work desks, and study tables.',
    image: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <path d="M20 20C20 16 24 14 32 14C40 14 44 16 44 20V32H20V20Z" stroke="#1E293B" stroke-width="2.5"/>
        <rect x="14" y="28" width="8" height="16" rx="3" stroke="#1E293B" stroke-width="2.5"/>
        <rect x="42" y="28" width="8" height="16" rx="3" stroke="#1E293B" stroke-width="2.5"/>
        <rect x="20" y="32" width="24" height="12" rx="3" fill="#FACC15" stroke="#1E293B" stroke-width="2.5"/>
        <path d="M19 44L16 52M45 44L48 52" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    `)
  },
  {
    name: 'Books',
    slug: 'books',
    description: 'Bestselling fiction, technical handbooks, graphic novels, manga, and academic texts.',
    image: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <rect x="20" y="10" width="24" height="44" rx="3" stroke="#1E293B" stroke-width="2.5"/>
        <path d="M20 10H26V54H20V10Z" fill="#FACC15" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
        <line x1="32" y1="20" x2="38" y2="20" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
        <line x1="32" y1="26" x2="38" y2="26" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `)
  },
  {
    name: '2 Wheelers',
    slug: 'two-wheelers',
    description: 'Electric scooters, urban commuter motorbikes, protective riding gear, and EV spares.',
    image: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <circle cx="20" cy="46" r="6" fill="#FACC15" stroke="#1E293B" stroke-width="2.5"/>
        <circle cx="46" cy="46" r="6" fill="#FACC15" stroke="#1E293B" stroke-width="2.5"/>
        <path d="M46 46H28C24 46 22 43 23 39C24 35 28 34 32 34H36L44 46Z" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M42 46L46 24L42 22" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="47" cy="24" r="3" stroke="#1E293B" stroke-width="2"/>
      </svg>
    `)
  }
];
