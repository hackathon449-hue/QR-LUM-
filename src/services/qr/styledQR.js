/**
 * Styled QR renderer (v2)
 * ------------------------------------------------------------------
 * Takes the raw module matrix (1 = dark) and returns a crisp vector SVG:
 * five module shapes, four corner-eye styles, three gradient directions,
 * six colour themes, optional frames with a label, a centre logo and a
 * transparent (or white) background. The SVG is the single source of truth:
 * it drives the live preview, the SVG download, and it is rasterised to a PNG
 * at any resolution.
 *
 * Place this file at: src/services/qr/styledQR.js
 */

/* ------------------------------------------------------------------ */
/*  Options the UI can offer                                          */
/* ------------------------------------------------------------------ */

export const QR_STYLES = [
  { key: 'rounded', label: 'Rounded' },
  { key: 'tiles', label: 'Tiles' },
  { key: 'bars', label: 'Bars' },
  { key: 'dots', label: 'Dots' },
  { key: 'classic', label: 'Classic' },
];

export const QR_EYES = [
  { key: 'rounded', label: 'Soft' },
  { key: 'circle', label: 'Circle' },
  { key: 'leaf', label: 'Leaf' },
  { key: 'square', label: 'Square' },
];

export const QR_GRADIENTS = [
  { key: 'diagonal', label: 'Diagonal' },
  { key: 'vertical', label: 'Vertical' },
  { key: 'radial', label: 'Radial' },
];

export const QR_FRAMES = [
  { key: 'none', label: 'None' },
  { key: 'badge', label: 'Badge' },
  { key: 'brackets', label: 'Brackets' },
];

// Every colour is deliberately dark and saturated so the code keeps strong
// contrast on a light background and stays easy for phones to scan.
export const QR_PALETTES = {
  aurora: { label: 'Aurora', stops: ['#0891B2', '#4F46E5', '#C026D3'], eye: '#DB2777' },
  sunset: { label: 'Sunset', stops: ['#EA580C', '#DC2626', '#7E22CE'], eye: '#9333EA' },
  lagoon: { label: 'Lagoon', stops: ['#059669', '#0891B2', '#2563EB'], eye: '#0F766E' },
  berry: { label: 'Berry', stops: ['#BE123C', '#A21CAF', '#6D28D9'], eye: '#EA580C' },
  ocean: { label: 'Ocean', stops: ['#1D4ED8', '#0369A1', '#0F766E'], eye: '#7C3AED' },
  midnight: { label: 'Midnight', stops: ['#0F172A', '#1E1B4B', '#0F172A'], eye: '#4F46E5' },
};

// One-click looks. Each combination was scan-tested.
export const QR_PRESETS = [
  { key: 'aurora', label: 'Aurora Glow', design: { style: 'rounded', eyes: 'circle', palette: 'aurora', gradient: 'diagonal', frame: 'badge' } },
  { key: 'candy', label: 'Candy Pop', design: { style: 'tiles', eyes: 'rounded', palette: 'berry', gradient: 'vertical', frame: 'brackets' } },
  { key: 'ocean', label: 'Deep Ocean', design: { style: 'bars', eyes: 'leaf', palette: 'ocean', gradient: 'vertical', frame: 'none' } },
  { key: 'sunset', label: 'Sunset', design: { style: 'rounded', eyes: 'leaf', palette: 'sunset', gradient: 'radial', frame: 'none' } },
  { key: 'ink', label: 'Classic Ink', design: { style: 'classic', eyes: 'square', palette: 'midnight', gradient: 'diagonal', frame: 'none' } },
];

/* ------------------------------------------------------------------ */
/*  Internals                                                         */
/* ------------------------------------------------------------------ */

// Share of the code's width that the logo's clear zone may take, per
// error-correction level. Conservative on purpose.
const LOGO_FRACTION = { L: 0.12, M: 0.17, Q: 0.21, H: 0.26 };

// Finder-pattern RING corner radii. Decoders find a code by its three finder
// patterns, and strongly rounded rings made them fail in testing, so the ring
// stays nearly square. The inner "eye" can be much rounder.
const RING = 0.33;
const HOLE = 0.2;

const EYE_SHAPES = {
  square: { ring: [0, 0, 0, 0], hole: [0, 0, 0, 0], eye: [0, 0, 0, 0] },
  rounded: { ring: [RING, RING, RING, RING], hole: [HOLE, HOLE, HOLE, HOLE], eye: [1, 1, 1, 1] },
  circle: { ring: [RING, RING, RING, RING], hole: [HOLE, HOLE, HOLE, HOLE], eye: [1.5, 1.5, 1.5, 1.5] },
  // [top-left, top-right, bottom-right, bottom-left]
  leaf: { ring: [RING, RING, RING, RING], hole: [HOLE, HOLE, HOLE, HOLE], eye: [1.5, 0.2, 1.5, 0.2] },
};

