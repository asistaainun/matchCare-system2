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
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Learn</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/skincare-basics" className="text-gray-300 hover:text-white transition-colors">
                  Skincare Basics
                </Link>
              </li>
              <li>
                <Link to="/skin-types" className="text-gray-300 hover:text-white transition-colors">
                  Skin Types
                </Link>
              </li>
              <li>
                <Link to="/ingredients-guide" className="text-gray-300 hover:text-white transition-colors">
                  Ingredients Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;