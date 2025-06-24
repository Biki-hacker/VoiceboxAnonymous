import React from "react";
import { motion } from "framer-motion";
import FeatureCard from "./FeatureCard";
import { ChatBubbleLeftRightIcon, LightBulbIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const features = [
  {
    icon: <ChatBubbleLeftRightIcon className="w-12 h-12 text-blue-400" />,
    title: "Anonymous Feedback Hub",
    description: "A secure space for employees to share honest feedback without fear of identification.",
    itemType: "https://schema.org/Service"
  },
  {
    icon: <LightBulbIcon className="w-12 h-12 text-blue-400" />,
    title: "Complaint & Suggestion Hub",
    description: "Voice concerns and suggestions that matter, with guaranteed anonymity and security.",
    itemType: "https://schema.org/Service"
  },
  {
    icon: <UserGroupIcon className="w-12 h-12 text-blue-400" />,
    title: "Public Discussion Space",
    description: "Engage in open discussions while maintaining complete anonymity among peers.",
    itemType: "https://schema.org/Service"
  },
  {
    icon: <ChartBarIcon className="w-12 h-12 text-blue-400" />,
    title: "Advanced Admin Dashboard",
    description: "Gain valuable insights with comprehensive analytics while preserving user anonymity.",
    itemType: "https://schema.org/Service"
  }
];

const FeaturesSection = () => (
  <motion.section
    id="features"
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
    className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 px-6 md:px-12 lg:px-16 py-16 md:py-24 z-10"
    itemScope
    itemType="https://schema.org/ItemList"
  >
    <h2 className="sr-only" itemProp="name">Key Features</h2>
    <meta itemProp="numberOfItems" content="4" />
    {features.map((feature, idx) => (
      <motion.div
        key={idx}
        variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}
        itemProp="itemListElement"
        itemScope
        itemType={feature.itemType}
      >
        <FeatureCard
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
          itemScope
          itemProp="item"
        />
      </motion.div>
    ))}
  </motion.section>
);

export default FeaturesSection; 