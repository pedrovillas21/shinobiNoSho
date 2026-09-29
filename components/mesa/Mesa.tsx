"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { endCombat, newPlay, nextTurn, playView, syncPlay, type Logger } from "@/lib/play";
import { originKanji, originName, rankLabel, uid } from "@/lib/rules";
import { downloadJSON, useChars, useHydrated } from "@/lib/store";
import type { Character, PlayLog, PlayState } from "@/lib/types";
import { AnimatedNumber, IconDownload, IconInfo, IconLeft, IconRight } from "../ui";
import { Ataques } from "./Ataques";
import { Condicoes } from "./Condicoes";
import { Energias } from "./Energias";
import { Estados } from "./Estados";
import { Numeros } from "./Numeros";
import { Lateral } from "./Lateral";
import type { MesaProps } from "./shared";

export function Mesa({ id }: { id: string }) {
  const hydrated = useHydrated();
  const c = useChars((s) => s.chars[id]);
  const update = useChars((s) => s.update);

  // Primeira abertura da mesa: vitalidade e chakra cheios, estados sugeridos pela ficha.
  useEffect(() => {
    if (!hydrated || !c) return;
    if (!c.play) update(id, (d) => void (d.play = newPlay(d)));
    // Aptidões compradas ou escolhas mudadas depois da primeira abertura entram na mesa.
    else if (syncPlay(c, structuredClone(c.play))) update(id, (d) => void (d.play && syncPlay(d, d.play)));
  }, [hydrated, c, id, update]);

  useEffect(() => {
    if (c) document.title = `${c.name || "Shinobi"} · Mesa · Shinobi no Sho`;
  }, [c]);

  if (!hydrated) return <div className="grid min-h-dvh place-items-center text-muted">Abrindo pergaminho…</div>;
  if (!c)
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <p className="font-display text-2xl font-extrabold text-paper">Ficha não encontrada neste navegador.</p>
          <Link href="/" className="btn-primary">
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  if (!c.play) return <div className="grid min-h-dvh place-items-center text-muted">Preparando a mesa…</div>;

  return <MesaView c={c} p={c.play} />;
}

function MesaView({ c, p }: { c: Character; p: PlayState }) {
  const update = useChars((s) => s.update);
  const id = c.id;
  // Desfazer vale para a sessão aberta (não é salvo no navegador).
  const [hist, setHist] = useState<PlayState[]>([]);

  const commit = useCallback<MesaProps["commit"]>(
    (fn) => {
      const cur = useChars.getState().chars[id]?.play;
      if (!cur) return;
      setHist((h) => [structuredClone(cur), ...h].slice(0, 60));
      update(id, (d) => {
        const play = d.play;
        if (!play) return;
        const out: PlayLog[] = [];
        const log: Logger = (txt, tone = "n") => out.push({ id: uid(), r: play.round ? `R${play.round}` : "—", txt, tone });
        fn(play, log, d);
        play.log = [...out.reverse(), ...play.log].slice(0, 150);
      });
    },
    [id, update],
  );

  const patch = useCallback<MesaProps["patch"]>(
    (fn) =>
      update(id, (d) => {
        if (d.play) fn(d.play);
      }),
    [id, update],
  );

  const undo = () => {
    const [prev, ...rest] = hist;
    if (!prev) return;
    setHist(rest);
    update(id, (d) => void (d.play = prev));
  };

  const v = useMemo(() => playView(c, p), [c, p]);
  const props: MesaProps = { c, p, v, commit, patch };
  const inCombat = p.round > 0;

  return (
    <div className="min-h-dvh pb-28 lg:pb-12">
      <header className="sticky top-0 z-30 border-b border-line bg-ink/92 backdrop-blur supports-[backdrop-filter]:bg-ink/80">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-8">
          <Link href="/" className="btn-ghost size-11 shrink-0 px-0" aria-label="Voltar às fichas">
            <IconLeft />
          </Link>
          <span className="hidden size-11 shrink-0 place-items-center rounded-xl bg-seal font-display text-2xl font-extrabold text-white sm:grid">{originKanji(c)}</span>
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate font-display text-lg font-extrabold text-paper sm:text-xl">{c.name || "Shinobi sem nome"}</span>
            <span className="truncate text-xs text-muted">
              NC {c.nc} · {rankLabel(c.nc)}
              {originName(c) ? ` · ${originName(c)}` : ""}
            </span>
          </div>
          <nav aria-label="Modo da ficha" className="hidden items-center gap-1 rounded-xl border border-line-2 bg-ink-2 p-1 md:flex">
            <Link href={`/ficha/${id}`} className="grid h-9 place-items-center rounded-lg px-3 text-sm font-bold text-muted hover:text-text">
              Criação
            </Link>
            <span aria-current="page" className="grid h-9 place-items-center rounded-lg bg-chakra px-3 text-sm font-bold text-paper-ink">
              Mesa
            </span>
          </nav>
          <div className="flex flex-col items-center rounded-xl border border-line bg-panel px-3 py-1 leading-tight">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Rodada</span>
            <span className="font-display text-xl font-extrabold text-paper">{inCombat ? <AnimatedNumber value={p.round} /> : "—"}</span>
          </div>
          <button type="button" className="btn-primary hidden sm:inline-flex" onClick={() => commit((pl, log) => nextTurn(pl, log))}>
            {inCombat ? "Próximo turno" : "Iniciar combate"} <IconRight className="size-4" />
          </button>
          {inCombat && (
            <button type="button" className="btn-ghost hidden lg:inline-flex" onClick={() => commit((pl, log) => endCombat(pl, log))}>
              Encerrar combate
            </button>
          )}
          <button type="button" className="btn-ghost hidden sm:inline-flex" onClick={undo} disabled={hist.length === 0}>
            <IconUndo className="size-4" /> Desfazer
          </button>
          <button type="button" className="btn-ghost hidden size-11 px-0 xl:inline-flex" onClick={() => downloadJSON(c)} aria-label="Exportar ficha com o estado de jogo">
            <IconDownload className="size-4" />
          </button>
        </div>
        <div className="border-t border-[#4a3218] bg-[#2a1c10]">
          <p className="mx-auto flex max-w-7xl items-start gap-2 px-4 py-2 text-[13px] leading-snug text-[#ffd3a8] sm:px-8">
            <IconInfo className="mt-0.5 size-4 shrink-0" />
            Nada é travado. O site só faz as contas; bônus, custos e condições podem ser ligados, desligados e editados a qualquer momento. Quem arbitra é a mesa.
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 pt-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <main className="flex min-w-0 flex-col gap-6">
          <Energias {...props} />
          <Ataques {...props} />
          <Estados {...props} />
          <Condicoes {...props} />
          <Numeros {...props} />
        </main>
        <aside className="flex flex-col gap-6">
          <Lateral {...props} />
        </aside>
      </div>

      {/* Barra inferior (celular) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink-2/95 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <button type="button" className="btn-ghost size-12 px-0" onClick={undo} disabled={hist.length === 0} aria-label="Desfazer">
            <IconUndo />
          </button>
          {inCombat && (
            <button type="button" className="btn-ghost h-12 flex-1" onClick={() => commit((pl, log) => endCombat(pl, log))}>
              Encerrar
            </button>
          )}
          <button type="button" className="btn-primary h-12 flex-[2]" onClick={() => commit((pl, log) => nextTurn(pl, log))}>
            {inCombat ? "Próximo turno" : "Iniciar combate"} <IconRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function IconUndo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10a6 6 0 010 12h-3" />
    </svg>
  );
}
