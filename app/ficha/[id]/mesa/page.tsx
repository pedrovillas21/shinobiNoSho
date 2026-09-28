import { Mesa } from "@/components/mesa/Mesa";

// A ficha vive no navegador: o servidor só entrega a casca, que fica em cache por id.
export const dynamic = "force-static";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Mesa id={id} />;
}
