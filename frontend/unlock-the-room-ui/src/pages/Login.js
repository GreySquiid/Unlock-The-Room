import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../config';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const errors = {};
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    return errors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/Users/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setFormErrors({});
    setError('');
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setError('');
    try {
      const response = await api.post('/Users/demo-login');
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch {
      setError('Demo login unavailable. Use the credentials below to log in manually.');
      setEmail(DEMO_EMAIL);
      setPassword(DEMO_PASSWORD);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardAccent} />
        <div style={styles.cardBody}>
          <h1 style={styles.title}>Unlock The Room</h1>
          <p style={styles.subtitle}>Developer Dashboard</p>
          <form onSubmit={handleLogin} noValidate>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                style={{ ...styles.input, ...(formErrors.email ? styles.inputError : {}) }}
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                }}
              />
              {formErrors.email && <p style={styles.fieldError}>{formErrors.email}</p>}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                style={{ ...styles.input, ...(formErrors.password ? styles.inputError : {}) }}
                type="password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (formErrors.password) setFormErrors(prev => ({ ...prev, password: '' }));
                }}
              />
              {formErrors.password && <p style={styles.fieldError}>{formErrors.password}</p>}
            </div>
            {error && <p style={styles.error}>{error}</p>}
            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Log in'}
            </button>
          </form>
        </div>

        <div style={styles.demoPanel}>
          <p style={styles.demoPanelTitle}>Just want to look around?</p>
          <p style={styles.demoPanelSub}>Use the demo developer account.</p>
          <div style={styles.demoCredRow}>
            <span style={styles.demoCredLabel}>Email</span>
            <span style={styles.demoCredValue}>{DEMO_EMAIL}</span>
          </div>
          <div style={styles.demoCredRow}>
            <span style={styles.demoCredLabel}>Password</span>
            <span style={styles.demoCredValue}>{DEMO_PASSWORD}</span>
          </div>
          <div style={styles.demoBtnRow}>
            <button style={styles.demoFillBtn} onClick={handleFillDemo}>
              Fill credentials
            </button>
            <button
              style={{ ...styles.demoLoginBtn, ...(demoLoading ? styles.demoBtnDisabled : {}) }}
              onClick={handleDemoLogin}
              disabled={demoLoading}
            >
              {demoLoading ? 'Logging in…' : 'Log in as demo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
  },
  card: {
    background: 'var(--surface)',
    borderRadius: '14px',
    border: '1px solid var(--border-light)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.06)',
    width: '100%',
    maxWidth: '380px',
    overflow: 'hidden',
  },
  cardAccent: {
    height: '4px',
    background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-hover))',
  },
  cardBody: {
    padding: '2rem',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    marginBottom: '3px',
    letterSpacing: '-0.2px',
    color: 'var(--text)',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-subtle)',
    marginBottom: '28px',
  },
  field: { marginBottom: '16px' },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '6px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid var(--border-divider)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--text)',
    background: 'var(--surface-raised)',
    transition: 'border-color 0.15s',
  },
  inputError: {
    borderColor: 'var(--color-danger)',
    background: 'var(--color-danger-bg-subtle)',
  },
  error: {
    color: 'var(--color-danger)',
    fontSize: '13px',
    marginBottom: '14px',
    padding: '8px 10px',
    background: 'var(--color-danger-bg-subtle)',
    borderRadius: '6px',
    border: '1px solid var(--color-danger-border)',
  },
  fieldError: { color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px' },
  button: {
    width: '100%',
    padding: '11px',
    background: 'var(--color-primary)',
    color: 'var(--surface)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '4px',
    letterSpacing: '0.2px',
  },
  demoPanel: {
    borderTop: '1px solid var(--bg-hover)',
    padding: '1.25rem 2rem 1.5rem',
    background: 'var(--surface-raised)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  demoPanelTitle: { fontSize: '13px', fontWeight: '600', color: 'var(--text)', margin: 0 },
  demoPanelSub: { fontSize: '12px', color: 'var(--text-subtle)', margin: 0 },
  demoCredRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  demoCredLabel: { fontSize: '11px', fontWeight: '600', color: 'var(--text-placeholder)', textTransform: 'uppercase', letterSpacing: '0.4px', minWidth: '58px' },
  demoCredValue: { fontSize: '13px', color: 'var(--text-strong)', fontFamily: 'monospace', background: 'var(--border-subtle)', padding: '2px 8px', borderRadius: '4px' },
  demoBtnRow: { display: 'flex', gap: '8px', marginTop: '4px' },
  demoFillBtn: {
    padding: '7px 14px',
    background: 'var(--surface)',
    border: '1px solid var(--border-divider)',
    borderRadius: '7px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
  },
  demoLoginBtn: {
    padding: '7px 14px',
    background: 'var(--color-primary)',
    border: 'none',
    borderRadius: '7px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    color: 'var(--surface)',
  },
  demoBtnDisabled: { opacity: 0.7, cursor: 'not-allowed' },
};

export default Login;
