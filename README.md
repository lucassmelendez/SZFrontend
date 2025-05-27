# SpinZone - Plataforma de E-commerce para Artículos de Tenis de Mesa

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-brightgreen.svg)](https://github.com/lucassmelendez/SZFrontend.git)
[![Next.js](https://img.shields.io/badge/Next.js-15.3-blue.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-blue.svg)](https://tailwindcss.com/)

## 📋 Descripción

SpinZone es una plataforma completa de comercio electrónico especializada en artículos de tenis de mesa. Este repositorio contiene el frontend de la aplicación, desarrollado con Next.js, React, TypeScript y Tailwind CSS.

## ✨ Características Principales

- **Tienda Online Completa**
  - Catálogo de productos con filtrado y búsqueda
  - Sistema de carrito de compras avanzado
  - Detalles de productos detallados
  - Proceso de checkout seguro
  - Integración con WebPay (pasarela de pago)

- **Panel de Administración**
  - Gestión de productos, inventario y usuarios
  - Dashboard para administradores

- **Roles Específicos**
  - Área de Empleado
  - Área de Bodega
  - Área de Contabilidad
  - Área de Vendedor

- **Funcionalidades Avanzadas**
  - Autenticación y gestión de usuarios
  - Perfil de usuario personalizable
  - Diseño 100% responsive
  - Generación de PDF con jsPDF

## 🛠️ Tecnologías Utilizadas

- **Frontend**:
  - Next.js 15.3.1
  - React 19.0.0
  - TypeScript 5.x
  - Tailwind CSS 4.x
  - Axios (para peticiones HTTP)
  - React Hot Toast (alertas)
  - React Icons
  - jsPDF (generación de documentos PDF)

- **Backend** (integrado con):
  - FastAPI 
  - Express

- **Despliegue**:
  - Vercel

## 🚀 Instalación y Configuración

### Requisitos Previos

- Node.js 16.x o superior
- npm 7.x o superior
- Git

### Pasos de Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/lucassmelendez/SZFrontend.git
   cd SZFrontend
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   # Añadir otras variables necesarias para WebPay u otros servicios
   ```

## 🖥️ Desarrollo Local

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

El servidor estará disponible en [http://localhost:3000](http://localhost:3000).

## 🏗️ Construcción y Producción

Para construir la aplicación para producción:

```bash
npm run build
```

Para iniciar la versión de producción:

```bash
npm start
```

## 🚢 Despliegue

### Despliegue en Vercel

#### Opción 1: Despliegue automático

1. Conecta tu repositorio GitHub a Vercel
2. Configura las variables de entorno en el panel de Vercel
3. Vercel detectará automáticamente la configuración de Next.js y realizará el despliegue

#### Opción 2: Despliegue manual con Vercel CLI

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
   vercel --prod
   ```

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/                    # Páginas y rutas (Next.js App Router)
│   │   ├── admin/              # Panel de administración
│   │   ├── bodega/             # Gestión de bodega
│   │   ├── checkout/           # Proceso de pago
│   │   ├── contabilidad/       # Área de contabilidad
│   │   ├── empleado/           # Área de empleados
│   │   ├── perfil/             # Perfil de usuario
│   │   ├── productos/          # Catálogo y detalles de productos
│   │   ├── webpay-direct/      # Integración directa con WebPay
│   │   ├── webpay-form/        # Formularios para WebPay
│   │   ├── page.tsx            # Página principal
│   │   ├── layout.tsx          # Layout principal
│   │   └── globals.css         # Estilos globales
│   │
│   ├── components/             # Componentes reutilizables
│   │   ├── auth/               # Componentes de autenticación
│   │   ├── bodega/             # Componentes de gestión de bodega
│   │   ├── cart/               # Componentes del carrito de compras
│   │   ├── contabilidad/       # Componentes de contabilidad
│   │   ├── layout/             # Componentes de estructura
│   │   ├── ui/                 # Componentes de interfaz de usuario
│   │   └── vendedor/           # Componentes para vendedores
│   │
│   ├── lib/                    # Utilidades, hooks y contextos
│   │   ├── auth/               # Funciones de autenticación
│   │   ├── utils/              # Utilidades generales
│   │   ├── api.ts              # Cliente API centralizado
│   │   ├── useCarrito.ts       # Hook para el carrito
│   │   ├── useFloatingCart.ts  # Hook para el carrito flotante
│   │   ├── FloatingCartContext.tsx  # Contexto del carrito flotante
│   │   └── useTheme.tsx        # Hook para el tema de la aplicación
│   │
│   └── services/               # Servicios externos
│       └── webpayService.ts    # Servicio para integración con WebPay
|
├── .next/                      # Directorio de build de Next.js
├── node_modules/               # Dependencias
├── tailwind.config.js          # Configuración de Tailwind CSS
├── next.config.mjs             # Configuración de Next.js
├── tsconfig.json               # Configuración de TypeScript
├── package.json                # Dependencias y scripts
└── vercel.json                 # Configuración de despliegue en Vercel
```

## 🔄 Integración con Backend

El frontend se conecta a un backend desarrollado en FastAPI y a otro desarollado en Express. Ambos backends fueron puestos en produccion y se pueden consultar en sus respectivos enlaces:

- FastApi:
Produccion: https://szfast-api.vercel.app/      
Github : https://github.com/lucassmelendez/SZfastApi.git

- Express:
Produccion: https://sz-backend.vercel.app/    
Github : https://github.com/lucassmelendez/SZBackend.git


El archivo `src/lib/api.ts` contiene todos los endpoints y funciones para interactuar con los backends.

## 💳 Integración con WebPay

Este proyecto incluye una integración completa con WebPay (procesador de pagos) a través de nuestro backend Express que contiene:

- Formularios dedicados en `src/app/webpay-form/`
- Integración directa en `src/app/webpay-direct/`
- Servicio específico en `src/services/webpayService.ts`

## 🛒 Sistema de Carrito

La aplicación incluye un sistema de carrito avanzado con:

- Persistencia de datos entre sesiones
- Carrito flotante para mejor experiencia de usuario
- Hooks personalizados (`useCarrito.ts` y `useFloatingCart.ts`)
- Contexto React para compartir el estado del carrito
