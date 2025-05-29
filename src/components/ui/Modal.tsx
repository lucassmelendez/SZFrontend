'use client';

import React, { useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  isFullMobile?: boolean;
  closeable?: boolean;
  children: React.ReactNode;
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  size = 'md', 
  isFullMobile = false, 
  closeable = true, 
  children 
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Cerrar con tecla ESC solo si el modal es cerrable
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeable) onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // Prevenir scroll en el fondo
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = ''; // Restaurar scroll
    };
  }, [isOpen, onClose, closeable]);

  // Cerrar al hacer clic fuera del modal solo si es cerrable
  const handleOutsideClick = (e: React.MouseEvent) => {
    if (closeable && modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Dimensiones del modal según el tamaño
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-3xl'
  };

  // Clase especial para dispositivos móviles cuando se requiere pantalla completa
  const mobileFullScreenClass = isFullMobile 
    ? 'sm:rounded-lg max-h-full h-full sm:h-auto rounded-lg sm:m-4 m-0' 
    : 'rounded-lg';

  if (!isOpen) return null;

  // Usar Portal para renderizar fuera del DOM normal
  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={handleOutsideClick}
    >
      <div 
        ref={modalRef}
        className={`${sizeClasses[size]} w-full bg-white shadow-xl transform transition-all duration-300 ease-in-out overflow-y-auto relative ${mobileFullScreenClass}`}
      >
        {/* Botón de cierre solo si closeable es true */}
        {closeable && (
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 focus:outline-none transition-colors"
            aria-label="Cerrar"
          >
            <FaTimes size={16} />
          </button>
        )}
        
        {title && (
          <div className={`flex justify-between items-center border-b border-gray-200 px-6 py-4 ${closeable ? 'pr-12' : ''}`}>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          </div>
        )}
        
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
} 