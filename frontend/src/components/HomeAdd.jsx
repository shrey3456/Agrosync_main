import React from "react";

const HomeAdd = () => {
  return (
    <div className="bg-[#0D0F1A] text-white py-16 px-8">
      {/* Section: How It Works */}
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold">How FarmVerify Works</h2>
        <p className="text-gray-400 mt-2">
          Our platform makes verification simple, secure, and transparent for
          everyone.
        </p>
      </div>

      {/* Steps */}
      <div className="grid md:grid-cols-3 gap-8 text-center">
        <div className="bg-[#131722] p-6 rounded-lg">
          <div className="text-teal-400 text-4xl mb-3">📄</div>
          <h3 className="font-semibold">1. Document Submission</h3>
          <p className="text-gray-400 text-sm">
            Farmers submit their credentials and certifications through our
            secure platform.
          </p>
        </div>
        <div className="bg-[#131722] p-6 rounded-lg">
          <div className="text-blue-400 text-4xl mb-3">🔗</div>
          <h3 className="font-semibold">2. Blockchain Verification</h3>
          <p className="text-gray-400 text-sm">
            Our system verifies and secures the information on the blockchain
            for immutable proof.
          </p>
        </div>
        <div className="bg-[#131722] p-6 rounded-lg">
          <div className="text-orange-400 text-4xl mb-3">🛒</div>
          <h3 className="font-semibold">3. Verified Marketplace</h3>
          <p className="text-gray-400 text-sm">
            Consumers can shop with confidence knowing they’re buying from
            verified authentic farmers.
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="flex flex-wrap justify-center gap-8 mt-12 text-center">
        <div>
          <h3 className="text-lg font-bold">10,000+</h3>
          <p className="text-gray-400 text-sm">Verified Farmers</p>
        </div>
        <div>
          <h3 className="text-lg font-bold">24 Hours</h3>
          <p className="text-gray-400 text-sm">Avg. Verification Time</p>
        </div>
        <div>
          <h3 className="text-lg font-bold">100%</h3>
          <p className="text-gray-400 text-sm">Data Security</p>
        </div>
        <div>
          <h3 className="text-lg font-bold">50+</h3>
          <p className="text-gray-400 text-sm">Countries Supported</p>
        </div>
      </div>

      {/* Bridging Nature and Technology */}
      <div className="text-center mt-16">
        <h2 className="text-3xl font-bold">Bridging Nature and Technology</h2>
        <p className="text-gray-400 mt-2">
          Combining traditional farming with blockchain technology for secure
          and intuitive verification.
        </p>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mt-8">
        <div className="bg-[#131722] p-6 rounded-lg">
          <div className="text-green-400 text-3xl mb-2">📑</div>
          <h3 className="font-semibold">Document Verification</h3>
          <p className="text-gray-400 text-sm">
            Securely upload and verify farming credentials.
          </p>
        </div>
        <div className="bg-[#131722] p-6 rounded-lg">
          <div className="text-yellow-400 text-3xl mb-2">🔒</div>
          <h3 className="font-semibold">Blockchain Security</h3>
          <p className="text-gray-400 text-sm">
            Your verification data is stored immutably on the blockchain.
          </p>
        </div>
        <div className="bg-[#131722] p-6 rounded-lg">
          <div className="text-blue-400 text-3xl mb-2">💳</div>
          <h3 className="font-semibold">Digital Wallet</h3>
          <p className="text-gray-400 text-sm">
            Manage your digital certificates and credentials securely.
          </p>
        </div>
        <div className="bg-[#131722] p-6 rounded-lg">
          <div className="text-purple-400 text-3xl mb-2">🏅</div>
          <h3 className="font-semibold">Premium Certificates</h3>
          <p className="text-gray-400 text-sm">
            Receive beautifully designed digital farming certificates.
          </p>
        </div>
        <div className="bg-[#131722] p-6 rounded-lg">
          <div className="text-pink-400 text-3xl mb-2">📊</div>
          <h3 className="font-semibold">Analytics Dashboard</h3>
          <p className="text-gray-400 text-sm">
            Track your verification status and engagement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomeAdd;
