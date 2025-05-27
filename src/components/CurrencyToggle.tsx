'use client';

import React from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { FaDollarSign } from 'react-icons/fa';

export default function CurrencyToggle() {
  const { currency, toggleCurrency, isLoading } = useCurrency();

  if (isLoading) {
    return (
      <button 
        className="flex items-center justify-center text-white opacity-70 cursor-wait"
        disabled
      >
        <span className="w-4 h-4 rounded-full animate-pulse bg-white/30"></span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleCurrency}
      className="flex items-center justify-center gap-1.5 text-white hover:text-blue-200 transition-colors"
      title={`Cambiar a ${currency === 'CLP' ? 'USD' : 'CLP'}`}
      aria-label={`Cambiar moneda a ${currency === 'CLP' ? 'USD' : 'CLP'}`}
    >
      <FaDollarSign className="text-lg" />
      <span className="text-sm font-medium">{currency}</span>
    </button>
  );
} 