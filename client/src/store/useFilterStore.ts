import { create } from 'zustand';

export type SortOption = 'featured' | 'price_asc' | 'price_desc' | 'rating' | 'newest';

interface FilterStore {
  searchQuery: string;
  selectedCategory: string;
  minPrice: number;
  maxPrice: number;
  selectedBrands: string[];
  inStockOnly: boolean;
  minRating: number;
  sortBy: SortOption;
  viewMode: 'grid' | 'list';
  currentPage: number;
  itemsPerPage: number;

  setSearchQuery: (query: string) => void;
  setCategory: (category: string) => void;
  setPriceRange: (min: number, max: number) => void;
  toggleBrand: (brand: string) => void;
  setInStockOnly: (val: boolean) => void;
  setMinRating: (rating: number) => void;
  setSortBy: (sort: SortOption) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
  activeFilterCount: () => number;
}

const DEFAULT_STATE = {
  searchQuery: '',
  selectedCategory: 'all',
  minPrice: 0,
  maxPrice: 150000,
  selectedBrands: [],
  inStockOnly: false,
  minRating: 0,
  sortBy: 'featured' as SortOption,
  viewMode: 'grid' as const,
  currentPage: 1,
  itemsPerPage: 8
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  ...DEFAULT_STATE,

  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
  setCategory: (cat) => set({ selectedCategory: cat, currentPage: 1 }),
  setPriceRange: (min, max) => set({ minPrice: min, maxPrice: max, currentPage: 1 }),
  toggleBrand: (brand) => {
    set((state) => {
      const exists = state.selectedBrands.includes(brand);
      const brands = exists
        ? state.selectedBrands.filter((b) => b !== brand)
        : [...state.selectedBrands, brand];
      return { selectedBrands: brands, currentPage: 1 };
    });
  },
  setInStockOnly: (val) => set({ inStockOnly: val, currentPage: 1 }),
  setMinRating: (rating) => set({ minRating: rating, currentPage: 1 }),
  setSortBy: (sort) => set({ sortBy: sort, currentPage: 1 }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setPage: (page) => set({ currentPage: page }),

  resetFilters: () => {
    set({
      searchQuery: '',
      selectedCategory: 'all',
      minPrice: 0,
      maxPrice: 150000,
      selectedBrands: [],
      inStockOnly: false,
      minRating: 0,
      sortBy: 'featured',
      currentPage: 1
    });
  },

  activeFilterCount: () => {
    const s = get();
    let count = 0;
    if (s.selectedCategory !== 'all') count++;
    if (s.searchQuery) count++;
    if (s.minPrice > 0 || s.maxPrice < 150000) count++;
    if (s.selectedBrands.length > 0) count += s.selectedBrands.length;
    if (s.inStockOnly) count++;
    if (s.minRating > 0) count++;
    return count;
  }
}));
