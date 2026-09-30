"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";
import { VISAO_MAX, curarOlhos, damage, heal, olhoTecOpcoes, perderOlho, recover, restSharingan, setChk, setVit, spend, spendVisao, vitStatus } from "@/lib/play";
import { hasApt, mangekyou } from "@/lib/rules";
import { AnimatedNumber } from "../ui";
import type { MesaProps } from "./shared";

const pct = (cur: number, max: number) => Math.max(0, Math.min(100, (cur / Math.max(1, max)) * 100));

export function Energias({ c, p, v, commit }: MesaProps) {
  const status = vitStatus(p.vit);
  const statusCls = p.vit > 0 ? "bg-[#3d1f18] text-vit" : p.vit >= -10 ? "bg-[#6b3526] text-white" : "bg-bad text-[#1b0c08]";
  const over = p.chk - v.chkMax;

  return (
    <section aria-label="Energias" className="grid gap-4 md:grid-cols-2">
      <Pool
        title="Vitalidade"
        cur={p.vit}
        max={v.vitMax}
        maxNote={v.vitMax !== v.baseVitMax ? "máx. alterado por estado ativo" : undefined}
        badge={<span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusCls}`}>{status}</span>}
        tone={{ box: "border-[#4a2418] bg-vit-bg", label: "text-vit-muted", num: "text-vit", track: "bg-[#3d1f18]", fill: "var(--color-bad)", border: "border-[#6b3526]", input: "bg-[#1f100c]" }}
        quick={[
          { label: "−1", run: () => commit((pl, log) => damage(pl, 1, log)) },
          { label: "−5", run: () => commit((pl, log) => damage(pl, 5, log)) },
          { label: "−10", run: () => commit((pl, log) => damage(pl, 10, log)) },
          { label: "+1", run: () => commit((pl, log) => heal(pl, v.vitMax, 1, log)) },
          { label: "+5", run: () => commit((pl, log) => heal(pl, v.vitMax, 5, log)) },
        ]}
        main={{ label: "Sofrer dano", cls: "btn-primary", run: (n) => commit((pl, log) => damage(pl, Math.abs(n), log)) }}
        second={{ label: "Curar", run: (n) => commit((pl, log) => heal(pl, v.vitMax, Math.abs(n), log)) }}
        onSet={(n) => commit((pl, log) => setVit(pl, n, log))}
        foot="0 fora de combate · −1 a −10 inconsciente · −11 a −20 morrendo · −21 morto. Cura nunca passa do máximo; “Definir” aceita qualquer valor."
      />
      <Pool
        title="Chakra"
        cur={p.chk}
        max={v.chkMax}
        badge={
          over > 0 ? (
            <span className="rounded-full bg-[#1f4e73] px-2.5 py-1 text-xs font-bold text-chk">+{over} acima do máximo</span>
          ) : p.chk <= 0 ? (
            <span className="rounded-full bg-[#4a2418] px-2.5 py-1 text-xs font-bold text-vit">Sem chakra · exausto</span>
          ) : null
        }
        tone={{ box: "border-[#1f3a52] bg-chk-bg", label: "text-chk-muted", num: "text-chk", track: "bg-[#1c3346]", fill: "#4f9bd9", border: "border-[#2d5577]", input: "bg-[#0e1821]" }}
        quick={[
          { label: "−1", run: () => commit((pl, log) => spend(pl, 1, log)) },
          { label: "−2", run: () => commit((pl, log) => spend(pl, 2, log)) },
          { label: "−5", run: () => commit((pl, log) => spend(pl, 5, log)) },
          { label: "+1", run: () => commit((pl, log) => recover(pl, v.chkMax, 1, log)) },
          { label: "+5", run: () => commit((pl, log) => recover(pl, v.chkMax, 5, log)) },
        ]}
        main={{ label: "Gastar chakra", cls: "btn bg-[#1f4e73] text-white hover:bg-[#1a4262]", run: (n) => commit((pl, log) => spend(pl, Math.abs(n), log)) }}
        second={{ label: "Recuperar", run: (n) => commit((pl, log) => recover(pl, v.chkMax, Math.abs(n), log)) }}
        onSet={(n) => commit((pl, log) => setChk(pl, n, log))}
        foot="Custo de técnica = nível usado. Em 0 você fica exausto até recuperar 1 ponto. Bônus como “Chakra +20” podem passar do máximo."
      />
      {(p.visao || p.olhos || hasApt(c, "izanagi") || hasApt(c, "izanami")) && <Olhos c={c} p={p} v={v} commit={commit} />}
    </section>
  );
}

interface PoolProps {
  title: string;
  cur: number;
  max: number;
  maxNote?: string;
  badge: React.ReactNode;
  tone: { box: string; label: string; num: string; track: string; fill: string; border: string; input: string };
  quick: { label: string; run: () => void }[];
  main: { label: string; cls: string; run: (n: number) => void };
  second: { label: string; run: (n: number) => void };
  onSet: (n: number) => void;
  foot: string;
}

function Pool({ title, cur, max, maxNote, badge, tone, quick, main, second, onSet, foot }: PoolProps) {
  const inputId = useId();
  const [amt, setAmt] = useState("5");
  const n = Number(amt);
  const valid = amt.trim() !== "" && Number.isFinite(n);

  return (
    <div className={`flex flex-col gap-3.5 rounded-2xl border p-4 sm:p-5 ${tone.box}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs font-bold uppercase tracking-[0.14em] ${tone.label}`}>{title}</span>
        {badge}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2.5">
        <AnimatedNumber value={cur} className={`font-display text-5xl font-extrabold leading-none sm:text-6xl ${tone.num}`} />
        <span className={`text-xl ${tone.label}`}>/ {max}</span>
        {maxNote && <span className="text-xs text-[#ffd3a8]">{maxNote}</span>}
      </div>
      <div className={`h-3 overflow-hidden rounded-full ${tone.track}`}>
        <motion.div className="h-3 rounded-full" style={{ background: tone.fill }} animate={{ width: `${pct(cur, max)}%` }} />
      </div>
      <div className="grid grid-cols-5 gap-2">
        {quick.map((q) => (
          <button key={q.label} type="button" className={`btn min-h-10 border px-0 text-sm hover:border-muted ${tone.border}`} onClick={q.run}>
            {q.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex w-24 flex-col gap-1">
          <label htmlFor={inputId} className={`text-xs ${tone.label}`}>
            Valor
          </label>
          <input
            id={inputId}
            type="number"
            inputMode="numeric"
            className={`field text-center ${tone.input} ${tone.border}`}
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && valid && main.run(n)}
          />
        </div>
        <button type="button" className={`${main.cls} min-w-32 flex-1`} disabled={!valid} onClick={() => main.run(n)}>
          {main.label}
        </button>
        <button type="button" className={`btn border hover:border-muted ${tone.border}`} disabled={!valid} onClick={() => second.run(n)}>
          {second.label}
        </button>
        <button type="button" className={`btn border hover:border-muted ${tone.border}`} disabled={!valid} onClick={() => onSet(n)}>
          Definir
        </button>
      </div>
      <p className={`text-xs leading-relaxed ${tone.label}`}>{foot}</p>
    </div>
  );
}

/**
 * Olhos do Uchiha na mesa. Pontos de visão do Mangekyou (Livro Básico, pág. 183–184): 10 no total, gastos pelas
 * técnicas e sem recuperação; só o Descanso do Sharingan, depois do 1º zero, devolve até 5. Olhos perdidos no
 * Izanagi/Izanami (Livro de Hijutsus vol. 2): ofuscado −1 e, com o Mangekyou, a técnica do olho e o Susanoo.
 */
function Olhos({ c, p, v, commit }: Pick<MesaProps, "c" | "p" | "v" | "commit">) {
  const [escolher, setEscolher] = useState(false);
  const vz = p.visao;
  const m = mangekyou(c);
  const eterno = !!m?.eterno;
  const perdidos = p.olhos?.perdidos ?? 0;
  const cego = (vz?.zeros ?? 0) >= 2 || perdidos >= 2;
  const perdidas = p.olhos?.tecs ?? [];
  const tecs = m ? [...m.tecs, m.susanoo] : [];
  const opcoes = olhoTecOpcoes(c, p);
  const pendente = p.olhos?.pendente;
  const perder = (tec: string | null) => {
    setEscolher(false);
    commit((pl, log) => perderOlho(pl, tec, log));
  };
  const badge = eterno ? (
    <span className="rounded-full bg-ok/20 px-2.5 py-1 text-xs font-bold text-ok">Eterno · sem custo</span>
  ) : cego ? (
    <span className="rounded-full bg-bad px-2.5 py-1 text-xs font-bold text-[#1b0c08]">Cego</span>
  ) : vz?.lock ? (
    <span className="rounded-full bg-[#6b3526] px-2.5 py-1 text-xs font-bold text-white">Sharingan desligado até o descanso</span>
  ) : v.visaoPen ? (
    <span className="rounded-full bg-[#3d1f18] px-2.5 py-1 text-xs font-bold text-vit">Ofuscado {v.visaoPen} permanente · ataque −{v.visaoPen}</span>
  ) : null;
  // No Kamui, um olho perdido leva só o curto ou o longo alcance: a técnica continua.
  const perdeu = (id: string) => perdidas.includes(id) || (id === "susanoo" && perdidos > 0) || cego;

  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border border-[#5a1f17] bg-[#1d0d0b] p-4 sm:p-5 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-vit-muted">{vz ? "Pontos de visão · Mangekyou Sharingan" : "Olhos · Sharingan"}</span>
        {badge}
      </div>

      {vz && (
        <>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-baseline gap-2.5">
              <AnimatedNumber value={eterno ? VISAO_MAX : vz.pts} className="font-display text-5xl font-extrabold leading-none text-vit sm:text-6xl" />
              <span className="text-xl text-vit-muted">/ {VISAO_MAX}</span>
            </div>
            {/* Um ponto por marca; as linhas mostram onde cai cada ofuscado (7, 4 e 1). */}
            <ol className="flex flex-wrap items-center gap-1.5" aria-label={`${eterno ? VISAO_MAX : vz.pts} de ${VISAO_MAX} pontos de visão`}>
              {Array.from({ length: VISAO_MAX }, (_, i) => {
                const n = VISAO_MAX - i;
                const on = eterno || n <= vz.pts;
                return (
                  <li key={n} className="flex items-center gap-1.5">
                    <span className={`grid size-6 place-items-center rounded-full border-2 transition ${on ? "border-[#e0573a] bg-[#c2381b]" : "border-[#4a2418] bg-transparent"}`} aria-hidden="true">
                      {on && <span className="size-1.5 rounded-full bg-[#1d0d0b]" />}
                    </span>
                    {(n === 8 || n === 5 || n === 2) && <span className="h-5 w-px bg-[#6b3526]" aria-hidden="true" />}
                  </li>
                );
              })}
            </ol>
          </div>
          {!eterno && (
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" disabled={!!vz.lock || cego} className="btn min-h-10 border border-[#6b3526] px-4 text-sm hover:border-muted" onClick={() => commit((pl, log) => spendVisao(pl, 1, log))}>
                −1 visão
              </button>
              <button type="button" disabled={!!vz.lock || cego} className="btn min-h-10 border border-[#6b3526] px-4 text-sm hover:border-muted" onClick={() => commit((pl, log) => spendVisao(pl, 2, log))}>
                −2 visão
              </button>
              {vz.zeros === 1 && (
                <button type="button" className="btn min-h-10 bg-[#6b3526] px-4 text-sm text-white hover:bg-[#7d3f2e]" onClick={() => commit((pl, log) => restSharingan(pl, log))}>
                  Descanso do Sharingan (24h)
                </button>
              )}
              <span className="text-xs text-vit-muted">As técnicas em “Técnicas e ataques” e o Susanoo descontam sozinhos.</span>
            </div>
          )}
          {tecs.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Técnicas do Mangekyou">
              {tecs.map((t) => {
                const lost = perdeu(t.id);
                return (
                  <li
                    key={t.id}
                    className={`rounded-full border px-2.5 py-1 text-xs ${lost ? "border-[#4a2418] text-vit-muted line-through" : t.ok ? "border-[#c2381b] bg-[#c2381b]/20 font-bold text-vit" : "border-[#4a2418] text-vit-muted"}`}
                  >
                    {t.name}
                    {!lost && !t.ok && ` · falta ${t.falta.join(", ")}`}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {/* Olhos perdidos no Izanagi e no Izanami */}
      {!eterno && (hasApt(c, "izanagi") || hasApt(c, "izanami") || perdidos > 0) && (
        <div className="flex flex-col gap-2 rounded-xl border border-[#4a2418] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-vit">
              Olhos: {2 - perdidos} de 2{perdidos === 1 ? " · ofuscado 1 permanente" : perdidos >= 2 ? " · cego" : ""}
            </span>
            <div className="flex flex-wrap gap-2">
              {perdidos < 2 && !pendente && (
                <button type="button" aria-expanded={escolher} className="btn min-h-9 border border-[#6b3526] px-3 text-xs hover:border-muted" onClick={() => setEscolher(!escolher)}>
                  Perder um olho
                </button>
              )}
              {perdidos > 0 && (
                <button type="button" className="btn min-h-9 border border-[#6b3526] px-3 text-xs hover:border-muted" onClick={() => commit((pl, log) => curarOlhos(pl, log))} title="Transplante ocular ou células de Hashirama, com aprovação do mestre">
                  Transplante ocular
                </button>
              )}
            </div>
          </div>
          {(pendente || escolher) && perdidos < 2 && (
            <div className="flex flex-col gap-2 rounded-lg bg-[#3d1f18] p-3">
              <span className="text-sm text-vit">
                {pendente ? `${pendente} terminou: perde a visão de um olho.` : "Qual olho se perde?"}
                {perdidos === 1 ? " É o último: fica cego e sem as técnicas do Sharingan." : m ? " Com o Mangekyou, vai junto a técnica desse olho e o Susanoo." : " Fica ofuscado −1 para sempre."}
              </span>
              <div className="flex flex-wrap gap-2">
                {perdidos === 0 && opcoes.length > 0 ? (
                  opcoes.map((o) => (
                    <button key={o.id} type="button" className="btn min-h-10 bg-[#6b3526] px-4 text-sm text-white hover:bg-[#7d3f2e]" onClick={() => perder(o.id)}>
                      Olho do {o.name}
                    </button>
                  ))
                ) : (
                  <button type="button" className="btn min-h-10 bg-[#6b3526] px-4 text-sm text-white hover:bg-[#7d3f2e]" onClick={() => perder(perdidos === 0 ? (opcoes[0]?.id ?? null) : null)}>
                    Perder o olho
                  </button>
                )}
              </div>
            </div>
          )}
          <p className="text-xs leading-relaxed text-vit-muted">
            Izanagi e Izanami (somente PdM) cobram a visão de um olho ao terminar. A mesa avisa quando é hora; a escolha do olho é do jogador. Só um transplante ocular (ou células de Hashirama) cura.
          </p>
        </div>
      )}

      <p className="text-xs leading-relaxed text-vit-muted">
        {eterno
          ? "Mangekyou Eterno: as técnicas não custam visão e não há ofuscado nem cegueira."
          : vz
            ? "Não se recuperam, nem no descanso. A cada 3 perdidos, ofuscado permanente (com 7, 4 e 1 ponto), fora do limite de −3. Ao zerar pela 1ª vez: atordoado e desprevenido por 1 turno e Sharingan desligado; o Descanso do Sharingan (24h sem usar) devolve até 5, mas o ofuscado 3 fica. Ao zerar de novo: cego."
            : "Ofuscado dos olhos perdidos é permanente e soma no ataque fora do limite de −3."}
      </p>
    </div>
  );
}