const f = (v) => +v.toFixed(3);

const escapeXml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Side of the (odd, centred) clear zone behind the logo, in modules.
 * Returns 0 for codes too small to host a logo safely (versions 1-2, i.e.
 * fewer than 29 modules): there the logo sits right next to the finders and
 * broke scanning in testing.
 */
export function getLogoModules(moduleCount, ecl = 'M') {
  if (moduleCount < 29) return 0;
  let s = Math.round(moduleCount * (LOGO_FRACTION[ecl] ?? LOGO_FRACTION.M));
  if (s % 2 === 0) s += 1; // moduleCount is always odd, so odd keeps it centred
  // Never touch the format-information strips (they sit in modules 0-8 and n-8..n-1).
  const maxS = moduleCount - 18;
  return Math.max(3, Math.min(s, maxS));
}

/** Rounded rectangle path with an independent radius per corner. */
function roundRect(x, y, w, h, tl, tr, br, bl) {
  const p = [`M${f(x + tl)} ${f(y)}`, `H${f(x + w - tr)}`];
  if (tr) p.push(`A${f(tr)} ${f(tr)} 0 0 1 ${f(x + w)} ${f(y + tr)}`);
  p.push(`V${f(y + h - br)}`);
  if (br) p.push(`A${f(br)} ${f(br)} 0 0 1 ${f(x + w - br)} ${f(y + h)}`);
  p.push(`H${f(x + bl)}`);
  if (bl) p.push(`A${f(bl)} ${f(bl)} 0 0 1 ${f(x)} ${f(y + h - bl)}`);
  p.push(`V${f(y + tl)}`);
  if (tl) p.push(`A${f(tl)} ${f(tl)} 0 0 1 ${f(x + tl)} ${f(y)}`);
  return p.join('') + 'Z';
}

const rect = (x, y, w, h, r) => roundRect(x, y, w, h, r[0], r[1], r[2], r[3]);

/** The brand logo, drawn as vectors in a 100 x 100 box and scaled to `size`. */
function logoMarkup(cx, cy, size) {
  const cells = [];
  const start = 16.25;
  const cell = 18;
  const gap = 6.75;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (r === 1 && c === 1) continue; // empty centre
      cells.push(
        `<rect x="${f(start + c * (cell + gap))}" y="${f(start + r * (cell + gap))}" width="${cell}" height="${cell}" rx="4.5"/>`
      );
    }
  }
  return (
    `<g transform="translate(${f(cx - size / 2)} ${f(cy - size / 2)}) scale(${f(size / 100)})">` +
    `<rect width="100" height="100" rx="24" fill="#0A0A1F"/>` +
    `<rect x="3.25" y="3.25" width="93.5" height="93.5" rx="20.75" fill="none" stroke="#22D3EE" stroke-width="6.5"/>` +
    `<g fill="#22D3EE">${cells.join('')}</g>` +
    `</g>`
  );
}

/* ------------------------------------------------------------------ */
/*  Layout (code + optional frame and label)                          */
/* ------------------------------------------------------------------ */

const FRAME_PAD = 1.6; // margin around the code when a label pill is shown
const FRAME_PAD_BARE = 3; // margin when there is no label
const PILL_H = 3.4;

function cleanLabel(frame, label) {
  return frame === 'none' ? '' : String(label ?? '').trim().slice(0, 24);
}

function layoutOf(n, quiet, frame, hasLabel) {
  const base = n + quiet * 2;
  if (frame === 'none') return { base, W: base, H: base, P: 0 };
  // Without a label pill the frame needs extra breathing room: a square outline
  // hugging the code made one decoder mistake the frame for the code's edge.
  const P = hasLabel ? FRAME_PAD : FRAME_PAD_BARE;
  return { base, W: base + 2 * P, H: hasLabel ? base + 8.2 : base + 2 * P, P };
}

/** Width/height ratio of the finished image, for sizing previews. */
export function getStyledQRSize(moduleCount, opts = {}) {
  const { frame = 'none', label = 'SCAN ME', quiet = 4 } = opts;
  const { W, H } = layoutOf(moduleCount, quiet, frame, !!cleanLabel(frame, label));
  return { w: W, h: H };
}

/* ------------------------------------------------------------------ */
/*  Main builder                                                      */
/* ------------------------------------------------------------------ */

