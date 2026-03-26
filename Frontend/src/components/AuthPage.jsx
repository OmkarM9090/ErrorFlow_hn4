import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, KeyRound, ShieldCheck, Sparkles } from 'lucide-react';

// --- IMPORT OUR NEW COMMON COMPONENTS ---
import Button from '../components/common/Button'; 
import Badge from '../components/common/Badge';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const AUTH_ACTIONS = {
  signup: {
    title: 'Create your account',
    subtitle: 'Register with email and password to receive an OTP verification code.',
    button: 'Create account',
    icon: <Sparkles className="text-amber-400 mb-6" size={32} />
  },
  verify: {
    title: 'Verify your email',
    subtitle: 'Enter the 6-digit OTP sent to your email to activate your account.',
    button: 'Verify OTP',
    icon: <ShieldCheck className="text-emerald-400 mb-6" size={32} />
  },
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in securely and continue to your authenticated experience.',
    button: 'Login securely',
    icon: <Lock className="text-indigo-400 mb-6" size={32} />
  },
};

const emptyForm = {
  email: '',
  password: '',
  otp: '',
};

function AuthPage({ onBackToLanding, onAuthSuccess }) {
  // ==========================================
  // BACKEND LOGIC (100% UNTOUCHED)
  // ==========================================
  const [activeTab, setActiveTab] = useState('signup');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  const showMessage = (type, text) => {
    setMessageType(type);
    setMessage(text);
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const callApi = async ({ path, payload }) => {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw new Error('Cannot connect to backend. Start backend on port 5000 and check API URL.');
    }

    let data = {};
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  };

  const activateTab = (tab) => {
    setActiveTab(tab);
    setMessage('');
  };

  const validateBeforeSubmit = () => {
    if (!form.email) {
      throw new Error('Email is required');
    }
    if ((activeTab === 'signup' || activeTab === 'login') && form.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    if (activeTab === 'verify' && !/^\d{6}$/.test(form.otp)) {
      throw new Error('OTP must be exactly 6 digits');
    }
  };

  const handleSignup = async () => {
    const data = await callApi({
      path: '/api/auth/signup',
      payload: {
        email: form.email,
        password: form.password,
      },
    });
    showMessage('success', data.message || 'Account created. Check your email for OTP.');
    setActiveTab('verify');
  };

  const handleVerify = async () => {
    const data = await callApi({
      path: '/api/auth/verify-otp',
      payload: {
        email: form.email,
        otp: form.otp,
      },
    });
    showMessage('success', data.message || 'Email verified. You can login now.');
    setActiveTab('login');
  };

  const handleLogin = async () => {
    const data = await callApi({
      path: '/api/auth/login',
      payload: {
        email: form.email,
        password: form.password,
      },
    });
    showMessage('success', data.message || 'Login successful.');
    if (typeof onAuthSuccess === 'function') {
      onAuthSuccess({ token: data.token, email: form.email });
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      validateBeforeSubmit();

      if (activeTab === 'signup') {
        await handleSignup();
      } else if (activeTab === 'verify') {
        await handleVerify();
      } else {
        await handleLogin();
      }
    } catch (error) {
      showMessage('error', error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const isSignup = activeTab === 'signup';
  const isVerify = activeTab === 'verify';
  const isLogin = activeTab === 'login';

  // ==========================================
  // ADVANCED UI SHELL (BRIGHT MODE)
  // ==========================================
  return (
    <main className="relative min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 md:p-8 overflow-hidden font-sans">
      
      {/* Background Layer */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ 
          backgroundImage: 'linear-gradient(to right, #0F172A 1px, transparent 1px), linear-gradient(to bottom, #0F172A 1px, transparent 1px)', 
          backgroundSize: '4vw 4vw' 
        }} 
      />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl bg-white/80 backdrop-blur-2xl border border-slate-200 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row"
      >
        
        {/* LEFT SIDE: Context Panel */}
        <aside className="w-full md:w-5/12 bg-slate-950 p-10 md:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]" />
          
          <div className="relative z-10">
            <button 
              onClick={onBackToLanding}
              className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold mb-16"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Landing
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {AUTH_ACTIONS[activeTab].icon}
                
                {/* --- USING THE COMMON BADGE COMPONENT --- */}
                <Badge icon={ShieldCheck} className="mb-4 bg-white/10 text-white border-white/20">
                  A11yAuditor Auth
                </Badge>
                
                <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
                  {AUTH_ACTIONS[activeTab].title}
                </h1>
                <p className="text-slate-400 text-lg leading-relaxed">
                  {AUTH_ACTIONS[activeTab].subtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative z-10 mt-12 pt-8 border-t border-slate-800">
            <ul className="space-y-3 text-sm text-slate-500 font-medium">
              <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-500" /> Secure JWT authentication flow</li>
              <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-500" /> One-time password verification</li>
            </ul>
          </div>
        </aside>

        {/* RIGHT SIDE: Interactive Form */}
        <section className="w-full md:w-7/12 p-10 md:p-16 bg-white/50 flex flex-col justify-center">
          
          {/* Animated Premium Tabs */}
          <nav className="flex p-1.5 bg-slate-100/80 border border-slate-200 rounded-2xl mb-10 relative" aria-label="Authentication steps">
            {['signup', 'verify', 'login'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => activateTab(tab)}
                className={`relative flex-1 py-3 text-sm font-bold rounded-xl z-10 transition-colors ${
                  activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-slate-900 rounded-xl -z-10 shadow-md" 
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>

          <form onSubmit={submit} className="flex flex-col gap-5">
            
            {/* Email Field (Always visible) */}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-bold text-slate-700">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 text-slate-400" size={18} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {/* Password Field (Signup / Login) */}
              {(isSignup || isLogin) && (
                <motion.div 
                  key="password-field"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="flex flex-col gap-2"
                >
                  <label htmlFor="password" className="text-sm font-bold text-slate-700">Password</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-4 text-slate-400" size={18} />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={onChange}
                      placeholder="Minimum 6 characters"
                      minLength={6}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                    />
                  </div>
                </motion.div>
              )}

              {/* OTP Field (Verify) */}
              {isVerify && (
                <motion.div 
                  key="otp-field"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="flex flex-col gap-2"
                >
                  <label htmlFor="otp" className="text-sm font-bold text-slate-700">One-Time Password</label>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-4 text-slate-400" size={18} />
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      value={form.otp}
                      onChange={onChange}
                      placeholder="6-digit OTP"
                      maxLength={6}
                      inputMode="numeric"
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm font-mono tracking-widest text-lg"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- USING THE COMMON BUTTON COMPONENT --- */}
            <Button 
              type="submit" 
              variant="primary" 
              isLoading={loading} 
              className="mt-4 w-full py-4 text-lg"
            >
              {AUTH_ACTIONS[activeTab].button}
            </Button>

          </form>

          {/* Dynamic Status Message */}
          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-6 p-4 rounded-xl border text-sm font-semibold ${
                  messageType === 'error' ? 'bg-rose-50 border-rose-200 text-rose-600' :
                  messageType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                  'bg-blue-50 border-blue-200 text-blue-600'
                }`}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>

        </section>
      </motion.div>
    </main>
  );
}

export default AuthPage;