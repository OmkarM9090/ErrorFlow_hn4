import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const Button = ({ 
  children, 
  variant = 'primary', 
  icon: Icon, 
  isLoading = false, 
  className = '', 
  disabled, 
  type = 'button',
  iconPosition = 'right',
  ...props 
}) => {
  
  const baseClasses = "group relative flex items-center justify-center gap-2 font-bold rounded-xl transition-all overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed";
  const sizeClasses = "px-6 py-3.5 md:px-8 md:py-4 text-sm md:text-base";

  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30",
    secondary: "bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:shadow-indigo-500/20",
    outline: "bg-transparent border border-slate-200 hover:border-indigo-500 text-slate-800 bg-white/50 backdrop-blur-sm",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 shadow-none"
  };

  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          )}
          
          <span className="relative z-10">{children}</span>
          
          {Icon && iconPosition === 'right' && (
            <Icon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          )}
        </>
      )}
    </motion.button>
  );
};

export default Button;