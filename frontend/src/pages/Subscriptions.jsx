import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EnvelopeIcon, ArrowRightIcon, CreditCardIcon } from '@heroicons/react/24/outline';

const Subscriptions = ({ onContactClick }) => {
  const navigate = useNavigate();

  const handleContactClick = (e) => {
    e.preventDefault();
    // Navigate to home page with query parameter to show contact form
    navigate('/?showContact=true');
  };

  const handlePricingClick = () => {
    navigate('/pricing');
  };

  // Animation variants for container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  // Animation variants for children
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  // Animation for the card
  const cardVariants = {
    offscreen: {
      y: 100,
      opacity: 0
    },
    onscreen: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        bounce: 0.4,
        duration: 0.8
      }
    }
  };

  return (
    <motion.div 
      className="min-h-[80vh] flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div 
        className="w-full max-w-4xl"
        variants={containerVariants}
      >
        <motion.div 
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
          variants={cardVariants}
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="p-1 bg-gradient-to-r from-blue-500 to-indigo-600">
            <div className="p-8 bg-white">
              <motion.div 
                className="flex items-center justify-center mb-6"
                variants={itemVariants}
              >
                <div className="p-3 bg-blue-100 rounded-full">
                  <CreditCardIcon className="h-8 w-8 text-blue-600" />
                </div>
              </motion.div>
              
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                variants={itemVariants}
              >
                Payment Information
              </motion.h2>
              
              <motion.div 
                className="prose prose-lg text-gray-600 mb-8 text-left max-w-3xl mx-auto"
                variants={itemVariants}
              >
                <p className="leading-relaxed">
                  Since I am under 18 and do not have a PAN card, I am currently unable to create a Razorpay or any other payment gateway account. 
                  As of now, Voicebox Anonymous is just a showcase project and does not require live payment functionality. 
                </p>
                <p className="mt-4 text-gray-700 font-medium">
                  If you're interested in connecting with me regarding this project or any other technical topic, I'd love to hear from you!
                </p>
              </motion.div>
              
              <motion.div 
                className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center items-center mt-10"
                variants={itemVariants}
              >
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleContactClick}
                  className="group relative flex-1 sm:flex-none px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium text-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-200"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    <EnvelopeIcon className="h-5 w-5 mr-2" />
                    Contact Me
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.button>
                
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <span className="text-gray-500 text-sm sm:text-base">or check out the</span>
                  <motion.button
                    whileHover={{ x: 5 }}
                    onClick={handlePricingClick}
                    className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Subscription Plans <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </motion.button>
                </div>
              </motion.div>
              
              <motion.div 
                className="mt-8 text-center"
                variants={itemVariants}
              >
                <h3 className="text-lg font-medium text-gray-700 mb-4">Connect with me</h3>
                <div className="flex justify-center space-x-6">
                  <a 
                    href="https://www.linkedin.com/in/souvik-dhara-3a4bab336/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-600 transition-colors duration-300"
                    aria-label="LinkedIn"
                  >
                    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <a 
                    href="https://x.com/SouvikDhara84/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-400 transition-colors duration-300"
                    aria-label="Twitter (X)"
                  >
                    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a 
                    href="https://www.instagram.com/biksou84/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-pink-600 transition-colors duration-300"
                    aria-label="Instagram"
                  >
                    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12.001 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 text-center">
            <p className="text-sm text-gray-500">
              As of now, this is a demo project. No real payments are processed.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Subscriptions;
