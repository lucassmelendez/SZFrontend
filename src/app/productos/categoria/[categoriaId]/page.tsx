// Este archivo es un Server Component por defecto en Next.js 13+
import { CategoriaClient } from './client-page';

export default async function CategoriaPage({ params }: { params: { categoriaId: string } }) {
  // No es necesario usar await con params, ya que es un objeto normal
  return <CategoriaClient categoriaId={params.categoriaId} />;
}