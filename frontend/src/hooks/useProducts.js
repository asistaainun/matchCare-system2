import { useQuery } from 'react-query';
import { apiMethods } from '../services/api';

export const useProducts = (filters = {}) => {
  return useQuery(
    ['products', filters],
    () => apiMethods.products.getAll(filters),
    {
      select: (response) => response.data.data,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

export const useProduct = (id) => {
  return useQuery(
    ['product', id],
    () => apiMethods.products.getById(id),
    {
      select: (response) => response.data.data.product,
      enabled: !!id,
    }
  );
};

export const useTrendingProducts = (limit = 8) => {
  return useQuery(
    ['trending-products', limit],
    () => apiMethods.recommendations.getTrending({ limit }),
    {
      select: (response) => response.data.data.trending,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

export const useProductsByCategory = () => {
  return useQuery(
    'products-by-category',
    () => apiMethods.products.getByCategory(),
    {
      select: (response) => response.data.data,
      staleTime: 15 * 60 * 1000, // 15 minutes
    }
  );
};