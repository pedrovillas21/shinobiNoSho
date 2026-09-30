"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playView, withLog } from "@/lib/play";
import { originKanji, originName, rankLabel } from "@/lib/rules";
import { useMesa } from "@/lib/sala";
import { downloadJSON } from "@/lib/store";
import type { Character, PlayState } from "@/lib/types";
import { AnimatedNumber, IconDownload, IconInfo, IconLeft } from "../ui";
import { Ataques } from "./Ataques";
import { CombateAviso, CombateBotoes, CombateErro, Rodada, useCombate } from "./Combate";
import { Condicoes } from "./Condicoes";
import { Energias } from "./Energias";
import { Estados } from "./Estados";
import { Numeros } from "./Numeros";
import { Lateral } from "./Lateral";
import type { MesaProps } from "./shared";

/** Mesa de uma ficha dentro de uma sala. O estado de jogo vem de useMesa (salvo por sala). */
export function Mesa({ c, room, switcher }: { c: Character; room: React.ReactNode; switcher?: React.ReactNode }) {
  const p = useMesa((s) => s.plays[c.id]);

  useEffect(() => {
    document.title = `${c.name || "Shinobi"} · Mesa · Shinobi no Sho`;
  }, [c]);

  if (!p) return <div className="grid min-h-dvh place-items-center text-muted">Preparando a mesa…</div>;
  return <MesaView key={c.id} c={c} p={p} room={room} switcher={switcher} />;
}

const NO_HIST: PlayState[] = [];

function MesaView({ c, p, room, switcher }: { c: Character; p: PlayState; room: React.ReactNode; switcher?: React.ReactNode }) {
  const setPlay = useMesa((s) => s.setPlay);
  // Desfazer por ficha, guardado na sala: o mestre troca de ficha e volta sem perder; zera quando a rodada muda.
  const hist = useMesa((s) => s.hist[c.id] ?? NO_HIST);
  const setHist = useMesa((s) => s.setHist);

  const commit = useCallback<MesaProps["commit"]>(
    (fn) => {
      const st = useMesa.getState();
      const cur = st.plays[c.id];
      if (!cur) return;
      setHist(c.id, [structuredClone(cur), ...(st.hist[c.id] ?? [])].slice(0, 60));
      const play = structuredClone(cur);
      withLog(play, (log) => fn(play, log, structuredClone(c)));
      setPlay(c.id, play);
    },
    [c, setPlay, setHist],
  );

  const patch = useCallback<MesaProps["patch"]>(
    (fn) => {
      const cur = useMesa.getState().plays[c.id];
      if (!cur) return;
      const play = structuredClone(cur);
      fn(play);
      setPlay(c.id, play);
    },
    [c.id, setPlay],
  );

  const undo = () => {
    const [prev, ...rest] = hist;
    if (!prev) return;
    setHist(c.id, rest);
    // A rodada é do mestre: desfazer nunca tira a ficha dela.
    setPlay(c.id, { ...prev, round: p.round });
  };

  const v = useMemo(() => playView(c, p), [c, p]);
  const props: MesaProps = { c, p, v, commit, patch };
  const combate = useCombate();
  const round = combate.round ?? p.round;
  // A mesa é dividida em abas. No computador, "Mais" (descanso, usos, histórico) é a coluna fixa da direita.
  // A aba aberta continua a mesma quando o mestre troca de ficha.
  const [tab, setTab] = useState<TabKey>(() => lastTab);
  const goTab = (k: TabKey) => {
    lastTab = k;
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
          <Link href="/" className="btn-ghost size-11 shrink-0 px-0" aria-label="Voltar ao início">
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
          {room}
          <Rodada round={round} />
          {combate.isAdm && <CombateBotoes />}
          <button type="button" className="btn-ghost hidden lg:inline-flex" onClick={undo} disabled={hist.length === 0}>
            <IconUndo className="size-4" /> Desfazer
          </button>
          <button type="button" className="btn-ghost hidden size-11 px-0 xl:inline-flex" onClick={() => downloadJSON({ ...c, play: p })} aria-label="Exportar ficha com o estado de jogo">
            <IconDownload className="size-4" />
          </button>
        </div>
        {combate.error && (
          <div className="mx-auto max-w-7xl px-4 pb-2 sm:px-8">
            <CombateErro />
          </div>
        )}
        {/* Troca rápida de ficha (só o mestre) */}
        {switcher && <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-8">{switcher}</div>}
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
      <div data-bottom-bar className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink-2/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 pt-2">
          <button type="button" className="btn-ghost size-11 min-h-11 px-0" onClick={undo} disabled={hist.length === 0} aria-label="Desfazer">
            <IconUndo />
          </button>
          {combate.isAdm ? <CombateBotoes bar /> : <CombateAviso round={round} />}
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
let lastTab: TabKey = "status";

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
