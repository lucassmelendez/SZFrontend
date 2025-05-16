import { v4 as uuidv4 } from 'uuid';

// Asegurarnos de usar la URL correcta del API y siempre con HTTPS
// Cambiar la forma en que se construye la URL para evitar duplicar "/api"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Función para construir la URL correctamente y garantizar HTTPS
const buildApiUrl = (path: string) => {
  // Asegurarnos de que usamos HTTPS en producción
  let baseUrl = API_BASE_URL;
  
  // Si la URL comienza con http:// y no es localhost, cambiarla a https://
  if (baseUrl.startsWith('http://') && !baseUrl.includes('localhost')) {
    baseUrl = baseUrl.replace('http://', 'https://');
  }
  
  // Si la URL base ya termina con /api, no añadir otro /api
  if (baseUrl.endsWith('/api')) {
    return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
  } else {
    return `${baseUrl}/api${path.startsWith('/') ? path : '/' + path}`;
  }
};

// URLs de WebPay - solo para referencia
const WEBPAY_INTEGRATION_URL = 'https://webpay3gint.transbank.cl';
const WEBPAY_PRODUCTION_URL = 'https://webpay3g.transbank.cl';

console.log('API BASE URL para WebPay service:', API_BASE_URL);
console.log('API URL corregida:', buildApiUrl('/webpay/iniciar').replace('/webpay/iniciar', ''));
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

    // Usar la función buildApiUrl para construir la URL correctamente
    const apiUrl = buildApiUrl('/webpay/iniciar');
    console.log('URL de API WebPay:', apiUrl);

    // Verificar si hay posible problema de contenido mixto
    if (window.location.protocol === 'https:' && apiUrl.startsWith('http:')) {
      console.error('Error de contenido mixto detectado: No se puede hacer una solicitud HTTP desde un sitio HTTPS');
      throw new Error('Error de seguridad: No se puede acceder al servidor de pagos. Contacta al administrador');
    }

    const response = await fetch(apiUrl, {
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
      // Añadir estas opciones para ayudar con CORS
      credentials: 'include',
      mode: 'cors',
      redirect: 'follow'
    });

    // Verificar tipo de respuesta
    if (response.redirected) {
      console.log('Redirección detectada, URL:', response.url);
      return {
        url: response.url,
        token: sessionId // En caso de redirección, usar el sessionId como token alternativo
      };
    }

    if (!response.ok) {
      // Intentar obtener detalles del error como texto en caso de formato JSON inválido
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || `Error en la API: ${response.status} ${response.statusText}`;
      } catch (e) {
        // Si no es JSON, intentar obtener como texto
        try {
          const errorText = await response.text();
          errorMessage = `Error en la API (texto): ${response.status} ${response.statusText} - ${errorText}`;
        } catch (textError) {
          errorMessage = `Error en la API: ${response.status} ${response.statusText}`;
        }
      }
      console.error('Error en respuesta de la API WebPay:', errorMessage);
      throw new Error(errorMessage);
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
    
    // Verificar si es un error de Mixed Content
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      if (window.location.protocol === 'https:') {
        console.error('Es posible que haya un problema de contenido mixto (HTTP vs HTTPS)');
        throw new Error('Error de seguridad: No se puede acceder al servidor de pagos por un problema de protocolos (HTTP/HTTPS)');
      }
    }
    
    throw error;
  }
};

export const confirmarTransaccion = async (token: string): Promise<WebpayTransactionResult> => {
  try {
    console.log('Confirmando transacción con token:', token);

    // Usar la función buildApiUrl para construir la URL correctamente
    const apiUrl = buildApiUrl('/webpay/confirmar');

    const response = await fetch(apiUrl, {
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

    // Usar la función buildApiUrl para construir la URL correctamente
    const apiUrl = buildApiUrl('/webpay/abortada');

    const response = await fetch(apiUrl, {
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

    // Usar la función buildApiUrl para construir la URL correctamente
    const apiUrl = buildApiUrl('/webpay/timeout');

    const response = await fetch(apiUrl, {
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