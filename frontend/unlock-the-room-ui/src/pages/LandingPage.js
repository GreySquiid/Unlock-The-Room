import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const GITHUB_URL = 'https://github.com/GreySquiid/Unlock-The-Room';

const TECH_BADGES = [
  { label: '.NET 8', color: '#512BD4' },
  { label: 'React 18', color: '#61DAFB', dark: true },
  { label: 'PostgreSQL', color: '#336791' },
  { label: 'Anthropic API', color: '#D97706' },
  { label: 'JWT Auth', color: '#10B981' },
  { label: 'Docker', color: '#2496ED' },
  { label: 'Railway', color: '#0B0D0E' },
];

function LandingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleTourDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/Users/demo-login');
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch {
      setError('Demo login unavailable. You can log in manually below.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* ── Nav bar ── */}
      <div style={styles.nav}>
        <span style={styles.navBrand}>Unlock The Room</span>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer" style={styles.navLink}>
          GitHub ↗
        </a>
      </div>

      {/* ── Hero ── */}
      <div style={styles.hero}>
        <img
          src="/assets/squid-sprite.png"
          alt="GreySquiid mascot"
          style={styles.squid}
        />
        <h1 style={styles.heroTitle}>Unlock The Room</h1>
        <p style={styles.heroPitch}>
          AI-assisted puzzle platformer with full-stack admin tooling — a WGU capstone, polished as a portfolio piece.
        </p>

        {/* ── CTA cards ── */}
        <div style={styles.ctaRow}>
          <div style={{ ...styles.ctaCard, ...styles.ctaCardPrimary }}>
            <div style={styles.ctaNumber}>1</div>
            <h2 style={styles.ctaTitle}>Tour the developer dashboard</h2>
            <p style={styles.ctaDesc}>
              One-click demo login — land on the full dashboard with AI generator, reports, and level management.
            </p>
            {error && (
              <p style={styles.ctaError}>
                {error}{' '}
                <a href="/login" style={styles.ctaErrorLink}>Log in manually →</a>
              </p>
            )}
            <button
              style={{ ...styles.ctaBtn, ...styles.ctaBtnPrimary, ...(loading ? styles.ctaBtnDisabled : {}) }}
              onClick={handleTourDashboard}
              disabled={loading}
            >
              {loading ? (
                <span style={styles.spinnerRow}>
                  <span style={styles.spinner} />
                  Logging in…
                </span>
              ) : (
                'Tour the dashboard →'
              )}
            </button>
          </div>

          <div style={styles.ctaCard}>
            <div style={{ ...styles.ctaNumber, ...styles.ctaNumberSecondary }}>2</div>
            <h2 style={{ ...styles.ctaTitle, color: '#1a1a1a' }}>Play the game</h2>
            <p style={{ ...styles.ctaDesc, color: '#555' }}>
              Eight hand-crafted levels plus AI-generated levels. Keys, barriers, spikes — escape the room.
            </p>
            <button
              style={{ ...styles.ctaBtn, ...styles.ctaBtnSecondary }}
              onClick={() => navigate('/play')}
            >
              Play now →
            </button>
          </div>

          <div style={styles.ctaCard}>
            <div style={{ ...styles.ctaNumber, ...styles.ctaNumberSecondary }}>3</div>
            <h2 style={{ ...styles.ctaTitle, color: '#1a1a1a' }}>View the code</h2>
            <p style={{ ...styles.ctaDesc, color: '#555' }}>
              Full source on GitHub — .NET 8 API, React SPA, canvas game engine, and AI pipeline.
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              style={{ ...styles.ctaBtn, ...styles.ctaBtnSecondary, textDecoration: 'none', display: 'inline-block' }}
            >
              GitHub →
            </a>
          </div>
        </div>
      </div>

      {/* ── About section ── */}
      <div style={styles.about}>
        <div style={styles.aboutInner}>
          <h2 style={styles.aboutTitle}>About this project</h2>

          <div style={styles.aboutGrid}>
            <div style={styles.aboutText}>
              <p style={styles.aboutPara}>
                Unlock The Room is a browser-based puzzle platformer where players collect colored keys to unlock
                matching barriers and reach the exit. The differentiator is the{' '}
                <strong>AI level generation pipeline</strong>: a developer fills out a constraint form (difficulty,
                grid size, hazard density, layout archetype), hits Generate, and the Anthropic API returns a
                fully-structured level — barriers, keys, platforms, and exit door — which is validated against
                game-design tokens and immediately playable.
              </p>
              <p style={styles.aboutPara}>
                The backend is an ASP.NET Core (.NET 8) REST API backed by PostgreSQL via EF Core. The developer
                dashboard is a React 18 SPA with level management, analytics, and the AI generator. The game
                itself runs on the HTML5 Canvas API — no game engine, just vanilla JavaScript.
              </p>

              <div style={styles.badgeRow}>
                {TECH_BADGES.map(b => (
                  <span
                    key={b.label}
                    style={{ ...styles.badge, background: b.color, color: b.dark ? '#1a1a1a' : '#fff' }}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            </div>

            <div style={styles.screenshotCol}>
              <div style={styles.screenshotPlaceholder}>
                <div style={styles.screenshotLabel}>AI Generator</div>
                <div style={styles.screenshotSub}>Dashboard → AI Generator generates a level from constraints</div>
              </div>
              <div style={styles.screenshotPlaceholder}>
                <div style={styles.screenshotLabel}>Level Management</div>
                <div style={styles.screenshotSub}>Publish, edit, and reorder levels from the dashboard</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={styles.footer}>
        <span>Built by Josh Davidson · GreySquiid Studios</span>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer" style={styles.footerLink}>
          GitHub
        </a>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8f8f8',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },

  /* Nav */
  nav: {
    background: '#fff',
    borderBottom: '1px solid #e8e8e8',
    padding: '14px 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navBrand: { fontSize: '15px', fontWeight: '700', color: '#1a1a1a' },
  navLink: { fontSize: '13px', color: '#6366F1', textDecoration: 'none', fontWeight: '500' },

  /* Hero */
  hero: {
    background: 'linear-gradient(160deg, #1a1a2e 0%, #16213E 60%, #0F3460 100%)',
    padding: '4rem 2rem 5rem',
    textAlign: 'center',
    color: '#fff',
  },
  squid: {
    width: '64px',
    height: '64px',
    marginBottom: '1rem',
    imageRendering: 'pixelated',
  },
  heroTitle: {
    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
    fontWeight: '800',
    margin: '0 0 0.75rem',
    letterSpacing: '-1px',
  },
  heroPitch: {
    fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
    color: 'rgba(255,255,255,0.72)',
    maxWidth: '560px',
    margin: '0 auto 3rem',
    lineHeight: 1.6,
  },

  /* CTA cards */
  ctaRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    maxWidth: '960px',
    margin: '0 auto',
    textAlign: 'left',
  },
  ctaCard: {
    background: '#fff',
    borderRadius: '14px',
    padding: '1.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  ctaCardPrimary: {
    background: '#6366F1',
    boxShadow: '0 8px 32px rgba(99,102,241,0.45)',
  },
  ctaNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
    flexShrink: 0,
  },
  ctaNumberSecondary: { background: '#f0f0f0', color: '#555' },
  ctaTitle: { fontSize: '16px', fontWeight: '700', margin: 0, color: '#fff' },
  ctaDesc: { fontSize: '13px', color: 'rgba(255,255,255,0.78)', margin: 0, lineHeight: 1.55, flexGrow: 1 },
  ctaError: { fontSize: '12px', color: 'rgba(255,255,255,0.9)', margin: 0, background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '8px 10px' },
  ctaErrorLink: { color: '#fff', fontWeight: '600' },
  ctaBtn: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    marginTop: '4px',
  },
  ctaBtnPrimary: { background: '#fff', color: '#6366F1' },
  ctaBtnSecondary: { background: '#6366F1', color: '#fff' },
  ctaBtnDisabled: { opacity: 0.7, cursor: 'not-allowed' },
  spinnerRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  spinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(99,102,241,0.3)',
    borderTopColor: '#6366F1',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },

  /* About */
  about: { padding: '4rem 2rem', background: '#fff' },
  aboutInner: { maxWidth: '960px', margin: '0 auto' },
  aboutTitle: { fontSize: '1.6rem', fontWeight: '700', margin: '0 0 2rem', color: '#1a1a1a' },
  aboutGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' },
  aboutText: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  aboutPara: { fontSize: '14px', color: '#444', lineHeight: 1.7, margin: 0 },
  badgeRow: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' },
  badge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.2px',
  },
  screenshotCol: { display: 'flex', flexDirection: 'column', gap: '12px' },
  screenshotPlaceholder: {
    background: '#f5f5f5',
    border: '1px solid #e8e8e8',
    borderRadius: '10px',
    padding: '1.5rem',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '6px',
  },
  screenshotLabel: { fontSize: '14px', fontWeight: '600', color: '#1a1a1a' },
  screenshotSub: { fontSize: '12px', color: '#888' },

  /* Footer */
  footer: {
    background: '#1a1a2e',
    color: 'rgba(255,255,255,0.5)',
    padding: '1.25rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    marginTop: 'auto',
  },
  footerLink: { color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontWeight: '500' },
};

export default LandingPage;
