"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { DEFAULT_FRAME } from "@/lib/retrato";
import { originKanji } from "@/lib/rules";
import type { Character, PortraitFrame } from "@/lib/types";
import { Sheet } from "./ui";

/** A imagem do retrato preenchendo o quadro em que está, com o enquadramento salvo. */
export function Retrato({ src, frame, alt = "" }: { src: string; frame?: PortraitFrame; alt?: string }) {
  const f = frame ?? DEFAULT_FRAME;
  const pos = `${f.x}% ${f.y}%`;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- arquivo já reduzido no Storage (ou data URL antiga)
    <img
      src={src}
      alt={alt}
      decoding="async"
      draggable={false}
      className="block size-full select-none object-cover"
      style={{ objectPosition: pos, transform: `scale(${f.zoom})`, transformOrigin: pos }}
    />
  );
}

/** Retrato grande (folha no celular, janela no computador). Vai para o body: pais com transform/blur prenderiam o fixed. */
export function RetratoAmpliado({ c, open, onClose }: { c: Character; open: boolean; onClose: () => void }) {
  if (!open || !c.portrait) return null;
  const name = c.name || "Shinobi sem nome";
  return createPortal(
    <Sheet open onClose={onClose} title={name}>
      <div className="mx-auto aspect-[3/4] overflow-hidden rounded-2xl bg-panel-2" style={{ width: "min(100%, 26rem, calc(68dvh * 0.75))" }}>
        <Retrato src={c.portrait} frame={c.portraitFrame} alt={`Retrato de ${name}`} />
      </div>
    </Sheet>,
    document.body,
  );
}

/** Retrato no cabeçalho da ficha em pergaminho. Sem imagem, não ocupa espaço. */
export function RetratoFicha({ c }: { c: Character }) {
  const [open, setOpen] = useState(false);
  if (!c.portrait) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ampliar retrato de ${c.name || "Shinobi sem nome"}`}
        className="print-avoid w-20 shrink-0 border-[1.5px] border-paper-ink bg-paper-2 p-1 sm:w-32"
      >
        <span className="block aspect-[3/4] overflow-hidden">
          <Retrato src={c.portrait} frame={c.portraitFrame} />
        </span>
      </button>
      <RetratoAmpliado c={c} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Retrato no cabeçalho da mesa, com o símbolo do clã num selo no canto. Sem imagem, volta o quadrado do clã. */
export function RetratoMesa({ c }: { c: Character }) {
  const [open, setOpen] = useState(false);
  if (!c.portrait)
    return <span className="hidden size-11 shrink-0 place-items-center rounded-xl bg-seal font-display text-2xl font-extrabold text-white sm:grid">{originKanji(c)}</span>;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Ver retrato" className="relative size-11 shrink-0 rounded-xl bg-panel-2">
        <span className="block size-full overflow-hidden rounded-xl">
          <Retrato src={c.portrait} frame={c.portraitFrame} />
        </span>
        <span className="absolute -right-1.5 -bottom-1.5 grid size-5 place-items-center rounded-full border-2 border-ink bg-seal font-display text-[11px] font-extrabold leading-none text-white">
          {originKanji(c)}
        </span>
      </button>
      <RetratoAmpliado c={c} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
