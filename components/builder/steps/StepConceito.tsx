"use client";

import { useId } from "react";
import { ALIGNMENTS, VILLAGES } from "@/lib/data/base";
import { NC_MAX, NC_MIN, budgetFor, rankLabel } from "@/lib/rules";
import type { Character } from "@/lib/types";
import { StepHeader, Toggle } from "../../ui";
import type { StepProps } from "../shared";

function Text({ label, value, onChange, placeholder, className = "" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input id={id} className="field" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** Texto livre com sugestões: a pessoa pode digitar qualquer coisa. */
function Suggest({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input id={id} list={`${id}-list`} className="field" value={value} onChange={(e) => onChange(e.target.value)} autoComplete="off" />
      <datalist id={`${id}-list`}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </div>
  );
}

export function StepConceito({ c, set }: StepProps) {
  const b = budgetFor(c.nc, c.optionals);
  const field = <K extends keyof Character>(k: K) => (v: Character[K]) => set((d) => void (d[k] = v));
  const nameId = useId();

  return (
    <div className="flex flex-col gap-8">
      <StepHeader kicker="Etapa 1" title="Conceito">
        Tudo aqui é seu: escreva o nome, a vila e a tendência que quiser (as sugestões são só atalhos). O Nível de Campanha define os pontos de toda a ficha.
      </StepHeader>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameId} className="label">
          Nome do shinobi
        </label>
        <input
          id={nameId}
          value={c.name}
          onChange={(e) => field("name")(e.target.value)}
          placeholder="Nome do seu shinobi"
          className="border-0 border-b-2 border-line-2 bg-transparent pb-2 font-display text-3xl font-extrabold text-paper outline-none placeholder:text-line-2 focus:border-chakra sm:text-5xl"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Text label="Jogador" value={c.player} onChange={field("player")} />
        <Text label="Idade" value={c.age} onChange={field("age")} />
        <Text label="Gênero" value={c.gender} onChange={field("gender")} />
        <Suggest label="Vila atuante" value={c.village} onChange={field("village")} options={VILLAGES} />
        <Suggest label="Vila de origem" value={c.originVillage} onChange={field("originVillage")} options={VILLAGES} />
        <Suggest label="Tendência" value={c.alignment} onChange={field("alignment")} options={ALIGNMENTS} />
      </div>

      <section className="card flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-2xl font-extrabold text-paper">Nível de Campanha</h3>
          <span className="text-sm font-bold text-chakra">{rankLabel(c.nc)}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="w-20 font-display text-5xl font-extrabold text-paper">{c.nc}</span>
          <input
            type="range"
            min={NC_MIN}
            max={NC_MAX}
            value={c.nc}
            onChange={(e) => set((d) => void (d.nc = Number(e.target.value)))}
            aria-label="Nível de Campanha"
            className="flex-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Atributos", b.attr],
            ["Perícias", b.skill],
            ["Poderes", b.power],
            ["Sociais", b.social],
            ["Atributo mínimo", b.minAttr],
            ["Atributo máximo", c.nc],
            ["Limite de poder", b.cap],
            ["Ryos iniciais", b.ryos.toLocaleString("pt-BR")],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-ink-2 px-3 py-2">
              <div className="text-[11px] text-faint">{k}</div>
              <div className="font-display text-xl font-extrabold">{v}</div>
            </div>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-muted">
          Regra da mesa: o NC vai até <strong className="text-paper">30</strong>. Acima do 20, cada nível soma +6 atributos, +4 perícias e +2 poderes, e o mínimo de atributo sobe 1 a cada NC ímpar.
        </p>
      </section>

      <section className="card flex flex-col gap-2 p-5 sm:p-6">
        <h3 className="font-display text-2xl font-extrabold text-paper">Regras opcionais</h3>
        <p className="mb-2 text-sm text-muted">Combine com o mestre antes de ativar.</p>
        <Toggle
          checked={c.optionals.livre}
          onChange={(v) => set((d) => void (d.optionals.livre = v))}
          label="Modo livre (sem travas)"
          hint="Ignora orçamentos, limites de NC e pré-requisitos. Tudo vira aviso em vez de erro. Bom para PdMs e fichas da casa."
        />
        <Toggle
          checked={c.optionals.tresPontosPoder}
          onChange={(v) => set((d) => void (d.optionals.tresPontosPoder = v))}
          label="3 pontos de poder por NC (Guia Avançado)"
          hint="Começa com 6 no NC 4, +3 por nível, 60 no NC 20 (e +3 por nível acima)."
        />
        <Toggle
          checked={c.optionals.aptidoesBanidas}
          onChange={(v) => set((d) => void (d.optionals.aptidoesBanidas = v))}
          label="Aptidões de habilidade banidas (Guia Avançado)"
          hint="Sem Especialista, Maestria, Reflexos e Intuição; seus pré-requisitos são ignorados. +4 pontos de poder."
        />
        <Toggle
          checked={c.optionals.danoExtraAuto}
          onChange={(v) => set((d) => void (d.optionals.danoExtraAuto = v))}
          label="Dano Extra automático (Guia Avançado)"
          hint="Todos ganham Dano Extra de graça ao alcançar CC ou CD 18."
        />
        <Toggle
          checked={c.optionals.multiHijutsu}
          onChange={(v) => set((d) => void (d.optionals.multiHijutsu = v))}
          label="Dois ou mais clãs/hijutsus (Livro Básico)"
          hint="Permite escolher origens extras na etapa Clã. Use com cautela."
        />
      </section>
    </div>
  );
}
