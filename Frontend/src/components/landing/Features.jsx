import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Layers, Wand2, LineChart, Globe } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: "Multi-Page Analysis",
    description: "Scan entire domains automatically. Discover routes and ensure your entire web ecosystem meets WCAG 2.2 standards without manual page-by-page checking.",
    icon: <Globe size={32} />,
    color: "bg-blue-50 text-blue-600 border-blue-200"
  },
  {
    title: "Visual Issue Exploration",
    description: "See exactly where issues live. Our interactive DOM viewer highlights affected areas in context, showing precisely how they impact user experience.",
    icon: <Layers size={32} />,
    color: "bg-indigo-50 text-indigo-600 border-indigo-200"
  },
  {
    title: "AI-Powered Remediation",
    description: "Powered by featherless.ai. Get context-aware code snippets, optimized ARIA labels, and semantic HTML structures to resolve issues instantly.",
    icon: <Wand2 size={32} />,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200"
  },
  {
    title: "Insights & Benchmarking",
    description: "Track accessibility scores over time. Compare projects, visualize growth, and prove compliance with comprehensive, easy-to-read reports.",
    icon: <LineChart size={32} />,
    color: "bg-purple-50 text-purple-600 border-purple-200"
  }
];

const Features = () => {
  const containerRef = useRef(null);
  const cardsRef = useRef([]);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      // 1. Push all cards EXCEPT the first one down exactly below the container
      gsap.set(cardsRef.current.slice(1), { yPercent: 100 });

      // 2. Create the pinning timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: `+=${window.innerHeight * 3}`, // Increased scroll distance to accommodate the complex tilt+slide animations
          pin: true,
          scrub: 1, // Smooth scrubbing
        }
      });

      // 3. Loop through the cards to build the Tilt -> Slide sequence
      cardsRef.current.forEach((card, index) => {
        // We don't tilt the very last card because nothing covers it
        if (index === cardsRef.current.length - 1) return;

        // A. Tilt and scale down the CURRENT card
        // We alternate between a -3 degree and +3 degree tilt for a cool, organic stacked look
        const tiltAngle = index % 2 === 0 ? -3 : 3;

        tl.to(card, {
          scale: 0.92, // Shrink it slightly so the corners don't clip when rotating
          rotation: tiltAngle,
          opacity: 0.5, // Dim the background card to make the new one pop
          transformOrigin: "center center",
          ease: "power1.inOut",
          duration: 0.5
        });

        // B. Slide the NEXT card up over it
        tl.to(cardsRef.current[index + 1], {
          yPercent: 0,
          ease: "power2.out",
          duration: 1
        }, "-=0.2"); // The "-=0.2" overlap makes the slide start just before the tilt finishes for a fluid feel
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="h-screen bg-slate-900 flex items-center justify-center overflow-hidden relative" id="features">
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-6xl px-6 flex flex-col md:flex-row gap-12 items-center z-10">
        
        {/* Left Side text */}
        <div className="w-full md:w-1/3 text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Powerful tools for inclusive design.</h2>
          <p className="text-slate-400 text-lg">
            Stop digging through raw audit reports. Our platform translates complex WCAG guidelines into actionable, visual, and intelligent workflows.
          </p>
        </div>

        {/* Right Side Stacking Cards - Masking container */}
        <div className="w-full md:w-2/3 h-[500px] relative overflow-hidden rounded-3xl shadow-2xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          {features.map((feature, index) => (
            <div 
              key={index}
              ref={(el) => (cardsRef.current[index] = el)}
              className="absolute top-0 left-0 w-full h-full p-8 md:p-12 bg-white flex flex-col justify-center rounded-3xl"
              style={{ 
                zIndex: index, 
                // Adds a strong top shadow so the incoming card casts a shadow over the tilted one
                boxShadow: index > 0 ? "0 -20px 40px -5px rgba(0,0,0,0.3)" : "none" 
              }}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${feature.color}`}>
                {feature.icon}
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">{feature.title}</h3>
              <p className="text-xl text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;