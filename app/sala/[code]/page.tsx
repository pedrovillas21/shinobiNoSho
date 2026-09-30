import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EscolherFicha } from "@/components/sala/EscolherFicha";
import { SalaCliente } from "@/components/sala/SalaCliente";
import type { SalaInfo } from "@/lib/sala";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sala" };

interface Preview {
  id: string;
  code: string;
  name: string;
  owner_username: string;
  my_role: "adm" | "player" | null;
  my_status: "active" | "kicked" | null;
  my_character: string | null;
}

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const clean = decodeURIComponent(code).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const { sb, user } = await getUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(`/sala/${clean}`)}`);

  const { data } = await sb.rpc("room_preview", { p_code: clean }).maybeSingle<Preview>();
  if (!data) return <Aviso title="Sala não encontrada" text="Confira o código com o mestre. Se ele gerou um código novo, o antigo deixa de valer." />;
  if (data.my_status === "kicked") return <Aviso title="Você foi removido desta sala" text="O mestre tirou você da mesa. Fale com ele se foi engano." />;

  const room: SalaInfo = { id: data.id, code: data.code, name: data.name, ownerUsername: data.owner_username };
  if (data.my_status !== "active") return <EscolherFicha room={room} />;

  return <SalaCliente room={room} userId={user.id} role={data.my_role ?? "player"} characterId={data.my_character} />;
}

function Aviso({ title, text }: { title: string; text: string }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <p className="font-display text-2xl font-extrabold text-paper">{title}</p>
        <p className="max-w-sm text-sm text-muted">{text}</p>
        <Link href="/" className="btn-primary">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
