import { useRef, useEffect, RefObject } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOptions {
  threshold?: number; // Minimum distance for swipe
  preventDefaultTouchmoveEvent?: boolean;
  trackMouse?: boolean; // Also track mouse events
}

export function useSwipe<T extends HTMLElement>(
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
): RefObject<T> {
  const {
    threshold = 50,
    preventDefaultTouchmoveEvent = false,
    trackMouse = false,
  } = options;

  const elementRef = useRef<T>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleStart = (clientX: number, clientY: number) => {
      startPos.current = { x: clientX, y: clientY };
    };

    const handleEnd = (clientX: number, clientY: number) => {
      if (!startPos.current) return;

      const deltaX = clientX - startPos.current.x;
      const deltaY = clientY - startPos.current.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Determine if this is a valid swipe
      if (Math.max(absDeltaX, absDeltaY) < threshold) {
        startPos.current = null;
        return;
      }

      // Determine swipe direction
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }

      startPos.current = null;
    };

    // Touch events
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      handleEnd(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventDefaultTouchmoveEvent) {
        e.preventDefault();
      }
    };

    // Mouse events (if enabled)
    const handleMouseDown = (e: MouseEvent) => {
      handleStart(e.clientX, e.clientY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      handleEnd(e.clientX, e.clientY);
    };

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    if (preventDefaultTouchmoveEvent) {
      element.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    // Add mouse event listeners if enabled
    if (trackMouse) {
      element.addEventListener('mousedown', handleMouseDown);
      element.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
      
      if (trackMouse) {
        element.removeEventListener('mousedown', handleMouseDown);
        element.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [handlers, threshold, preventDefaultTouchmoveEvent, trackMouse]);

  return elementRef;
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh(
  onRefresh: () => void | Promise<void>,
  options: { threshold?: number; enabled?: boolean } = {}
) {
  const { threshold = 100, enabled = true } = options;
  const elementRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isRefreshing = useRef<boolean>(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (element.scrollTop === 0 && !isRefreshing.current) {
        currentY.current = e.touches[0].clientY;
        const pullDistance = currentY.current - startY.current;

        if (pullDistance > 0) {
          // Add visual feedback here if needed
          if (pullDistance > threshold) {
            // Show "release to refresh" indicator
          }
        }
      }
    };

    const handleTouchEnd = async () => {
      if (element.scrollTop === 0 && !isRefreshing.current) {
        const pullDistance = currentY.current - startY.current;
        
        if (pullDistance > threshold) {
          isRefreshing.current = true;
          try {
            await onRefresh();
          } finally {
            isRefreshing.current = false;
          }
        }
      }
      
      startY.current = 0;
      currentY.current = 0;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, threshold, enabled]);

  return elementRef;
}