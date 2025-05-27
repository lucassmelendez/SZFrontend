'use client';

import React from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface PriceProps {
  amount: number;
  className?: string;
  showOriginal?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Price({ 
  amount, 
  className = '', 
  showOriginal = false,
  size = 'md'
}: PriceProps) {
  const { currency, formatPrice, convertPrice } = useCurrency();
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl font-bold'
  };
  
  const convertedAmount = convertPrice(amount);
  
  return (
    <span className={`${className} inline-block`}>
      <span className={`${sizeClasses[size]}`}>
        {currency === 'CLP' 
          ? `$${amount.toLocaleString('es-CL')}` 
          : `US$${convertedAmount.toLocaleString('en-US')}`}
      </span>
      
      {showOriginal && currency === 'USD' && (
        <span className="block text-xs text-gray-500">
          (${amount.toLocaleString('es-CL')} CLP)
        </span>
      )}
    </span>
  );
} 