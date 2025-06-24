import React from "react";
import { motion } from "framer-motion";

const FeatureCard = ({ icon, title, description, itemScope, itemType, itemProp }) => (
  <motion.div
    whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(33, 150, 243, 0.5)" }}
    className="bg-[#0B1122] bg-opacity-95 backdrop-blur-md p-6 rounded-2xl shadow-xl transition-all duration-300 flex flex-col items-center text-center h-full"
    itemScope={itemScope}
    itemType={itemType}
    itemProp={itemProp}
  >
    <div className="mb-4 text-white" itemProp="image">{icon}</div>
    <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-blue-400 to-blue-500 text-transparent bg-clip-text" itemProp="name">
      {title}
    </h3>
    <p className="text-gray-300 text-sm leading-relaxed" itemProp="description">
      {description}
    </p>
    <meta itemProp="url" content={window.location.href} />
    {/* Add more structured data properties as needed */}
  </motion.div>
);

export default FeatureCard; 