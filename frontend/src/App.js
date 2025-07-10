import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { GuestProvider } from './contexts/GuestContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ErrorBoundary from './components/Common/ErrorBoundary';

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <GuestProvider>
                <Router>
                  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
                    <Navbar />
                    <main className="flex-1 container mx-auto px-4 py-8">
                      <Routes>
                        <Route 
                          path="/" 
                          element={
                            <div className="text-center">
                              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                Welcome to MatchCare
                              </h1>
                              <p className="text-lg text-gray-600 dark:text-gray-400">
                                Your personalized skincare recommendation system
                              </p>
                            </div>
                          } 
                        />
                        <Route 
                          path="/products" 
                          element={
                            <div className="text-center">
                              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Products Page
                              </h1>
                            </div>
                          } 
                        />
                        <Route 
                          path="*" 
                          element={
                            <div className="text-center">
                              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Page Not Found
                              </h1>
                            </div>
                          } 
                        />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                  <Toaster 
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                    }}
                  />
                </Router>
              </GuestProvider>
            </AuthProvider>
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;