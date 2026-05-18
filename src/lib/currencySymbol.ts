const SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', INR: '₹', KRW: '₩',
  CHF: 'CHF ', AUD: 'A$', CAD: 'C$', HKD: 'HK$', SGD: 'S$', TWD: 'NT$',
  SEK: 'kr', NOK: 'kr', DKK: 'kr', BRL: 'R$', MXN: 'MX$', ZAR: 'R',
  RUB: '₽', TRY: '₺', SAR: '﷼', AED: 'د.إ', THB: '฿', MYR: 'RM',
  IDR: 'Rp', PHP: '₱', VND: '₫', PLN: 'zł', CZK: 'Kč', HUF: 'Ft',
  ILS: '₪', CLP: 'CL$', COP: 'CO$', PEN: 'S/', ARS: 'AR$', NZD: 'NZ$',
  QAR: 'QR', KWD: 'KD', BHD: 'BD', OMR: 'OMR', NGN: '₦', EGP: 'E£',
  PKR: '₨', BDT: '৳', LKR: '₨', NPR: '₨', MMK: 'K', GHS: 'GH₵',
};

export function currencySymbol(currency?: string): string {
  if (!currency) return '$';
  return SYMBOLS[currency.toUpperCase()] ?? '$';
}
