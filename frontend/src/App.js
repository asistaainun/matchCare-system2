import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

import Header from './components/Common/Header';
import Footer from './components/Common/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Header />
            
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route 
                  path="/quiz" 
                  element={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                          Skin Quiz
                        </h1>
                        <p className="text-gray-600">Coming soon...</p>
                      </div>
                    </div>
                  } 
                />
                <Route 
                  path="/ingredients" 
                  element={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                          Ingredients Database
                        </h1>
                        <p className="text-gray-600">Coming soon...</p>
                      </div>
                    </div>
                  } 
                />
                <Route 
                  path="*" 
                  element={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                          404 - Page Not Found
                        </h1>
                        <p className="text-gray-600">
                          The page you're looking for doesn't exist.
                        </p>
                      </div>
                    </div>
                  } 
                />
              </Routes>
            </main>
            
            <Footer />
          </div>
          
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </Router>
        
        {/* React Query Devtools */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;