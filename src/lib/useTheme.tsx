'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Valores predeterminados seguros para renderizado estático
const defaultContextValue: ThemeContextType = {
  theme: 'light',
  toggleTheme: () => {
    console.warn('toggleTheme fue llamado fuera de un ThemeProvider');
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Comenzar sin definir el tema inicial
  const [theme, setTheme] = useState<Theme | null>(null);

  // Inicializar el tema solo en el cliente
  useEffect(() => {
    // Determinar el tema inicial
    let initialTheme: Theme;
    
    // Comprobar si hay un tema guardado
    try {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (savedTheme === 'dark' || savedTheme === 'light') {
        initialTheme = savedTheme;
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        initialTheme = 'dark';
      } else {
        initialTheme = 'light';
      }
    } catch (e) {
      console.error('Error al leer el tema:', e);
      initialTheme = 'light';
    }
    
    // Aplicar el tema inmediatamente
    applyTheme(initialTheme);
    
    // Actualizar el estado
    setTheme(initialTheme);
  }, []);
  
  // Función para aplicar el tema al documento
  const applyTheme = (newTheme: Theme) => {
    try {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Guardar el tema en localStorage
      localStorage.setItem('theme', newTheme);
      
      console.log('Tema aplicado:', newTheme); // Depuración
    } catch (e) {
      console.error('Error al aplicar el tema:', e);
    }
  };

  // Función para cambiar entre temas
  const toggleTheme = () => {
    if (!theme) return; // Protección para la inicialización
    
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    
    console.log('Cambiando tema de', theme, 'a', newTheme); // Depuración
    
    // Aplicar el tema
    applyTheme(newTheme);
    
    // Actualizar el estado
    setTheme(newTheme);
  };

  // No renderizar nada hasta que se haya determinado el tema inicial
  if (theme === null) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  
  // En lugar de lanzar un error, devolver valores predeterminados
  // Esto es importante para el renderizado estático de Vercel/Next.js
  if (context === undefined) {
    // Solo mostrar advertencia en el navegador, no durante renderizado estático
    if (typeof window !== 'undefined') {
      console.warn('useTheme fue usado fuera de un ThemeProvider');
    }
    return defaultContextValue;
  }
  
  return context;
} 