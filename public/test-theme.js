// Este script se puede ejecutar en la consola del navegador para verificar
// si el modo oscuro está funcionando correctamente

(function() {
  // Función para alternar el tema
  function toggleDarkMode() {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    
    console.log('Estado actual del tema:', isDark ? 'oscuro' : 'claro');
    
    if (isDark) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      console.log('Cambiado a tema claro');
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      console.log('Cambiado a tema oscuro');
    }
    
    // Verificar después del cambio
    setTimeout(() => {
      const newIsDark = html.classList.contains('dark');
      console.log('Nuevo estado del tema:', newIsDark ? 'oscuro' : 'claro');
      console.log('Clase dark presente:', newIsDark);
      console.log('Tema en localStorage:', localStorage.getItem('theme'));
      
      // Verificar algunos elementos para comprobar si están cambiando correctamente
      const bgColors = [];
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        const bgColor = style.backgroundColor;
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && !bgColors.includes(bgColor)) {
          bgColors.push(bgColor);
        }
      });
      
      console.log('Colores de fondo encontrados:', bgColors);
    }, 500);
  }
  
  // Función para establecer un tema específico
  function setTheme(theme) {
    const html = document.documentElement;
    
    if (theme === 'dark') {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      console.log('Tema oscuro aplicado');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      console.log('Tema claro aplicado');
    }
  }
  
  // Comprobar la configuración actual
  function checkTheme() {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    const storedTheme = localStorage.getItem('theme');
    
    console.log('Clase dark presente:', isDark);
    console.log('Tema en localStorage:', storedTheme);
    console.log('Media query preferencia oscura:', window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  
  // Exportar funciones para poder usarlas desde la consola
  window.themeTest = {
    toggle: toggleDarkMode,
    setDark: () => setTheme('dark'),
    setLight: () => setTheme('light'),
    check: checkTheme
  };
  
  console.log('Script de prueba de tema cargado. Usa window.themeTest.toggle() para alternar el tema, window.themeTest.check() para verificar el estado actual.');
})(); 