import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon, StarIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const ProductCard = ({ product, isFavorite = false, onToggleFavorite }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const {
    id,
    name,
    brand,
    imageUrl,
    fullImageUrl,
    rating,
    mainCategory,
    keyIngredients = [],
    alcoholFree,
    fragranceFree,
    parabenFree
  } = product;

  const badges = [];
  if (alcoholFree) badges.push('Alcohol Free');
  if (fragranceFree) badges.push('Fragrance Free');
  if (parabenFree) badges.push('Paraben Free');

  // Build image URL
  const getImageSrc = () => {
    if (imageError) {
      return '/images/placeholders/product-placeholder.jpg';
    }
    
    // Use fullImageUrl if provided by backend
    if (fullImageUrl) {
      return fullImageUrl;
    }
    
    if (imageUrl) {
      // If it's already a full URL, use as is
      if (imageUrl.startsWith('http')) {
        return imageUrl;
      }
      // If it starts with /, it's relative to our server
      if (imageUrl.startsWith('/')) {
        return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${imageUrl}`;
      }
      // Otherwise, assume it's just a filename
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/images/products/${imageUrl}`;
    }
    
    return '/images/placeholders/product-placeholder.jpg';
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  return (
    <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Image Container */}
      <div className="aspect-square overflow-hidden bg-gray-50 relative">
        <Link to={`/products/${id}`}>
          {/* Loading placeholder */}
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
          )}
          
          <img
            src={getImageSrc()}
            alt={`${brand} ${name}`}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            loading="lazy"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        </Link>
        
        {/* Favorite Button */}
        <button
          onClick={() => onToggleFavorite?.(product)}
          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors z-10"
        >
          {isFavorite ? (
            <HeartSolidIcon className="h-5 w-5 text-red-500" />
          ) : (
            <HeartIcon className="h-5 w-5 text-gray-600 hover:text-red-500" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <span className="text-xs font-medium text-primary-600 uppercase tracking-wide">
          {mainCategory}
        </span>

        {/* Brand & Name */}
        <Link to={`/products/${id}`} className="block mt-2">
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
            {brand}
          </h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {name}
          </p>
        </Link>

        {/* Rating */}
        {rating && (
          <div className="flex items-center mt-2">
            <div className="flex items-center">
              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600 ml-1">
                {rating.toFixed(1)}
              </span>
            </div>
          </div>
        )}

        {/* Key Ingredients */}
        {keyIngredients.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1">
              {keyIngredients.slice(0, 2).map((ingredient, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                >
                  {ingredient}
                </span>
              ))}
              {keyIngredients.length > 2 && (
                <span className="text-xs text-gray-400">
                  +{keyIngredients.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Product Badges */}
        {badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {badges.slice(0, 2).map((badge, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full"
              >
                {badge}
              </span>
            ))}
            {badges.length > 2 && (
              <span className="text-xs text-gray-400">
                +{badges.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;