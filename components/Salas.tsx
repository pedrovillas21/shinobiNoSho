"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { roomError, supabase } from "@/lib/supabase/client";
import { IconTrash } from "./ui";

interface MinhaSala {
  id: string;
  code: string;
  name: string;
  adm: boolean;
  players: number;
  mestre: string;
}

/** Criar sala, entrar com código e as salas em que a conta está. */
export function Salas({ userId }: { userId: string }) {
  const router = useRouter();
  const [rooms, setRooms] = useState<MinhaSala[] | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const sb = supabase();
      const { data: mine } = await sb.from("room_members").select("role, rooms(id, code, name)").eq("user_id", userId).eq("status", "active");
      const rows = (mine ?? []) as unknown as { role: string; rooms: { id: string; code: string; name: string } | null }[];
      const ids = rows.flatMap((r) => (r.rooms ? [r.rooms.id] : []));
      const { data: all } = ids.length
        ? await sb.from("room_members").select("room_id, username, role").in("room_id", ids).eq("status", "active")
        : { data: [] as { room_id: string; username: string; role: string }[] };
      if (!alive) return;
      setRooms(
        rows.flatMap((r) => {
          if (!r.rooms) return [];
          const people = (all ?? []).filter((m) => m.room_id === r.rooms!.id);
          return [
            {
              ...r.rooms,
              adm: r.role === "adm",
              players: people.filter((m) => m.role === "player").length,
              mestre: people.find((m) => m.role === "adm")?.username ?? "?",
            },
          ];
        }),
      );
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { data, error } = await supabase().rpc("create_room", { p_name: name.trim() });
    const row = (data as { code: string }[] | null)?.[0];
    if (error || !row) {
      setBusy(false);
      return setError(roomError(error));
    }
    router.push(`/sala/${row.code}`);
  };

  // Só o mestre apaga (a regra do banco confere). Membros e o jogo da sala vão junto.
  const apagar = async (id: string) => {
    setDeleting(id);
    setError(null);
    const { data, error } = await supabase().from("rooms").delete().eq("id", id).select("id");
    setDeleting(null);
    setConfirmDel(null);
    if (error || !data?.length) return setError(error ? roomError(error) : "Não foi possível apagar a sala. Só o mestre pode apagar.");
    setRooms((list) => list?.filter((r) => r.id !== id) ?? null);
  };

  const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const entrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (cleanCode.length === 6) router.push(`/sala/${cleanCode}`);
  };

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-extrabold text-paper">Salas</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <form onSubmit={criar} className="card flex flex-col gap-3 p-5">
          <span className="label">Criar sala</span>
          <label htmlFor="sala-nome" className="text-[13px] text-muted">
            Nome da campanha
          </label>
          <input id="sala-nome" className="field h-11" placeholder="ex.: Exame Chunin" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} required />
          <button type="submit" className="btn-primary mt-auto h-11" disabled={busy || !name.trim()}>
            {busy ? "Criando…" : "Criar e virar mestre"}
          </button>
        </form>

        <form onSubmit={entrar} className="card flex flex-col gap-3 p-5">
          <span className="label">Entrar com código</span>
          <label htmlFor="sala-codigo" className="text-[13px] text-muted">
            Código que o mestre passou
          </label>
          <input
            id="sala-codigo"
            className="field h-14 text-center font-display text-2xl font-extrabold uppercase tracking-[0.3em]"
            placeholder="K7Q4MX"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button type="submit" className="btn-ghost mt-auto h-11" disabled={cleanCode.length !== 6}>
            Entrar na sala
          </button>
        </form>

        <div className="card flex flex-col gap-2 p-5">
          <span className="label">Minhas salas</span>
          {rooms === null ? (
            [0, 1].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-ink-2" />)
          ) : rooms.length === 0 ? (
            <p className="text-sm text-faint">Nenhuma sala ainda. Crie uma ou entre com um código.</p>
          ) : (
            <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto">
              {rooms.map((r) =>
                confirmDel === r.id ? (
                  <li key={r.id} className="flex flex-col gap-2 rounded-xl border border-bad/40 bg-bad/10 px-3 py-2.5">
                    <span className="text-[13px] leading-snug text-text">
                      Apagar <b>{r.name}</b>? Todos saem da sala e a vida, o chakra e as condições dela se perdem. As fichas continuam.
                    </span>
                    <span className="flex gap-2">
                      <button type="button" className="btn min-h-9 flex-1 bg-bad px-3 text-xs text-white" disabled={deleting === r.id} onClick={() => void apagar(r.id)}>
                        {deleting === r.id ? "Apagando…" : "Apagar sala"}
                      </button>
                      <button type="button" className="btn-ghost min-h-9 flex-1 px-3 text-xs" onClick={() => setConfirmDel(null)}>
                        Cancelar
                      </button>
                    </span>
                  </li>
                ) : (
                  <li key={r.id} className="flex items-center gap-2">
                    <Link href={`/sala/${r.code}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-ink-2 px-3 py-2.5 transition hover:bg-panel-2">
                      <span className="flex min-w-0 flex-1 flex-col leading-snug">
                        <span className="truncate text-[15px] font-bold">{r.name}</span>
                        <span className="truncate text-xs text-faint">
                          {r.players} jogador(es) · {r.adm ? `código ${r.code}` : `mestre @${r.mestre}`}
                        </span>
                      </span>
                      {r.adm && <span className="rounded-full bg-seal px-2 py-0.5 text-[11px] font-bold tracking-[0.1em] text-white">ADM</span>}
                    </Link>
                    {r.adm && (
                      <button
                        type="button"
                        onClick={() => setConfirmDel(r.id)}
                        aria-label={`Apagar a sala ${r.name}`}
                        className="grid size-11 shrink-0 place-items-center rounded-xl border border-line-2 text-faint transition hover:border-bad hover:text-bad"
                      >
                        <IconTrash className="size-4" />
                      </button>
                    )}
                  </li>
                ),
              )}
            </ul>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
          {error}
        </p>
      )}
    </section>
  );
}
