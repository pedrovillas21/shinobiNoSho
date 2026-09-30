"use client";

import { AnimatePresence, animate, motion, useMotionValue } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Member } from "@/lib/sala";
import { roomError, supabase } from "@/lib/supabase/client";

type Corner = "tl" | "tr" | "bl" | "br";

const CORNER_KEY = "sns-balao-canto";
const SIZE = 52;
const GAP = 12;
const SPRING = { type: "spring", stiffness: 520, damping: 38 } as const;

/**
 * Quanto da base da página está atrás da barra de tarefas do sistema: acontece quando a janela do
 * navegador passa da área útil da tela (não maximizada, esticada até embaixo). A página não enxerga
 * a barra; compara a base da janela com a área útil que a tela informa.
 */
function hiddenBelow() {
  try {
    const s = window.screen as Screen & { availTop?: number };
    const availBottom = (s.availTop ?? 0) + s.availHeight;
    const windowBottom = window.screenY + window.outerHeight;
    return Math.min(160, Math.max(0, windowBottom - availBottom));
  } catch {
    return 0;
  }
}

/** Espaço livre da tela: abaixo do cabeçalho fixo e acima da barra inferior da mesa (celular) ou da barra de tarefas. */
function insets() {
  const header = document.querySelector("header");
  const top = header && getComputedStyle(header).position === "sticky" ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
  const bar = document.querySelector<HTMLElement>("[data-bottom-bar]");
  const barVisible = bar !== null && getComputedStyle(bar).display !== "none";
  const barTop = barVisible ? bar.getBoundingClientRect().top : window.innerHeight;
  // Computador (sem a barra da mesa): folga maior embaixo e desvio da barra de tarefas.
  const desk = barVisible ? 0 : hiddenBelow() + (window.matchMedia("(pointer: fine)").matches ? 12 : 0);
  return { top: top + GAP, bottom: window.innerHeight - barTop + GAP + desk };
}

function cornerXY(c: Corner) {
  const { top, bottom } = insets();
  const w = document.documentElement.clientWidth;
  return {
    x: c[1] === "l" ? GAP : w - SIZE - GAP,
    y: c[0] === "t" ? top : window.innerHeight - bottom - SIZE,
  };
}

function readCorner(): Corner {
  try {
    const v = localStorage.getItem(CORNER_KEY);
    if (v === "tl" || v === "tr" || v === "bl" || v === "br") return v;
  } catch {
    // sem armazenamento: canto padrão
  }
  return "br";
}

/**
 * Balão de jogadores: uma bolinha no canto que dá para arrastar para qualquer canto da tela.
 * Um toque abre um cartão compacto ao lado dela, no estilo de notificação, com a ficha e a
 * Vit/Chakra de cada um ao vivo; o mestre (adm) pode expulsar.
 */
