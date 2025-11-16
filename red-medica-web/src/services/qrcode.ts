import QRCode from 'qrcode';
import jsPDF from 'jspdf';

export interface QRCodeData {
  productId: string;
  batchNumber: string;
  manufacturer: string;
  verificationUrl: string;
  timestamp: number;
}

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export interface LabelOptions {
  labelWidth?: number;
  labelHeight?: number;
  qrSize?: number;
  fontSize?: number;
  fontFamily?: string;
  includeInstructions?: boolean;
  customText?: string;
  layout?: 'horizontal' | 'vertical' | 'compact';
  borderStyle?: 'solid' | 'dashed' | 'none';
  backgroundColor?: string;
  textColor?: string;
}

export interface PrinterFormat {
  name: string;
  width: number;
  height: number;
  dpi: number;
  description: string;
}

export const PRINTER_FORMATS: Record<string, PrinterFormat> = {
  'avery-5160': {
    name: 'Avery 5160',
    width: 66.7,
    height: 25.4,
    dpi: 300,
    description: 'Standard address labels (1" x 2-5/8")'
  },
  'avery-5163': {
    name: 'Avery 5163',
    width: 101.6,
    height: 33.9,
    dpi: 300,
    description: 'Shipping labels (2" x 4")'
  },
  'avery-5164': {
    name: 'Avery 5164',
    width: 101.6,
    height: 50.8,
    dpi: 300,
    description: 'Shipping labels (3-1/3" x 4")'
  },
  'dymo-30252': {
    name: 'DYMO 30252',
    width: 62,
    height: 29,
    dpi: 300,
    description: 'Address labels (1-1/8" x 3-1/2")'
  },
  'dymo-30323': {
    name: 'DYMO 30323',
    width: 54,
    height: 25,
    dpi: 300,
    description: 'Shipping labels (2-1/8" x 4")'
  },
  'custom': {
    name: 'Custom',
    width: 80,
    height: 50,
    dpi: 300,
    description: 'Custom size label'
  }
};

export interface BatchProgress {
  current: number;
  total: number;
  percentage: number;
}

