
import React from 'react';
import type { Product, ProductTypeDefinition } from '@/types';
import { ProductCard } from './ProductCard';

interface ProductListProps {
  products: Product[];
  allProductTypes: ProductTypeDefinition[]; // Added to pass down for display
  lang: string;
}

const ProductListComponent = ({ products, allProductTypes, lang }: ProductListProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          allProductTypes={allProductTypes} // Pass down
          lang={lang}
        />
      ))}
    </div>
  );
};

ProductListComponent.displayName = 'ProductList';
export const ProductList = React.memo(ProductListComponent);
