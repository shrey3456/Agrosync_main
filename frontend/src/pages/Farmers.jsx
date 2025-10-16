import { motion } from 'framer-motion';
import React from 'react';
import Navbar from "../components/Navbar";
import Button from "../components/ui/Button";
import { Star, MapPin, Leaf, Award, CheckCircle } from 'lucide-react';

function Farmers() {
  const farmers = [
    {
      name: 'John Smith',
      location: 'California, USA',
      specialty: 'Organic Vegetables',
      image: 'https://placehold.co/300x300/1a332e/white?text=Farmer+1',
      rating: 4.8,
      verified: true,
      experience: '15 years',
      certifications: ['Organic Certified', 'GAP Certified']
    },
    {
      name: 'Mary Johnson',
      location: 'Texas, USA',
      specialty: 'Fresh Fruits',
      image: 'https://placehold.co/300x300/1a332e/white?text=Farmer+2',
      rating: 4.9,
      verified: true,
      experience: '12 years',
      certifications: ['Organic Certified', 'Fair Trade']
    },
    {
      name: 'Robert Davis',
      location: 'Oregon, USA',
      specialty: 'Free Range Eggs',
      image: 'https://placehold.co/300x300/1a332e/white?text=Farmer+3',
      rating: 4.7,
      verified: true,
      experience: '18 years',
      certifications: ['Animal Welfare Approved', 'Organic Certified']
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
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
                <Leaf className="w-8 h-8 text-teal-400" />
              </motion.div>
              <h2 className="text-4xl font-bold text-white sm:text-5xl mb-4">
                Verified Farmers
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Meet our trusted network of verified farmers who are committed to sustainable and ethical farming practices
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
            >
              {farmers.map((farmer, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  className="bg-[#2d4f47] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-teal-500/20"
                >
                  <div className="relative">
                    <img
                      src={farmer.image}
                      alt={farmer.name}
                      className="w-full h-64 object-cover"
                    />
                    {farmer.verified && (
                      <div className="absolute top-4 right-4 bg-teal-500/90 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Verified
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">{farmer.name}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-white">{farmer.rating}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-300 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{farmer.location}</span>
                    </div>

                    <div className="flex items-center gap-2 text-teal-400 mb-4">
                      <Award className="w-4 h-4" />
                      <span>{farmer.specialty}</span>
                    </div>

                    <div className="mb-6">
                      <p className="text-sm text-gray-400 mb-2">Experience: {farmer.experience}</p>
                      <div className="flex flex-wrap gap-2">
                        {farmer.certifications.map((cert, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-teal-500/10 text-teal-400 px-2 py-1 rounded-full"
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Button
                      className="w-full bg-teal-500 text-white hover:bg-teal-600 flex items-center justify-center gap-2"
                      onClick={() => console.log(`View profile of ${farmer.name}`)}
                    >
                      View Profile
                    </Button>
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

export default Farmers;