export function Jogadores({
  roomId,
  members,
  online,
  meId,
  isAdm,
  actions,
}: {
  roomId: string;
  members: Record<string, Member>;
  online: Set<string>;
  meId: string;
  isAdm: boolean;
  /** Ações da sala no rodapé do cartão (código, sair…). */
  actions?: React.ReactNode;
}) {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const [corner, setCorner] = useState<Corner>("br");
  const [placed, setPlaced] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmKick, setConfirmKick] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dragged = useRef(false);
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const grab = useRef<{ id: number; px: number; py: number; x: number; y: number; moved: boolean } | null>(null);

  // Encaixa no canto (e reencaixa quando a tela ou o cabeçalho mudam de tamanho).
  const snap = useCallback(
    (c: Corner, smooth: boolean) => {
      const p = cornerXY(c);
      if (smooth) {
        animate(x, p.x, SPRING);
        animate(y, p.y, SPRING);
      } else if (Math.abs(x.get() - p.x) > 1 || Math.abs(y.get() - p.y) > 1) {
        x.set(p.x);
        y.set(p.y);
      }
    },
    [x, y],
  );

  useEffect(() => {
    const c = readCorner();
    setCorner(c);
    snap(c, false);
    setPlaced(true);
  }, [snap]);

  useEffect(() => {
    const again = () => {
      if (!grab.current) snap(corner, false);
    };
    const ro = new ResizeObserver(again);
    ro.observe(document.body);
    window.addEventListener("resize", again);
    window.addEventListener("focus", again);
    // Mover a janela pela tela não dispara evento: confere de tempos em tempos (barra de tarefas).
    const tick = window.setInterval(again, 1500);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", again);
      window.removeEventListener("focus", again);
      window.clearInterval(tick);
    };
  }, [corner, snap]);

  // Cartão aberto: fecha ao tocar fora ou com Esc.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (cardRef.current?.contains(t) || bubbleRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      bubbleRef.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Arrastar com eventos de ponteiro (dedo ou mouse). Soltou: gruda no canto mais perto.

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    grab.current = { id: e.pointerId, px: e.clientX, py: e.clientY, x: x.get(), y: y.get(), moved: false };
    dragged.current = false;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ponteiro já solto
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const g = grab.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.px;
    const dy = e.clientY - g.py;
    if (!g.moved) {
      // Pequenos tremidos do dedo ainda contam como toque.
      if (Math.hypot(dx, dy) < 6) return;
      g.moved = true;
      setOpen(false);
    }
    const w = document.documentElement.clientWidth;
    x.set(Math.min(w - SIZE, Math.max(0, g.x + dx)));
    y.set(Math.min(window.innerHeight - SIZE, Math.max(0, g.y + dy)));
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLButtonElement>) => {
    const g = grab.current;
    if (!g || g.id !== e.pointerId) return;
    grab.current = null;
    if (!g.moved) return;
    dragged.current = true;
    const cx = x.get() + SIZE / 2;
    const cy = y.get() + SIZE / 2;
    const c = `${cy < window.innerHeight / 2 ? "t" : "b"}${cx < document.documentElement.clientWidth / 2 ? "l" : "r"}` as Corner;
    setCorner(c);
    snap(c, true);
    try {
      localStorage.setItem(CORNER_KEY, c);
    } catch {
      // sem armazenamento: volta ao canto padrão na próxima visita
    }
  };

  const list = useMemo(
    () =>
      Object.values(members).sort((a, b) => {
        if (a.role !== b.role) return a.role === "adm" ? -1 : 1;
        return (a.summary?.name ?? a.username).localeCompare(b.summary?.name ?? b.username, "pt-BR");
      }),
    [members],
  );
  const onlineCount = list.filter((m) => online.has(m.user_id)).length;

  const kick = async (userId: string) => {
    setError(null);
    const { error } = await supabase().rpc("kick_member", { p_room: roomId, p_user: userId });
    setConfirmKick(null);
    if (error) setError(roomError(error));
  };

  // O cartão nasce do canto da bolinha e cresce para o meio da tela.
  const top = corner[0] === "t";
  const right = corner[1] === "r";
  const anchor = open ? cornerXY(corner) : null;
  const cardStyle: React.CSSProperties | undefined = anchor
    ? {
        [right ? "right" : "left"]: GAP,
        ...(top ? { top: anchor.y + SIZE + 8 } : { bottom: window.innerHeight - anchor.y + 8 }),
        maxHeight: Math.min(520, top ? window.innerHeight - (anchor.y + SIZE + 8) - GAP : anchor.y - 8 - GAP),
        transformOrigin: `${top ? "top" : "bottom"} ${right ? "right" : "left"}`,
      }
    : undefined;

  return (
    <>
      <motion.button
        ref={bubbleRef}
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClick={() => {
          // O clique que chega depois de um arraste não abre o cartão.
          if (dragged.current) {
            dragged.current = false;
            return;
          }
          setConfirmKick(null);
          setOpen((v) => !v);
        }}
        whileTap={{ scale: 0.92 }}
        aria-expanded={open}
        aria-label={`Jogadores na sala: ${list.length}, ${onlineCount} online. Arraste para mudar de canto.`}
        style={{ x, y, width: SIZE, height: SIZE, touchAction: "none", opacity: placed ? 1 : 0 }}
        className={`fixed left-0 top-0 z-40 grid cursor-grab place-items-center rounded-full border shadow-[0_10px_28px_rgba(0,0,0,0.5)] transition-colors active:cursor-grabbing ${open ? "border-chakra bg-panel-2 text-paper" : "border-line-2 bg-ink-2/95 text-text backdrop-blur"}`}
      >
        <IconUsers />
        <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full border-2 border-ink bg-chakra px-1 text-[11px] font-bold leading-4 text-paper-ink">{list.length}</span>
        {onlineCount > 0 && <span className="absolute bottom-0.5 right-0.5 size-2.5 rounded-full border-2 border-ink-2 bg-ok" aria-hidden="true" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.section
            ref={cardRef}
            role="dialog"
            aria-label="Jogadores na sala"
            initial={{ opacity: 0, scale: 0.85, y: top ? -6 : 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: top ? -6 : 6 }}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
            style={cardStyle}
            className="fixed z-40 flex w-[min(340px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-line-2 bg-ink-2/97 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur"
          >
            <div className="flex items-center gap-2 border-b border-line py-2 pl-3.5 pr-2">
              <h2 className="flex-1 text-sm font-bold text-paper">
                Na sala <span className="font-medium text-muted">· {onlineCount} de {list.length} online</span>
              </h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-panel hover:text-text">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-4" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <ul className="flex min-h-0 flex-col overflow-y-auto overscroll-contain p-1.5">
              {list.map((m) => {
                const isMe = m.user_id === meId;
                const on = online.has(m.user_id);
                const s = m.summary;
                const mestre = m.role === "adm";
                return (
                  <li key={m.user_id} className="flex flex-col gap-1.5 rounded-xl px-2 py-2 hover:bg-panel">
                    <div className="flex items-center gap-2.5">
                      <span className={`relative grid size-8 shrink-0 place-items-center rounded-lg font-display text-base font-extrabold text-white ${mestre ? "bg-paper-muted" : "bg-seal"}`}>
                        {mestre ? "師" : (s?.kanji ?? "忍")}
                        <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-ink-2 ${on ? "bg-ok" : "bg-paper-muted"}`} aria-label={on ? "online" : "offline"} />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-center gap-1.5 leading-tight">
                          <span className="truncate text-[13px] font-bold text-paper">{mestre ? "Mestre" : (s?.name ?? `@${m.username}`)}</span>
                          {mestre && <span className="rounded-full bg-seal px-1.5 text-[9px] font-bold tracking-[0.1em] text-white">ADM</span>}
                          <span className="ml-auto shrink-0 text-[11px] text-faint">{isMe ? "você" : `@${m.username}`}</span>
                        </div>
                        {!mestre &&
                          (s ? (
                            <div className="grid grid-cols-2 gap-2">
                              <Bar label="Vit" cur={s.vit} max={s.vitMax} num="text-vit" sub="text-vit-muted" track="bg-[#3d1f18]" fill="var(--color-bad)" />
                              <Bar label="Chk" cur={s.chk} max={s.chkMax} num="text-chk" sub="text-chk-muted" track="bg-[#1c3346]" fill="#4f9bd9" />
                            </div>
                          ) : (
                            <span className="text-[11px] text-faint">Escolhendo ficha…</span>
                          ))}
                      </div>
                      {isAdm && !isMe && (
                        <button
                          type="button"
                          onClick={() => setConfirmKick(confirmKick === m.user_id ? null : m.user_id)}
                          aria-label={`Expulsar @${m.username}`}
                          className="grid size-8 shrink-0 place-items-center rounded-lg text-faint transition hover:bg-bad/15 hover:text-bad"
                        >
                          <IconKick />
                        </button>
                      )}
                    </div>
                    {confirmKick === m.user_id && (
                      <div className="flex items-center gap-2 rounded-lg bg-[#2a1c10] px-2.5 py-1.5 text-[11px] text-[#ffd3a8]">
                        <span className="flex-1">
                          Expulsar <b>@{m.username}</b>? Não volta com o código.
                        </span>
                        <button type="button" className="btn min-h-8 bg-bad px-2 text-[11px] text-white" onClick={() => void kick(m.user_id)}>
                          Expulsar
                        </button>
                        <button type="button" className="btn min-h-8 px-1.5 text-[11px]" onClick={() => setConfirmKick(null)}>
                          Não
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {error && (
              <p role="alert" className="mx-2 mb-2 rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-xs text-bad">
                {error}
              </p>
            )}
            {actions && <div className="border-t border-line p-2">{actions}</div>}
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

function Bar({ label, cur, max, num, sub, track, fill }: { label: string; cur: number; max: number; num: string; sub: string; track: string; fill: string }) {
  const pct = Math.max(0, Math.min(100, (cur / Math.max(1, max)) * 100));
  return (
    <span className="flex min-w-0 flex-col gap-1">
      <span className={`text-[10px] leading-none ${sub}`}>
        <b className={num}>{cur}</b>/{max} {label}
      </span>
      <span className={`block h-1 overflow-hidden rounded-full ${track}`}>
        <span className="block h-1 rounded-full transition-[width]" style={{ width: `${pct}%`, background: fill }} />
      </span>
    </span>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-6" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconKick() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M17 8l5 5M22 8l-5 5" />
    </svg>
  );
}
