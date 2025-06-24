import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    // Optionally reset form fields here if desired
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
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-[#0A1224] p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-lg relative text-white border border-blue-700"
            onClick={(e) => e.stopPropagation()}
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
                  rows="6" maxLength={maxWords * 7}
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

export default ContactModal; 