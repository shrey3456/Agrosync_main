import React from 'react';
import { Link,useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 to-emerald-900">
      {/* Navigation */}
      <nav className="bg-transparent py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white">FarmVerify</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-white hover:text-emerald-200">Home</Link>
              <Link to="/marketplace" className="text-white hover:text-emerald-200">Marketplace</Link>
              <Link to="/verified-farmers" className="text-white hover:text-emerald-200">Verified Farmers</Link>
              <Link to="/about" className="text-white hover:text-emerald-200">About</Link>
                <button className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </button>
                <button className="bg-white text-emerald-900 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors"
                  onClick={() => navigate("/register")}
                >
                  Register
                </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="mb-8">
              <p className="text-emerald-400 mb-2">Trusted by 1000+ farmers</p>
              <h1 className="text-5xl font-bold text-white mb-4">
                Verify with Nature
              </h1>
              <h2 className="text-4xl font-bold text-white mb-6">
                Secure with Blockchain
              </h2>
              <p className="text-gray-300 text-lg">
                Our platform bridges the gap between traditional farming and modern verification, 
                creating trust through technology while honoring agricultural heritage.
              </p>
            </div>
            
            <div className="flex space-x-4">
              <button className="bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors flex items-center">
                Get Started
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="border-2 border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-emerald-900 transition-colors">
                Learn More
              </button>
            </div>

            {/* Reviews Section */}
            <div className="mt-12">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-10 w-10 rounded-full bg-white border-2 border-emerald-500"></div>
                  ))}
                </div>
                <div className="text-emerald-400">
                  <span className="font-bold">4.9/5</span>
                  <span className="text-gray-300 ml-1">from over 1,200 reviews</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="w-full h-[500px] relative">
              <img 
                src="/farmer-illustration.svg" 
                alt="Farmer with wheelbarrow"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;