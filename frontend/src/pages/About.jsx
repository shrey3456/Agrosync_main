import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import {
  Users,
  Leaf,
  Shield,
  BarChart3,
  Award,
  Target,
  Heart,
  Globe,
} from "lucide-react";

function About() {
  const stats = [
    {
      icon: Users,
      count: "1000+",
      label: "Active Farmers",
    },
    {
      icon: Leaf,
      count: "5000+",
      label: "Organic Products",
    },
    {
      icon: Shield,
      count: "98%",
      label: "Customer Satisfaction",
    },
    {
      icon: BarChart3,
      count: "₹50Cr+",
      label: "Annual Transactions",
    },
  ];

  const values = [
    {
      icon: Award,
      title: "Quality First",
      description:
        "We maintain the highest standards in organic farming and product quality.",
    },
    {
      icon: Target,
      title: "Sustainability",
      description:
        "Our practices ensure long-term environmental and economic sustainability.",
    },
    {
      icon: Heart,
      title: "Farmer Welfare",
      description:
        "We prioritize the well-being and growth of our farming community.",
    },
    {
      icon: Globe,
      title: "Global Reach",
      description:
        "Connecting farmers with customers worldwide through technology.",
    },
  ];

  const team = [
    {
      name: "Shrey Patel",
      role: "Backend Developer",
      image: "/team1.jpg",
    },
    {
      name: "Shiv Patel",
      role: "Frontend Developer",
      image: "/shiv.jpg",
    },
    {
      name: "Parth Patel",
      role: "DevOPS Engineer",
      image: "/parth.jpg",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a]">
      <Navbar />
      <div className="pt-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="font-serif text-4xl font-bold tracking-tighter text-green-900 dark:text-teal-50 mb-4">
              About AgroSync
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Bridging the gap between traditional farming and modern technology
              for a sustainable future.
            </p>
          </motion.div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20 text-center"
                >
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-lg bg-green-100 dark:bg-teal-900/50">
                      <Icon className="w-6 h-6 text-green-600 dark:text-teal-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-green-900 dark:text-teal-50 mb-2">
                    {stat.count}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Mission Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-green-200/20 dark:border-teal-800/20"
            >
              <h2 className="font-serif text-3xl font-bold tracking-tighter text-green-900 dark:text-teal-50 mb-6">
                Our Mission
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                At KrushiSetu, we're dedicated to revolutionizing agriculture
                through technology. Our mission is to create a sustainable
                ecosystem where farmers can thrive while delivering high-quality
                organic products to consumers.
              </p>
              <ul className="space-y-4">
                {[
                  "Promoting sustainable farming practices",
                  "Ensuring fair compensation for farmers",
                  "Building trust through transparency",
                  "Fostering innovation in agriculture",
                ].map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 text-gray-600 dark:text-gray-300"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-teal-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
            </motion.div>
          </div>

          {/* Values Section */}
          <div className="mb-16">
            <h2 className="font-serif text-3xl font-bold tracking-tighter text-green-900 dark:text-teal-50 text-center mb-12">
              Our Core Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20 text-center"
                  >
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-lg bg-green-100 dark:bg-teal-900/50">
                        <Icon className="w-6 h-6 text-green-600 dark:text-teal-400" />
                      </div>
                    </div>
                    <h3 className="font-serif text-xl font-bold tracking-tighter text-green-900 dark:text-teal-50 mb-2">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {value.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Team Section */}
          <div>
            <h2 className="font-serif text-3xl font-bold tracking-tighter text-green-900 dark:text-teal-50 text-center mb-12">
              Meet Our Team
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-green-200/20 dark:border-teal-800/20"
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="font-serif text-xl font-bold tracking-tighter text-green-900 dark:text-teal-50 mb-1">
                      {member.name}
                    </h3>
                    <p className="text-green-600 dark:text-teal-400 mb-3">
                      {member.role}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      {member.bio}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;