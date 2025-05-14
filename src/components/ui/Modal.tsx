'use client';

import React, { useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, size = 'md', children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Cerrar con tecla ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // Prevenir scroll en el fondo
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = ''; // Restaurar scroll
    };
  }, [isOpen, onClose]);

  // Cerrar al hacer clic fuera del modal
  const handleOutsideClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Dimensiones del modal según el tamaño
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl'
  };

  if (!isOpen) return null;

  // Usar Portal para renderizar fuera del DOM normal
  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={handleOutsideClick}
    >
      <div 
        ref={modalRef}
        className={`${sizeClasses[size]} w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all duration-300 ease-in-out`}
      >
        {title && (
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
            >
              <FaTimes />
            </button>
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