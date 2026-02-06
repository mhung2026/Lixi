'use client';

import { formatFullCurrency, parseCurrencyInput } from '@/lib/utils';

export interface PrizeItem {
  id: string;
  type: 'cash' | 'item';
  name: string;
  value: number;
  quantity: number;
}

interface PrizeRowProps {
  prize: PrizeItem;
  onChange: (updated: PrizeItem) => void;
  onRemove: () => void;
}

export default function PrizeRow({ prize, onChange, onRemove }: PrizeRowProps) {
  return (
    <div className="flex items-center gap-2 bg-amber-50 rounded-xl p-3 border border-amber-200">
      {/* Type toggle */}
      <button
        type="button"
        onClick={() => onChange({ ...prize, type: prize.type === 'cash' ? 'item' : 'cash' })}
        className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl hover:bg-amber-200 transition-colors shrink-0"
        title={prize.type === 'cash' ? 'Tiền' : 'Vật phẩm'}
      >
        {prize.type === 'cash' ? '💵' : '🍺'}
      </button>

      {/* Name input */}
      <input
        type="text"
        placeholder="Tên giải..."
        value={prize.name}
        onChange={(e) => onChange({ ...prize, name: e.target.value })}
        className="flex-1 min-w-0 py-2 px-3 rounded-lg bg-white border border-amber-200 text-amber-900 placeholder-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      />

      {/* Value input (only for cash) */}
      {prize.type === 'cash' && (
        <input
          type="text"
          placeholder="Giá trị"
          value={prize.value ? formatFullCurrency(prize.value) : ''}
          onChange={(e) => onChange({ ...prize, value: parseCurrencyInput(e.target.value) })}
          className="w-28 py-2 px-3 rounded-lg bg-white border border-amber-200 text-amber-900 placeholder-amber-300 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      )}

      {/* Quantity */}
      <div className="flex items-center bg-amber-100 rounded-lg shrink-0">
        <button
          type="button"
          onClick={() => onChange({ ...prize, quantity: Math.max(1, prize.quantity - 1) })}
          className="w-8 h-8 flex items-center justify-center text-amber-700 hover:bg-amber-200 rounded-l-lg transition-colors"
        >
          -
        </button>
        <input
          type="number"
          min={1}
          max={999}
          value={prize.quantity}
          onChange={(e) => onChange({ ...prize, quantity: Math.max(1, Math.min(999, parseInt(e.target.value) || 1)) })}
          onFocus={(e) => e.target.select()}
          className="w-10 h-8 text-center bg-transparent text-amber-900 font-semibold text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange({ ...prize, quantity: Math.min(999, prize.quantity + 1) })}
          className="w-8 h-8 flex items-center justify-center text-amber-700 hover:bg-amber-200 rounded-r-lg transition-colors"
        >
          +
        </button>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
      >
        ✕
      </button>
    </div>
  );
}
