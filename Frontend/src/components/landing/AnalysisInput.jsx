import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Terminal, Fingerprint, ScanSearch, ShieldAlert, AlertOctagon, Link2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const AnalysisInput = () => {
  const containerRef = useRef(null);
  const counterRef = useRef(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      
      // Independent Pulse Glow for Phase 1
      const pulse = gsap.to(".portal-glow", {
        opacity: 0.6,
        scale: 1.05,
        duration: 1.5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });

      // Master Scroll Storyline Timeline (Pin: 600vh, Scrub: 1.5)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=600%",
          pin: true,
          scrub: 1.5,
        }
      });

      // PHASE 1 to 2: The Portal Activation (0% - 40%)
      // Background grid scaling (parallax depth)
      tl.to(".space-grid", { scale: 1.3, duration: 4, ease: "none" }, 0);

      // Typing the simulated URL
      tl.to(".placeholder-text", { opacity: 0, duration: 0.1 }, 0.5)
        .to(".typed-url", { width: "100%", duration: 1.5, ease: "steps(22)" }, 0.5) // "types" https://example.com/shop
      
      // Transforming into the "Data Module"
      tl.to(".input-portal", { 
        scale: 0.9, 
        rotateX: 10, 
        y: "5vh",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)", // Hardens the glassmorphism
        duration: 1.5, 
        ease: "power2.inOut" 
      }, 0.5);

      // Kill the Phase 1 pulse when it transforms
      tl.add(() => pulse.kill(), 1);

      // PHASE 3: The Deep Scan (40% - 70%)
      // Laser sweeps down the Data Module
      tl.fromTo(".scanner-laser",
        { top: "-10%", opacity: 0 },
        { top: "100%", opacity: 1, duration: 2.5, ease: "none" },
        2
      );

      // Floating HUD elements appear with parallax lag
      tl.fromTo(".hud-1", { autoAlpha: 0, y: 50, z: 100 }, { autoAlpha: 1, y: -20, z: 100, duration: 1, ease: "back.out(1.2)" }, 2)
        .fromTo(".hud-2", { autoAlpha: 0, y: 50, z: 50 }, { autoAlpha: 1, y: -40, z: 50, duration: 1, ease: "back.out(1.2)" }, 2.3)
        .fromTo(".hud-3", { autoAlpha: 0, y: 50, z: 150 }, { autoAlpha: 1, y: 0, z: 150, duration: 1, ease: "back.out(1.2)" }, 2.6);

      // PHASE 4: Flaw Detonation (70% - 90%)
      // Glitch effect on the Data Module
      tl.to(".input-portal", { skewX: 8, x: -10, filter: "hue-rotate(90deg)", duration: 0.05, yoyo: true, repeat: 5 }, 4.5)
        .to(".input-portal", { skewX: 0, x: 0, filter: "hue-rotate(0deg)", duration: 0.05 }, 4.8);

      // Flaw Burst (Staggered scatter across Z and X/Y axes)
      tl.fromTo(".flaw-card",
        { autoAlpha: 0, scale: 0, x: 0, y: 0, z: -200 },
        { 
          autoAlpha: 1, 
          scale: 1, 
          // Custom routing for each card to explode outward
          x: (i) => [-300, 300, -200][i], 
          y: (i) => [-150, -100, 150][i], 
          z: (i) => [100, 200, 150][i], 
          rotateY: (i) => [-15, 20, -10][i],
          rotateZ: (i) => [-5, 5, -2][i],
          stagger: 0.15, 
          duration: 1.2, 
          ease: "expo.out" 
        },
        4.6 // Triggered during the glitch
      );

      // PHASE 5: The Diagnosis (90% - 100%)
      // Hide scatter, glow rose, count up, show prompt
      tl.to(".flaw-card, .hud-element", { autoAlpha: 0, y: "+=50", duration: 0.8, stagger: 0.05 }, 6)
        .to(".input-portal", { 
          borderColor: "rgba(244, 63, 94, 0.4)", // Rose-500 border
          boxShadow: "0 0 60px rgba(244, 63, 94, 0.2)", // Rose-500 glow
          duration: 1 
        }, 6)
        .to(".status-indicator", { backgroundColor: "#f43f5e", duration: 0.5 }, 6); // Dot turns red

      // Counter animation logic
      const counterObj = { val: 0 };
      tl.to(counterObj, {
        val: 18,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: () => {
          if (counterRef.current) counterRef.current.innerText = Math.round(counterObj.val);
        }
      }, 6)
      .to(".flaws-label", { autoAlpha: 1, duration: 0.5 }, 6.5)
      .fromTo(".final-prompt", 
        { autoAlpha: 0, y: 20 }, 
        { autoAlpha: 1, y: 0, duration: 1 }, 
        7
      );

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef} 
      className="relative w-full h-screen bg-slate-950 overflow-hidden perspective-[2000px] flex flex-col items-center justify-center font-sans text-white"
    >
      {/* Background Deep Space SVG Grid */}
      <div 
        className="space-grid absolute inset-0 opacity-15 pointer-events-none will-change-transform"
        style={{ 
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)', 
          backgroundSize: '4vw 4vw' 
        }} 
      />
      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-950/80 to-slate-950 pointer-events-none" 
           style={{ background: 'radial-gradient(circle at center, transparent 0%, #020617 100%)' }} />

      {/* Main Container for 3D Elements */}
      <div className="relative w-full h-full flex items-center justify-center [transform-style:preserve-3d]">

        {/* --- PHASE 1/2: THE INPUT PORTAL / DATA MODULE --- */}
        <div className="input-portal relative w-[90vw] max-w-3xl z-30 [transform-style:preserve-3d] will-change-transform bg-slate-900/40 backdrop-blur-[16px] border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col gap-6 transform translate-z-[200px]">
          
          <div className="portal-glow absolute inset-0 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.05)] pointer-events-none" />

          {/* Module Header */}
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs md:text-sm tracking-widest uppercase">
            <span className="flex items-center gap-2">
              <span className="status-indicator w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              01 / Connect
            </span>
            <span>A11Y_AUDITOR_V2</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-light text-slate-200">Inject your URL into the Auditor.</h2>

          {/* URL Bar */}
          <div className="relative w-full bg-black/40 border border-slate-700 rounded-xl p-4 flex items-center gap-4 text-lg md:text-xl font-mono shadow-inner overflow-hidden">
            <Link2 className="text-slate-500 shrink-0" />
            <div className="relative flex-1 whitespace-nowrap overflow-hidden flex items-center">
              <span className="placeholder-text absolute text-slate-600">https://your-website.com</span>
              <span className="typed-url inline-block overflow-hidden border-r-2 border-cyan-400 w-0 text-cyan-50">
                https://example.com/shop
              </span>
            </div>
          </div>

          {/* Final Counter Overlay (Hidden until Phase 5) */}
          <div className="flaws-label absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md rounded-2xl invisible border border-rose-500/30">
            <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
            <div className="text-5xl md:text-7xl font-black text-rose-500 tracking-tighter shadow-rose-500/50 drop-shadow-[0_0_20px_rgba(244,63,94,0.4)]">
              <span ref={counterRef}>0</span>
            </div>
            <span className="text-rose-200 font-mono tracking-widest uppercase mt-2 font-bold text-sm">Flaws Found</span>
          </div>

          {/* PHASE 3: The Holographic Laser */}
          <div className="scanner-laser absolute left-[-2%] w-[104%] h-[2px] bg-cyan-400 z-50 pointer-events-none rounded-full" 
               style={{ boxShadow: "0 0 20px 5px rgba(34,211,238,0.5), 0 0 40px 10px rgba(34,211,238,0.2)" }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-[4px] bg-white rounded-full blur-[2px]" />
          </div>

        </div>

        {/* --- PHASE 3: FLOATING HUD ELEMENTS --- */}
        <div className="hud-element hud-1 absolute top-[20%] left-[10%] bg-slate-800/60 backdrop-blur-md border border-cyan-500/30 px-4 py-2 rounded-lg font-mono text-cyan-400 text-sm flex items-center gap-2 z-20 invisible shadow-[0_0_20px_rgba(34,211,238,0.1)]">
          <Terminal size={16} /> [Scanning DOM Structure...]
        </div>
        <div className="hud-element hud-2 absolute bottom-[25%] right-[15%] bg-slate-800/60 backdrop-blur-md border border-cyan-500/30 px-4 py-2 rounded-lg font-mono text-cyan-400 text-sm flex items-center gap-2 z-20 invisible shadow-[0_0_20px_rgba(34,211,238,0.1)]">
          <ScanSearch size={16} /> [Analyzing ARIA Context...]
        </div>
        <div className="hud-element hud-3 absolute top-[30%] right-[10%] bg-slate-800/60 backdrop-blur-md border border-cyan-500/30 px-4 py-2 rounded-lg font-mono text-cyan-400 text-sm flex items-center gap-2 z-20 invisible shadow-[0_0_20px_rgba(34,211,238,0.1)]">
          <Fingerprint size={16} /> [Contrast Ratios Active]
        </div>

        {/* --- PHASE 4: FLAW DETONATION CARDS --- */}
        <div className="flaw-card absolute bg-rose-950/80 backdrop-blur-xl border border-rose-500/50 p-4 rounded-xl flex items-center gap-4 z-40 invisible shadow-[0_20px_40px_rgba(244,63,94,0.2)]">
          <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400"><AlertOctagon size={24} /></div>
          <div>
            <p className="text-rose-200 text-xs font-mono font-bold uppercase tracking-wider">F-01</p>
            <p className="text-white text-sm font-medium">Low Contrast Button (3.1:1)</p>
          </div>
        </div>

        <div className="flaw-card absolute bg-rose-950/80 backdrop-blur-xl border border-rose-500/50 p-4 rounded-xl flex items-center gap-4 z-40 invisible shadow-[0_20px_40px_rgba(244,63,94,0.2)]">
          <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400"><AlertOctagon size={24} /></div>
          <div>
            <p className="text-rose-200 text-xs font-mono font-bold uppercase tracking-wider">F-02</p>
            <p className="text-white text-sm font-medium">Missing Alt-Text (Hero Image)</p>
          </div>
        </div>

        <div className="flaw-card absolute bg-rose-950/80 backdrop-blur-xl border border-rose-500/50 p-4 rounded-xl flex items-center gap-4 z-40 invisible shadow-[0_20px_40px_rgba(244,63,94,0.2)]">
          <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400"><AlertOctagon size={24} /></div>
          <div>
            <p className="text-rose-200 text-xs font-mono font-bold uppercase tracking-wider">F-03</p>
            <p className="text-white text-sm font-medium">Form Label Missing (Input #email)</p>
          </div>
        </div>

      </div>

      {/* --- PHASE 5: FINAL PROMPT --- */}
      <div className="final-prompt absolute bottom-[10vh] z-50 invisible text-slate-400 font-mono text-sm tracking-widest uppercase flex flex-col items-center gap-2">
        <span>[ Scroll down for AI Remediation ]</span>
        <div className="w-[1px] h-8 bg-gradient-to-b from-slate-400 to-transparent animate-pulse" />
      </div>

    </section>
  );
};

export default AnalysisInput;