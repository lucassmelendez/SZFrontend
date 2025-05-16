'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function WebpayFormPage() {
  const searchParams = useSearchParams();
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  
  useEffect(() => {
    // Obtener parámetros de la URL
    const url = searchParams.get('url');
    const token = searchParams.get('token');
    
    if (url && token && !isFormSubmitted) {
      console.log('Datos para formulario WebPay:', { url, token });
      
      // Crear el formulario
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = url;
      form.id = 'webpay-form';
      
      // Crear el input para el token
      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'token_ws';
      tokenInput.value = token;
      form.appendChild(tokenInput);
      
      // Crear botón de envío
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md w-full mt-4';
      submitButton.textContent = 'Ir a WebPay';
      submitButton.id = 'webpay-submit-btn';
      form.appendChild(submitButton);
      
      // Añadir al DOM
      document.getElementById('form-container')?.appendChild(form);
      
      // Enviar el formulario automáticamente después de un breve retraso
      setTimeout(() => {
        console.log('Enviando formulario WebPay automáticamente...');
        form.submit();
        setIsFormSubmitted(true);
      }, 3000);
    }
  }, [searchParams, isFormSubmitted]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg max-w-md w-full p-8" id="form-container">
        <h1 className="text-2xl font-bold text-center mb-6">Redireccionando a WebPay</h1>
        
        {!isFormSubmitted ? (
          <>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              Serás redirigido automáticamente a la página de pago en 3 segundos...
            </p>
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Si la redirección automática no funciona, presiona el botón que aparecerá a continuación.
            </p>
          </>
        ) : (
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
            Si no fuiste redirigido automáticamente, presiona el botón de envío.
          </p>
        )}
        
        <div className="mt-6">
          <div className="text-sm text-gray-500 mt-6">
            <div className="flex justify-between items-center">
              <span className="font-semibold">URL de WebPay:</span>
              <span className="text-xs overflow-hidden text-ellipsis" style={{maxWidth: '200px'}}>
                {searchParams.get('url')?.substring(0, 30)}...
              </span>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <span className="font-semibold">Token:</span>
              <span className="text-xs overflow-hidden text-ellipsis" style={{maxWidth: '200px'}}>
                {searchParams.get('token')?.substring(0, 15)}...
              </span>
            </div>
          </div>
        </div>
        
        {/* El formulario se insertará aquí dinámicamente */}
      </div>
      
      <div className="mt-8">
        <a href="/webpay-direct" className="text-blue-500 hover:underline text-sm">
          Ver instrucciones para formulario manual
        </a>
      </div>
    </div>
  );
} 