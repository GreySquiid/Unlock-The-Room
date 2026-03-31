import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
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
    background: '#f0f2f5',
  },
  card: {
    background: '#fff',
    borderRadius: '14px',
    border: '1px solid #e8e8e8',
    boxShadow: '0 4px 24px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.06)',
    width: '100%',
    maxWidth: '380px',
    overflow: 'hidden',
  },
  cardAccent: {
    height: '4px',
    background: 'linear-gradient(90deg, #185FA5, #534AB7)',
  },
  cardBody: {
    padding: '2rem',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    marginBottom: '3px',
    letterSpacing: '-0.2px',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: '13px',
    color: '#999',
    marginBottom: '28px',
  },
  field: { marginBottom: '16px' },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '6px',
    color: '#444',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1a1a1a',
    background: '#fafafa',
    transition: 'border-color 0.15s',
  },
  inputError: {
    borderColor: '#c0392b',
    background: '#fff8f8',
  },
  error: {
    color: '#c0392b',
    fontSize: '13px',
    marginBottom: '14px',
    padding: '8px 10px',
    background: '#fff5f5',
    borderRadius: '6px',
    border: '1px solid #f5c6c6',
  },
  fieldError: { color: '#c0392b', fontSize: '12px', marginTop: '4px' },
  button: {
    width: '100%',
    padding: '11px',
    background: '#185FA5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '4px',
    letterSpacing: '0.2px',
  },
};

export default Login;
