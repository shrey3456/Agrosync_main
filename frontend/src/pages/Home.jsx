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
                  <h1 className="font-serif text-4xl font-bold tracking-tighter text-green-200 dark:text-white sm:text-5xl md:text-6xl">
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="block"
                    >
                      Verify with{' '}
                      <span className="text-green-400 dark:text-lime-300 font-extrabold">
                        Nature
                      </span>
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="block mt-2"
                    >
                      Secure with{' '}
                      <span className="text-blue-400 dark:text-cyan-300 font-extrabold">
                        Blockchain
                      </span>
                    </motion.span>
                  </h1>
                </motion.div>

                <motion.p
                  className="text-base text-gray-200 dark:text-white leading-relaxed tracking-wide max-w-lg font-semibold drop-shadow"
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
                  <div className="text-sm text-gray-200 dark:text-white">
                    <span className="font-medium text-green-400 dark:text-lime-300">
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
              How KrushiSetu Works
            </h2>
            <motion.div
              initial={{ width: "0%" }}
              whileInView={{ width: "200px" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-1 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 mx-auto mt-4 rounded-full"
            ></motion.div>
            <p className="text-gray-100 mt-4 text-lg max-w-2xl mx-auto">
              Our platform makes verification simple, secure, and transparent
              for everyone in the agricultural ecosystem.
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
                icon: "📄",
                iconBg:
                  "bg-gradient-to-br from-emerald-500/20 to-emerald-700/20",
                borderColor: "border-emerald-600/30",
                shadowColor: "shadow-emerald-500/10",
                title: "1. Document Submission",
                description:
                  "Farmers submit their credentials and certifications through our secure platform.",
              },
              {
                icon: "🔗",
                iconBg: "bg-gradient-to-br from-cyan-500/20 to-blue-700/20",
                borderColor: "border-blue-600/30",
                shadowColor: "shadow-blue-500/10",
                title: "2. Blockchain Verification",
                description:
                  "Our system verifies and secures the information on the blockchain for immutable proof.",
              },
              {
                icon: "🛒",
                iconBg: "bg-gradient-to-br from-amber-500/20 to-orange-700/20",
                borderColor: "border-orange-600/30",
                shadowColor: "shadow-orange-500/10",
                title: "3. Verified Marketplace",
                description:
                  "Consumers can shop with confidence knowing they're buying from verified authentic farmers.",
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

        <motion.div
          ref={secondFeaturesRef}
          style={{ opacity: secondFeaturesOpacity, y: secondFeaturesY }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-4"
            >
              <span className="inline-block px-5 py-2 rounded-full bg-gradient-to-r from-green-900/40 via-emerald-800/30 to-teal-700/40 text-sm font-medium text-emerald-100 backdrop-blur-sm border border-green-500/30 shadow-sm shadow-green-700/20 hover:shadow-green-500/30 hover:border-green-400/40 transition-all duration-300 select-none tracking-wide">
                <span className="mr-1.5 inline-block">🌱</span>
                Innovation for Agriculture
              </span>
            </motion.div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Bridging Nature and Technology
            </h2>
            <motion.div
              initial={{ width: "0%" }}
              whileInView={{ width: "200px" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-1 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 mx-auto mt-4 rounded-full"
            ></motion.div>
            <p className="mt-6 text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-300 md:text-xl">
              Combining traditional farming wisdom with modern blockchain
              technology for secure, transparent, and intuitive verification.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 relative"
          >
            {/* Decorative elements */}
            {/* <div className="absolute -z-10 inset-0 bg-gradient-to-b from-green-500/5 via-blue-500/5 to-purple-500/5 rounded-3xl blur-3xl"></div> */}

            {[
              {
                icon: "🌱",
                color: "green",
                bgGradient: "from-green-900/20 to-green-700/10",
                borderGradient: "from-green-700/30 to-green-500/20",
                hoverGradient: "hover:from-green-700/40 hover:to-green-500/30",
                glow: "shadow-green-500/20",
                title: "Sustainability Metrics",
                description:
                  "Monitor and showcase your farm's environmental impact and sustainable farming practices.",
              },
              {
                icon: "📑",
                color: "orange",
                bgGradient: "from-orange-900/20 to-orange-700/10",
                borderGradient: "from-orange-700/30 to-orange-500/20",
                hoverGradient:
                  "hover:from-orange-700/40 hover:to-orange-500/30",
                glow: "shadow-orange-500/20",
                title: "Document Verification",
                description:
                  "Securely upload and verify farming credentials with our advanced verification system.",
              },
              {
                icon: "🔒",
                color: "yellow",
                bgGradient: "from-amber-900/20 to-amber-700/10",
                borderGradient: "from-amber-700/30 to-amber-500/20",
                hoverGradient: "hover:from-amber-700/40 hover:to-amber-500/30",
                glow: "shadow-amber-500/20",
                title: "Blockchain Security",
                description:
                  "Your verification data is stored immutably on the blockchain, ensuring complete security and transparency.",
              },
              {
                icon: "💳",
                color: "blue",
                bgGradient: "from-blue-900/20 to-blue-700/10",
                borderGradient: "from-blue-700/30 to-blue-500/20",
                hoverGradient: "hover:from-blue-700/40 hover:to-blue-500/30",
                glow: "shadow-blue-500/20",
                title: "Digital Wallet",
                description:
                  "Manage your digital certificates and credentials securely in our integrated wallet system.",
              },
              {
                icon: "🏅",
                color: "purple",
                bgGradient: "from-purple-900/20 to-purple-700/10",
                borderGradient: "from-purple-700/30 to-purple-500/20",
                hoverGradient:
                  "hover:from-purple-700/40 hover:to-purple-500/30",
                glow: "shadow-purple-500/20",
                title: "Premium Certificates",
                description:
                  "Receive beautifully designed digital farming certificates that showcase your authentic credentials.",
              },
              {
                icon: "📊",
                color: "pink",
                bgGradient: "from-pink-900/20 to-pink-700/10",
                borderGradient: "from-pink-700/30 to-pink-500/20",
                hoverGradient: "hover:from-pink-700/40 hover:to-pink-500/30",
                glow: "shadow-pink-500/20",
                title: "Analytics Dashboard",
                description:
                  "Track your verification status and engagement with comprehensive real-time analytics.",
              },
            ].map((feature, index) => (
              <motion.div
                key={`${feature.title}-${index}`}
                variants={{
                  initial: {
                    opacity: 0,
                    y: 30,
                    rotateX: -15,
                  },
                  animate: {
                    opacity: 1,
                    y: 0,
                    rotateX: 0,
                    transition: {
                      type: "spring",
                      stiffness: 100,
                      damping: 12,
                      delay: index * 0.1,
                    },
                  },
                  hover: {
                    y: -8,
                    scale: 1.03,
                    transition: {
                      type: "spring",
                      stiffness: 400,
                      damping: 10,
                    },
                  },
                }}
                whileHover="hover"
                // style={{border:"2px solid red"}}
                className={`bg-gradient-to-b ${feature.bgGradient} p-7 rounded-2xl 
                 border border-transparent bg-opacity-80
                transition-all duration-300 shadow-lg hover:shadow-xl ${feature.glow}
                hover:border-gradient-to-r ${feature.borderGradient}
                transform perspective-1000 relative overflow-hidden group`}
              >
                {/* Background glow effect */}
                {/* <div
                  className={`absolute -inset-px bg-gradient-to-r ${feature.borderGradient} ${feature.hoverGradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm -z-10`}
                ></div> */}

                {/* Animated icon container */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: index * 0.1 + 0.2,
                  }}
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.borderGradient} flex items-center justify-center mb-6 shadow-sm transform rotate-3`}
                >
                  <div className="text-4xl">{feature.icon}</div>
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
                  className="font-semibold text-xl mb-3 text-gray-100"
                >
                  {feature.title}
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.4, duration: 0.6 }}
                  className="text-gray-300 text-sm leading-relaxed"
                >
                  {feature.description}
                </motion.p>

                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.7, delay: index * 0.1 + 0.5 }}
                  className="h-0.5 bg-gradient-to-r from-transparent via-gray-500/30 to-transparent w-full mt-5"
                ></motion.div>

                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-2 mt-4 text-sm text-gray-400 group-hover:text-gray-200 cursor-pointer transition-colors"
                >
                  <span>Learn more</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform group-hover:translate-x-1"
                  >
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                </motion.div>
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
