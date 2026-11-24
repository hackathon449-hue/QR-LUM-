
import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function Takeaway() {
  const scrollToGenerator = useCallback(() => {
    const el = document.getElementById('generator');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <section style={{
      background: 'linear-gradient(180deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle decorative glow */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500, height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--color-cyan-glow) 0%, transparent 70%)',
        opacity: 0.4,
        pointerEvents: 'none',
      }} />

      <div className="section-container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          <motion.h2
            variants={fadeUp}
            className="section-title"
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', textAlign: 'center', marginBottom: 20 }}
          >
            Now You See More Than{' '}
            <span className="text-gradient-cyan">Squares</span>.
          </motion.h2>

          <motion.p
            variants={fadeUp}
            style={{
              maxWidth: 640,
              margin: '0 auto 40px',
              fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.8,
            }}
          >
            A QR Code is a structured system of data modules and functional patterns.
            Finder patterns help scanners detect its position and orientation, while
            error correction adds redundancy that can help recover encoded data when
            parts of the code are damaged or obscured. Together, these features make
            QR Codes a reliable way to store and share information.
          </motion.p>

          <motion.div variants={fadeUp} style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={scrollToGenerator} className="btn-primary" style={{ fontSize: '1rem', padding: '14px 32px' }}>
              Create Another QR Code
            </button>
            <button onClick={scrollToTop} className="btn-secondary">
              <ArrowUp size={16} /> Back to Top
            </button>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            marginTop: 80,
            paddingTop: 24,
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            QR LAB — Beyond the Squares
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', opacity: 0.6, marginTop: 4 }}>
            An interactive educational experience exploring QR code technology
          </p>
        </motion.div>
      </div>
    </section>
  );
}
