
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import styles from './Hero.module.css';

// ─── QR pattern data ────────────────────────────────────────────────
// 15x15 grid loosely resembling a deconstructed QR code
// 0 = empty, 1 = cyan module, 2 = violet module, 3 = finder pattern
const BASE_PATTERN = [
  [3,3,3,3,3,3,3,0,1,0,3,3,3,3,3],
  [3,0,0,0,0,0,3,0,2,0,3,0,0,0,3],
  [3,0,3,3,3,0,3,0,1,0,3,0,3,0,3],
  [3,0,3,3,3,0,3,0,0,0,3,0,3,0,3],
  [3,0,3,3,3,0,3,0,2,0,3,0,3,0,3],
  [3,0,0,0,0,0,3,0,1,0,3,0,0,0,3],
  [3,3,3,3,3,3,3,0,1,0,3,3,3,3,3],
  [0,0,0,0,0,0,0,0,2,0,0,0,0,0,0],
  [1,2,1,0,2,1,1,0,1,0,2,1,0,2,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [3,3,3,3,3,3,3,0,1,2,1,0,2,0,1],
  [3,0,0,0,0,0,3,0,0,1,0,2,0,1,0],
  [3,0,3,3,3,0,3,0,2,0,1,0,2,0,1],
  [3,0,0,0,0,0,3,0,1,0,0,1,0,2,0],
  [3,3,3,3,3,3,3,0,0,1,2,0,1,0,2],
];

const GRID_SIZE = 15;

// ─── Animation variants ─────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const fadeScale = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.4 },
  },
};

// ─── Component ──────────────────────────────────────────────────────
export default function Hero() {
  const heroRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [pulsingModules, setPulsingModules] = useState(new Set());

  // Mouse parallax
  const handleMouseMove = useCallback((e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMouse({ x, y });
  }, []);

  // Pulsing animation — randomly pulse modules in and out
  useEffect(() => {
    const interval = setInterval(() => {
      const newPulsing = new Set();
      const count = Math.floor(Math.random() * 6) + 3;
      for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * GRID_SIZE);
        const c = Math.floor(Math.random() * GRID_SIZE);
        newPulsing.add(`${r}-${c}`);
      }
      setPulsingModules(newPulsing);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Smooth scroll to section
  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Parallax offsets
  const parallaxStyle = useMemo(() => ({
    transform: `translate(${mouse.x * 12}px, ${mouse.y * 12}px)`,
    transition: 'transform 0.3s ease-out',
  }), [mouse.x, mouse.y]);

  return (
    <section
      ref={heroRef}
      id="hero"
      className={`${styles.hero} grid-bg`}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className={styles.content}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Text Block ── */}
        <div className={styles.textBlock}>
          <motion.div className={styles.badge} variants={fadeUp}>
            <span className={styles.badgeDot} />
            QR Code Learning Lab
          </motion.div>

          <motion.h1 className={styles.headline} variants={fadeUp}>
            <span className="text-gradient-cyan">QR LAB</span>
          </motion.h1>

          <motion.p className={styles.subtitle} variants={fadeUp}>
            Understand the Technology Behind QR Codes
          </motion.p>

          <motion.p className={styles.description} variants={fadeUp}>
            A QR Code is more than a pattern of black and white squares. It is a
            two-dimensional barcode that stores information using data modules,
            structured patterns, and error correction. Explore how these elements
            work together to make QR Codes readable and reliable.
          </motion.p>

          <motion.div className={styles.ctas} variants={fadeUp}>
            <a
              href="#generator"
              className="btn-primary"
              onClick={(e) => { e.preventDefault(); scrollTo('generator'); }}
            >
              Explore the QR Code
              <span className={styles.ctaArrow}>→</span>
            </a>
            <a
              href="#how-it-works"
              className="btn-secondary"
              onClick={(e) => { e.preventDefault(); scrollTo('how-it-works'); }}
            >
              How Does It Work?
            </a>
          </motion.div>
        </div>

        {/* ── Hero Visual ── */}
        <motion.div className={styles.visualBlock} variants={fadeScale}>
          <div className={styles.qrVisualWrapper} style={parallaxStyle}>
            {/* Background glow orbs */}
            <div className={`${styles.glowOrb} ${styles.glowCyan}`} />
            <div className={`${styles.glowOrb} ${styles.glowViolet}`} />

            <div className={styles.qrVisualInner}>
              <div className={styles.qrGrid}>
                {BASE_PATTERN.flatMap((row, r) =>
                  row.map((cell, c) => {
                    const key = `${r}-${c}`;
                    const isPulsing = pulsingModules.has(key);

                    let moduleClass = styles.moduleEmpty;
                    if (cell === 1) moduleClass = styles.moduleActive;
                    else if (cell === 2) moduleClass = styles.moduleViolet;
                    else if (cell === 3) moduleClass = styles.moduleFinder;

                    return (
                      <div
                        key={key}
                        className={`${styles.qrModule} ${moduleClass}`}
                        style={{
                          opacity: isPulsing && cell === 0 ? 0.6 : cell === 0 ? undefined : isPulsing ? 0.4 : undefined,
                          transform: isPulsing ? 'scale(1.15)' : undefined,
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Scroll Indicator ── */}
      <motion.div
        className={styles.scrollIndicator}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <span>Scroll</span>
        <div className={styles.scrollLine} />
      </motion.div>
    </section>
  );
}
