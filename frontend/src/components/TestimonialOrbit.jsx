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

  const radius = 200;
  const autoRotateSpeed = 0.01;
  const rotationSpeed = 0.05;

  const getTestimonialPosition = (index, currentAngle) => {
    const total = testimonials.length;
    const angle =
      (Math.PI * 2 * index) / total + (currentAngle * Math.PI) / 180;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const zIndex = Math.round(Math.cos(angle) * 10) + 10;
    const scale = 0.7 + (Math.cos(angle) + 1) * 0.15;
    const opacity = 0.6 + (Math.cos(angle) + 1) * 0.2;

    return {
      x,
      y,
      zIndex,
      scale,
      opacity,
      theta: angle * (180 / Math.PI),
    };
  };

  const handleStart = useCallback(
    (clientX) => {
      isDragging.current = true;
      startX.current = clientX;
      startAngle.current = angle;
      setIsAutoRotating(false);
    },
    [angle]
  );

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

  const updateActiveIndex = useCallback((currentAngle) => {
    const total = testimonials.length;
    const normalizedAngle = ((currentAngle % 360) + 360) % 360;
    const index = Math.round((normalizedAngle / 360) * total) % total;
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    if (!isAutoRotating) return;

    let animationFrameId;
    let lastTime = Date.now();

    const rotate = () => {
      const now = Date.now();
      const deltaTime = now - lastTime;
      lastTime = now;

      setAngle((prevAngle) => {
        const newAngle = prevAngle + autoRotateSpeed * deltaTime;
        updateActiveIndex(newAngle);
        return newAngle;
      });

      animationFrameId = requestAnimationFrame(rotate);
    };

    animationFrameId = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isAutoRotating, updateActiveIndex]);

  useEffect(() => {
    const handleMouseMove = (e) => handleMove(e.clientX);
    const handleTouchMove = (e) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    };
    const handleTouchStart = (e) => handleStart(e.touches[0].clientX);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [handleMove, handleStart, handleEnd]);

  return (
    <div className="relative w-full h-full" style={{ height: '100%' }}>
      {/* Central Logo */}
      <div
        className="absolute z-20 w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center transition-all duration-1000"
        style={{
          transform: "translate(-50%, -50%)",
          top: "50%",
          left: "50%",
          position: 'absolute'
        }}
      >
        <img src={logo} alt="App Logo" className="w-12 h-12" />
      </div>

      {/* Orbiting Testimonials */}
      <div
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        ref={dragRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      >
        {testimonials.map((testimonial, index) => {
          const pos = getTestimonialPosition(index, angle);

          return (
            <div
              key={testimonial.id}
              className="absolute transition-all duration-500 ease-out"
              style={{
                transform: `
                  translate(-50%, -50%)
                  translate(${pos.x}px, ${pos.y}px)
                  scale(${pos.scale})
                  translateY(${Math.sin(pos.theta * Math.PI / 180) * 10}px)
                `,
                zIndex: pos.zIndex,
                opacity: pos.opacity,
                left: "50%",
                top: "50%",
              }}
            >
              <div
                className="relative backdrop-blur-lg bg-white/5 border border-cyan-300/10 rounded-xl p-4 w-[280px] text-sm transition-transform duration-300 transform hover:scale-[1.05] hover:rotate-[1.5deg] hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                style={{
                  boxShadow:
                    activeIndex === index
                      ? "0 0 20px rgba(255,255,255,0.1)"
                      : "0 4px 20px rgba(0,0,0,0.2)",
                }}
              >
                <p className="mb-2 italic text-gray-200">"{testimonial.message}"</p>
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
