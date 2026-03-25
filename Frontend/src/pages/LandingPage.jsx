import React, { useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';

gsap.registerPlugin(ScrollTrigger);

const LandingPage = ({ onOpenAuth }) => {
  // Smooth scroll setup (optional but recommended for GSAP)
  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      // Global GSAP settings can go here
    });
    return () => ctx.revert(); // Cleanup on unmount
  }, []);

  return (
    <main className="relative w-full">
      <Navbar onOpenAuth={onOpenAuth} />
      <Hero onOpenAuth={onOpenAuth} />
      <Features />
      {/* Space for future sections like Browser Extension, Dashboard preview, etc. */}
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <h2 className="text-4xl font-bold text-slate-300">More Sections Coming...</h2>
      </div>
    </main>
  );
};

export default LandingPage;