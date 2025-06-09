import React, { useState, useEffect, useRef } from 'react';
import { XCircleIcon } from '@heroicons/react/24/outline';

/**
 * MediaViewer - A reusable component for displaying images and videos in a modal
 * 
 * @param {Object} props - Component props
 * @param {string} props.mediaUrl - The URL of the media to display
 * @param {string} props.mediaType - The type of media ('image' or 'video')
 * @param {Function} props.onClose - Callback function when the viewer is closed
 * @returns {JSX.Element} The MediaViewer component
 */
const MediaViewer = ({ mediaUrl, mediaType, onClose }) => {
  const modalRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Close modal when clicking outside the content
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.log);
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="relative w-full h-full flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2"
          aria-label="Close media viewer"
        >
          <XCircleIcon className="h-8 w-8" />
        </button>
        
        <div 
          ref={modalRef} 
          className="relative max-w-full max-h-full flex items-center justify-center"
        >
          {mediaType === 'image' ? (
            <img
              src={mediaUrl}
              alt="Full size media"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <video
              src={mediaUrl}
              className="max-w-full max-h-[90vh]"
              controls
              autoPlay
              controlsList="nodownload"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaViewer;
