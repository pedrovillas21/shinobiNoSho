"use client";

import { Fragment, useMemo, useState } from "react";
import { GRAU_2D8, ataques, graus, grupoBasico, outrosPoderes, partsText, type AtkRow, type Calc, type PotMode } from "@/lib/ataques";
import { podeEnergizar } from "@/lib/dano";
import { checkChakra, olhoPendente, payChakra, sg, sharinganTravado, spendVisao } from "@/lib/play";
import { hasApt, uid } from "@/lib/rules";
import { AnimatedNumber, IconMinus, IconPlus, IconTrash } from "../ui";
import { SectionTitle, type MesaProps } from "./shared";

/** Os três melhoramentos do Potencializar (Livro Básico, aptidões de técnica). */
const POT_LABEL: Record<PotMode, string> = { dano: "+1 de dano base", alcance: "alcance ×2", area: "área ×2" };

/** Colunas da tabela de dano (nome · 4 graus · usar), quando o painel tem largura para isso. */
const COLS = "@2xl:grid-cols-[minmax(0,1fr)_repeat(4,3.75rem)_6.75rem]";

export function Ataques(props: MesaProps) {
  const { c, p, v, commit, patch } = props;
  // Golpes energizados e Ataque Poderoso valem para o taijutsu e as armas; ficam ligados até a pessoa desligar.
  const [energ, setEnerg] = useState(false);
  const [poderoso, setPoderoso] = useState(false);
  const canEnerg = podeEnergizar(c);
  const canPoderoso = hasApt(c, "ataque-poderoso");
  const basico = useMemo(() => grupoBasico(c, v, p, { energizar: canEnerg && energ, poderoso: canPoderoso && poderoso }), [c, v, p, canEnerg, energ, canPoderoso, poderoso]);
  const poderes = useMemo(() => ataques(c, v, p), [c, v, p]);
  const groups = useMemo(() => [basico, ...poderes], [basico, poderes]);
  const outros = useMemo(() => outrosPoderes(c), [c]);
  const canPot = hasApt(c, "potencializar");
  const canTP = hasApt(c, "tecnica-poderosa");
  // Uma meta-aptidão por técnica: escolher uma desliga a outra.
  const [pot, setPotMode] = useState<PotMode | null>(null);
  const [tp, setTpOn] = useState(false);
  const setPot = (m: PotMode | null) => {
    setPotMode(m);
    if (m) setTpOn(false);
  };
  const setTp = (on: boolean) => {
    setTpOn(on);
    if (on) setPotMode(null);
  };
  const [lvls, setLvls] = useState<Record<string, number>>({});
  const [free, setFree] = useState<Record<string, boolean>>({});
  const [adjust, setAdjust] = useState<string | null>(null);
  const custom = p.attacks ?? [];

  const use = (row: AtkRow, lvl: number, r: Calc) => {
    const withMeta = row.meta && r.cost > 0;
    const metas = [withMeta && pot && `Potencializar (${POT_LABEL[pot]})`, withMeta && tp && "Técnica Poderosa"].filter(Boolean);
    commit((pl, log) => {
      const trava = r.vis || r.sharingan ? sharinganTravado(pl) : "";
      if (trava) return log(`${row.name}: ${trava}`, "bad");
      const k = r.contador ? pl.counters.find((x) => x.n === r.contador) : undefined;
      if (k && k.cur <= 0) return log(`${row.name}: sem usos nesta cena`, "bad");
      if (!payChakra(pl, r.cost, row.name, log)) return;
      const dmg = r.info ? (r.info.v !== undefined ? `${r.info.label} ${r.info.v}` : "") : r.fixed ? `${r.fixed.v} fixo` : `base ${r.base}`;
      log(`${row.name} · Nv ${lvl}${dmg ? ` · ${dmg}` : ""}${metas.length ? ` · ${metas.join(" + ")}` : ""}${r.cost ? ` · −${r.cost} chakra` : ""}`, "chk");
      if (r.vis) spendVisao(pl, r.vis, log);
      if (k) {
        k.cur -= 1;
        // Izanagi: acabou o último uso, a técnica termina e cobra o olho.
        if (k.cur === 0) olhoPendente(pl, k.n, log);
      }
      if (r.olho) olhoPendente(pl, r.olho, log);
      checkChakra(pl, log);
    });
    if (withMeta) {
      setPotMode(null);
      setTpOn(false);
    }
  };

  return (
    <section aria-labelledby="h-atk" className="@container card flex flex-col gap-4 p-4 sm:p-5">
      <SectionTitle id="h-atk" title="Técnicas e ataques">
        Tudo o que a ficha tem para usar em combate. Dano final = dano base × grau; o grau sai do 2d8 do teste de ataque e 15 ou 16 é acerto crítico (grau 4, alvo sangrando).
      </SectionTitle>

      {(canPot || canTP || canEnerg || canPoderoso || v.dano !== 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {v.dano !== 0 && <span className="chip border-chakra text-[#ffd3a8]">Estados: dano base {sg(v.dano)}</span>}
          {canEnerg && <MetaChip on={energ} onClick={() => setEnerg(!energ)} label="Golpe energizado" hint="Espírito no dano" />}
          {canPoderoso && <MetaChip on={poderoso} onClick={() => setPoderoso(!poderoso)} label="Ataque Poderoso" hint="+1 dano, −1 acerto" />}
          {canPot &&
            (Object.keys(POT_LABEL) as PotMode[]).map((m) => (
              <MetaChip key={m} on={pot === m} onClick={() => setPot(pot === m ? null : m)} label="Potencializar" hint={POT_LABEL[m]} />
            ))}
          {canTP && <MetaChip on={tp} onClick={() => setTp(!tp)} label="Técnica Poderosa" hint="+0,5 de grau" />}
          {(canPot || canTP) && <span className="text-xs text-faint">Meta-aptidão: ação de movimento, uma por técnica, vale para o próximo ataque.</span>}
        </div>
      )}

      <div className="flex flex-col gap-5">
        {/* Cabeçalho dos graus (no celular, cada célula traz o próprio rótulo) */}
        <div className={`hidden items-end gap-2 px-3 @2xl:grid ${COLS}`} aria-hidden="true">
          <span className="label">Técnica</span>
          {GRAU_2D8.map((r, i) => (
            <span key={r} className={`flex flex-col items-center leading-tight ${i === 3 ? "text-[#ff9a80]" : "text-muted"}`}>
              <span className="text-[11px] font-bold uppercase tracking-wider">Grau {i + 1}</span>
              <span className="text-[10px] text-faint">{i === 0 ? `${r} · base` : r}</span>
            </span>
          ))}
          <span />
        </div>

        {groups.map((g) => (
          <div key={g.id} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line-2 pb-2">
              <h3 className="font-display text-lg font-extrabold text-paper">
                {g.title} {g.level > 0 && <span className="text-sm font-bold text-chakra">Nv {g.level}</span>}
              </h3>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
                <span>{g.info ?? `${g.keyLabel} ${g.keyVal}`}</span>
                {g.alcance !== undefined && (
                  <span title="Alcance e tamanho comuns do poder (dá para usar menos, trocando o atributo pelo nível usado)">
                    Alcance {g.alcance}m · Tamanho {g.tamanho}m
                  </span>
                )}
                {g.bonus.map((b) => (
                  <span key={b.label} className="text-[#ffd3a8]">
                    {b.label} +{b.v}
                  </span>
                ))}
                {g.extra !== 0 && <span className="text-[#ffd3a8]">extra {sg(g.extra)}</span>}
                <button type="button" className="font-bold text-faint underline-offset-2 hover:text-text hover:underline" aria-expanded={adjust === g.id} onClick={() => setAdjust(adjust === g.id ? null : g.id)}>
                  Ajustar
                </button>
              </div>
            </div>
            {g.notice && <p className="rounded-xl border border-chakra/40 bg-chakra/10 px-3 py-2 text-xs leading-snug text-[#ffd3a8]">{g.notice}</p>}
            {adjust === g.id && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-ink-2 px-3 py-2.5">
                <span className="flex-1 text-xs leading-snug text-muted">
                  Bônus de dano que a ficha não calcula (Hibon, Satetsu, Domínio Simples, item…). Soma em todos os ataques de {g.title}.
                </span>
                <MiniStepper
                  label={`Bônus extra de ${g.title}`}
                  value={g.extra}
                  onChange={(n) => patch((pl) => void (pl.dmgExtra = { ...pl.dmgExtra, [g.id]: n }))}
                  min={-20}
                  max={20}
                  signed
                />
              </div>
            )}
            <ul className="flex flex-col gap-2">
              {g.rows.map((row, ri) => {
                const divider = row.util && !g.rows[ri - 1]?.util;
                const lvl = Math.min(row.max, Math.max(row.min, lvls[row.key] ?? row.max));
                const isFree = !!free[row.key] && row.free && lvl >= 2;
                const r = row.calc(lvl, { free: isFree, pot: pot && row.meta && !isFree ? pot : undefined });
                const half = row.plusHalf || (tp && row.meta && r.cost > 0);
                return (
                  <Fragment key={row.key}>
                    {divider && (
                      <li className="flex items-center gap-2 pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-faint" aria-hidden="true">
                        Sem dano <span className="h-px flex-1 bg-line" />
                      </li>
                    )}
                  <AttackRow
                    name={row.name}
                    sub={row.sub}
                    note={row.note}
                    r={r}
                    short={r.cost > p.chk}
                    halfGrade={!!half}
                    minGrau={row.minGrau}
                    level={
                      row.tags && row.min === row.max ? (
                        <span className="text-xs text-muted">{row.tags.join(" · ")}</span>
                      ) : row.min === row.max ? (
                        <span className="text-xs font-bold text-chakra">Nv {lvl}</span>
                      ) : (
                        <MiniStepper label={`Nível usado de ${row.name}`} value={lvl} min={row.min} max={row.max} prefix="Nv" onChange={(n) => setLvls((s) => ({ ...s, [row.key]: n }))} />
                      )
                    }
                    extra={
                      row.free && lvl >= 2 ? (
                        <button
                          type="button"
                          aria-pressed={isFree}
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-bold transition ${isFree ? "border-chakra bg-chakra/15 text-[#ffd3a8]" : "border-line-2 text-faint hover:text-text"}`}
                          onClick={() => setFree((s) => ({ ...s, [row.key]: !s[row.key] }))}
                        >
                          Sem chakra (½ dano)
                        </button>
                      ) : null
                    }
                    onUse={() => use(row, lvl, r)}
                  />
                  </Fragment>
                );
              })}
            </ul>
          </div>
        ))}

        {outros.map((o) => (
          <div key={o.id} className="flex flex-col gap-2">
            <div className="border-b border-line-2 pb-2">
              <h3 className="font-display text-lg font-extrabold text-paper">
                {o.title} {o.level > 0 && <span className="text-sm font-bold text-chakra">Nv {o.level}</span>}
              </h3>
            </div>
            {o.items.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {o.items.map((t) => (
                  <li key={t} className="rounded-lg border border-line bg-ink-2 px-2.5 py-1.5 text-sm text-text">
                    {t}
                  </li>
                ))}
              </ul>
            ) : (
              !o.note && <p className="text-xs text-faint">Técnicas deste poder ficam no livro; anote custos e danos em “Anotar ataque”.</p>
            )}
            {o.note && <p className="whitespace-pre-line text-xs leading-snug text-muted">{o.note}</p>}
          </div>
        ))}

        {custom.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="border-b border-line-2 pb-2">
              <h3 className="font-display text-lg font-extrabold text-paper">Anotados</h3>
            </div>
            <ul className="flex flex-col gap-2">
              {custom.map((a) => {
                const r: Calc = { base: Math.max(0, a.base + v.dano), cost: a.cost, dif: 0, parts: v.dano ? [`${a.base}`, `estado ${v.dano}`] : [`${a.base}`] };
                return (
                  <AttackRow
                    key={a.id}
                    name={a.name}
                    sub="Anotado na mesa"
                    note={a.note}
                    r={r}
                    short={a.cost > p.chk}
                    halfGrade={false}
                    noDif
                    level={
                      <button
                        type="button"
                        className="grid size-7 place-items-center rounded-lg text-faint hover:text-bad"
                        aria-label={`Apagar ataque ${a.name}`}
                        onClick={() => patch((pl) => void (pl.attacks = (pl.attacks ?? []).filter((x) => x.id !== a.id)))}
                      >
                        <IconTrash className="size-4" />
                      </button>
                    }
                    onUse={() =>
                      commit((pl, log) => {
                        if (!payChakra(pl, a.cost, a.name, log)) return;
                        log(`${a.name} · base ${r.base}${a.cost ? ` · −${a.cost} chakra` : ""}`, a.cost ? "chk" : "n");
                        checkChakra(pl, log);
                      })
                    }
                  />
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <NovoAtaque onAdd={(a) => patch((pl) => void (pl.attacks = [...(pl.attacks ?? []), a]))} />
    </section>
  );
}

function AttackRow({
  name,
  sub,
  note,
  r,
  halfGrade,
  minGrau,
  noDif,
  level,
  extra,
  onUse,
  short,
}: {
  name: string;
  sub: string;
  note: string;
  r: Calc;
  halfGrade: boolean;
  minGrau?: number;
  noDif?: boolean;
  level: React.ReactNode;
  extra?: React.ReactNode;
  onUse: () => void;
  /** Chakra insuficiente para usar. */
  short?: boolean;
}) {
  const cells = graus(r.base, halfGrade, minGrau);
  return (
    <li className={`grid grid-cols-4 items-center gap-2 rounded-xl border border-line bg-ink-2 p-3 ${COLS}`}>
      {/* Nome, nível e observações */}
      <div className={`col-span-4 flex min-w-0 flex-col gap-1 ${r.info && r.info.v === undefined ? "@2xl:col-span-5" : "@2xl:col-span-1"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-bold text-paper" title={name}>
              {name}
            </span>
            {sub && <span className="truncate text-xs text-muted">{sub}</span>}
          </div>
          <UseButton cost={r.cost} vis={r.vis} short={short} onUse={onUse} className="@2xl:hidden" />
        </div>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          {!r.fixed && !r.info && (
            <span className="inline-flex items-baseline gap-1 rounded-md border border-chakra/60 bg-chakra/10 px-1.5 py-0.5" title={`Dano base = ${partsText(r.parts)}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-chakra">Base</span>
              <AnimatedNumber value={r.base} className="text-sm font-extrabold text-[#ffd3a8]" />
            </span>
          )}
          {level}
          {!noDif && !r.noDif && <span className="text-xs text-muted">Dif {r.dif}</span>}
          {halfGrade && <span className="text-[11px] font-bold text-[#ffd3a8]">grau +0,5</span>}
          {extra}
        </div>
        {r.geo && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1 rounded-md bg-panel px-1.5 py-0.5 text-text">
              <IconAlcance />
              <span className="sr-only">Alcance:</span>
              {r.geo.alcance}
            </span>
            {r.geo.area && (
              <span className="inline-flex items-center gap-1 rounded-md bg-panel px-1.5 py-0.5 text-text">
                <IconArea />
                <span className="sr-only">Área ou alvo:</span>
                {r.geo.area}
              </span>
            )}
          </div>
        )}
        {note && <p className="text-xs leading-snug text-faint">{note}</p>}
        {r.info && <p className="text-xs leading-snug text-muted">{r.info.txt}</p>}
        {!r.fixed && !r.info && r.parts.length > 1 && (
          <p className="text-[11px] leading-snug text-faint">
            <span className="font-bold text-chakra/80">Base</span> = {partsText(r.parts)}
          </p>
        )}
      </div>

      {r.info ? (
        r.info.v !== undefined && (
          <div className="col-span-4 flex items-center justify-center gap-3 rounded-lg border border-[#2d5577] bg-chk-bg px-3 py-2">
            <span className="font-display text-3xl font-extrabold leading-none tabular-nums text-chk">{r.info.v}</span>
            <span className="text-[11px] font-bold uppercase leading-tight tracking-wider text-chk-muted">{r.info.label}</span>
          </div>
        )
      ) : r.fixed ? (
        <div className="col-span-4 flex items-center gap-3 rounded-lg border border-line-2 px-3 py-2">
          <span className="font-display text-3xl font-extrabold tabular-nums text-paper">{r.fixed.v}</span>
          <span className="text-xs leading-snug text-muted">
            de dano fixo {r.fixed.txt}
            <br />
            <span className="text-faint">não multiplica pelo grau</span>
          </span>
        </div>
      ) : (
        <>
          {cells.map(({ g, v }) => (
            <div
              key={g}
              className={`flex flex-col items-center rounded-lg py-1.5 ${g === 4 ? "bg-[#3d1f18] ring-1 ring-[#6b3526]" : "bg-panel"}`}
              title={v === null ? `Grau mínimo ${minGrau}` : `Grau ${g}${halfGrade ? ",5" : ""}: ${r.base} × ${g}${halfGrade ? ",5" : ""}`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider @2xl:hidden ${g === 4 ? "text-[#ff9a80]" : "text-faint"}`}>G{g}</span>
              <AnimatedNumber value={v ?? "—"} className={`font-display text-2xl font-extrabold leading-none ${v === null ? "text-faint" : g === 4 ? "text-vit" : "text-paper"}`} />
            </div>
          ))}
        </>
      )}

      <UseButton cost={r.cost} vis={r.vis} short={short} onUse={onUse} className={`hidden @2xl:inline-flex ${r.fixed || r.info ? "@2xl:col-start-6 @2xl:row-start-1" : ""}`} />
    </li>
  );
}

function IconAlcance() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5 shrink-0 text-chakra" aria-hidden="true">
      <path d="M4 20L20 4M20 4h-7M20 4v7" />
    </svg>
  );
}

function IconArea() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-3.5 shrink-0 text-chakra" aria-hidden="true">
      <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function UseButton({ cost, vis, short, onUse, className = "" }: { cost: number; vis?: number; short?: boolean; onUse: () => void; className?: string }) {
  return (
    <button
      type="button"
      disabled={short}
      title={short ? "Chakra insuficiente" : undefined}
      className={`btn min-h-10 shrink-0 gap-1.5 bg-[#1f4e73] px-3 text-white hover:bg-[#1a4262] ${className}`}
      onClick={onUse}
    >
      Usar
      {cost > 0 && <span className="rounded-md bg-[#0e1821]/60 px-1.5 py-0.5 text-xs tabular-nums text-chk">{cost} chk</span>}
      {!!vis && <span className="rounded-md bg-[#3a0f0c]/70 px-1.5 py-0.5 text-xs tabular-nums text-vit">{vis} visão</span>}
    </button>
  );
}

function MetaChip({ on, onClick, label, hint }: { on: boolean; onClick: () => void; label: string; hint: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`chip ${on ? "border-chakra bg-chakra text-paper-ink" : "text-text hover:border-muted"}`}>
      <span className="font-bold">{label}</span>
      <span className={`text-xs ${on ? "text-paper-ink/80" : "text-muted"}`}>{hint}</span>
    </button>
  );
}

function MiniStepper({
  label,
  value,
  onChange,
  min,
  max,
  prefix,
  signed,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  prefix?: string;
  signed?: boolean;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex items-center rounded-lg border border-line-2">
      <button type="button" className="grid size-7 place-items-center text-muted hover:text-text disabled:opacity-30" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="Diminuir">
        <IconMinus className="size-3.5" />
      </button>
      <span className="min-w-12 text-center text-xs font-bold tabular-nums text-chakra" aria-live="polite">
        {prefix ? `${prefix} ` : ""}
        {signed ? sg(value) : value}
      </span>
      <button type="button" className="grid size-7 place-items-center text-muted hover:text-text disabled:opacity-30" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="Aumentar">
        <IconPlus className="size-3.5" />
      </button>
    </div>
  );
}

function NovoAtaque({ onAdd }: { onAdd: (a: { id: string; name: string; base: number; cost: number; note: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [base, setBase] = useState("4");
  const [cost, setCost] = useState("0");
  const [note, setNote] = useState("");

  const add = () => {
    const n = name.trim();
    if (!n) return;
    onAdd({ id: uid(), name: n, base: Number(base) || 0, cost: Math.max(0, Number(cost) || 0), note: note.trim() });
    setName("");
    setNote("");
  };

  if (!open)
    return (
      <button type="button" className="chip self-start text-text hover:border-muted" onClick={() => setOpen(true)}>
        <IconPlus className="size-4" /> Anotar ataque (arma, taijutsu, outra técnica)
      </button>
    );

  return (
    <form
      className="flex flex-col gap-2 rounded-xl bg-ink-2 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        add();
      }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_5rem_5rem] items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="atk-n" className="text-xs text-muted">
            Nome
          </label>
          <input id="atk-n" className="field py-2" placeholder="Ex.: Kunai, Juuken, Kyoudo Kyouka…" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="atk-b" className="text-xs text-muted">
            Dano base
          </label>
          <input id="atk-b" type="number" inputMode="numeric" className="field py-2 text-center" value={base} onChange={(e) => setBase(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="atk-c" className="text-xs text-muted">
            Chakra
          </label>
          <input id="atk-c" type="number" inputMode="numeric" className="field py-2 text-center" value={cost} onChange={(e) => setCost(e.target.value)} />
        </div>
      </div>
      <input aria-label="Observação" className="field py-2" placeholder="Observação (opcional): ½For + arma, ignora dureza…" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-2">
        <button type="submit" className="btn-ghost" disabled={!name.trim()}>
          Adicionar
        </button>
        <button type="button" className="btn text-muted hover:text-text" onClick={() => setOpen(false)}>
          Fechar
        </button>
      </div>
    </form>
  );
}
