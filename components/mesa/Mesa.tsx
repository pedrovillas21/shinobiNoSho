"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  // A mesa é dividida em abas. No computador, "Mais" (descanso, usos, histórico) é a coluna fixa da direita.
  const [tab, setTab] = useState<TabKey>("status");
  const goTab = (k: TabKey) => {
    setTab(k);
    window.scrollTo({ top: 0 });
  };
  const show = (k: TabKey) => (tab === k ? "" : k === "status" && tab === "mais" ? "hidden lg:block" : "hidden");
  const badges: Partial<Record<TabKey, number>> = { status: p.conds.length, estados: p.effects.filter((e) => e.active).length };

  // Altura do cabeçalho fixo, para a coluna da direita grudar logo abaixo dele.
  const headerRef = useRef<HTMLElement>(null);
  const [headerH, setHeaderH] = useState(0);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const measure = () => setHeaderH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div className="min-h-dvh pb-40 lg:pb-12" style={{ "--mesa-top": `${headerH}px` } as React.CSSProperties}>
      <header ref={headerRef} className="sticky top-0 z-30 border-b border-line bg-ink/92 backdrop-blur supports-[backdrop-filter]:bg-ink/80">
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
          <button type="button" className="btn-primary hidden lg:inline-flex" onClick={() => commit((pl, log) => nextTurn(pl, log))}>
            {inCombat ? "Próximo turno" : "Iniciar combate"} <IconRight className="size-4" />
          </button>
          {inCombat && (
            <button type="button" className="btn-ghost hidden lg:inline-flex" onClick={() => commit((pl, log) => endCombat(pl, log))}>
              Encerrar combate
            </button>
          )}
          <button type="button" className="btn-ghost hidden lg:inline-flex" onClick={undo} disabled={hist.length === 0}>
            <IconUndo className="size-4" /> Desfazer
          </button>
          <button type="button" className="btn-ghost hidden size-11 px-0 xl:inline-flex" onClick={() => downloadJSON(c)} aria-label="Exportar ficha com o estado de jogo">
            <IconDownload className="size-4" />
          </button>
        </div>
        {/* Vida e chakra sempre à vista, em qualquer aba */}
        <button type="button" onClick={() => goTab("status")} aria-label="Ver vitalidade e chakra" className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-3 px-4 pb-3 text-left sm:px-8 lg:hidden">
          <MiniPool label="Vit" cur={p.vit} max={v.vitMax} num="text-vit" track="bg-[#3d1f18]" fill="var(--color-bad)" />
          <MiniPool label="Chakra" cur={p.chk} max={v.chkMax} num="text-chk" track="bg-[#1c3346]" fill="#4f9bd9" />
        </button>
        {/* Computador: abas no topo e vida/chakra ao lado */}
        <div className="mx-auto hidden max-w-7xl items-end gap-6 px-8 lg:flex">
          <nav aria-label="Partes da mesa" className="flex flex-1">
            {TABS.filter((t) => t.k !== "mais").map((t) => {
              const on = tab === t.k || (t.k === "status" && tab === "mais");
              const n = badges[t.k] ?? 0;
              return (
                <button
                  key={t.k}
                  type="button"
                  aria-current={on ? "page" : undefined}
                  onClick={() => goTab(t.k)}
                  className={`relative flex h-12 items-center gap-2 px-4 text-sm font-bold transition ${on ? "text-paper" : "text-faint hover:text-muted"}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
                    {t.icon}
                  </svg>
                  {t.label}
                  {n > 0 && (
                    <span className="grid min-w-5 place-items-center rounded-full bg-chakra px-1.5 text-[11px] leading-5 text-paper-ink" aria-label={`${n} ativo(s)`}>
                      {n}
                    </span>
                  )}
                  {on && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-chakra" />}
                </button>
              );
            })}
          </nav>
          <button type="button" onClick={() => goTab("status")} aria-label="Ver vitalidade e chakra" className="grid w-[380px] shrink-0 grid-cols-2 gap-4 pb-3 text-left">
            <MiniPool label="Vit" cur={p.vit} max={v.vitMax} num="text-vit" track="bg-[#3d1f18]" fill="var(--color-bad)" />
            <MiniPool label="Chakra" cur={p.chk} max={v.chkMax} num="text-chk" track="bg-[#1c3346]" fill="#4f9bd9" />
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 pt-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <main className="flex min-w-0 flex-col gap-6">
          <div className={show("status")}>
            <Energias {...props} />
          </div>
          <div className={show("status")}>
            <Condicoes {...props} />
          </div>
          <p className={`items-start gap-2 rounded-xl border border-[#4a3218] bg-[#2a1c10] px-3 py-2 text-[13px] leading-snug text-[#ffd3a8] ${tab === "status" ? "flex" : tab === "mais" ? "hidden lg:flex" : "hidden"}`}>
            <IconInfo className="mt-0.5 size-4 shrink-0" />
            {NOTHING_LOCKED}
          </p>
          <div className={show("ataques")}>
            <Ataques {...props} />
          </div>
          <div className={show("estados")}>
            <Estados {...props} />
          </div>
          <div className={show("numeros")}>
            <Numeros {...props} />
          </div>
        </main>
        {/* Computador: coluna fixa ao rolar, com rolagem própria */}
        <aside
          className={`flex-col gap-6 lg:sticky lg:top-[calc(var(--mesa-top)+1.5rem)] lg:flex lg:max-h-[calc(100dvh-var(--mesa-top)-3rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1 ${tab === "mais" ? "flex" : "hidden"}`}
        >
          <Lateral {...props} />
        </aside>
      </div>

      {/* Barra inferior (celular e tablet): turno e abas da mesa */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink-2/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 pt-2">
          <button type="button" className="btn-ghost size-11 min-h-11 px-0" onClick={undo} disabled={hist.length === 0} aria-label="Desfazer">
            <IconUndo />
          </button>
          {inCombat && (
            <button type="button" className="btn-ghost h-11 min-h-11 flex-1" onClick={() => commit((pl, log) => endCombat(pl, log))}>
              Encerrar
            </button>
          )}
          <button type="button" className="btn-primary h-11 min-h-11 flex-[2]" onClick={() => commit((pl, log) => nextTurn(pl, log))}>
            {inCombat ? "Próximo turno" : "Iniciar combate"} <IconRight className="size-4" />
          </button>
        </div>
        <nav aria-label="Partes da mesa" className="mx-auto grid max-w-3xl grid-cols-5 px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1">
          {TABS.map((t) => {
            const on = tab === t.k;
            const n = badges[t.k] ?? 0;
            return (
              <button
                key={t.k}
                type="button"
                aria-current={on ? "page" : undefined}
                onClick={() => goTab(t.k)}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-bold transition ${on ? "text-chakra" : "text-muted hover:text-text"}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-6" aria-hidden="true">
                  {t.icon}
                </svg>
                {t.label}
                {n > 0 && (
                  <span className="absolute right-[calc(50%-1.4rem)] top-1 grid min-w-4 place-items-center rounded-full bg-chakra px-1 text-[10px] leading-4 text-paper-ink" aria-label={`${n} ativo(s)`}>
                    {n}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

const NOTHING_LOCKED = "Nada é travado. O site só faz as contas; bônus, custos e condições podem ser ligados, desligados e editados a qualquer momento. Quem arbitra é a mesa.";

type TabKey = "status" | "ataques" | "estados" | "numeros" | "mais";

const TABS: { k: TabKey; label: string; icon: React.ReactNode }[] = [
  { k: "status", label: "Status", icon: <path d="M12 21s-7-4.5-9.3-9A5.2 5.2 0 0112 6.3 5.2 5.2 0 0121.3 12C19 16.5 12 21 12 21z" /> },
  { k: "ataques", label: "Ataques", icon: <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2" /> },
  { k: "estados", label: "Estados", icon: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /> },
  { k: "numeros", label: "Números", icon: <path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" /> },
  { k: "mais", label: "Mais", icon: <path d="M4 6h16M4 12h16M4 18h10" /> },
];

function MiniPool({ label, cur, max, num, track, fill }: { label: string; cur: number; max: number; num: string; track: string; fill: string }) {
  const pct = Math.max(0, Math.min(100, (cur / Math.max(1, max)) * 100));
  return (
    <span className="flex min-w-0 flex-col gap-1">
      <span className="flex items-baseline gap-1.5 leading-none">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{label}</span>
        <span className={`font-display text-lg font-extrabold ${num}`}>
          <AnimatedNumber value={cur} />
        </span>
        <span className="text-xs text-muted">/ {max}</span>
      </span>
      <span className={`block h-1.5 overflow-hidden rounded-full ${track}`}>
        <span className="block h-1.5 rounded-full transition-[width]" style={{ width: `${pct}%`, background: fill }} />
      </span>
    </span>
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
