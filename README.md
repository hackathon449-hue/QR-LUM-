# QR LAB — Beyond the Squares

> An interactive educational experience exploring the hidden technology behind every QR code.

![QR LAB](https://img.shields.io/badge/QR_LAB-Beyond_the_Squares-00bcd4?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square)
![Three.js](https://img.shields.io/badge/Three.js-R3F-black?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square)

## 🎯 About

QR LAB is an interactive educational web application that lets visitors explore how QR codes actually work. Instead of just generating QR codes, visitors can:

- **Generate** real, scannable QR codes from any text or URL
- **Explore** the internal anatomy of a QR code with interactive module classification
- **Visualize** QR codes as 3D objects with React Three Fiber
- **Learn** the step-by-step encoding pipeline (data → bits → error correction → masking → final code)
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
# Clone or navigate to the project
cd qr-lab

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

# Create a new Firebase project (or use an existing one)
firebase projects:create qr-lab-hackathon

# Associate this directory with the Firebase project
firebase use qr-lab-hackathon
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
qr-lab/
├── public/                   # Static assets
├── src/
│   ├── components/
│   │   ├── layout/           # Navbar, layout components
│   │   ├── ui/               # Reusable UI components
│   │   ├── qr/               # QR-specific components
│   │   ├── three/            # Three.js components
│   │   └── educational/      # Educational content components
│   ├── sections/
│   │   ├── Hero/             # Landing hero section
│   │   ├── QRGenerator/      # QR code generator
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
│   │       └── moduleClassifier.js # Module classification engine
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
- [x] QR code download as PNG
- [x] Production build (clean, no errors)
- [x] Responsive layout (desktop, tablet, mobile)
- [ ] Smartphone scanning (awaiting physical device testing — QR codes are generated using standards-compliant library)

## ⚠️ Known Limitations

1. **Large QR versions (20+)**: The 3D explorer may show reduced performance with very large QR codes due to the number of instanced meshes
2. **In-browser scanning**: Not implemented; users scan with their smartphone camera
3. **Error correction experiment**: The damage simulator is a visual simulation; it does not perform real-time Reed-Solomon decoding in the browser
4. **Module-level classification**: Individual data vs error-correction codeword distinction is not shown (they are grouped as "Data & Error Correction" per the QR specification's interleaved placement)

## 📄 License

Built for the International Student Hackathon.

---

**QR LAB** — *Now you see more than squares.*
