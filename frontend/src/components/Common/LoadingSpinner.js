import React from 'react';

const LoadingSpinner = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`inline-block animate-spin rounded-full border-4 border-gray-300 border-t-primary-600 ${sizeClasses[size]} ${className}`}>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;