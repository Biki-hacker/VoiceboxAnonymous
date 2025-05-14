import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, useAnimation, useInView, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import AnimatedText from "../components/AnimatedText"; // Assuming this path is correct

// Import the PNG logo for the animated shield
import shieldLogoPng from '../../src/assets/shield-logo1r.png'; // Ensure this path is correct for your project structure

// Shield Logo Component with floating animation
const ShieldLogo = () => (
  <motion.div
    className="w-80 h-80 md:w-80 md:h-80 absolute right-4 top-[20%] transform -translate-y-[55%] z-10" // Adjusted for slightly upward position
    animate={{ y: ["-5%", "5%", "-5%"] }} // Adjusted y animation for a bit more movement
    transition={{
      repeat: Infinity,
      duration: 3.5, // Slightly faster animation
      ease: "easeInOut"
    }}
  >
    <img
      src={shieldLogoPng}
      alt="Shield Logo"
      className="w-full h-full object-contain"
      onError={(e) => {
        console.error("Failed to load shield-logo1.png, falling back to SVG.");
        e.target.outerHTML = `
          <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2L4 6V12C4 17.5 7.8 22.7 12 23C16.2 22.7 20 17.5 20 12V6L12 2Z"
              stroke="url(#shield-gradient-fallback)"
              strokeWidth="2"
              fill="rgba(33, 150, 243, 0.2)"
            />
            <path d="M12 7L10 10L12 13L14 10L12 7Z" fill="#2196F3" />
            <path d="M11 12L9 14L11 16L13 14L11 12Z" fill="#2196F3" />
            <path d="M13 12L15 14L13 16L11 14L13 12Z" fill="#2196F3" />
            <defs>
              <linearGradient id="shield-gradient-fallback" x1="4" y1="2" x2="20" y2="23" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2196F3" />
                <stop offset="1" stopColor="#64B5F6" />
              </linearGradient>
            </defs>
          </svg>
        `;
      }}
    />
  </motion.div>
);

// Sparkles component
const Sparkles = React.memo(({ data, hoverOffset }) => (
  <motion.div
    className="fixed inset-0 pointer-events-none z-0" // z-0 to be behind content
    style={{
      transform: `translate(${hoverOffset.x * 0.02}px, ${hoverOffset.y * 0.02}px)`
    }}
  >
    {data.map((d, i) => (
      <motion.div
        key={i}
        className="absolute"
        initial={{ y: window.innerHeight + 100, x: d.startX, opacity: 0, scale: 0.5 }}
        animate={{
          y: -150,
          x: d.startX + d.driftX,
          opacity: [0, 1, 0],
          scale: [0.5, 1.2, 0.5],
        }}
        transition={{
          duration: d.duration,
          repeat: Infinity,
          repeatDelay: 0,
          ease: "linear",
        }}
        style={{
          background: `radial-gradient(circle, rgba(135,206,250,1) 0%, rgba(33,150,243,0.9) 50%, rgba(135,206,250,0) 100%)`,
          filter: `blur(${d.blur}px)`,
          width: "4px",
          height: "4px",
          borderRadius: "50%",
        }}
      />
    ))}
  </motion.div>
));

