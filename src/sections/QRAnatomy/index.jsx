import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Grid3X3 } from 'lucide-react';
import { MODULE_TYPES, MODULE_INFO } from '../../services/qr/moduleClassifier';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const REGION_GROUPS = [
  { type: MODULE_TYPES.FINDER, label: 'Finder Patterns' },
  { type: MODULE_TYPES.SEPARATOR, label: 'Separators' },
  { type: 'TIMING', label: 'Timing Patterns', types: [MODULE_TYPES.TIMING_H, MODULE_TYPES.TIMING_V] },
  { type: MODULE_TYPES.ALIGNMENT, label: 'Alignment' },
  { type: MODULE_TYPES.FORMAT_INFO, label: 'Format Info' },
  { type: MODULE_TYPES.VERSION_INFO, label: 'Version Info' },
  { type: MODULE_TYPES.DATA, label: 'Data & EC' },
  { type: MODULE_TYPES.DARK_MODULE, label: 'Dark Module' },
];

export default function QRAnatomy({ qrData, classificationMap }) {
  const [hoveredModule, setHoveredModule] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [showQuietZone, setShowQuietZone] = useState(true);

  const handleModuleHover = useCallback((row, col, type) => {
    setHoveredModule({ row, col, type });
  }, []);

  const handleModuleLeave = useCallback(() => {
    setHoveredModule(null);
  }, []);

  const handleModuleClick = useCallback((row, col, type) => {
    setSelectedRegion((prev) => {
      const normalizedType = (type === MODULE_TYPES.TIMING_H || type === MODULE_TYPES.TIMING_V) ? 'TIMING' : type;
      return prev === normalizedType ? null : normalizedType;
    });
  }, []);

  const toggleRegion = useCallback((regionType) => {
    setSelectedRegion((prev) => prev === regionType ? null : regionType);
  }, []);

  const isHighlighted = useCallback((type) => {
    if (!selectedRegion) return true;
    if (selectedRegion === 'TIMING') {
      return type === MODULE_TYPES.TIMING_H || type === MODULE_TYPES.TIMING_V;
    }
    return type === selectedRegion;
  }, [selectedRegion]);

  const activeInfo = useMemo(() => {
    if (hoveredModule) {
      const info = MODULE_INFO[hoveredModule.type];
      return { ...info, row: hoveredModule.row, col: hoveredModule.col };
    }
    if (selectedRegion) {
      if (selectedRegion === 'TIMING') return MODULE_INFO[MODULE_TYPES.TIMING_H];
      return MODULE_INFO[selectedRegion];
    }
    return null;
  }, [hoveredModule, selectedRegion]);

  if (!qrData || !classificationMap) {
    return (
      <section id="anatomy" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="section-container" style={{ textAlign: 'center' }}>
          <h2 className="section-title">
            <span className="text-gradient-cyan">Anatomy</span> of a QR Code
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 20, fontSize: '1rem' }}>
            <Grid3X3 size={48} style={{ opacity: 0.3, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
            Generate a QR code above to explore its anatomy.
          </p>
        </div>
      </section>
    );
  }

  const { matrix, moduleCount } = qrData;

  return (
    <section id="anatomy" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="section-container">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp}>
          <h2 className="section-title">
            <span className="text-gradient-cyan">Anatomy</span> of a QR Code
          </h2>
          <p className="section-description" style={{ marginBottom: 32 }}>
            Every square has a purpose. Explore the hidden architecture.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}
             className="anatomy-grid">
          {/* QR Matrix */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="glass-panel" style={{ padding: 24 }}>
              {/* Quiet Zone Wrapper */}
              <div style={{
                position: 'relative',
                padding: showQuietZone ? 20 : 0,
                background: showQuietZone ? 'rgba(255,255,255,0.03)' : 'transparent',
                borderRadius: 12,
                transition: 'padding 0.3s',
              }}>
                {showQuietZone && (
                  <div style={{
                    position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)',
                    fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase',
                    letterSpacing: '0.1em', whiteSpace: 'nowrap',
                  }}>
                    ← Quiet Zone →
                  </div>
                )}

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${moduleCount}, 1fr)`,
                  gap: moduleCount > 30 ? 0.5 : 1,
                  maxWidth: 560,
                  margin: '0 auto',
                  aspectRatio: '1',
                }}>
                  {matrix.map((row, r) =>
                    row.map((cell, c) => {
                      const type = classificationMap[r][c];
                      const info = MODULE_INFO[type];
                      const dark = cell === 1;
                      const highlighted = isHighlighted(type);
                      const isHovered = hoveredModule && hoveredModule.row === r && hoveredModule.col === c;

                      let bgColor;
                      if (dark) {
                        bgColor = highlighted ? info.color : `${info.color}30`;
                      } else {
                        bgColor = highlighted
                          ? (selectedRegion ? `${info.color}18` : 'rgba(255,255,255,0.04)')
                          : 'rgba(255,255,255,0.02)';
                      }

                      return (
                        <div
                          key={`${r}-${c}`}
                          onMouseEnter={() => handleModuleHover(r, c, type)}
                          onMouseLeave={handleModuleLeave}
                          onClick={() => handleModuleClick(r, c, type)}
                          style={{
                            aspectRatio: '1',
                            backgroundColor: bgColor,
                            borderRadius: moduleCount > 30 ? 1 : 2,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            transform: isHovered ? 'scale(1.5)' : 'scale(1)',
                            zIndex: isHovered ? 10 : 1,
                            position: 'relative',
                            border: isHovered ? `1px solid ${info.color}` : '1px solid transparent',
                            boxShadow: isHovered ? `0 0 8px ${info.color}40` : 'none',
                          }}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Panel: Legend & Info */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                      className="anatomy-panel">
            {/* Legend */}
            <div className="glass-panel" style={{ padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, fontWeight: 600 }}>
                Components
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {REGION_GROUPS.map((group) => {
                  const info = group.types ? MODULE_INFO[group.types[0]] : MODULE_INFO[group.type];
                  const isActive = selectedRegion === group.type ||
                    (group.types && group.types.some(t => selectedRegion === t)) ||
                    (group.type === 'TIMING' && selectedRegion === 'TIMING');

                  // Check if this component exists in this QR version
                  const exists = group.type === MODULE_TYPES.VERSION_INFO
                    ? qrData.version >= 7
                    : group.type === MODULE_TYPES.ALIGNMENT
                    ? qrData.version >= 2
                    : true;

                  if (!exists) return null;

                  return (
                    <button
                      key={group.label}
                      onClick={() => toggleRegion(group.type === 'TIMING' ? 'TIMING' : group.type)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: isActive ? `1px solid ${info.color}50` : '1px solid transparent',
                        background: isActive ? `${info.color}15` : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{
                        width: 14, height: 14, borderRadius: 3,
                        backgroundColor: info.color,
                        flexShrink: 0,
                        boxShadow: isActive ? `0 0 8px ${info.color}50` : 'none',
                      }} />
                      <span style={{
                        fontSize: '0.82rem',
                        color: isActive ? info.color : 'var(--color-text-secondary)',
                        fontWeight: isActive ? 600 : 400,
                      }}>
                        {group.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Quiet Zone Toggle */}
              <button
                onClick={() => setShowQuietZone(prev => !prev)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginTop: 12, padding: '8px 10px',
                  borderRadius: 8, border: '1px solid var(--color-border)',
                  background: showQuietZone ? 'var(--color-cyan-glow)' : 'transparent',
                  cursor: 'pointer', width: '100%', transition: 'all 0.2s',
                }}
              >
                {showQuietZone ? <Eye size={14} style={{ color: 'var(--color-cyan)' }} /> : <EyeOff size={14} style={{ color: 'var(--color-text-muted)' }} />}
                <span style={{ fontSize: '0.82rem', color: showQuietZone ? 'var(--color-cyan)' : 'var(--color-text-muted)' }}>
                  Quiet Zone
                </span>
              </button>
            </div>

            {/* Detail Panel */}
            <AnimatePresence mode="wait">
              {activeInfo && (
                <motion.div
                  key={activeInfo.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="glass-panel"
                  style={{ padding: 20, borderLeft: `3px solid ${activeInfo.color}` }}
                >
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: activeInfo.color, marginBottom: 8 }}>
                    {activeInfo.name}
                  </h3>
                  {activeInfo.row !== undefined && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                      Module [{activeInfo.row}, {activeInfo.col}]
                    </div>
                  )}
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                    {activeInfo.description}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginTop: 10, borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
                    {activeInfo.details}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {!activeInfo && (
              <div className="glass-panel" style={{ padding: 20, textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  Hover over modules or select a component from the legend above to learn more.
                </p>
              </div>
            )}

            {/* Quiet Zone info */}
            {showQuietZone && !activeInfo && (
              <div className="glass-panel" style={{ padding: 16, marginTop: 12, borderLeft: '3px solid var(--color-text-muted)' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-text-secondary)' }}>
                  Quiet Zone
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  The quiet zone is the clear margin surrounding the QR code. It is outside the QR matrix itself and provides visual separation from nearby elements so scanners can detect the QR symbol reliably. The specification requires at least 4 modules of quiet zone.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .anatomy-grid {
            grid-template-columns: 1fr !important;
          }
          .anatomy-panel {
            order: -1;
          }
        }
      `}</style>
    </section>
  );
}
