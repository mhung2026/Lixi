'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createShakeDetector, requestMotionPermission, isShakeSupported } from '@/lib/shake';

interface ShakeGameProps {
  onComplete: () => void;
}

export default function ShakeGame({ onComplete }: ShakeGameProps) {
  const [phase, setPhase] = useState<'idle' | 'needsPermission' | 'ready' | 'shaking' | 'done'>('idle');
  const detectorRef = useRef<ReturnType<typeof createShakeDetector> | null>(null);
  const completedRef = useRef(false);

  const handleShake = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    setPhase('shaking');

    // Stop listening for further shakes
    detectorRef.current?.stop();

    // After the shake animation plays, call onComplete
    setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 1000);
  }, [onComplete]);

  // Initialize shake detection on mount
  useEffect(() => {
    if (!isShakeSupported()) {
      // No DeviceMotion API — go straight to ready (desktop fallback)
      setPhase('ready');
      return;
    }

    // Check if iOS permission is needed
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      setPhase('needsPermission');
    } else {
      // Non-iOS mobile — start immediately
      setPhase('ready');
    }
  }, []);

  // Start shake detector when phase becomes 'ready'
  useEffect(() => {
    if (phase !== 'ready') return;

    if (isShakeSupported()) {
      const detector = createShakeDetector(handleShake);
      detectorRef.current = detector;
      detector.start();

      return () => {
        detector.stop();
      };
    }
  }, [phase, handleShake]);

  const handleRequestPermission = async () => {
    const granted = await requestMotionPermission();
    if (granted) {
      setPhase('ready');
    } else {
      // Permission denied — fall back to button mode
      setPhase('ready');
    }
  };

  const handleFallbackShake = () => {
    handleShake();
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8 select-none">
      {/* Floating / shaking envelope */}
      <div
        className={`text-8xl transition-transform ${
          phase === 'shaking'
            ? 'animate-[wiggle_0.15s_ease-in-out_infinite]'
            : 'animate-[float_2.5s_ease-in-out_infinite]'
        }`}
      >
        <span role="img" aria-label="red envelope">🧧</span>
      </div>

      {/* Instruction text */}
      {phase !== 'done' && (
        <h2 className="text-2xl font-extrabold text-red-600 tracking-wide animate-pulse">
          LẮC MẠNH ĐI!
        </h2>
      )}

      {/* iOS permission request */}
      {phase === 'needsPermission' && (
        <button
          onClick={handleRequestPermission}
          className="px-6 py-3 bg-gradient-to-b from-amber-400 to-amber-500 text-amber-900 font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"
        >
          Cho phép cảm biến
        </button>
      )}

      {/* Desktop / fallback button */}
      {(phase === 'ready' || phase === 'idle') && (
        <button
          onClick={handleFallbackShake}
          className="px-8 py-4 bg-gradient-to-b from-red-500 to-red-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-red-500/30 active:scale-95 transition-transform hover:from-red-400 hover:to-red-500"
        >
          LẮC
        </button>
      )}

      {/* Shaking feedback */}
      {phase === 'shaking' && (
        <p className="text-amber-600 font-semibold animate-pulse">
          Đang mở...
        </p>
      )}

      {/* Inline keyframe styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-16px) rotate(3deg);
          }
        }
        @keyframes wiggle {
          0% { transform: rotate(0deg) scale(1.05); }
          25% { transform: rotate(-12deg) scale(1.1); }
          50% { transform: rotate(12deg) scale(1.05); }
          75% { transform: rotate(-8deg) scale(1.1); }
          100% { transform: rotate(0deg) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