/**
 * @param {number[][]} matrix       module matrix, 1 = dark
 * @param {number}     moduleCount  modules per side
 * @param {object}     opts
 *   style        'rounded' | 'tiles' | 'bars' | 'dots' | 'classic'
 *   eyes         'rounded' | 'circle' | 'leaf' | 'square'
 *   palette      key of QR_PALETTES
 *   gradient     'diagonal' | 'vertical' | 'radial'
 *   frame        'none' | 'badge' | 'brackets'
 *   label        text on the frame's label pill (empty = no pill)
 *   logo         draw the centre logo (clears the modules behind it)
 *   transparent  true = no background, false = white
 *   ecl          'L' | 'M' | 'Q' | 'H' - sizes the logo safely
 *   quiet        quiet-zone width in modules (default 4)
 *   px           optional pixel width written to width/height
 */
export function buildStyledQRSvg(matrix, moduleCount, opts = {}) {
  const {
    style = 'rounded',
    eyes = 'rounded',
    palette = 'aurora',
    gradient = 'diagonal',
    frame = 'none',
    label = 'SCAN ME',
    logo = true,
    transparent = true,
    ecl = 'M',
    quiet = 4,
    px,
  } = opts;

  const n = moduleCount;
  const pal = QR_PALETTES[palette] ?? QR_PALETTES.aurora;
  const eyeShape = EYE_SHAPES[eyes] ?? EYE_SHAPES.rounded;
  const total = n + quiet * 2;

  const labelText = cleanLabel(frame, label);
  const { W, H, P } = layoutOf(n, quiet, frame, !!labelText);

  const isDark = (r, c) => r >= 0 && c >= 0 && r < n && c < n && matrix[r][c] === 1;
  const inFinder = (r, c) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

  const logoSide = logo ? getLogoModules(n, ecl) : 0;
  const logoStart = (n - logoSide) / 2;
  const inLogo = (r, c) =>
    logoSide > 0 &&
    r >= logoStart && r < logoStart + logoSide &&
    c >= logoStart && c < logoStart + logoSide;

  // Modules drawn as data (finders are drawn separately)
  const has = (r, c) => isDark(r, c) && !inFinder(r, c) && !inLogo(r, c);

  /* ---- data modules: one path, so touching shapes merge with no seams ---- */
  let data = '';

  if (style === 'bars') {
    // vertical runs become single pill-shaped bars
    for (let c = 0; c < n; c++) {
      let r = 0;
      while (r < n) {
        if (!has(r, c)) { r++; continue; }
        const start = r;
        while (r < n && has(r, c)) r++;
        const len = r - start;
        data += roundRect(c + quiet + 0.08, start + quiet + 0.04, 0.84, len - 0.08, 0.42, 0.42, 0.42, 0.42);
      }
    }
  } else {
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!has(r, c)) continue;
        const x = c + quiet;
        const y = r + quiet;

        if (style === 'dots') {
          const rad = 0.5;
          const cx = x + 0.5;
          const cy = y + 0.5;
          data += `M${f(cx - rad)} ${f(cy)}a${rad} ${rad} 0 1 0 ${f(rad * 2)} 0a${rad} ${rad} 0 1 0 ${f(-rad * 2)} 0Z`;
        } else if (style === 'tiles') {
          const g = 0.05;
          data += roundRect(x + g, y + g, 1 - 2 * g, 1 - 2 * g, 0.2, 0.2, 0.2, 0.2);
        } else if (style === 'rounded') {
          // Round a corner only where both neighbours around it are empty:
          // runs of modules melt into smooth, liquid shapes.
          const R = 0.5;
          const up = has(r - 1, c);
          const down = has(r + 1, c);
          const left = has(r, c - 1);
          const right = has(r, c + 1);
          data += roundRect(
            x, y, 1, 1,
            !up && !left ? R : 0,
            !up && !right ? R : 0,
            !down && !right ? R : 0,
            !down && !left ? R : 0
          );
        } else {
          data += `M${x} ${y}h1v1h-1Z`;
        }
      }
    }
  }

  /* ---- finder patterns: ring in the gradient, eye in the accent colour ---- */
  let rings = '';
  let eyesPath = '';
  [[0, 0], [0, n - 7], [n - 7, 0]].forEach(([r0, c0]) => {
    const x = c0 + quiet;
    const y = r0 + quiet;
    rings += rect(x, y, 7, 7, eyeShape.ring) + rect(x + 1, y + 1, 5, 5, eyeShape.hole);
    eyesPath += rect(x + 2, y + 2, 3, 3, eyeShape.eye);
  });

  /* ---- gradients ---- */
  const [s0, s1, s2] = pal.stops;
  const stopsXml = `<stop offset="0" stop-color="${s0}"/><stop offset="0.5" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/>`;
  const codeGradient =
    gradient === 'radial'
      ? `<radialGradient id="qrg" gradientUnits="userSpaceOnUse" cx="${total / 2}" cy="${total / 2}" r="${f(n * 0.72)}">${stopsXml}</radialGradient>`
      : `<linearGradient id="qrg" gradientUnits="userSpaceOnUse" x1="${gradient === 'vertical' ? 0 : quiet}" y1="${quiet}" x2="${gradient === 'vertical' ? 0 : total - quiet}" y2="${total - quiet}">${stopsXml}</linearGradient>`;
  const frameGradient = `<linearGradient id="qrf" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${f(W)}" y2="${f(H)}">${stopsXml}</linearGradient>`;

  /* ---- the code itself (shifted inside the frame when there is one) ---- */
  const logoSvg = logoSide > 0 ? logoMarkup(total / 2, total / 2, logoSide - 0.6) : '';
  const code =
    `<g transform="translate(${P} ${P})">` +
    `<path d="${data}" fill="url(#qrg)"/>` +
    `<path d="${rings}" fill="url(#qrg)" fill-rule="evenodd"/>` +
    `<path d="${eyesPath}" fill="${pal.eye}"/>` +
    logoSvg +
    `</g>`;

  /* ---- background, frame, label ---- */
  const bg = transparent ? '' : `<rect width="${f(W)}" height="${f(H)}" rx="${frame === 'none' ? 0 : 3.2}" fill="#FFFFFF"/>`;

  let deco = '';
  if (frame === 'badge') {
    deco += `<rect x="0.45" y="0.45" width="${f(W - 0.9)}" height="${f(H - 0.9)}" rx="3.2" fill="none" stroke="url(#qrf)" stroke-width="0.9"/>`;
  } else if (frame === 'brackets') {
    const arm = 5;
    const r = 1.6;
    const x0 = 0.6;
    const y0 = 0.6;
    const x1 = W - 0.6;
    const y1 = P + total + P - 0.6; // same clearance below the code as at the sides
    const d =
      `M${x0} ${y0 + arm}V${y0 + r}A${r} ${r} 0 0 1 ${x0 + r} ${y0}H${x0 + arm}` +
      `M${f(x1 - arm)} ${y0}H${f(x1 - r)}A${r} ${r} 0 0 1 ${f(x1)} ${y0 + r}V${y0 + arm}` +
      `M${f(x1)} ${f(y1 - arm)}V${f(y1 - r)}A${r} ${r} 0 0 1 ${f(x1 - r)} ${f(y1)}H${f(x1 - arm)}` +
      `M${x0 + arm} ${f(y1)}H${x0 + r}A${r} ${r} 0 0 1 ${x0} ${f(y1 - r)}V${f(y1 - arm)}`;
    deco += `<path d="${d}" fill="none" stroke="url(#qrf)" stroke-width="0.9" stroke-linecap="round"/>`;
  }

  if (labelText) {
    const textW = Math.min(labelText.length * 1.6, W - 8);
    const pillW = textW + 4.8;
    const pillY = P + total + (P - 0.6) + 1.2;
    deco +=
      `<rect x="${f((W - pillW) / 2)}" y="${f(pillY)}" width="${f(pillW)}" height="${PILL_H}" rx="${PILL_H / 2}" fill="url(#qrf)"/>` +
      `<text x="${f(W / 2)}" y="${f(pillY + PILL_H / 2 + 0.78)}" text-anchor="middle" fill="#FFFFFF" ` +
      `font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="2.1" ` +
      `textLength="${f(textW)}" lengthAdjust="spacingAndGlyphs">${escapeXml(labelText)}</text>`;
  }

  const size = px ? ` width="${px}" height="${Math.round((px * H) / W)}"` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(W)} ${f(H)}"${size} shape-rendering="geometricPrecision">` +
    `<defs>${codeGradient}${frameGradient}</defs>` +
    bg +
    code +
    deco +
    `</svg>`
  );
}

/* ------------------------------------------------------------------ */
/*  Export helpers                                                    */
/* ------------------------------------------------------------------ */

export const svgToDataUri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** Rasterise an SVG string (built with `px`) to a PNG Blob at its own size. */
export function svgToPngBlob(svg, px) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || px;
        canvas.height = img.naturalHeight || px;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))),
          'image/png'
        );
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load the generated SVG'));
    };
    img.src = url;
  });
}