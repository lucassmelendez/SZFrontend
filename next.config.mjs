/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://sz-backend.vercel.app/api',
  },
  images: {
    domains: ['picsum.photos', 'images.unsplash.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configuración para manejar los estilos de Swiper
  transpilePackages: ['swiper', 'swiper/react'],
  webpack: (config) => {
    // Esta configuración ayuda a resolver problemas con las importaciones de CSS de módulos externos
    config.module.rules.push({
      test: /\.css$/i,
      issuer: { and: [/\.(js|ts|md)x?$/] },
      use: ["style-loader", "css-loader"],
    });
    
    return config;
  },
};

export default nextConfig; 