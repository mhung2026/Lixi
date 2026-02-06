const SHAKE_THRESHOLD = 15;
const SHAKE_TIMEOUT = 1000;

type ShakeCallback = () => void;

interface ShakeDetectorState {
  lastX: number;
  lastY: number;
  lastZ: number;
  lastTime: number;
}

export function createShakeDetector(onShake: ShakeCallback) {
  const state: ShakeDetectorState = {
    lastX: 0,
    lastY: 0,
    lastZ: 0,
    lastTime: 0,
  };

  let lastShakeTime = 0;

  function handleMotion(event: DeviceMotionEvent) {
    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    const now = Date.now();
    const timeDiff = now - state.lastTime;

    if (timeDiff > 100) {
      const deltaX = Math.abs(acc.x - state.lastX);
      const deltaY = Math.abs(acc.y - state.lastY);
      const deltaZ = Math.abs(acc.z - state.lastZ);

      const totalDelta = deltaX + deltaY + deltaZ;

      if (totalDelta > SHAKE_THRESHOLD && now - lastShakeTime > SHAKE_TIMEOUT) {
        lastShakeTime = now;
        onShake();
      }

      state.lastX = acc.x;
      state.lastY = acc.y;
      state.lastZ = acc.z;
      state.lastTime = now;
    }
  }

  return {
    start() {
      window.addEventListener('devicemotion', handleMotion);
    },
    stop() {
      window.removeEventListener('devicemotion', handleMotion);
    },
  };
}

export async function requestMotionPermission(): Promise<boolean> {
  // iOS 13+ requires permission
  if (
    typeof DeviceMotionEvent !== 'undefined' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (DeviceMotionEvent as any).requestPermission === 'function'
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const permission = await (DeviceMotionEvent as any).requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }
  // Non-iOS or older versions - permission not needed
  return true;
}

export function isShakeSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
}
