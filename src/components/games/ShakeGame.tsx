'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createShakeDetector, requestMotionPermission, isShakeSupported } from '@/lib/shake';

interface ShakeGameProps {
  onComplete: () => void;
}

export default function ShakeGame({ onComplete }: ShakeGameProps) {
  const [phase, setPhase] = useState<'idle' | 'needsPermission' | 'ready' | 'shaking' | 'done'>('idle');
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const detectorRef = useRef<ReturnType<typeof createShakeDetector> | null>(null);
  const completedRef = useRef(false);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; rotation: number }[]>([]);

  const handleShake = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    setPhase('shaking');
    setShakeIntensity(1);

    // Generate particles
    particlesRef.current = Array.from({ length: 20 }, () => ({
      x: 0,
      y: 0,
      vx: (Math.random() - 0.5) * 10,
      vy: -Math.random() * 10 - 5,
      rotation: Math.random() * 360,
    }));

    // Stop listening for further shakes
    detectorRef.current?.stop();

    // After the shake animation plays, call onComplete
    setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 2000);
  }, [onComplete]);

  // Initialize shake detection on mont
  useEffect(() => {
    if (!isShakeSupported()) {
      setPhase('ready');
      return;
    }

    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      setPhase('needsPermission');
    } else {
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
      setPhase('ready');
    }
  };

  const handleFallbackShake = () => {
    handleShake();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 relative overflow-hidden">
      {/* Particles */}
      {phase === 'shaking' && particlesRef.current.map((particle, i) => (
        <div
          key={i}
          className="absolute text-2xl animate-particle-explode pointer-events-none"
          style={{
            left: '50%',
            top: '40%',
            '--vx': `${particle.vx}px`,
            '--vy': `${particle.vy}px`,
            '--rotation': `${particle.rotation}deg`,
          } as React.CSSProperties}
        >
          {['💵', '🎁', '✨', '🎉', '💰'][i % 5]}
        </div>
      ))}

      {/* Red Envelope */}
      <div className="text-center mb-8 relative">
        <div
          className={`relative inline-block transition-all duration-300 ${
            phase === 'shaking'
              ? 'animate-shake-explosive'
              : phase === 'ready' || phase === 'idle'
              ? 'animate-envelope-float'
              : ''
          }`}
          style={{
            transform: phase === 'shaking' ? `scale(${1 + shakeIntensity * 0.2})` : 'scale(1)',
          }}
        >
          {/* Envelope SVG/Div */}
          <div className="relative w-48 h-64">
            {/* Envelope body */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl border-4 border-yellow-400 shadow-2xl shadow-red-500/50">
              {/* Decorative pattern */}
              <div className="absolute inset-4 border-2 border-yellow-400/30 rounded-xl" />

              {/* Gold character "Lộc" */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-black text-yellow-400 drop-shadow-lg" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                  Lộc
                </span>
              </div>
            </div>

            {/* Flap */}
            <div
              className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-t-2xl border-4 border-yellow-400 origin-top transition-transform duration-500 ${
                phase === 'shaking' ? 'rotate-x-45 -translate-y-4' : ''
              }`}
              style={{
                clipPath: 'polygon(0 0, 100% 0, 90% 100%, 10% 100%)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              }}
            />

            {/* Glow effect */}
            {(phase === 'ready' || phase === 'idle') && (
              <div className="absolute inset-0 bg-yellow-400/20 rounded-2xl animate-pulse-glow" />
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      {phase !== 'done' && (
        <>
          <h2 className="text-gold text-3xl font-black mb-2 uppercase tracking-wider animate-bounce-subtle">
            {phase === 'shaking' ? '🔥 ĐANG MỞ!' : 'LẮC MẠNH ĐI! 🧧'}
          </h2>
          <p className="text-white/70 text-sm mb-6">
            {phase === 'shaking' ? 'Chúc mừng! Đang mở lì xì...' : 'Lắc thật mạnh để mở phong bì lì xì'}
          </p>
        </>
      )}

      {/* iOS permission request */}
      {phase === 'needsPermission' && (
        <button
          onClick={handleRequestPermission}
          className="btn-gold px-6 py-3 rounded-2xl font-bold shadow-2xl"
        >
          Cho phép cảm biến
        </button>
      )}

      {/* Desktop / fallback button */}
      {(phase === 'ready' || phase === 'idle') && (
        <button
          onClick={handleFallbackShake}
          className="btn-red px-10 py-5 rounded-2xl font-black text-xl shadow-2xl transform hover:scale-105 transition-all"
        >
          <span className="mr-2">🎉</span>
          MỞ LÌ XÌ
        </button>
      )}

      <style jsx>{`
        @keyframes envelope-float {
          0%, 100% {
            transform: translateY(0) rotate(-2deg);
          }
          50% {
            transform: translateY(-20px) rotate(2deg);
          }
        }

        @keyframes shake-explosive {
          0%, 100% { transform: translateX(0) rotate(0deg) scale(1); }
          10% { transform: translateX(-15px) rotate(-8deg) scale(1.05); }
          20% { transform: translateX(15px) rotate(8deg) scale(1.1); }
          30% { transform: translateX(-15px) rotate(-6deg) scale(1.05); }
          40% { transform: translateX(15px) rotate(6deg) scale(1.1); }
          50% { transform: translateX(-12px) rotate(-4deg) scale(1.05); }
          60% { transform: translateX(12px) rotate(4deg) scale(1.1); }
          70% { transform: translateX(-8px) rotate(-2deg) scale(1.05); }
          80% { transform: translateX(8px) rotate(2deg) scale(1.1); }
          90% { transform: translateX(-4px) rotate(-1deg) scale(1.05); }
        }

        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }

        @keyframes particle-explode {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--vx), calc(var(--vy) + 200px)) rotate(var(--rotation));
            opacity: 0;
          }
        }

        .animate-envelope-float {
          animation: envelope-float 3s ease-in-out infinite;
        }

        .animate-shake-explosive {
          animation: shake-explosive 0.3s ease-in-out infinite;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-particle-explode {
          animation: particle-explode 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
