'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RoomInfo {
  room: {
    id: string;
    code: string;
    host_name: string;
    mode: string;
    max_shakes: number;
    status: string;
  };
  prizes: { id: string; name: string; type: string; quantity: number; remaining: number }[];
}

export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  // Load saved player info from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('player_info') || '{}');
      if (saved.name) setPlayerName(saved.name);
      if (saved.phone) setPlayerPhone(saved.phone);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await fetch(`/api/rooms/${code}`);
        if (!res.ok) {
          setError('Phòng không tồn tại hoặc đã kết thúc');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setRoomInfo(data);
      } catch {
        setError('Lỗi kết nối');
      }
      setLoading(false);
    }
    fetchRoom();
  }, [code]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Vui lòng nhập tên của bạn');
      return;
    }

    setJoining(true);
    setError('');

    try {
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName.trim(), phone: playerPhone || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Không thể tham gia');
        return;
      }

      const data = await res.json();

      // Save player info for next time
      try {
        localStorage.setItem('player_info', JSON.stringify({ name: playerName.trim(), phone: playerPhone || '' }));
      } catch { /* ignore */ }

      router.push(`/play/${code}/${data.player_id}`);
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-center animate-scale-in">
          <div className="lixi-envelope mx-auto mb-6 animate-float" />
          <p className="text-yellow-200/80 font-medium">Đang tải phòng...</p>
        </div>
      </div>
    );
  }

  if (!roomInfo) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-center animate-scale-in">
          <div className="text-5xl mb-4">😢</div>
          <p className="text-yellow-200 text-lg mb-2">{error || 'Phòng không tồn tại'}</p>
          <Link href="/" className="text-yellow-300 underline font-medium">Về trang chủ</Link>
        </div>
      </div>
    );
  }

  const totalPrizes = roomInfo.prizes.reduce((sum, p) => sum + p.remaining, 0);

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-4 py-8">
      {/* Room Info Card */}
      <div className="glass-card rounded-2xl p-6 max-w-sm w-full mb-6 animate-scale-in">
        <div className="text-center mb-5">
          <div className="lixi-envelope mx-auto mb-4" style={{ width: 100, height: 145 }} />
          <h2 className="text-amber-800 font-black text-xl">Phòng của {roomInfo.room.host_name}</h2>
          <p className="text-amber-500 text-sm mt-1 font-bold">
            Mã: <span className="tracking-[0.2em]">{code}</span>
          </p>
          <div className="gold-line w-24 mx-auto my-3 opacity-50" />
          <p className="text-amber-400 text-xs">
            {roomInfo.room.mode === 'online' ? '📱 Online' : '🤝 Local'} • {roomInfo.room.max_shakes} lần lắc • {totalPrizes} giải còn lại
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-amber-700 text-sm font-bold mb-1">Tên của bạn</label>
            <input
              type="text"
              placeholder="VD: Bé Heo 🐷"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                setError('');
              }}
              autoFocus
              className="w-full py-3 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 placeholder-amber-300 text-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-amber-700 text-sm font-bold mb-1">
              SĐT MoMo <span className="font-normal text-amber-400">(không bắt buộc)</span>
            </label>
            <input
              type="tel"
              placeholder="VD: 0901234567"
              value={playerPhone}
              onChange={(e) => setPlayerPhone(e.target.value.replace(/[^\d]/g, ''))}
              maxLength={10}
              className="w-full py-3 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 placeholder-amber-300 text-center text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <p className="text-amber-400 text-xs mt-1 text-center">
              Để chủ phòng chuyển lì xì qua MoMo cho bạn
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 rounded-lg py-2 px-3 text-center font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={joining}
            className="w-full btn-red py-4 rounded-2xl text-xl disabled:opacity-50"
          >
            {joining ? '⏳ Đang vào...' : '🎉 VÀO CHƠI'}
          </button>
        </form>
      </div>

      <Link href="/" className="text-red-200/60 text-sm hover:text-white transition-colors font-medium">
        ← Về trang chủ
      </Link>
    </div>
  );
}
