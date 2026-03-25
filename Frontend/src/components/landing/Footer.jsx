import React from 'react';
import { motion } from 'framer-motion';
import { ScanEye, Mail, ArrowRight } from 'lucide-react'; // Removed Github, Twitter, Linkedin

// --- Drop-in SVG Components for the removed Brand Icons ---
const TwitterIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);

const GithubIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.03c3.18-.3 6.5-1.5 6.5-7.17a5.2 5.2 0 0 0-1.5-3.8c.15-.4.65-1.8-.15-3.8 0 0-1.2-.4-3.9 1.4a13.3 13.3 0 0 0-7 0c-2.7-1.8-3.9-1.4-3.9-1.4-.8 2-.3 3.4-.15 3.8a5.2 5.2 0 0 0-1.5 3.8c0 5.6 3.3 6.8 6.5 7.17a4.8 4.8 0 0 0-1 3.03v4"/><path d="M9 20c-5 1.5-5-2.5-7-3"/></svg>
);

const LinkedinIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

const Footer = () => {
  // Framer Motion variants for a staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <footer className="relative bg-slate-950 text-slate-400 pt-24 pb-10 overflow-hidden font-sans z-50">
      
      {/* The Glowing Top Border */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 shadow-[0_0_20px_rgba(99,102,241,0.5)]" />

      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="relative max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8"
      >
        
        {/* --- COLUMN 1: Brand & Mission --- */}
        <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col pr-8">
          <div className="flex items-center gap-2 mb-6 cursor-pointer">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/30">
              <ScanEye size={24} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">A11yAudit</span>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed mb-8">
            Bridging the web accessibility gap through visual DOM exploration and Featherless AI-powered code remediation. Design for everyone.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-500 transition-colors">
              <TwitterIcon size={18} />
            </a>
            <a href="https://github.com/OmkarM9090" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-500 transition-colors">
              <GithubIcon size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-500 transition-colors">
              <LinkedinIcon size={18} />
            </a>
          </div>
        </motion.div>

        {/* --- COLUMN 2: Product Links --- */}
        <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col">
          <h3 className="text-white font-bold tracking-wider uppercase text-sm mb-6">Product</h3>
          <ul className="space-y-4 font-medium">
            <li><a href="#" className="hover:text-indigo-400 transition-colors flex items-center gap-2">Multi-Page Scan</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition-colors flex items-center gap-2">Visual Explorer</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition-colors flex items-center gap-2">AI Remediation</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition-colors flex items-center gap-2">Score Tracking</a></li>
          </ul>
        </motion.div>

        {/* --- COLUMN 3: Resources --- */}
        <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col">
          <h3 className="text-white font-bold tracking-wider uppercase text-sm mb-6">Resources</h3>
          <ul className="space-y-4 font-medium">
            <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">WCAG 2.2 Guide</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">API Documentation</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">Browser Extension</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">Compliance Blog</a></li>
          </ul>
        </motion.div>

        {/* --- COLUMN 4: CTA / Newsletter --- */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
            
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <h3 className="text-white font-bold text-lg mb-2 relative z-10">Stay Compliant.</h3>
            <p className="text-slate-400 text-sm mb-6 relative z-10">
              Get the latest updates on WCAG guidelines and AI accessibility tools delivered to your inbox.
            </p>
            
            <div className="relative z-10 flex flex-col gap-3">
              <div className="relative flex items-center">
                <Mail className="absolute left-3 text-slate-500" size={18} />
                <input 
                  type="email" 
                  placeholder="hello@yourcompany.com" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
              >
                Subscribe <ArrowRight size={16} />
              </motion.button>
            </div>

          </div>
        </motion.div>

      </motion.div>

      {/* --- BOTTOM LEGAL BAR --- */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-6 md:px-12 mt-20 pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium"
      >
        <p>© {new Date().getFullYear()} A11yAudit.</p>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Accessibility Statement</a>
        </div>
      </motion.div>

    </footer>
  );
};

export default Footer;