import React from "react";
import { motion } from "framer-motion";
import shieldLogoWebp from "../../assets/shield-logo1r.webp";

const ShieldLogo = () => (
  <motion.div
    className="w-80 h-80 md:w-80 md:h-80 absolute right-4 top-[20%] transform -translate-y-[55%] z-10"
    animate={{ y: ["-5%", "5%", "-5%"] }}
    transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
  >
    <img
      src={shieldLogoWebp}
      alt="Shield Logo"
      className="w-full h-full object-contain"
      onError={(e) => {
        console.error("Failed to load shield-logo1.png, falling back to SVG.");
        e.target.outerHTML = `
          <svg width=\"100%\" height=\"100%\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">
            <path d=\"M12 2L4 6V12C4 17.5 7.8 22.7 12 23C16.2 22.7 20 17.5 20 12V6L12 2Z\" stroke=\"url(#shield-gradient-fallback)\" strokeWidth=\"2\" fill=\"rgba(33, 150, 243, 0.2)\" />
            <path d=\"M12 7L10 10L12 13L14 10L12 7Z\" fill=\"#2196F3\" /> <path d=\"M11 12L9 14L11 16L13 14L11 12Z\" fill=\"#2196F3\" /> <path d=\"M13 12L15 14L13 16L11 14L13 12Z\" fill=\"#2196F3\" />
            <defs><linearGradient id=\"shield-gradient-fallback\" x1=\"4\" y1=\"2\" x2=\"20\" y2=\"23\" gradientUnits=\"userSpaceOnUse\"><stop stopColor=\"#2196F3\" /><stop offset=\"1\" stopColor=\"#64B5F6\" /></linearGradient></defs>
          </svg>`;
      }}
    />
  </motion.div>
);

export default ShieldLogo; 