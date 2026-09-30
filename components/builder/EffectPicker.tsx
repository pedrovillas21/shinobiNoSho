"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconCheck, IconSearch, IconX } from "../ui";
import { norm } from "./shared";

/** Como a etiqueta de nível da opção é pintada. */
export type PickTone = "excl" | "evo" | "geral" | "acima" | "tec";

export interface PickOption {
  /** Identifica a opção (único na lista). */
  value: string;
  name: string;
  /** Texto da etiqueta de nível (ex.: 5 → "Nv 5"). */
  level: number;
  desc?: string;
  source?: string;
  tone: PickTone;
  /** Chave do grupo em que a opção aparece. */
  group: string;
  /** Símbolo do poder, mostrado no botão quando a opção está escolhida (ex.: 火 na Versatilidade). */
  kanji?: string;
  disabled?: boolean;
}

export interface PickGroup {
  key: string;
  label: string;
  hint?: string;
  kanji?: string;
  tone?: PickTone;
}

export interface PickTab {
  key: string;
  label: string;
  kanji?: string;
  match: (o: PickOption) => boolean;
}

const PILL: Record<PickTone, string> = {
  excl: "bg-seal text-white",
  evo: "bg-ok/20 text-ok",
  geral: "bg-panel-2 text-text",
  tec: "bg-chk-bg text-chk",
  acima: "border border-dashed border-line-2 text-muted",
};
const GROUP_TEXT: Record<PickTone, string> = {
  excl: "text-chakra",
  evo: "text-ok",
  geral: "text-muted",
  tec: "text-chk-muted",
  acima: "text-muted",
};

/**
 * Seletor de efeito com busca, abas e grupos (exclusivos do elemento, evoluções, gerais, acima do nível).
 * No computador abre um painel sob o botão; no celular, uma gaveta que sobe de baixo.
 */
