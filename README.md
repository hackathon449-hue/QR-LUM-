# QR LAB — Beyond the Squares

> An interactive educational experience exploring the hidden technology behind every QR code.

🔗 **Live demo:** https://qr-lab-40fb2.web.app

![QR LAB](https://img.shields.io/badge/QR_LAB-Beyond_the_Squares-00bcd4?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square)
![Three.js](https://img.shields.io/badge/Three.js-R3F-black?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square)

## 🎯 About

QR LAB is an interactive educational web application that lets visitors explore how QR codes actually work. Instead of just generating QR codes, visitors can:

- **Generate** real, scannable QR codes from any text or URL, with custom styles, colors, frames, and a center logo
- **Explore** the internal anatomy of a QR code with interactive module classification
- **Visualize** QR codes as 3D objects with React Three Fiber (Skyline, Blocks, and Flat views)
- **Learn** the step-by-step encoding pipeline (input → data encoding → error correction → structure placement → masking → final code)
- **Experiment** with error correction by simulating damage
- **Scan** generated QR codes with a real smartphone

**Central educational message:** A QR code is not just a collection of random black and white squares. Every region has a specific role in making information readable, locating the code, and recovering information when parts are damaged.

## 🛠 Technology Stack

| Category | Technology |
|----------|------------|
| Frontend | React 19, Vite 8 |
| Styling | Tailwind CSS 4, Custom CSS |
| 3D Engine | Three.js, React Three Fiber, Drei |
| QR Generation | qrcode-generator (standards-compliant QR Code Model 2) |
| Animation | Framer Motion |
| Icons | Lucide React |
| Deployment | Firebase Hosting |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (tested with Node 24)
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/hackathon449-hue/QR-LUMEN-.git
cd QR-LUMEN-

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server starts at `http://localhost:5173`

## 📦 Deployment (Firebase Hosting)

### First-time setup

```bash
# Install Firebase CLI globally (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Associate this directory with your Firebase project
firebase use <your-project-id>
```

### Deploy

```bash
# Build the production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Custom Domain

After deployment, you can connect a custom domain:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Hosting
3. Click "Add custom domain"
4. Follow the DNS configuration instructions

## 📁 Project Structure

```
QR-LUMEN-/
├── public/                   # Static assets
├── src/
│   ├── components/
│   │   └── layout/           # Navbar
│   ├── sections/
│   │   ├── Hero/             # Landing hero section
│   │   ├── QRGenerator/      # QR code generator and styling
│   │   ├── QRAnatomy/        # Interactive QR anatomy explorer
│   │   ├── ThreeDExplorer/   # 3D QR visualization
│   │   ├── HowItWorks/       # Encoding pipeline education
│   │   ├── ErrorCorrectionLab/ # Error correction experiment
│   │   ├── ScanExperience/   # Scan & download section
│   │   └── Takeaway/         # Closing section
│   ├── hooks/
│   │   └── useQRCode.js      # QR generation & state hook
│   ├── services/
│   │   └── qr/
│   │       ├── qrGenerator.js      # QR code generation service
│   │       ├── moduleClassifier.js # Module classification engine
│   │       └── styledQR.js         # Styled SVG/PNG renderer
│   ├── data/
│   │   └── encodingStages.js # Educational content data
│   ├── App.jsx               # Main application
│   ├── main.jsx              # Entry point
│   └── index.css             # Global styles & design system
├── firebase.json             # Firebase Hosting configuration
├── .firebaserc               # Firebase project association
├── vite.config.js            # Vite configuration
└── package.json
```

## 🎓 Educational Accuracy

The application follows QR Code Model 2 (ISO/IEC 18004) principles:

- **Module Classification** accurately identifies all 8 component types: Finder Patterns, Separators, Timing Patterns, Alignment Patterns, Format Information, Version Information, Data & Error Correction, and the Dark Module
- **Alignment patterns** are correctly shown only for QR versions 2+
- **Version information** is correctly shown only for QR versions 7+
- **Quiet zone** is displayed outside the matrix, not as part of it
- **Error correction** is explained at the codeword level, not the individual module level
- **Masking** is accurately described as applying only to data modules, not functional patterns

## ✅ Features Tested

- [x] QR code generation for text and URLs
- [x] All 4 error correction levels (L, M, Q, H)
- [x] Multiple QR versions (auto-detected based on content)
- [x] Module classification accuracy for finder, separator, timing, alignment, format, version, and data regions
- [x] 3D visualization with InstancedMesh rendering
- [x] Interactive anatomy explorer with region highlighting
- [x] Encoding pipeline stepper with 6 stages
- [x] Error correction damage simulator
- [x] QR code download as PNG and SVG
- [x] Production build (clean, no errors)
- [x] Responsive layout (desktop, tablet, mobile)
- [ ] Smartphone scanning (awaiting physical device testing — QR codes are generated using a standards-compliant library)

## ⚠️ Known Limitations

1. **Large QR versions (20+)**: The 3D explorer may show reduced performance with very large QR codes due to the number of instanced meshes
2. **In-browser scanning**: Not implemented; users scan with their smartphone camera
3. **Error correction experiment**: The damage simulator is a visual simulation; it does not perform real-time Reed-Solomon decoding in the browser
4. **Module-level classification**: Individual data vs error-correction codeword distinction is not shown (they are grouped as "Data & Error Correction" per the QR specification's interleaved placement)

## 🎤 Demo Script (≈ 2:30 minutes)

| Time | Section | What to show |
|------|---------|--------------|
| 0:00 | Hero | "A QR code isn't a random picture. It's an engineered data format." |
| 0:10 | Generator | Type a link, switch error correction from L to H, and watch the code get denser |
| 0:35 | Anatomy | Finder patterns (1:1:3:1:1 ratio), timing pattern, alignment patterns, format information |
| 1:15 | 3D Explorer | Rotate in Skyline mode, then filter to finder patterns only |
| 1:30 | How It Works | Step through the 6 stages: Input → Data Encoding → Error Correction → Structure Placement → Masking → Final Code |
| 2:00 | Error Correction Lab | Draw damage, and explain that it is a visual simulation and that real recovery works on codewords |
| 2:20 | Closing | "Now you see more than squares." |

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.

---

Built for the International Student Hackathon.

**QR LAB** — *Now you see more than squares.*
