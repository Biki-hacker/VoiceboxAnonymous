import React from "react";
import { motion } from "framer-motion";
import FeatureCard from "./FeatureCard";
import { LockClosedIcon, ShieldCheckIcon, RocketLaunchIcon, ChartPieIcon } from '@heroicons/react/24/outline';

const aboutBenefits = [
  {
    icon: <LockClosedIcon className="w-12 h-12 text-blue-400" />,
    title: "End-to-End Encryption",
    description: "Your messages and feedback are secured with military-grade encryption"
  },
  {
    icon: <ShieldCheckIcon className="w-12 h-12 text-blue-400" />,
    title: "Total Anonymity",
    description: "No data leaks or identity exposure"
  },
  {
    icon: <RocketLaunchIcon className="w-12 h-12 text-blue-400" />,
    title: "Easy Setup",
    description: "Quick onboarding for admins and employees"
  },
  {
    icon: <ChartPieIcon className="w-12 h-12 text-blue-400" />,
    title: "Real Insights",
    description: "Advanced analytics without compromising privacy"
  }
];

const AboutSection = () => (
  <section id="about" className="px-6 md:px-16 lg:px-24 py-16 relative z-10">
    <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, delay: 0.1 }} className="text-3xl md:text-4xl font-bold mb-12 text-center text-white">Why Choose Us</motion.h2>
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.2,
            delayChildren: 0.2
          }
        }
      }}
      className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 px-0 sm:px-4"
    >
      {aboutBenefits.map((benefit, idx) => (
        <motion.div key={idx} variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
          <FeatureCard icon={benefit.icon} title={benefit.title} description={benefit.description} />
        </motion.div>
      ))}
    </motion.div>
  </section>
);

export default AboutSection; 