"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId } from "react";

/* ---------------- ícones (traço) ---------------- */

type IconProps = { className?: string };
const svg = (d: React.ReactNode) =>
  function Icon({ className = "size-5" }: IconProps) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        {d}
      </svg>
    );
  };

export const IconPlus = svg(<path d="M12 5v14M5 12h14" />);
export const IconMinus = svg(<path d="M5 12h14" />);
export const IconCheck = svg(<path d="M5 12.5l4.5 4.5L19 7.5" />);
export const IconX = svg(<path d="M6 6l12 12M18 6L6 18" />);
export const IconSearch = svg(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>);
export const IconLeft = svg(<path d="M15 18l-6-6 6-6" />);
export const IconRight = svg(<path d="M9 18l6-6-6-6" />);
export const IconDownload = svg(<path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 20h14" />);
export const IconUpload = svg(<path d="M12 20V9m0 0l-4.5 4.5M12 9l4.5 4.5M5 4h14" />);
export const IconPrint = svg(<><path d="M7 9V4h10v5" /><rect x="4" y="9" width="16" height="8" rx="2" /><path d="M7 14h10v6H7z" /></>);
export const IconTrash = svg(<path d="M5 7h14M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" />);
export const IconCopy = svg(<><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" /></>);
export const IconAlert = svg(<><path d="M12 3l10 18H2L12 3z" /><path d="M12 10v4m0 3v.5" /></>);
export const IconInfo = svg(<><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-9v.5" /></>);
export const IconScroll = svg(<><path d="M6 4h11a2 2 0 012 2v12a2 2 0 01-2 2H7" /><path d="M6 4a2 2 0 00-2 2v1h4V6a2 2 0 00-2-2zM8 7v11a2 2 0 11-4 0" /><path d="M11 9h5M11 13h5" /></>);
export const IconList = svg(<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />);
export const IconDice = svg(<><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01" /></>);
export const IconLock = svg(<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 118 0v3" /></>);

export function Logo({ className = "size-9" }: IconProps) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      <circle cx="18" cy="18" r="16" stroke="var(--color-seal)" strokeWidth="2.5" />
      <path d="M18 6c4 4 4 8 0 12s-4 8 0 12" stroke="var(--color-chakra)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="18" cy="18" r="2.5" fill="var(--color-text)" />
    </svg>
  );
}

/* ---------------- números ---------------- */

export function AnimatedNumber({ value, className }: { value: number | string; className?: string }) {
  return (
    // shrink-0: numa linha flex com texto longo ao lado, o número não pode encolher (o overflow-hidden cortaria os dígitos).
    <span className={`relative inline-flex shrink-0 overflow-hidden tabular-nums ${className ?? ""}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(value)}
          initial={{ y: "60%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-60%", opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
  canInc?: boolean;
  tone?: "paper" | "dark";
  size?: "md" | "sm";
}

export function Stepper({ value, onChange, min = 0, max = 99, label, canInc = true, tone = "dark", size = "md" }: StepperProps) {
  const dec = value > min;
  const inc = value < max && canInc;
  const box = size === "sm" ? "size-9 rounded-lg" : "size-11 rounded-xl";
  const decCls = tone === "paper" ? "border border-[#cdbb9c] bg-paper-2 text-paper-ink" : "border border-line-2 bg-ink-2 text-text";
  return (
    <div className="flex items-center gap-2">
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        disabled={!dec}
        onClick={() => onChange(value - 1)}
        aria-label={`Diminuir ${label}`}
        className={`${box} ${decCls} grid place-items-center transition disabled:opacity-30`}
      >
        <IconMinus className="size-4" />
      </motion.button>
      <AnimatedNumber value={value} className={`${size === "sm" ? "w-7 text-xl" : "w-10 text-3xl"} justify-center font-display font-extrabold`} />
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        disabled={!inc}
        onClick={() => onChange(value + 1)}
        aria-label={`Aumentar ${label}`}
        className={`${box} grid place-items-center bg-seal text-white transition disabled:opacity-30`}
      >
        <IconPlus className="size-4" />
      </motion.button>
    </div>
  );
}

export function NumberField({ value, onChange, label, className = "" }: { value: number; onChange: (v: number) => void; label: string; className?: string }) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-xs text-faint">
        {label}
      </label>
      <input id={id} type="number" inputMode="numeric" className="field py-2 text-center" value={Number.isFinite(value) ? value : 0} onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </div>
  );
}

/* ---------------- toggle ---------------- */

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-start gap-3 rounded-xl p-2 text-left transition hover:bg-panel-2">
      <span className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-chakra" : "bg-line-2"}`}>
        <motion.span layout className={`absolute top-1 size-4 rounded-full bg-white ${checked ? "right-1" : "left-1"}`} />
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-bold text-text">{label}</span>
        {hint && <span className="text-xs leading-relaxed text-muted">{hint}</span>}
      </span>
    </button>
  );
}

/* ---------------- títulos ---------------- */

export function StepHeader({ kicker, title, children }: { kicker?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {kicker && <span className="text-xs font-bold uppercase tracking-[0.18em] text-chakra">{kicker}</span>}
      <h2 className="font-display text-3xl font-extrabold text-paper sm:text-4xl">{title}</h2>
      {children && <div className="max-w-2xl text-[15px] leading-relaxed text-muted">{children}</div>}
    </div>
  );
}

/* ---------------- sheet / modal ---------------- */

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
          <motion.button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="relative flex max-h-[88dvh] w-full flex-col rounded-t-3xl border border-line bg-panel sm:max-w-2xl sm:rounded-3xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <h3 className="font-display text-xl font-extrabold text-paper">{title}</h3>
              <button type="button" onClick={onClose} className="btn-ghost size-11 px-0" aria-label="Fechar">
                <IconX />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "ok" | "bad" | "chakra" | "seal" }) {
  const map = {
    muted: "bg-panel-2 text-muted",
    ok: "bg-ok/15 text-ok",
    bad: "bg-bad/15 text-bad",
    chakra: "bg-chakra/15 text-chakra",
    seal: "bg-seal text-white",
  } as const;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${map[tone]}`}>{children}</span>;
}
