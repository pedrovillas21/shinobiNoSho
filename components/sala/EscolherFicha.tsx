"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { originKanji, originName, rankLabel } from "@/lib/rules";
import type { SalaInfo } from "@/lib/sala";
import { useChars, useCharsStatus, useHydrated } from "@/lib/store";
import { roomError, supabase } from "@/lib/supabase/client";
import { IconPlus } from "../ui";

/** Escolha da ficha para entrar na sala. O jogador fica com ela; só o mestre troca de ficha lá dentro. */
export function EscolherFicha({ room }: { room: SalaInfo }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const status = useCharsStatus();
  const chars = useChars((s) => s.chars);
  const create = useChars((s) => s.create);
  const list = Object.values(chars).sort((a, b) => b.updatedAt - a.updatedAt);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chosen = picked ? chars[picked] : undefined;

  const join = async (characterId: string | null) => {
    setBusy(true);
    setError(null);
    const { error } = await supabase().rpc("join_room", { p_code: room.code, p_character: characterId });
    if (error) {
      setBusy(false);
      setError(roomError(error));
      return;
    }
    // A página da sala volta já com a mesa desta ficha.
    router.refresh();
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col items-center justify-center gap-7 px-4 py-10 sm:px-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-chakra">
          Sala {room.code} · mestre @{room.ownerUsername}
        </span>
        <h1 className="font-display text-4xl font-extrabold text-paper sm:text-5xl">{room.name}</h1>
        <p className="text-base text-muted">Com qual ficha você vai jogar nesta sala? Depois de entrar, a ficha não troca.</p>
      </div>

      {!hydrated ? (
        status === "error" ? (
          <p role="alert" className="text-sm text-bad">
            Não foi possível carregar suas fichas. Recarregue a página.
          </p>
        ) : (
          <div className="grid w-full gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card h-48 animate-pulse" />
            ))}
          </div>
        )
      ) : list.length === 0 ? (
        <div className="card flex w-full max-w-md flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="font-display text-xl font-extrabold text-paper">Você ainda não tem fichas</span>
          <span className="text-sm text-muted">Crie uma ficha e depois volte por este mesmo link (/sala/{room.code}).</span>
          <button type="button" className="btn-primary" onClick={() => router.push(`/ficha/${create(4)}`)}>
            <IconPlus className="size-4" /> Criar ficha
          </button>
        </div>
      ) : (
        <ul className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
            const on = picked === c.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPicked(c.id)}
                  className={`flex w-full flex-col items-center gap-2.5 rounded-2xl border-2 px-4 py-6 text-center transition ${on ? "border-chakra bg-panel-2" : "border-line bg-panel hover:border-line-2"}`}
                >
                  <span className="grid size-16 place-items-center rounded-2xl bg-seal font-display text-3xl font-extrabold text-white">{originKanji(c)}</span>
                  <span className="font-display text-xl font-extrabold text-paper">{c.name || "Shinobi sem nome"}</span>
                  <span className="text-sm text-muted">
                    {originName(c) ?? "Sem clã"} · NC {c.nc} · {rankLabel(c.nc)}
                  </span>
                  <span className={`mt-1 rounded-full px-2.5 py-1 text-xs font-bold ${on ? "bg-chakra text-paper-ink" : "bg-ink-2 text-faint"}`}>{on ? "Selecionada" : "Escolher"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-ghost h-12">
          Voltar
        </Link>
        <button type="button" className="btn-primary h-12 px-6" disabled={!chosen || busy} onClick={() => void join(picked)}>
          {busy ? "Entrando…" : chosen ? `Entrar com ${chosen.name || "Shinobi sem nome"}` : "Escolha uma ficha"}
        </button>
      </div>
      <p className="max-w-lg text-center text-[13px] text-faint">A vida, o chakra e as condições ficam salvos só nesta sala. Editar a ficha continua sendo na tela de criação.</p>
    </main>
  );
}
