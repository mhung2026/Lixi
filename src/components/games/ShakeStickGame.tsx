'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface ShakeStickGameProps {
  onComplete: () => void;
}

export default function ShakeStickGame({ onComplete }: ShakeStickGameProps) {
  const [isShaking, setIsShaking] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const shakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastShakeTime = useRef(0);

  // Generate random sticks with varying positions/rotations
  const sticks = Array.from({ length: 9 }, (_, i) => ({
    rotation: (Math.random() - 0.5) * 12, // -6 to 6 degrees
    translateX: (Math.random() - 0.5) * 30, // -15 to 15px
    delay: -Math.random() * 2, // 0 to -2s
    duration: 2.5 + Math.random() * 1.5, // 2.5 to 4s
  }));

  const requestMotionPermission = useCallback(async () => {
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission === 'granted') {
          setPermissionGranted(true);
          setShowPermissionModal(false);
        }
      } catch (error) {
        console.error('Permission denied:', error);
      }
    } else {
      // No permission needed (Android or desktop)
      setPermissionGranted(true);
      setShowPermissionModal(false);
    }
  }, []);

  const handleShake = useCallback(() => {
    const now = Date.now();
    if (now - lastShakeTime.current < 1000) return; // Debounce 1s

    lastShakeTime.current = now;
    setIsShaking(true);
    setShakeIntensity(1);

    // Clear previous timeout
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
    }

    // Complete after 3 seconds of shaking
    shakeTimeoutRef.current = setTimeout(() => {
      setIsShaking(false);
      onComplete();
    }, 3000);
  }, [onComplete]);

  useEffect(() => {
    if (!permissionGranted) return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const magnitude = Math.sqrt(
        (acc.x || 0) ** 2 +
        (acc.y || 0) ** 2 +
        (acc.z || 0) ** 2
      );

      // Detect strong motion (shake threshold ~15)
      if (magnitude > 15) {
        handleShake();
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [permissionGranted, handleShake]);

  useEffect(() => {
    // Check if we need to show permission modal (iOS 13+)
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      setShowPermissionModal(true);
    } else {
      setPermissionGranted(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      {/* Permission Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full text-center">
            <h3 className="text-amber-800 font-black text-xl mb-3">🤳 Cho phép cảm biến</h3>
            <p className="text-amber-600 text-sm mb-4">
              Cần quyền truy cập cảm biến chuyển động để phát hiện lắc điện thoại
            </p>
            <button
              onClick={requestMotionPermission}
              className="w-full btn-gold py-3 rounded-xl font-bold"
            >
              Cho phép
            </button>
          </div>
        </div>
      )}

      {/* Shake Zone */}
      <div className="text-center mb-8">
        <div
          className={`relative inline-block transition-transform duration-200 ${
            isShaking ? 'animate-shake-intense' : 'animate-shake-idle'
          }`}
          style={{
            '--shake-intensity': shakeIntensity,
          } as React.CSSProperties}
        >
          {/* Jar Container */}
          <div className="relative w-64 h-80">
            {/* Back layer */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-56 bg-gradient-to-b from-amber-600/30 to-amber-800/40 rounded-[40%] border-4 border-amber-700/50" />
            </div>

            {/* Sticks Container */}
            <div className="absolute inset-0 flex items-end justify-center pb-8">
              <div className="relative w-32 h-48 flex items-end justify-center gap-0.5">
                {sticks.map((stick, i) => (
                  <div
                    key={i}
                    className={`absolute bottom-0 w-2 h-40 bg-gradient-to-b from-amber-300 to-amber-600 rounded-full transition-transform ${
                      isShaking ? 'animate-stick-shake' : 'animate-stick-idle'
                    }`}
                    style={{
                      transform: `translateX(${stick.translateX}px) rotate(${stick.rotation}deg)`,
                      animationDelay: `${stick.delay}s`,
                      animationDuration: `${stick.duration}s`,
                      left: `${(i / (sticks.length - 1)) * 100}%`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Front layer */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-56 rounded-[40%] border-4 border-amber-600/60 bg-gradient-to-b from-transparent via-transparent to-amber-900/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <h2 className="text-gold text-2xl font-black mb-2 uppercase tracking-wider">
        {isShaking ? '🔥 ĐANG LẮC!' : 'LẮC ĐI CHỜ CHI! 🤘'}
      </h2>
      <p className="text-white/70 text-sm mb-6">
        {isShaking ? 'Cố lên! Lắc mạnh hơn nữa!' : 'Lắc nhiệt tình, vận may thình lình 🚀'}
      </p>

      {/* Manual button for desktop */}
      <button
        onClick={handleShake}
        className="btn-gold px-8 py-4 rounded-2xl font-bold text-lg hidden md:inline-block"
      >
        <span className="mr-2">👆</span>
        XIN QUẺ
      </button>

      <style jsx>{`
        @keyframes shake-idle {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(1px) rotate(0.5deg); }
          75% { transform: translateX(-1px) rotate(-0.5deg); }
        }

        @keyframes shake-intense {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10% { transform: translateX(-10px) rotate(-3deg); }
          20% { transform: translateX(10px) rotate(3deg); }
          30% { transform: translateX(-10px) rotate(-3deg); }
          40% { transform: translateX(10px) rotate(3deg); }
          50% { transform: translateX(-10px) rotate(-3deg); }
          60% { transform: translateX(10px) rotate(3deg); }
          70% { transform: translateX(-10px) rotate(-3deg); }
          80% { transform: translateX(10px) rotate(3deg); }
          90% { transform: translateX(-5px) rotate(-1deg); }
        }

        @keyframes stick-idle {
          0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
          50% { transform: translateY(-2px) rotate(calc(var(--r, 0deg) + 1deg)); }
        }

        @keyframes stick-shake {
          0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
          10% { transform: translateY(-8px) rotate(calc(var(--r, 0deg) - 5deg)); }
          20% { transform: translateY(-6px) rotate(calc(var(--r, 0deg) + 5deg)); }
          30% { transform: translateY(-10px) rotate(calc(var(--r, 0deg) - 4deg)); }
          40% { transform: translateY(-5px) rotate(calc(var(--r, 0deg) + 6deg)); }
          50% { transform: translateY(-12px) rotate(calc(var(--r, 0deg) - 3deg)); }
          60% { transform: translateY(-7px) rotate(calc(var(--r, 0deg) + 4deg)); }
          70% { transform: translateY(-9px) rotate(calc(var(--r, 0deg) - 5deg)); }
          80% { transform: translateY(-4px) rotate(calc(var(--r, 0deg) + 3deg)); }
          90% { transform: translateY(-6px) rotate(calc(var(--r, 0deg) - 2deg)); }
        }

        .animate-shake-idle {
          animation: shake-idle 3s ease-in-out infinite;
        }

        .animate-shake-intense {
          animation: shake-intense 0.3s ease-in-out infinite;
        }

        .animate-stick-idle {
          animation: stick-idle 3s ease-in-out infinite;
        }

        .animate-stick-shake {
          animation: stick-shake 0.15s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
