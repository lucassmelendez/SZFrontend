'use client';

import { useEffect } from 'react';

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Ocultar header y footer
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      header, footer {
        display: none !important;
      }
      
      main {
        padding-top: 0 !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      if (styleElement && document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  return <>{children}</>;
} 