import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Sparkles, 
  Users, 
  Award, 
  Shield, 
  ArrowRight,
  BeakerIcon
} from 'lucide-react';
import { useTrendingProducts, useProductsByCategory } from '../hooks/useProducts';
import ProductCard from '../components/Products/ProductCard';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const HomePage = () => {
  const { data: trendingProducts, isLoading: loadingTrending } = useTrendingProducts(8);
  const { data: categoryData, isLoading: loadingCategories } = useProductsByCategory();

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Analysis",
      description: "Advanced ontology-based recommendation system that understands your skin's unique needs"
    },
    {
      icon: Users,
      title: "Personalized Match",
      description: "Tailored recommendations based on your skin type, concerns, and preferences"
    },
    {
      icon: Award,
      title: "Expert Curated",
      description: "Products selected and verified by dermatologists and skincare professionals"
    },
    {
      icon: Shield,
      title: "Safe & Trusted",
      description: "Comprehensive ingredient analysis and safety information for every product"
    }
  ];

  const skinConcerns = [
    'Acne', 'Wrinkles', 'Fine Lines', 'Sensitivity', 'Dryness', 
    'Oiliness', 'Redness', 'Pores', 'Dullness', 'Dark Spots'
  ];

  const popularBrands = [
    'The Ordinary', 'CeraVe', 'Cetaphil', 'La Roche-Posay', 
    'Neutrogena', 'Olay', 'Skinceuticals', 'Paula\'s Choice'
  ];

  return (
    <>
      <Helmet>
        <title>MatchCare - Find Your Perfect Skincare Match</title>
        <meta 
          name="description" 
          content="Discover personalized skincare recommendations with our AI-powered ontology system. Take the skin quiz and find products perfect for your skin type and concerns." 
        />
        <meta name="keywords" content="skincare, personalized recommendations, skin analysis, beauty, dermatology" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Find Your Perfect
                <span className="block bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                  Skincare Match
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                Discover personalized skincare recommendations powered by advanced ontology and AI. 
                Take our comprehensive skin analysis and get products tailored just for you.
              </p>

              {/* CTA Section */}
              <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto mb-12">
                <div className="flex items-center justify-center mb-4">
                  <BeakerIcon className="h-8 w-8 text-primary-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Want to know skincare that suits your skin type?
                  </h2>
                </div>
                <p className="text-gray-600 mb-6">
                  Fill out your beauty profile here and get personalized recommendations!
                </p>
                <Link
                  to="/quiz"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose MatchCare?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our advanced ontology-based system provides the most accurate and personalized skincare recommendations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="text-center p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                    <feature.icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Products Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Trending Products
                </h2>
                <p className="text-lg text-gray-600">
                  Most loved products by our community
                </p>
              </div>
              <Link
                to="/products"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                View All
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>

            {loadingTrending ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {trendingProducts?.map((product) => (
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
            )}
          </div>
        </section>

        {/* Shop by Concern Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Shop by Skin Concern
              </h2>
              <p className="text-lg text-gray-600">
                Find products targeted for your specific skin needs
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {skinConcerns.map((concern, index) => (
                <Link
                  key={index}
                  to={`/products?concern=${encodeURIComponent(concern)}`}
                  className="p-4 text-center bg-gray-50 rounded-xl hover:bg-primary-50 hover:text-primary-700 transition-all duration-300 group"
                >
                  <span className="font-medium text-gray-900 group-hover:text-primary-700">
                    {concern}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Shop by Category Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Shop by Product Category
              </h2>
              <p className="text-lg text-gray-600">
                Explore our comprehensive range of skincare products
              </p>
            </div>

            {loadingCategories ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-12">
                {categoryData?.slice(0, 3).map((categoryGroup, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {categoryGroup.category}
                      </h3>
                      <Link
                        to={`/products?category=${encodeURIComponent(categoryGroup.category)}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View All
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {categoryGroup.products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onToggleFavorite={(product) => {
                            console.log('Toggle favorite:', product);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Shop by Brand Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Shop by Brand
              </h2>
              <p className="text-lg text-gray-600">
                Discover products from your favorite trusted brands
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {popularBrands.map((brand, index) => (
                <Link
                  key={index}
                  to={`/products?brand=${encodeURIComponent(brand)}`}
                  className="p-6 text-center bg-gray-50 rounded-xl hover:bg-primary-50 hover:shadow-md transition-all duration-300 group"
                >
                  <span className="font-medium text-gray-900 group-hover:text-primary-700">
                    {brand}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;