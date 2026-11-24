import { useState, useCallback, useMemo } from 'react';
import { generateQR, generateQRDataURL } from '../services/qr/qrGenerator';
import { classifyModules } from '../services/qr/moduleClassifier';

/**
 * Custom hook for QR code generation and analysis.
 * Provides reactive QR data that updates on input changes.
 */
export function useQRCode(initialText = '', initialECL = 'M') {
  const [text, setText] = useState(initialText);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState(initialECL);

  const qrData = useMemo(() => {
    if (!text || text.trim().length === 0) return null;
    return generateQR(text, errorCorrectionLevel);
  }, [text, errorCorrectionLevel]);

  const classificationMap = useMemo(() => {
    if (!qrData) return null;
    return classifyModules(qrData.version, qrData.moduleCount);
  }, [qrData]);

  const qrImageURL = useMemo(() => {
    if (!text || text.trim().length === 0) return null;
    return generateQRDataURL(text, errorCorrectionLevel, 10, 4);
  }, [text, errorCorrectionLevel]);

  const updateText = useCallback((newText) => {
    setText(newText);
  }, []);

  const updateECL = useCallback((newECL) => {
    setErrorCorrectionLevel(newECL);
  }, []);

  const reset = useCallback(() => {
    setText('');
    setErrorCorrectionLevel('M');
  }, []);

  return {
    text,
    errorCorrectionLevel,
    qrData,
    classificationMap,
    qrImageURL,
    updateText,
    updateECL,
    reset,
  };
}
