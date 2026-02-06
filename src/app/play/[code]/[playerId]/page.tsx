'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { formatFullCurrency } from '@/lib/utils';
import type { GameType } from '@/lib/gameData';
import GameSelector from '@/components/games/GameSelector';
import Confetti from '@/components/Confetti';
import Link from 'next/link';

interface Prize {
  id: string;
  type: 'cash' | 'item';
  name: string;
  value: number;
}

interface PlayerInfo {
  name: string;
  shakes_used: number;
  max_shakes: number;
  room_host: string;
  room_status: string;
  game_modes: GameType[];
}

type PageState = 'loading' | 'playing' | 'claiming' | 'result' | 'done' | 'error';

export default function PlayPage({ params }: { params: Promise<{ code: string; playerId: string }> }) {
  const { code, playerId } = use(params);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [prize, setPrize] = useState<Prize | null>(null);
  const [error, setError] = useState('');
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  // Fetch player info
  useEffect(() => {
    async function fetchInfo() {
      try {
        const res = await fetch(`/api/rooms/${code}`);
        if (!res.ok) {
          setError('Phòng không tồn tại');
          setPageState('error');
          return;
        }
        const data = await res.json();
        const player = data.players.find((p: { id: string }) => p.id === playerId);
        if (!player) {
          setError('Người chơi không tồn tại');
          setPageState('error');
          return;
        }
        setPlayerInfo({
          name: player.name,
          shakes_used: player.shakes_used,
          max_shakes: data.room.max_shakes,
          room_host: data.room.host_name,
          room_status: data.room.status,
          game_modes: data.room.game_modes || ['shake'],
        });

        if (player.shakes_used >= data.room.max_shakes) {
          const myResults = data.results.filter((r: { player_id: string }) => r.player_id === playerId);
          if (myResults.length > 0) {
            setPrize({
              id: myResults[0].prize_id,
              type: myResults[0].prizes?.type || 'cash',
              name: myResults[0].prizes?.name || 'Giải thưởng',
              value: myResults[0].prizes?.value || 0,
            });
          }
          setPageState('done');
        } else {
          setPageState('playing');
        }
      } catch {
        setError('Lỗi kết nối');
        setPageState('error');
      }
    }
    fetchInfo();
  }, [code, playerId]);

  const handleGameComplete = useCallback(async () => {
    if (pageState === 'claiming' || pageState === 'result' || pageState === 'done') return;
    setPageState('claiming');

    try {
      const res = await fetch(`/api/rooms/${code}/shake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Lỗi');
        if (data.error?.includes('hết lượt') || data.error?.includes('Hết lộc')) {
          setPageState('done');
        } else {
          setPageState('playing');
          setGameKey((k) => k + 1);
        }
        return;
      }

      setPrize(data.prize);
      setPageState('result');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);

      setPlayerInfo((prev) =>
        prev ? { ...prev, shakes_used: prev.shakes_used + 1 } : prev
      );
    } catch {
      setError('Lỗi kết nối');
      setPageState('playing');
      setGameKey((k) => k + 1);
    }
  }, [pageState, code, playerId]);

  function handlePlayAgain() {
    if (playerInfo && playerInfo.shakes_used < playerInfo.max_shakes) {
      setPrize(null);
      setError('');
      setPageState('playing');
      setGameKey((k) => k + 1);
    } else {
      setPageState('done');
    }
  }

  // Loading
  if (pageState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-center animate-scale-in">
          <div className="lixi-envelope mx-auto mb-6 animate-float" />
          <p className="text-yellow-200/80 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Error
  if (pageState === 'error') {
    return (
      <div className="flex items-center justify-center min-h-dvh px-4">
        <div className="text-center animate-scale-in">
          <div className="text-5xl mb-4">😢</div>
          <p className="text-yellow-200 text-lg mb-4">{error}</p>
          <Link href="/" className="text-yellow-300 underline font-medium">Về trang chủ</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh relative overflow-hidden">
      <Confetti active={showConfetti} />

      {/* Top bar - like reference */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-yellow-400 font-black text-xl tracking-wider">{code}</p>
          <p className="text-red-200/70 text-xs">Chủ xị: {playerInfo?.room_host}</p>
        </div>
        <div className="text-right">
          <p className="text-yellow-300 font-bold text-sm">{playerInfo?.name}</p>
          <p className="text-red-200/60 text-xs">
            Lượt: {playerInfo?.shakes_used}/{playerInfo?.max_shakes}
          </p>
        </div>
      </div>

      <div className="gold-line opacity-30" />

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 text-center">

        {/* DONE STATE */}
        {pageState === 'done' && (
          <div className="space-y-6 animate-scale-in">
            <div className="text-6xl mb-2">🎊</div>
            {prize ? (
              <div className="glass-card rounded-2xl p-6 max-w-sm">
                <p className="text-amber-500 text-sm mb-2 font-medium">Bạn đã nhận được</p>
                <div className="text-5xl mb-3">{prize.type === 'cash' ? '💰' : '🎁'}</div>
                <p className="text-amber-900 font-black text-2xl mb-1">{prize.name}</p>
                {prize.type === 'cash' && prize.value > 0 && (
                  <p className="text-amber-600 text-xl font-bold">{formatFullCurrency(prize.value)}</p>
                )}
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-6 max-w-sm">
                <p className="text-amber-700 font-semibold text-lg">
                  {error || 'Bạn đã hết lượt chơi!'}
                </p>
              </div>
            )}
            <div className="space-y-3">
              <Link
                href={`/room/${code}`}
                className="block gold-glass text-yellow-100 font-bold py-3 px-8 rounded-xl transition-all hover:bg-yellow-500/20"
              >
                📊 Xem kết quả phòng
              </Link>
              <Link href="/" className="block text-red-200/60 text-sm hover:text-white transition-colors">
                ← Về trang chủ
              </Link>
            </div>
          </div>
        )}

        {/* RESULT STATE */}
        {pageState === 'result' && prize && (
          <div className="space-y-6 animate-scale-in">
            <div className="animate-envelope-open">
              <div className="lixi-envelope mx-auto" />
            </div>
            <div className="bg-gradient-to-b from-yellow-400 to-amber-500 rounded-2xl p-6 shadow-2xl max-w-sm animate-bounce border-2 border-yellow-300">
              <p className="text-red-800 text-sm font-black mb-2 tracking-wider">CHÚC MỪNG!</p>
              <div className="text-5xl mb-3">{prize.type === 'cash' ? '💰' : '🎁'}</div>
              <p className="text-red-900 font-black text-2xl mb-1">{prize.name}</p>
              {prize.type === 'cash' && prize.value > 0 && (
                <p className="text-red-700 text-xl font-bold">{formatFullCurrency(prize.value)}</p>
              )}
            </div>
            {playerInfo && playerInfo.shakes_used < playerInfo.max_shakes ? (
              <button
                onClick={handlePlayAgain}
                className="btn-gold py-3 px-8 rounded-xl text-lg"
              >
                🔄 Chơi tiếp ({playerInfo.max_shakes - playerInfo.shakes_used} lượt còn lại)
              </button>
            ) : (
              <button
                onClick={() => setPageState('done')}
                className="gold-glass text-yellow-100 font-bold py-3 px-8 rounded-xl transition-all hover:bg-yellow-500/20"
              >
                Xem kết quả →
              </button>
            )}
          </div>
        )}

        {/* CLAIMING STATE */}
        {pageState === 'claiming' && (
          <div className="space-y-6 animate-scale-in">
            <div className="animate-float">
              <div className="lixi-envelope mx-auto animate-shake" />
            </div>
            <p className="text-gold font-black text-xl animate-pulse tracking-wider">Đang mở lì xì...</p>
          </div>
        )}

        {/* PLAYING STATE - Mini Game */}
        {pageState === 'playing' && playerInfo && (
          <div className="w-full max-w-md animate-slide-up">
            <div className="glass-card rounded-2xl p-5">
              <GameSelector
                key={gameKey}
                enabledGames={playerInfo.game_modes}
                onComplete={handleGameComplete}
              />
            </div>

            {error && (
              <p className="text-yellow-200 text-sm gold-glass rounded-lg py-2 px-3 mt-4 text-center">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
