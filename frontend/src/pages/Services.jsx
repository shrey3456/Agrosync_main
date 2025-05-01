import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import {
  Leaf,
  Shield,
  Users,
  BarChart3,
  FileCheck,
  ArrowRight,
} from "lucide-react";

function Services() {
  const services = [
    {
      icon: Leaf,
      title: "Organic Certification",
      description:
        "Get your farm certified as organic with our blockchain-based verification system.",
      features: [
        "Real-time verification",
        "Transparent process",
        "Digital certificates",
        "Marketplace access",
      ],
    },
    {
      icon: Shield,
      title: "Quality Assurance",
      description:
        "Ensure your products meet the highest quality standards with our verification system.",
      features: [
        "Quality metrics",
        "Regular inspections",
        "Performance tracking",
        "Compliance reports",
      ],
    },
    {
      icon: Users,
      title: "Farmer Community",
      description:
        "Connect with other farmers and share knowledge in our community platform.",
      features: [
        "Knowledge sharing",
        "Best practices",
        "Community events",
        "Expert guidance",
      ],
    },
    {
      icon: BarChart3,
      title: "Market Analytics",
      description:
        "Access detailed market insights and analytics to optimize your farming decisions.",
      features: [
        "Price trends",
        "Demand analysis",
        "Competition insights",
        "Market forecasts",
      ],
    },
    {
      icon: FileCheck,
      title: "Documentation",
      description:
        "Keep all your farm documentation organized and easily accessible.",
      features: [
        "Digital records",
        "Compliance docs",
        "Certificates",
        "Transaction history",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a]">
      <Navbar />
      <div className="pt-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="font-serif text-4xl font-bold tracking-tighter text-green-900 dark:text-teal-50 mb-4">
              Our Services
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Comprehensive solutions for modern farming, from certification to market
              analytics.
            </p>
          </motion.div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20 hover:border-green-300/30 dark:hover:border-teal-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-teal-900/50">
                      <Icon className="w-6 h-6 text-green-600 dark:text-teal-400" />
                    </div>
                    <h3 className="font-serif text-xl font-bold tracking-tighter text-green-900 dark:text-teal-50">
                      {service.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {service.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
                      >
                        <ArrowRight className="w-4 h-4 text-green-600 dark:text-teal-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full flex items-center justify-center gap-2 bg-green-600 dark:bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-teal-600 transition-colors">
                    Learn More
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Services;