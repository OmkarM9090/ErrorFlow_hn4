import React, { useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import ImpactSection from '../components/landing/ImpactSection';
import Footer from '../components/landing/Footer';
// import AnalysisInput from '../components/landing/AnalysisInput';

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
      <HowItWorks />
      <ImpactSection />
      <Footer />

    </main>
  );
};

export default LandingPage;