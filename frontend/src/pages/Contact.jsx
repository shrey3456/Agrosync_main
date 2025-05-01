import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Clock,
  MessageSquare,
} from "lucide-react";

function Contact() {
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
              Contact Us
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get in touch with us for any questions or support you need.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-green-200/20 dark:border-teal-800/20"
            >
              <h2 className="font-serif text-2xl font-bold tracking-tighter text-green-900 dark:text-teal-50 mb-6">
                Send us a Message
              </h2>
              <form className="space-y-6">
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-green-200/20 dark:border-teal-800/20 text-gray-900 dark:text-teal-50 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-teal-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-green-200/20 dark:border-teal-800/20 text-gray-900 dark:text-teal-50 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-teal-500"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-green-200/20 dark:border-teal-800/20 text-gray-900 dark:text-teal-50 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-teal-500 h-32"
                    placeholder="Your message"
                  ></textarea>
                </div>
                <button className="w-full flex items-center justify-center gap-2 bg-green-600 dark:bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-green-700 dark:hover:bg-teal-600 transition-colors">
                  <Send className="w-5 h-5" />
                  Send Message
                </button>
              </form>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-green-200/20 dark:border-teal-800/20">
                <h2 className="font-serif text-2xl font-bold tracking-tighter text-green-900 dark:text-teal-50 mb-6">
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-teal-900/50">
                      <Mail className="w-5 h-5 text-green-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-900 dark:text-teal-50">
                        Email
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        support@agrosync.com
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-teal-900/50">
                      <Phone className="w-5 h-5 text-green-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-900 dark:text-teal-50">
                        Phone
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        +1 (555) 123-4567
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-teal-900/50">
                      <MapPin className="w-5 h-5 text-green-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-900 dark:text-teal-50">
                        Address
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        123 Farm Street, Agriculture City, AC 12345
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-green-200/20 dark:border-teal-800/20">
                <h2 className="font-serif text-2xl font-bold tracking-tighter text-green-900 dark:text-teal-50 mb-6">
                  Business Hours
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-teal-900/50">
                      <Clock className="w-5 h-5 text-green-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-900 dark:text-teal-50">
                        Monday - Friday
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        9:00 AM - 6:00 PM
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-teal-900/50">
                      <MessageSquare className="w-5 h-5 text-green-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-900 dark:text-teal-50">
                        Support Hours
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        24/7 Online Support
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;