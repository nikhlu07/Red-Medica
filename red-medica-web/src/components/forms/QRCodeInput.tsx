import React, { useState, useRef } from 'react';
import { QrCode, Camera, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QRCodeValidator } from '../../utils/validation';
import ValidatedInput from './ValidatedInput';

interface QRCodeInputProps {
  label?: string;
  value?: string;
  onChange?: (value: string, productId?: number) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  placeholder?: string;
  helperText?: string;
  showScanner?: boolean;
  showFileUpload?: boolean;
  className?: string;
  disabled?: boolean;
}

export const QRCodeInput: React.FC<QRCodeInputProps> = ({
  label = 'Product QR Code',
  value = '',
  onChange,
  onValidationChange,
  placeholder = 'Scan QR code, upload image, or enter product ID manually',
  helperText = 'You can scan a QR code, upload an image, or manually enter the product ID',
  showScanner = true,
  showFileUpload = true,
  className,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; error?: string }>({ isValid: true });
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const validateQRCode = (qrData: string) => {
    if (!qrData.trim()) {
      setValidationResult({ isValid: true });
      onValidationChange?.(true);
      return;
    }

    const result = QRCodeValidator.validateQRData(qrData);
    setValidationResult(result);
    onValidationChange?.(result.isValid, result.firstError);

    if (result.isValid) {
      const productId = QRCodeValidator.extractProductId(qrData);
      onChange?.(qrData, productId || undefined);
    }
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    validateQRCode(newValue);
  };

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setScanError('');

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer back camera
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
      setScanError(error instanceof Error ? error.message : 'Failed to access camera');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setScanError('');
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    // Convert to blob and process
    canvas.toBlob((blob) => {
      if (blob) {
        processQRImage(blob);
      }
    }, 'image/jpeg', 0.8);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processQRImage(file);
    }
  };

  const processQRImage = async (imageFile: Blob) => {
    try {
      // For now, we'll simulate QR code processing
      // In a real implementation, you would use a QR code library like jsQR
      
      // Create a temporary URL for the image
      const imageUrl = URL.createObjectURL(imageFile);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll extract a mock product ID
      // In reality, you'd use a QR code detection library
      const mockProductId = Math.floor(Math.random() * 1000) + 1;
      const mockQRData = `https://redmedica.com/verify?productId=${mockProductId}&batch=BATCH${mockProductId}`;
      
      setInputValue(mockQRData);
      validateQRCode(mockQRData);
      
      // Clean up
      URL.revokeObjectURL(imageUrl);
      stopScanning();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to process QR image:', error);
      setScanError('Failed to read QR code from image');
    }
  };

  const clearInput = () => {
    setInputValue('');
    setValidationResult({ isValid: true });
    onChange?.('');
    onValidationChange?.(true);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <ValidatedInput
        label={label}
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        helperText={!validationResult.isValid ? undefined : helperText}
        error={validationResult.error}
        disabled={disabled}
        leftIcon={<QrCode className="w-4 h-4" />}
        rightIcon={
          inputValue && (
            <button
              type="button"
              onClick={clearInput}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </button>
          )
        }
      />

      {/* Action Buttons */}
      <div className="flex gap-2">
        {showScanner && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={isScanning ? stopScanning : startScanning}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            {isScanning ? 'Stop Scanning' : 'Scan QR Code'}
          </Button>
        )}

        {showFileUpload && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </>
        )}
      </div>

      {/* Camera Scanner */}
      {isScanning && (
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-64 object-cover"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Scanner Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
              <span className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                Position QR code here
              </span>
            </div>
          </div>

          {/* Capture Button */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <Button
              type="button"
              onClick={captureFrame}
              className="bg-white text-black hover:bg-gray-100"
              size="sm"
            >
              Capture
            </Button>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={stopScanning}
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scan Error */}
      {scanError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
          <AlertCircle className="w-4 h-4" />
          {scanError}
        </div>
      )}

      {/* Validation Success */}
      {validationResult.isValid && inputValue && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md">
          <CheckCircle className="w-4 h-4" />
          QR code is valid
          {(() => {
            const productId = QRCodeValidator.extractProductId(inputValue);
            return productId ? ` - Product ID: ${productId}` : '';
          })()}
        </div>
      )}
    </div>
  );
};

export default QRCodeInput;