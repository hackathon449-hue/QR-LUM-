import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Download, Camera, ExternalLink } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const steps = [
  { icon: <Camera size={20} />, text: 'Open your phone camera or QR scanner app.' },
  { icon: <Smartphone size={20} />, text: 'Position the QR Code inside the camera frame. The scanner detects its finder patterns to locate and orient the code.' },
  { icon: <ExternalLink size={20} />, text: 'The scanner reads the QR modules, decodes the encoded data, and displays the resulting content.' },
];

export default function ScanExperience({ text, qrImageURL }) {
  const handleDownload = useCallback(() => {
    if (!qrImageURL) return;
    const a = document.createElement('a');
    a.href = qrImageURL;
    a.download = 'qr-lab-code.png';
    a.click();
  }, [qrImageURL]);

  return (
    <section id="scan" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="section-container">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp}
                    style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            <span className="text-gradient-cyan">Try It</span> With Your Phone
          </h2>
          <p className="section-description" style={{ margin: '0 auto' }}>
            Scan the QR code below with your smartphone to verify it works.
          </p>
        </motion.div>

        {!text || !qrImageURL ? (
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                      style={{ textAlign: 'center' }}>
            <Smartphone size={48} style={{ color: 'var(--color-text-muted)', opacity: 0.3, marginBottom: 12 }} />
            <p style={{ color: 'var(--color-text-muted)' }}>
              Generate a QR code above first to scan it.
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center', maxWidth: 800, margin: '0 auto' }}
               className="scan-grid">
            {/* QR Code Display */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                background: '#ffffff',
                borderRadius: 16,
                padding: 28,
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              }}>
                <img
                  src={qrImageURL}
                  alt="Scannable QR Code"
                  style={{ width: 260, height: 260, display: 'block', imageRendering: 'pixelated' }}
                />
              </div>

              <button onClick={handleDownload} className="btn-primary" style={{ marginTop: 20 }}>
                <Download size={16} /> Download PNG
              </button>

              <div style={{
                marginTop: 16, padding: '10px 16px',
                background: 'var(--color-bg-card)',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                maxWidth: 300,
                wordBreak: 'break-all',
              }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  Encoded Content
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {text.length > 80 ? text.substring(0, 80) + '...' : text}
                </div>
              </div>
            </motion.div>

            {/* Instructions */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 24 }}>
                How to Scan
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--color-cyan-glow)',
                      border: '1px solid rgba(34,211,238,0.2)',
                      color: 'var(--color-cyan)',
                      flexShrink: 0,
                    }}>
                      {step.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                        Step {i + 1}
                      </div>
                      <div style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>
                        {step.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 28, padding: '14px 16px', borderRadius: 10,
                background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
              }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  Most modern smartphones can scan QR codes directly from the camera app. If your phone doesn't recognize it automatically, try a dedicated QR scanner app.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .scan-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </section>
  );
}
