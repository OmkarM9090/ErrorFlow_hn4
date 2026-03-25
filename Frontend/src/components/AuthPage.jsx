import { useState } from 'react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

const AUTH_ACTIONS = {
  signup: {
    title: 'Create your account',
    subtitle: 'Register with email and password to receive an OTP verification code.',
    button: 'Create account',
  },
  verify: {
    title: 'Verify your email',
    subtitle: 'Enter the 6-digit OTP sent to your email to activate your account.',
    button: 'Verify OTP',
  },
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in securely and continue to your authenticated experience.',
    button: 'Login securely',
  },
};

const emptyForm = {
  email: '',
  password: '',
  otp: '',
};

function AuthPage({ onBackToLanding }) {
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

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <aside className="auth-side">
          <p className="eyebrow">ErrorFlow Authentication</p>
          <h1>{AUTH_ACTIONS[activeTab].title}</h1>
          <p className="sub-copy">{AUTH_ACTIONS[activeTab].subtitle}</p>

          <ul className="feature-list">
            <li>Fast email and password registration</li>
            <li>One-time password verification via email</li>
            <li>Secure JWT authentication flow</li>
            <li>Clean, guided sign-in experience</li>
          </ul>
        </aside>

        <section className="auth-main">
          <div className="auth-topbar">
            <button type="button" className="back-btn" onClick={onBackToLanding}>
              Back to Landing
            </button>
          </div>

          <nav className="tabs" aria-label="Authentication steps">
            <button
              type="button"
              onClick={() => activateTab('signup')}
              className={isSignup ? 'tab active' : 'tab'}
            >
              Signup
            </button>
            <button
              type="button"
              onClick={() => activateTab('verify')}
              className={isVerify ? 'tab active' : 'tab'}
            >
              Verify OTP
            </button>
            <button
              type="button"
              onClick={() => activateTab('login')}
              className={isLogin ? 'tab active' : 'tab'}
            >
              Login
            </button>
          </nav>

          <form onSubmit={submit} className="auth-form">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="you@example.com"
              required
            />

            {(isSignup || isLogin) && (
              <>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                />
              </>
            )}

            {isVerify && (
              <>
                <label htmlFor="otp">OTP</label>
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
                />
              </>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Please wait...' : AUTH_ACTIONS[activeTab].button}
            </button>
          </form>

          {message && <p className={`status ${messageType}`}>{message}</p>}
        </section>
      </section>
    </main>
  );
}

export default AuthPage;