// Menu Button (Hamburger Icon)
const MenuButton = ({ isOpen, toggle }) => (
  <motion.button
    onClick={toggle}
    className="flex flex-col justify-center items-center z-50"
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    aria-label="Toggle menu"
    aria-expanded={isOpen}
  >
    <motion.div
      animate={isOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
      className="w-8 h-0.5 bg-white mb-2"
      transition={{ duration: 0.3 }}
    />
    <motion.div
      animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
      className="w-8 h-0.5 bg-white mb-2"
      transition={{ duration: 0.3 }}
    />
    <motion.div
      animate={isOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
      className="w-8 h-0.5 bg-white"
      transition={{ duration: 0.3 }}
    />
  </motion.button>
);

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => (
  <motion.div
    whileHover={{
      scale: 1.05,
      boxShadow: "0 0 20px rgba(33, 150, 243, 0.5)"
    }}
    className="bg-[#0B1122] bg-opacity-95 backdrop-blur-md p-6 rounded-2xl shadow-xl transition-all duration-300 flex flex-col items-center text-center h-full"
  >
    <div className="text-4xl mb-4 text-white">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-blue-400 to-blue-500 text-transparent bg-clip-text">
      {title}
    </h3>
    <p className="text-gray-300 text-sm leading-relaxed">
      {description}
    </p>
  </motion.div>
);

export default function Home() {
  const controls = useAnimation();
  const heroRef = useRef(null);
  const isInView = useInView(heroRef, { once: true, amount: 0.3 }); // Trigger when 30% in view

  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [hoverOffset, setHoverOffset] = useState({ x: 0, y: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [typedText, setTypedText] = useState("");
  const fullText = "Revolutionize Employee Feedback with Total Anonymity";

  const sparkleData = useMemo(
    () =>
      Array.from({ length: 30 }).map(() => ({
        startX: Math.random() * window.innerWidth,
        duration: 4 + Math.random() * 6,
        driftX: (Math.random() - 0.5) * 50,
        blur: Math.random() * 2 + 1,
      })),
    []
  );

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

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

  useEffect(() => {
    if (isInView) controls.start("visible");
  }, [controls, isInView]);

  useEffect(() => {
    let i = 0;
    const typeSpeed = 30; // ms
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i + 1));
      i++;
      if (i > fullText.length) clearInterval(interval); // Changed from >= to >
    }, typeSpeed);
    return () => clearInterval(interval);
  }, [fullText, controls]); // Added controls to re-trigger if hero becomes visible again

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const navLinks = [
    // Using href for potential same-page anchor links. Use `to` prop of Link for react-router routes
    { name: "Features", href: "#features" },
    { name: "About", href: "#about" }, // Assuming 'Why Choose Us' section is 'about'
    { name: "Contact", href: "#contact" },
  ];

  return (
    <div
      className="relative overflow-x-hidden min-h-screen text-white flex flex-col"
      style={{
        background: "linear-gradient(to bottom, #040b1d, #0a1224)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Sparkles data={sparkleData} hoverOffset={hoverOffset} />

      <motion.div
        className="fixed pointer-events-none z-20 mix-blend-screen" // z-index adjusted
        style={{
          left: cursorPos.x,
          top: cursorPos.y,
          transform: "translate(-50%, -50%)",
          opacity: glowIntensity * 0.6,
        }}
        animate={{
          background: [
            "radial-gradient(circle, rgba(135,206,250,0.4) 0%, rgba(135,206,250,0) 60%)",
            "radial-gradient(circle, rgba(33,150,243,0.4) 0%, rgba(33,150,243,0) 60%)",
          ],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: "mirror",
        }}
      >
        <div className="w-24 h-24 blur-[40px] rounded-full bg-blue-300/40" />
        <div className="w-16 h-16 blur-[30px] rounded-full bg-blue-400/40 absolute inset-0 m-auto" />
      </motion.div>

      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-6 z-30 relative">
        <Link to="/" className="flex items-center group" onClick={() => isMenuOpen && toggleMenu()}>
          <div className="text-2xl font-extrabold tracking-widest flex items-center relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="mr-2"
            >
              {/* SVG Logo for Navbar Text */}
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2L4 6V12C4 17.5 7.8 22.7 12 23C16.2 22.7 20 17.5 20 12V6L12 2Z"
                  stroke="url(#shield-gradient-nav)"
                  strokeWidth="2"
                  fill="rgba(33, 150, 243, 0.2)"
                />
                <path d="M12 7L10 10L12 13L14 10L12 7Z" fill="#2196F3" />
                <path d="M11 12L9 14L11 16L13 14L11 12Z" fill="#2196F3" />
                <path d="M13 12L15 14L13 16L11 14L13 12Z" fill="#2196F3" />
                <defs>
                  <linearGradient id="shield-gradient-nav" x1="4" y1="2" x2="20" y2="23" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#2196F3" />
                    <stop offset="1" stopColor="#64B5F6" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500 relative">
              Voicebox Anonymous
              <div className="absolute bottom-0 left-0 w-0 h-px bg-blue-400 group-hover:w-full transition-all duration-300" />
            </span>
          </div>
        </Link>

        <div className="z-50"> {/* Ensure menu button is above other elements */}
          <MenuButton isOpen={isMenuOpen} toggle={toggleMenu} />
        </div>
      </nav>

      {/* Menu (slide-in from right) - Reverted to original style */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }} // Adjusted duration and ease
              className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-[#080F1E] z-40 shadow-2xl flex flex-col" // max-w-sm for better responsiveness
            >
              <div className="flex flex-col h-full p-8 pt-16"> {/* Added more top padding */}
                <div className="mb-10 w-full"> {/* Increased margin-bottom */}
                  <Link to="/signin" className="w-full block" onClick={toggleMenu}>
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(33, 150, 243, 0.5)"}}
                      whileTap={{ scale: 0.95 }}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3.5 rounded-lg text-white font-medium text-base" // Adjusted padding and text size
                    >
                      Sign In
                    </motion.button>
                  </Link>
                </div>

                <div className="flex flex-col space-y-6">
                  {navLinks.map((link, idx) => (
                    <div key={idx} className="overflow-hidden">
                       {/* Using <a> for hash links, Link for router links */}
                      <a href={link.href} onClick={toggleMenu} className="block text-gray-200 hover:text-blue-400 text-lg">
                        <AnimatedText text={link.name} el="span" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-30" // backdrop-blur for effect
              onClick={toggleMenu}
            />
          </>
        )}
      </AnimatePresence>


      {/* Hero Section */}
      <section
        ref={heroRef}
        className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24 z-10 mt-12 md:mt-16 lg:mt-20 relative pb-10" // Increased top margin, added padding-bottom
      >
         {/* Shield Logo - Conditionally render on medium screens and up to avoid hero text overlap */}
        <div className="hidden md:block">
            <ShieldLogo />
        </div>

        <div className="max-w-xl lg:max-w-2xl"> {/* Adjusted max-width for text block */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }} // Slightly increased y
            animate={controls} // Uses controls from useInView
            variants={{
              visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.2 } }, // Added delay
            }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white"
          >
            {typedText}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={controls}
            variants={{
              visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.4 } }, // Added delay
            }}
            className="text-gray-300 text-lg sm:text-xl max-w-md lg:max-w-xl mb-10 leading-relaxed" // Adjusted text size and margin
          >
            Empower Your Workforce with Honest Feedback, Complaints, and Suggestions—Completely Anonymous, Completely Secure.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={controls}
            variants={{
              visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.6 } }, // Added delay
            }}
          >
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(33, 150, 243, 0.6)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-4 rounded-full text-white font-semibold text-lg shadow-lg transition-transform duration-150 ease-out"
              >
                Get Started
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <motion.section
        id="features"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{
          hidden: { opacity:0 }, // Added opacity for smoother entry
          visible: { opacity:1, transition: { staggerChildren: 0.2, delayChildren: 0.2 } } // Added delayChildren
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 md:px-16 lg:px-24 py-16 md:py-24 z-10"
      >
        {[
          { icon: "💬", title: "Anonymous Feedback Hub", description: "Submit feedback without revealing identity." },
          { icon: "❓", title: "Complaint & Suggestion Hub", description: "Voice complaints and offer suggestions anonymously." },
          { icon: "👥", title: "Public Discussion Space", description: "Engage in open, anonymous conversations." },
          { icon: "📊", title: "Advanced Admin Dashboard", description: "Monitor and manage feedback with powerful tools." }
        ].map((feature, idx) => (
          <motion.div
            key={idx}
            variants={{
              hidden: { opacity: 0, y: 50 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } // Adjusted ease
            }}
          >
            <FeatureCard
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          </motion.div>
        ))}
      </motion.section>

      {/* Why Choose Us Section */}
      <section id="about" className="px-6 md:px-16 lg:px-24 py-16 z-10">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, delay: 0.1 }} // Adjusted duration and delay
          className="text-3xl md:text-4xl font-bold mb-12 text-center text-white"
        >
          Why Choose Us
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: { opacity:0 },
            visible: { opacity:1, transition: { staggerChildren: 0.2, delayChildren: 0.2 } }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            { icon: "🛡️", title: "Total Anonymity", description: "No data leaks or identity exposure" },
            { icon: "⚙️", title: "Easy Setup", description: "Quick onboarding for admins and employees" },
            { icon: "📈", title: "Real Insights", description: "Advanced analytics without compromising privacy" }
          ].map((benefit, idx) => (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 50 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
              }}
            >
              <FeatureCard
                icon={benefit.icon}
                title={benefit.title}
                description={benefit.description}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="px-6 md:px-16 lg:px-24 py-16 z-10 text-center">
        <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold mb-8 text-white"
        >
            Contact Us
        </motion.h2>
        <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-gray-300 text-lg mb-10 max-w-xl mx-auto" // Increased margin-bottom
        >
            Have questions or want to get in touch? Reach out to us!
        </motion.p>
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.3 }}
        >
             <Link to="/contact-page">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(33, 150, 243, 0.6)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-4 rounded-full text-white font-semibold text-lg shadow-lg transition-transform duration-150 ease-out"
              >
                Send a Message
              </motion.button>
            </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.1 }} // Trigger when 10% visible
        transition={{ duration: 0.8 }} // Added transition
        className="text-center py-10 text-gray-400 text-sm backdrop-blur-md z-10 border-t border-gray-700 mt-auto" // Slightly darker border
      >
        &copy; {new Date().getFullYear()} Voicebox Anonymous. All rights reserved.
      </motion.footer>
    </div>
  );
}