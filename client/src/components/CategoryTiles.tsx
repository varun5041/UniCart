import React from 'react';
import { Link } from 'react-router-dom';
import { getCategoryStyle, useCategories } from '../lib/categories';

export const CategoryTiles: React.FC = () => {
  const { data: categories = [], isLoading } = useCategories();

  if (!isLoading && categories.length === 0) return null;

  return (
    <section aria-labelledby="shop-by-category" className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60 sm:p-6">
      <h2 id="shop-by-category" className="mb-5 text-lg font-extrabold text-slate-900 sm:text-xl">
        Shop by Category
      </h2>
      <div className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-[repeat(auto-fit,minmax(130px,1fr))] sm:gap-4">
        {isLoading
          ? Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex w-24 shrink-0 animate-pulse flex-col items-center gap-3 sm:w-auto">
                <div className="h-20 w-20 rounded-3xl bg-slate-100 sm:h-24 sm:w-24" />
                <div className="h-3 w-16 rounded bg-slate-100" />
              </div>
            ))
          : categories.map((cat) => {
              const style = getCategoryStyle(cat);
              return (
                <Link
                  key={cat._id || cat.slug}
                  to={`/category/${cat.slug}`}
                  className="group flex w-24 shrink-0 flex-col items-center gap-2.5 rounded-2xl p-1 text-center sm:w-auto"
                >
                  <span
                    className={`relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br ${style.gradient} text-white shadow-lg shadow-slate-900/10 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105 sm:h-24 sm:w-24`}
                  >
                    <span className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-white/20" />
                    <span className="absolute -bottom-5 -left-3 h-10 w-10 rounded-full bg-black/10" />
                    <span className="material-symbols-outlined relative text-[40px] sm:text-[44px]">{style.icon}</span>
                  </span>
                  <span className="text-xs font-bold leading-tight text-slate-700 group-hover:text-brand-700 sm:text-sm">
                    {style.short}
                  </span>
                </Link>
              );
            })}
      </div>
    </section>
  );
};
