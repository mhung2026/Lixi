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
      {/* Decorations */}
      <div className="absolute top-4 left-4 text-4xl animate-float">🏮</div>
      <div className="absolute top-4 right-4 text-4xl animate-float" style={{ animationDelay: '1s' }}>🏮</div>
      <div className="absolute top-16 left-1/4 text-2xl animate-float" style={{ animationDelay: '0.5s' }}>🌸</div>
      <div className="absolute top-20 right-1/4 text-2xl animate-float" style={{ animationDelay: '1.5s' }}>🌸</div>

      {/* Logo / Title */}
      <div className="mb-8">
        <div className="text-6xl mb-4">🧧</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-yellow-300 drop-shadow-lg mb-2">
          LẮC LỘC ĐẦU XUÂN
        </h1>
        <p className="text-yellow-100 text-lg">
          Sum Vầy - Tết 2026
        </p>
      </div>

      {/* Create Room Button */}
      <Link
        href="/host"
        className="w-full max-w-xs bg-yellow-500 hover:bg-yellow-400 text-red-900 font-bold py-4 px-8 rounded-2xl text-xl shadow-lg animate-pulse-glow transition-all hover:scale-105 mb-8 block text-center"
      >
        ⭐ TẠO PHÒNG NGAY
      </Link>

      {/* Divider */}
      <div className="flex items-center gap-3 w-full max-w-xs mb-6">
        <div className="flex-1 h-px bg-red-400/50" />
        <span className="text-red-200 text-sm">hoặc tham gia phòng</span>
        <div className="flex-1 h-px bg-red-400/50" />
      </div>

      {/* Join Room Form */}
      <form onSubmit={handleJoin} className="w-full max-w-xs">
        <div className={`relative mb-3 ${shakeError ? 'animate-error-shake' : ''}`}>
          <input
            type="text"
            placeholder="Nhập mã phòng (VD: ABC123)"
            value={roomCode}
            onChange={(e) => {
              setRoomCode(e.target.value.toUpperCase());
              setError('');
            }}
            maxLength={6}
            className="w-full py-3 px-4 rounded-xl bg-white/90 text-red-900 placeholder-red-300 font-semibold text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        {error && (
          <p className="text-yellow-200 text-sm mb-3 bg-red-900/40 rounded-lg py-2 px-3">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white/20 hover:bg-white/30 backdrop-blur text-white font-bold py-3 px-8 rounded-xl text-lg transition-all border border-white/30 disabled:opacity-50"
        >
          {loading ? '⏳ Đang kiểm tra...' : '🚀 THAM GIA'}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-12 text-red-300/60 text-xs">
        Chúc mừng năm mới 2026 🎆
      </p>
    </div>
  );
}
