import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { Link } from "react-router-dom";

// Sparkles component: memoized so it doesn’t re-render on cursor move
const Sparkles = React.memo(({ data, hoverOffset }) => (
  <motion.div
    className="fixed inset-0 pointer-events-none z-40"
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
          background: `radial-gradient(circle, rgba(196,181,253,1) 0%, rgba(125,211,252,0.9) 50%, rgba(216,180,254,0) 100%)`,
          filter: `blur(${d.blur}px)`,
          width: "4px",
          height: "4px",
          borderRadius: "50%",
        }}
      />
    ))}
  </motion.div>
));

export default function Home() {
  const controls = useAnimation();
  const heroRef = useRef(null);
  const isInView = useInView(heroRef);

  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [hoverOffset, setHoverOffset] = useState({ x: 0, y: 0 });
  const [typedText, setTypedText] = useState("");
  const fullText = "Speak Freely. Lead Bravely.";

  // Generate sparkle data once (60 sparkles)
  const sparkleData = useMemo(
    () =>
      Array.from({ length: 60 }).map(() => ({
        startX: Math.random() * window.innerWidth,
        duration: 4 + Math.random() * 6,
        driftX: (Math.random() - 0.5) * 50,
        blur: Math.random() * 2 + 1,
      })),
    []
  );

  // Cursor tracking + glow + hover offset
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

  // Trigger hero text animation
  useEffect(() => {
    if (isInView) controls.start("visible");
  }, [controls, isInView]);

  // Typing effect (50ms per char)
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative overflow-hidden min-h-screen text-white flex flex-col"
      style={{
        backgroundImage: "url('/bg.jpeg')", // ← replace with your image
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Sparkles with parallax */}
      <Sparkles data={sparkleData} hoverOffset={hoverOffset} />

      {/* Cursor Glow */}
      <motion.div
        className="fixed pointer-events-none z-50 mix-blend-screen"
        style={{
          left: cursorPos.x,
          top: cursorPos.y,
          transform: "translate(-50%, -50%)",
          opacity: glowIntensity * 0.6,
        }}
        animate={{
          background: [
            "radial-gradient(circle, rgba(165,180,252,0.4) 0%, rgba(165,180,252,0) 60%)",
            "radial-gradient(circle, rgba(192,132,252,0.4) 0%, rgba(192,132,252,0) 60%)",
          ],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: "mirror",
        }}
      >
        <div className="w-24 h-24 blur-[40px] rounded-full bg-indigo-300/40" />
        <div className="w-16 h-16 blur-[30px] rounded-full bg-purple-300/40 absolute inset-0 m-auto" />
      </motion.div>

      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-6 z-10 relative">
        <div className="text-2xl font-extrabold tracking-widest">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-fuchsia-500">
            Voicebox Anonymous
          </span>
        </div>
        <ul className="hidden md:flex gap-8 text-sm">
          {["About", "Features", "Contact"].map((item, idx) => (
            <motion.li
              key={idx}
              whileHover={{ color: "#A855F7", scale: 1.3 }}
              transition={{ type: "spring", stiffness: 500 }}
              className="cursor-pointer relative group"
            >
              {item}
              <div className="absolute bottom-0 left-0 w-0 h-px bg-purple-400 group-hover:w-full transition-all duration-300" />
            </motion.li>
          ))}
        </ul>
        <Link to="/signin">
          <motion.button
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="border border-white px-4 py-2 rounded-md hover:bg-gradient-to-r from-pink-500 to-indigo-500 text-sm"
          >
            Sign In
          </motion.button>
        </Link>
      </nav>

      {/* Hero (with gap) */}
      <section
        ref={heroRef}
        className="flex-1 flex flex-col justify-center items-start px-8 md:px-24 z-10 mt-12"
      >
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={controls}
          variants={{
            visible: { opacity: 1, scale: 1, transition: { duration: 1.5 } },
          }}
          className="text-4xl md:text-7xl font-extralight leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-pink-500 to-purple-500"
        >
          {typedText}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={controls}
          variants={{
            visible: { opacity: 1, transition: { delay: 0.4, duration: 1.4 } },
          }}
          className="text-white/80 text-lg max-w-2xl mb-8 font-medium drop-shadow-lg"
        >
          Let your employees express their voices in a space that's bold,
          beautiful, and beyond expectations. Trust meets technology, privacy
          meets purpose.
        </motion.p>

        <Link to="/signup">
          <motion.button
            whileHover={{ scale: 1.15, boxShadow: "0 0 30px #8B5CF6" }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 rounded-full text-white font-semibold text-lg shadow-lg"
          >
            Begin the Revolution
          </motion.button>
        </Link>
      </section>

      {/* Features */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.4 } } }}
        className="grid md:grid-cols-3 gap-12 px-8 md:px-24 py-24 z-10"
      >
        {[
          {
            title: "Secure Privacy Protocol",
            desc: "Military-grade encryption with seamless user experience",
          },
          {
            title: "Cultural Analytics",
            desc: "Uncover insights and drive organizational growth",
          },
          {
            title: "Immersive Interface",
            desc: "Modern design meets intuitive interaction patterns",
          },
        ].map((f, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="bg-black bg-opacity-30 backdrop-blur-md p-6 rounded-2xl shadow-2xl hover:shadow-purple-800 hover:scale-105 transition group relative"
          >
            <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-fuchsia-400 to-blue-400 text-transparent bg-clip-text">
              {f.title}
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* Footer */}
      <motion.footer
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 5 }}
        className="text-center py-8 text-gray-300 text-sm backdrop-blur-md z-10 border-t border-white/10"
      >
        &copy; 2025 Voicebox Anonymous. Design so radical, it redefines silence.
      </motion.footer>
    </div>
  );
}
