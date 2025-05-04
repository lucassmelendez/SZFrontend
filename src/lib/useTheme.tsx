'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Este efecto solo se ejecuta una vez al montar el componente
  useEffect(() => {
    // Verificar si hay un tema guardado en localStorage
    try {
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      
      if (storedTheme) {
        setTheme(storedTheme);
      } else {
        // Si no hay tema guardado, usar la preferencia del sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    } catch (error) {
      console.error('Error accediendo a localStorage:', error);
    }
    
    setMounted(true);
  }, []);

  // Este efecto se ejecuta cada vez que cambia el tema
  useEffect(() => {
    if (!mounted) return;
    
    try {
      // Aplicar la clase 'dark' al elemento html cuando el tema es oscuro
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Guardar en localStorage
      localStorage.setItem('theme', theme);
      
      console.log('Tema cambiado a:', theme); // Para depuración
    } catch (error) {
      console.error('Error guardando el tema:', error);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      console.log('Cambiando tema de', prevTheme, 'a', newTheme); // Para depuración
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
} 