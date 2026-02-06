'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createShakeDetector, requestMotionPermission, isShakeSupported } from '@/lib/shake';

interface UseShakeOptions {
  onShake: () => void;
  enabled?: boolean;
}

export function useShake({ onShake, enabled = true }: UseShakeOptions) {
  const [shakeSupported, setShakeSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const detectorRef = useRef<ReturnType<typeof createShakeDetector> | null>(null);
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;

  useEffect(() => {
    setShakeSupported(isShakeSupported());
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await requestMotionPermission();
    setPermissionGranted(granted);
    return granted;
  }, []);

  useEffect(() => {
    if (!enabled || !shakeSupported || !permissionGranted) return;

    const detector = createShakeDetector(() => onShakeRef.current());
    detectorRef.current = detector;
    detector.start();

    return () => {
      detector.stop();
      detectorRef.current = null;
    };
  }, [enabled, shakeSupported, permissionGranted]);

  return {
    shakeSupported,
    permissionGranted,
    requestPermission,
  };
}
