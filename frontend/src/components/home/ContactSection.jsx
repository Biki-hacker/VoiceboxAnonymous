import React from "react";
import { motion } from "framer-motion";
import ContactModal from "../ContactModal";

const ContactSection = ({
  isContactModalOpen,
  openContactModal,
  closeContactModal,
  handleContactFormSubmit,
  contactStatus,
}) => (
  <>
    <section id="contact" className="px-6 md:px-16 lg:px-24 py-16 z-10 text-center">
      <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, delay: 0.1 }} className="text-3xl md:text-4xl font-bold mb-8 text-white">Contact Us</motion.h2>
      <motion.p initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, delay: 0.2 }} className="text-gray-300 text-lg mb-10 max-w-xl mx-auto">Have questions or want to get in touch? Reach out to us!</motion.p>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, delay: 0.3 }}>
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
    {contactStatus && isContactModalOpen && (
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg z-[60]">
        {contactStatus}
      </div>
    )}
  </>
);

export default ContactSection; 