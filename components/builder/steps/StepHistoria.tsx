"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DEFAULT_FRAME, ZOOM_MAX, ZOOM_MIN, clampFrame, fileToPortrait } from "@/lib/retrato";
import { originKanji } from "@/lib/rules";
import type { Character, PortraitFrame } from "@/lib/types";
import { Retrato } from "../../Retrato";
import { IconTrash, IconUpload, NumberField, StepHeader } from "../../ui";
import { stepKicker, type StepProps } from "../shared";

const FIELDS: { key: keyof Pick<Character, "appearance" | "personality" | "goals" | "history" | "notes">; label: string; hint: string; rows: number }[] = [
  { key: "appearance", label: "Aparência", hint: "Rosto, roupas, marcas, bandana…", rows: 3 },
  { key: "personality", label: "Personalidade", hint: "Jeito de agir, manias, medos, hobbies.", rows: 3 },
  { key: "goals", label: "Objetivos", hint: "O que move o seu shinobi?", rows: 2 },
  { key: "history", label: "História", hint: "Família, passado, time e sensei.", rows: 6 },
  { key: "notes", label: "Anotações da mesa", hint: "Missões, contatos, dívidas, segredos.", rows: 3 },
];

function Area({ label, hint, rows, value, onChange }: { label: string; hint: string; rows: number; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <textarea id={id} rows={rows} className="field resize-y leading-relaxed" placeholder={hint} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function StepHistoria({ c, set }: StepProps) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader kicker={stepKicker(c, "historia")} title="História">
        Não são regras, mas é o que torna o personagem único. Qual a personalidade? Como é a família? Ele tem objetivos?
      </StepHeader>
      <RetratoEditor c={c} set={set} />
      {FIELDS.map((f) => (
        <Area key={f.key} label={f.label} hint={f.hint} rows={f.rows} value={c[f.key]} onChange={(v) => set((d) => void (d[f.key] = v))} />
      ))}
      <section className="card flex flex-col gap-3 p-4">
        <span className="label">Bônus manuais</span>
        <p className="text-xs text-muted">Para benefícios de hijutsu, bijuu ou itens que alteram os valores derivados.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumberField label="Vitalidade" value={c.bonus.vit} onChange={(n) => set((d) => void (d.bonus.vit = n))} />
          <NumberField label="Chakra" value={c.bonus.chakra} onChange={(n) => set((d) => void (d.bonus.chakra = n))} />
          <NumberField label="Iniciativa" value={c.bonus.ini} onChange={(n) => set((d) => void (d.bonus.ini = n))} />
          <NumberField label="Deslocamento (m)" value={c.bonus.desloc} onChange={(n) => set((d) => void (d.bonus.desloc = n))} />
        </div>
      </section>
    </div>
  );
}

/* ---------------- retrato ---------------- */

const imageIn = (list: DataTransferItemList | FileList | null | undefined): File | null => {
  for (const it of Array.from<DataTransferItem | File>(list ?? [])) {
    const f = it instanceof File ? it : it.kind === "file" ? it.getAsFile() : null;
    if (f && f.type.startsWith("image/")) return f;
  }
  return null;
};

