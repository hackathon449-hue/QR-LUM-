
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon } from 'lucide-react';

const NAV_LINKS = [
  { id: 'hero', label: 'Home' },
  { id: 'generator', label: 'Generator' },
  { id: 'anatomy', label: 'Anatomy' },
  { id: '3d-explorer', label: '3D Explorer' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'error-correction', label: 'Error Lab' },
  { id: 'scan', label: 'Scan' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [theme, setTheme] = useState(
    () => localStorage.getItem('qr-lab-theme') || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('qr-lab-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => current === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  }, []);

  const isLight = theme === 'light';

  const themeButton = (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 38,
        height: 38,
        borderRadius: 8,
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-card)',
        color: 'var(--color-cyan)',
        cursor: 'pointer',
        marginLeft: 8,
        flexShrink: 0,
      }}
    >
      {isLight ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 100,
        padding: scrolled ? '10px 0' : '16px 0',
        background: scrolled
          ? isLight
            ? 'rgba(255,255,255,0.9)'
            : 'rgba(10,10,26,0.9)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled
          ? '1px solid var(--color-border)'
          : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <button
            onClick={() => scrollTo('hero')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 2,
              padding: 2,
              borderRadius: 6,
              border: '1.5px solid var(--color-cyan)',
            }}>
              {[1,1,1,1,0,1,1,1,1].map((v, i) => (
                <div key={i} style={{
                  borderRadius: 1,
                  background: v ? 'var(--color-cyan)' : 'transparent',
                }} />
              ))}
            </div>

            <span style={{
              fontWeight: 700,
              fontSize: '1rem',
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em',
            }}>
              QR <span style={{ color: 'var(--color-cyan)' }}>LAB</span>
            </span>
          </button>

          {/* Desktop Nav */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <div className="nav-desktop" style={{ display: 'flex', gap: 4 }}>
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    transition: 'all 0.2s',
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-cyan)';
                    e.currentTarget.style.background = 'var(--color-cyan-glow)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {themeButton}

            {/* Mobile Menu Button */}
            <button
              className="nav-mobile-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              style={{
                display: 'none',
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: 8,
                cursor: 'pointer',
                color: 'var(--color-text-primary)',
                marginLeft: 8,
              }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="nav-mobile-menu"
            style={{
              position: 'fixed',
              top: 60,
              left: 0,
              right: 0,
              zIndex: 99,
              background: isLight
                ? 'rgba(255,255,255,0.97)'
                : 'rgba(10,10,26,0.97)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid var(--color-border)',
              padding: '16px 24px',
              display: 'none',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                {link.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
          .nav-mobile-menu { display: flex !important; }
        }
      `}</style>
    </>
  );
}
