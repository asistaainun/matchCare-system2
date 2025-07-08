import React, { useState } from 'react';
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';

const ProductFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const [isOpen, setIsOpen] = useState(false);

  const skinTypes = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'];
  const concerns = [
    'Acne', 'Wrinkles', 'Fine Lines', 'Sensitivity', 'Dryness',
    'Oiliness', 'Redness', 'Pores', 'Dullness', 'Dark Spots'
  ];
  const categories = [
    'Cleanser', 'Toner', 'Serum', 'Moisturizer', 'Sunscreen',
    'Treatment', 'Exfoliator', 'Mask'
  ];

  const brands = [
    'The Ordinary', 'CeraVe', 'Cetaphil', 'La Roche-Posay',
    'Neutrogena', 'Olay', 'Skinceuticals', 'Paula\'s Choice'
  ];

  const handleFilterChange = (filterType, value) => {
    onFilterChange({ ...filters, [filterType]: value });
  };

  const FilterSection = ({ title, options, filterKey, placeholder }) => (
    <div className="border-b border-gray-200 py-4">
      <h3 className="font-medium text-gray-900 mb-3">{title}</h3>
      <select
        value={filters[filterKey] || ''}
        onChange={(e) => handleFilterChange(filterKey, e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <FunnelIcon className="h-5 w-5 mr-2" />
        Filters
      </button>

      {/* Mobile Filter Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white h-full max-w-xs w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-medium">Filters</h2>
              <button onClick={() => setIsOpen(false)}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <FilterContent />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <FilterContent />
      </div>
    </>
  );

  function FilterContent() {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Filters</h2>
          <button
            onClick={onClearFilters}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Clear All
          </button>
        </div>

        <FilterSection
          title="Skin Type"
          options={skinTypes}
          filterKey="skinType"
          placeholder="Select skin type"
        />

        <FilterSection
          title="Skin Concern"
          options={concerns}
          filterKey="concern"
          placeholder="Select concern"
        />

        <FilterSection
          title="Category"
          options={categories}
          filterKey="category"
          placeholder="Select category"
        />

        <FilterSection
          title="Brand"
          options={brands}
          filterKey="brand"
          placeholder="Select brand"
        />

        <div className="border-b border-gray-200 py-4">
          <h3 className="font-medium text-gray-900 mb-3">Minimum Rating</h3>
          <select
            value={filters.minRating || ''}
            onChange={(e) => handleFilterChange('minRating', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Any rating</option>
            <option value="4">4+ stars</option>
            <option value="3">3+ stars</option>
            <option value="2">2+ stars</option>
          </select>
        </div>

        <div className="py-4">
          <h3 className="font-medium text-gray-900 mb-3">Formulation</h3>
          <div className="space-y-2">
            {[
              { key: 'alcoholFree', label: 'Alcohol Free' },
              { key: 'fragranceFree', label: 'Fragrance Free' },
              { key: 'parabenFree', label: 'Paraben Free' },
              { key: 'sulfateFree', label: 'Sulfate Free' },
              { key: 'siliconeFree', label: 'Silicone Free' }
            ].map((item) => (
              <label key={item.key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters[item.key] || false}
                  onChange={(e) => handleFilterChange(item.key, e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }
};

export default ProductFilters;