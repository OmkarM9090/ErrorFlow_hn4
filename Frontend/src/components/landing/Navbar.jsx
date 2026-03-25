import React from 'react';
import { motion } from 'framer-motion';
import { ScanEye } from 'lucide-react';

const Navbar = () => {
  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center mt-6 px-4"
    >
      <div className="w-full max-w-5xl bg-white/70 backdrop-blur-md border border-white/20 shadow-lg shadow-slate-200/50 rounded-full px-6 py-3 flex items-center justify-between">
        
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="bg-indigo-600 p-2 rounded-full text-white">
            <ScanEye size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">A11yAudit</span>
        </div>

        <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
          <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it Works</a>
          <a href="#extension" className="hover:text-indigo-600 transition-colors">Extension</a>
        </div>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-full font-medium hover:bg-slate-800 transition-colors shadow-md"
        >
          Start Audit
        </motion.button>
      </div>
    </motion.nav>
  );
};

export default Navbar;