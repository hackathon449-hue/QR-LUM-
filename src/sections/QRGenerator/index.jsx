import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Copy,
  RotateCcw,
  QrCode,
  Info,
  Check,
  FileCode2,
  Loader2,
  Shuffle,
  Sparkles,
} from 'lucide-react';
import { ERROR_CORRECTION_INFO } from '../../services/qr/qrGenerator';
import {
  QR_STYLES,
  QR_EYES,
  QR_GRADIENTS,
  QR_FRAMES,
  QR_PALETTES,
  QR_PRESETS,
  buildStyledQRSvg,
  getLogoModules,
  getStyledQRSize,
  svgToDataUri,
  svgToPngBlob,
} from '../../services/qr/styledQR';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const STAT_INFO = {
  Version:
    'The QR Code version determines the size of its matrix. Standard QR Code Model 2 has 40 versions, from Version 1 to Version 40.',
  Matrix:
    'The matrix is the grid of square modules that forms the QR Code. Version 1 contains 21 × 21 modules, and each higher version adds 4 modules to each side.',
  Characters:
    'The number of characters in the original input text. The encoded data size can differ depending on the encoding mode and character set.',
  'EC Level':
    'The selected Error Correction level. Higher levels provide more error recovery but leave less capacity for the original data.',
};

const RESOLUTIONS = [
  { px: 1024, label: '1K' },
  { px: 2048, label: '2K' },
  { px: 4096, label: '4K' },
];

// Starting look = the first preset, plus the options presets don't control
const DEFAULT_DESIGN = {
  ...QR_PRESETS[0].design,
  label: 'SCAN ME',
  logo: true,
  transparent: true,
};

