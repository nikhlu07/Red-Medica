import { describe, it, expect, beforeEach } from 'vitest';
import { qrCodeService } from '@/services/qrcode';

describe('QRCodeService', () => {
  const mockProductData = {
    productId: 'TEST-001',
    batchNumber: 'BATCH-2024-001',
    manufacturer: 'Test Pharma Inc',
    productName: 'Test Medicine'
  };

  describe('QR Code Generation', () => {
    it('should generate QR code as data URL', async () => {
      const qrCode = await qrCodeService.generateQRCode(
        mockProductData.productId,
        mockProductData.batchNumber,
        mockProductData.manufacturer
      );

      expect(qrCode).toBeDefined();
      expect(qrCode).toMatch(/^data:image\/png;base64,/);
    });

    it('should generate QR code as SVG', async () => {
      const qrCodeSVG = await qrCodeService.generateQRCodeSVG(
        mockProductData.productId,
        mockProductData.batchNumber,
        mockProductData.manufacturer
      );

      expect(qrCodeSVG).toBeDefined();
      expect(qrCodeSVG).toContain('<svg');
      expect(qrCodeSVG).toContain('</svg>');
    });

    it('should generate QR code with custom options', async () => {
      const qrCode = await qrCodeService.generateQRCode(
        mockProductData.productId,
        mockProductData.batchNumber,
        mockProductData.manufacturer,
        {
          width: 512,
          margin: 4,
          color: { dark: '#FF0000', light: '#FFFFFF' },
          errorCorrectionLevel: 'H'
        }
      );

      expect(qrCode).toBeDefined();
      expect(qrCode).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('Batch QR Code Generation', () => {
    it('should generate multiple QR codes for batch', async () => {
      const quantity = 3;
      const qrCodes = await qrCodeService.generateBatchQRCodes(
        mockProductData.productId,
        mockProductData.batchNumber,
        mockProductData.manufacturer,
        quantity
      );

      expect(qrCodes).toHaveLength(quantity);
      qrCodes.forEach(qrCode => {
        expect(qrCode).toMatch(/^data:image\/png;base64,/);
      });
    });

    it('should generate unique product IDs for each unit', async () => {
      const quantity = 2;
      const qrCodes = await qrCodeService.generateBatchQRCodes(
        mockProductData.productId,
        mockProductData.batchNumber,
        mockProductData.manufacturer,
        quantity
      );

      // Each QR code should be different (unique product IDs)
      expect(qrCodes[0]).not.toBe(qrCodes[1]);
    });
  });

  describe('Printable Labels Generation', () => {
    it('should generate printable labels', async () => {
      const quantity = 2;
      const labels = await qrCodeService.generatePrintableLabels(
        mockProductData.productId,
        mockProductData.batchNumber,
        mockProductData.manufacturer,
        mockProductData.productName,
        quantity
      );

      expect(labels).toHaveLength(quantity);
      labels.forEach(label => {
        expect(label).toContain('<svg');
        expect(label).toContain('</svg>');
        expect(label).toContain(mockProductData.productName);
        expect(label).toContain(mockProductData.batchNumber);
        expect(label).toContain(mockProductData.manufacturer);
      });
    });

    it('should generate labels with custom options', async () => {
      const labels = await qrCodeService.generatePrintableLabels(
        mockProductData.productId,
        mockProductData.batchNumber,
        mockProductData.manufacturer,
        mockProductData.productName,
        1,
        {
          labelWidth: 400,
          labelHeight: 300,
          qrSize: 150,
          fontSize: 14,
          fontFamily: 'Helvetica, sans-serif',
          customText: 'Custom Text',
          backgroundColor: '#F0F0F0',
          textColor: '#333333'
        }
      );

      expect(labels).toHaveLength(1);
      expect(labels[0]).toContain('width="400"');
      expect(labels[0]).toContain('height="300"');
      expect(labels[0]).toContain('Custom Text');
      expect(labels[0]).toContain('fill="#F0F0F0"');
      expect(labels[0]).toContain('fill="#333333"');
    });
  });

  describe('Printer-Specific Labels', () => {
    it('should generate labels for specific printer formats', async () => {
      const labels = await qrCodeService.generatePrinterLabels(
        mockProductData.productId,
        mockProductData.batchNumber,
        mockProductData.manufacturer,
        mockProductData.productName,
        1,
        'avery-5160'
      );

      expect(labels).toHaveLength(1);
      expect(labels[0]).toContain('<svg');
      expect(labels[0]).toContain('width="66.7"'); // Avery 5160 width
      expect(labels[0]).toContain('height="25.4"'); // Avery 5160 height
    });

    it('should get available printer formats', () => {
      const formats = qrCodeService.getAvailablePrinterFormats();
      
      expect(formats).toBeInstanceOf(Array);
      expect(formats.length).toBeGreaterThan(0);
      
      const averyFormat = formats.find(f => f.name === 'Avery 5160');
      expect(averyFormat).toBeDefined();
      expect(averyFormat?.width).toBe(66.7);
      expect(averyFormat?.height).toBe(25.4);
    });
  });

  describe('QR Data Parsing', () => {
    it('should parse QR data from URL', () => {
      const testUrl = 'https://redmedica.network/verify?data=%7B%22id%22%3A%22TEST-001%22%2C%22batch%22%3A%22BATCH-2024-001%22%2C%22mfr%22%3A%22Test%20Pharma%20Inc%22%2C%22ts%22%3A1234567890%7D';
      
      const qrData = qrCodeService.parseQRData(testUrl);
      
      expect(qrData).toBeDefined();
      expect(qrData?.productId).toBe('TEST-001');
      expect(qrData?.batchNumber).toBe('BATCH-2024-001');
      expect(qrData?.manufacturer).toBe('Test Pharma Inc');
      expect(qrData?.timestamp).toBe(1234567890);
    });

    it('should handle invalid URL gracefully', () => {
      const invalidUrl = 'invalid-url';
      
      const qrData = qrCodeService.parseQRData(invalidUrl);
      
      expect(qrData).toBeNull();
    });

    it('should parse simple ID parameter as fallback', () => {
      const simpleUrl = 'https://redmedica.network/verify?id=TEST-001';
      
      const qrData = qrCodeService.parseQRData(simpleUrl);
      
      expect(qrData).toBeDefined();
      expect(qrData?.productId).toBe('TEST-001');
      expect(qrData?.batchNumber).toBe('');
      expect(qrData?.manufacturer).toBe('');
    });
  });

  describe('PDF Generation', () => {
    it('should generate QR codes as PDF', async () => {
      const pdfDataUri = await qrCodeService.generateQRCodesPDF(
        mockProductData.productId,
        mockProductData.batchNumber,
        mockProductData.manufacturer,
        mockProductData.productName,
        2
      );

      expect(pdfDataUri).toBeDefined();
      expect(pdfDataUri).toMatch(/^data:application\/pdf/);
    });

    it('should generate labels as PDF', async () => {
      const pdfDataUri = await qrCodeService.generateLabelsPDF(
        mockProductData.productId,
        mockProductData.batchNumber,
        mockProductData.manufacturer,
        mockProductData.productName,
        2
      );

      expect(pdfDataUri).toBeDefined();
      expect(pdfDataUri).toMatch(/^data:application\/pdf/);
    });
  });
});