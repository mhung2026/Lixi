'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatFullCurrency } from '@/lib/utils';
import Link from 'next/link';

interface RoomData {
  id: string;
  code: string;
  host_name: string;
  mode: string;
  max_shakes: number;
  status: string;
  created_at: string;
}

interface PlayerData {
  id: string;
  name: string;
  phone: string;
  shakes_used: number;
  room_id: string;
  created_at: string;
}

interface ResultData {
  id: string;
  player_id: string;
  prize_id: string;
  room_id: string;
  created_at: string;
  prizes?: { name: string; type: string; value: number };
}

type Tab = 'played' | 'hosted';

export default function HistoryPage() {
  const [phone, setPhone] = useState('');
  const [savedName, setSavedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [tab, setTab] = useState<Tab>('played');

  // Played rooms data
  const [playedRooms, setPlayedRooms] = useState<RoomData[]>([]);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [results, setResults] = useState<ResultData[]>([]);

  // Hosted rooms data
  const [hostedRooms, setHostedRooms] = useState<RoomData[]>([]);

  const [error, setError] = useState('');

  const doSearch = useCallback(async (searchPhone: string) => {
    const cleanPhone = searchPhone.replace(/[^\d]/g, '');
    if (cleanPhone.length < 10) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/history?phone=${cleanPhone}`);
      const data = await res.json();
      setPlayedRooms(data.played_rooms || []);
      setHostedRooms(data.hosted_rooms || []);
      setPlayers(data.players || []);
      setResults(data.results || []);
      setSearched(true);

      // Save phone to localStorage
      try {
        const saved = JSON.parse(localStorage.getItem('player_info') || '{}');
        saved.phone = cleanPhone;
        localStorage.setItem('player_info', JSON.stringify(saved));
      } catch { /* ignore */ }
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fill phone from localStorage and auto-search
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('player_info') || '{}');
      if (saved.name) setSavedName(saved.name);
      if (saved.phone) {
        setPhone(saved.phone);
        doSearch(saved.phone);
      }
    } catch { /* ignore */ }
  }, [doSearch]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^\d]/g, '');
    if (cleanPhone.length < 10) {
      setError('Vui lòng nhập SĐT hợp lệ (10 số)');
      return;
    }
    doSearch(cleanPhone);
  }

  function getResultsForRoom(roomId: string) {
    return results.filter((r) => r.room_id === roomId);
  }

  function getPlayerForRoom(roomId: string) {
    return players.find((p) => p.room_id === roomId);
  }

  const totalWinnings = results.reduce((sum, r) => {
    if (r.prizes?.type === 'cash') return sum + (r.prizes.value || 0);
    return sum;
  }, 0);

  const hasPlayed = playedRooms.length > 0;
  const hasHosted = hostedRooms.length > 0;
  const hasAny = hasPlayed || hasHosted;

  return (
    <div className="min-h-dvh px-4 py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="text-red-200/60 text-sm hover:text-white transition-colors font-medium">
            ← Về trang chủ
          </Link>
          <h1 className="text-2xl font-black text-gold mt-2 tracking-tight">
            {savedName ? `Xin chào, ${savedName}!` : '📜 TÀI KHOẢN CỦA TÔI'}
          </h1>
          <div className="gold-line w-32 mx-auto my-2" />
          <p className="text-red-200/70 text-sm">SĐT MoMo = Tài khoản của bạn</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="glass-card rounded-2xl p-5 mb-6">
          <label className="block text-amber-700 text-sm font-bold mb-2">Số điện thoại MoMo</label>
          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="0901234567"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/[^\d]/g, ''));
                setError('');
              }}
              maxLength={10}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 placeholder-amber-300 text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-gold py-3 px-5 rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? '⏳' : '🔍 Tra cứu'}
            </button>
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-2 bg-red-50 rounded-lg py-2 px-3 text-center font-medium">
              {error}
            </p>
          )}
        </form>

        {/* Results */}
        {searched && (
          <>
            {!hasAny ? (
              <div className="glass-card rounded-2xl p-6 text-center animate-scale-in">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-amber-700 font-semibold">Không tìm thấy lịch sử</p>
                <p className="text-amber-400 text-sm mt-1">SĐT này chưa tham gia hoặc tạo phòng nào</p>
              </div>
            ) : (
              <div className="space-y-4 animate-slide-up">
                {/* Summary */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-amber-500 text-xs font-medium">Phòng đã chơi</p>
                      <p className="text-amber-900 font-black text-2xl">{playedRooms.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-amber-500 text-xs font-medium">Phòng đã tạo</p>
                      <p className="text-amber-900 font-black text-2xl">{hostedRooms.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-500 text-xs font-medium">Tổng nhận</p>
                      <p className="text-green-600 font-black text-2xl">{formatFullCurrency(totalWinnings)}</p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setTab('played')}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      tab === 'played'
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    🎮 Đã chơi ({playedRooms.length})
                  </button>
                  <button
                    onClick={() => setTab('hosted')}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      tab === 'hosted'
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    🏠 Đã tạo ({hostedRooms.length})
                  </button>
                </div>

                {/* Tab: Played Rooms */}
                {tab === 'played' && (
                  <>
                    {playedRooms.length === 0 ? (
                      <div className="glass-card rounded-2xl p-5 text-center">
                        <p className="text-amber-400 text-sm italic">Chưa tham gia phòng nào</p>
                      </div>
                    ) : (
                      playedRooms.map((room) => {
                        const player = getPlayerForRoom(room.id);
                        const roomResults = getResultsForRoom(room.id);
                        const roomWinnings = roomResults.reduce((sum, r) => {
                          if (r.prizes?.type === 'cash') return sum + (r.prizes.value || 0);
                          return sum;
                        }, 0);

                        return (
                          <div key={room.id} className="glass-card rounded-2xl p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="text-amber-900 font-black text-base">
                                  Phòng của {room.host_name}
                                </p>
                                <p className="text-amber-500 text-xs">
                                  Mã: <span className="font-bold tracking-wider">{room.code}</span>
                                  {' • '}
                                  {new Date(room.created_at).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                room.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {room.status === 'active' ? 'Đang chơi' : 'Đã kết thúc'}
                              </span>
                            </div>

                            {player && (
                              <p className="text-amber-400 text-xs mb-2">
                                Tên: <span className="font-semibold text-amber-700">{player.name}</span>
                                {' • '}Lắc: {player.shakes_used}/{room.max_shakes}
                              </p>
                            )}

                            {roomResults.length > 0 ? (
                              <div className="space-y-1.5 mb-3">
                                {roomResults.map((result) => (
                                  <div key={result.id} className="flex items-center justify-between bg-amber-50 rounded-lg py-2 px-3 border border-amber-100">
                                    <span className="text-amber-900 font-semibold text-sm">
                                      {result.prizes?.type === 'cash' ? '💵' : '🍺'} {result.prizes?.name || '???'}
                                    </span>
                                    {result.prizes?.type === 'cash' && result.prizes.value > 0 && (
                                      <span className="text-green-600 font-bold text-sm">
                                        +{formatFullCurrency(result.prizes.value)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-amber-400 text-xs italic mb-3">Chưa có giải</p>
                            )}

                            <div className="flex items-center justify-between">
                              {roomWinnings > 0 && (
                                <p className="text-green-600 font-bold text-sm">
                                  Tổng: {formatFullCurrency(roomWinnings)}
                                </p>
                              )}
                              <Link
                                href={`/room/${room.code}/results`}
                                className="text-amber-500 text-xs font-bold hover:text-amber-700 transition-colors ml-auto"
                              >
                                Xem kết quả →
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </>
                )}

                {/* Tab: Hosted Rooms */}
                {tab === 'hosted' && (
                  <>
                    {hostedRooms.length === 0 ? (
                      <div className="glass-card rounded-2xl p-5 text-center">
                        <p className="text-amber-400 text-sm italic">Chưa tạo phòng nào</p>
                      </div>
                    ) : (
                      hostedRooms.map((room) => (
                        <div key={room.id} className="glass-card rounded-2xl p-5">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-amber-900 font-black text-base">
                                {room.host_name}
                              </p>
                              <p className="text-amber-500 text-xs">
                                Mã: <span className="font-bold tracking-wider">{room.code}</span>
                                {' • '}
                                {new Date(room.created_at).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              room.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {room.status === 'active' ? 'Đang chơi' : 'Đã kết thúc'}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Link
                              href={`/room/${room.code}`}
                              className="flex-1 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs text-center hover:bg-amber-600 transition-all active:scale-95"
                            >
                              ⚙️ Quản lý phòng
                            </Link>
                            <Link
                              href={`/room/${room.code}/results`}
                              className="flex-1 py-2 rounded-xl bg-amber-100 text-amber-700 font-bold text-xs text-center hover:bg-amber-200 transition-all active:scale-95"
                            >
                              📋 Kết quả
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
