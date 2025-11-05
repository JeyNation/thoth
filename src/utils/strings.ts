// Common string utilities

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * Converts a non-negative integer to English words (simple form).
 * Examples: 1 -> One, 21 -> Twenty one, 105 -> One hundred five.
 * Falls back to numeric string for very large values.
 */
export const numberToWords = (n: number): string => {
  if (!Number.isFinite(n) || n < 0) return String(n);
  const ones = [
    'zero','one','two','three','four','five','six','seven','eight','nine','ten',
    'eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'
  ];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  if (n < 20) return capitalize(ones[n]);
  if (n < 100) {
    const t = Math.floor(n / 10);
    const r = n % 10;
    return capitalize(tens[t] + (r ? ' ' + ones[r] : ''));
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const r = n % 100;
    const rest = r ? ' ' + numberToWords(r).toLowerCase() : '';
    return capitalize(ones[h] + ' hundred' + rest);
  }
  // Fallback for larger numbers
  return String(n);
};
