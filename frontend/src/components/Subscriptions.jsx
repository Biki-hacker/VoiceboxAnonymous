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
