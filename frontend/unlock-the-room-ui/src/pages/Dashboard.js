import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { DEMO_EMAIL } from '../config';

function Dashboard() {
  const [stats, setStats] = useState({ total: 0, published: 0, validated: 0 });
  const [lastReset, setLastReset] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isDemo = user.email === DEMO_EMAIL;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchStats();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser.email === DEMO_EMAIL) fetchResetStatus();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchResetStatus = async () => {
    try {
      const res = await api.get('/Users/demo-reset-status');
      if (res.data.lastResetUtc) {
        setLastReset(new Date(res.data.lastResetUtc).toLocaleString());
      }
    } catch {
      // Not critical — silently ignore
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/Levels');
      const levels = res.data;
      setStats({
        total: levels.length,
        published: levels.filter(l => l.isPublished).length,
        validated: levels.filter(l => l.isValidated).length,
      });
    } catch {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div style={styles.brand}>
          <span style={styles.brandName}>Unlock The Room</span>
          <span style={styles.brandSub}>Developer Dashboard</span>
        </div>
        <div style={styles.topRight}>
          <span style={styles.userEmail}>{user.email}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Log out</button>
        </div>
      </div>

      <div style={styles.content}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>Welcome back, {user.email}.</p>

        <div style={styles.statsGrid}>
          <StatCard label="Total levels" value={stats.total} color="var(--color-primary)" />
          <StatCard label="Published" value={stats.published} color="var(--color-success-text)" />
          <StatCard label="Validated" value={stats.validated} color="var(--color-primary)" />
        </div>

        <p style={styles.sectionLabel}>Quick actions</p>
        <div style={styles.actionsGrid}>
          <ActionCard
            title="Manage levels"
            description="Create, edit, reorder, and publish levels"
            onClick={() => navigate('/levels')}
            primary
          />
          <ActionCard
            title="AI Generator"
            description="Generate a new level with AI assistance"
            onClick={() => navigate('/ai-generator')}
          />
          <ActionCard
            title="View reports"
            description="Level inventory and analytics"
            onClick={() => navigate('/reports')}
          />
          <ActionCard
            title="Play game"
            description="Open the player-facing game"
            onClick={() => navigate('/play')}
          />
        </div>
      </div>

      {isDemo && (
        <div style={styles.demoFooter}>
          {lastReset
            ? `Last demo reset: ${lastReset}`
            : 'Demo reset pending — runs every 24 h'}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statAccent, background: color }} />
      <div style={styles.statBody}>
        <p style={styles.statLabel}>{label}</p>
        <p style={styles.statValue}>{value}</p>
      </div>
    </div>
  );
}

function ActionCard({ title, description, onClick, primary }) {
  return (
    <div style={{ ...styles.actionCard, ...(primary ? styles.actionCardPrimary : {}) }} onClick={onClick}>
      <p style={{ ...styles.actionTitle, ...(primary ? { color: 'var(--surface)' } : {}) }}>{title}</p>
      <p style={{ ...styles.actionDesc, ...(primary ? { color: 'rgba(255,255,255,0.7)' } : {}) }}>{description}</p>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg)' },
  topBar: { background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '12px 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brand: { display: 'flex', flexDirection: 'column' },
  brandName: { fontSize: '15px', fontWeight: '700', color: 'var(--text)' },
  brandSub: { fontSize: '11px', color: 'var(--text-subtle)' },
  topRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  userEmail: { fontSize: '13px', color: 'var(--text-dim)' },
  logoutBtn: { padding: '5px 12px', background: 'var(--surface)', border: '1px solid var(--border-divider)', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' },
  content: { padding: '2rem 2.5rem' },
  title: { fontSize: '28px', fontWeight: '700', margin: '0 0 4px' },
  subtitle: { fontSize: '14px', color: 'var(--text-dim)', margin: '0 0 1.5rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))', gap: '12px', marginBottom: '2rem' },
  statCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', display: 'flex' },
  statAccent: { width: '4px', flexShrink: 0 },
  statBody: { padding: '1.25rem 1.5rem' },
  statLabel: { fontSize: '13px', color: 'var(--text-subtle)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValue: { fontSize: '40px', fontWeight: '700', margin: 0 },
  sectionLabel: { fontSize: '11px', fontWeight: '600', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' },
  actionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' },
  actionCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.5rem', cursor: 'pointer' },
  actionCardPrimary: { background: 'var(--color-primary)', border: '1px solid var(--color-primary)' },
  actionTitle: { fontSize: '15px', fontWeight: '600', margin: '0 0 6px' },
  actionDesc: { fontSize: '13px', color: 'var(--text-subtle)', margin: 0 },
  demoFooter: {
    fontSize: '11px',
    color: 'var(--text-placeholder)',
    textAlign: 'center',
    padding: '12px',
    borderTop: '1px solid var(--bg-hover)',
    background: 'var(--surface)',
  },
};

export default Dashboard;
