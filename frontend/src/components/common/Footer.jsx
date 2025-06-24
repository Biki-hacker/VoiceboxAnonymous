import React from "react";
import { Link } from "react-router-dom";
import threadsLogo from '../../assets/threads-seeklogo.svg';

const Footer = () => (
  <footer className="py-8 bg-[#0A0F1F]/50 backdrop-blur-sm relative z-10 pointer-events-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Footer Content */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <p className="text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Voicebox Anonymous. All rights reserved.
        </p>
        <p className="mt-4 md:mt-0 text-sm text-gray-500 flex items-center">
          <span>Powered by</span>
          <span className="ml-1 font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-300">Nexlify Studios</span>
        </p>
      </div>
      {/* Footer Links and Social Icons */}
      <div className="w-full border-t border-gray-800/50 pt-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex space-x-6 mb-4 md:mb-0">
            <Link to="/terms-and-policy#terms" className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200">
              Terms of Service
            </Link>
            <Link to="/terms-and-policy#privacy" className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200">
              Privacy Policy
            </Link>
          </div>
          <div className="flex items-center space-x-4 md:space-x-6 relative z-20">
            <a 
              href="https://www.instagram.com/nexlifystudios/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-pink-500 transition-colors duration-200 relative z-10"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.415-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.415-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
            </a>
            <a 
              href="https://www.threads.com/@nexlifystudios/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-black transition-colors duration-200 relative z-10"
              aria-label="Threads"
            >
              <img src={threadsLogo} alt="Threads" className="w-5 h-5 md:w-6 md:h-6" />
            </a>
            <a 
              href="https://x.com/NexlifyStudios/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-blue-400 transition-colors duration-200 relative z-10"
              aria-label="X (formerly Twitter)"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
