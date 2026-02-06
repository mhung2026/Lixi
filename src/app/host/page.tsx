'use client';

import { useState, useEffect } from 'react';
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
  const [customSentences, setCustomSentences] = useState<string[]>([]);
  const [newSentence, setNewSentence] = useState('');
  const [customQuestions, setCustomQuestions] = useState<{ question: string; answer: string }[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [prizes, setPrizes] = useState<PrizeItem[]>([
    newPrize({ name: 'Lì xì 100K', value: 100000, quantity: 3 }),
    newPrize({ name: 'Lì xì 50K', value: 50000, quantity: 5 }),
    newPrize({ name: 'Lì xì 20K', value: 20000, quantity: 10 }),
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('player_info') || '{}');
      if (saved.name && !hostName) setHostName(saved.name);
      if (saved.phone && !hostPhone) setHostPhone(saved.phone);
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          custom_sentences: customSentences.length > 0 ? customSentences : null,
          custom_questions: customQuestions.length > 0 ? customQuestions : null,
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

      // Save to localStorage
      try {
        const myRooms = JSON.parse(localStorage.getItem('my_rooms') || '[]');
        myRooms.unshift({ code: data.code, host_name: hostName.trim(), created_at: new Date().toISOString() });
        localStorage.setItem('my_rooms', JSON.stringify(myRooms.slice(0, 20)));
        // Save player info (name + phone)
        localStorage.setItem('player_info', JSON.stringify({ name: hostName.trim(), phone: hostPhone || '' }));
      } catch { /* ignore */ }

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

        {/* Custom Scramble Sentences */}
        {gameModes.includes('scramble') && (
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-amber-800 font-black text-lg mb-2">🔤 CÂU XẾP CHỮ</h2>
            <p className="text-amber-400 text-xs mb-3">
              Nhập câu chúc Tết để người chơi sắp xếp lại. Để trống sẽ dùng câu mặc định.
            </p>
            <div className="space-y-2 mb-3">
              {customSentences.map((s, i) => (
                <div key={i} className="flex items-center gap-2 bg-amber-50 rounded-xl py-2 px-3 border border-amber-100">
                  <span className="flex-1 text-amber-900 text-sm font-medium">{s}</span>
                  <button
                    type="button"
                    onClick={() => setCustomSentences(customSentences.filter((_, idx) => idx !== i))}
                    className="text-red-400 hover:text-red-600 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="VD: Chúc Mừng Năm Mới"
                value={newSentence}
                onChange={(e) => setNewSentence(e.target.value)}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 placeholder-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (newSentence.trim() && newSentence.trim().includes(' ')) {
                    setCustomSentences([...customSentences, newSentence.trim()]);
                    setNewSentence('');
                  }
                }}
                className="py-2 px-4 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-all active:scale-95"
              >
                + Thêm
              </button>
            </div>
            <p className="text-amber-400 text-xs mt-1.5">Câu phải có ít nhất 2 từ</p>
          </div>
        )}

        {/* Custom Quiz Questions */}
        {gameModes.includes('quiz') && (
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-amber-800 font-black text-lg mb-2">❓ CÂU HỎI ĐỐ VUI</h2>
            <p className="text-amber-400 text-xs mb-3">
              Nhập câu hỏi và đáp án đúng. Người chơi nhập câu trả lời (không cần dấu). Để trống sẽ dùng câu hỏi mặc định.
            </p>
            <div className="space-y-2 mb-3">
              {customQuestions.map((q, i) => (
                <div key={i} className="bg-amber-50 rounded-xl py-2.5 px-3 border border-amber-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-amber-900 text-sm font-semibold">{q.question}</p>
                      <p className="text-green-600 text-xs mt-0.5">Đáp án: {q.answer}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomQuestions(customQuestions.filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:text-red-600 text-sm font-bold mt-0.5"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Câu hỏi, VD: Năm 2026 là năm con gì?"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 placeholder-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Đáp án đúng, VD: Ngựa"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 placeholder-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newQuestion.trim() && newAnswer.trim()) {
                      setCustomQuestions([...customQuestions, { question: newQuestion.trim(), answer: newAnswer.trim() }]);
                      setNewQuestion('');
                      setNewAnswer('');
                    }
                  }}
                  className="py-2 px-4 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-all active:scale-95"
                >
                  + Thêm
                </button>
              </div>
            </div>
          </div>
        )}

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
