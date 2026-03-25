import { useMemo, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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

  const showMessage = (type, text) => {
    setMessageType(type);
    setMessage(text);
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const callApi = async (path, payload, jwtToken = '') => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  };

  const handleSignup = async () => {
    const data = await callApi('/api/auth/signup', {
      email: form.email,
      password: form.password,
    });

    showMessage('success', data.message || 'Signup completed. Check your email for OTP.');
    setActiveTab('verify');
  };

  const handleVerify = async () => {
    const data = await callApi('/api/auth/verify-otp', {
      email: form.email,
      otp: form.otp,
    });

    showMessage('success', data.message || 'Email verified successfully. You can login now.');
    setActiveTab('login');
  };

  const handleLogin = async () => {
    const data = await callApi('/api/auth/login', {
      email: form.email,
      password: form.password,
    });

    setToken(data.token);
    localStorage.setItem('authToken', data.token);
    showMessage('success', data.message || 'Login successful. JWT token saved locally.');
  };

  const handleProtectedCheck = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/protected`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Protected route failed');
      }

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

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <header className="auth-header">
          <p className="eyebrow">ErrorFlow Authentication</p>
          <h1>{actions[activeTab].title}</h1>
          <p>{actions[activeTab].subtitle}</p>
        </header>

        <nav className="tabs" aria-label="Authentication steps">
          <button
            type="button"
            onClick={() => setActiveTab('signup')}
            className={activeTab === 'signup' ? 'tab active' : 'tab'}
          >
            Signup
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('verify')}
            className={activeTab === 'verify' ? 'tab active' : 'tab'}
          >
            Verify OTP
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={activeTab === 'login' ? 'tab active' : 'tab'}
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

          {(activeTab === 'signup' || activeTab === 'login') && (
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

          {activeTab === 'verify' && (
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
          <button type="button" className="secondary-btn" onClick={handleProtectedCheck} disabled={!token}>
            Test protected route
          </button>
          <button type="button" className="secondary-btn" onClick={clearSession}>
            Clear local token
          </button>
        </div>

        <footer className="meta">
          <span>API Base URL: {API_BASE_URL}</span>
          <span>{token ? 'JWT token saved in localStorage' : 'No JWT token saved'}</span>
        </footer>
      </section>
    </main>
  );
}

export default AuthPage;
