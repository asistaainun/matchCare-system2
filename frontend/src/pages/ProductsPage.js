import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/Products/ProductCard';
import ProductFilters from '../components/Products/ProductFilters';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  // Build filters from URL params
  const filters = useMemo(() => {
    const params = {};
    for (const [key, value] of searchParams.entries()) {
      if (value && value !== 'false') {
        params[key] = value === 'true' ? true : value;
      }
    }
    return params;
  }, [searchParams]);

  const {
    data: productsData,
    isLoading,
    isError,
    error
  } = useProducts(filters);

  // Sorting options
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'rating');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'DESC');

  const sortOptions = [
    { value: 'rating', label: 'Highest Rated', order: 'DESC' },
    { value: 'name', label: 'Name A-Z', order: 'ASC' },
    { value: 'name', label: 'Name Z-A', order: 'DESC' },
    { value: 'brand', label: 'Brand A-Z', order: 'ASC' },
    { value: 'createdAt', label: 'Newest First', order: 'DESC' }
  ];

  const handleFilterChange = (newFilters) => {
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'false' && value !== false) {
        params.set(key, value.toString());
      }
    });

    // Preserve sort parameters
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder) params.set('sortOrder', sortOrder);

    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchQuery('');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleFilterChange({ ...filters, search: searchQuery.trim() });
    } else {
      const newFilters = { ...filters };
      delete newFilters.search;
      handleFilterChange(newFilters);
    }
  };

  const handleSortChange = (value) => {
    const option = sortOptions.find(opt => `${opt.value}-${opt.order}` === value);
    if (option) {
      setSortBy(option.value);
      setSortOrder(option.order);
      
      const params = new URLSearchParams(searchParams);
      params.set('sortBy', option.value);
      params.set('sortOrder', option.order);
      setSearchParams(params);
    }
  };

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => 
      value && value !== 'false' && value !== false
    ).length;
  }, [filters]);

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            Error loading products: {error?.message || 'Something went wrong'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {filters.search 
            ? `Search: ${filters.search} - MatchCare` 
            : 'Skincare Products - MatchCare'
          }
        </title>
        <meta 
          name="description" 
          content="Browse our extensive collection of skincare products. Filter by skin type, concerns, brand, and more to find your perfect match." 
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {filters.search ? `Search Results for "${filters.search}"` : 'All Products'}
            </h1>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, brands, ingredients..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </form>
          </div>

          <div className="lg:grid lg:grid-cols-5 lg:gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <ProductFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
            </div>

            {/* Products Grid */}
            <div className="mt-8 lg:mt-0 lg:col-span-4">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <p className="text-gray-600">
                    {isLoading ? (
                      'Loading...'
                    ) : (
                      `${productsData?.pagination?.total || 0} products found`
                    )}
                  </p>
                  {activeFiltersCount > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied
                    </span>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Sort by:</label>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-primary-500"
                  >
                    {sortOptions.map((option) => (
                      <option key={`${option.value}-${option.order}`} value={`${option.value}-${option.order}`}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Products Grid */}
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : productsData?.products?.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {productsData.products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onToggleFavorite={(product) => {
                          // Handle favorite toggle
                          console.log('Toggle favorite:', product);
                        }}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {productsData.pagination.pages > 1 && (
                    <div className="mt-12 flex justify-center">
                      <div className="flex space-x-2">
                        {Array.from({ length: productsData.pagination.pages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => {
                              const params = new URLSearchParams(searchParams);
                              params.set('page', page.toString());
                              setSearchParams(params);
                            }}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${
                              page === productsData.pagination.page
                                ? 'bg-primary-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <AdjustmentsHorizontalIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No products found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Try adjusting your filters or search terms to find what you're looking for.
                    </p>
                    <button
                      onClick={handleClearFilters}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductsPage;