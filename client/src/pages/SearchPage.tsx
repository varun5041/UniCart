import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductListing } from '../components/ProductListing';

export const SearchPage: React.FC = () => {
  const [params] = useSearchParams();
  const q = (params.get('q') || '').trim();

  return (
    <ProductListing
      key={q}
      title={q ? `Results for “${q}”` : 'All Products'}
      layout="list"
      defaultSort={q ? 'popular' : 'newest'}
    />
  );
};
