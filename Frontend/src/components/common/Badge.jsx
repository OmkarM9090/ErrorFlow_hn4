import React from 'react';

const Badge = ({ children, icon: Icon, iconColor = "text-amber-500", className = "" }) => {
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-indigo-700 font-bold text-xs md:text-sm tracking-wide uppercase ${className}`}>
      {Icon && <Icon size={16} className={iconColor} />}
      {children}
    </div>
  );
};

export default Badge;