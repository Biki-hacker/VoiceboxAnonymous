import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import vblogo1 from '../assets/vblogo1.webp';

const TermsPolicy = () => {
  const [activeTab, setActiveTab] = useState('terms');
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [hoverOffset, setHoverOffset] = useState({ x: 0, y: 0 });
  
  // Handle URL hash changes and set active tab
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'privacy' || hash === 'terms') {
        setActiveTab(hash);
        window.scrollTo(0, 0);
      }
    };
    
    // Check initial hash
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  // Update URL hash when activeTab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      setCursorPos({ x, y });
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dist = Math.hypot(x - cx, y - cy);
      setGlowIntensity(1 - Math.min(dist / (window.innerWidth * 0.4), 1));
      setHoverOffset({ x: x - cx, y: y - cy });
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: 'easeInOut' }
    },
    exit: { 
      opacity: 0, 
      y: -10,
      transition: { duration: 0.2, ease: 'easeInOut' }
    }
  };

  const tabs = [
    { id: 'terms', label: 'Terms of Service' },
    { id: 'privacy', label: 'Privacy Policy' }
  ];

  const content = {
    terms: (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <ShieldCheckIcon className="w-8 h-8 text-blue-400" />
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">
            Terms of Service
          </h2>
        </div>
        
        <p className="text-gray-300 leading-relaxed">
          Welcome to Voicebox Anonymous. By accessing or using our service, you agree to be bound by these terms.
        </p>
        
        <h3 className="text-xl font-semibold mt-8 text-blue-300">1. Use of Service</h3>
        <p className="text-gray-300 leading-relaxed">
          Our service allows employees to provide anonymous feedback. You agree to use the service only for lawful purposes and in accordance with these Terms.
        </p>
        
        <h3 className="text-xl font-semibold mt-6 text-blue-300">2. User Conduct</h3>
        <p className="text-gray-300">
          You agree not to use the service to:
        </p>
        <ul className="list-disc pl-6 text-gray-300 space-y-2 mt-2">
          <li>Post any content that is unlawful, harmful, or offensive</li>
          <li>Impersonate any person or entity</li>
          <li>Engage in any activity that interferes with the service</li>
          <li>Violate any applicable laws or regulations</li>
        </ul>
      </div>
    ),
    privacy: (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <ShieldCheckIcon className="w-8 h-8 text-blue-400" />
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">
            Privacy Policy
          </h2>
        </div>
        
        <p className="text-gray-300 leading-relaxed">
          Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.
        </p>
        
        <h3 className="text-xl font-semibold mt-8 text-blue-300">1. Information We Collect</h3>
        <p className="text-gray-300 leading-relaxed">
          We collect information that you provide directly to us, such as when you create an account or submit feedback.
        </p>
        
        <h3 className="text-xl font-semibold mt-6 text-blue-300">2. How We Use Your Information</h3>
        <p className="text-gray-300">
          We use the information we collect to:
        </p>
        <ul className="list-disc pl-6 text-gray-300 space-y-2 mt-2">
          <li>Provide, maintain, and improve our services</li>
          <li>Process transactions and send related information</li>
          <li>Respond to your comments, questions, and requests</li>
          <li>Monitor and analyze usage and trends</li>
        </ul>
        
        <h3 className="text-xl font-semibold mt-6 text-blue-300">3. Data Security</h3>
        <p className="text-gray-300 leading-relaxed">
          We implement appropriate technical and organizational measures to protect your personal information.
          Your data is encrypted in transit and at rest, and we regularly update our security practices.
        </p>
      </div>
    )
  };

  return (
    <div 
      className="relative min-h-screen overflow-x-hidden flex flex-col"
      style={{ background: "linear-gradient(to bottom, #040b1d, #0a1224)" }}
    >
      {/* Animated cursor glow effect */}
      <motion.div
        className="fixed pointer-events-none z-20 mix-blend-screen"
        style={{ left: cursorPos.x, top: cursorPos.y, transform: "translate(-50%, -50%)", opacity: glowIntensity * 0.6 }}
        animate={{ background: ["radial-gradient(circle, rgba(135,206,250,0.4) 0%, rgba(135,206,250,0) 60%)", "radial-gradient(circle, rgba(33,150,243,0.4) 0%, rgba(33,150,243,0) 60%)"], scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: "mirror" }}
      >
        <div className="w-24 h-24 blur-[40px] rounded-full bg-blue-300/40" />
        <div className="w-16 h-16 blur-[30px] rounded-full bg-blue-400/40 absolute inset-0 m-auto" />
      </motion.div>

      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-6 z-30 relative">
        <Link to="/" className="flex items-center group">
          <div className="text-2xl font-extrabold tracking-widest flex items-center">
            <img src={vblogo1} alt="VoiceBox Logo" className="w-8 h-8 mr-3" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500 relative">
              Voicebox Anonymous
              <div className="absolute bottom-0 left-0 w-0 h-px bg-blue-400 group-hover:w-full transition-all duration-300" />
            </span>
          </div>
        </Link>
        <Link 
          to="/signin" 
          className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
        >
          Back to Home Page
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-4xl mx-auto">
          <div className="backdrop-blur-sm bg-white/5 rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50">
            {/* Tab Navigation */}
            <div className="bg-gray-900/50 p-1 border-b border-gray-700/50">
              <div className="flex justify-center space-x-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`relative px-6 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      activeTab === tab.id 
                        ? 'text-white' 
                        : 'text-gray-400 hover:text-blue-300'
                    }`}
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-blue-600/80 rounded-lg z-0"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="p-6 md:p-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {content[activeTab]}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          
          <div className="mt-8 text-center text-gray-400 text-sm">
            <p>Last updated: May 31, 2025</p>
            <p className="mt-2">© {new Date().getFullYear()} Voicebox Anonymous. All rights reserved.</p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm border-t border-gray-800/50">
        <div className="container mx-auto px-4">
          <p>Need help? <Link to="/?showContact=true" className="text-blue-400 hover:underline">Contact our support team</Link></p>
        </div>
      </footer>
    </div>
  );
};

export default TermsPolicy;
