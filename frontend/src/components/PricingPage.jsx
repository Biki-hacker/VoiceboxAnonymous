import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckIcon, UserGroupIcon, RocketLaunchIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import AnimatedText from "./AnimatedText";

const PricingPage = () => {
  const plans = [
    {
      name: 'Free Plan',
      price: '₹0',
      period: '/month',
      features: [
        '1 Organization',
        '1 Admin',
        'Up to 25 employees',
        'Up to 250 posts & 500 comments per month',
        'Media upload limit: 10 MB per file',
        'Up to 125 posts & 250 comments deletion limit for admin per month',
        'Up to 10 posts and 20 comments deletion limit per employee per month',
        '30 AI summaries run per month',
      ],
      buttonText: 'Get Started',
      popular: false,
      highlight: '',
    },
    {
      name: 'Pro Plan',
      price: '₹599',
      period: '/month',
      features: [
        'Up to 2 organizations',
        'Up to 5 admins per organization',
        'Up to 600 posts & 1200 comments per organization per month',
        'Up to 100 employees per organization',
        'Media upload limit: 20MB per file',
        'Up to 80 posts & 160 comments deletion limit per admin per organization per month',
        'Up to 25 posts and 50 comments deletion limit per employee per organization per month',
        'Up to 100 AI summaries run per month per organization',
      ],
      buttonText: 'Start Free Trial',
      popular: true,
      highlight: 'Most Popular',
    },
    {
      name: 'Enterprise Plan',
      price: '₹2,499',
      period: '/month',
      features: [
        'Up to 5 organizations',
        'Up to 10 admins per organization',
        'Unlimited posts and comments',
        'Up to 500 employees per organization',
        'Media upload limit: 50 MB per file',
        'Up to 500 posts & 1000 comments deletion limit per admin per organization per month',
        'Up to 50 posts and 100 comments deletion limit per employee per organization per month',
        'Unlimited AI summaries run per month per organization',
        'Priority support by email',
      ],
      buttonText: 'Contact Sales',
      popular: false,
      highlight: 'Best for Teams',
    },
  ];

  return (
    <div className="relative overflow-x-hidden min-h-screen text-white flex flex-col bg-[#040b1d]">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-5" style={{ zIndex: 1 }}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDVMNSAwWk02IDRMNCA2Wk0tMSAxTDEgLTFaIiBzdHJva2U9IiMxMTEiIHN0cm9rZS13aWR0aD0iMSI+PC9wYXRoPgo8L3N2Zz4=')]"></div>
      </div>
      
      {/* Gradient overlays */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div className="absolute -right-64 -top-64 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/5 to-blue-700/5 blur-3xl"></div>
        <div className="absolute -left-64 -bottom-64 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-blue-400/5 to-indigo-500/5 blur-3xl"></div>
      </div>
      
      {/* Hero Section */}
      <section className="relative flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-24 pb-20 md:pt-32" style={{ position: 'relative', zIndex: 2 }}>
        
        <div className="container mx-auto relative z-10">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 mb-6 mx-auto shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5, transition: { duration: 0.1 } }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                x: 0 
              }}
              transition={{ delay: 0, type: 'spring', stiffness: 300, damping: 20 }}
            >
              <RocketLaunchIcon className="h-10 w-10 text-white" style={{ marginLeft: '1px' }} />
            </motion.div>
            
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-8 text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-300">
                Flexible Plans for Every Organization
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              style={{ marginTop: '0.5rem' }}
            >
              Choose the perfect plan that fits your organization's needs. Scale up as your team grows.
            </motion.p>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            marginLeft: '-18px' // Shifted more to the left
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="animate-bounce">
            <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 relative z-10"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="grid gap-8 md:grid-cols-3 mt-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative bg-[#0B1122] bg-opacity-90 backdrop-blur-md rounded-2xl p-8 border border-blue-900/30 transition-all duration-300 ${
                plan.popular ? 'ring-2 ring-blue-500/50 shadow-2xl shadow-blue-500/10' : 'hover:border-blue-500/50'
              }`}
              whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(59, 130, 246, 0.25)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg">
                    {plan.highlight}
                  </span>
                </div>
              )}
              {!plan.popular && plan.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg flex items-center">
                    <UserGroupIcon className="h-3.5 w-3.5 mr-1.5" /> {plan.highlight}
                  </span>
                </div>
              )}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-300">
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline justify-center">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="ml-1 text-lg font-medium text-gray-400">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Link
                  to={plan.buttonText === 'Contact Sales' ? '/?showContact=true' : '/signup'}
                  className={`w-full block text-center py-3 px-6 rounded-lg font-medium transition-all duration-300 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02]'
                      : 'bg-blue-900/30 text-blue-400 border border-blue-800/50 hover:bg-blue-900/50 hover:border-blue-700/70'
                  }`}
                >
                  {plan.buttonText}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-8 bg-[#0A0F1F]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Voicebox Anonymous. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200">
                Privacy Policy
              </a>
            </div>
            <p className="mt-4 md:mt-0 text-sm text-gray-500 flex items-center">
              <span>Powered by</span>
              <span className="ml-1 font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-300">Nexlify Studios</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;