import React from 'react';
import { ProductListing } from '../components/ProductListing';

const hero = (
  <div className="bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-600 text-white">
    <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-8 sm:px-6 lg:px-8">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/20 backdrop-blur sm:h-20 sm:w-20">
        <span className="material-symbols-outlined text-4xl sm:text-5xl">local_offer</span>
      </span>
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Today&apos;s Deals</h1>
        <p className="mt-1 text-sm text-white/90">Every product on sale, sorted by the biggest discount first.</p>
      </div>
    </div>
  </div>
);

export const DealsPage: React.FC = () => (
  <ProductListing title="All products on sale" layout="grid" fixed={{ onSale: true }} defaultSort="discount" hero={hero} />
);
