"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import Link from 'next/link';
import { confirmarTransaccion, manejarTransaccionAbortada, manejarTimeout, WebpayTransactionResult } from '@/services/webpayService';
import { useCart } from '@/contexts/CartContext';

// URLs de WebPay - solo para referencia
const WEBPAY_INTEGRATION_URL = 'https://webpay3gint.transbank.cl';
const WEBPAY_PRODUCTION_URL = 'https://webpay3g.transbank.cl';

export default function WebpayReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<WebpayTransactionResult | null>(null);
  const { clearCart } = useCart();

  useEffect(() => {
    const processTransaction = async () => {
      try {
        // Obtener parámetros de la URL
        const token_ws = searchParams.get('token_ws');
        const TBK_TOKEN = searchParams.get('TBK_TOKEN');
        const TBK_ORDEN_COMPRA = searchParams.get('TBK_ORDEN_COMPRA');
        const TBK_ID_SESION = searchParams.get('TBK_ID_SESION');

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
              clearCart();
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
  }, [searchParams, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center mb-8">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Procesando tu pago
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Estamos verificando el estado de tu transacción, por favor espera...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg max-w-md w-full p-8 text-center">
        {result?.success ? (
          <>
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
              <FaCheck className="text-3xl text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              ¡Pago completado con éxito!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Tu compra ha sido procesada correctamente. Recibirás un correo electrónico con los detalles de tu pedido.
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Pedido #:</span> {result.pedidoId}
              </p>
              {result.transaction?.card_detail && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Tarjeta:</span> {result.transaction.card_detail.card_number}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-6">
              <FaTimes className="text-3xl text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Transacción no completada
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
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
              className="bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 py-2 px-4 rounded-md font-medium transition-colors"
            >
              Volver al checkout
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 