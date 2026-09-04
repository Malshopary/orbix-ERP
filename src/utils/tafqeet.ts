/**
 * Arabic Number to Words (Tafqeet) Utility
 * Converts numeric amounts into written Arabic text for financial receipts, vouchers, and invoices.
 */

const ones = [
  '',
  'واحد',
  'اثنان',
  'ثلاثة',
  'أربعة',
  'خمسة',
  'ستة',
  'سبعة',
  'ثمانية',
  'تسعة',
  'عشرة',
  'أحد عشر',
  'اثنا عشر',
  'ثلاثة عشر',
  'أربعة عشر',
  'خمسة عشر',
  'ستة عشر',
  'سبعة عشر',
  'ثمانية عشر',
  'تسعة عشر',
];

const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];

const hundreds = [
  '',
  'مائة',
  'مئتان',
  'ثلاثمائة',
  'أربعمائة',
  'خمسمائة',
  'ستمائة',
  'سبعمائة',
  'ثمانمائة',
  'تسعمائة',
];

function convertThreeDigits(num: number): string {
  let text = '';
  const h = Math.floor(num / 100);
  const remainder = num % 100;

  if (h > 0) {
    text += hundreds[h];
  }

  if (remainder > 0) {
    if (text !== '') text += ' و';

    if (remainder < 20) {
      text += ones[remainder];
    } else {
      const o = remainder % 10;
      const t = Math.floor(remainder / 10);
      if (o > 0) {
        text += `${ones[o]} و${tens[t]}`;
      } else {
        text += tens[t];
      }
    }
  }

  return text;
}

export interface CurrencyConfig {
  singular: string;
  plural: string;
  fractionSingular: string;
  fractionPlural: string;
  fractionUnits: number; // e.g., 100 for piastres, 1000 for fils
}

const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  EGP: {
    singular: 'جنيه مصري',
    plural: 'جنيهات مصرية',
    fractionSingular: 'قرش',
    fractionPlural: 'قروش',
    fractionUnits: 100,
  },
  SAR: {
    singular: 'ريال سعودي',
    plural: 'ريالات سعودية',
    fractionSingular: 'هللة',
    fractionPlural: 'هللات',
    fractionUnits: 100,
  },
  AED: {
    singular: 'درهم إماراتي',
    plural: 'دراهم إماراتية',
    fractionSingular: 'فلس',
    fractionPlural: 'فلوس',
    fractionUnits: 100,
  },
  USD: {
    singular: 'دولار أمريكي',
    plural: 'دولارات أمريكية',
    fractionSingular: 'سنت',
    fractionPlural: 'سنتات',
    fractionUnits: 100,
  },
  EUR: {
    singular: 'يورو',
    plural: 'يورو',
    fractionSingular: 'سنت',
    fractionPlural: 'سنتات',
    fractionUnits: 100,
  },
  KWD: {
    singular: 'دينار كويتي',
    plural: 'دنانير كويتية',
    fractionSingular: 'فلس',
    fractionPlural: 'فلوس',
    fractionUnits: 1000,
  },
};

/**
 * Converts a number to written Arabic words with currency phrasing
 * Example: 1540.50 => "فقط ألف وخمسمائة وأربعون جنيه مصري وخمسون قرشاً لا غير"
 */
export function tafqeet(amount: number, currencyCode: string = 'EGP'): string {
  if (isNaN(amount) || amount === 0) {
    return 'فقط صفر لا غير';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const integerPart = Math.floor(absAmount);
  const cfg = CURRENCY_CONFIGS[currencyCode.toUpperCase()] || CURRENCY_CONFIGS.EGP;
  const fractionFactor = cfg.fractionUnits;
  const fractionPart = Math.round((absAmount - integerPart) * fractionFactor);

  if (integerPart === 0 && fractionPart === 0) {
    return 'فقط صفر لا غير';
  }

  const parts: string[] = [];

  // Billions
  const billions = Math.floor(integerPart / 1000000000);
  if (billions > 0) {
    if (billions === 1) parts.push('مليار');
    else if (billions === 2) parts.push('ملياران');
    else if (billions >= 3 && billions <= 10) parts.push(`${convertThreeDigits(billions)} مليارات`);
    else parts.push(`${convertThreeDigits(billions)} مليار`);
  }

  // Millions
  const millions = Math.floor((integerPart % 1000000000) / 1000000);
  if (millions > 0) {
    if (millions === 1) parts.push('مليون');
    else if (millions === 2) parts.push('مليونان');
    else if (millions >= 3 && millions <= 10) parts.push(`${convertThreeDigits(millions)} ملايين`);
    else parts.push(`${convertThreeDigits(millions)} مليون`);
  }

  // Thousands
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  if (thousands > 0) {
    if (thousands === 1) parts.push('ألف');
    else if (thousands === 2) parts.push('ألفان');
    else if (thousands >= 3 && thousands <= 10) parts.push(`${convertThreeDigits(thousands)} آلاف`);
    else parts.push(`${convertThreeDigits(thousands)} ألف`);
  }

  // Remaining three digits
  const remainder = integerPart % 1000;
  if (remainder > 0) {
    parts.push(convertThreeDigits(remainder));
  }

  let words = parts.join(' و');

  // Add currency name
  if (integerPart > 0) {
    const currencyName = integerPart >= 3 && integerPart <= 10 ? cfg.plural : cfg.singular;
    words += ` ${currencyName}`;
  }

  // Add fractions
  if (fractionPart > 0) {
    const fractionWords = convertThreeDigits(fractionPart);
    const fractionName = fractionPart >= 3 && fractionPart <= 10 ? cfg.fractionPlural : cfg.fractionSingular;
    if (words) {
      words += ` و${fractionWords} ${fractionName}`;
    } else {
      words = `${fractionWords} ${fractionName}`;
    }
  }

  return `${isNegative ? 'سالب ' : ''}فقط ${words} لا غير`;
}
