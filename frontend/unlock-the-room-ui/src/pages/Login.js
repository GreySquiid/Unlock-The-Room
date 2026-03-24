import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/Users/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Unlock The Room</h1>
        <p style={styles.subtitle}>Developer Dashboard</p>
        <form onSubmit={handleLogin}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit">Log in</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { background: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #e0e0e0', width: '100%', maxWidth: '380px' },
  title: { fontSize: '22px', fontWeight: '600', marginBottom: '4px' },
  subtitle: { fontSize: '14px', color: '#666', marginBottom: '24px' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' },
  error: { color: '#c0392b', fontSize: '13px', marginBottom: '12px' },
  button: { width: '100%', padding: '10px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }
};

export default Login;