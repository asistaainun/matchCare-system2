import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* MatchCare Info */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="h-8 w-8 text-primary-400" />
              <span className="text-2xl font-bold">MatchCare</span>
            </div>
            <p className="text-gray-300 mb-4">
              Your personalized skincare companion powered by advanced ontology and AI technology.
            </p>
            <p className="text-sm text-gray-400">
              © 2024 MatchCare. All rights reserved.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Explore</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-gray-300 hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/quiz" className="text-gray-300 hover:text-white transition-colors">
                  Skin Quiz
                </Link>
              </li>
              <li>
                <Link to="/ingredients" className="text-gray-300 hover:text-white transition-colors">
                  Ingredients
                </Link>
              </li>
              <li>
                <Link to="/brands" className="text-gray-300 hover:text-white transition-colors">
                  Brands
                </Link>
              </li>
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Learn</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/learn/basics" className="text-gray-300 hover:text-white transition-colors">
                  Basic Skincare
                </Link>
              </li>
              <li>
                <Link to="/learn/ingredients" className="text-gray-300 hover:text-white transition-colors">
                  Ingredients Guide
                </Link>
              </li>
              <li>
                <Link to="/learn/skin-types" className="text-gray-300 hover:text-white transition-colors">
                  Skin Types
                </Link>
              </li>
              <li>
                <Link to="/learn/concerns" className="text-gray-300 hover:text-white transition-colors">
                  Skin Concerns
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:support@matchcare.com" className="text-gray-300 hover:text-white transition-colors">
                  support@matchcare.com
                </a>
              </li>
              <li>
                <a href="/help" className="text-gray-300 hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-gray-300 hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Border */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            Built with ❤️ for skincare enthusiasts everywhere
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;