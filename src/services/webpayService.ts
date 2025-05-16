import { v4 as uuidv4 } from 'uuid';

// Asegurarnos de usar la URL correcta del API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// URLs de WebPay - solo para referencia
const WEBPAY_INTEGRATION_URL = 'https://webpay3gint.transbank.cl';
const WEBPAY_PRODUCTION_URL = 'https://webpay3g.transbank.cl';

console.log('API URL para WebPay service:', API_URL);
console.log('WebPay se redirigirá a:', process.env.NODE_ENV === 'production' ? WEBPAY_PRODUCTION_URL : WEBPAY_INTEGRATION_URL);

export interface WebpayTransaction {
  url: string;
  token: string;
}

export interface WebpayTransactionResult {
  success: boolean;
  message?: string;
  error?: string;
  pedidoId?: number;
  transaction?: any;
  orderCode?: string;
  sessionId?: string;
}

export const iniciarTransaccion = async (
  amount: number,
  items: any[],
  userId: string
): Promise<WebpayTransaction> => {
  try {
    const buyOrder = `OC-${Date.now()}`;
    const sessionId = uuidv4();
    // La URL de retorno debe apuntar a tu frontend, no a WebPay
    const returnUrl = `${window.location.origin}/checkout/webpay-return`;

    console.log('Iniciando transacción WebPay con datos:', {
      buyOrder, 
      sessionId, 
      amount, 
      returnUrl, 
      itemsCount: items.length,
      userId
    });

    const response = await fetch(`${API_URL}/api/webpay/iniciar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buyOrder,
        sessionId,
        amount,
        returnUrl,
        items,
        userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error en respuesta de la API WebPay:', errorData);
      throw new Error(errorData.error || `Error en la API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Respuesta de WebPay:', data);

    // Verificar que la URL comience con la URL de WebPay
    if (data.url && !data.url.startsWith(WEBPAY_INTEGRATION_URL) && !data.url.startsWith(WEBPAY_PRODUCTION_URL)) {
      console.warn('La URL de redirección no parece ser una URL válida de WebPay:', data.url);
    }

    if (!data.url || !data.token) {
      throw new Error('La respuesta del servidor no tiene los datos necesarios (url y token)');
    }

    return data;
  } catch (error) {
    console.error('Error al iniciar transacción:', error);
    throw error;
  }
};

export const confirmarTransaccion = async (token: string): Promise<WebpayTransactionResult> => {
  try {
    console.log('Confirmando transacción con token:', token);

    const response = await fetch(`${API_URL}/api/webpay/confirmar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token_ws: token }),
    });

    const data = await response.json();
    console.log('Respuesta de confirmación:', data);

    return data;
  } catch (error) {
    console.error('Error al confirmar transacción:', error);
    throw error;
  }
};

export const manejarTransaccionAbortada = async (
  token: string,
  orderCode: string,
  sessionId: string
): Promise<WebpayTransactionResult> => {
  try {
    console.log('Manejando transacción abortada:', { token, orderCode, sessionId });

    const response = await fetch(`${API_URL}/api/webpay/abortada`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        TBK_TOKEN: token,
        TBK_ORDEN_COMPRA: orderCode,
        TBK_ID_SESION: sessionId,
      }),
    });

    const data = await response.json();
    console.log('Respuesta de transacción abortada:', data);

    return data;
  } catch (error) {
    console.error('Error al manejar transacción abortada:', error);
    throw error;
  }
};

export const manejarTimeout = async (
  orderCode: string,
  sessionId: string
): Promise<WebpayTransactionResult> => {
  try {
    console.log('Manejando timeout:', { orderCode, sessionId });

    const response = await fetch(`${API_URL}/api/webpay/timeout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        TBK_ORDEN_COMPRA: orderCode,
        TBK_ID_SESION: sessionId,
      }),
    });

    const data = await response.json();
    console.log('Respuesta de timeout:', data);

    return data;
  } catch (error) {
    console.error('Error al manejar timeout:', error);
    throw error;
  }
}; 