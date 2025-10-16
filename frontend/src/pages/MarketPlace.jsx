import { motion } from 'framer-motion';
import React, { useState } from 'react';
import Navbar from "../components/Navbar";
import Button from "../components/ui/Button";
import { 
  Search, 
  Filter, 
  Star, 
  ShoppingCart, 
  Heart, 
  Leaf, 
  Clock, 
  MapPin,
  ChevronRight,
  Package
} from 'lucide-react';

function MarketPlace() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'vegetables', name: 'Vegetables' },
    { id: 'fruits', name: 'Fruits' },
    { id: 'dairy', name: 'Dairy' },
    { id: 'grains', name: 'Grains' }
  ];

  const products = [
    {
      id: 1,
      name: 'Organic Tomatoes',
      farmer: 'John Smith',
      price: 4.99,
      unit: 'kg',
      image: 'https://placehold.co/300x300/1a332e/white?text=Tomatoes',
      rating: 4.8,
      reviews: 128,
      category: 'vegetables',
      stock: 50,
      location: 'California, USA',
      harvestDate: '2024-03-15',
      isOrganic: true,
      isFavorite: false
    },
    {
      id: 2,
      name: 'Fresh Apples',
      farmer: 'Mary Johnson',
      price: 3.99,
      unit: 'kg',
      image: 'https://placehold.co/300x300/1a332e/white?text=Apples',
      rating: 4.9,
      reviews: 256,
      category: 'fruits',
      stock: 75,
      location: 'Washington, USA',
      harvestDate: '2024-03-10',
      isOrganic: true,
      isFavorite: true
    },
    {
      id: 3,
      name: 'Free Range Eggs',
      farmer: 'Robert Davis',
      price: 6.99,
      unit: 'dozen',
      image: 'https://placehold.co/300x300/1a332e/white?text=Eggs',
      rating: 4.7,
      reviews: 89,
      category: 'dairy',
      stock: 30,
      location: 'Oregon, USA',
      harvestDate: '2024-03-18',
      isOrganic: true,
      isFavorite: false
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#1a332e]">
      <Navbar />
      <div className="pt-24">
        <div className="bg-[#1a332e] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-block p-3 rounded-full bg-teal-500/10 mb-6"
              >
                <Package className="w-8 h-8 text-teal-400" />
              </motion.div>
              <h2 className="text-4xl font-bold text-white sm:text-5xl mb-4">
                Fresh from the Farm
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Discover fresh, organic produce directly from our verified farmers
              </p>
            </motion.div>

            {/* Search and Filter Section */}
            <div className="mb-12">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#2d4f47] border border-teal-500/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <Button
                  className="bg-teal-500 text-white hover:bg-teal-600 flex items-center gap-2"
                >
                  <Filter className="w-5 h-5" />
                  Filters
                </Button>
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-4 mb-12 overflow-x-auto pb-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-2 rounded-full whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? 'bg-teal-500 text-white'
                      : 'bg-[#2d4f47] text-gray-300 hover:bg-teal-500/20'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
            >
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  className="bg-[#2d4f47] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-teal-500/20"
                >
                  <div className="relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-64 object-cover"
                    />
                    {product.isOrganic && (
                      <div className="absolute top-4 left-4 bg-teal-500/90 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        <Leaf className="w-4 h-4" />
                        Organic
                      </div>
                    )}
                    <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors">
                      <Heart className={`w-5 h-5 ${product.isFavorite ? 'text-red-500 fill-current' : 'text-white'}`} />
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">{product.name}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-white">{product.rating}</span>
                        <span className="text-gray-400 text-sm">({product.reviews})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-300 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{product.location}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-300 mb-3">
                      <Clock className="w-4 h-4" />
                      <span>Harvested: {new Date(product.harvestDate).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <span className="text-2xl font-bold text-white">${product.price}</span>
                        <span className="text-gray-400 ml-1">/{product.unit}</span>
                      </div>
                      <span className="text-sm text-gray-400">Stock: {product.stock}</span>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-teal-500 text-white hover:bg-teal-600 flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Add to Cart
                      </Button>
                      <Button
                        className="bg-[#3d5f57] text-white hover:bg-[#4d6f67] flex items-center justify-center"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketPlace;