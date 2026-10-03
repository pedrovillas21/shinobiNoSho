"use client";

import { motion } from "motion/react";
import { ATTRS, COMBAT } from "@/lib/data/base";
import { golemMokuton, golemRegras } from "@/lib/golem";
import { IconInfo, StepHeader } from "../../ui";
import { stepKicker, type StepProps } from "../shared";

const sg = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : "0");

/** Ficha do Golem do Mokuton (Livro Básico, efeito de nível 7): calculada da sua ficha, com nome e aparência livres. */
export function StepGolem({ c, set }: StepProps) {
  const g = golemMokuton(c);
  if (!g) return null;
  const edit = (k: "name" | "look", v: string) => set((d) => void (d.golem = { ...d.golem, [k]: v }));
  const stats = [
    { label: "Vitalidade", value: g.vit, sub: "metade, com o Vigor do tamanho" },
    { label: "Dano corporal", value: g.dano, sub: g.danoParts.join(" + ") },
    { label: "Reação de Esquiva", value: g.reacaoEsquiva, sub: `Esquiva ${g.combat.ESQ} + 9` },
    { label: "Deslocamento", value: `${g.desloc}m`, sub: `10 + ½ Agilidade + ${g.tamanho === "Colossal" ? 12 : 9}m` },
    { label: "Dureza", value: 0, sub: "sem dureza de corpo" },
    { label: "Alcance CC", value: `${g.alcanceCC}m`, sub: `tamanho ${g.tamanho.toLowerCase()}` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <StepHeader kicker={stepKicker(c, "golem")} title="Golem (Mokuton)">
        Monstro de madeira criado pelo efeito Golem (Mokuton 7) ou pelo Mokujin no Jutsu. A ficha sai da sua: mesmos atributos (Força vira o Espírito), habilidades de combate iguais às suas e
        perícias em 0. Ela se atualiza sozinha quando a sua muda.
      </StepHeader>

      {!g.escolhido && (
        <p className="flex items-start gap-2 rounded-xl border border-[#4a3218] bg-[#2a1c10] px-3 py-2.5 text-[13px] leading-snug text-[#ffd3a8]">
          <IconInfo className="mt-0.5 size-4 shrink-0" />
          Prévia: o golem só existe depois de escolher o efeito Golem no Mokuton (nível 7) em Poderes. Os números abaixo já mostram como ele ficaria.
        </p>
      )}

      <section className="card grid gap-3 p-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="label">Nome do golem</span>
          <input className="field" placeholder="Ex.: Mokujin, Dragão de Madeira" value={c.golem?.name ?? ""} onChange={(ev) => edit("name", ev.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="label">Aparência</span>
          <input className="field" placeholder="Humanoide, dragão, rosto de oni…" value={c.golem?.look ?? ""} onChange={(ev) => edit("look", ev.target.value)} />
        </label>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        aria-label="Ficha do golem"
        className={`flex flex-col gap-4 rounded-2xl bg-paper p-4 text-paper-ink sm:p-5 ${g.escolhido ? "" : "opacity-80"}`}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-display text-2xl font-extrabold">{c.golem?.name?.trim() || "Golem de Madeira"}</span>
          <span className="text-xs font-bold tracking-wider text-paper-muted uppercase">
            {g.tamanho} · Mokuton {g.nivel}
            {g.nv10 ? " · evoluído Nv 10" : ""}
          </span>
        </div>

        <div className="grid grid-cols-4 overflow-hidden rounded-xl border border-paper-3 text-center min-[480px]:grid-cols-7">
          {ATTRS.map((a) => {
            const nota = g.attrNota[a.key];
            return (
              <div key={a.key} className={`flex flex-col py-2 ${nota ? "bg-paper-2" : ""}`} title={nota}>
                <span className={`text-[10px] font-bold ${nota ? "text-seal-dark" : "text-paper-muted"}`}>{a.key}</span>
                <span className="font-display text-2xl font-extrabold leading-tight">{g.attrs[a.key]}</span>
              </div>
            );
          })}
        </div>
        <p className="-mt-2 text-xs text-paper-muted">
          Força = {g.attrNota.FOR}; Vigor = {g.attrNota.VIG}. Os outros são os seus.
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5 rounded-xl bg-paper-2 px-3 py-2.5">
              <span className="text-[11px] font-bold tracking-wider text-paper-muted uppercase">{s.label}</span>
              <span className="font-display text-3xl font-extrabold leading-none">{s.value}</span>
              <span className="text-xs text-paper-muted">{s.sub}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 overflow-hidden rounded-xl border border-paper-3 text-center">
          {COMBAT.map((k) => (
            <div key={k.key} className="flex flex-col py-2">
              <span className="text-[10px] font-bold text-paper-muted">{k.short}</span>
              <span className="font-display text-2xl font-extrabold leading-tight">{g.combat[k.key]}</span>
            </div>
          ))}
        </div>
        <p className="-mt-2 text-xs text-paper-muted">
          Habilidades de combate iguais às suas. Perícias: todas 0. Furtividade {sg(g.furtividade)} e Intimidar {sg(g.intimidar)} pelo tamanho.
        </p>

        <ul className="flex flex-col gap-1.5 text-sm leading-snug">
          {golemRegras(g).map((r) => (
            <li key={r} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-seal" />
              {r}
            </li>
          ))}
        </ul>
      </motion.section>

      <p className="text-xs text-muted">
        Na Mesa, a Vitalidade do golem vira um contador (“Vitalidade do Golem”, em Mais), e o efeito Golem aparece em Ataques com o custo e o dano.
      </p>
    </div>
  );
}
