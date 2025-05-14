'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginModal } from '@/lib/auth/LoginModalContext';

export default function LoginPage() {
  const router = useRouter();
  const { openLoginModal } = useLoginModal();

  useEffect(() => {
    // Abrir el modal de login y redirigir a la página principal
    openLoginModal();
    router.replace('/');
  }, [openLoginModal, router]);

  // No renderizamos nada, ya que será redirigido
  return null;
}