export function EffectPicker({
  value,
  options,
  groups,
  tabs = [],
  onChange,
  label,
  context,
  placeholder = "Escolher efeito…",
}: {
  value: string | null;
  options: PickOption[];
  groups: PickGroup[];
  tabs?: PickTab[];
  onChange: (v: string | null) => void;
  /** Nome acessível do botão (ex.: "3º efeito"). */
  label: string;
  /** Linha de contexto no rodapé e no título da gaveta (ex.: "Katon nível 5"). */
  context: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("todos");
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxH: number;
  } | null>(null);
  const [mobile, setMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  const current = options.find((o) => o.value === value);

  const matched = useMemo(() => {
    const t = norm(q.trim());
    return t ? options.filter((o) => norm(`${o.name} ${o.desc ?? ""}`).includes(t)) : options;
  }, [options, q]);
  const allTabs: PickTab[] = useMemo(() => [{ key: "todos", label: "Todos", match: () => true }, ...tabs], [tabs]);
  const tabMatch = allTabs.find((t) => t.key === tab)?.match ?? (() => true);
  const visible = matched.filter(tabMatch);
  const sections = groups.map((g) => ({ ...g, items: visible.filter((o) => o.group === g.key) })).filter((g) => g.items.length);
  // Ordem de navegação pelo teclado: a mesma da tela.
  const flat = sections.flatMap((g) => g.items).filter((o) => !o.disabled);

  const close = (focus = true) => {
    setOpen(false);
    if (focus) trigger.current?.focus();
  };
  const choose = (o: PickOption) => {
    if (o.disabled) return;
    onChange(o.value);
    close();
  };

  const place = () => {
    const el = trigger.current;
    if (!el) return;
    const small = window.innerWidth < 640;
    setMobile(small);
    if (small) return setPos(null);
    const r = el.getBoundingClientRect();
    const width = Math.min(Math.max(r.width, 520), window.innerWidth - 24);
    const left = Math.min(Math.max(12, r.left), window.innerWidth - width - 12);
    const below = window.innerHeight - r.bottom - 16;
    const above = r.top - 16;
    // Abre para cima só quando embaixo não cabe e em cima cabe mais.
    if (below < 360 && above > below)
      setPos({
        bottom: window.innerHeight - r.top + 8,
        left,
        width,
        maxH: Math.min(560, above),
      });
    else setPos({ top: r.bottom + 8, left, width, maxH: Math.min(560, below) });
  };

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const on = () => place();
    window.addEventListener("resize", on);
    window.addEventListener("scroll", on, true);
    return () => {
      window.removeEventListener("resize", on);
      window.removeEventListener("scroll", on, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // No celular, focar a busca abriria o teclado por cima da lista.
    if (window.matchMedia("(pointer: fine)").matches) input.current?.focus({ preventScroll: true });
    const down = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !trigger.current?.contains(t)) close(false);
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [open]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    panel.current?.querySelector(`[data-active="true"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const toggle = () => {
    if (open) return close(false);
    setQ("");
    setTab("todos");
    const i = flat.findIndex((o) => o.value === value);
    setActive(Math.max(0, i));
    setOpen(true);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(flat.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[active]) choose(flat[active]);
    }
  };

  const activeValue = flat[active]?.value;

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current?.name ?? "nenhum"}`}
        className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl border bg-ink-2 py-1.5 pr-3 pl-2 text-left transition ${open ? "border-chakra ring-3 ring-chakra/20" : "border-line-2 hover:border-muted"}`}
      >
        {current ? (
          <>
            <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-bold ${PILL[current.tone]}`}>Nv {current.level}</span>
            {current.kanji && <span className="shrink-0 font-display text-sm font-extrabold text-chakra">{current.kanji}</span>}
            <span className="min-w-0 flex-1 truncate font-bold text-text">{current.name}</span>
          </>
        ) : (
          <span className="flex-1 pl-1.5 text-muted">{placeholder}</span>
        )}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`size-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && mobile && <motion.div key="bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60" />}
            {open && (mobile || pos) && (
              <motion.div
                key="panel"
                ref={panel}
                role="dialog"
                aria-label={`${label} · ${context}`}
                onKeyDown={onKey}
                initial={mobile ? { y: "100%" } : { opacity: 0, y: pos?.bottom !== undefined ? 6 : -6 }}
                animate={mobile ? { y: 0 } : { opacity: 1, y: 0 }}
                exit={mobile ? { y: "100%" } : { opacity: 0 }}
                transition={{ type: "tween", duration: mobile ? 0.22 : 0.12 }}
                style={
                  mobile
                    ? undefined
                    : {
                        top: pos?.top,
                        bottom: pos?.bottom,
                        left: pos?.left,
                        width: pos?.width,
                        maxHeight: pos?.maxH,
                      }
                }
                className={`fixed z-[61] flex flex-col overflow-hidden border border-line-2 bg-panel text-text shadow-[0_28px_70px_rgba(0,0,0,0.6)] ${
                  mobile ? "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-3xl" : "rounded-2xl"
                }`}
              >
                {mobile && (
                  <div className="flex flex-col">
                    <span className="mx-auto mt-2 h-1 w-10 rounded-full bg-line-2" aria-hidden="true" />
                    <div className="flex items-center gap-3 px-4 pt-2 pb-1">
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="font-display text-lg font-extrabold text-paper">{label}</span>
                        <span className="text-xs text-muted">{context}</span>
                      </div>
                      <button type="button" onClick={() => close()} aria-label="Fechar" className="grid size-11 place-items-center rounded-xl border border-line-2">
                        <IconX className="size-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2.5 border-b border-line p-3">
                  <label className="flex h-11 items-center gap-2.5 rounded-xl border border-line-2 bg-ink-2 pr-1.5 pl-3 focus-within:border-chakra">
                    <IconSearch className="size-4.5 shrink-0 text-muted" />
                    <span className="sr-only">Buscar efeito</span>
                    <input
                      ref={input}
                      type="text"
                      role="combobox"
                      aria-expanded="true"
                      aria-controls={listId}
                      aria-activedescendant={activeValue ? `${listId}-${activeValue}` : undefined}
                      value={q}
                      onChange={(e) => (setQ(e.target.value), setActive(0))}
                      placeholder="Nome ou o que faz (área, prende, cega…)"
                      className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-faint"
                    />
                    {q && (
                      <button type="button" onClick={() => (setQ(""), setActive(0), input.current?.focus())} aria-label="Limpar busca" className="grid size-8 place-items-center rounded-lg bg-panel-2">
                        <IconX className="size-3.5" />
                      </button>
                    )}
                  </label>
                  {allTabs.length > 2 && (
                    <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 scrollbar-none sm:flex-wrap">
                      {allTabs.map((t) => {
                        const on = tab === t.key;
                        const n = matched.filter(t.match).length;
                        return (
                          <button
                            key={t.key}
                            type="button"
                            aria-pressed={on}
                            onClick={() => (setTab(t.key), setActive(0))}
                            className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-bold transition ${on ? "border-chakra bg-chakra text-paper-ink" : "border-line-2 text-text hover:border-muted"}`}
                          >
                            {t.kanji && <span className="font-display">{t.kanji}</span>}
                            {t.label}
                            <span className={`rounded-full px-1.5 text-[11px] ${on ? "bg-paper-ink/15" : "bg-panel-2"}`}>{n}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div id={listId} role="listbox" aria-label={context} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2">
                  {sections.map((g) => (
                    <div key={g.key} role="group" aria-label={g.label}>
                      <div className="sticky top-0 z-[1] flex items-center gap-2 bg-panel px-1.5 pt-3 pb-1.5">
                        {g.kanji && <span className="grid size-5.5 place-items-center rounded-md bg-seal font-display text-[13px] font-extrabold text-white">{g.kanji}</span>}
                        <span className={`text-[11px] font-bold tracking-[0.14em] uppercase ${GROUP_TEXT[g.tone ?? "geral"]}`}>{g.label}</span>
                        {g.hint && <span className="truncate text-xs text-muted">· {g.hint}</span>}
                      </div>
                      {g.items.map((o) => {
                        const sel = o.value === value;
                        const act = o.value === activeValue;
                        return (
                          <button
                            key={o.value}
                            id={`${listId}-${o.value}`}
                            type="button"
                            role="option"
                            aria-selected={sel}
                            aria-disabled={o.disabled}
                            data-active={act}
                            disabled={o.disabled}
                            onClick={() => choose(o)}
                            onMouseMove={() => !o.disabled && act === false && setActive(flat.indexOf(o))}
                            className={`grid w-full grid-cols-[3.25rem_minmax(0,1fr)_auto] items-start gap-3 rounded-xl p-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                              sel ? "bg-chakra/12" : act ? "bg-panel-2" : ""
                            }`}
                          >
                            <span className={`rounded-lg py-0.5 text-center text-xs font-bold ${PILL[o.tone]}`}>Nv {o.level}</span>
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span className={`font-bold ${o.tone === "acima" ? "text-muted" : "text-text"}`}>{o.name}</span>
                              {o.desc && <span className="text-[13px] leading-snug text-muted">{o.desc}</span>}
                            </span>
                            <span className="flex items-center gap-1.5 pt-0.5 text-[11px] whitespace-nowrap text-muted">
                              {o.source}
                              {sel && <IconCheck className="size-4 text-chakra" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                  {!sections.length && (
                    <div className="flex flex-col items-center gap-1.5 px-4 py-9 text-center">
                      <span className="font-display text-3xl text-line-2" aria-hidden="true">
                        無
                      </span>
                      <span className="text-sm font-bold">{q ? `Nenhum efeito com “${q}”` : "Nenhum efeito nesta aba"}</span>
                      <span className="text-[13px] text-muted">Tente outra palavra ou volte para “Todos”.</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-line bg-ink-2 px-3.5 py-2.5 text-xs text-muted">
                  <span className="truncate">
                    {visible.length} de {options.length} · {context}
                  </span>
                  <span className="hidden items-center gap-1.5 sm:flex">
                    <kbd className="rounded-md border border-line-2 bg-panel px-1.5 font-sans text-[11px] font-bold text-text">↑↓</kbd>
                    <kbd className="rounded-md border border-line-2 bg-panel px-1.5 font-sans text-[11px] font-bold text-text">Enter</kbd>
                    escolhe
                    <kbd className="rounded-md border border-line-2 bg-panel px-1.5 font-sans text-[11px] font-bold text-text">Esc</kbd>
                    fecha
                  </span>
                  {value && (
                    <button type="button" onClick={() => (onChange(null), close())} className="shrink-0 font-bold text-chakra hover:underline">
                      Limpar escolha
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
