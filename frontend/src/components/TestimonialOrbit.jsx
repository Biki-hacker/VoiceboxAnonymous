import React, { useState, useRef, useEffect, useCallback } from "react";
import testimonials from "../assets/testimonials";
import logo from "../assets/vblogo1.webp";

const TestimonialOrbit = () => {
  const [angle, setAngle] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const dragRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startAngle = useRef(0);
  const rotationInterval = useRef(null);
  const lastRotationTime = useRef(Date.now());

  const radius = 180; // Slightly smaller radius for better visibility
  const center = 220; // Adjusted for better centering
  const rotationSpeed = 0.05; // Slower rotation speed for drag
  const autoRotateSpeed = 0.01; // Much slower auto-rotation

  // Calculate the position of each testimonial
  const getTestimonialPosition = (index, currentAngle) => {
    const total = testimonials.length;
    const angle = (Math.PI * 2 * index) / total + (currentAngle * Math.PI) / 180;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const zIndex = Math.round(Math.cos(angle) * 10) + 10;
    const scale = 0.7 + (Math.cos(angle) + 1) * 0.15;
    const opacity = 0.6 + (Math.cos(angle) + 1) * 0.2;
    
    return { x, y, zIndex, scale, opacity, theta: angle * (180 / Math.PI) };
  };

  // Handle mouse/touch events
  const handleStart = useCallback((clientX) => {
    isDragging.current = true;
    startX.current = clientX;
    startAngle.current = angle;
    setIsAutoRotating(false);
    if (rotationInterval.current) {
      clearInterval(rotationInterval.current);
      rotationInterval.current = null;
    }
  }, [angle]);

  const handleMove = useCallback((clientX) => {
    if (!isDragging.current) return;
    const deltaX = clientX - startX.current;
    const newAngle = startAngle.current + deltaX * rotationSpeed;
    setAngle(newAngle);
    updateActiveIndex(newAngle);
  }, []);

  const handleEnd = useCallback(() => {
    isDragging.current = false;
    setIsAutoRotating(true);
  }, []);

  // Update active index based on current angle
  const updateActiveIndex = useCallback((currentAngle) => {
    const total = testimonials.length;
    const normalizedAngle = ((currentAngle % 360) + 360) % 360; // Ensure positive angle
    const index = Math.round((normalizedAngle / 360) * total) % total;
    setActiveIndex(index);
  }, []);

  // Auto-rotation effect
  useEffect(() => {
    if (!isAutoRotating) return;

    let animationFrameId;
    let lastTime = Date.now();

    const rotate = () => {
      const now = Date.now();
      const deltaTime = now - lastTime;
      lastTime = now;

      setAngle(prevAngle => {
        const newAngle = prevAngle + autoRotateSpeed * deltaTime;
        updateActiveIndex(newAngle);
        return newAngle;
      });

      animationFrameId = requestAnimationFrame(rotate);
    };

    animationFrameId = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isAutoRotating, updateActiveIndex]);

  // Set up event listeners
  useEffect(() => {
    const handleMouseMove = (e) => handleMove(e.clientX);
    const handleTouchMove = (e) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    };
    const handleTouchStart = (e) => handleStart(e.touches[0].clientX);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      if (rotationInterval.current) {
        clearInterval(rotationInterval.current);
      }
    };
  }, [handleMove, handleStart, handleEnd]);

  // Handle logo glow effect when active index changes
  const [logoGlow, setLogoGlow] = useState(false);
  useEffect(() => {
    setLogoGlow(true);
    const timer = setTimeout(() => setLogoGlow(false), 1000);
    return () => clearTimeout(timer);
  }, [activeIndex]);



  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Central Logo with Glow Effect */}
      <div 
        className={`absolute z-20 w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center shadow-xl transition-all duration-1000 ${logoGlow ? 'ring-4 ring-cyan-500' : 'ring-2 ring-gray-700'}`}
        style={{
          transform: 'translate(-50%, -50%)',
          top: '50%',
          left: '50%',
        }}
      >
        <img 
          src={logo} 
          alt="App Logo" 
          className="w-12 h-12 transition-all duration-500"
          style={{
            transform: logoGlow ? 'scale(1.1)' : 'scale(1)',
            filter: logoGlow ? 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.6))' : 'none'
          }}
        />
      </div>

      {/* Orbiting Testimonials */}
      <div
        className="absolute w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        ref={dragRef}
      >
        {testimonials.map((testimonial, index) => {
          const pos = getTestimonialPosition(index, angle);
          
          return (
            <div
              key={testimonial.id}
              className="absolute transition-all duration-500 ease-out"
              style={{
                transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${pos.scale})`,
                zIndex: pos.zIndex,
                opacity: pos.opacity,
                left: '50%',
                top: '50%',
              }}
            >
              <div className="bg-gray-900 shadow-lg rounded-xl p-4 w-[220px] text-sm border border-gray-700">
                <p className="mb-2 italic text-gray-300">"{testimonial.message}"</p>
                <div className="flex items-center space-x-3 mt-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-8 h-8 rounded-full ring-1 ring-gray-600"
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">{testimonial.name}</p>
                    <p className="text-[10px] text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TestimonialOrbit;