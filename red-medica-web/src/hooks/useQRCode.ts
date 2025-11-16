import { useState, useCallback } from 'react';
import { qrCodeService, type QRCodeData, type QRCodeOptions, type LabelOptions, type BatchProgress, type PrinterFormat } from '@/services/qrcode';
import { useAppStore } from '@/lib/store';

export interface QRCodeState {
  isGenerating: boolean;
  isScanning: boolean;
  error: string | null;
}

export const useQRCode = () => {
  const [state, setState] = useState<QRCodeState>({
    isGenerating: false,
    isScanning: false,
    error: null,
  });

  const { addNotification } = useAppStore();

  // Generate QR code for a product
  const generateQRCode = useCallback(async (
    productId: string,
    batchNumber: string,
    manufacturer: string,
    options?: QRCodeOptions
  ): Promise<string | null> => {
    try {
      setState(prev => ({ ...prev, isGenerating: true, error: null }));

      const qrCodeDataUrl = await qrCodeService.generateQRCode(
        productId,
        batchNumber,
        manufacturer,
        options
      );

      setState(prev => ({ ...prev, isGenerating: false }));

      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'QR Code Generated',
        message: `QR code created for product ${productId}`,
      });

      return qrCodeDataUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate QR code';
      setState(prev => ({ ...prev, isGenerating: false, error: errorMessage }));
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'QR Generation Failed',
        message: errorMessage,
      });

      return null;
    }
  }, [addNotification]);

  // Generate QR code as SVG
  const generateQRCodeSVG = useCallback(async (
    productId: string,
    batchNumber: string,
    manufacturer: string,
    options?: QRCodeOptions
  ): Promise<string | null> => {
    try {
      setState(prev => ({ ...prev, isGenerating: true, error: null }));

      const qrCodeSVG = await qrCodeService.generateQRCodeSVG(
        productId,
        batchNumber,
        manufacturer,
        options
      );

      setState(prev => ({ ...prev, isGenerating: false }));
      return qrCodeSVG;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate QR code SVG';
      setState(prev => ({ ...prev, isGenerating: false, error: errorMessage }));
      return null;
    }
  }, []);

  // Generate batch QR codes
  const generateBatchQRCodes = useCallback(async (
    productId: string,
    batchNumber: string,
    manufacturer: string,
    quantity: number,
    options?: QRCodeOptions,
    onProgress?: (progress: BatchProgress) => void
  ): Promise<string[]> => {
    try {
      setState(prev => ({ ...prev, isGenerating: true, error: null }));

      const qrCodes = await qrCodeService.generateBatchQRCodes(
        productId,
        batchNumber,
        manufacturer,
        quantity,
        options,
        onProgress
      );

      setState(prev => ({ ...prev, isGenerating: false }));

      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Batch QR Codes Generated',
        message: `Generated ${quantity} QR codes for batch ${batchNumber}`,
      });

      return qrCodes;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate batch QR codes';
      setState(prev => ({ ...prev, isGenerating: false, error: errorMessage }));
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Batch Generation Failed',
        message: errorMessage,
      });

      return [];
    }
  }, [addNotification]);

  // Generate printable labels
  const generatePrintableLabels = useCallback(async (
    productId: string,
    batchNumber: string,
    manufacturer: string,
    productName: string,
    quantity: number,
    options?: LabelOptions,
    onProgress?: (progress: BatchProgress) => void
  ): Promise<string[]> => {
    try {
      setState(prev => ({ ...prev, isGenerating: true, error: null }));

      const labels = await qrCodeService.generatePrintableLabels(
        productId,
        batchNumber,
        manufacturer,
        productName,
        quantity,
        options,
        onProgress
      );

      setState(prev => ({ ...prev, isGenerating: false }));

      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Labels Generated',
        message: `Generated ${quantity} printable labels`,
      });

      return labels;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate labels';
      setState(prev => ({ ...prev, isGenerating: false, error: errorMessage }));
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Label Generation Failed',
        message: errorMessage,
      });

      return [];
    }
  }, [addNotification]);

  // Parse QR code data
  const parseQRData = useCallback((url: string): QRCodeData | null => {
    try {
      return qrCodeService.parseQRData(url);
    } catch (error) {
      console.error('Failed to parse QR data:', error);
      return null;
    }
  }, []);

  // Download QR code
  const downloadQRCode = useCallback((dataUrl: string, filename: string) => {
    try {
      qrCodeService.downloadQRCode(dataUrl, filename);
      
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Download Started',
        message: `Downloading ${filename}`,
      });
    } catch (error) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Download Failed',
        message: 'Failed to download QR code',
      });
    }
  }, [addNotification]);

  // Generate QR codes as PDF
  const generateQRCodesPDF = useCallback(async (
    productId: string,
    batchNumber: string,
    manufacturer: string,
    productName: string,
    quantity: number,
    options?: {
      qrSize?: number;
      codesPerPage?: number;
      pageFormat?: 'a4' | 'letter';
      includeLabels?: boolean;
    }
  ): Promise<string | null> => {
    try {
      setState(prev => ({ ...prev, isGenerating: true, error: null }));

      const pdfDataUri = await qrCodeService.generateQRCodesPDF(
        productId,
        batchNumber,
        manufacturer,
        productName,
        quantity,
        options
      );

      setState(prev => ({ ...prev, isGenerating: false }));

      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'PDF Generated',
        message: `Generated PDF with ${quantity} QR codes`,
      });

      return pdfDataUri;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';
      setState(prev => ({ ...prev, isGenerating: false, error: errorMessage }));
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'PDF Generation Failed',
        message: errorMessage,
      });

      return null;
    }
  }, [addNotification]);

  // Generate labels as PDF
  const generateLabelsPDF = useCallback(async (
    productId: string,
    batchNumber: string,
    manufacturer: string,
    productName: string,
    quantity: number,
    options?: LabelOptions & {
      labelsPerPage?: number;
      pageFormat?: 'a4' | 'letter';
    }
  ): Promise<string | null> => {
    try {
      setState(prev => ({ ...prev, isGenerating: true, error: null }));

      const pdfDataUri = await qrCodeService.generateLabelsPDF(
        productId,
        batchNumber,
        manufacturer,
        productName,
        quantity,
        options
      );

      setState(prev => ({ ...prev, isGenerating: false }));

      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Labels PDF Generated',
        message: `Generated PDF with ${quantity} labels`,
      });

      return pdfDataUri;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate labels PDF';
      setState(prev => ({ ...prev, isGenerating: false, error: errorMessage }));
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Labels PDF Generation Failed',
        message: errorMessage,
      });

      return null;
    }
  }, [addNotification]);

  // Download PDF
  const downloadPDF = useCallback((pdfDataUri: string, filename: string) => {
    try {
      qrCodeService.downloadPDF(pdfDataUri, filename);
      
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'PDF Download Started',
        message: `Downloading ${filename}`,
      });
    } catch (error) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'PDF Download Failed',
        message: 'Failed to download PDF',
      });
    }
  }, [addNotification]);

  // Download batch QR codes
  const downloadBatchQRCodes = useCallback(async (
    qrCodes: string[],
    batchNumber: string,
    format: 'individual' | 'pdf' = 'individual'
  ) => {
    try {
      await qrCodeService.downloadBatchQRCodes(qrCodes, batchNumber, format);
      
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Batch Download Started',
        message: `Downloading ${qrCodes.length} QR codes`,
      });
    } catch (error) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Batch Download Failed',
        message: 'Failed to download batch QR codes',
      });
    }
  }, [addNotification]);

  // Handle QR scan result
  const handleScanResult = useCallback((data: string): QRCodeData | null => {
    try {
      setState(prev => ({ ...prev, isScanning: false }));
      
      const qrData = parseQRData(data);
      
      if (qrData) {
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'QR Code Scanned',
          message: `Product ID: ${qrData.productId}`,
        });
      } else {
        addNotification({
          id: Date.now().toString(),
          type: 'warning',
          title: 'Invalid QR Code',
          message: 'The scanned QR code is not a valid Red Médica product code',
        });
      }

      return qrData;
    } catch (error) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Scan Error',
        message: 'Failed to process scanned QR code',
      });
      return null;
    }
  }, [addNotification, parseQRData]);

  // Handle scan error
  const handleScanError = useCallback((error: string) => {
    setState(prev => ({ ...prev, isScanning: false, error }));
    
    addNotification({
      id: Date.now().toString(),
      type: 'error',
      title: 'Scan Failed',
      message: error,
    });
  }, [addNotification]);

  // Start scanning
  const startScanning = useCallback(() => {
    setState(prev => ({ ...prev, isScanning: true, error: null }));
  }, []);

  // Stop scanning
  const stopScanning = useCallback(() => {
    setState(prev => ({ ...prev, isScanning: false }));
  }, []);

  // Generate printer-specific labels
  const generatePrinterLabels = useCallback(async (
    productId: string,
    batchNumber: string,
    manufacturer: string,
    productName: string,
    quantity: number,
    printerFormat: string = 'custom',
    options?: LabelOptions,
    onProgress?: (progress: BatchProgress) => void
  ): Promise<string[]> => {
    try {
      setState(prev => ({ ...prev, isGenerating: true, error: null }));

      const labels = await qrCodeService.generatePrinterLabels(
        productId,
        batchNumber,
        manufacturer,
        productName,
        quantity,
        printerFormat,
        options,
        onProgress
      );

      setState(prev => ({ ...prev, isGenerating: false }));

      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Printer Labels Generated',
        message: `Generated ${quantity} labels for ${printerFormat}`,
      });

      return labels;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate printer labels';
      setState(prev => ({ ...prev, isGenerating: false, error: errorMessage }));
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Printer Labels Generation Failed',
        message: errorMessage,
      });

      return [];
    }
  }, [addNotification]);

  // Get available printer formats
  const getAvailablePrinterFormats = useCallback((): PrinterFormat[] => {
    return qrCodeService.getAvailablePrinterFormats();
  }, []);

  return {
    ...state,
    generateQRCode,
    generateQRCodeSVG,
    generateBatchQRCodes,
    generatePrintableLabels,
    generatePrinterLabels,
    generateQRCodesPDF,
    generateLabelsPDF,
    getAvailablePrinterFormats,
    parseQRData,
    downloadQRCode,
    downloadPDF,
    downloadBatchQRCodes,
    handleScanResult,
    handleScanError,
    startScanning,
    stopScanning,
  };
};