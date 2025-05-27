// API URLs
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Construir URL
const buildApiUrl = (path: string) => {
  let baseUrl = API_BASE_URL;
  
  if (baseUrl.startsWith('http://') && !baseUrl.includes('localhost')) {
    baseUrl = baseUrl.replace('http://', 'https://');
  }
  
  if (baseUrl.endsWith('/api')) {
    return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
  } else {
    return `${baseUrl}/api${path.startsWith('/') ? path : '/' + path}`;
  }
};

// Tipos
export interface ExchangeRate {
  date: string;
  value: number;
  description: string;
}

// Obtener tasa de cambio del dólar
export const getDollarRate = async (): Promise<ExchangeRate> => {
  try {
    const apiUrl = buildApiUrl('/exchange/dollar');
    console.log('Consultando valor del dólar en:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Error al obtener el valor del dólar');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error al obtener el valor del dólar:', error);
    // Valor de respaldo
    return {
      date: new Date().toLocaleDateString('es-CL'),
      value: 938.28,
      description: "Tipo de cambio nominal (dólar observado $CLP/USD) [VALOR PREDETERMINADO]"
    };
  }
}; 