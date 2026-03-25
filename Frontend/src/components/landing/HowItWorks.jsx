import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link2, ScanSearch, Map, Bot, FileCheck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    id: 1,
    title: "Input Analysis",
    description: "User enters URL. System initiates a deep-link connection to the DOM tree.",
    icon: Link2
  },
  {
    id: 2,
    title: "Component Scanning",
    description: "AI crawls every button, input, and image to check against WCAG 2.2 standards.",
    icon: ScanSearch
  },
  {
    id: 3,
    title: "Violation Mapping",
    description: "Specific accessibility flaws (Contrast, ARIA, Keyboard Traps) are identified and categorized.",
    icon: Map
  },
  {
    id: 4,
    title: "AI Remediation",
    description: "Our neural engine generates the exact React/HTML code fixes needed to solve the flaws.",
    icon: Bot
  },
  {
    id: 5,
    title: "Compliance Report",
    description: "A final accessibility score and a 'One-Click Fix' export are provided.",
    icon: FileCheck
  }
];

const HowItWorks = () => {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const lineRef = useRef(null);
  const panelsRef = useRef([]);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      
      const panels = panelsRef.current;
      
      // 1. The Main Horizontal Scroll Tween
      // This translates the entire track to the left based on how many panels there are.
      let scrollTween = gsap.to(panels, {
        xPercent: -100 * (panels.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: true,
          scrub: 1,
          end: "+=4000", // The higher this number, the longer and smoother the scroll feels
        }
      });

      // 2. The Horizontal SVG Line Drawing
      // Syncs perfectly with the scrollTween
      gsap.fromTo(lineRef.current, 
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=4000",
            scrub: 1,
          }
        }
      );

      // 3. Individual Panel Animations (Using containerAnimation)
      // This is GSAP magic. It lets us trigger animations INSIDE a horizontally scrolling container
      // based on when they hit the center of the screen.
      panels.forEach((panel, i) => {
        const card = panel.querySelector('.step-card');
        const bubble = panel.querySelector('.step-bubble');

        // We skip the first one so it's already active on load
        if (i !== 0) {
          gsap.fromTo(card, 
            { scale: 0.8, opacity: 0.4, y: 50 },
            {
              scale: 1, opacity: 1, y: 0,
              duration: 1,
              ease: "expo.out",
              scrollTrigger: {
                trigger: panel,
                containerAnimation: scrollTween,
                start: "left center", // Trigger when the left of the panel hits the center of the screen
                toggleActions: "play none none reverse"
              }
            }
          );

          gsap.fromTo(bubble,
            { scale: 0.5, backgroundColor: "#ffffff", color: "#4f46e5" },
            {
              scale: 1, backgroundColor: "#4f46e5", color: "#ffffff",
              duration: 0.5,
              ease: "back.out(2)",
              scrollTrigger: {
                trigger: panel,
                containerAnimation: scrollTween,
                start: "left center",
                toggleActions: "play none none reverse"
              }
            }
          );
        }
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className="relative w-full h-screen bg-slate-50 text-slate-900 overflow-hidden flex flex-col"
    >
      
      {/* Background Subtle Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ 
          backgroundImage: 'linear-gradient(to right, #0F172A 1px, transparent 1px), linear-gradient(to bottom, #0F172A 1px, transparent 1px)', 
          backgroundSize: '4vw 4vw' 
        }} 
      />

      {/* Fixed Header Content inside the pinned section */}
      <div className="absolute top-12 md:top-24 left-0 w-full px-6 md:px-16 z-20 pointer-events-none flex flex-col items-start">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-indigo-700 font-bold text-xs md:text-sm tracking-wide uppercase mb-4">
          The Process
        </div>
        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900">
          How It Works
        </h2>
      </div>

      {/* The Horizontal Track Wrapper */}
      {/* We use width: '500vw' dynamically based on array length to hold all items side-by-side */}
      <div 
        ref={trackRef} 
        className="relative h-full flex items-center pt-20"
        style={{ width: `${steps.length * 100}vw` }}
      >
        
        {/* The Continuous SVG Connecting Line */}
        <div className="absolute top-1/2 left-0 w-full h-2 -translate-y-1/2 z-0 px-[50vw]">
           <svg className="w-full h-full" preserveAspectRatio="none">
             {/* Background inactive line */}
             <line x1="0" y1="50%" x2="100%" y2="50%" className="stroke-slate-200" strokeWidth="4" />
             {/* Active growing line */}
             <line 
                ref={lineRef}
                x1="0" y1="50%" x2="100%" y2="50%" 
                className="stroke-indigo-600" 
                strokeWidth="4" 
                strokeLinecap="round"
                pathLength="1" 
                strokeDasharray="1" 
                strokeDashoffset="1" 
             />
           </svg>
        </div>

        {/* The Individual Panels */}
        {steps.map((step, index) => {
          const Icon = step.icon;
          // The first card starts fully active, the others start dimmed/scaled down
          const isFirst = index === 0;

          return (
            <div 
              key={step.id} 
              ref={(el) => (panelsRef.current[index] = el)}
              className="relative w-[100vw] h-full flex flex-col items-center justify-center px-6 md:px-20"
            >
              
              {/* Step Card */}
              <div className={`step-card relative w-full max-w-lg bg-white/80 backdrop-blur-xl border border-slate-200 p-8 md:p-12 rounded-3xl shadow-2xl z-10 ${isFirst ? '' : 'scale-90 opacity-40 translate-y-12'}`}>
                
                {/* Connecting Node/Bubble */}
                <div className={`step-bubble absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-white flex items-center justify-center shadow-xl z-20 transition-colors ${isFirst ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'}`}>
                  <Icon size={24} strokeWidth={2.5} />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white rounded-full text-xs font-bold flex items-center justify-center border-2 border-slate-50">
                    {step.id}
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">{step.title}</h3>
                  <p className="text-lg text-slate-600 leading-relaxed font-medium">
                    {step.description}
                  </p>
                </div>

              </div>
            </div>
          );
        })}

      </div>
    </section>
  );
};

export default HowItWorks;