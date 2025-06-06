'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { useLoginModal } from '@/lib/auth/LoginModalContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { isRegisterView } = useLoginModal();
  const [isLoginView, setIsLoginView] = useState(!isRegisterView);
  
  // Actualizar el estado local cuando cambia isRegisterView
  useEffect(() => {
    setIsLoginView(!isRegisterView);
  }, [isRegisterView]);

  const showLogin = () => {
    setIsLoginView(true);
  };

  const showRegister = () => {
    setIsLoginView(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={isLoginView ? "sm" : "md"} isFullMobile={!isLoginView}>
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 -mx-6 -mt-4 px-6 py-4 pt-8 rounded-t-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Bienvenido a SpinZone</h2>
          <p className="mt-2 text-blue-100">
            {isLoginView 
              ? 'Inicia sesión para acceder a tu cuenta' 
              : 'Crea una cuenta para comprar en nuestra tienda'}
          </p>
        </div>
      </div>

      <div className="px-4 py-4">
        {isLoginView ? (
          <LoginForm 
            onRegister={showRegister}
            onSuccess={onClose}
          />
        ) : (
          <RegisterForm 
            onBackToLogin={showLogin}
            onSuccess={onClose}
          />
        )}
      </div>
    </Modal>
  );
} 