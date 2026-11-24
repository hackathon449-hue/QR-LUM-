
import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eraser, RotateCcw, AlertTriangle, Info } from 'lucide-react';
import { generateQRDataURL } from '../../services/qr/qrGenerator';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const EC_LEVELS = [
  {
    key: 'L',
    label: 'Low',
    recovery: 7,
    capacity: 'Highest',
    color: '#FF6B6B',
    description: 'Lowest error correction protection and highest data capacity.',
  },
  {
    key: 'M',
    label: 'Medium',
    recovery: 15,
    capacity: 'High',
    color: '#FFA94D',
    description: 'A balance between data capacity and error correction.',
  },
  {
    key: 'Q',
    label: 'Quartile',
    recovery: 25,
    capacity: 'Lower',
    color: '#51CF66',
    description: 'Higher error correction protection with less data capacity.',
  },
  {
    key: 'H',
    label: 'High',
    recovery: 30,
    capacity: 'Lowest',
    color: '#22B8CF',
    description: 'The highest error correction protection and lowest data capacity.',
  },
];

export default function ErrorCorrectionLab({ text }) {
  const [activeEC, setActiveEC] = useState('M');
  const [damagePoints, setDamagePoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const sampleText = text && text.trim().length > 0 ? text : 'QR LAB';

  const qrImages = useMemo(() => {
    const images = {};

    for (const level of EC_LEVELS) {
      images[level.key] = generateQRDataURL(sampleText, level.key, 8, 4);
    }

    return images;
  }, [sampleText]);

  // This is only a visual estimate based on drawing points.
  // It does not represent actual damaged QR modules or recovery capacity.
  const damagePercentage = useMemo(() => {
    return Math.min(100, Math.round(damagePoints.length * 0.8));
  }, [damagePoints]);

  // Add a visual damage mark.
  const addDamagePoint = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setDamagePoints((prev) => [
      ...prev,
      {
        x,
        y,
        id: Date.now() + Math.random(),
      },
    ]);
  }, []);

  const handleCanvasMouseDown = useCallback((e) => {
    setIsDrawing(true);
    addDamagePoint(e);
  }, [addDamagePoint]);

  const handleCanvasMouseMove = useCallback((e) => {
    if (!isDrawing) return;
    addDamagePoint(e);
  }, [isDrawing, addDamagePoint]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    setIsDrawing(true);

    const touch = e.touches[0];
    if (!touch) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;

    setDamagePoints((prev) => [
      ...prev,
      {
        x,
        y,
        id: Date.now() + Math.random(),
      },
    ]);
  }, []);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();

    if (!isDrawing) return;

    const touch = e.touches[0];
    if (!touch) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;

    setDamagePoints((prev) => [
      ...prev,
      {
        x,
        y,
        id: Date.now() + Math.random(),
      },
    ]);
  }, [isDrawing]);

  const clearDamage = useCallback(() => {
    setDamagePoints([]);
    setIsDrawing(false);
  }, []);

  const activeInfo = EC_LEVELS.find((level) => level.key === activeEC);

  return (
    <section
      id="error-correction"
      style={{ background: 'var(--color-bg-secondary)' }}
    >
      <div className="section-container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
        >
          <h2 className="section-title">
            <span className="text-gradient-cyan">What Happens</span> If a QR Code Gets Damaged?
          </h2>

          <p className="section-description" style={{ marginBottom: 16 }}>
            Discover how Reed–Solomon error correction helps QR Codes remain readable even when part of their data is damaged.
          </p>

          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.7,
              maxWidth: 850,
              marginBottom: 48,
            }}
          >
            QR Codes contain additional error correction codewords.
            These codewords provide redundant mathematical information
            that allows a compatible scanner to recover certain corrupted
            or missing data during decoding.
          </p>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 32,
          }}
          className="ec-grid"
        >
          {/* Left: Interactive Damage Experiment */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="glass-panel" style={{ padding: 24 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <Eraser
                    size={18}
                    style={{
                      verticalAlign: 'middle',
                      marginRight: 8,
                      color: 'var(--color-cyan)',
                    }}
                  />
                  Damage Simulator
                </h3>

                <button
                  onClick={clearDamage}
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>

              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--color-text-muted)',
                  marginBottom: 14,
                  lineHeight: 1.6,
                }}
              >
                Draw over the QR Code to create a visual damage simulation.
                Compare how different error correction levels are designed
                to provide different amounts of recovery information.
              </p>

              {/* Damage Canvas */}
              <div
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleCanvasMouseUp}
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 300,
                  margin: '0 auto',
                  cursor: 'crosshair',
                  touchAction: 'none',
                  userSelect: 'none',
                }}
              >
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 8,
                    padding: 16,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {qrImages[activeEC] && (
                    <img
                      src={qrImages[activeEC]}
                      alt={`QR Code with EC level ${activeEC}`}
                      style={{
                        width: '100%',
                        display: 'block',
                        imageRendering: 'pixelated',
                      }}
                      draggable={false}
                    />
                  )}

                  {/* Visual Damage Overlay */}
                  <svg
                    style={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      right: 16,
                      bottom: 16,
                      width: 'calc(100% - 32px)',
                      height: 'calc(100% - 32px)',
                      pointerEvents: 'none',
                    }}
                  >
                    {damagePoints.map((point) => (
                      <rect
                        key={point.id}
                        x={`${point.x - 3}%`}
                        y={`${point.y - 3}%`}
                        width="6%"
                        height="6%"
                        fill="rgba(255,80,80,0.85)"
                        rx="1"
                      />
                    ))}
                  </svg>
                </div>
              </div>

              {/* Damage Meter */}
              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Visual Damage Estimate
                  </span>

                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                      color:
                        damagePercentage > 20
                          ? '#FF6B6B'
                          : 'var(--color-cyan)',
                    }}
                  >
                    {damagePercentage}%
                  </span>
                </div>

                <div
                  style={{
                    height: 6,
                    background: 'var(--color-bg-primary)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${damagePercentage}%`,
                      background:
                        damagePercentage > 25
                          ? 'linear-gradient(90deg, #FFA94D, #FF6B6B)'
                          : 'linear-gradient(90deg, var(--color-cyan), #51CF66)',
                      borderRadius: 3,
                      transition: 'width 0.3s',
                    }}
                  />
                </div>

                <p
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--color-text-muted)',
                    marginTop: 6,
                    lineHeight: 1.5,
                  }}
                >
                  This percentage represents the visual drawing activity only.
                  It is not a measurement of actual QR Code damage or recovery.
                </p>
              </div>

              {/* EC Level Selector */}
              <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                {EC_LEVELS.map((level) => (
                  <button
                    key={level.key}
                    onClick={() => setActiveEC(level.key)}
                    aria-pressed={activeEC === level.key}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      borderRadius: 6,
                      border:
                        activeEC === level.key
                          ? `1px solid ${level.color}`
                          : '1px solid var(--color-border)',
                      background:
                        activeEC === level.key
                          ? `${level.color}15`
                          : 'var(--color-bg-primary)',
                      color:
                        activeEC === level.key
                          ? level.color
                          : 'var(--color-text-muted)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    {level.key}
                  </button>
                ))}
              </div>

              {activeInfo && (
                <div
                  style={{
                    marginTop: 12,
                    padding: '12px 14px',
                    background: 'var(--color-bg-primary)',
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <p
                    style={{
                      color: activeInfo.color,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {activeInfo.label} ({activeInfo.key})
                  </p>

                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--color-text-muted)',
                      lineHeight: 1.6,
                    }}
                  >
                    {activeInfo.description}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right: Education */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            {/* How EC Works */}
            <div
              className="glass-panel"
              style={{ padding: 24, marginBottom: 16 }}
            >
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: 14,
                }}
              >
                <Shield
                  size={18}
                  style={{
                    verticalAlign: 'middle',
                    marginRight: 8,
                    color: 'var(--color-cyan)',
                  }}
                />
                How Reed–Solomon Error Correction Works
              </h3>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.7,
                  }}
                >
                  QR Codes use Reed–Solomon error correction, a mathematical
                  technique that adds redundant information to the encoded
                  data. This extra information helps a scanner reconstruct
                  certain corrupted or missing codewords.
                </p>

                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.7,
                  }}
                >
                  The encoded information is organized into codewords.
                  Each QR Code codeword consists of 8 bits (one byte).
                  Reed–Solomon coding generates additional error correction
                  codewords for the data blocks.
                </p>

                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.7,
                  }}
                >
                  During decoding, the scanner uses the redundant information
                  to detect and correct certain errors. The amount of recovery
                  depends on the error correction level and how many codewords
                  are affected.
                </p>
              </div>
            </div>

            {/* Capacity vs Recovery */}
            <div
              className="glass-panel"
              style={{ padding: 24, marginBottom: 16 }}
            >
              <h3
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  marginBottom: 16,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Data Capacity vs. Recovery
              </h3>

              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-text-muted)',
                  marginBottom: 18,
                  lineHeight: 1.6,
                }}
              >
                Higher error correction levels use more codewords for
                recovery information. Therefore, less capacity remains
                for the original data at the same QR Code version.
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                {EC_LEVELS.map((level) => (
                  <div
                    key={level.key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      borderRadius: 8,
                      background: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: level.color,
                      }}
                    >
                      {level.label} ({level.key})
                    </span>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--color-text-primary)',
                          fontWeight: 600,
                        }}
                      >
                        {level.capacity} relative capacity
                      </span>

                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        ~{level.recovery}% recovery
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                  marginTop: 14,
                }}
              >
                <Info
                  size={14}
                  style={{
                    color: 'var(--color-cyan)',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />

                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.6,
                  }}
                >
                  The recovery figures are approximate standard descriptions
                  of codeword recovery capability. They do not mean that the
                  same percentage of the QR Code image can be damaged.
                  Actual capacity also depends on version and encoding mode.
                </p>
              </div>
            </div>

            {/* Disclaimer */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 10,
                border: '1px solid rgba(255,169,77,0.3)',
                background: 'rgba(255,169,77,0.06)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <AlertTriangle
                size={16}
                style={{
                  color: '#FFA94D',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />

              <p
                style={{
                  fontSize: '0.78rem',
                  color: '#FFA94D',
                  lineHeight: 1.6,
                  opacity: 0.9,
                }}
              >
                Error correction works at the codeword level, not by repairing
                individual modules independently. Damage to different parts of
                a QR Code can affect different codewords and function patterns.
                This visual experiment does not perform actual QR decoding or
                error recovery.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .ec-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
