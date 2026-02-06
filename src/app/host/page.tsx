'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PrizeRow, { PrizeItem } from '@/components/PrizeRow';
import { formatFullCurrency } from '@/lib/utils';
import { GAME_TYPES, GameType } from '@/lib/gameData';
import Link from 'next/link';

const QUICK_CHIPS = [
  { label: '10K', value: 10000 },
  { label: '20K', value: 20000 },
  { label: '50K', value: 50000 },
  { label: '100K', value: 100000 },
  { label: '200K', value: 200000 },
  { label: '500K', value: 500000 },
  { label: '🍺', value: 0, type: 'item' as const },
];

let prizeIdCounter = 0;
function newPrize(overrides?: Partial<PrizeItem>): PrizeItem {
  prizeIdCounter++;
  return {
    id: `prize-${prizeIdCounter}`,
    type: 'cash',
    name: '',
    value: 0,
    quantity: 1,
    ...overrides,
  };
}

export default function HostPage() {
  const router = useRouter();
  const [hostName, setHostName] = useState('');
  const [hostPhone, setHostPhone] = useState('');
  const [mode, setMode] = useState<'online' | 'local'>('online');
  const [maxShakes, setMaxShakes] = useState(1);
  const [gameModes, setGameModes] = useState<GameType[]>(['shake']);
  const [prizes, setPrizes] = useState<PrizeItem[]>([
    newPrize({ name: 'Lì xì 100K', value: 100000, quantity: 3 }),
    newPrize({ name: 'Lì xì 50K', value: 50000, quantity: 5 }),
    newPrize({ name: 'Lì xì 20K', value: 20000, quantity: 10 }),
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalBudget = prizes.reduce((sum, p) => sum + (p.type === 'cash' ? p.value * p.quantity : 0), 0);
  const totalPrizes = prizes.reduce((sum, p) => sum + p.quantity, 0);

  function handleQuickChip(chip: typeof QUICK_CHIPS[number]) {
    if (chip.type === 'item') {
      setPrizes([...prizes, newPrize({ type: 'item', name: 'Uống 1 ly 🍺', value: 0, quantity: 1 })]);
    } else {
      setPrizes([...prizes, newPrize({ type: 'cash', name: `Lì xì ${chip.label}`, value: chip.value, quantity: 1 })]);
    }
  }

  function updatePrize(index: number, updated: PrizeItem) {
    setPrizes(prizes.map((p, i) => (i === index ? updated : p)));
  }

  function removePrize(index: number) {
    setPrizes(prizes.filter((_, i) => i !== index));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!hostName.trim()) {
      setError('Vui lòng nhập tên của bạn');
      return;
    }
    if (prizes.length === 0) {
      setError('Vui lòng thêm ít nhất 1 giải thưởng');
      return;
    }
    const invalidPrizes = prizes.filter((p) => !p.name.trim());
    if (invalidPrizes.length > 0) {
      setError('Vui lòng đặt tên cho tất cả giải thưởng');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host_name: hostName.trim(),
          host_phone: hostPhone || null,
          mode,
          max_shakes: maxShakes,
          game_modes: gameModes.length > 0 ? gameModes : ['shake'],
          prizes: prizes.map((p) => ({
            type: p.type,
            name: p.name.trim(),
            value: p.value,
            quantity: p.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Tạo phòng thất bại');
        return;
      }

      const data = await res.json();
      router.push(`/room/${data.code}`);
    } catch {
      setError('Lỗi kết nối, thử lại sau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <Link href="/" className="text-red-200/60 text-sm hover:text-white transition-colors font-medium">
          ← Về trang chủ
        </Link>
        <h1 className="text-2xl font-black text-gold mt-2 tracking-tight">
          🧧 MỞ KHO LÌ XÌ
        </h1>
        <div className="gold-line w-32 mx-auto my-2" />
        <p className="text-red-200/70 text-sm">Vui Tết Mê Ly</p>
      </div>

      <form onSubmit={handleCreate} className="max-w-lg mx-auto space-y-6">
        {/* Info Section */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-amber-800 font-black text-lg mb-4">📋 THÔNG TIN</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-amber-700 text-sm font-semibold mb-1">Tên chủ phòng</label>
              <input
                type="text"
                placeholder="VD: Anh Tú"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 placeholder-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-amber-700 text-sm font-semibold mb-1">
                SĐT MoMo <span className="font-normal text-amber-400">(không bắt buộc)</span>
              </label>
              <input
                type="tel"
                placeholder="VD: 0901234567"
                value={hostPhone}
                onChange={(e) => setHostPhone(e.target.value.replace(/[^\d]/g, ''))}
                maxLength={10}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 placeholder-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <p className="text-amber-400 text-xs mt-1">
                Nhập SĐT để tạo link chuyển MoMo nhanh cho người trúng giải
              </p>
            </div>

            <div>
              <label className="block text-amber-700 text-sm font-semibold mb-2">Chế độ chơi</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('online')}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    mode === 'online'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  📱 Online (QR)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('local')}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    mode === 'local'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  🤝 Local (Truyền tay)
                </button>
              </div>
              <p className="text-amber-500 text-xs mt-1.5">
                {mode === 'online'
                  ? 'Mỗi người quét QR trên máy mình để tham gia'
                  : 'Truyền tay 1 điện thoại, ai tới lượt thì cầm lắc'}
              </p>
            </div>

            <div>
              <label className="block text-amber-700 text-sm font-semibold mb-1">Số lần lắc mỗi người</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMaxShakes(Math.max(1, maxShakes - 1))}
                  className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 font-bold text-lg hover:bg-amber-200 transition-colors"
                >
                  -
                </button>
                <span className="text-amber-900 font-bold text-xl w-8 text-center">{maxShakes}</span>
                <button
                  type="button"
                  onClick={() => setMaxShakes(Math.min(10, maxShakes + 1))}
                  className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 font-bold text-lg hover:bg-amber-200 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-amber-700 text-sm font-semibold mb-2">Trò chơi</label>
              <p className="text-amber-400 text-xs mb-2">Chọn các trò chơi (random mỗi lượt). Chọn nhiều cho đa dạng!</p>
              <div className="space-y-2">
                {GAME_TYPES.map((game) => {
                  const isActive = gameModes.includes(game.id);
                  return (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => {
                        if (isActive) {
                          const next = gameModes.filter((g) => g !== game.id);
                          setGameModes(next.length > 0 ? next : [game.id]);
                        } else {
                          setGameModes([...gameModes, game.id]);
                        }
                      }}
                      className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left text-sm transition-all ${
                        isActive
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span className="text-xl">{game.emoji}</span>
                      <div className="flex-1">
                        <span className="font-semibold">{game.name}</span>
                        <span className="block text-xs opacity-75">{game.description}</span>
                      </div>
                      {isActive && <span className="text-lg">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Prize Pool Section */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-amber-800 font-black text-lg mb-4">🎁 KHO LÌ XÌ</h2>

          {/* Quick Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleQuickChip(chip)}
                className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 font-semibold text-sm hover:bg-amber-200 active:scale-95 transition-all"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Prize List */}
          <div className="space-y-3">
            {prizes.map((prize, index) => (
              <PrizeRow
                key={prize.id}
                prize={prize}
                onChange={(updated) => updatePrize(index, updated)}
                onRemove={() => removePrize(index)}
              />
            ))}
          </div>

          {/* Add Prize */}
          <button
            type="button"
            onClick={() => setPrizes([...prizes, newPrize()])}
            className="w-full mt-3 py-2.5 rounded-xl border-2 border-dashed border-amber-300 text-amber-500 font-semibold hover:border-amber-400 hover:text-amber-600 transition-colors"
          >
            + Thêm giải
          </button>
        </div>

        {/* Summary & Submit */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-amber-500 text-sm">Tổng ngân sách</p>
              <p className="text-amber-900 font-bold text-xl">{formatFullCurrency(totalBudget)}</p>
            </div>
            <div className="text-right">
              <p className="text-amber-500 text-sm">Tổng giải</p>
              <p className="text-amber-900 font-bold text-xl">{totalPrizes} giải</p>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-3 bg-red-50 rounded-lg py-2 px-3 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-red py-4 rounded-2xl text-xl disabled:opacity-50"
          >
            {loading ? '⏳ ĐANG TẠO...' : '🧧 TẠO PHÒNG'}
          </button>
        </div>
      </form>
    </div>
  );
}
