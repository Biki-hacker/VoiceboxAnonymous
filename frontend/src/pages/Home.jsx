import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, useAnimation, useInView, AnimatePresence } from "framer-motion";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from 'react-helmet';
import threadsLogo from '../assets/threads-seeklogo.svg';
import AnimatedText from "../components/home/AnimatedText";
import TestimonialOrbit from "../components/home/TestimonialOrbit";
import HeroSection from "../components/home/HeroSection";
import ContactSection from "../components/home/ContactSection";
import FeaturesSection from "../components/home/FeaturesSection";
import AboutSection from "../components/home/AboutSection";
import Footer from "../components/common/Footer";

// Structured data for the homepage
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Voicebox Anonymous",
  "description": "Secure anonymous feedback platform for employees to voice concerns and suggestions without fear of identification.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "125"
  },
  "creator": {
    "@type": "Organization",
    "name": "Voicebox Anonymous",
    "url": "http://localhost:5173"
  }
};

// Import the PNG logo for the animated shield
import shieldLogoWebp from '../../src/assets/shield-logo1r.webp'; // Ensure this path is correct
import vblogo from '../../src/assets/vblogo1.webp';

// Shield Logo Component
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
          <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L4 6V12C4 17.5 7.8 22.7 12 23C16.2 22.7 20 17.5 20 12V6L12 2Z" stroke="url(#shield-gradient-fallback)" strokeWidth="2" fill="rgba(33, 150, 243, 0.2)" />
            <path d="M12 7L10 10L12 13L14 10L12 7Z" fill="#2196F3" /> <path d="M11 12L9 14L11 16L13 14L11 12Z" fill="#2196F3" /> <path d="M13 12L15 14L13 16L11 14L13 12Z" fill="#2196F3" />
            <defs><linearGradient id="shield-gradient-fallback" x1="4" y1="2" x2="20" y2="23" gradientUnits="userSpaceOnUse"><stop stopColor="#2196F3" /><stop offset="1" stopColor="#64B5F6" /></linearGradient></defs>
          </svg>`;
      }}
    />
  </motion.div>
);

// Sparkles component
const Sparkles = React.memo(({ data, hoverOffset }) => (
  <motion.div
    className="fixed inset-0 pointer-events-none z-0"
    style={{ transform: `translate(${hoverOffset.x * 0.02}px, ${hoverOffset.y * 0.02}px)` }}
  >
    {data.map((d, i) => (
      <motion.div
        key={i} className="absolute"
        initial={{ y: window.innerHeight + 100, x: d.startX, opacity: 0, scale: 0.5 }}
        animate={{ y: -150, x: d.startX + d.driftX, opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
        transition={{ duration: d.duration, repeat: Infinity, repeatDelay: 0, ease: "linear" }}
        style={{ background: `radial-gradient(circle, rgba(135,206,250,1) 0%, rgba(33,150,243,0.9) 50%, rgba(135,206,250,0) 100%)`, filter: `blur(${d.blur}px)`, width: "4px", height: "4px", borderRadius: "50%" }}
      />
    ))}
  </motion.div>
));

// Menu Button
const MenuButton = ({ isOpen, toggle }) => (
  <motion.button
    onClick={toggle} className="flex flex-col justify-center items-center z-50"
    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
    aria-label="Toggle menu" aria-expanded={isOpen}
  >
    <motion.div animate={isOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }} className="w-8 h-0.5 bg-white mb-2" transition={{ duration: 0.3 }} />
    <motion.div animate={isOpen ? { opacity: 0 } : { opacity: 1 }} className="w-8 h-0.5 bg-white mb-2" transition={{ duration: 0.3 }} />
    <motion.div animate={isOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }} className="w-8 h-0.5 bg-white" transition={{ duration: 0.3 }} />
  </motion.button>
);

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const controls = useAnimation();
  const heroRef = useRef(null);
  const isInView = useInView(heroRef, { once: true, amount: 0.3 });

  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [hoverOffset, setHoverOffset] = useState({ x: 0, y: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false); // New state for contact modal
  const [typedText, setTypedText] = useState("");
  const [contactStatus, setContactStatus] = useState(""); // For success/error messages after send
  const fullText = "Revolutionize Employee Feedback with Total Anonymity";

  // Handle smooth scrolling to sections
  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80, // Adjust for header height
        behavior: 'smooth'
      });
      // Close mobile menu if open
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
    }
  };

  const sparkleData = useMemo(() => Array.from({ length: 30 }).map(() => ({
    startX: Math.random() * window.innerWidth, duration: 4 + Math.random() * 6,
    driftX: (Math.random() - 0.5) * 50, blur: Math.random() * 2 + 1,
  })), []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const openContactModal = () => setIsContactModalOpen(true);
  const closeContactModal = () => {
    setIsContactModalOpen(false);
    setContactStatus(""); // Clear status when closing
  }

  useEffect(() => {
    const onMouseMove = (e) => {
      const x = e.clientX; const y = e.clientY; setCursorPos({ x, y });
      const cx = window.innerWidth / 2; const cy = window.innerHeight / 2;
      const dist = Math.hypot(x - cx, y - cy);
      setGlowIntensity(1 - Math.min(dist / (window.innerWidth * 0.4), 1));
      setHoverOffset({ x: x - cx, y: y - cy });
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  // Handle scroll to section when navigating from other pages
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        // Small delay to ensure the DOM is fully rendered
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    };

    // Initial check
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => { if (isInView) controls.start("visible"); }, [controls, isInView]);

  useEffect(() => {
    let i = 0; const typeSpeed = 30;
    const interval = setInterval(() => { setTypedText(fullText.slice(0, i + 1)); i++; if (i > fullText.length) clearInterval(interval); }, typeSpeed);
    return () => clearInterval(interval);
  }, [fullText, controls]);

  // Check for showContact query parameter on component mount and URL changes
  useEffect(() => {
    const showContact = searchParams.get('showContact');
    if (showContact === 'true') {
      setIsContactModalOpen(true);
      // Remove the query parameter from the URL without refreshing the page
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('showContact');
      window.history.replaceState({}, '', `${window.location.pathname}?${newSearchParams.toString()}`);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isMenuOpen || isContactModalOpen) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = 'unset'; }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen, isContactModalOpen]);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "About", href: "#about" },
    { name: "Pricing", href: "/pricing" },
    // { name: "Contact", href: "#contact" }, // Will be handled by button now
  ];

  const handleContactFormSubmit = async (formData) => {
    setContactStatus("Sending...");
    try {
      // Replace with your actual backend API endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setContactStatus("Message sent successfully!");
        // Close modal after a delay
        setTimeout(() => {
          closeContactModal();
        }, 2000);
      } else {
        // Handle specific error cases
        if (response.status === 429) {
          setContactStatus("Too many messages sent. Please try again after 15 minutes.");
        } else {
          setContactStatus(result.message || "Failed to send message. Please try again.");
        }
      }
    } catch (error) {
      console.error("Contact form submission error:", error);
      setContactStatus("An error occurred. Please try again later.");
    }
  };


  return (
    <div
      className="relative overflow-x-hidden min-h-screen text-white flex flex-col"
      style={{ background: "linear-gradient(to bottom, #040b1d, #0a1224)", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
      itemScope
      itemType="https://schema.org/WebApplication"
    >
      {/* Structured Data */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <meta name="application-name" content="Voicebox Anonymous" />
        <meta name="apple-mobile-web-app-title" content="Voicebox" />
        <meta name="theme-color" content="#0B1122" />
      </Helmet>
      <Sparkles data={sparkleData} hoverOffset={hoverOffset} />
      <motion.div
        className="fixed pointer-events-none z-20 mix-blend-screen"
        style={{ left: cursorPos.x, top: cursorPos.y, transform: "translate(-50%, -50%)", opacity: glowIntensity * 0.6 }}
        animate={{ background: ["radial-gradient(circle, rgba(135,206,250,0.4) 0%, rgba(135,206,250,0) 60%)", "radial-gradient(circle, rgba(33,150,243,0.4) 0%, rgba(33,150,243,0) 60%)"], scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: "mirror" }}
      >
        <div className="w-24 h-24 blur-[40px] rounded-full bg-blue-300/40" />
        <div className="w-16 h-16 blur-[30px] rounded-full bg-blue-400/40 absolute inset-0 m-auto" />
      </motion.div>

      <nav className="flex justify-between items-center px-6 md:px-12 py-6 z-30 relative">
        <Link to="/" className="flex items-center group" onClick={() => isMenuOpen && toggleMenu()}>
          <div className="text-xl font-extrabold tracking-widest flex items-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="mr-3">
              <img src={vblogo} alt="VoiceBox Logo" width="32" height="32" />
            </motion.div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500 relative">Voicebox Anonymous<div className="absolute bottom-0 left-0 w-0 h-px bg-blue-400 group-hover:w-full transition-all duration-300" /></span>
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link, idx) => (
            <a 
              key={idx}
              href={link.href}
              onClick={(e) => link.href.startsWith('#') && scrollToSection(e, link.href.substring(1))}
              className="text-gray-300 hover:text-blue-400 transition-colors duration-200 font-medium cursor-pointer"
            >
              <AnimatedText text={link.name} el="span" size="sm" />
            </a>
          ))}
          <button 
            onClick={openContactModal}
            className="text-gray-300 hover:text-blue-400 transition-colors duration-200 font-medium"
          >
            <AnimatedText text="Contact" el="span" size="sm" />
          </button>
          <Link 
            to="/signin" 
            className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
          >
            Sign In
          </Link>
        </div>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden z-50">
          <MenuButton isOpen={isMenuOpen} toggle={toggleMenu} />
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
              className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-[#080F1E] z-40 shadow-2xl flex flex-col"
            >
              <div className="flex flex-col h-full p-8 pt-16">
                <div className="mb-10 w-full">
                  <Link to="/signin" className="w-full block" onClick={toggleMenu}>
                    <motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(33, 150, 243, 0.5)"}} whileTap={{ scale: 0.95 }} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3.5 rounded-lg text-white font-medium text-base">Sign In</motion.button>
                  </Link>
                </div>
                <div className="flex flex-col space-y-6">
                  {navLinks.map((link, idx) => ( 
                    <div key={idx} className="overflow-hidden"> 
                      <a 
                        href={link.href}
                        onClick={(e) => {
                          if (link.href.startsWith('#')) {
                            scrollToSection(e, link.href.substring(1));
                          } else {
                            toggleMenu();
                          }
                        }}
                        className="block text-gray-200 hover:text-blue-400 text-lg"
                      >
                        <AnimatedText text={link.name} el="span" size="base" />
                      </a> 
                    </div>
                  ))}
                  {/* Add Contact to menu, opening modal */}
                   <div className="overflow-hidden">
                      <button onClick={() => { toggleMenu(); openContactModal();}} className="block text-gray-200 hover:text-blue-400 text-lg text-left w-full">
                        <AnimatedText text="Contact" el="span" size="base" />
                      </button>
                    </div>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-30" onClick={toggleMenu} />
          </>
        )}
      </AnimatePresence>

      <HeroSection ref={heroRef} controls={controls} typedText={typedText} />

      <FeaturesSection />

      {/* Testimonials Section */}
      <section className="px-6 md:px-16 lg:px-24 pt-8 pb-0 relative z-20">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, amount: 0.2 }} 
            transition={{ duration: 0.7, delay: 0.1 }} 
            className="text-3xl md:text-4xl font-bold mb-2 md:mb-4 text-center text-white"
          >
            What Our Users Say
          </motion.h2>
          <div className="relative h-[600px] md:h-[700px] lg:h-[800px] -mb-12">
            <TestimonialOrbit />
          </div>
        </div>
      </section>

      <AboutSection />

      <ContactSection
        isContactModalOpen={isContactModalOpen}
        openContactModal={openContactModal}
        closeContactModal={closeContactModal}
        handleContactFormSubmit={handleContactFormSubmit}
        contactStatus={contactStatus}
      />

      <Footer />
    </div>
  );
}