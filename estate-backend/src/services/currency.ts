// Currency conversion and handling service for Kenyan markets

import { cacheGet, cacheSet } from "./cache.js";

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

const CACHE_DURATION_SECONDS = 3600; // 1 hour

export async function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  useCache = true
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const cacheKey = `currency:${fromCurrency}/${toCurrency}`;

  if (useCache) {
    const cached = await cacheGet<{ rate: number }>(cacheKey);
    if (cached) {
      return amount * cached.rate;
    }
  }

  const rate = EXCHANGE_RATES[`${fromCurrency}/${toCurrency}`];
  if (!rate) {
    throw new Error(`Exchange rate not available for ${fromCurrency}/${toCurrency}`);
  }

  await cacheSet(cacheKey, { rate }, CACHE_DURATION_SECONDS);

  return amount * rate;
}

export function formatCurrency(amount: number, currency: Currency = Currency.KSH): string {
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
