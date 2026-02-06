'use client';

import { use, useState } from 'react';
import { useRoom } from '@/hooks/useRoom';
import { formatFullCurrency, getShareUrl, getMoMoLink, formatPhone } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { room, prizes, players, results, loading } = useRoom(code);
  const [copied, setCopied] = useState(false);
  const [ending, setEnding] = useState(false);
  const [momoQR, setMomoQR] = useState<{ url: string; playerName: string; amount: number } | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-float">🧧</div>
          <p className="text-yellow-200">Đang tải phòng...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-center">
          <div className="text-5xl mb-4">😢</div>
          <p className="text-yellow-200 text-lg mb-4">Phòng không tồn tại</p>
          <Link href="/" className="text-yellow-300 underline">Về trang chủ</Link>
        </div>
      </div>
    );
  }

  const shareUrl = getShareUrl(code);
  const totalRemaining = prizes.reduce((sum, p) => sum + p.remaining, 0);
  const totalPrizes = prizes.reduce((sum, p) => sum + p.quantity, 0);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  async function endRoom() {
    if (!confirm('Bạn có chắc muốn kết thúc phòng?')) return;
    setEnding(true);
    try {
      await fetch(`/api/rooms/${code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ended' }),
      });
      window.location.reload();
    } catch {
      setEnding(false);
    }
  }

  function openMoMoTransfer(playerPhone: string, playerName: string, amount: number) {
    const message = `Li xi Tet - ${playerName} - ${room!.host_name}`;
    const momoUrl = getMoMoLink(playerPhone, amount, message);
    // Show QR modal for the MoMo link
    setMomoQR({ url: momoUrl, playerName, amount });
  }

  return (
    <div className="min-h-dvh px-4 py-6">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="text-red-200 text-sm hover:text-white transition-colors">
            ← Về trang chủ
          </Link>
          <h1 className="text-xl font-bold text-yellow-300 mt-2">
            🧧 Phòng của {room.host_name}
          </h1>
          <p className="text-red-200 text-sm">
            {room.mode === 'online' ? '📱 Online' : '🤝 Local'} • {room.max_shakes} lần lắc
          </p>
          {room.status === 'ended' && (
            <div className="mt-2 bg-red-900/60 rounded-lg py-2 px-4 inline-block">
              <p className="text-yellow-200 font-semibold">🔒 Phòng đã kết thúc</p>
            </div>
          )}
        </div>

        {/* Room Code & QR */}
        {room.status !== 'ended' && (
          <div className="bg-white/95 rounded-2xl p-5 shadow-lg text-center">
            <p className="text-amber-600 text-sm font-semibold mb-2">Mã phòng</p>
            <p className="text-4xl font-black text-amber-900 tracking-[0.3em] mb-4">{code}</p>

            <div className="inline-block bg-white p-3 rounded-xl shadow-sm mb-4">
              <QRCodeSVG value={shareUrl} size={180} level="M" />
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex-1 py-2.5 rounded-xl bg-amber-100 text-amber-700 font-semibold text-sm hover:bg-amber-200 transition-colors"
              >
                {copied ? '✅ Đã copy!' : '📋 Copy link'}
              </button>
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  onClick={() => navigator.share({ title: 'Sum Vầy - Lắc Lộc', url: shareUrl })}
                  className="flex-1 py-2.5 rounded-xl bg-amber-100 text-amber-700 font-semibold text-sm hover:bg-amber-200 transition-colors"
                >
                  📤 Chia sẻ
                </button>
              )}
            </div>
          </div>
        )}

        {/* Prize Pool */}
        <div className="bg-white/95 rounded-2xl p-5 shadow-lg">
          <h2 className="text-amber-800 font-bold text-lg mb-3">
            🎁 Kho lì xì ({totalRemaining}/{totalPrizes} còn lại)
          </h2>
          <div className="space-y-2">
            {prizes.map((prize) => (
              <div
                key={prize.id}
                className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                  prize.remaining > 0 ? 'bg-amber-50' : 'bg-gray-100 opacity-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{prize.type === 'cash' ? '💵' : '🍺'}</span>
                  <span className="text-amber-900 font-medium text-sm">{prize.name}</span>
                </div>
                <div className="text-right">
                  {prize.type === 'cash' && (
                    <span className="text-amber-600 text-sm font-semibold mr-2">
                      {formatFullCurrency(prize.value)}
                    </span>
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

        {/* Players */}
        <div className="bg-white/95 rounded-2xl p-5 shadow-lg">
          <h2 className="text-amber-800 font-bold text-lg mb-3">
            👥 Người chơi ({players.length})
          </h2>
          {players.length === 0 ? (
            <p className="text-amber-400 text-sm text-center py-3">Chưa có ai tham gia...</p>
          ) : (
            <div className="space-y-2">
              {players.map((player) => (
                <div key={player.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-amber-50">
                  <div>
                    <span className="text-amber-900 font-medium text-sm">{player.name}</span>
                    {player.phone && (
                      <span className="text-amber-400 text-xs ml-2">📱 {formatPhone(player.phone)}</span>
                    )}
                  </div>
                  <span className="text-amber-500 text-xs">Lắc: {player.shakes_used}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results History with MoMo buttons */}
        <div className="bg-white/95 rounded-2xl p-5 shadow-lg">
          <h2 className="text-amber-800 font-bold text-lg mb-3">
            🏆 Lịch sử lắc ({results.length})
          </h2>
          {results.length === 0 ? (
            <p className="text-amber-400 text-sm text-center py-3">Chưa có ai lắc...</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {results.map((result) => {
                const playerPhone = result.players?.phone;
                const prizeValue = result.prizes?.value || 0;
                const isCash = result.prizes?.type === 'cash';
                const canTransfer = isCash && prizeValue > 0 && playerPhone;

                return (
                  <div key={result.id} className="bg-amber-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-amber-900 font-medium text-sm">
                        {result.players?.name || '???'}
                      </span>
                      <span className="text-amber-600 font-semibold text-sm">
                        {isCash ? '💵' : '🍺'} {result.prizes?.name || '???'}
                      </span>
                    </div>

                    {/* MoMo transfer buttons */}
                    {canTransfer && (
                      <div className="flex gap-2 mt-2">
                        <a
                          href={getMoMoLink(playerPhone, prizeValue, `Li xi Tet - ${result.players?.name} - ${room.host_name}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-pink-500 text-white font-semibold text-xs hover:bg-pink-600 transition-colors active:scale-95"
                        >
                          <span>💸</span> Chuyển MoMo {formatFullCurrency(prizeValue)}
                        </a>
                        <button
                          onClick={() => openMoMoTransfer(playerPhone, result.players?.name || '???', prizeValue)}
                          className="py-2 px-3 rounded-lg bg-pink-100 text-pink-600 font-semibold text-xs hover:bg-pink-200 transition-colors"
                          title="Xem QR MoMo"
                        >
                          QR
                        </button>
                      </div>
                    )}

                    {isCash && prizeValue > 0 && !playerPhone && (
                      <p className="text-amber-400 text-xs mt-1.5 italic">
                        Người chơi chưa nhập SĐT MoMo
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* End Room */}
        {room.status !== 'ended' && (
          <button
            onClick={endRoom}
            disabled={ending}
            className="w-full py-3 rounded-2xl bg-red-900/40 text-red-200 font-semibold border border-red-400/30 hover:bg-red-900/60 transition-colors disabled:opacity-50"
          >
            {ending ? '⏳ Đang kết thúc...' : '🔒 Kết thúc phòng'}
          </button>
        )}
      </div>

      {/* MoMo QR Modal */}
      {momoQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setMomoQR(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-pink-600 font-bold text-lg mb-1">💸 Chuyển MoMo</h3>
              <p className="text-gray-600 text-sm mb-1">
                Cho <span className="font-bold">{momoQR.playerName}</span>
              </p>
              <p className="text-pink-600 font-bold text-2xl mb-4">
                {formatFullCurrency(momoQR.amount)}
              </p>

              <div className="inline-block bg-white p-3 rounded-xl border-2 border-pink-200 mb-4">
                <QRCodeSVG value={momoQR.url} size={200} level="M" />
              </div>

              <p className="text-gray-400 text-xs mb-4">
                Quét QR bằng app MoMo hoặc bấm nút bên dưới
              </p>

              <div className="space-y-2">
                <a
                  href={momoQR.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 rounded-xl bg-pink-500 text-white font-bold text-lg hover:bg-pink-600 transition-colors active:scale-95"
                >
                  Mở MoMo
                </a>
                <button
                  onClick={() => setMomoQR(null)}
                  className="block w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
