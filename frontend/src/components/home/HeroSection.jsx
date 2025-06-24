import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ShieldLogo from "./ShieldLogo";

const HeroSection = React.forwardRef(({ controls, typedText }, ref) => (
  <section
    ref={ref}
    className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24 z-10 mt-12 md:mt-16 lg:mt-20 relative pb-10"
    itemScope
    itemType="https://schema.org/WebApplication"
  >
    <div className="hidden md:block">
      <ShieldLogo />
    </div>
    <div className="max-w-xl lg:max-w-2xl">
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={controls}
        variants={{
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, delay: 0.2 },
          },
        }}
        className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white"
        itemProp="name"
      >
        {typedText}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={controls}
        variants={{
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, delay: 0.4 },
          },
        }}
        className="text-gray-300 text-lg sm:text-xl max-w-md lg:max-w-xl mb-10 leading-relaxed"
        itemProp="description"
      >
        Empower Your Workforce with Honest Feedback, Complaints, and Suggestions—Completely Anonymous, Completely Secure.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={controls}
        variants={{
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, delay: 0.6 },
          },
        }}
        itemProp="potentialAction"
        itemScope
        itemType="https://schema.org/JoinAction"
      >
        <Link to="/signup" itemProp="target">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(33, 150, 243, 0.6)" }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-4 rounded-full text-white font-semibold text-lg shadow-lg transition-transform duration-150 ease-out"
            itemProp="name"
          >
            Get Started
          </motion.button>
        </Link>
      </motion.div>
    </div>
  </section>
));

export default HeroSection; 