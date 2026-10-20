import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ProductListing } from '../components/ProductListing';
import { getCategoryStyle, useCategories } from '../lib/categories';

export const CategoryPage: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data: categories = [], isLoading } = useCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!isLoading && !category) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-surface p-4">
        <div className="space-y-4 rounded-3xl bg-white p-10 text-center ring-1 ring-slate-200/70">
          <span className="material-symbols-outlined text-5xl text-slate-300">category</span>
          <h1 className="text-xl font-extrabold text-slate-900">Category not found</h1>
          <Link to="/" className="inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const style = category ? getCategoryStyle(category) : null;

  const hero = category && style && (
    <div className={`bg-gradient-to-r ${style.gradient} text-white`}>
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-8 sm:px-6 lg:px-8">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/20 backdrop-blur sm:h-20 sm:w-20">
          <span className="material-symbols-outlined text-4xl sm:text-5xl">{style.icon}</span>
        </span>
        <div>
          <nav className="mb-1 text-xs font-semibold text-white/80">
            <Link to="/" className="hover:underline">
              Home
            </Link>{' '}
            / {category.name}
          </nav>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{category.name}</h1>
          {category.description && <p className="mt-1 max-w-2xl text-sm text-white/85">{category.description}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <ProductListing
      key={slug}
      title={category ? `All in ${style!.short}` : 'Loading…'}
      layout="grid"
      fixed={{ category: slug }}
      hero={hero}
    />
  );
};
