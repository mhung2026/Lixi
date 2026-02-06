export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function formatCurrency(value: number): string {
  if (value === 0) return '0đ';
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return `${value.toLocaleString('vi-VN')}đ`;
}

export function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
}

export function parseCurrencyInput(input: string): number {
  const cleaned = input.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

export function getShareUrl(code: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/join/${code}`;
  }
  return `/join/${code}`;
}

/**
 * Generate MoMo deep link for transferring money
 * Format: https://nhantien.momo.vn/<phone>/<amount>
 */
export function getMoMoLink(phone: string, amount: number): string {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  return `https://nhantien.momo.vn/${cleanPhone}/${amount}`;
}

/**
 * Format phone number for display: 0901234567 → 090 123 4567
 */
export function formatPhone(phone: string): string {
  const clean = phone.replace(/[^\d]/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  return clean;
}

/**
 * Validate Vietnamese phone number
 */
export function isValidPhone(phone: string): boolean {
  const clean = phone.replace(/[^\d]/g, '');
  return /^0[3-9]\d{8}$/.test(clean);
}
