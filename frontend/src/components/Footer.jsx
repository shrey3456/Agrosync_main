import { motion } from "framer-motion";
import React from "react";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa";

const Footer = () => {
  const footerLinkVariants = {
    hover: {
      x: 5,
      color: "#2dd4bf",
      transition: { duration: 0.2 }
    }
  };

  const footerSections = [
    {
      title: "Platform",
      links: ["How It Works", "Pricing", "FAQ"]
    },
    {
      title: "Company",
      links: ["About Us", "Blog", "Careers"]
    },
    {
      title: "Legal",
      links: ["Privacy Policy", "Terms of Service", "Cookie Policy"]
    }
  ];

  return (
    <footer className="bg-[#0D1116] text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold">
              <span className="text-teal-400">Krushi</span> Setu
            </h2>
            <p className="text-gray-400 text-sm">
              Bridging trust between farmers and consumers through removing middlemen.
            </p>
            <div className="flex space-x-4">
              {[
                { icon: <FaTwitter />, link: "https://twitter.com" },
                { icon: <FaFacebookF />, link: "https://facebook.com" },
                { icon: <FaLinkedinIn />, link: "https://linkedin.com" },
                { icon: <FaInstagram />, link: "https://instagram.com" }
              ].map(({ icon, link }, index) => (
                <motion.a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, color: "#2dd4bf" }}
                  className="text-gray-400 hover:text-teal-400 transition-colors"
                >
                  <div className="w-8 h-8 border border-gray-700 rounded-full flex items-center justify-center">
                    {icon}
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Footer Sections */}
          {footerSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <motion.li key={link}>
                    <motion.a
                      href="#"
                      variants={footerLinkVariants}
                      whileHover="hover"
                      className="text-gray-400 hover:text-teal-400 transition-colors text-sm block"
                    >
                      {link}
                    </motion.a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 pt-8 border-t border-gray-800"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2025 Krushi Setu. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <motion.a
                href="#"
                variants={footerLinkVariants}
                whileHover="hover"
                className="text-gray-400 hover:text-teal-400 transition-colors text-sm"
              >
                Privacy Policy
              </motion.a>
              <motion.a
                href="#"
                variants={footerLinkVariants}
                whileHover="hover"
                className="text-gray-400 hover:text-teal-400 transition-colors text-sm"
              >
                Terms of Service
              </motion.a>
              <motion.a
                href="#"
                variants={footerLinkVariants}
                whileHover="hover"
                className="text-gray-400 hover:text-teal-400 transition-colors text-sm"
              >
                Cookie Settings
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
