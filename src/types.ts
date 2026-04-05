
export interface CreditCard {
  id: string;
  holderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardType: 'visa' | 'mastercard' | 'amex' | 'other';
  color: string;
}

export const getCardType = (number: string): CreditCard['cardType'] => {
  if (number.startsWith('4')) return 'visa';
  if (number.startsWith('5')) return 'mastercard';
  if (number.startsWith('3')) return 'amex';
  return 'other';
};

export const formatCardNumber = (number: string): string => {
  const v = number.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || '';
  const parts = [];

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }

  if (parts.length) {
    return parts.join(' ');
  } else {
    return v;
  }
};

export const cardColors = [
  'bg-slate-800',
  'bg-blue-700',
  'bg-emerald-700',
  'bg-indigo-800',
  'bg-rose-800',
  'bg-amber-700',
  'bg-purple-800',
];
