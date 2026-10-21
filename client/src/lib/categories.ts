import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../api/products';
import type { Category } from '../types';

export interface CategoryStyle {
  icon: string; // Material Symbols name
  gradient: string; // Tailwind gradient classes for the tile
  short: string; // Short display label
}

const STYLES: Array<{ match: RegExp; style: Omit<CategoryStyle, 'short'> }> = [
  { match: /electronic|gadget|tech|laptop/i, style: { icon: 'devices', gradient: 'from-sky-500 to-blue-600' } },
  { match: /mobile|phone/i, style: { icon: 'smartphone', gradient: 'from-blue-500 to-indigo-600' } },
  { match: /fashion|apparel|cloth|wear/i, style: { icon: 'apparel', gradient: 'from-pink-500 to-rose-600' } },
  { match: /appliance|tv|television/i, style: { icon: 'tv', gradient: 'from-indigo-500 to-violet-600' } },
  { match: /home|kitchen|lamp|decor/i, style: { icon: 'chair', gradient: 'from-amber-400 to-orange-500' } },
  { match: /furniture|sofa/i, style: { icon: 'chair', gradient: 'from-amber-500 to-amber-700' } },
  { match: /book|stationery|read/i, style: { icon: 'menu_book', gradient: 'from-emerald-500 to-teal-600' } },
  { match: /sport|fitness|gym|outdoor/i, style: { icon: 'sports_cricket', gradient: 'from-lime-500 to-green-600' } },
  { match: /beauty|personal|care|cosmetic/i, style: { icon: 'spa', gradient: 'from-fuchsia-500 to-purple-600' } },
  { match: /toy|kid|baby/i, style: { icon: 'toys', gradient: 'from-yellow-400 to-amber-500' } },
  { match: /food|health|nutrition|supplement/i, style: { icon: 'medication', gradient: 'from-green-500 to-emerald-600' } },
  { match: /auto|helmet|vehicle|car/i, style: { icon: 'sports_motorsports', gradient: 'from-amber-500 to-orange-600' } },
  { match: /wheeler|scooter|motorcycle|bike/i, style: { icon: 'two_wheeler', gradient: 'from-teal-500 to-cyan-600' } }
];

const FALLBACK: Omit<CategoryStyle, 'short'> = {
  icon: 'category',
  gradient: 'from-brand-500 to-brand-700'
};

export function getCategoryStyle(category: Pick<Category, 'name' | 'slug'>): CategoryStyle {
  const key = `${category.slug} ${category.name}`;
  const found = STYLES.find((s) => s.match.test(key));
  // "Electronics & Gadgets" -> "Electronics"
  const short = category.name.split(/\s*&\s*|\s+and\s+/i)[0] || category.name;
  return { ...(found?.style ?? FALLBACK), short };
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await productsApi.getCategories();
      return res.success && Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 1000 * 60 * 30
  });
}
