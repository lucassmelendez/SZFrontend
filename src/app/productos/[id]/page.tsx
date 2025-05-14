// Este archivo es un Server Component por defecto en Next.js 13+
import { ProductoDetailClient } from './client-page';

export default async function ProductoDetailPage({ params }: { params: { id: string } }) {
  // Ahora es un componente asíncrono para cumplir con la API recomendada de Next.js
  return <ProductoDetailClient id={params.id} />;
} 