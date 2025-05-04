'use client';

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isClient: boolean;
}

// Proporcionar un valor por defecto al contexto para evitar errores fuera del Provider
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => console.warn('ThemeProvider no encontrado'),
  isClient: false
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [isClient, setIsClient] = useState(false);

  // Solo ejecutar en el cliente después de la hidratación inicial
  useEffect(() => {
    setIsClient(true);
    
    try {
      // Verificar si hay tema guardado en localStorage
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      
      // Si hay un tema guardado, usarlo
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme);
      } else {
        // Si no hay tema guardado, detectar preferencia del sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    } catch (error) {
      // Fallar silenciosamente, usar tema por defecto
      console.warn('Error al cargar el tema:', error);
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    try {
      // Aplicar la clase dark directamente al elemento html
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Guardar preferencia en localStorage
      localStorage.setItem('theme', theme);
    } catch (error) {
      // Fallar silenciosamente
      console.warn('Error al aplicar el tema:', error);
    }
  }, [theme, isClient]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      return newTheme;
    });
  };

  // No renderizar los controles de tema hasta que estemos en el cliente
  // pero siempre renderizar los hijos para evitar problemas de hidratación
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isClient }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
} 