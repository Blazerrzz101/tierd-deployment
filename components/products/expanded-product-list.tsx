'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '@/types/product';
import { CategoryFilter } from './category-filter';
import { ProductCard } from '@/components/products/product-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ExpandedProductListProps {
  initialCategory?: string | null;
}

export function ExpandedProductList({ initialCategory = null }: ExpandedProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const response = await fetch(`/api/products/expanded?category=${selectedCategory}`);
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setProducts(data.products);
          setError(null);
        } else {
          setError(data.error || 'Failed to load products');
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [selectedCategory]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4">Expanded Product Catalog</h2>
        <p className="text-gray-600">
          Browse our expanded selection of gaming peripherals with {products.length} products across all categories.
        </p>
      </div>
      
      <CategoryFilter 
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      />
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800 my-4">
          <p>{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No products found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ExpandedProductList; 