// Currency conversion and handling service for Kenyan markets

export enum Currency {
  KSH = 'KSH',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
}

interface ExchangeRates {
  [key: string]: number;
}

// Mock exchange rates - in production, use a real API like OpenExchangeRates or XE.com
const EXCHANGE_RATES: ExchangeRates = {
  'KSH/USD': 0.0077,
  'USD/KSH': 130.0,
  'EUR/KSH': 142.0,
  'GBP/KSH': 164.0,
  'KSH/EUR': 0.0070,
  'KSH/GBP': 0.0061,
};

// Cache for recent exchange rates with timestamp
interface RateCache {
  timestamp: number;
  rate: number;
}

const rateCache: Map<string, RateCache> = new Map();
const CACHE_DURATION_MS = 3600000; // 1 hour

export async function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  useCache = true
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const cacheKey = `${fromCurrency}/${toCurrency}`;

  // Check cache first
  if (useCache && rateCache.has(cacheKey)) {
    const cached = rateCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      return amount * cached.rate;
    }
  }

  // Get rate
  const rate = EXCHANGE_RATES[cacheKey];
  if (!rate) {
    throw new Error(`Exchange rate not available for ${cacheKey}`);
  }

  // Cache the rate
  rateCache.set(cacheKey, {
    timestamp: Date.now(),
    rate,
  });

  return amount * rate;
}

export function formatCurrency(amount: number, currency: Currency = Currency.KSH): string {
  const symbols: Record<Currency, string> = {
    KSH: 'KSh',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  const formatter = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

export function parsePrice(priceString: string): { amount: number; currency: Currency } {
  const kshPattern = /^(KSh|KES|Ksh|kes)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/;
  const usdPattern = /^\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/;
  const eurPattern = /^€\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/;
  const gbpPattern = /^£\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/;

  let match;
  let currency: Currency;

  if ((match = priceString.match(kshPattern))) {
    currency = Currency.KSH;
  } else if ((match = priceString.match(usdPattern))) {
    currency = Currency.USD;
  } else if ((match = priceString.match(eurPattern))) {
    currency = Currency.EUR;
  } else if ((match = priceString.match(gbpPattern))) {
    currency = Currency.GBP;
  } else {
    throw new Error('Invalid price format');
  }

  const amount = parseFloat(match![2].replace(/,/g, ''));
  return { amount, currency };
}

export function isValidCurrency(currency: string): boolean {
  return Object.values(Currency).includes(currency as Currency);
}
