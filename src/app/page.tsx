'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LandingPage() {
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const router = useRouter();

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!roomCode.trim()) {
      setError('Vui lòng nhập mã phòng');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/rooms/${roomCode.toUpperCase()}`);
      if (!res.ok) {
        setError('Phòng không tồn tại hoặc đã kết thúc');
        setShakeError(true);
        setTimeout(() => setShakeError(false), 600);
        return;
      }
      router.push(`/join/${roomCode.toUpperCase()}`);
    } catch {
      setError('Lỗi kết nối, thử lại sau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-4 py-8 text-center">
      {/* Floating blossoms */}
      <div className="fixed top-16 left-[10%] text-2xl animate-float opacity-50 pointer-events-none" style={{ animationDelay: '0.5s' }}>🌸</div>
      <div className="fixed top-24 right-[15%] text-xl animate-float opacity-40 pointer-events-none" style={{ animationDelay: '1.5s' }}>🌸</div>
      <div className="fixed bottom-20 left-[20%] text-lg animate-float opacity-30 pointer-events-none" style={{ animationDelay: '2s' }}>✨</div>
      <div className="fixed bottom-32 right-[10%] text-lg animate-float opacity-30 pointer-events-none" style={{ animationDelay: '0.8s' }}>✨</div>

      {/* Logo / Envelope */}
      <div className="mb-8 animate-scale-in">
        <div className="lixi-envelope mx-auto mb-6 animate-float" />
        <h1 className="text-3xl sm:text-4xl font-black text-gold drop-shadow-lg mb-2 tracking-tight">
          LẮC LỘC ĐẦU XUÂN
        </h1>
        <div className="gold-line w-48 mx-auto my-3" />
        <p className="text-red-100/80 text-lg font-medium">
          Sum Vầy - Tết 2026
        </p>
      </div>

      {/* Create Room Button */}
      <Link
        href="/host"
        className="w-full max-w-xs btn-gold py-4 px-8 rounded-2xl text-xl animate-pulse-glow mb-8 block text-center"
      >
        ⭐ TẠO PHÒNG NGAY
      </Link>

      {/* Divider */}
      <div className="flex items-center gap-3 w-full max-w-xs mb-6">
        <div className="flex-1 gold-line opacity-50" />
        <span className="text-red-200/70 text-sm font-medium">hoặc tham gia</span>
        <div className="flex-1 gold-line opacity-50" />
      </div>

      {/* Join Room Form */}
      <form onSubmit={handleJoin} className="w-full max-w-xs">
        <div className={`relative mb-3 ${shakeError ? 'animate-error-shake' : ''}`}>
          <input
            type="text"
            placeholder="NHẬP MÃ PHÒNG"
            value={roomCode}
            onChange={(e) => {
              setRoomCode(e.target.value.toUpperCase());
              setError('');
            }}
            maxLength={6}
            className="w-full py-3.5 px-4 rounded-xl bg-white/95 text-red-900 placeholder-red-300/60 font-bold text-center text-xl tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-lg"
          />
        </div>
        {error && (
          <p className="text-yellow-200 text-sm mb-3 gold-glass rounded-lg py-2 px-3">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-red py-3.5 px-8 rounded-xl text-lg disabled:opacity-50"
        >
          {loading ? '⏳ Đang kiểm tra...' : '🚀 THAM GIA'}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-12 text-red-300/40 text-xs font-medium">
        Chúc mừng năm mới 2026 🎆
      </p>
    </div>
  );
}
