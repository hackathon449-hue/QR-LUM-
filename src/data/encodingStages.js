
/**
 * QR encoding process data for the "How It Works" educational section.
 * Explains the main stages of creating a QR Code Model 2 symbol.
 */

export const ENCODING_STAGES = [
  {
    id: 'input',
    number: 1,
    title: 'Input',
    subtitle: 'Your text or URL',
    description:
      'The process begins when you provide text, a URL, or other data. The encoder analyzes the input and determines how to represent it efficiently inside a QR code.',
    details: [
      'QR codes support four main encoding modes: Numeric (digits only), Alphanumeric (uppercase letters, digits, and selected symbols), Byte (8-bit data), and Kanji.',
      'Each mode represents data differently. Numeric mode is especially efficient for digit-only input, while Alphanumeric mode can store supported characters more compactly than Byte mode.',
      'A URL is treated as input data. A QR code does not automatically understand or open a website; it stores the URL so a scanner can read it.',
      'The required QR version (symbol size) depends on the amount of encoded data, the selected encoding mode, and the error correction level.',
      'Byte mode stores bytes rather than abstract characters. A character encoding such as UTF-8 determines how text is converted into bytes.',
      'The number of bytes may differ from the number of characters. For example, the English word "Hello" contains 5 characters and occupies 5 bytes in UTF-8.',
    ],
    icon: '⌨️',
    color: '#22B8CF',
  },
  {
    id: 'encoding',
    number: 2,
    title: 'Data Encoding',
    subtitle: 'Converting data into bits',
    description:
      'The input is converted into a binary bitstream according to the selected encoding mode. The bitstream contains control information and the encoded data itself.',
    details: [
      'A 4-bit mode indicator identifies the encoding mode used, such as 0100 for Byte mode.',
      'A character count indicator specifies how many characters or bytes are encoded. Its bit length depends on the encoding mode and QR version.',
      'In Byte mode, each byte is represented using 8 bits. For example, the word "Hello" is represented by five bytes in the bitstream.',
      'Numeric mode stores groups of three digits using 10 bits. A remaining group of two digits uses 7 bits, and a single digit uses 4 bits.',
      'Alphanumeric mode encodes pairs of supported characters using 11 bits. A remaining single character uses 6 bits.',
      'Kanji mode uses 13 bits for each encoded character, based on the QR Code Kanji encoding rules.',
      'A terminator of up to four zero bits is added when space is available. Zero bits may then be added to complete the final byte.',
      'Padding codewords fill the remaining data capacity when needed. They alternate between 11101100 and 00010001.',
      'Example: "Hello" in Byte mode starts with the mode indicator 0100, followed by a character count of 00000101 for five bytes, then the binary representation of the five characters.',
    ],
    icon: '🔢',
    color: '#51CF66',
  },
  {
    id: 'error-correction',
    number: 3,
    title: 'Error Correction',
    subtitle: 'Adding recovery data',
    description:
      'Reed–Solomon error correction generates additional codewords that help a QR code remain readable even when some of its encoded data is damaged or obscured.',
    details: [
      'The encoded data is divided into blocks. Reed–Solomon coding generates additional error correction codewords for each block.',
      'These additional codewords contain mathematical redundancy. A scanner can use this redundancy to reconstruct damaged or missing codeword information.',
      'There are four error correction levels: L, M, Q, and H. Higher levels add more recovery data but leave less space for the original data.',
      'QR codewords are groups of 8 bits. Error correction operates on these codewords, not directly on individual black and white modules.',
      'The commonly stated recovery estimates are approximately 7% (L), 15% (M), 25% (Q), and 30% (H).',
      'These percentages are approximate codeword recovery capabilities, not a guarantee that the same percentage of the QR image can be covered or removed.',
      'After error correction codewords are generated, data and error correction codewords are interleaved before placement in the QR symbol.',
    ],
    icon: '🛡️',
    color: '#CC5DE8',
  },
  {
    id: 'structure',
    number: 4,
    title: 'Structure Placement',
    subtitle: 'Building the QR framework',
    description:
      'The QR code structure is prepared by placing functional patterns in specific positions. The encoded data and error correction codewords are then placed in the remaining available modules.',
    details: [
      'Three Finder Patterns help scanners locate the QR code and identify its orientation. They are positioned at the top-left, top-right, and bottom-left corners.',
      'Each Finder Pattern has a distinctive 7×7 module structure. Its alternating dark and light regions help scanners recognize the symbol.',
      'Separators create a light boundary around the Finder Patterns, helping distinguish them from nearby modules.',
      'Timing Patterns use alternating dark and light modules along row 6 and column 6 to help determine the grid structure and module spacing.',
      'Alignment Patterns help correct distortion and maintain accurate positioning. Their number and locations depend on the QR version.',
      'Reserved areas are used for Format Information and, in versions 7 and above, Version Information.',
      'Data and error correction bits are placed in a two-column zigzag pattern, starting near the bottom-right corner and moving upward and downward alternately.',
      'The placement process skips modules already reserved for functional patterns and information areas.',
    ],
    icon: '🏗️',
    color: '#FF6B6B',
  },
  {
    id: 'masking',
    number: 5,
    title: 'Masking',
    subtitle: 'Improving readability',
    description:
      'A mask pattern changes selected data modules to create a more balanced visual distribution and reduce patterns that could interfere with QR code scanning.',
    details: [
      'The QR Code standard defines eight different mask patterns. Each uses a mathematical condition to determine which data modules are inverted.',
      'Masking changes the appearance of selected modules: dark modules become light, and light modules become dark.',
      'The encoder evaluates all eight masks using penalty rules that identify undesirable visual patterns.',
      'The penalty rules consider patterns resembling Finder Patterns, long runs of the same color, imbalanced dark and light modules, and certain 2×2 blocks.',
      'The mask with the lowest total penalty score is selected.',
      'Masking applies to data and error correction modules, not to functional patterns such as Finder, Timing, and Alignment Patterns.',
      'The selected mask pattern is recorded in the Format Information so a scanner can reverse the masking process during decoding.',
    ],
    icon: '🎭',
    color: '#FFA94D',
  },
  {
    id: 'final',
    number: 6,
    title: 'Final QR Code',
    subtitle: 'Ready to scan',
    description:
      'After data placement and masking, the required information is added to the reserved areas. The QR code symbol is now complete and can be read by a compatible scanner.',
    details: [
      'Format Information stores the error correction level and the selected mask pattern. It is encoded with error correction and placed in two locations.',
      'Version Information is included in QR versions 7 and above. It identifies the symbol version and is repeated in two locations.',
      'A Quiet Zone of at least four modules should surround the QR code. This margin is outside the symbol itself and helps scanners distinguish it from surrounding content.',
      'The completed QR symbol consists of functional patterns, encoded data, error correction information, and the required reserved areas.',
      'A scanner captures an image, locates the Finder Patterns, determines the grid, reads the modules, and uses the format information to decode the data.',
      'The scanner then reverses the masking and encoding steps, applies error correction when necessary, and reconstructs the original data.',
      'The completed symbol can be scanned and decoded by a compatible QR code reader.',
    ],
    icon: '✅',
    color: '#22B8CF',
  },
];
