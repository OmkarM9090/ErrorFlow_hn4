import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, Terminal, Fingerprint, ScanSearch, ShieldAlert, AlertOctagon, Link2, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Hero = ({ onRunAudit }) => {
  const containerRef = useRef(null);
  const counterRef = useRef(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      
      // --- 1. INITIAL LOAD ANIMATION (No Scroll Conflict) ---
      // We animate the child items IN on load.
      gsap.fromTo(".intro-item", 
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1, stagger: 0.15, ease: "power3.out", delay: 0.1 }
      );

      // Independent Pulse Glow for the Input Portal
      const pulse = gsap.to(".portal-glow", {
        opacity: 0.8,
        scale: 1.02,
        duration: 1.5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });

      // --- 2. MASTER SCROLL TIMELINE (Pinned for 800vh) ---
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=800%",
          pin: true,
          scrub: 1.5,
        }
      });

      // Parallax Grid Background (Runs continuously)
      tl.to(".circuit-grid", { scale: 1.3, duration: 8, ease: "none" }, 0);

      // ACT 1: The Greeting Fades Away (0s to 1s)
      // We animate the parent wrapper OUT on scroll.
      tl.fromTo(".intro-wrapper", 
        { scale: 1, y: "0vh", autoAlpha: 1, filter: "blur(0px)" },
        { scale: 0.8, y: "-15vh", autoAlpha: 0, filter: "blur(10px)", duration: 1, ease: "power2.inOut" }, 
        0
      );

      // ACT 2: The Portal Arrives (1s to 2.5s)
      // Notice this starts exactly at '1', AFTER the intro is completely gone.
      tl.fromTo(".input-portal",
        { autoAlpha: 0, y: "20vh", scale: 0.8, rotateX: 20, z: -100 },
        { autoAlpha: 1, y: "0vh", scale: 1, rotateX: 0, z: 0, duration: 1.5, ease: "expo.out" },
        1 
      );

      // ACT 3: Typing the URL & Transforming to Data Module (2.5s to 5.2s)
      tl.to(".placeholder-text", { opacity: 0, duration: 0.1 }, 2.5)
        .to(".typed-url", { width: "100%", duration: 1.2, ease: "steps(22)" }, 2.5)
        .to(".input-portal", { 
          scale: 0.9, 
          rotateX: 10, 
          y: "5vh",
          boxShadow: "0 25px 50px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)",
          duration: 1.2, 
          ease: "power2.inOut" 
        }, 4);
      
      // Kill the gentle pulse when it locks in
      tl.add(() => pulse.kill(), 4);

      // ACT 4: The Deep Scan (4.5s to 6.5s)
      tl.fromTo(".scanner-laser",
        { top: "-10%", opacity: 0 },
        { top: "100%", opacity: 1, duration: 2, ease: "none" },
        4.5
      );

      // Floating HUD elements pop in
      tl.fromTo(".hud-1", { autoAlpha: 0, y: 50, z: 100 }, { autoAlpha: 1, y: -20, z: 100, duration: 1, ease: "back.out(1.2)" }, 4.5)
        .fromTo(".hud-2", { autoAlpha: 0, y: 50, z: 50 }, { autoAlpha: 1, y: -40, z: 50, duration: 1, ease: "back.out(1.2)" }, 4.8)
        .fromTo(".hud-3", { autoAlpha: 0, y: 50, z: 150 }, { autoAlpha: 1, y: 0, z: 150, duration: 1, ease: "back.out(1.2)" }, 5.1);

      // ACT 5: Flaw Detonation (Glitch & Scatter) (6.5s to 7.8s)
      tl.to(".input-portal", { skewX: -5, x: 10, filter: "brightness(1.1) contrast(1.2)", duration: 0.05, yoyo: true, repeat: 5 }, 6.5)
        .to(".input-portal", { skewX: 0, x: 0, filter: "none", duration: 0.05 }, 6.8);

      tl.fromTo(".flaw-card",
        { autoAlpha: 0, scale: 0, x: 0, y: 0, z: -200 },
        { 
          autoAlpha: 1, scale: 1, 
          x: (i) => [-320, 320, -220][i], 
          y: (i) => [-150, -100, 180][i], 
          z: (i) => [100, 200, 150][i], 
          rotateY: (i) => [-15, 20, -10][i],
          rotateZ: (i) => [-5, 5, -2][i],
          stagger: 0.15, duration: 1.2, ease: "expo.out" 
        },
        6.6 
      );

      // ACT 6: The Diagnosis (8.0s onwards)
      tl.to(".flaw-card, .hud-element", { autoAlpha: 0, y: "+=50", duration: 0.8, stagger: 0.05 }, 8)
        .to(".input-portal", { 
          borderColor: "rgba(244, 63, 94, 0.4)", 
          boxShadow: "0 0 60px rgba(244, 63, 94, 0.15)", 
          duration: 1 
        }, 8)
        .to(".status-indicator", { backgroundColor: "#f43f5e", boxShadow: "0 0 10px rgba(244,63,94,0.8)", duration: 0.5 }, 8);

      const counterObj = { val: 0 };
      tl.to(counterObj, {
        val: 18,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: () => {
          if (counterRef.current) counterRef.current.innerText = Math.round(counterObj.val);
        }
      }, 8.2)
      .to(".flaws-label", { autoAlpha: 1, duration: 0.5 }, 8.5)
      .fromTo(".final-cta", 
        { autoAlpha: 0, y: 30 }, 
        { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out" }, 
        9
      );

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef} 
      className="relative w-full h-screen bg-slate-50 overflow-hidden perspective-[2000px] flex flex-col items-center justify-center font-sans text-slate-900"
    >
      {/* Background Layer: Bright Circuit Grid */}
      <div 
        className="circuit-grid absolute inset-0 opacity-[0.04] pointer-events-none will-change-transform"
        style={{ 
          backgroundImage: 'linear-gradient(to right, #0F172A 1px, transparent 1px), linear-gradient(to bottom, #0F172A 1px, transparent 1px)', 
          backgroundSize: '4vw 4vw' 
        }} 
      />
      
      {/* 3D Container */}
      <div className="relative w-full h-full flex items-center justify-center [transform-style:preserve-3d]">

        {/* --- ACT 1: INITIAL GREETING (Wrapper & Items) --- */}
        <div className="intro-wrapper absolute z-50 flex flex-col items-center text-center w-[90vw] max-w-4xl will-change-transform">
          <div className="intro-item inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-indigo-700 font-bold text-sm tracking-wide uppercase mb-6 invisible">
            <Sparkles size={16} className="text-amber-500" /> Powered by Featherless AI
          </div>
          <h1 className="intro-item text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 leading-[1.1] mb-6 invisible">
            Audit the web. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500">
              Empower everyone.
            </span>
          </h1>
          <p className="intro-item text-xl md:text-2xl text-slate-600 font-medium max-w-2xl mb-8 invisible">
            Scroll to discover how our AI instantly identifies and resolves WCAG 2.2 accessibility violations.
          </p>
        </div>

        {/* --- ACT 2-5: THE INPUT PORTAL / DATA MODULE --- */}
        <div className="input-portal absolute w-[90vw] max-w-3xl z-30 [transform-style:preserve-3d] will-change-transform bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl invisible">
          
          <div className="portal-glow absolute inset-0 rounded-2xl shadow-[0_0_40px_rgba(79,70,229,0.15)] pointer-events-none" />

          {/* Module Header */}
          <div className="flex items-center justify-between text-slate-500 font-mono text-xs md:text-sm tracking-widest uppercase">
            <span className="flex items-center gap-2">
              <span className="status-indicator w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
              01 / Connect
            </span>
            <span className="font-bold">A11Y_AUDITOR_V2</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 tracking-tight">Inject your URL to begin analysis.</h2>

          {/* URL Bar */}
          <div className="relative w-full bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4 text-lg md:text-xl font-mono shadow-inner overflow-hidden">
            <Link2 className="text-slate-400 shrink-0" />
            <div className="relative flex-1 whitespace-nowrap overflow-hidden flex items-center">
              <span className="placeholder-text absolute text-slate-400">https://your-website.com</span>
              <span className="typed-url inline-block overflow-hidden border-r-2 border-indigo-500 w-0 text-indigo-700 font-medium">
                https://example.com/shop
              </span>
            </div>
          </div>

          {/* Final Counter Overlay (Hidden until Phase 6) */}
          <div className="flaws-label absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md rounded-2xl invisible border border-rose-200 z-50">
            <ShieldAlert className="w-12 h-12 text-rose-500 mb-2" />
            <div className="text-6xl md:text-8xl font-black text-rose-600 tracking-tighter drop-shadow-md">
              <span ref={counterRef}>0</span>
            </div>
            <span className="text-rose-500 font-mono tracking-widest uppercase mt-2 font-bold text-sm">WCAG Flaws Found</span>
          </div>

          {/* The Holographic Laser */}
          <div className="scanner-laser absolute left-[-2%] w-[104%] h-[2px] bg-indigo-500 z-40 pointer-events-none rounded-full" 
               style={{ boxShadow: "0 0 20px 4px rgba(79,70,229,0.5), 0 0 40px 10px rgba(34,211,238,0.3)" }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-[4px] bg-white rounded-full blur-[2px]" />
          </div>

        </div>

        {/* --- FLOATING HUD ELEMENTS (Bright Mode) --- */}
        <div className="hud-element hud-1 absolute top-[20%] left-[10%] bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-lg font-mono text-slate-700 text-sm flex items-center gap-2 z-20 invisible shadow-xl">
          <Terminal size={16} className="text-indigo-500" /> [Scanning DOM Structure...]
        </div>
        <div className="hud-element hud-2 absolute bottom-[25%] right-[15%] bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-lg font-mono text-slate-700 text-sm flex items-center gap-2 z-20 invisible shadow-xl">
          <ScanSearch size={16} className="text-indigo-500" /> [Analyzing ARIA Context...]
        </div>
        <div className="hud-element hud-3 absolute top-[30%] right-[10%] bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-lg font-mono text-slate-700 text-sm flex items-center gap-2 z-20 invisible shadow-xl">
          <Fingerprint size={16} className="text-indigo-500" /> [Contrast Ratios Active]
        </div>

        {/* --- FLAW DETONATION CARDS (Bright Mode) --- */}
        <div className="flaw-card absolute bg-white/95 backdrop-blur-xl border border-rose-200 p-4 rounded-xl flex items-center gap-4 z-40 invisible shadow-[0_20px_40px_rgba(244,63,94,0.15)]">
          <div className="p-2 bg-rose-50 rounded-lg text-rose-500"><AlertOctagon size={24} /></div>
          <div>
            <p className="text-rose-500 text-xs font-mono font-bold uppercase tracking-wider">F-01</p>
            <p className="text-slate-800 text-sm font-bold">Low Contrast Button (3.1:1)</p>
          </div>
        </div>

        <div className="flaw-card absolute bg-white/95 backdrop-blur-xl border border-rose-200 p-4 rounded-xl flex items-center gap-4 z-40 invisible shadow-[0_20px_40px_rgba(244,63,94,0.15)]">
          <div className="p-2 bg-rose-50 rounded-lg text-rose-500"><AlertOctagon size={24} /></div>
          <div>
            <p className="text-rose-500 text-xs font-mono font-bold uppercase tracking-wider">F-02</p>
            <p className="text-slate-800 text-sm font-bold">Missing Alt-Text (Hero Image)</p>
          </div>
        </div>

        <div className="flaw-card absolute bg-white/95 backdrop-blur-xl border border-rose-200 p-4 rounded-xl flex items-center gap-4 z-40 invisible shadow-[0_20px_40px_rgba(244,63,94,0.15)]">
          <div className="p-2 bg-rose-50 rounded-lg text-rose-500"><AlertOctagon size={24} /></div>
          <div>
            <p className="text-rose-500 text-xs font-mono font-bold uppercase tracking-wider">F-03</p>
            <p className="text-slate-800 text-sm font-bold">Form Label Missing (Input #email)</p>
          </div>
        </div>

        {/* --- ACT 6: FINAL CTA --- */}
        <div className="final-cta absolute bottom-[8vh] z-50 flex flex-col items-center gap-4 invisible">
          <span className="text-slate-500 font-mono text-sm tracking-widest uppercase font-bold">[ Scroll down for AI Remediation ]</span>
          <button
            type="button"
            onClick={onRunAudit}
            className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-600 transition-colors shadow-2xl hover:shadow-indigo-500/30 group"
          >
            Fix With AI <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default Hero;