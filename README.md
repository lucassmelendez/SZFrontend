# SpinZone - Frontend

Frontend para la tienda de artículos de tenis de mesa SpinZone, desarrollado con Next.js.

## Características

- Catálogo de productos
- Detalles de producto
- Carrito de compras
- Búsqueda de productos
- Filtrado por categorías
- Diseño responsive

## Tecnologías

- Next.js
- React
- TypeScript
- Tailwind CSS
- Axios

## Requisitos

- Node.js 14.x o superior
- npm 7.x o superior

## Instalación

1. Clona el repositorio:
```bash
git clone <tu-repositorio>
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env.local` con las siguientes variables:
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Desarrollo

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

El servidor estará disponible en [http://localhost:3000](http://localhost:3000).

## Construcción

Para construir la aplicación para producción:

```bash
npm run build
```

Para iniciar la versión de producción:

```bash
npm start
```

## Despliegue en Vercel

### Opción 1: Despliegue automático

1. Conecta tu repositorio a Vercel.
2. Configura las variables de entorno en el panel de Vercel.
3. Despliega automáticamente.

### Opción 2: Despliegue manual con Vercel CLI

1. Instala Vercel CLI:
```bash
npm i -g vercel
```

2. Inicia sesión:
```bash
vercel login
```

3. Despliega:
```bash
vercel
```

## Estructura del proyecto

- `src/app` - Páginas y rutas de la aplicación
- `src/components` - Componentes reutilizables
- `src/lib` - Utilidades, API y hooks
- `public` - Archivos estáticos

## Conexión con el backend

El frontend se conecta al backend a través de la URL especificada en la variable de entorno `NEXT_PUBLIC_API_URL`. Asegúrate de que el backend esté en funcionamiento y accesible desde el frontend.
