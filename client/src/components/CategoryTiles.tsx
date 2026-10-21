import React from 'react';
import { Link } from 'react-router-dom';
import { getCategoryStyle, useCategories } from '../lib/categories';

export const CategoryTiles: React.FC = () => {
  const { data: categories = [], isLoading } = useCategories();

  if (!isLoading && categories.length === 0) return null;

  return (
    <section aria-labelledby="shop-by-category" className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 id="shop-by-category" className="text-lg font-extrabold text-slate-900 sm:text-xl">
          Shop by Category
        </h2>
        <span className="text-xs font-semibold text-slate-400">
          Explore all departments
        </span>
      </div>
      <div className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 sm:gap-4">
        {isLoading
          ? Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex w-20 shrink-0 animate-pulse flex-col items-center gap-2.5 sm:w-24">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 sm:h-20 sm:w-20" />
                <div className="h-3 w-14 rounded bg-slate-100" />
              </div>
            ))
          : categories.map((cat) => {
              const style = getCategoryStyle(cat);
              return (
                <Link
                  key={cat._id || cat.slug}
                  to={`/category/${cat.slug}`}
                  className="group flex w-20 shrink-0 flex-col items-center gap-2 rounded-2xl p-1 text-center transition-all sm:w-24"
                >
                  <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 ring-1 ring-slate-200/80 shadow-xs transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:ring-brand-400 group-hover:shadow-md sm:h-20 sm:w-20">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="h-full w-full object-contain" />
                    ) : (
                      <span className="material-symbols-outlined text-[32px] sm:text-[38px] text-brand-600">
                        {style.icon}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold leading-tight text-slate-700 group-hover:text-brand-700 truncate max-w-[84px] sm:max-w-none">
                    {style.short}
                  </span>
                </Link>
              );
            })}
      </div>
    </section>
  );
};
