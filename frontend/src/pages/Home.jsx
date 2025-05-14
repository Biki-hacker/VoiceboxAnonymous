import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, useAnimation, useInView, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import AnimatedText from "../components/AnimatedText"; // Assuming this path is correct

// Import the PNG logo for the animated shield
import shieldLogoPng from '../../src/assets/shield-logo1r.png'; // Ensure this path is correct

// Shield Logo Component
const ShieldLogo = () => (
  <motion.div
    className="w-80 h-80 md:w-80 md:h-80 absolute right-4 top-[20%] transform -translate-y-[55%] z-10"
    animate={{ y: ["-5%", "5%", "-5%"] }}
    transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
  >
    <img
      src={shieldLogoPng}
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

// Feature Card
const FeatureCard = ({ icon, title, description }) => (
  <motion.div
    whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(33, 150, 243, 0.5)" }}
    className="bg-[#0B1122] bg-opacity-95 backdrop-blur-md p-6 rounded-2xl shadow-xl transition-all duration-300 flex flex-col items-center text-center h-full"
  >
    <div className="text-4xl mb-4 text-white">{icon}</div>
    <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-blue-400 to-blue-500 text-transparent bg-clip-text">{title}</h3>
    <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
  </motion.div>
);

// Contact Modal Component
const ContactModal = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxWords = 200;

  const handleMessageChange = (e) => {
    const text = e.target.value;
    setMessage(text);
    const words = text.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("All fields are mandatory.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (wordCount > maxWords) {
      setError(`Message cannot exceed ${maxWords} words.`);
      return;
    }
    setError("");
    setIsSubmitting(true);
    await onSubmit({ name, email, message });
    setIsSubmitting(false);
    // Reset form on successful submission (or if onSubmit handles closing)
    // setName(""); setEmail(""); setMessage(""); setWordCount(0);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose} // Close on overlay click
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-[#0A1224] p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-lg relative text-white border border-blue-700"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Close contact form"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-semibold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">Contact Us</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-gray-300 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text" id="contact-name" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full px-3 py-2.5 bg-[#0F172A] border border-blue-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-gray-300 mb-1">Email <span className="text-red-500">*</span></label>
                <input
                  type="email" id="contact-email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-3 py-2.5 bg-[#0F172A] border border-blue-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500"
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-gray-300 mb-1">Message <span className="text-red-500">*</span></label>
                <textarea
                  id="contact-message" value={message} onChange={handleMessageChange} required
                  rows="6" maxLength={maxWords * 7} // Approx maxLength, word count is the true validator
                  className="w-full px-3 py-2.5 bg-[#0F172A] border border-blue-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 resize-none"
                  placeholder={`Your message (max ${maxWords} words)`}
                ></textarea>
                <p className={`text-xs mt-1 ${wordCount > maxWords ? 'text-red-500' : 'text-gray-400'}`}>
                  {wordCount}/{maxWords} words
                </p>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.05, boxShadow: isSubmitting ? "none" : "0 0 15px rgba(33, 150, 243, 0.5)"}}
                whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 rounded-lg text-white font-semibold text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


export default function Home() {
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

  useEffect(() => { if (isInView) controls.start("visible"); }, [controls, isInView]);

  useEffect(() => {
    let i = 0; const typeSpeed = 30;
    const interval = setInterval(() => { setTypedText(fullText.slice(0, i + 1)); i++; if (i > fullText.length) clearInterval(interval); }, typeSpeed);
    return () => clearInterval(interval);
  }, [fullText, controls]);

  useEffect(() => {
    if (isMenuOpen || isContactModalOpen) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = 'unset'; }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen, isContactModalOpen]);

  const navLinks = [
    { name: "Features", href: "#features" }, { name: "About", href: "#about" },
    // { name: "Contact", href: "#contact" }, // Will be handled by button now
  ];

  const handleContactFormSubmit = async (formData) => {
    setContactStatus("Sending...");
    try {
      // Replace with your actual backend API endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/mail/contact`, {

        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setContactStatus("Message sent successfully!");
        // Optionally clear form fields from ContactModal if not handled internally
        // For now, we just close it after a delay.
        setTimeout(() => {
          closeContactModal();
        }, 2000);
      } else {
        setContactStatus(result.message || "Failed to send message. Please try again.");
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
    >
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
          <div className="text-2xl font-extrabold tracking-widest flex items-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="mr-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L4 6V12C4 17.5 7.8 22.7 12 23C16.2 22.7 20 17.5 20 12V6L12 2Z" stroke="url(#shield-gradient-nav)" strokeWidth="2" fill="rgba(33, 150, 243, 0.2)" /><path d="M12 7L10 10L12 13L14 10L12 7Z" fill="#2196F3" /><path d="M11 12L9 14L11 16L13 14L11 12Z" fill="#2196F3" /><path d="M13 12L15 14L13 16L11 14L13 12Z" fill="#2196F3" /><defs><linearGradient id="shield-gradient-nav" x1="4" y1="2" x2="20" y2="23" gradientUnits="userSpaceOnUse"><stop stopColor="#2196F3" /><stop offset="1" stopColor="#64B5F6" /></linearGradient></defs></svg>
            </motion.div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500 relative">Voicebox Anonymous<div className="absolute bottom-0 left-0 w-0 h-px bg-blue-400 group-hover:w-full transition-all duration-300" /></span>
          </div>
        </Link>
        <div className="z-50"><MenuButton isOpen={isMenuOpen} toggle={toggleMenu} /></div>
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
                  {navLinks.map((link, idx) => ( <div key={idx} className="overflow-hidden"> <a href={link.href} onClick={toggleMenu} className="block text-gray-200 hover:text-blue-400 text-lg"><AnimatedText text={link.name} el="span" /></a> </div> ))}
                  {/* Add Contact to menu, opening modal */}
                   <div className="overflow-hidden">
                      <button onClick={() => { toggleMenu(); openContactModal();}} className="block text-gray-200 hover:text-blue-400 text-lg text-left w-full">
                        <AnimatedText text="Contact" el="span" />
                      </button>
                    </div>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-30" onClick={toggleMenu} />
          </>
        )}
      </AnimatePresence>

      <section ref={heroRef} className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24 z-10 mt-12 md:mt-16 lg:mt-20 relative pb-10">
        <div className="hidden md:block"><ShieldLogo /></div>
        <div className="max-w-xl lg:max-w-2xl">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={controls} variants={{ visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.2 } } }} className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">{typedText}</motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={controls} variants={{ visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.4 } } }} className="text-gray-300 text-lg sm:text-xl max-w-md lg:max-w-xl mb-10 leading-relaxed">Empower Your Workforce with Honest Feedback, Complaints, and Suggestions—Completely Anonymous, Completely Secure.</motion.p>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={controls} variants={{ visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.6 } } }}>
            <Link to="/signup"><motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(33, 150, 243, 0.6)" }} whileTap={{ scale: 0.95 }} className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-4 rounded-full text-white font-semibold text-lg shadow-lg transition-transform duration-150 ease-out">Get Started</motion.button></Link>
          </motion.div>
        </div>
      </section>

      <motion.section id="features" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={{ hidden: { opacity:0 }, visible: { opacity:1, transition: { staggerChildren: 0.2, delayChildren: 0.2 } } }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 md:px-16 lg:px-24 py-16 md:py-24 z-10">
        {[{ icon: "💬", title: "Anonymous Feedback Hub", description: "Submit feedback without revealing identity." },{ icon: "❓", title: "Complaint & Suggestion Hub", description: "Voice complaints and offer suggestions anonymously." },{ icon: "👥", title: "Public Discussion Space", description: "Engage in open, anonymous conversations." },{ icon: "📊", title: "Advanced Admin Dashboard", description: "Monitor and manage feedback with powerful tools." }].map((feature, idx) => ( <motion.div key={idx} variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}><FeatureCard icon={feature.icon} title={feature.title} description={feature.description} /></motion.div> ))}
      </motion.section>

      <section id="about" className="px-6 md:px-16 lg:px-24 py-16 z-10">
        <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, delay: 0.1 }} className="text-3xl md:text-4xl font-bold mb-12 text-center text-white">Why Choose Us</motion.h2>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={{ hidden: { opacity:0 }, visible: { opacity:1, transition: { staggerChildren: 0.2, delayChildren: 0.2 } } }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[{ icon: "🛡️", title: "Total Anonymity", description: "No data leaks or identity exposure" },{ icon: "⚙️", title: "Easy Setup", description: "Quick onboarding for admins and employees" },{ icon: "📈", title: "Real Insights", description: "Advanced analytics without compromising privacy" }].map((benefit, idx) => ( <motion.div key={idx} variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}><FeatureCard icon={benefit.icon} title={benefit.title} description={benefit.description} /></motion.div> ))}
        </motion.div>
      </section>

      <section id="contact" className="px-6 md:px-16 lg:px-24 py-16 z-10 text-center">
        <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, delay: 0.1 }} className="text-3xl md:text-4xl font-bold mb-8 text-white">Contact Us</motion.h2>
        <motion.p initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, delay: 0.2 }} className="text-gray-300 text-lg mb-10 max-w-xl mx-auto">Have questions or want to get in touch? Reach out to us!</motion.p>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, delay: 0.3 }}>
          {/* This button now opens the modal */}
          <motion.button
            onClick={openContactModal}
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(33, 150, 243, 0.6)" }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-4 rounded-full text-white font-semibold text-lg shadow-lg transition-transform duration-150 ease-out"
          >
            Send us a Message
          </motion.button>
        </motion.div>
      </section>

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={closeContactModal}
        onSubmit={handleContactFormSubmit}
      />
      {contactStatus && isContactModalOpen && ( // Display status message inside modal or near form
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg z-[60]">
             {contactStatus}
        </div>
      )}


      <motion.footer initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.8 }} className="text-center py-10 text-gray-400 text-sm backdrop-blur-md z-10 border-t border-gray-700 mt-auto">
        &copy; {new Date().getFullYear()} Voicebox Anonymous. All rights reserved.
      </motion.footer>
    </div>
  );
}