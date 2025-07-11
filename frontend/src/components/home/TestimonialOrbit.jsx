import React, { useState, useEffect, useCallback } from "react";
import logo from "../../assets/vblogo1.webp";

const testimonials = [
  {
    id: 1,
    name: "Alice",
    role: "CTO, FintechCo",
    message: "We migrated off Slack in 3 days with zero pushback from legal.",
    avatar: "https://randomuser.me/api/portraits/women/1.jpg"
  },
  {
    id: 2,
    name: "Ben",
    role: "CISO, HealthSafe",
    message: "The only chat app our compliance team actually liked.",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg"
  },
  {
    id: 3,
    name: "Carol",
    role: "CEO, SecureComms",
    message: "Our board meetings are now 100% confidential thanks to VoiceBox.",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg"
  },
  {
    id: 4,
    name: "Dave",
    role: "Head of Legal, TechCorp",
    message: "Finally, a messaging platform that meets our security requirements.",
    avatar: "https://randomuser.me/api/portraits/men/2.jpg"
  },
  {
    id: 5,
    name: "Eve",
    role: "Security Lead, BankSecure",
    message: "End-to-end encryption done right. Our security team is impressed.",
    avatar: "https://randomuser.me/api/portraits/women/3.jpg"
  },
  {
    id: 6,
    name: "Frank",
    role: "VP Engineering, DataGuard",
    message: "VoiceBox made secure collaboration effortless for our remote teams.",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg"
  }
];

const TestimonialOrbit = () => {
  const [angle, setAngle] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const radius = 230;
  const autoRotateSpeed = 0.01;

  const getTestimonialPosition = (index, currentAngle) => {
    const total = testimonials.length;
    const angle =
      (Math.PI * 2 * index) / total + (currentAngle * Math.PI) / 180;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const zIndex = Math.round(Math.cos(angle) * 10) + 10;
    const scale = 1; // Fixed scale for all bubbles
    const opacity = 0.8; // Slightly increased base opacity for better visibility

    return {
      x,
      y,
      zIndex,
      scale,
      opacity,
      theta: angle * (180 / Math.PI),
    };
  };



  const updateActiveIndex = useCallback((currentAngle) => {
    const total = testimonials.length;
    const normalizedAngle = ((currentAngle % 360) + 360) % 360;
    const index = Math.round((normalizedAngle / 360) * total) % total;
    setActiveIndex(index);
  }, []);

  useEffect(() => {
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
  }, [updateActiveIndex]);

  return (
    <div className="relative w-full h-full" style={{ height: '100%' }}>
      {/* Central Logo */}
      <div
        className="absolute z-20 w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]"
        style={{
          transform: "translate(-50%, -50%)",
          top: "50%",
          left: "50%",
          position: 'absolute',
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <img 
          src={logo} 
          alt="App Logo" 
          className="w-12 h-12 transition-transform duration-500 hover:rotate-180"
        />
      </div>

      {/* Orbiting Testimonials */}
      <div
        className="absolute inset-0 w-full h-full"
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
                className="relative backdrop-blur-lg bg-white/5 border border-cyan-300/10 rounded-xl p-4 w-[280px] text-sm transition-all duration-300 transform hover:scale-[1.05] hover:rotate-[1.5deg] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:border-cyan-300/30"
                style={{
                  transition: 'all 0.3s ease-in-out',
                  boxShadow: activeIndex === index
                    ? '0 0 20px rgba(255,255,255,0.1)'
                    : '0 4px 20px rgba(0,0,0,0.2)'
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
