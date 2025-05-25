"use client";

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import Link from 'next/link';
import { confirmarTransaccion, manejarTransaccionAbortada, manejarTimeout, WebpayTransactionResult } from '@/services/webpayService';
import { useCarrito } from '@/lib/useCarrito';

// URLs de WebPay - solo para referencia
const WEBPAY_INTEGRATION_URL = 'https://webpay3gint.transbank.cl';
const WEBPAY_PRODUCTION_URL = 'https://webpay3g.transbank.cl';

// Componente cargador para mostrar durante la suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">
          Cargando...
        </h1>
        <p className="text-gray-500 mt-2">
          Estamos preparando tu resultado de pago, por favor espera...
        </p>
      </div>
    </div>
  );
}

// Componente interno que utiliza useSearchParams
function WebpayReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<WebpayTransactionResult | null>(null);
  const { limpiarCarrito } = useCarrito();
  const processingRef = useRef(false);

  // Obtener parámetros de la URL una sola vez y no en el useEffect
  const token_ws = searchParams.get('token_ws');
  const TBK_TOKEN = searchParams.get('TBK_TOKEN');
  const TBK_ORDEN_COMPRA = searchParams.get('TBK_ORDEN_COMPRA');
  const TBK_ID_SESION = searchParams.get('TBK_ID_SESION');

  useEffect(() => {
    // Prevenir procesamiento múltiple usando la referencia
    if (processingRef.current) return;
    processingRef.current = true;

    const processTransaction = async () => {
      try {
        // Log con información adicional sobre URLs
        console.log('Procesando retorno de WebPay', { 
          token_ws, 
          TBK_TOKEN, 
          TBK_ORDEN_COMPRA, 
          TBK_ID_SESION,
          webpayUrl: process.env.NODE_ENV === 'production' ? WEBPAY_PRODUCTION_URL : WEBPAY_INTEGRATION_URL,
          currentUrl: typeof window !== 'undefined' ? window.location.href : 'SSR'
        });

        let transactionResult: WebpayTransactionResult;

        // Procesar según el tipo de respuesta
        if (token_ws) {
          console.log('Procesando flujo normal con token_ws');
          // Flujo normal (transacción confirmada)
          try {
            transactionResult = await confirmarTransaccion(token_ws);
            console.log('Resultado de confirmación:', transactionResult);
            
            // Si la transacción fue exitosa, limpiar el carrito
            if (transactionResult.success) {
              limpiarCarrito();
            }
          } catch (error) {
            console.error('Error en confirmación de transacción:', error);
            transactionResult = {
              success: false,
              error: 'Error al confirmar la transacción con WebPay'
            };
          }
        } else if (TBK_TOKEN) {
          console.log('Procesando flujo abortado con TBK_TOKEN');
          // Pago abortado por el usuario
          try {
            transactionResult = await manejarTransaccionAbortada(
              TBK_TOKEN,
              TBK_ORDEN_COMPRA || '',
              TBK_ID_SESION || ''
            );
            console.log('Resultado de transacción abortada:', transactionResult);
          } catch (error) {
            console.error('Error al manejar transacción abortada:', error);
            transactionResult = {
              success: false,
              error: 'Error al procesar transacción abortada'
            };
          }
        } else if (TBK_ORDEN_COMPRA && TBK_ID_SESION) {
          console.log('Procesando timeout con TBK_ORDEN_COMPRA y TBK_ID_SESION');
          // Timeout en el formulario de pago
          try {
            transactionResult = await manejarTimeout(
              TBK_ORDEN_COMPRA,
              TBK_ID_SESION
            );
            console.log('Resultado de timeout:', transactionResult);
          } catch (error) {
            console.error('Error al manejar timeout:', error);
            transactionResult = {
              success: false,
              error: 'Error al procesar timeout'
            };
          }
        } else {
          console.log('No se pudo determinar el tipo de respuesta');
          // Respuesta desconocida
          transactionResult = {
            success: false,
            error: 'No se pudo determinar el estado de la transacción. Parámetros insuficientes.'
          };
        }

        setResult(transactionResult);
      } catch (error) {
        console.error('Error al procesar la transacción:', error);
        setResult({
          success: false,
          error: 'Error al procesar la transacción: ' + (error instanceof Error ? error.message : 'Error desconocido')
        });
      } finally {
        setLoading(false);
      }
    };

    processTransaction();
    
    // No incluimos processingRef en las dependencias para evitar rerenders
    // Tampoco incluimos result porque solo queremos ejecutar este efecto una vez
  }, [token_ws, TBK_TOKEN, TBK_ORDEN_COMPRA, TBK_ID_SESION, limpiarCarrito]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center mb-8">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">
            Procesando tu pago
          </h1>
          <p className="text-gray-500 mt-2">
            Estamos verificando el estado de tu transacción, por favor espera...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="bg-white shadow-xl rounded-lg max-w-md w-full p-8 text-center">
        {result?.success ? (
          <>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <FaCheck className="text-3xl text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              ¡Pago completado con éxito!
            </h1>
            <p className="text-gray-600 mb-6">
              Tu pago ha sido procesado correctamente.
            </p>
            <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Pedido #:</span> {result.pedidoId}
              </p>
              {result.transaction?.card_detail && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Tarjeta:</span> {result.transaction.card_detail.card_number}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <FaTimes className="text-3xl text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Transacción no completada
            </h1>
            <p className="text-gray-600 mb-6">
              {result?.error || 'Hubo un problema al procesar tu pago.'}
            </p>
          </>
        )}
        <div className="flex flex-col space-y-3">
          <Link
            href="/productos"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            Seguir comprando
          </Link>
          {!result?.success && (
            <Link
              href="/checkout"
              className="bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100 py-2 px-4 rounded-md font-medium transition-colors"
            >
              Volver al checkout
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente principal que envuelve el contenido en Suspense
export default function WebpayReturnPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <WebpayReturnContent />
    </Suspense>
  );
} 