import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, Loader2, LayoutTemplate } from 'lucide-react';

const STEPS = [
  { id: 1, label: "Establishing secure connection..." },
  { id: 2, label: "Traversing DOM & ARIA trees..." },
  { id: 3, label: "Evaluating WCAG 2.2 AAA criteria..." },
  { id: 4, label: "Synthesizing AI remediation snippets..." }
];

const AuditLoader = () => {
  const [currentStep, setCurrentStep] = useState(1);

  // Simulate the progression of steps
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev < 5 ? prev + 1 : prev));
    }, 2500); // 2.5 seconds per step
    return () => clearInterval(stepInterval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50/80 backdrop-blur-md font-sans">
      
      {/* --- CLASSY BACKGROUND EFFECTS --- */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ 
          backgroundImage: 'linear-gradient(to right, #0F172A 1px, transparent 1px), linear-gradient(to bottom, #0F172A 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} 
      />
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* --- MAIN GLASSMORPHIC CARD --- */}
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} // Classy spring ease
        className="relative z-10 w-full max-w-lg bg-white/90 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-8 md:p-12 overflow-hidden flex flex-col items-center text-center"
      >
        
        {/* Animated Pill Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-8"
        >
          <Sparkles size={16} className="text-amber-500" />
          Powered by Featherless AI
        </motion.div>

        {/* --- THE VISUALIZER: Minimalist Light-Mode Scan --- */}
        <div className="relative w-48 h-48 bg-slate-50 border border-slate-100 rounded-3xl shadow-inner flex flex-col p-5 gap-4 overflow-hidden mb-10">
          
          {/* Mockup Elements */}
          <div className="w-1/3 h-3 bg-slate-200 rounded-full" />
          <div className="w-full h-16 bg-slate-200 rounded-xl flex items-center justify-center text-slate-300">
            <LayoutTemplate size={24} />
          </div>
          <div className="flex gap-3">
            <div className="w-1/2 h-8 bg-slate-200 rounded-lg" />
            <div className="w-1/2 h-8 bg-slate-200 rounded-lg" />
          </div>

          {/* Elegant Gradient Laser */}
          <motion.div 
            animate={{ top: ['-10%', '110%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }}
            className="absolute left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 z-20 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-[2px] bg-white rounded-full blur-[1px]" />
          </motion.div>
        </div>

        {/* Heavy Classy Typography */}
        <h2 className="font-serif text-3xl text-slate-900 mb-2">Auditing Target...</h2>
        <p className="text-slate-500 text-sm font-medium mb-8">Please wait while we generate your dashboard.</p>

        {/* --- DYNAMIC STEP CHECKLIST --- */}
        <div className="w-full flex flex-col gap-4 text-left">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const isPending = currentStep < step.id;

            return (
              <motion.div 
                key={step.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ 
                  opacity: isPending ? 0.3 : 1, 
                  x: 0,
                  scale: isActive ? 1.02 : 1
                }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-4"
              >
                {/* Step Icon Indicator */}
                <div className="w-6 flex justify-center shrink-0">
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="completed"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-emerald-500"
                      >
                        <CheckCircle2 size={20} />
                      </motion.div>
                    ) : isActive ? (
                      <motion.div
                        key="active"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-indigo-600"
                      >
                        <Loader2 size={20} className="animate-spin" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="pending"
                        className="w-2 h-2 rounded-full bg-slate-200"
                      />
                    )}
                  </AnimatePresence>
                </div>

                {/* Step Text */}
                <span className={`text-sm font-semibold transition-colors duration-300 ${
                  isCompleted ? 'text-slate-400' : 
                  isActive ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600' : 
                  'text-slate-300'
                }`}>
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </div>

      </motion.div>
    </div>
  );
};

export default AuditLoader;