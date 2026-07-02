import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'PYG' | 'USD';

interface SettingsContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatCurrency: (value: number) => string;
  formatCompactCurrency: (value: number) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(() => {
    return (localStorage.getItem('app_currency') as Currency) || 'PYG';
  });

  useEffect(() => {
    localStorage.setItem('app_currency', currency);
  }, [currency]);

  const formatCurrency = (value: number) => {
    if (currency === 'PYG') {
      return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: 'PYG',
        maximumFractionDigits: 0
      }).format(value);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(value);
    }
  };

  const formatCompactCurrency = (value: number) => {
    return new Intl.NumberFormat(currency === 'PYG' ? 'es-PY' : 'en-US', {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  return (
    <SettingsContext.Provider value={{ currency, setCurrency, formatCurrency, formatCompactCurrency }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
