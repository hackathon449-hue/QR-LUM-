import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ENCODING_STAGES } from '../../data/encodingStages';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const stageVisuals = {
  input: () => (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--color-cyan)' }}>
      <div style={{ opacity: 0.3 }}>_</div>
      <div>H e l l o</div>
      <div style={{ width: 2, height: 20, background: 'var(--color-cyan)', display: 'inline-block', animation: 'pulse-glow 1s infinite' }} />
    </div>
  ),
  encoding: () => (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#51CF66', lineHeight: 1.8 }}>
      <div style={{ opacity: 0.5 }}>Mode: 0100 (Byte)</div>
      <div style={{ opacity: 0.7 }}>Count: 00000101</div>
      <div>01001000 01100101</div>
      <div>01101100 01101100</div>
      <div>01101111</div>
    </div>
  ),
  'error-correction': () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🛡️</div>
      <div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          {['Data', 'Data', 'EC', 'EC'].map((label, i) => (
            <div key={i} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
              background: label === 'EC' ? 'rgba(204,93,232,0.2)' : 'rgba(34,184,207,0.2)',
              color: label === 'EC' ? '#CC5DE8' : '#22B8CF',
              border: `1px solid ${label === 'EC' ? '#CC5DE8' : '#22B8CF'}30`,
            }}>
              {label}
            </div>
          ))}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Reed–Solomon codewords added
        </div>
      </div>
    </div>
  ),
  structure: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, width: 100 }}>
      {Array.from({ length: 49 }).map((_, i) => {
        const r = Math.floor(i / 7), c = i % 7;
        const isFinder = (r < 3 && c < 3) || (r < 3 && c > 3) || (r > 3 && c < 3);
        const isTiming = r === 3 || c === 3;
        return (
          <div key={i} style={{
            aspectRatio: '1', borderRadius: 2,
            backgroundColor: isFinder ? '#FF6B6B' : isTiming ? '#51CF66' : (r + c) % 3 === 0 ? '#22B8CF' : 'rgba(34,184,207,0.15)',
          }} />
        );
      })}
    </div>
  ),
  masking: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 1, width: 110 }}>
      {Array.from({ length: 64 }).map((_, i) => {
        const r = Math.floor(i / 8), c = i % 8;
        const masked = (r + c) % 2 === 0;
        return (
          <div key={i} style={{
            aspectRatio: '1', borderRadius: 1,
            backgroundColor: masked ? '#FFA94D' : 'rgba(255,169,77,0.1)',
            transition: 'background-color 0.3s',
          }} />
        );
      })}
    </div>
  ),
  final: () => (
    <div style={{ fontSize: 48, textAlign: 'center' }}>✅</div>
  ),
};

