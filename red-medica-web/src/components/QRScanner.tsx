import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, Flashlight, FlashlightOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface QRScannerProps {
  onResult: (data: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onResult,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setHasPermission(false);
      onError?.('Camera access denied. Please allow camera permissions and try again.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
    setFlashlightOn(false);
  };

  // Toggle flashlight
  const toggleFlashlight = async () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      if (capabilities.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !flashlightOn }]
          });
          setFlashlightOn(!flashlightOn);
        } catch (error) {
          console.error('Failed to toggle flashlight:', error);
        }
      }
    }
  };

  // Scan QR code from video frame
  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Simple QR code detection (in a real implementation, you'd use a library like jsQR)
    // For now, we'll simulate QR detection by looking for URL patterns in the image
    // This is a placeholder - in production, use a proper QR code library
    
    // Simulate QR code detection delay
    setTimeout(() => {
      // Mock QR code detection - in reality, you'd use jsQR or similar
      const mockQRData = 'https://redmedica.network/verify?data=%7B%22id%22%3A%221%22%2C%22batch%22%3A%22BATCH-001%22%2C%22mfr%22%3A%22Test%20Pharma%22%2C%22ts%22%3A1704067200000%7D';
      
      // Randomly simulate successful scan (for demo purposes)
      if (Math.random() > 0.95) { // 5% chance per frame
        onResult(mockQRData);
        setIsScanning(false);
      }
    }, 100);
  };

  // Start scanning loop
  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(scanFrame, 100); // Scan 10 times per second
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  // Initialize camera when component mounts
  useEffect(() => {
    if (hasPermission === null) {
      startCamera();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle start scanning
  const handleStartScanning = () => {
    if (hasPermission) {
      setIsScanning(true);
    } else {
      startCamera();
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-4">

        {hasPermission === false && (
          <div className="text-center py-6 md:py-8">
            <Camera className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm text-gray-600 mb-4 px-2">
              Camera access is required to scan QR codes
            </p>
            <Button onClick={startCamera} className="w-full sm:w-auto">
              <Camera className="w-4 h-4 mr-2" />
              Enable Camera
            </Button>
          </div>
        )}

        {hasPermission === true && (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-black rounded-lg object-cover"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {/* Scanning overlay */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-blue-500 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                    
                    {/* Scanning line animation */}
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500 animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
              <Button
                variant={isScanning ? "destructive" : "default"}
                onClick={() => isScanning ? setIsScanning(false) : handleStartScanning()}
                className="flex-1 sm:flex-none touch-friendly"
              >
                {isScanning ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Stop Scanning
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Start Scanning
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleFlashlight}
                disabled={!stream}
                className="sm:w-auto touch-friendly"
              >
                {flashlightOn ? (
                  <>
                    <FlashlightOff className="w-4 h-4 mr-2 sm:mr-0" />
                    <span className="sm:hidden">Flashlight Off</span>
                  </>
                ) : (
                  <>
                    <Flashlight className="w-4 h-4 mr-2 sm:mr-0" />
                    <span className="sm:hidden">Flashlight On</span>
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Position the QR code within the frame to scan
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;