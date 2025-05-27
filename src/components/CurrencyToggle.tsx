'use client';

import React from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function CurrencyToggle() {
  const { currency, toggleCurrency, exchangeRate, isLoading } = useCurrency();

  if (isLoading) {
    return (
      <button 
        className="flex items-center justify-center px-3 py-2 text-sm bg-gray-100 rounded-md cursor-wait"
        disabled
      >
        <span className="w-4 h-4 mr-1 rounded-full animate-pulse bg-gray-300"></span>
        <span>Cargando...</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleCurrency}
      className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 transition-colors rounded-md hover:bg-gray-100"
      title={`Cambiar a ${currency === 'CLP' ? 'USD' : 'CLP'}`}
    >
      <span className="flex items-center justify-center w-5 h-5 font-bold text-white bg-blue-600 rounded-full">
        {currency === 'CLP' ? '$' : '$'}
      </span>
      <span>{currency}</span>
      <span className="hidden ml-1 text-xs text-gray-500 md:inline-block">
        {currency === 'CLP' ? '1 USD =' : '1 CLP ='} 
        {currency === 'CLP' 
          ? ` $${exchangeRate.toLocaleString('es-CL')} CLP` 
          : ` $${(1/exchangeRate).toFixed(6)} USD`}
      </span>
    </button>
  );
} 