export default function HowItWorks() {
  const [activeStage, setActiveStage] = useState(0);

  return (
    <section id="how-it-works" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="section-container">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp}>
          <h2 className="section-title">
            <span className="text-gradient-cyan">From Text</span> to QR Code
          </h2>
          <p className="section-description" style={{ marginBottom: 48 }}>
            Discover the step-by-step process that transforms your text into a machine-readable pattern.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 32, alignItems: 'start' }}
             className="hiw-grid">
          {/* Timeline */}
          <div style={{ position: 'relative' }}>
            {/* Vertical line */}
            <div style={{
              position: 'absolute', left: 19, top: 20, bottom: 20,
              width: 2, background: 'var(--color-border)',
            }} />

            {ENCODING_STAGES.map((stage, index) => {
              const isActive = activeStage === index;
              return (
                <motion.button
                  key={stage.id}
                  onClick={() => setActiveStage(index)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0, transition: { delay: index * 0.08, duration: 0.4 } },
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    width: '100%',
                    padding: '14px 16px 14px 0',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {/* Circle */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    background: isActive ? `${stage.color}25` : 'var(--color-bg-card)',
                    border: isActive ? `2px solid ${stage.color}` : '2px solid var(--color-border)',
                    color: isActive ? stage.color : 'var(--color-text-muted)',
                    fontWeight: 700, fontSize: '0.85rem',
                    transition: 'all 0.3s',
                    boxShadow: isActive ? `0 0 12px ${stage.color}30` : 'none',
                  }}>
                    {stage.number}
                  </div>

                  <div>
                    <div style={{
                      fontWeight: 600, fontSize: '0.95rem',
                      color: isActive ? stage.color : 'var(--color-text-primary)',
                      transition: 'color 0.3s',
                    }}>
                      {stage.title}
                    </div>
                    <div style={{
                      fontSize: '0.78rem',
                      color: 'var(--color-text-muted)',
                      marginTop: 2,
                    }}>
                      {stage.subtitle}
                    </div>
                  </div>

                  <ChevronDown
                    size={16}
                    style={{
                      marginLeft: 'auto', marginTop: 4,
                      color: isActive ? stage.color : 'var(--color-text-muted)',
                      transform: isActive ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'all 0.3s',
                    }}
                  />
                </motion.button>
              );
            })}
          </div>

          {/* Detail Panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="glass-panel"
              style={{
                padding: 32,
                borderTop: `3px solid ${ENCODING_STAGES[activeStage].color}`,
                position: 'sticky',
                top: 100,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontSize: '1.6rem' }}>{ENCODING_STAGES[activeStage].icon}</span>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: ENCODING_STAGES[activeStage].color }}>
                    Stage {ENCODING_STAGES[activeStage].number}: {ENCODING_STAGES[activeStage].title}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    {ENCODING_STAGES[activeStage].subtitle}
                  </p>
                </div>
              </div>

              {/* Visual */}
              <div style={{
                padding: 24,
                background: 'var(--color-bg-primary)',
                borderRadius: 12,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 100,
              }}>
                {stageVisuals[ENCODING_STAGES[activeStage].id]?.()}
              </div>

              <p style={{
                fontSize: '0.95rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                marginBottom: 20,
              }}>
                {ENCODING_STAGES[activeStage].description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ENCODING_STAGES[activeStage].details.map((detail, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    padding: '10px 14px',
                    background: 'var(--color-bg-primary)',
                    borderRadius: 8,
                    borderLeft: `2px solid ${ENCODING_STAGES[activeStage].color}30`,
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      backgroundColor: ENCODING_STAGES[activeStage].color,
                      flexShrink: 0, marginTop: 7,
                    }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                      {detail}
                    </span>
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                <button
                  onClick={() => setActiveStage(Math.max(0, activeStage - 1))}
                  disabled={activeStage === 0}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)',
                    background: 'transparent', color: activeStage === 0 ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                    cursor: activeStage === 0 ? 'not-allowed' : 'pointer', fontSize: '0.82rem', opacity: activeStage === 0 ? 0.4 : 1,
                  }}
                >
                  ← Previous
                </button>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', alignSelf: 'center' }}>
                  {activeStage + 1} / {ENCODING_STAGES.length}
                </span>
                <button
                  onClick={() => setActiveStage(Math.min(ENCODING_STAGES.length - 1, activeStage + 1))}
                  disabled={activeStage === ENCODING_STAGES.length - 1}
                  style={{
                    padding: '8px 16px', borderRadius: 8,
                    border: `1px solid ${activeStage === ENCODING_STAGES.length - 1 ? 'var(--color-border)' : ENCODING_STAGES[activeStage].color}`,
                    background: activeStage === ENCODING_STAGES.length - 1 ? 'transparent' : `${ENCODING_STAGES[activeStage].color}15`,
                    color: activeStage === ENCODING_STAGES.length - 1 ? 'var(--color-text-muted)' : ENCODING_STAGES[activeStage].color,
                    cursor: activeStage === ENCODING_STAGES.length - 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.82rem', opacity: activeStage === ENCODING_STAGES.length - 1 ? 0.4 : 1,
                  }}
                >
                  Next →
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hiw-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