function RetratoEditor({ c, set }: StepProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  // Enquadramento enquanto arrasta: só vai para a ficha ao soltar, para não salvar a cada pixel.
  const [live, setLive] = useState<PortraitFrame | null>(null);
  const drag = useRef<{ x: number; y: number; w: number; h: number; from: PortraitFrame; to: PortraitFrame | null } | null>(null);
  const zoomId = useId();

  const frame = live ?? c.portraitFrame ?? DEFAULT_FRAME;
  const setFrame = (f: PortraitFrame) => set((d) => void (d.portraitFrame = clampFrame(f)));

  const load = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const url = await fileToPortrait(file);
      set((d) => {
        d.portrait = url;
        d.portraitFrame = { ...DEFAULT_FRAME };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não deu para usar essa imagem.");
    } finally {
      setBusy(false);
    }
  };

  // Ctrl+V com uma imagem na área de transferência (texto colado nos campos segue normal).
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = imageIn(e.clipboardData?.items);
      if (!f) return;
      e.preventDefault();
      void loadRef.current(f);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const remove = () =>
    set((d) => {
      delete d.portrait;
      delete d.portraitFrame;
    });

  const dropProps = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setOver(true);
    },
    onDragLeave: () => setOver(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setOver(false);
      const f = imageIn(e.dataTransfer.files);
      if (f) void load(f);
      else setError("Solte um arquivo de imagem.");
    },
  };

  // Arrastar a imagem move o ponto focal no sentido contrário (como puxar a foto dentro da moldura).
  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = e.currentTarget.getBoundingClientRect();
    drag.current = { x: e.clientX, y: e.clientY, w: r.width, h: r.height, from: frame, to: null };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const g = drag.current;
    if (!g) return;
    const k = 100 / g.from.zoom;
    g.to = clampFrame({ ...g.from, x: g.from.x - ((e.clientX - g.x) / g.w) * k, y: g.from.y - ((e.clientY - g.y) / g.h) * k });
    setLive(g.to);
  };
  const onPointerUp = () => {
    const to = drag.current?.to;
    drag.current = null;
    if (to) setFrame(to);
    setLive(null);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 3;
    // Deslocamento relativo, somado ao enquadramento salvo na hora (teclas seguidas não se perdem).
    const moves: Record<string, PortraitFrame> = {
      ArrowLeft: { zoom: 0, x: step, y: 0 },
      ArrowRight: { zoom: 0, x: -step, y: 0 },
      ArrowUp: { zoom: 0, x: 0, y: step },
      ArrowDown: { zoom: 0, x: 0, y: -step },
      "+": { zoom: 0.1, x: 0, y: 0 },
      "=": { zoom: 0.1, x: 0, y: 0 },
      "-": { zoom: -0.1, x: 0, y: 0 },
    };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    set((d) => {
      const f = d.portraitFrame ?? DEFAULT_FRAME;
      d.portraitFrame = clampFrame({ zoom: f.zoom + m.zoom, x: f.x + m.x, y: f.y + m.y });
    });
  };

  const fileInput = (
    <input
      ref={input}
      type="file"
      accept="image/*"
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (f) void load(f);
      }}
    />
  );
  const name = c.name || "Shinobi sem nome";

  return (
    <section className="card flex flex-col gap-5 p-4 sm:flex-row sm:p-5" {...dropProps}>
      {fileInput}
      {c.portrait ? (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-54">
          <button
            type="button"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            aria-label="Enquadramento do retrato: arraste a imagem ou use as setas; + e − mudam o zoom"
            className={`relative mx-auto block aspect-[3/4] w-full max-w-54 cursor-grab touch-none overflow-hidden rounded-xl bg-panel-2 active:cursor-grabbing ${over ? "ring-2 ring-chakra" : ""}`}
          >
            <Retrato src={c.portrait} frame={frame} />
            <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-bold text-text">Arraste para enquadrar</span>
          </button>
          <label htmlFor={zoomId} className="mx-auto flex w-full max-w-54 flex-col gap-1.5 text-xs font-bold text-muted">
            <span className="flex justify-between">
              <span>Zoom</span>
              <span className="text-text">{Math.round(frame.zoom * 100)}%</span>
            </span>
            <input
              id={zoomId}
              type="range"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={0.05}
              value={frame.zoom}
              onChange={(e) => setFrame({ ...frame, zoom: Number(e.target.value) })}
            />
          </label>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className={`mx-auto flex aspect-[3/4] w-full max-w-54 shrink-0 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-5 text-center text-muted transition sm:w-54 ${over ? "border-chakra bg-chakra/10" : "border-line-2 bg-ink-2 hover:border-muted"}`}
        >
          <span className="grid size-13 place-items-center rounded-2xl bg-panel-2 text-chakra">
            <IconUpload className="size-6" />
          </span>
          <span className="text-base font-bold text-paper">{busy ? "Preparando…" : "Enviar retrato"}</span>
          <span className="text-sm leading-relaxed">Arraste a imagem aqui, clique para escolher ou cole com Ctrl+V</span>
        </button>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="label">Retrato</span>
          <p className="text-sm leading-relaxed text-muted">Aparece no topo da ficha e na mesa de batalha. A imagem é reduzida ao salvar, então qualquer foto ou desenho serve.</p>
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-vit-bg px-3.5 py-2.5 text-sm text-vit">
            {error}
          </p>
        )}
        {c.portrait ? (
          <>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-ghost" onClick={() => input.current?.click()} disabled={busy}>
                <IconUpload className="size-4" /> {busy ? "Preparando…" : "Trocar imagem"}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setFrame(DEFAULT_FRAME)}>
                Centralizar
              </button>
              <button type="button" className="btn-ghost text-bad" onClick={remove}>
                <IconTrash className="size-4" /> Remover
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="label">Como fica</span>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-3 rounded-xl bg-paper px-3.5 py-3 text-paper-ink">
                  <span className="block w-13 border border-paper-ink bg-paper-2 p-0.5">
                    <span className="block aspect-[3/4] overflow-hidden">
                      <Retrato src={c.portrait} frame={frame} />
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-seal-dark">Ficha</span>
                    <span className="truncate font-display text-lg font-extrabold">{name}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-line bg-ink px-3.5 py-3">
                  <span className="relative block size-11 shrink-0">
                    <span className="block size-full overflow-hidden rounded-xl">
                      <Retrato src={c.portrait} frame={frame} />
                    </span>
                    <span className="absolute -right-1.5 -bottom-1.5 grid size-5 place-items-center rounded-full border-2 border-ink bg-seal font-display text-[11px] font-extrabold leading-none text-white">
                      {originKanji(c)}
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-chakra">Mesa</span>
                    <span className="truncate font-display text-lg font-extrabold text-paper">{name}</span>
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="rounded-xl bg-ink-2 px-3.5 py-3 text-sm leading-relaxed text-faint">Sem retrato, a ficha e a mesa mostram o símbolo do clã ou hijutsu, como antes.</p>
        )}
      </div>
    </section>
  );
}
