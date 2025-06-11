'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDollarRate } from '@/services/exchangeService';
import { sessionCache } from '@/lib/cache';

// Definir tipos
type Currency = 'CLP' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  exchangeRate: number;
  toggleCurrency: () => void;
  formatPrice: (price: number) => string;
  convertPrice: (priceInCLP: number) => number;
  isLoading: boolean;
}

// Crear contexto
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Hook para usar el contexto
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency debe ser usado dentro de un CurrencyProvider');
  }
  return context;
};

// Proveedor del contexto
export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicializar con el valor de localStorage o 'CLP' por defecto
  const [currency, setCurrency] = useState<Currency>('CLP');
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cargar la preferencia de moneda desde localStorage al iniciar
  useEffect(() => {
    // Verificar si estamos en el navegador para evitar errores en SSR
    if (typeof window !== 'undefined') {
      const savedCurrency = localStorage.getItem('preferredCurrency');
      if (savedCurrency === 'USD' || savedCurrency === 'CLP') {
        setCurrency(savedCurrency);
      }
    }
  }, []);

  // Cargar el tipo de cambio al iniciar
  useEffect(() => {
    const loadExchangeRate = async () => {
      try {
        // Intentar obtener del caché primero
        const cachedRate = sessionCache.get<{value: number}>('/exchange/dollar');
        if (cachedRate) {
          setExchangeRate(cachedRate.value);
          setIsLoading(false);
          return;
        }

        // Si no está en caché, hacer la llamada a la API
        const data = await getDollarRate();
        setExchangeRate(data.value);
        
        // Guardar en caché por 1 hora
        sessionCache.set('/exchange/dollar', data, 60 * 60 * 1000);
      } catch (error) {
        console.error('Error al cargar el tipo de cambio:', error);
        // Valor de respaldo si falla la API
        setExchangeRate(938.28);
      } finally {
        setIsLoading(false);
      }
    };

    loadExchangeRate();
  }, []);

  // Función para alternar entre monedas
  const toggleCurrency = () => {
    setCurrency(prev => {
      const newCurrency = prev === 'CLP' ? 'USD' : 'CLP';
      // Guardar en localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferredCurrency', newCurrency);
      }
      return newCurrency;
    });
  };

  // Función para convertir precios de CLP a USD
  const convertPrice = (priceInCLP: number): number => {
    if (!exchangeRate) return 0;
    return currency === 'CLP' ? priceInCLP : Number((priceInCLP / exchangeRate).toFixed(2));
  };

  // Función para formatear precios según la moneda
  const formatPrice = (price: number): string => {
    if (currency === 'CLP') {
      return `$${price.toLocaleString('es-CL')}`;
    } else {
      const usdPrice = Number((price / exchangeRate).toFixed(2));
      return `US$${usdPrice.toLocaleString('en-US')}`;
    }
  };

  const value = {
    currency,
    exchangeRate,
    toggleCurrency,
    formatPrice,
    convertPrice,
    isLoading
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext; 