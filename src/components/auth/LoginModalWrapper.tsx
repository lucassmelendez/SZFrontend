'use client';

import { useLoginModal } from '@/lib/auth/LoginModalContext';
import LoginModal from './LoginModal';

export default function LoginModalWrapper() {
  const { isLoginModalOpen, closeLoginModal } = useLoginModal();

  return (
    <LoginModal 
      isOpen={isLoginModalOpen} 
      onClose={closeLoginModal} 
    />
  );
} 