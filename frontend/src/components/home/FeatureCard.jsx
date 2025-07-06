import React from "react";
import { motion } from "framer-motion";
import StarBorder from "../common/StarBorder";

const FeatureCard = ({ icon, title, description, itemScope, itemType, itemProp }) => (
  <motion.div
    whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(33, 150, 243, 0.5)" }}
    className="transition-all duration-300 flex flex-col items-center text-center h-full rounded-[20px] overflow-hidden"
    itemScope={itemScope}
    itemType={itemType}
    itemProp={itemProp}
  >
    <StarBorder className="w-full h-full group" color="#38bdf8" speed="5s" thickness={2}>
      <div className="mb-4 text-white w-full flex items-center justify-center" itemProp="image">
        <div className="mx-auto">{icon}</div>
      </div>
      <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-blue-400 to-blue-500 text-transparent bg-clip-text" itemProp="name">
        {title}
      </h3>
      <p className="text-gray-300 text-sm leading-relaxed" itemProp="description">
        {description}
      </p>
      <meta itemProp="url" content={window.location.href} />
    </StarBorder>
  </motion.div>
);

export default FeatureCard; 