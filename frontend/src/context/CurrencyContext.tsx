import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';

export type CurrencyType = 'USD' | 'INR' | 'EUR';

interface CurrencyContextType {
  currency: CurrencyType;
  symbol: string;
  currencyName: string;
  rate: number;
  setCurrency: (c: CurrencyType | string) => void;
  convert: (usdVal: number | null | undefined) => number;
  formatRate: (usdRate: number | null | undefined, decimals?: number) => string;
  formatAmount: (usdAmount: number | null | undefined, compact?: boolean) => string;
  formatUnitRate: (usdRate: number | null | undefined, unit?: string, decimals?: number) => string;
}

const RATES: Record<CurrencyType, { rate: number; symbol: string; name: string }> = {
  USD: { rate: 1.0, symbol: '$', name: 'USD' },
  INR: { rate: 83.50, symbol: '₹', name: 'INR' },
  EUR: { rate: 0.92, symbol: '€', name: 'EUR' },
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  symbol: '$',
  currencyName: 'USD',
  rate: 1.0,
  setCurrency: () => {},
  convert: (v) => v || 0,
  formatRate: (v) => `$${(v || 0).toFixed(2)}`,
  formatAmount: (v) => `$${(v || 0).toLocaleString()}`,
  formatUnitRate: (v, u = '/ MT') => `$${(v || 0).toFixed(2)} ${u}`,
});

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyType>(() => {
    const saved = localStorage.getItem('sail_freight_currency');
    if (saved === 'INR' || saved === 'EUR' || saved === 'USD') {
      return saved;
    }
    return 'USD';
  });

  useEffect(() => {
    // Initial fetch from backend settings if not set locally
    settingsService.getSettings().then((settings) => {
      if (settings?.reporting_currency) {
        if (settings.reporting_currency.includes('INR') || settings.reporting_currency.includes('₹')) {
          setCurrencyState('INR');
          localStorage.setItem('sail_freight_currency', 'INR');
        } else if (settings.reporting_currency.includes('EUR') || settings.reporting_currency.includes('€')) {
          setCurrencyState('EUR');
          localStorage.setItem('sail_freight_currency', 'EUR');
        } else {
          setCurrencyState('USD');
          localStorage.setItem('sail_freight_currency', 'USD');
        }
      }
    }).catch(() => {});
  }, []);

  const setCurrency = (c: CurrencyType | string) => {
    let target: CurrencyType = 'USD';
    if (c === 'INR' || c.includes('INR') || c.includes('₹') || c.includes('Rupee') || c.includes('Domestic')) {
      target = 'INR';
    } else if (c === 'EUR' || c.includes('EUR') || c.includes('€') || c.includes('Continental')) {
      target = 'EUR';
    } else {
      target = 'USD';
    }
    setCurrencyState(target);
    localStorage.setItem('sail_freight_currency', target);
  };

  const currentConfig = RATES[currency] || RATES.USD;

  const convert = (usdVal: number | null | undefined): number => {
    if (usdVal === null || usdVal === undefined || isNaN(usdVal)) return 0;
    return Number((usdVal * currentConfig.rate).toFixed(2));
  };

  const formatRate = (usdRate: number | null | undefined, decimals: number = 2): string => {
    if (usdRate === null || usdRate === undefined || isNaN(usdRate)) return `${currentConfig.symbol}0.00`;
    const converted = usdRate * currentConfig.rate;
    
    if (currency === 'INR') {
      return `${currentConfig.symbol}${converted.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}`;
    }
    return `${currentConfig.symbol}${converted.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  const formatAmount = (usdAmount: number | null | undefined, compact: boolean = false): string => {
    if (usdAmount === null || usdAmount === undefined || isNaN(usdAmount)) return `${currentConfig.symbol}0`;
    const converted = usdAmount * currentConfig.rate;

    if (compact) {
      if (currency === 'INR') {
        if (converted >= 10000000) {
          return `${currentConfig.symbol}${(converted / 10000000).toFixed(2)} Cr`;
        }
        if (converted >= 100000) {
          return `${currentConfig.symbol}${(converted / 100000).toFixed(2)} L`;
        }
      } else {
        if (converted >= 1000000) {
          return `${currentConfig.symbol}${(converted / 1000000).toFixed(2)}M`;
        }
        if (converted >= 1000) {
          return `${currentConfig.symbol}${(converted / 1000).toFixed(1)}k`;
        }
      }
    }

    if (currency === 'INR') {
      return `${currentConfig.symbol}${Math.round(converted).toLocaleString('en-IN')}`;
    }
    return `${currentConfig.symbol}${Math.round(converted).toLocaleString('en-US')}`;
  };

  const formatUnitRate = (usdRate: number | null | undefined, unit: string = '/ MT', decimals: number = 2): string => {
    return `${formatRate(usdRate, decimals)} ${unit}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        symbol: currentConfig.symbol,
        currencyName: currentConfig.name,
        rate: currentConfig.rate,
        setCurrency,
        convert,
        formatRate,
        formatAmount,
        formatUnitRate,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