const sectionLabel = {
  display: 'block',
  marginBottom: 10,
  color: 'var(--color-text-secondary)',
  fontSize: '0.85rem',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const hintText = {
  marginTop: 8,
  fontSize: '0.78rem',
  color: 'var(--color-text-muted)',
  lineHeight: 1.6,
};

const pick = (list) => list[Math.floor(Math.random() * list.length)];

/* ---------- small UI helpers ---------- */

function OptionButton({ active, onClick, children, title, compact }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-pressed={active}
      style={{
        flex: compact ? '1 1 0' : 1,
        minWidth: compact ? 64 : 0,
        padding: compact ? '9px 6px' : '10px 0',
        border: active ? '1px solid var(--color-cyan)' : '1px solid var(--color-border)',
        borderRadius: 8,
        background: active ? 'var(--color-cyan-glow)' : 'var(--color-bg-primary)',
        color: active ? 'var(--color-cyan)' : 'var(--color-text-secondary)',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: compact ? '0.8rem' : '0.85rem',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  );
}

function PaletteButton({ active, onClick, palette }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      title={palette.label}
      style={{
        padding: 6,
        border: active ? '1px solid var(--color-cyan)' : '1px solid var(--color-border)',
        borderRadius: 8,
        background: active ? 'var(--color-cyan-glow)' : 'var(--color-bg-primary)',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <span
        style={{
          display: 'block',
          height: 16,
          borderRadius: 5,
          background: `linear-gradient(90deg, ${palette.stops.join(', ')})`,
        }}
      />
      <span
        style={{
          display: 'block',
          marginTop: 6,
          fontSize: '0.72rem',
          color: active ? 'var(--color-cyan)' : 'var(--color-text-muted)',
        }}
      >
        {palette.label}
      </span>
    </button>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        width: '100%',
        padding: '10px 14px',
        background: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        fontSize: '0.85rem',
        textAlign: 'left',
      }}
    >
      <span>{label}</span>
      <span
        style={{
          position: 'relative',
          width: 38,
          height: 22,
          borderRadius: 999,
          flexShrink: 0,
          background: checked ? 'var(--color-cyan)' : 'var(--color-border)',
          transition: 'background 0.2s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 19 : 3,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
          }}
        />
      </span>
    </button>
  );
}

/* ---------- main component ---------- */

export default function QRGenerator({
  text,
  errorCorrectionLevel,
  qrData,
  qrImageURL,
  updateText,
  updateECL,
  reset,
}) {
  const [copied, setCopied] = useState(false);
  const [design, setDesign] = useState(DEFAULT_DESIGN);
  const [resolution, setResolution] = useState(2048);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const patchDesign = useCallback((patch) => setDesign((d) => ({ ...d, ...patch })), []);

  const ecl = qrData?.errorCorrectionLevel || errorCorrectionLevel;
  const hasMatrix = !!(qrData && qrData.matrix);

  const styledOptions = useMemo(() => ({ ...design, ecl }), [design, ecl]);

  const previewSvg = useMemo(
    () => (hasMatrix ? buildStyledQRSvg(qrData.matrix, qrData.moduleCount, styledOptions) : null),
    [hasMatrix, qrData, styledOptions]
  );
  const previewUri = useMemo(() => (previewSvg ? svgToDataUri(previewSvg) : null), [previewSvg]);
  const previewSize = useMemo(
    () => (hasMatrix ? getStyledQRSize(qrData.moduleCount, styledOptions) : { w: 1, h: 1 }),
    [hasMatrix, qrData, styledOptions]
  );

  const logoFits = hasMatrix && getLogoModules(qrData.moduleCount, ecl) > 0;
  const isDense = hasMatrix && qrData.moduleCount >= 61; // version 11 and up
  const designKey = `${design.style}-${design.eyes}-${design.palette}-${design.gradient}-${design.frame}`;

  const applyPreset = (preset) => patchDesign(preset.design);

  const surprise = () =>
    patchDesign({
      style: pick(QR_STYLES).key,
      eyes: pick(QR_EYES).key,
      palette: pick(Object.keys(QR_PALETTES)),
      gradient: pick(QR_GRADIENTS).key,
      frame: pick(QR_FRAMES).key,
    });

  const handleCopy = useCallback(() => {
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((error) => {
      console.error('Copy failed:', error);
    });
  }, [text]);

  const saveBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const handleDownloadPNG = useCallback(async () => {
    setExportError('');

    // Fallback to the original image if no matrix is available
    if (!hasMatrix) {
      if (!qrImageURL) return;
      const a = document.createElement('a');
      a.href = qrImageURL;
      a.download = 'qr-code.png';
      a.click();
      return;
    }

    try {
      setExporting(true);
      const svg = buildStyledQRSvg(qrData.matrix, qrData.moduleCount, {
        ...styledOptions,
        px: resolution,
      });
      const blob = await svgToPngBlob(svg, resolution);
      saveBlob(blob, `qr-code-${resolution}px.png`);
    } catch (error) {
      console.error('PNG export failed:', error);
      setExportError(
        resolution > 2048
          ? 'Your browser could not create an image that large. Try 2K.'
          : 'Could not create the PNG. Please try again.'
      );
    } finally {
      setExporting(false);
    }
  }, [hasMatrix, qrData, qrImageURL, styledOptions, resolution]);

  const handleDownloadSVG = useCallback(() => {
    if (!hasMatrix) return;
    const svg = buildStyledQRSvg(qrData.matrix, qrData.moduleCount, {
      ...styledOptions,
      px: 1024,
    });
    saveBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), 'qr-code.svg');
  }, [hasMatrix, qrData, styledOptions]);

  const eclKeys = ['L', 'M', 'Q', 'H'];

  const stats = qrData
    ? [
        { label: 'Version', value: qrData.version },
        {
          label: 'Matrix',
          value: `${qrData.moduleCount} × ${qrData.moduleCount}`,
        },
        { label: 'Characters', value: qrData.charCount },
        { label: 'EC Level', value: qrData.errorCorrectionLevel },
      ]
    : [];

  const canDownload = hasMatrix || !!qrImageURL;

  return (
    <section
      id="generator"
      className="relative"
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
            <span className="text-gradient-cyan">Create</span> Your Own QR Code
          </h2>

          <p className="section-description" style={{ marginBottom: 16 }}>
            Enter text or a URL and watch it transform into a machine-readable
            two-dimensional barcode.
          </p>

          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.9rem',
              lineHeight: 1.7,
              maxWidth: 850,
              marginBottom: 48,
            }}
          >
            A QR Code stores information in a grid of dark and light square
            modules. Its structure includes data, error correction information,
            and special patterns that help scanners locate and read the symbol.
          </p>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 32,
            alignItems: 'start',
          }}
          className="qr-gen-grid"
        >
          {/* Left: Input */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="glass-panel"
            style={{ padding: 28 }}
          >
            <label style={{ ...sectionLabel, marginBottom: 8 }}>
              Input Text or URL
            </label>

            <textarea
              value={text}
              onChange={(e) => updateText(e.target.value)}
              placeholder="Enter text or URL..."
              rows={4}
              style={{
                width: '100%',
                background: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                padding: '14px 16px',
                color: 'var(--color-text-primary)',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-mono)',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.3s',
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = 'var(--color-cyan)')
              }
              onBlur={(e) =>
                (e.target.style.borderColor = 'var(--color-border)')
              }
            />

            {/* Error Correction Selector */}
            <div style={{ marginTop: 20 }}>
              <label style={sectionLabel}>Error Correction Level</label>

              <div style={{ display: 'flex', gap: 8 }}>
                {eclKeys.map((key) => (
                  <OptionButton
                    key={key}
                    active={errorCorrectionLevel === key}
                    onClick={() => updateECL(key)}
                  >
                    {key}
                  </OptionButton>
                ))}
              </div>

              <div
                style={{
                  marginTop: 10,
                  padding: '12px 14px',
                  background: 'var(--color-bg-primary)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <Info
                  size={14}
                  style={{
                    color: 'var(--color-cyan)',
                    marginTop: 3,
                    flexShrink: 0,
                  }}
                />

                <span
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.6,
                  }}
                >
                  {ERROR_CORRECTION_INFO[errorCorrectionLevel]?.description}
                  {' '}Approximate codeword recovery:{' '}
                  <strong style={{ color: 'var(--color-cyan)' }}>
                    {ERROR_CORRECTION_INFO[errorCorrectionLevel]?.recovery}
                  </strong>
                  <br />
                  <span>
                    These percentages describe approximate error correction
                    capability, not the percentage of the QR Code image that
                    can be covered or damaged.
                  </span>
                </span>
              </div>

              <p style={{ ...hintText, marginTop: 10 }}>
                Higher error correction adds more recovery information. This
                improves resilience but reduces the amount of space available
                for the original data.
              </p>
            </div>

            {/* ---------- Design ---------- */}
            <div style={{ marginTop: 28, paddingTop: 22, borderTop: '1px solid var(--color-border)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginBottom: 12,
                  flexWrap: 'wrap',
                }}
              >
                <label style={{ ...sectionLabel, marginBottom: 0 }}>
                  <Sparkles size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                  Quick Looks
                </label>
                <button
                  onClick={surprise}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  <Shuffle size={13} /> Surprise me
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {QR_PRESETS.map((p) => {
                  const d = p.design;
                  const active =
                    design.style === d.style &&
                    design.eyes === d.eyes &&
                    design.palette === d.palette &&
                    design.gradient === d.gradient &&
                    design.frame === d.frame;
                  return (
                    <OptionButton key={p.key} compact active={active} onClick={() => applyPreset(p)}>
                      {p.label}
                    </OptionButton>
                  );
                })}
              </div>

              <label style={{ ...sectionLabel, marginTop: 20 }}>Module Shape</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {QR_STYLES.map((s) => (
                  <OptionButton
                    key={s.key}
                    compact
                    active={design.style === s.key}
                    onClick={() => patchDesign({ style: s.key })}
                  >
                    {s.label}
                  </OptionButton>
                ))}
              </div>
              {isDense && ['dots', 'tiles', 'bars'].includes(design.style) && (
                <p style={hintText}>
                  This is a dense code (version {qrData.version}). Rounded or
                  Classic scan most reliably when the link is this long.
                </p>
              )}

              <label style={{ ...sectionLabel, marginTop: 18 }}>Corner Eyes</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {QR_EYES.map((e) => (
                  <OptionButton
                    key={e.key}
                    compact
                    active={design.eyes === e.key}
                    onClick={() => patchDesign({ eyes: e.key })}
                  >
                    {e.label}
                  </OptionButton>
                ))}
              </div>

              <label style={{ ...sectionLabel, marginTop: 18 }}>Colors</label>
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}
              >
                {Object.entries(QR_PALETTES).map(([key, p]) => (
                  <PaletteButton
                    key={key}
                    palette={p}
                    active={design.palette === key}
                    onClick={() => patchDesign({ palette: key })}
                  />
                ))}
              </div>

              <label style={{ ...sectionLabel, marginTop: 18 }}>Gradient Direction</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {QR_GRADIENTS.map((g) => (
                  <OptionButton
                    key={g.key}
                    compact
                    active={design.gradient === g.key}
                    onClick={() => patchDesign({ gradient: g.key })}
                  >
                    {g.label}
                  </OptionButton>
                ))}
              </div>

              <label style={{ ...sectionLabel, marginTop: 18 }}>Frame</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {QR_FRAMES.map((fr) => (
                  <OptionButton
                    key={fr.key}
                    compact
                    active={design.frame === fr.key}
                    onClick={() => patchDesign({ frame: fr.key })}
                  >
                    {fr.label}
                  </OptionButton>
                ))}
              </div>

              {design.frame !== 'none' && (
                <>
                  <input
                    type="text"
                    value={design.label}
                    maxLength={24}
                    onChange={(e) => patchDesign({ label: e.target.value })}
                    placeholder="Label (leave empty for none)"
                    aria-label="Frame label"
                    style={{
                      width: '100%',
                      marginTop: 10,
                      background: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--color-cyan)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                  />
                  <p style={hintText}>
                    The label appears in a pill under the code. Clear it to
                    remove the pill.
                  </p>
                </>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  marginTop: 18,
                }}
                className="qr-toggle-grid"
              >
                <Toggle
                  label="Center logo"
                  checked={design.logo}
                  onChange={(v) => patchDesign({ logo: v })}
                />
                <Toggle
                  label="Transparent background"
                  checked={design.transparent}
                  onChange={(v) => patchDesign({ transparent: v })}
                />
              </div>

              {design.logo && hasMatrix && !logoFits && (
                <p style={hintText}>
                  The logo is hidden because this code is too small to hold one
                  safely. Add more text and it will appear automatically.
                </p>
              )}
              {design.logo && logoFits && (ecl === 'L' || ecl === 'M') && (
                <p style={hintText}>
                  Tip: error correction Q or H allows a larger logo. The logo
                  size adapts automatically so the code stays scannable.
                </p>
              )}

              <label style={{ ...sectionLabel, marginTop: 18 }}>
                Download Resolution
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {RESOLUTIONS.map((r) => (
                  <OptionButton
                    key={r.px}
                    active={resolution === r.px}
                    onClick={() => setResolution(r.px)}
                    title={`${r.px} px wide`}
                  >
                    {r.label}
                  </OptionButton>
                ))}
              </div>
              <p style={hintText}>
                PNG export: {resolution} px wide. The SVG download is vector,
                so it stays sharp at any size.
              </p>
            </div>

            {/* Stats */}
            {qrData && (
              <div style={{ marginTop: 24 }}>
                <h3
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 10,
                  }}
                >
                  QR Code Information
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                  }}
                >
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      title={STAT_INFO[stat.label]}
                      style={{
                        padding: '10px 14px',
                        background: 'var(--color-bg-primary)',
                        borderRadius: 8,
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          marginBottom: 2,
                        }}
                      >
                        {stat.label}
                      </div>

                      <div
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          color: 'var(--color-cyan)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {stat.value}
                      </div>

                      <p
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--color-text-muted)',
                          lineHeight: 1.5,
                          marginTop: 6,
                        }}
                      >
                        {STAT_INFO[stat.label]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 20,
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={handleDownloadPNG}
                disabled={!canDownload || exporting}
                className="btn-secondary"
                style={{
                  flex: 1,
                  minWidth: 110,
                  opacity: canDownload && !exporting ? 1 : 0.4,
                  justifyContent: 'center',
                }}
              >
                {exporting ? (
                  <Loader2 size={16} className="qr-spin" />
                ) : (
                  <Download size={16} />
                )}
                {exporting ? 'Preparing…' : 'PNG'}
              </button>

              <button
                onClick={handleDownloadSVG}
                disabled={!hasMatrix}
                className="btn-secondary"
                style={{
                  flex: 1,
                  minWidth: 110,
                  opacity: hasMatrix ? 1 : 0.4,
                  justifyContent: 'center',
                }}
              >
                <FileCode2 size={16} /> SVG
              </button>

              <button
                onClick={handleCopy}
                disabled={!text}
                className="btn-secondary"
                style={{
                  flex: 1,
                  minWidth: 110,
                  opacity: text ? 1 : 0.4,
                  justifyContent: 'center',
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>

              <button
                onClick={() => {
                  reset();
                  setDesign(DEFAULT_DESIGN);
                }}
                className="btn-secondary"
                style={{
                  flex: 1,
                  minWidth: 110,
                  justifyContent: 'center',
                }}
              >
                <RotateCcw size={16} /> Reset
              </button>
            </div>

            {exportError && (
              <p style={{ ...hintText, color: '#FF6B6B' }} role="alert">
                {exportError}
              </p>
            )}
          </motion.div>

          {/* Right: QR Display */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="glass-panel glow-cyan"
            style={{
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 400,
              position: 'sticky',
              top: 90,
            }}
          >
            {previewUri || qrImageURL ? (
              <>
                <motion.div
                  key={designKey}
                  initial={{ opacity: 0.4, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    width: '100%',
                    maxWidth: 380,
                    background: '#ffffff',
                    // Light checkerboard makes the transparency visible while
                    // keeping the code high-contrast and scannable on screen.
                    backgroundImage:
                      design.transparent && previewUri
                        ? 'conic-gradient(#eef0f8 25%, #ffffff 0 50%, #eef0f8 0 75%, #ffffff 0)'
                        : 'none',
                    backgroundSize: '20px 20px',
                  }}
                >
                  <img
                    src={previewUri || qrImageURL}
                    alt="Generated QR Code"
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                      aspectRatio: previewUri ? `${previewSize.w} / ${previewSize.h}` : '1 / 1',
                      imageRendering: previewUri ? 'auto' : 'pixelated',
                    }}
                  />
                </motion.div>

                <p
                  style={{
                    marginTop: 16,
                    fontSize: '0.82rem',
                    color: 'var(--color-text-muted)',
                    textAlign: 'center',
                    lineHeight: 1.6,
                  }}
                >
                  Scan this QR Code using a smartphone camera or QR scanner.
                  The scanner detects the symbol, reads its modules, and decodes
                  the stored information.
                </p>

                {previewUri && design.transparent && (
                  <p
                    style={{
                      marginTop: 8,
                      fontSize: '0.78rem',
                      color: 'var(--color-text-muted)',
                      textAlign: 'center',
                      lineHeight: 1.6,
                    }}
                  >
                    The checkerboard shows the transparent background. Place
                    the downloaded file on a light surface so phones can scan
                    it reliably.
                  </p>
                )}

                <div
                  style={{
                    marginTop: 14,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--color-bg-primary)',
                    width: '100%',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--color-text-muted)',
                      lineHeight: 1.6,
                      textAlign: 'center',
                    }}
                  >
                    <strong style={{ color: 'var(--color-cyan)' }}>
                      Quiet Zone:
                    </strong>{' '}
                    QR Codes require a clear margin around the symbol. The
                    standard minimum is four modules on each side, helping
                    scanners distinguish the QR Code from surrounding content.
                    Your download already includes it.
                  </p>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <QrCode
                  size={64}
                  style={{
                    color: 'var(--color-text-muted)',
                    opacity: 0.3,
                    marginBottom: 16,
                  }}
                />

                <p
                  style={{
                    color: 'var(--color-text-muted)',
                    fontSize: '0.95rem',
                  }}
                >
                  Enter text above to generate a QR Code.
                </p>

                <p
                  style={{
                    color: 'var(--color-text-muted)',
                    fontSize: '0.8rem',
                    lineHeight: 1.6,
                    marginTop: 10,
                    maxWidth: 300,
                  }}
                >
                  Your input will be encoded into a two-dimensional pattern
                  containing data and error correction information.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes qr-spin { to { transform: rotate(360deg); } }
        .qr-spin { animation: qr-spin 0.9s linear infinite; }
        @media (max-width: 768px) {
          .qr-gen-grid {
            grid-template-columns: 1fr !important;
          }
          .qr-gen-grid > :last-child {
            position: static !important;
          }
        }
        @media (max-width: 480px) {
          .qr-toggle-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
