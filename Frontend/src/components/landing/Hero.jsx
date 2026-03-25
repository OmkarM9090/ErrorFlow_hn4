import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

const Hero = ({ onOpenAuth }) => {
  const comp = useRef(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      const t1 = gsap.timeline();
      
      t1.fromTo(".hero-badge", 
        { y: 20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      )
      .fromTo(".hero-text", 
        { y: 40, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out" },
        "-=0.4"
      )
      .fromTo(".hero-visual",
        { y: 100, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "expo.out" },
        "-=0.6"
      );

      // Simple Parallax on scroll
      gsap.to(".hero-visual", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: comp.current,
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    }, comp);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={comp} className="relative min-h-screen pt-40 pb-20 px-6 overflow-hidden flex flex-col items-center text-center">
      {/* Background glowing orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl -z-10" />

      <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 font-medium text-sm mb-8 border border-indigo-100">
        <Sparkles size={16} />
        <span>WCAG 2.2 Compliant Auditing</span>
      </div>

      <h1 className="hero-text text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl leading-[1.1] mb-6">
        Bridge the accessibility gap with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">AI-powered</span> insights.
      </h1>

      <p className="hero-text text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
        Identify, visualize, and resolve web accessibility issues instantly. Stop guessing and start building inclusive web applications for everyone.
      </p>

      <div className="hero-text flex flex-col sm:flex-row gap-4 mb-20">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenAuth}
          className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200"
        >
          Start Secure Access <ArrowRight size={20} />
        </motion.button>
      </div>

      {/* Abstract Dashboard Visual - Parallax Target */}
      <div className="hero-visual relative w-full max-w-5xl h-[400px] md:h-[600px] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex items-center justify-center">
        {/* Decorative UI elements representing the platform */}
        <div className="absolute top-0 left-0 w-full h-12 border-b border-slate-100 flex items-center px-4 gap-2 bg-slate-50">
          <div className="w-3 h-3 rounded-full bg-rose-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <div className="text-slate-300 font-medium text-xl">Advanced Dashboard Visualization Area</div>
      </div>
    </section>
  );
};

export default Hero;