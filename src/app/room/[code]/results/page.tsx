'use client';

import { use, useState, useEffect } from 'react';
import { formatFullCurrency } from '@/lib/utils';
import Link from 'next/link';

interface RoomResult {
  room: {
    code: string;
    host_name: string;
    mode: string;
    max_shakes: number;
    status: string;
    created_at: string;
  };
  prizes: { id: string; name: string; type: string; value: number; quantity: number; remaining: number }[];
  results: {
    id: string;
    player_id: string;
    prize_id: string;
    created_at: string;
    players?: { name: string };
    prizes?: { name: string; type: string; value: number };
  }[];
  players: { id: string; name: string; shakes_used: number }[];
}

export default function RoomResultsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [data, setData] = useState<RoomResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await fetch(`/api/rooms/${code}`);
        if (!res.ok) {
          setError('Phòng không tồn tại');
          setLoading(false);
          return;
        }
        const json = await res.json();
        setData(json);
      } catch {
        setError('Lỗi kết nối');
      }
      setLoading(false);
    }
    fetchRoom();
  }, [code]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-center animate-scale-in">
          <div className="lixi-envelope mx-auto mb-6 animate-float" />
          <p className="text-yellow-200/80 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-center animate-scale-in">
          <div className="text-5xl mb-4">😢</div>
          <p className="text-yellow-200 text-lg mb-4">{error || 'Phòng không tồn tại'}</p>
          <Link href="/" className="text-yellow-300 underline font-medium">Về trang chủ</Link>
        </div>
      </div>
    );
  }

  const { room, prizes, results, players } = data;
  const totalDistributed = results.reduce((sum, r) => {
    if (r.prizes?.type === 'cash') return sum + (r.prizes.value || 0);
    return sum;
  }, 0);
  const totalPrizes = prizes.reduce((sum, p) => sum + p.quantity, 0);
  const totalRemaining = prizes.reduce((sum, p) => sum + p.remaining, 0);

  // Group results by player
  const playerResults = new Map<string, { name: string; prizes: typeof results }>();
  for (const result of results) {
    const playerName = result.players?.name || '???';
    const playerId = result.player_id;
    if (!playerResults.has(playerId)) {
      playerResults.set(playerId, { name: playerName, prizes: [] });
    }
    playerResults.get(playerId)!.prizes.push(result);
  }

  return (
    <div className="min-h-dvh px-4 py-6">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="text-red-200/60 text-sm hover:text-white transition-colors font-medium">
            ← Về trang chủ
          </Link>
          <h1 className="text-xl font-black text-gold mt-2 tracking-tight">
            🏆 Kết quả lì xì
          </h1>
          <p className="text-red-200/70 text-sm mt-1">
            Phòng của {room.host_name} • Mã: {code}
          </p>
          <div className="gold-line w-32 mx-auto my-2" />
        </div>

        {/* Summary */}
        <div className="glass-card rounded-2xl p-5 animate-slide-up">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-amber-500 text-xs font-medium">Người chơi</p>
              <p className="text-amber-900 font-black text-xl">{players.length}</p>
            </div>
            <div>
              <p className="text-amber-500 text-xs font-medium">Giải đã phát</p>
              <p className="text-amber-900 font-black text-xl">{totalPrizes - totalRemaining}/{totalPrizes}</p>
            </div>
            <div>
              <p className="text-amber-500 text-xs font-medium">Tổng tiền</p>
              <p className="text-green-600 font-black text-xl">{formatFullCurrency(totalDistributed)}</p>
            </div>
          </div>
        </div>

        {/* Prize Pool Status */}
        <div className="glass-card rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-amber-800 font-black text-base mb-3">🎁 Giải thưởng</h2>
          <div className="space-y-2">
            {prizes.map((prize) => (
              <div
                key={prize.id}
                className={`flex items-center justify-between py-2 px-3 rounded-xl ${
                  prize.remaining > 0 ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{prize.type === 'cash' ? '💵' : '🍺'}</span>
                  <span className="text-amber-900 font-semibold text-sm">{prize.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {prize.type === 'cash' && (
                    <span className="text-amber-600 text-sm font-bold">{formatFullCurrency(prize.value)}</span>
                  )}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    prize.remaining > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {prize.remaining}/{prize.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results by player */}
        <div className="glass-card rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-amber-800 font-black text-base mb-3">
            📋 Danh sách nhận lì xì
            <span className="text-amber-500 font-bold text-sm ml-2">({results.length})</span>
          </h2>

          {results.length === 0 ? (
            <p className="text-amber-400 text-sm text-center py-4 italic">Chưa có ai nhận lì xì</p>
          ) : (
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={result.id} className="flex items-center justify-between bg-amber-50 rounded-xl py-2.5 px-3 border border-amber-100">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-xs font-bold w-6">#{index + 1}</span>
                    <span className="text-amber-900 font-semibold text-sm">{result.players?.name || '???'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-700 text-sm">
                      {result.prizes?.type === 'cash' ? '💵' : '🍺'} {result.prizes?.name}
                    </span>
                    {result.prizes?.type === 'cash' && result.prizes.value > 0 && (
                      <span className="text-green-600 font-bold text-sm">
                        {formatFullCurrency(result.prizes.value)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per-player summary */}
        {playerResults.size > 0 && (
          <div className="glass-card rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-amber-800 font-black text-base mb-3">👥 Tổng hợp theo người</h2>
            <div className="space-y-2">
              {Array.from(playerResults.entries()).map(([playerId, info]) => {
                const totalCash = info.prizes.reduce((sum, r) => {
                  if (r.prizes?.type === 'cash') return sum + (r.prizes.value || 0);
                  return sum;
                }, 0);
                return (
                  <div key={playerId} className="flex items-center justify-between bg-amber-50 rounded-xl py-2.5 px-3 border border-amber-100">
                    <div>
                      <span className="text-amber-900 font-bold text-sm">{info.name}</span>
                      <span className="text-amber-400 text-xs ml-2">{info.prizes.length} giải</span>
                    </div>
                    {totalCash > 0 && (
                      <span className="text-green-600 font-bold text-sm">{formatFullCurrency(totalCash)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="text-center">
          <Link
            href={`/room/${code}`}
            className="text-red-200/60 text-sm hover:text-white transition-colors font-medium"
          >
            ← Quay lại phòng
          </Link>
        </div>
      </div>
    </div>
  );
}
