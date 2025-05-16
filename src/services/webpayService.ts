import { v4 as uuidv4 } from 'uuid';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
    const returnUrl = `${window.location.origin}/checkout/webpay-return`;

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
      throw new Error(errorData.error || 'Error al iniciar la transacción');
    }

    return await response.json();
  } catch (error) {
    console.error('Error al iniciar transacción:', error);
    throw error;
  }
};

export const confirmarTransaccion = async (token: string): Promise<WebpayTransactionResult> => {
  try {
    const response = await fetch(`${API_URL}/api/webpay/confirmar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token_ws: token }),
    });

    return await response.json();
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

    return await response.json();
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

    return await response.json();
  } catch (error) {
    console.error('Error al manejar timeout:', error);
    throw error;
  }
}; 