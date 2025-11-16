import { useState, useEffect } from 'react';

interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasCamera: boolean;
  hasTouch: boolean;
  supportsVibration: boolean;
  orientation: 'portrait' | 'landscape';
  screenSize: {
    width: number;
    height: number;
  };
}

export function useDevice(): DeviceCapabilities {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    hasCamera: false,
    hasTouch: false,
    supportsVibration: false,
    orientation: 'landscape',
    screenSize: { width: 1024, height: 768 },
  });

  useEffect(() => {
    const updateCapabilities = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Device type detection
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      
      // Orientation detection
      const orientation = height > width ? 'portrait' : 'landscape';
      
      // Touch support detection
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Camera support detection
      const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      
      // Vibration support detection
      const supportsVibration = 'vibrate' in navigator;

      setCapabilities({
        isMobile,
        isTablet,
        isDesktop,
        hasCamera,
        hasTouch,
        supportsVibration,
        orientation,
        screenSize: { width, height },
      });
    };

    // Initial detection
    updateCapabilities();

    // Listen for resize and orientation changes
    window.addEventListener('resize', updateCapabilities);
    window.addEventListener('orientationchange', updateCapabilities);

    return () => {
      window.removeEventListener('resize', updateCapabilities);
      window.removeEventListener('orientationchange', updateCapabilities);
    };
  }, []);

  return capabilities;
}

// Hook for haptic feedback on mobile devices
export function useHapticFeedback() {
  const { supportsVibration } = useDevice();

  const vibrate = (pattern: number | number[] = 50) => {
    if (supportsVibration && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const lightTap = () => vibrate(25);
  const mediumTap = () => vibrate(50);
  const heavyTap = () => vibrate(100);
  const doubleTap = () => vibrate([50, 50, 50]);
  const successTap = () => vibrate([100, 50, 100]);
  const errorTap = () => vibrate([200, 100, 200]);

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    doubleTap,
    successTap,
    errorTap,
    isSupported: supportsVibration,
  };
}