import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

const emptyForm = {
  email: '',
  password: '',
  otp: '',
};

function AuthPage() {
  const [activeTab, setActiveTab] = useState('signup');
  const [form, setForm] = useState(emptyForm);
  const [token, setToken] = useState(localStorage.getItem('authToken') || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [backendStatus, setBackendStatus] = useState('checking');

  const actions = useMemo(
    () => ({
      signup: {
        title: 'Create account',
        subtitle: 'Register with your email and get an OTP verification code.',
        button: 'Sign up and send OTP',
      },
      verify: {
        title: 'Verify OTP',
        subtitle: 'Enter the 6-digit OTP sent to your email address.',
        button: 'Verify account',
      },
      login: {
        title: 'Secure login',
        subtitle: 'Login after verification and receive a JWT token.',
        button: 'Login',
      },
    }),
    []
  );

  useEffect(() => {
    const healthCheck = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/`, { method: 'GET' });
        if (!response.ok) {
          throw new Error('Backend is not responding correctly');
        }
        setBackendStatus('online');
      } catch (error) {
        setBackendStatus('offline');
      }
    };

    healthCheck();
  }, []);

  const showMessage = (type, text) => {
    setMessageType(type);
    setMessage(text);
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const callApi = async ({ path, method = 'POST', payload, jwtToken = '' }) => {
    let response;

    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
        },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      });
    } catch (error) {
      throw new Error('Cannot connect to backend. Start backend on port 5000 and check CORS/API URL.');
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

    showMessage('success', data.message || 'Signup completed. Check your email for OTP.');
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

    showMessage('success', data.message || 'Email verified successfully. You can login now.');
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

    setToken(data.token);
    localStorage.setItem('authToken', data.token);
    showMessage('success', data.message || 'Login successful. JWT token saved locally.');
  };

  const handleProtectedCheck = async () => {
    try {
      const data = await callApi({
        path: '/api/auth/protected',
        method: 'GET',
        jwtToken: token,
      });

      showMessage('success', `Protected route success: ${data.message}`);
    } catch (error) {
      showMessage('error', error.message || 'Unable to access protected route');
    }
  };

  const clearSession = () => {
    setToken('');
    localStorage.removeItem('authToken');
    showMessage('info', 'Local session token cleared.');
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

  const tokenPreview = token ? `${token.slice(0, 18)}...${token.slice(-10)}` : 'No JWT token saved';

  const isSignup = activeTab === 'signup';
  const isVerify = activeTab === 'verify';
  const isLogin = activeTab === 'login';

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <aside className="auth-side">
          <p className="eyebrow">ErrorFlow Authentication</p>
          <h1>{actions[activeTab].title}</h1>
          <p className="sub-copy">{actions[activeTab].subtitle}</p>

          <div className="status-rail">
            <div className="badge-row">
              <span className={`dot ${backendStatus}`} />
              <span className="badge-text">
                {backendStatus === 'online'
                  ? 'Backend online'
                  : backendStatus === 'offline'
                    ? 'Backend offline'
                    : 'Checking backend'}
              </span>
            </div>
            <span className="api-label">API: {API_BASE_URL}</span>
          </div>

          <ul className="feature-list">
            <li>Email + password signup</li>
            <li>OTP verification by email</li>
            <li>JWT protected routes</li>
          </ul>
        </aside>

        <section className="auth-main">
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
              {loading ? 'Please wait...' : actions[activeTab].button}
            </button>
          </form>

          {message && <p className={`status ${messageType}`}>{message}</p>}

          <div className="token-tools">
            <button type="button" className="secondary-btn" onClick={handleProtectedCheck} disabled={!token || loading}>
              Test protected route
            </button>
            <button type="button" className="secondary-btn" onClick={clearSession} disabled={loading}>
              Clear local token
            </button>
          </div>

          <footer className="meta">
            <span>{token ? 'JWT token saved in localStorage' : 'No JWT token saved'}</span>
            <span className="token-preview">Token: {tokenPreview}</span>
          </footer>
        </section>
      </section>
    </main>
  );
}

export default AuthPage;
