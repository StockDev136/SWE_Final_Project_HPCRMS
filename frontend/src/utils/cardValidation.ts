export type CardBrand = "VISA" | "MASTERCARD" | "AMEX" | "DISCOVER" | "UNKNOWN";

const BRAND_LENGTHS: Record<CardBrand, number[]> = {
  VISA: [16],
  MASTERCARD: [16],
  AMEX: [15],
  DISCOVER: [16],
  UNKNOWN: [12, 13, 14, 15, 16, 17, 18, 19],
};

const BRAND_CVV_LENGTH: Record<CardBrand, number> = {
  VISA: 3,
  MASTERCARD: 3,
  AMEX: 4,
  DISCOVER: 3,
  UNKNOWN: 3,
};

/** Detects card brand from the leading digits (standard BIN-range prefixes). */
export function detectCardBrand(cardNumber: string): CardBrand {
  const digits = cardNumber.replace(/\D/g, "");
  if (/^4/.test(digits)) return "VISA";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return "MASTERCARD";
  if (/^3[47]/.test(digits)) return "AMEX";
  if (/^(6011|65|64[4-9])/.test(digits)) return "DISCOVER";
  return "UNKNOWN";
}

export function cvvLengthForBrand(brand: CardBrand): number {
  return BRAND_CVV_LENGTH[brand];
}

/** Formats digits into groups as the user types — Amex uses 4-6-5, others 4-4-4-4. */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  const brand = detectCardBrand(digits);
  if (brand === "AMEX") {
    const parts = [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean);
    return parts.join(" ");
  }
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

/** Standard Luhn checksum — the same algorithm every real card network uses. */
export function isValidLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 12) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function isValidCardLength(cardNumber: string, brand: CardBrand): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  return BRAND_LENGTHS[brand].includes(digits.length);
}

/** Validates MM/YY expiry text and that it isn't already in the past. */
export function isValidExpiry(expiry: string): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!match) return false;
  const month = parseInt(match[1], 10);
  const year = 2000 + parseInt(match[2], 10);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  return true;
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
