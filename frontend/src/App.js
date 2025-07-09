import React from 'react';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          � MatchCare Frontend
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
