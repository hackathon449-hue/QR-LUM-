import { useQRCode } from './hooks/useQRCode';
import Navbar from './components/layout/Navbar';
import Hero from './sections/Hero';
import QRGenerator from './sections/QRGenerator';
import QRAnatomy from './sections/QRAnatomy';
import ThreeDExplorer from './sections/ThreeDExplorer';
import HowItWorks from './sections/HowItWorks';
import ErrorCorrectionLab from './sections/ErrorCorrectionLab';
import ScanExperience from './sections/ScanExperience';
import Takeaway from './sections/Takeaway';

export default function App() {
  const {
    text,
    errorCorrectionLevel,
    qrData,
    classificationMap,
    qrImageURL,
    updateText,
    updateECL,
    reset,
  } = useQRCode('', 'M');

  return (
    <div className="app">
      <Navbar />

      <Hero />

      <QRGenerator
        text={text}
        errorCorrectionLevel={errorCorrectionLevel}
        qrData={qrData}
        qrImageURL={qrImageURL}
        updateText={updateText}
        updateECL={updateECL}
        reset={reset}
      />

      <QRAnatomy
        qrData={qrData}
        classificationMap={classificationMap}
      />

      <ThreeDExplorer
        qrData={qrData}
        classificationMap={classificationMap}
      />

      <HowItWorks qrData={qrData} />

      <ErrorCorrectionLab
        text={text}
        errorCorrectionLevel={errorCorrectionLevel}
      />

      <ScanExperience
        text={text}
        qrImageURL={qrImageURL}
      />

      <Takeaway />
    </div>
  );
}
