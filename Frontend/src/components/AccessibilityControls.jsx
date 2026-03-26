import React, { useState, useEffect } from 'react';
import { Type, Scale, X, Accessibility, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AccessibilityControls = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [isDyslexicFont, setIsDyslexicFont] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    // Apply filters
    const root = document.documentElement;
    
    // High Contrast (Simplified)
    let filterString = '';
    
    if (isHighContrast) {
        // Simple high contrast via CSS filter or mix-blend-mode could work, 
        // but let's use the SVG filter for consistency or just CSS contrast
        filterString += 'contrast(150%) ';
    }

    document.body.style.filter = filterString;

    // Font Size
    root.style.fontSize = `${fontSize}%`;

    // Dyslexic Font
    if (isDyslexicFont) {
      document.body.classList.add('font-dyslexic');
      // Inject font-family style if not present in CSS
      if (!document.getElementById('dyslexic-font-style')) {
        const style = document.createElement('style');
        style.id = 'dyslexic-font-style';
        style.innerHTML = `
          @font-face {
            font-family: 'OpenDyslexic';
            src: url('https://cdn.jsdelivr.net/npm/opendyslexic@2.1.0-beta1/resources/fonts/OpenDyslexic-Regular.otf');
            font-display: swap;
          }
          .font-dyslexic * {
            font-family: 'OpenDyslexic', sans-serif !important;
            line-height: 1.6 !important;
            letter-spacing: 0.05em !important;
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      document.body.classList.remove('font-dyslexic');
    }

  }, [fontSize, isDyslexicFont, isHighContrast]);

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:scale-110 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300"
        aria-label="Open Accessibility Menu"
      >
        <Accessibility size={28} />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-24 right-6 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-slate-900">Accessibility Tools</h3>
              <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-slate-100">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Toggles Grid */}
              <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => setIsHighContrast(!isHighContrast)}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 transition ${isHighContrast ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                    <Sun size={20} />
                    <span className="text-xs font-medium">High Contrast</span>
                </button>
                
                <button
                    onClick={() => setIsDyslexicFont(!isDyslexicFont)}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 transition ${isDyslexicFont ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                    <Type size={20} />
                    <span className="text-xs font-medium">Dyslexia Font</span>
                </button>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                  <div className="flex items-center gap-2">
                    <Scale size={16} />
                    <span>Text Size</span>
                  </div>
                  <span>{fontSize}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="150"
                  step="10"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AccessibilityControls;