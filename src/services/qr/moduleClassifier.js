
/**
 * QR Module Classification Engine
 *
 * Classifies QR Code Model 2 modules according to the
 * ISO/IEC 18004 specification.
 *
 * Module types:
 * - FINDER: Finder patterns (3 corners)
 * - SEPARATOR: White separators around finder patterns
 * - TIMING_H: Horizontal timing pattern
 * - TIMING_V: Vertical timing pattern
 * - ALIGNMENT: Alignment patterns
 * - FORMAT_INFO: Format information
 * - VERSION_INFO: Version information (version >= 7)
 * - DATA: Data and error correction codewords
 * - DARK_MODULE: The single always-dark module
 */

/**
 * Alignment pattern center positions by QR version.
 */
const ALIGNMENT_POSITIONS = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
  11: [6, 30, 54],
  12: [6, 32, 58],
  13: [6, 34, 62],
  14: [6, 26, 46, 66],
  15: [6, 26, 48, 70],
  16: [6, 26, 50, 74],
  17: [6, 30, 54, 78],
  18: [6, 30, 56, 82],
  19: [6, 30, 58, 86],
  20: [6, 34, 62, 90],
  21: [6, 28, 50, 72, 94],
  22: [6, 26, 50, 74, 98],
  23: [6, 30, 54, 78, 102],
  24: [6, 28, 54, 80, 106],
  25: [6, 32, 58, 84, 110],
  26: [6, 30, 58, 86, 114],
  27: [6, 34, 62, 90, 118],
  28: [6, 26, 50, 74, 98, 122],
  29: [6, 30, 54, 78, 102, 126],
  30: [6, 26, 52, 78, 104, 130],
  31: [6, 30, 56, 82, 108, 134],
  32: [6, 34, 60, 86, 112, 138],
  33: [6, 30, 58, 86, 114, 142],
  34: [6, 34, 62, 90, 118, 146],
  35: [6, 30, 54, 78, 102, 126, 150],
  36: [6, 24, 50, 76, 102, 128, 154],
  37: [6, 28, 54, 80, 106, 132, 158],
  38: [6, 32, 58, 84, 110, 136, 162],
  39: [6, 26, 54, 82, 110, 138, 166],
  40: [6, 30, 58, 86, 114, 142, 170],
};

export const MODULE_TYPES = {
  FINDER: 'FINDER',
  SEPARATOR: 'SEPARATOR',
  TIMING_H: 'TIMING_H',
  TIMING_V: 'TIMING_V',
  ALIGNMENT: 'ALIGNMENT',
  FORMAT_INFO: 'FORMAT_INFO',
  VERSION_INFO: 'VERSION_INFO',
  DATA: 'DATA',
  DARK_MODULE: 'DARK_MODULE',
};

export const MODULE_INFO = {
  [MODULE_TYPES.FINDER]: {
    name: 'Finder Pattern',
    color: '#FF6B6B',
    hoverColor: '#FF8E8E',
    description:
      'Three distinctive square patterns located at three corners of a QR code. They help scanners detect the code, determine its orientation, and estimate its size.',
    details:
      'Every standard QR Code Model 2 symbol has exactly three finder patterns: top-left, top-right, and bottom-left. Each pattern is a 7×7 arrangement of dark and light modules, forming three nested square regions. When scanned through the center, the alternating dark-light-dark-light-dark sequence follows a 1:1:3:1:1 ratio. QR scanners use this distinctive pattern to locate the code and estimate its orientation and module size.',
  },

  [MODULE_TYPES.SEPARATOR]: {
    name: 'Separator',
    color: '#FFA94D',
    hoverColor: '#FFB86C',
    description:
      'White separator regions surrounding the finder patterns. They visually separate the finder patterns from nearby modules and help scanners recognize them.',
    details:
      'Separators are one module wide and consist of light modules. They create a clear boundary between each finder pattern and the surrounding QR code structure.',
  },

  [MODULE_TYPES.TIMING_H]: {
    name: 'Timing Pattern (Horizontal)',
    color: '#51CF66',
    hoverColor: '#69DB7C',
    description:
      'An alternating sequence of dark and light modules that helps scanners determine the positions and spacing of modules.',
    details:
      'The horizontal timing pattern runs along row 6 between the finder pattern areas. It alternates between dark and light modules, helping the scanner establish the horizontal grid and determine module spacing.',
  },

  [MODULE_TYPES.TIMING_V]: {
    name: 'Timing Pattern (Vertical)',
    color: '#51CF66',
    hoverColor: '#69DB7C',
    description:
      'An alternating sequence of dark and light modules that helps scanners determine the positions and spacing of modules.',
    details:
      'The vertical timing pattern runs along column 6 between the top-left and bottom-left finder pattern areas. Like the horizontal timing pattern, it alternates between dark and light modules to establish the vertical grid.',
  },

  [MODULE_TYPES.ALIGNMENT]: {
    name: 'Alignment Pattern',
    color: '#339AF0',
    hoverColor: '#4DABF7',
    description:
      'Small square patterns that help QR scanners correct geometric distortion and maintain accurate module positioning, especially when the code is viewed at an angle.',
    details:
      'Alignment patterns are 5×5 arrangements of modules with three nested square regions: a dark outer border, a light middle ring, and a single dark center module. They are absent in Version 1 and appear from Version 2 onward. Higher QR versions generally include more alignment patterns at specified positions across the symbol. These patterns help scanners compensate for perspective distortion and curved surfaces, improving the accuracy of module detection.',
  },

  [MODULE_TYPES.FORMAT_INFO]: {
    name: 'Format Information',
    color: '#CC5DE8',
    hoverColor: '#DA77F2',
    description:
      'Information that tells the scanner which error correction level and mask pattern are used in the QR code.',
    details:
      'Format information is a 15-bit sequence containing 2 bits for the error correction level, 3 bits for the mask pattern, and 10 error correction bits. Two copies are stored in different areas near the finder patterns to improve reliability if part of the QR code is damaged.',
  },

  [MODULE_TYPES.VERSION_INFO]: {
    name: 'Version Information',
    color: '#F06595',
    hoverColor: '#F783AC',
    description:
      'Information identifying the QR code version. It is included in QR versions 7 and above.',
    details:
      'Version information is an 18-bit sequence containing 6 bits for the QR version number and 12 error correction bits. Two copies are placed in fixed areas near the top-right and bottom-left finder patterns.',
  },

  [MODULE_TYPES.DATA]: {
    name: 'Data & Error Correction',
    color: '#22B8CF',
    hoverColor: '#3BC9DB',
    description:
      'These regions store the encoded information and additional error correction data used to help recover information if parts of the QR code are damaged.',
    details:
      'The data area contains data codewords and Reed–Solomon error correction codewords. These codewords are placed in a defined zigzag pattern, moving through two columns at a time and alternating upward and downward. The selected mask pattern is applied to the data and error correction modules.',
  },

  [MODULE_TYPES.DARK_MODULE]: {
    name: 'Dark Module',
    color: '#845EF7',
    hoverColor: '#9775FA',
    description:
      'A single module that is always dark and occupies a fixed position in the QR code structure.',
    details:
      'The dark module is located at row (4 × version + 9) and column 8, using zero-based coordinates. It remains dark regardless of the mask pattern applied.',
  },
};

/**
 * Check whether a position overlaps a finder pattern area,
 * including its surrounding separator (8×8 area).
 */
function isInFinderArea(row, col, moduleCount) {
  // Top-left finder area
  if (row <= 8 && col <= 8) return true;

  // Top-right finder area
  if (row <= 8 && col >= moduleCount - 9) return true;

  // Bottom-left finder area
  if (row >= moduleCount - 9 && col <= 8) return true;

  return false;
}

/**
 * Classify every module in a QR code matrix.
 *
 * @param {number} version - QR version (1-40)
 * @param {number} moduleCount - Number of modules per side
 * @returns {string[][]} Classification map
 */
export function classifyModules(version, moduleCount) {
  // Initialize all modules as DATA
  const map = Array.from({ length: moduleCount }, () =>
    Array(moduleCount).fill(MODULE_TYPES.DATA)
  );

  // 1. Finder Patterns (7×7 at three corners)
  const finderPositions = [
    [0, 0],
    [0, moduleCount - 7],
    [moduleCount - 7, 0],
  ];

  for (const [startRow, startCol] of finderPositions) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        map[startRow + r][startCol + c] = MODULE_TYPES.FINDER;
      }
    }
  }

  // 2. Separators (one module wide around finder patterns)

  // Top-left separator
  for (let i = 0; i < 8; i++) {
    map[7][i] = MODULE_TYPES.SEPARATOR;
    map[i][7] = MODULE_TYPES.SEPARATOR;
  }

  // Top-right separator
  for (let i = 0; i < 8; i++) {
    map[7][moduleCount - 8 + i] = MODULE_TYPES.SEPARATOR;
    map[i][moduleCount - 8] = MODULE_TYPES.SEPARATOR;
  }

  // Bottom-left separator
  for (let i = 0; i < 8; i++) {
    map[moduleCount - 8][i] = MODULE_TYPES.SEPARATOR;
    map[moduleCount - 8 + i][7] = MODULE_TYPES.SEPARATOR;
  }

  // 3. Timing Patterns

  // Horizontal timing pattern: row 6
  for (let col = 8; col < moduleCount - 8; col++) {
    if (map[6][col] === MODULE_TYPES.DATA) {
      map[6][col] = MODULE_TYPES.TIMING_H;
    }
  }

  // Vertical timing pattern: column 6
  for (let row = 8; row < moduleCount - 8; row++) {
    if (map[row][6] === MODULE_TYPES.DATA) {
      map[row][6] = MODULE_TYPES.TIMING_V;
    }
  }

  // 4. Alignment Patterns
  const positions = ALIGNMENT_POSITIONS[version] || [];

  for (let i = 0; i < positions.length; i++) {
    for (let j = 0; j < positions.length; j++) {
      const centerRow = positions[i];
      const centerCol = positions[j];

      // Skip alignment patterns overlapping finder areas
      if (isInFinderArea(centerRow, centerCol, moduleCount)) {
        continue;
      }

      // Place the 5×5 alignment pattern
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const row = centerRow + r;
          const col = centerCol + c;

          if (
            row >= 0 &&
            row < moduleCount &&
            col >= 0 &&
            col < moduleCount
          ) {
            map[row][col] = MODULE_TYPES.ALIGNMENT;
          }
        }
      }
    }
  }

  // 5. Format Information (15 bits in each of two copies)

  // First copy: around the top-left finder pattern.
  // Horizontal section: row 8, columns 0-5 and 7-8.
  for (let col = 0; col <= 8; col++) {
    if (col !== 6) {
      map[8][col] = MODULE_TYPES.FORMAT_INFO;
    }
  }

  // Vertical section: column 8, rows 0-5 and 7-8.
  for (let row = 0; row <= 8; row++) {
    if (row !== 6) {
      map[row][8] = MODULE_TYPES.FORMAT_INFO;
    }
  }

  // Second copy: around the bottom-left and top-right finder patterns.

  // Vertical section: column 8, rows moduleCount-7 to moduleCount-1.
  for (let row = moduleCount - 7; row < moduleCount; row++) {
    map[row][8] = MODULE_TYPES.FORMAT_INFO;
  }

  // Horizontal section: row 8, columns moduleCount-8 to moduleCount-1.
  for (let col = moduleCount - 8; col < moduleCount; col++) {
    map[8][col] = MODULE_TYPES.FORMAT_INFO;
  }

  // 6. Dark Module
  // Fixed position: row 4 × version + 9, column 8.
  const darkModuleRow = 4 * version + 9;

  if (darkModuleRow < moduleCount) {
    map[darkModuleRow][8] = MODULE_TYPES.DARK_MODULE;
  }

  // 7. Version Information (versions 7 and above)
  if (version >= 7) {
    // 3×6 block near the bottom-left finder pattern.
    for (let row = moduleCount - 11; row < moduleCount - 8; row++) {
      for (let col = 0; col < 6; col++) {
        map[row][col] = MODULE_TYPES.VERSION_INFO;
      }
    }

    // 6×3 block near the top-right finder pattern.
    for (let row = 0; row < 6; row++) {
      for (let col = moduleCount - 11; col < moduleCount - 8; col++) {
        map[row][col] = MODULE_TYPES.VERSION_INFO;
      }
    }
  }

  return map;
}

/**
 * Get a summary of module counts by type.
 *
 * @param {string[][]} classificationMap - Module classification map
 * @returns {Object} Counts of each module type
 */
export function getModuleSummary(classificationMap) {
  const counts = {};

  for (const type of Object.values(MODULE_TYPES)) {
    counts[type] = 0;
  }

  for (const row of classificationMap) {
    for (const type of row) {
      counts[type] = (counts[type] || 0) + 1;
    }
  }

  return counts;
}
