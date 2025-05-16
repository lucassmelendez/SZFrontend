'use client';

export default function WebpayDirectPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Formulario WebPay Manual</h1>
      
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <p>Para crear un formulario WebPay manualmente, sigue estos pasos:</p>
        
        <ol style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          <li>Copia el siguiente código HTML y guárdalo como un archivo HTML:</li>
        </ol>
        
        <pre style={{ backgroundColor: '#eee', padding: '15px', borderRadius: '5px', overflowX: 'auto', fontSize: '14px' }}>{`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirección a WebPay</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 500px;
    }
    h1 {
      color: #333;
    }
    p {
      color: #666;
      margin-bottom: 25px;
    }
    button {
      background-color: #0070f3;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
    }
    button:hover {
      background-color: #0051a8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Redireccionando a WebPay</h1>
    <p>Serás redirigido automáticamente a la página de pago. Si no eres redirigido, haz clic en el botón a continuación.</p>
    
    <form id="webpay-form" method="POST" action="URL_DE_WEBPAY_AQUI">
      <input type="hidden" name="token_ws" value="TOKEN_AQUI">
      <button type="submit">Ir a WebPay</button>
    </form>
  </div>

  <script>
    // Enviar el formulario automáticamente después de 2 segundos
    setTimeout(() => {
      document.getElementById('webpay-form').submit();
    }, 2000);
  </script>
</body>
</html>
        `}</pre>
        
        <p style={{ marginTop: '20px' }}>Reemplaza:</p>
        <ul style={{ marginBottom: '20px' }}>
          <li><strong>URL_DE_WEBPAY_AQUI</strong>: con la URL proporcionada en la respuesta de WebPay</li>
          <li><strong>TOKEN_AQUI</strong>: con el token proporcionado en la respuesta de WebPay</li>
        </ul>
        
        <p>Abre este archivo HTML en tu navegador para redirigir a WebPay.</p>
      </div>
    </div>
  );
} 