import { motion, useScroll, useTransform } from "framer-motion";
import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import {
  ArrowRight,
  CheckCircle,
  Leaf,
  Shield,
  Users,
  BarChart3,
  FileCheck,
} from "lucide-react";

function Home() {
  const targetRef = useRef(null);
  const featuresRef = useRef(null);
  const secondFeaturesRef = useRef(null);
  const navigate = useNavigate();

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const { scrollYProgress: featuresProgress } = useScroll({
    target: featuresRef,
    offset: ["start end", "end start"],
  });

  const { scrollYProgress: secondFeaturesProgress } = useScroll({
    target: secondFeaturesRef,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const featuresOpacity = useTransform(featuresProgress, [0, 0.3], [0, 1]);
  const featuresY = useTransform(featuresProgress, [0, 0.3], [100, 0]);
  const secondFeaturesOpacity = useTransform(
    secondFeaturesProgress,
    [0, 0.3],
    [0, 1]
  );
  const secondFeaturesY = useTransform(
    secondFeaturesProgress,
    [0, 0.3],
    [100, 0]
  );

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
      },
    },
  };

  const statsVariants = {
    initial: { scale: 0.5, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a]"
      ref={targetRef}
    >
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <section className="">
          <div className="absolute inset-0 bg-center opacity-10 dark:opacity-5"></div>
          <div className="container relative z-10 mx-auto px-4 md:px-6">
            <div className="grid gap-12 md:grid-cols-2 md:gap-16">
              <div className="flex flex-col justify-center space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="inline-flex items-center rounded-full border border-green-200 bg-white px-3 py-1 text-sm text-green-800 shadow-sm dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200">
                    <span>🌿 Trusted by 1000+ farmers</span>
                  </div>
                </motion.div>

                <motion.div
                  className="relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7 }}
                >
                  <h1 className="font-serif text-4xl font-bold tracking-tighter text-green-900 dark:text-teal-50 dark:text-enhance sm:text-5xl md:text-6xl">
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="block"
                    >
                      Connecting Farmers with Consumers directly
                      <span className="relative inline-block">
                        <span className="absolute -bottom-1 left-0 z-0 h-3 w-full bg-green-100 dark:bg-teal-900/50"></span>
                      </span>
                    </motion.span>
                  </h1>
                </motion.div>

                <motion.p
                  className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed tracking-wide max-w-lg font-medium"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  Our platform bridges the gap between traditional farming and
                  modern verification, creating trust through technology while
                  honoring agricultural heritage.
                </motion.p>
                <motion.div
                  className="flex flex-col gap-3 sm:flex-row"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                ></motion.div>

                <motion.div
                  className="flex items-center gap-4 pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.7 + i * 0.1 }}
                        className="inline-block h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-green-100 dark:border-green-950 dark:bg-green-800 shadow-sm"
                      >
                        <img
                          src={`/placeholder.svg?height=40&width=40&text=${i}`}
                          alt="User avatar"
                          className="h-full w-full object-cover"
                        />
                      </motion.div>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium text-green-800 dark:text-teal-400">
                      4.9/5
                    </span>{" "}
                    from over <span className="font-medium">1,200</span> reviews
                  </div>
                </motion.div>
              </div>

              <motion.div
                className="flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="relative h-[500px] w-full max-w-[600px] flex items-center justify-center overflow-hidden">
                  <motion.div
                    initial={{ x: 200, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative"
                  >
                    <img
                      src="/freepik__a-indian-woman-30-years-old-blonde-hair-pushing-a-__49817.png"
                      alt="Hero Image"
                      width={500}
                      height={500}
                      className="rounded-3xl relative z-10"
                    />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <motion.div
          ref={featuresRef}
          style={{ opacity: featuresOpacity, y: featuresY }}
          className="mt-32 mb-16"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              How AgroSync Works
            </h2>
            <motion.div
              initial={{ width: "0%" }}
              whileInView={{ width: "200px" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-1 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 mx-auto mt-4 rounded-full"
            ></motion.div>
            <p className="text-gray-300 mt-4 text-lg max-w-2xl mx-auto">
              AgroSync streamlines the connection between farmers and consumers, ensuring freshness, transparency, and smarter buying through technology.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 text-center"
          >
            {[
              {
                icon: "🌾",
                iconBg: "bg-gradient-to-br from-emerald-500/20 to-emerald-700/20",
                borderColor: "border-emerald-600/30",
                shadowColor: "shadow-emerald-500/10",
                title: "1. Farmer Registration & Product Upload",
                description:
                  "Farmers register and upload products with harvest dates, making them available to local consumers within 500 km.",
              },
              {
                icon: "📍",
                iconBg: "bg-gradient-to-br from-cyan-500/20 to-blue-700/20",
                borderColor: "border-blue-600/30",
                shadowColor: "shadow-blue-500/10",
                title: "2. Localized Marketplace",
                description:
                  "Consumers browse products, view nearby farmers, and place secure orders using Razorpay payment integration.",
              },
              {
                icon: "📈",
                iconBg: "bg-gradient-to-br from-amber-500/20 to-orange-700/20",
                borderColor: "border-orange-600/30",
                shadowColor: "shadow-orange-500/10",
                title: "3. Predictive Price Insights",
                description:
                  "A machine learning model predicts future produce prices, helping consumers make better buying decisions.",
              },
            ].map((step, index) => (
              <motion.div
                key={step.title}
                variants={cardVariants}
                whileHover="hover"
                className={`bg-gradient-to-b from-[#131722] to-[#1a202c] p-8 rounded-2xl border ${step.borderColor} hover:border-opacity-80 transition-all shadow-lg hover:shadow-2xl ${step.shadowColor}`}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className={`${step.iconBg} text-5xl mb-6 w-16 h-16 rounded-full flex items-center justify-center mx-auto`}
                >
                  {step.icon}
                </motion.div>
                <h3 className="font-semibold text-xl mb-3 text-gray-200">
                  {step.title}
                </h3>
                <p className="text-gray-400">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-12 mt-24"
          >
            {[
              {
                number: "10,000+",
                label: "Verified Farmers",
                gradient: "from-emerald-400 to-teal-500",
              },
              {
                number: "24 Hours",
                label: "Avg. Verification Time",
                gradient: "from-cyan-400 to-blue-500",
              },
              {
                number: "100%",
                label: "Data Security",
                gradient: "from-indigo-400 to-violet-500",
              },
              {
                number: "50+",
                label: "Countries Supported",
                gradient: "from-amber-400 to-orange-500",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={statsVariants}
                custom={index}
                className="text-center group bg-[#131722]/50 p-6 rounded-xl border border-gray-800/50 hover:border-gray-700/50 transition-all"
              >
                <motion.h3
                  className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
                  whileHover={{ scale: 1.1 }}
                >
                  {stat.number}
                </motion.h3>
                <p className="text-gray-400 mt-2 group-hover:text-gray-300 transition-colors">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}

export default Home;
