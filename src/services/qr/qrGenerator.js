
/**
 * QR Code Generation Service
 * Uses qrcode-generator library for standards-compliant QR Code Model 2 generation.
 * Exposes the raw module matrix for visualization and analysis.
 */
import qrcode from 'qrcode-generator';
/**
 * Error correction level descriptions
 * Recovery percentages refer to approximate codeword recovery,
 * not the percentage of the QR image that can be damaged.
 */
export const ERROR_CORRECTION_INFO = {
  L: {
    label: 'Low (L)',
    short: 'L',
    description:
      'Provides approximately 7% codeword recovery. It offers the highest data capacity but the lowest level of error protection.',
    recovery: '~7%',
  },
  M: {
    label: 'Medium (M)',
    short: 'M',
    description:
      'Provides approximately 15% codeword recovery. It provides a balance between data capacity and error protection.',
    recovery: '~15%',
  },
  Q: {
    label: 'Quartile (Q)',
    short: 'Q',
    description:
      'Provides approximately 25% codeword recovery. It offers stronger protection when a higher level of error correction is needed.',
    recovery: '~25%',
  },
  H: {
    label: 'High (H)',
    short: 'H',
    description:
      'Provides approximately 30% codeword recovery. It offers the highest error correction level, with less available data capacity.',
    recovery: '~30%',
  },
};

/**
 * Generate a QR code and return all relevant data.
 * @param {string} text - The text/URL to encode.
 * @param {string} errorCorrectionLevel - 'L', 'M', 'Q', or 'H'.
 * @returns {Object|null} QR data including matrix, version, moduleCount, etc.
 */
export function generateQR(text, errorCorrectionLevel = 'M') {
  if (!text || text.length === 0) {
    return null;
  }

  try {
    const ecl = errorCorrectionLevel.toUpperCase();
    const qr = qrcode(0, ecl);

    qr.addData(text);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const version = Math.round((moduleCount - 17) / 4);

    // Extract the module matrix
    const matrix = [];

    for (let row = 0; row < moduleCount; row++) {
      const rowData = [];

      for (let col = 0; col < moduleCount; col++) {
        rowData.push(qr.isDark(row, col) ? 1 : 0);
      }

      matrix.push(rowData);
    }

    return {
      matrix,
      moduleCount,
      version,
      errorCorrectionLevel: ecl,
      text,
      charCount: Array.from(text).length,
      qrInstance: qr,
    };
  } catch (err) {
    console.error('QR generation error:', err);
    return null;
  }
}

/**
 * Generate a data URL for a clean, scannable QR code image.
 * @param {string} text
 * @param {string} errorCorrectionLevel
 * @param {number} cellSize - Pixels per module.
 * @param {number} margin - Quiet zone modules.
 * @returns {string|null} Data URL.
 */
export function generateQRDataURL(
  text,
  errorCorrectionLevel = 'M',
  cellSize = 8,
  margin = 4
) {
  if (!text) return null;

  try {
    const ecl = errorCorrectionLevel.toUpperCase();
    const qr = qrcode(0, ecl);

    qr.addData(text);
    qr.make();

    return qr.createDataURL(cellSize, margin);
  } catch (err) {
    console.error('QR image generation error:', err);
    return null;
  }
}

/**
 * Generate an SVG string for the QR code.
 * @param {string} text
 * @param {string} errorCorrectionLevel
 * @param {number} cellSize - Pixels per module.
 * @param {number} margin - Quiet zone modules.
 * @returns {string|null} SVG string.
 */
export function generateQRSVG(
  text,
  errorCorrectionLevel = 'M',
  cellSize = 8,
  margin = 4
) {
  if (!text) return null;

  try {
    const ecl = errorCorrectionLevel.toUpperCase();
    const qr = qrcode(0, ecl);

    qr.addData(text);
    qr.make();

    return qr.createSvgTag(cellSize, margin);
  } catch (err) {
    console.error('QR SVG generation error:', err);
    return null;
  }
}
