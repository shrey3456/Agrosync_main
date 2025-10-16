import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { Plus, MoreVertical, Search } from 'lucide-react';

function ProductList() {
  const [products, setProducts] = useState([
    {
      id: 1,
      name: 'Organic Heirloom Tomatoes',
      category: 'Vegetables',
      price: 4.99,
      unit: 'lb',
      stock: 25,
      status: 'Active',
      image: 'https://placehold.co/100x100/1a332e/white?text=Tomatoes'
    },
    {
      id: 2,
      name: 'Fresh Raw Honey',
      category: 'Honey & Preserves',
      price: 12.99,
      unit: 'jar',
      stock: 15,
      status: 'Active',
      image: 'https://placehold.co/100x100/1a332e/white?text=Honey'
    },
    {
      id: 3,
      name: 'Grass-Fed Beef',
      category: 'Meat',
      price: 18.99,
      unit: 'lb',
      stock: 8,
      status: 'Active',
      image: 'https://placehold.co/100x100/1a332e/white?text=Beef'
    },
    {
      id: 4,
      name: 'Organic Blueberries',
      category: 'Fruits',
      price: 6.99,
      unit: 'pint',
      stock: 0,
      status: 'Out of Stock',
      image: 'https://placehold.co/100x100/1a332e/white?text=Blueberries'
    },
    {
      id: 5,
      name: 'Artisanal Goat Cheese',
      category: 'Dairy',
      price: 8.99,
      unit: '8 oz',
      stock: 12,
      status: 'Active',
      image: 'https://placehold.co/100x100/1a332e/white?text=Cheese'
    }
  ]);

  return (
    <div className="min-h-screen bg-[#1a332e]">
      <Navbar />
      
      {/* Main Content */}
      <div className="pt-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-white mb-2"
            >
              Manage Products
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400"
            >
              Add, edit, and manage your farm products for the marketplace
            </motion.p>
          </div>

          {/* Search and Add Product Bar */}
          <div className="flex justify-between items-center mb-6 gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full bg-[#2d4f47] text-white pl-10 pr-4 py-2.5 rounded-lg border border-teal-500/20 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-teal-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-teal-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add New Product
            </motion.button>
          </div>

          {/* Products Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#2d4f47] rounded-xl border border-teal-500/20 overflow-hidden"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-teal-500/20">
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Image</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Product</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Category</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Price</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Stock</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-teal-500/20 last:border-0">
                    <td className="py-4 px-6">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-white font-medium">{product.name}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-300">{product.category}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-white">${product.price} / {product.unit}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-white">{product.stock}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        product.status === 'Active' 
                          ? 'bg-teal-500/20 text-teal-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button className="text-gray-400 hover:text-white transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default ProductList; 