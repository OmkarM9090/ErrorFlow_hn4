import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring, useInView, animate } from 'framer-motion';
import { Users, Eye, Wand2 } from 'lucide-react';

// --- 1. PERFORMANCE OPTIMIZED COUNTER COMPONENT ---
const AnimatedCounter = ({ from = 0, to, duration = 2, suffix = "", isDecimal = false }) => {
  const nodeRef = useRef(null);
  const isInView = useInView(nodeRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(from, to, {
        duration,
        ease: "easeOut",
        onUpdate(value) {
          if (nodeRef.current) {
            nodeRef.current.textContent = (isDecimal ? value.toFixed(1) : Math.round(value)) + suffix;
          }
        },
      });
      return () => controls.stop();
    }
  }, [from, to, duration, isInView, isDecimal]);

  return <span ref={nodeRef}>{from}{suffix}</span>;
};

// --- 2. 3D INTERACTIVE TILT CARD COMPONENT ---
const TiltCard = ({ children, isCenter = false, variants }) => {
  const cardRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the raw mouse values with a spring for an organic feel
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  // Map mouse position to rotation degrees (inverted for natural tilt)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      variants={variants}
      layout
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        willChange: "transform"
      }}
      className={`relative w-full rounded-3xl bg-white border border-slate-100 p-8 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-shadow duration-300 hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] ${
        isCenter ? 'md:scale-105 md:-translate-y-4 z-10' : 'z-0'
      }`}
    >
      {/* Internal wrapper to push content off the card plane slightly for deeper 3D effect */}
      <div style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }} className="h-full flex flex-col">
        {children}
      </div>
    </motion.div>
  );
};

// --- 3. MAIN IMPACT SECTION COMPONENT ---
const ImpactSection = () => {
  // Stagger Container Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  // 3D Flip-In Item Variants
  const itemVariants = {
    hidden: { rotateX: 45, y: 50, opacity: 0 },
    show: {
      rotateX: 0,
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <section className="relative w-full py-32 bg-slate-50 overflow-hidden font-sans perspective-[2000px] flex items-center justify-center">
      
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col items-center">
        
        <div className="text-center mb-20 max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">
            The Cost of an <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">Inaccessible Web</span>
          </h2>
          <p className="text-xl text-slate-600 font-medium leading-relaxed">
            Accessibility is unintentionally overlooked in modern dynamic applications. The gap between WCAG guidelines and real-world implementation has real consequences.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full [transform-style:preserve-3d]"
        >
          {/* CARD 1: The Human Gap */}
          <TiltCard variants={itemVariants}>
            <div className="relative w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-8">
              <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
              <Users className="text-blue-600 relative z-10" size={28} />
            </div>
            <h3 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">
              <AnimatedCounter to={1.3} suffix="B" isDecimal={true} />
            </h3>
            <h4 className="text-lg font-bold text-slate-800 mb-2">People Excluded</h4>
            <p className="text-slate-500 font-medium leading-relaxed">
              16% of the global population lives with a significant disability. Don't let your dynamic web applications unintentionally lock them out of the digital world.
            </p>
          </TiltCard>

          {/* CARD 2: The Developer Struggle (Center / Larger) */}
          <TiltCard variants={itemVariants} isCenter={true}>
            <div className="relative w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-8">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
              <Eye className="text-indigo-600 relative z-10" size={28} />
            </div>
            <h3 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600 tracking-tighter mb-4">
              <AnimatedCounter to={100} suffix="%" />
            </h3>
            <h4 className="text-xl font-bold text-slate-800 mb-2">Visual Context</h4>
            <p className="text-slate-500 font-medium leading-relaxed text-lg">
              Developers lack intuitive tools. Stop digging through raw, confusing audit reports. We provide meaningful visual context so you know exactly where issues occur and how they impact usability.
            </p>
          </TiltCard>

          {/* CARD 3: The AI Remediation */}
          <TiltCard variants={itemVariants}>
            <div className="relative w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-8">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
              <Wand2 className="text-emerald-600 relative z-10" size={28} />
            </div>
            <h3 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">
              <AnimatedCounter to={10} suffix="x" />
            </h3>
            <h4 className="text-lg font-bold text-slate-800 mb-2">Faster Remediation</h4>
            <p className="text-slate-500 font-medium leading-relaxed">
              Bridge the gap between identification and resolution. Utilizing Featherless.ai, generate real-time, optimized code snippets (ARIA, Semantic HTML) instantly.
            </p>
          </TiltCard>

        </motion.div>
      </div>
    </section>
  );
};

export default ImpactSection;