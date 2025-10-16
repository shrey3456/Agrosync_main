import React from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, Shield, Users, Leaf, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

const About = () => {
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
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const cardVariants = {
    hover: {
      scale: 1.05,
      rotateY: 10,
      rotateX: 5,
      transition: { duration: 0.3 }
    }
  };

  const values = [
    {
      icon: Shield,
      title: "Trust & Transparency",
      description: "Blockchain-verified certificates ensure complete transparency in the supply chain."
    },
    {
      icon: Leaf,
      title: "Sustainability",
      description: "Promoting organic and natural farming practices for a healthier planet."
    },
    {
      icon: Users,
      title: "Community First",
      description: "Connecting farmers directly with consumers, building stronger communities."
    }
  ];

  const achievements = [
    { number: "10,000+", label: "Farmers Connected" },
    { number: "50,000+", label: "Products Verified" },
    { number: "25+", label: "States Covered" },
    { number: "99.9%", label: "Verification Accuracy" }
  ];

  return (
    
  <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a] text-green-200 dark:text-white transition-colors duration-300">
      {/* Hero Section */}
      <Navbar />
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="py-20 relative overflow-hidden bg-gradient-to-b from-[#0c1816] to-[#0b1f1a]"
      >
        <div className="absolute inset-0 bg-center opacity-10 dark:opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-20 ">
          <motion.div variants={itemVariants} className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-green-200 dark:text-white">
              <span className="text-green-400 dark:text-lime-300 font-extrabold">About </span>
              <span className="text-blue-400 dark:text-cyan-300 font-extrabold">Krushi Setu</span>
            </h1>
            <p className="text-xl text-gray-100 dark:text-white max-w-3xl mx-auto font-semibold drop-shadow">
              Revolutionizing agriculture through blockchain technology, connecting farmers 
              and consumers in a transparent, verified marketplace for natural products.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Mission & Vision */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div variants={itemVariants} className="space-y-8">
              <div className="bg-gradient-to-br from-[#11291f] to-[#1a2a2c] p-8 rounded-2xl transform hover:scale-105 transition-transform duration-300">
                <Target className="h-12 w-12 text-green-400 mb-4" />
                <h2 className="text-3xl font-bold text-green-200 mb-4">Our Mission</h2>
                <p className="text-gray-100 leading-relaxed">
                  To empower farmers by providing them with a direct platform to sell their natural 
                  products while ensuring consumers receive authentic, verified organic produce through 
                  cutting-edge blockchain technology.
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-[#11291f] to-[#1a2a2c] p-8 rounded-2xl transform hover:scale-105 transition-transform duration-300">
                <Eye className="h-12 w-12 text-blue-400 mb-4" />
                <h2 className="text-3xl font-bold text-blue-200 mb-4">Our Vision</h2>
                <p className="text-gray-100 leading-relaxed">
                  To create a sustainable agricultural ecosystem where trust, transparency, and 
                  quality are guaranteed through technology, fostering a healthier future for all.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-900/40 to-blue-900/40 rounded-3xl transform -rotate-6"></div>
              <div className="relative bg-[#16231a]/80 p-8 rounded-3xl shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/4917821/pexels-photo-4917821.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Farmers working"
                  className="w-full h-64 object-cover rounded-2xl mb-6"
                />
                <h3 className="text-2xl font-bold text-green-200 mb-4">Empowering Agriculture</h3>
                <p className="text-gray-100">
                  Through innovative technology and community-driven solutions, we're building 
                  bridges between traditional farming and modern commerce.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Core Values */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-20 bg-gradient-to-br from-[#11291f] to-[#1a2a2c]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-green-200 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-100 max-w-2xl mx-auto">
              The principles that guide our mission to transform agriculture
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover="hover"
                className="bg-[#16231a]/80 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 transform-gpu perspective-1000"
              >
                <value.icon className="h-16 w-16 text-green-400 mb-6 mx-auto" />
                <h3 className="text-2xl font-bold text-green-200 mb-4 text-center">
                  {value.title}
                </h3>
                <p className="text-gray-100 text-center leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Achievements */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
  className="py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Our Impact</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Numbers that reflect our commitment to transforming agriculture
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center group"
              >
                <div className="bg-gradient-to-br from-[#11291f] to-[#1a2a2c] p-8 rounded-2xl transform group-hover:scale-110 transition-transform duration-300">
                  <div className="text-4xl font-bold text-green-400 mb-2">
                    {achievement.number}
                  </div>
                  <div className="text-gray-100 font-medium">
                    {achievement.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Technology Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
  className="py-20 bg-gradient-to-r from-[#11291f] to-[#1a2a2c]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div variants={itemVariants} className="text-green-200">
              <h2 className="text-4xl font-bold mb-6">Blockchain Technology</h2>
              <p className="text-xl mb-8 opacity-90">
                Our platform leverages blockchain technology to ensure complete transparency 
                and traceability in the agricultural supply chain.
              </p>
              <div className="space-y-4">
                {[
                  "Immutable certificate verification",
                  "Complete supply chain transparency",
                  "Secure farmer-consumer connections",
                  "Real-time product authentication"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                    <span className="text-lg">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-900/40 to-blue-900/40 rounded-3xl transform rotate-6 backdrop-blur-sm"></div>
              <div className="relative bg-[#16231a]/80 p-8 rounded-3xl border border-white/10">
                <img
                  src="https://images.pexels.com/photos/5980889/pexels-photo-5980889.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Technology"
                  className="w-full h-64 object-cover rounded-2xl"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default About;