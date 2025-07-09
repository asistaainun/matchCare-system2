import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          ��� MatchCare Frontend
        </h1>
        <div className="bg-green-500 text-white p-4 rounded-lg mb-4">
          ✅ React {React.version} Working
        </div>
        <div className="bg-blue-500 text-white p-4 rounded-lg mb-4">
          ✅ Tailwind CSS Working
        </div>
        <div className="gradient-text text-xl font-bold">
          ✅ All Dependencies Fixed
        </div>
      </div>
    </div>
  );
}

export default App;