class QRCodeService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  }

  /**
   * Generate QR code data for a product
   */
  generateQRData(productId: string, batchNumber: string, manufacturer: string): QRCodeData {
    return {
      productId,
      batchNumber,
      manufacturer,
      verificationUrl: `${this.baseUrl}/verify?id=${productId}`,
      timestamp: Date.now(),
    };
  }

  /**
   * Generate QR code as data URL (base64 image)
   */
  async generateQRCode(
    productId: string,
    batchNumber: string,
    manufacturer: string,
    options?: QRCodeOptions
  ): Promise<string> {
    try {
      const qrData = this.generateQRData(productId, batchNumber, manufacturer);
      
      // Create verification URL with embedded data
      const verificationData = {
        id: productId,
        batch: batchNumber,
        mfr: manufacturer,
        ts: qrData.timestamp,
      };
      
      const verificationUrl = `${this.baseUrl}/verify?data=${encodeURIComponent(JSON.stringify(verificationData))}`;

      const qrOptions = {
        width: options?.width || 256,
        margin: options?.margin || 2,
        color: {
          dark: options?.color?.dark || '#000000',
          light: options?.color?.light || '#FFFFFF',
        },
        errorCorrectionLevel: options?.errorCorrectionLevel || 'M' as const,
      };

      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, qrOptions);
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw new Error('QR code generation failed');
    }
  }

  /**
   * Generate QR code as SVG string
   */
  async generateQRCodeSVG(
    productId: string,
    batchNumber: string,
    manufacturer: string,
    options?: QRCodeOptions
  ): Promise<string> {
    try {
      const qrData = this.generateQRData(productId, batchNumber, manufacturer);
      
      const verificationData = {
        id: productId,
        batch: batchNumber,
        mfr: manufacturer,
        ts: qrData.timestamp,
      };
      
      const verificationUrl = `${this.baseUrl}/verify?data=${encodeURIComponent(JSON.stringify(verificationData))}`;

      const qrOptions = {
        width: options?.width || 256,
        margin: options?.margin || 2,
        color: {
          dark: options?.color?.dark || '#000000',
          light: options?.color?.light || '#FFFFFF',
        },
        errorCorrectionLevel: options?.errorCorrectionLevel || 'M' as const,
      };

      const qrCodeSVG = await QRCode.toString(verificationUrl, { 
        ...qrOptions,
        type: 'svg' 
      });
      return qrCodeSVG;
    } catch (error) {
      console.error('Failed to generate QR code SVG:', error);
      throw new Error('QR code SVG generation failed');
    }
  }

  /**
   * Generate multiple QR codes for batch production with progress tracking
   */
  async generateBatchQRCodes(
    productId: string,
    batchNumber: string,
    manufacturer: string,
    quantity: number,
    options?: QRCodeOptions,
    onProgress?: (progress: BatchProgress) => void
  ): Promise<string[]> {
    const qrCodes: string[] = [];
    
    for (let i = 1; i <= quantity; i++) {
      const individualProductId = `${productId}-${i.toString().padStart(6, '0')}`;
      const qrCode = await this.generateQRCode(
        individualProductId,
        batchNumber,
        manufacturer,
        options
      );
      qrCodes.push(qrCode);

      // Report progress
      if (onProgress) {
        const progress: BatchProgress = {
          current: i,
          total: quantity,
          percentage: Math.round((i / quantity) * 100)
        };
        onProgress(progress);
      }
    }
    
    return qrCodes;
  }

  /**
   * Parse QR code data from URL parameters
   */
  parseQRData(url: string): QRCodeData | null {
    try {
      const urlObj = new URL(url);
      const dataParam = urlObj.searchParams.get('data');
      
      if (dataParam) {
        const parsedData = JSON.parse(decodeURIComponent(dataParam));
        return {
          productId: parsedData.id,
          batchNumber: parsedData.batch,
          manufacturer: parsedData.mfr,
          verificationUrl: url,
          timestamp: parsedData.ts,
        };
      }
      
      // Fallback to simple ID parameter
      const id = urlObj.searchParams.get('id');
      if (id) {
        return {
          productId: id,
          batchNumber: '',
          manufacturer: '',
          verificationUrl: url,
          timestamp: Date.now(),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to parse QR data:', error);
      return null;
    }
  }

  /**
   * Generate printable QR code labels with enhanced customization
   */
  async generatePrintableLabels(
    productId: string,
    batchNumber: string,
    manufacturer: string,
    productName: string,
    quantity: number,
    options?: LabelOptions,
    onProgress?: (progress: BatchProgress) => void
  ): Promise<string[]> {
    const labels: string[] = [];
    const labelOptions = {
      labelWidth: options?.labelWidth || 300,
      labelHeight: options?.labelHeight || 200,
      qrSize: options?.qrSize || 120,
      fontSize: options?.fontSize || 12,
      fontFamily: options?.fontFamily || 'Arial, sans-serif',
      includeInstructions: options?.includeInstructions !== false,
      customText: options?.customText || '',
      backgroundColor: options?.backgroundColor || 'white',
      textColor: options?.textColor || '#333',
    };

    for (let i = 1; i <= quantity; i++) {
      const individualProductId = `${productId}-${i.toString().padStart(6, '0')}`;
      const qrCodeSVG = await this.generateQRCodeSVG(
        individualProductId,
        batchNumber,
        manufacturer,
        { width: labelOptions.qrSize }
      );

      // Create label SVG with QR code and text
      const labelSVG = `
        <svg width="${labelOptions.labelWidth}" height="${labelOptions.labelHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${labelOptions.backgroundColor}" stroke="#ccc" stroke-width="1"/>
          
          <!-- QR Code -->
          <g transform="translate(10, 10)">
            ${qrCodeSVG.replace('<svg', '<svg width="' + labelOptions.qrSize + '" height="' + labelOptions.qrSize + '"')}
          </g>
          
          <!-- Product Information -->
          <text x="${labelOptions.qrSize + 20}" y="25" font-family="${labelOptions.fontFamily}" font-size="${labelOptions.fontSize}" font-weight="bold" fill="${labelOptions.textColor}">
            ${productName}
          </text>
          <text x="${labelOptions.qrSize + 20}" y="45" font-family="${labelOptions.fontFamily}" font-size="${labelOptions.fontSize - 2}" fill="#666">
            ID: ${individualProductId}
          </text>
          <text x="${labelOptions.qrSize + 20}" y="65" font-family="${labelOptions.fontFamily}" font-size="${labelOptions.fontSize - 2}" fill="#666">
            Batch: ${batchNumber}
          </text>
          <text x="${labelOptions.qrSize + 20}" y="85" font-family="${labelOptions.fontFamily}" font-size="${labelOptions.fontSize - 2}" fill="#666">
            Mfr: ${manufacturer}
          </text>
          
          ${labelOptions.customText ? `
          <text x="${labelOptions.qrSize + 20}" y="105" font-family="${labelOptions.fontFamily}" font-size="${labelOptions.fontSize - 2}" fill="#666">
            ${labelOptions.customText}
          </text>
          ` : ''}
          
          ${labelOptions.includeInstructions ? `
          <!-- Verification Instructions -->
          <text x="10" y="${labelOptions.labelHeight - 30}" font-family="${labelOptions.fontFamily}" font-size="${labelOptions.fontSize - 3}" fill="#999">
            Scan QR code to verify authenticity
          </text>
          <text x="10" y="${labelOptions.labelHeight - 15}" font-family="${labelOptions.fontFamily}" font-size="${labelOptions.fontSize - 3}" fill="#999">
            redmedica.network/verify
          </text>
          ` : ''}
        </svg>
      `;

      labels.push(labelSVG);

      // Report progress
      if (onProgress) {
        const progress: BatchProgress = {
          current: i,
          total: quantity,
          percentage: Math.round((i / quantity) * 100)
        };
        onProgress(progress);
      }
    }

    return labels;
  }

  /**
   * Download QR code as image file
   */
  downloadQRCode(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Generate QR codes as PDF document
   */
  async generateQRCodesPDF(
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
  ): Promise<string> {
    const pdfOptions = {
      qrSize: options?.qrSize || 80,
      codesPerPage: options?.codesPerPage || 12,
      pageFormat: options?.pageFormat || 'a4',
      includeLabels: options?.includeLabels || true,
    };

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: pdfOptions.pageFormat,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const codesPerRow = Math.floor(Math.sqrt(pdfOptions.codesPerPage));
    const codeWidth = (pageWidth - margin * 2) / codesPerRow;
    const codeHeight = pdfOptions.includeLabels ? codeWidth * 1.5 : codeWidth;

    let currentPage = 1;
    let currentRow = 0;
    let currentCol = 0;

    for (let i = 1; i <= quantity; i++) {
      const individualProductId = `${productId}-${i.toString().padStart(6, '0')}`;
      
      // Generate QR code as data URL
      const qrCodeDataUrl = await this.generateQRCode(
        individualProductId,
        batchNumber,
        manufacturer,
        { width: pdfOptions.qrSize * 4 } // Higher resolution for PDF
      );

      // Calculate position
      const x = margin + currentCol * codeWidth;
      const y = margin + currentRow * codeHeight;

      // Add QR code to PDF
      pdf.addImage(qrCodeDataUrl, 'PNG', x, y, pdfOptions.qrSize, pdfOptions.qrSize);

      if (pdfOptions.includeLabels) {
        // Add product information
        pdf.setFontSize(8);
        pdf.text(productName, x, y + pdfOptions.qrSize + 5);
        pdf.setFontSize(6);
        pdf.text(`ID: ${individualProductId}`, x, y + pdfOptions.qrSize + 10);
        pdf.text(`Batch: ${batchNumber}`, x, y + pdfOptions.qrSize + 15);
        pdf.text(`Mfr: ${manufacturer}`, x, y + pdfOptions.qrSize + 20);
      }

      // Move to next position
      currentCol++;
      if (currentCol >= codesPerRow) {
        currentCol = 0;
        currentRow++;
        
        // Check if we need a new page
        if (currentRow * codeHeight + margin > pageHeight - margin) {
          if (i < quantity) {
            pdf.addPage();
            currentPage++;
            currentRow = 0;
          }
        }
      }
    }

    return pdf.output('datauristring');
  }

  /**
   * Generate printable labels as PDF
   */
  async generateLabelsPDF(
    productId: string,
    batchNumber: string,
    manufacturer: string,
    productName: string,
    quantity: number,
    options?: LabelOptions & {
      labelsPerPage?: number;
      pageFormat?: 'a4' | 'letter';
    }
  ): Promise<string> {
    const pdfOptions = {
      labelWidth: options?.labelWidth || 80,
      labelHeight: options?.labelHeight || 50,
      qrSize: options?.qrSize || 30,
      fontSize: options?.fontSize || 8,
      labelsPerPage: options?.labelsPerPage || 8,
      pageFormat: options?.pageFormat || 'a4',
    };

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: pdfOptions.pageFormat,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const labelsPerRow = Math.floor((pageWidth - margin * 2) / pdfOptions.labelWidth);
    const labelsPerCol = Math.floor((pageHeight - margin * 2) / pdfOptions.labelHeight);
    const labelsPerPageActual = Math.min(pdfOptions.labelsPerPage, labelsPerRow * labelsPerCol);

    let currentPage = 1;
    let labelCount = 0;

    for (let i = 1; i <= quantity; i++) {
      const individualProductId = `${productId}-${i.toString().padStart(6, '0')}`;
      
      // Generate QR code
      const qrCodeDataUrl = await this.generateQRCode(
        individualProductId,
        batchNumber,
        manufacturer,
        { width: pdfOptions.qrSize * 4 }
      );

      // Calculate position
      const row = Math.floor(labelCount / labelsPerRow);
      const col = labelCount % labelsPerRow;
      const x = margin + col * pdfOptions.labelWidth;
      const y = margin + row * pdfOptions.labelHeight;

      // Draw label border
      pdf.rect(x, y, pdfOptions.labelWidth, pdfOptions.labelHeight);

      // Add QR code
      pdf.addImage(qrCodeDataUrl, 'PNG', x + 2, y + 2, pdfOptions.qrSize, pdfOptions.qrSize);

      // Add text information
      pdf.setFontSize(pdfOptions.fontSize);
      pdf.text(productName, x + pdfOptions.qrSize + 5, y + 8);
      pdf.setFontSize(pdfOptions.fontSize - 1);
      pdf.text(`ID: ${individualProductId}`, x + pdfOptions.qrSize + 5, y + 15);
      pdf.text(`Batch: ${batchNumber}`, x + pdfOptions.qrSize + 5, y + 22);
      pdf.text(`Mfr: ${manufacturer}`, x + pdfOptions.qrSize + 5, y + 29);

      labelCount++;

      // Check if we need a new page
      if (labelCount >= labelsPerPageActual && i < quantity) {
        pdf.addPage();
        currentPage++;
        labelCount = 0;
      }
    }

    return pdf.output('datauristring');
  }

  /**
   * Download multiple QR codes as ZIP file or PDF
   */
  async downloadBatchQRCodes(
    qrCodes: string[],
    batchNumber: string,
    format: 'individual' | 'pdf' = 'individual'
  ): Promise<void> {
    if (format === 'pdf') {
      // Generate PDF with all QR codes
      // This would need additional parameters, for now just download individually
      qrCodes.forEach((qrCode, index) => {
        const filename = `${batchNumber}-qr-${(index + 1).toString().padStart(6, '0')}.png`;
        this.downloadQRCode(qrCode, filename);
      });
    } else {
      // Download individually
      qrCodes.forEach((qrCode, index) => {
        const filename = `${batchNumber}-qr-${(index + 1).toString().padStart(6, '0')}.png`;
        this.downloadQRCode(qrCode, filename);
      });
    }
  }

  /**
   * Generate labels for specific printer formats
   */
  async generatePrinterLabels(
    productId: string,
    batchNumber: string,
    manufacturer: string,
    productName: string,
    quantity: number,
    printerFormat: string = 'custom',
    options?: LabelOptions,
    onProgress?: (progress: BatchProgress) => void
  ): Promise<string[]> {
    const format = PRINTER_FORMATS[printerFormat] || PRINTER_FORMATS.custom;
    
    const labelOptions: LabelOptions = {
      labelWidth: format.width,
      labelHeight: format.height,
      qrSize: Math.min(format.width * 0.4, format.height * 0.6),
      fontSize: Math.max(6, format.height * 0.15),
      layout: options?.layout || (format.width > format.height ? 'horizontal' : 'vertical'),
      borderStyle: options?.borderStyle || 'solid',
      backgroundColor: options?.backgroundColor || 'white',
      textColor: options?.textColor || '#333',
      fontFamily: options?.fontFamily || 'Arial, sans-serif',
      includeInstructions: options?.includeInstructions !== false,
      customText: options?.customText || '',
    };

    const labels: string[] = [];

    for (let i = 1; i <= quantity; i++) {
      const individualProductId = `${productId}-${i.toString().padStart(6, '0')}`;
      const qrCodeSVG = await this.generateQRCodeSVG(
        individualProductId,
        batchNumber,
        manufacturer,
        { width: labelOptions.qrSize! * 4 }
      );

      let labelSVG: string;

      if (labelOptions.layout === 'horizontal') {
        labelSVG = this.generateHorizontalLabel(
          individualProductId,
          batchNumber,
          manufacturer,
          productName,
          qrCodeSVG,
          labelOptions
        );
      } else if (labelOptions.layout === 'vertical') {
        labelSVG = this.generateVerticalLabel(
          individualProductId,
          batchNumber,
          manufacturer,
          productName,
          qrCodeSVG,
          labelOptions
        );
      } else {
        labelSVG = this.generateCompactLabel(
          individualProductId,
          batchNumber,
          manufacturer,
          productName,
          qrCodeSVG,
          labelOptions
        );
      }

      labels.push(labelSVG);

      // Report progress
      if (onProgress) {
        const progress: BatchProgress = {
          current: i,
          total: quantity,
          percentage: Math.round((i / quantity) * 100)
        };
        onProgress(progress);
      }
    }

    return labels;
  }

  /**
   * Generate horizontal layout label
   */
  private generateHorizontalLabel(
    productId: string,
    batchNumber: string,
    manufacturer: string,
    productName: string,
    qrCodeSVG: string,
    options: LabelOptions
  ): string {
    const borderStroke = options.borderStyle === 'none' ? 'none' : 
                       options.borderStyle === 'dashed' ? 'stroke-dasharray="2,2"' : '';
    
    return `
      <svg width="${options.labelWidth}" height="${options.labelHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${options.backgroundColor}" 
              stroke="#ccc" stroke-width="0.5" ${borderStroke}/>
        
        <!-- QR Code -->
        <g transform="translate(2, ${(options.labelHeight! - options.qrSize!) / 2})">
          ${qrCodeSVG.replace('<svg', `<svg width="${options.qrSize}" height="${options.qrSize}"`)}
        </g>
        
        <!-- Product Information -->
        <text x="${options.qrSize! + 4}" y="${options.labelHeight! * 0.25}" 
              font-family="${options.fontFamily}" font-size="${options.fontSize}" 
              font-weight="bold" fill="${options.textColor}">
          ${productName.length > 20 ? productName.substring(0, 20) + '...' : productName}
        </text>
        <text x="${options.qrSize! + 4}" y="${options.labelHeight! * 0.45}" 
              font-family="${options.fontFamily}" font-size="${options.fontSize! * 0.8}" 
              fill="${options.textColor}">
          ID: ${productId}
        </text>
        <text x="${options.qrSize! + 4}" y="${options.labelHeight! * 0.65}" 
              font-family="${options.fontFamily}" font-size="${options.fontSize! * 0.8}" 
              fill="${options.textColor}">
          Batch: ${batchNumber}
        </text>
        <text x="${options.qrSize! + 4}" y="${options.labelHeight! * 0.85}" 
              font-family="${options.fontFamily}" font-size="${options.fontSize! * 0.7}" 
              fill="${options.textColor}">
          ${manufacturer.length > 15 ? manufacturer.substring(0, 15) + '...' : manufacturer}
        </text>
      </svg>
    `;
  }

  /**
   * Generate vertical layout label
   */
  private generateVerticalLabel(
    productId: string,
    batchNumber: string,
    manufacturer: string,
    productName: string,
    qrCodeSVG: string,
    options: LabelOptions
  ): string {
    const borderStroke = options.borderStyle === 'none' ? 'none' : 
                       options.borderStyle === 'dashed' ? 'stroke-dasharray="2,2"' : '';
    
    return `
      <svg width="${options.labelWidth}" height="${options.labelHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${options.backgroundColor}" 
              stroke="#ccc" stroke-width="0.5" ${borderStroke}/>
        
        <!-- QR Code -->
        <g transform="translate(${(options.labelWidth! - options.qrSize!) / 2}, 2)">
          ${qrCodeSVG.replace('<svg', `<svg width="${options.qrSize}" height="${options.qrSize}"`)}
        </g>
        
        <!-- Product Information -->
        <text x="${options.labelWidth! / 2}" y="${options.qrSize! + 8}" 
              font-family="${options.fontFamily}" font-size="${options.fontSize}" 
              font-weight="bold" fill="${options.textColor}" text-anchor="middle">
          ${productName.length > 12 ? productName.substring(0, 12) + '...' : productName}
        </text>
        <text x="${options.labelWidth! / 2}" y="${options.qrSize! + 18}" 
              font-family="${options.fontFamily}" font-size="${options.fontSize! * 0.8}" 
              fill="${options.textColor}" text-anchor="middle">
          ${productId}
        </text>
        <text x="${options.labelWidth! / 2}" y="${options.qrSize! + 28}" 
              font-family="${options.fontFamily}" font-size="${options.fontSize! * 0.7}" 
              fill="${options.textColor}" text-anchor="middle">
          ${batchNumber}
        </text>
      </svg>
    `;
  }

  /**
   * Generate compact layout label
   */
  private generateCompactLabel(
    productId: string,
    batchNumber: string,
    manufacturer: string,
    productName: string,
    qrCodeSVG: string,
    options: LabelOptions
  ): string {
    const borderStroke = options.borderStyle === 'none' ? 'none' : 
                       options.borderStyle === 'dashed' ? 'stroke-dasharray="2,2"' : '';
    
    return `
      <svg width="${options.labelWidth}" height="${options.labelHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${options.backgroundColor}" 
              stroke="#ccc" stroke-width="0.5" ${borderStroke}/>
        
        <!-- QR Code -->
        <g transform="translate(2, 2)">
          ${qrCodeSVG.replace('<svg', `<svg width="${options.qrSize! * 0.8}" height="${options.qrSize! * 0.8}"`)}
        </g>
        
        <!-- Product Information -->
        <text x="${options.qrSize! * 0.8 + 4}" y="10" 
              font-family="${options.fontFamily}" font-size="${options.fontSize! * 0.9}" 
              font-weight="bold" fill="${options.textColor}">
          ${productName.length > 10 ? productName.substring(0, 10) + '...' : productName}
        </text>
        <text x="${options.qrSize! * 0.8 + 4}" y="20" 
              font-family="${options.fontFamily}" font-size="${options.fontSize! * 0.7}" 
              fill="${options.textColor}">
          ${productId.length > 12 ? productId.substring(0, 12) + '...' : productId}
        </text>
        <text x="${options.qrSize! * 0.8 + 4}" y="30" 
              font-family="${options.fontFamily}" font-size="${options.fontSize! * 0.6}" 
              fill="${options.textColor}">
          ${batchNumber}
        </text>
      </svg>
    `;
  }

  /**
   * Get available printer formats
   */
  getAvailablePrinterFormats(): PrinterFormat[] {
    return Object.values(PRINTER_FORMATS);
  }

  /**
   * Download PDF document
   */
  downloadPDF(pdfDataUri: string, filename: string): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = pdfDataUri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Export singleton instance
export const qrCodeService = new QRCodeService();
export default qrCodeService;