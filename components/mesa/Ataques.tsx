"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { GRAU_2D8, ataques, graus, grupoBasico, outrosPoderes, partsText, type AtkGroup, type AtkRow, type Calc, type PotMode } from "@/lib/ataques";
import { KANJI_PODER } from "@/lib/data/poderes";
import { podeEnergizar } from "@/lib/dano";
import { ABSORCAO_MONTARIA, BOMBAS_ARGILA } from "@/lib/estados";
import { checkChakra, olhoPendente, payChakra, setEstadoStage, sg, sharinganTravado, spendVisao, toggleEffect } from "@/lib/play";
import { hasApt, uid } from "@/lib/rules";
import { norm } from "../builder/shared";
import { AnimatedNumber, IconMinus, IconPlus, IconRight, IconSearch, IconTrash, IconX, corPoder } from "../ui";
import { SectionTitle, type MesaProps } from "./shared";

/** Os três melhoramentos do Potencializar (Livro Básico, aptidões de técnica). */
const POT_LABEL: Record<PotMode, string> = { dano: "+1 de dano base", alcance: "alcance ×2", area: "área ×2" };

/** Distâncias até o alvo que a mesa oferece (null = não informar; 1 = corpo a corpo). */
const DISTANCIAS: (number | null)[] = [null, 1, 10, 20, 30, 40, 60, 80];

/** Colunas da tabela (fixar · técnica · nível · base · 4 graus · usar), quando o painel tem largura para isso.
 *  A coluna "usar" alarga um pouco (--usar) quando algum botão tem dois custos empilhados (argila, visão). */
const COLS = "@2xl:grid-cols-[2rem_minmax(0,1fr)_7.5rem_3.75rem_repeat(4,3.5rem)_var(--usar,6.75rem)]";

/** Poder por trás de um grupo da mesa ("versatilidade:raiton" → raiton), para kanji e cor. */
const groupPower = (id: string) => (id.startsWith("versatilidade:") ? id.split(":")[1] : id.split(":")[0]);
const groupKanji = (g: { id: string; title: string }) => KANJI_PODER[groupPower(g.id)] ?? (g.id === "basico" ? "刃" : g.title.charAt(0));
const shortTitle = (t: string) => t.split(" (")[0].replace(" Versátil", "");

/** Técnicas fixadas: preferência de quem joga, guardada só neste navegador. */
function usePins(id: string) {
  const key = `shinobi:fixados:${id}`;
  const [pins, setPins] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setPins(new Set(raw ? (JSON.parse(raw) as string[]) : []));
    } catch {
      setPins(new Set());
    }
  }, [key]);
  const toggle = (k: string) =>
    setPins((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      try {
        localStorage.setItem(key, JSON.stringify([...n]));
      } catch {}
      return n;
    });
  return [pins, toggle] as const;
}

/** Filtro da lista: tudo, os fixados, um grupo (id) ou os poderes sem cálculo. */
type Filtro = "todos" | "fixados" | "outros" | (string & {});
/** O filtro escolhido continua o mesmo quando o mestre troca de ficha e volta. */
const lastFiltro: Record<string, Filtro> = {};

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

  // Lista compacta: busca, filtro por grupo, fixados e grupos recolhidos.
  const [q, setQ] = useState("");
  const [filtro, setFiltroState] = useState<Filtro>(() => lastFiltro[c.id] ?? "todos");
  const setFiltro = (f: Filtro) => {
    lastFiltro[c.id] = f;
    setFiltroState(f);
  };
  const [soDano, setSoDano] = useState(false);
  // Distância até o alvo (opcional): ajusta o teste das armas e marca o que fica fora de alcance.
  const [dist, setDist] = useState<number | null>(null);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [pins, togglePin] = usePins(c.id);

  const t = norm(q.trim());
  const match = (row: AtkRow) => (!t || norm(`${row.name} ${row.sub}`).includes(t)) && (!soDano || !row.util);
  const allRows = groups.flatMap((g) => g.rows.map((row) => ({ g, row })));
  const pinned = allRows.filter((x) => pins.has(x.row.key));
  // Um grupo que sumiu (poder removido) volta o filtro para "todos".
  const f: Filtro = filtro === "todos" || filtro === "fixados" || (filtro === "outros" && outros.length) || groups.some((g) => g.id === filtro) ? filtro : "todos";
  const shownGroups = f === "todos" ? groups : groups.filter((g) => g.id === f);
  const showOutros = (f === "todos" || f === "outros") && !soDano;
  const forceOpen = !!t || f !== "todos";

  const use = (row: AtkRow, lvl: number, r: Calc) => {
    const withMeta = row.meta && r.cost > 0;
    const metas = [withMeta && pot && `Potencializar (${POT_LABEL[pot]})`, withMeta && tp && "Técnica Poderosa"].filter(Boolean);
    commit((pl, log) => {
      const trava = r.vis || r.sharingan ? sharinganTravado(pl) : "";
      if (trava) return log(`${row.name}: ${trava}`, "bad");
      const k = r.contador ? pl.counters.find((x) => x.n === r.contador) : undefined;
      if (k && k.cur <= 0) return log(`${row.name}: sem usos nesta cena`, "bad");
      // Kibaku Nendo: sem bombas de argila suficientes a técnica não sai (o contador some se a pessoa apagar).
      const argila = r.bombas ? pl.counters.find((x) => x.n === BOMBAS_ARGILA) : undefined;
      if (argila && argila.cur < r.bombas!) return log(`${row.name}: bombas de argila insuficientes (tem ${argila.cur}, precisa ${r.bombas})`, "bad");
      if (!payChakra(pl, r.cost, row.name, log)) return;
      if (argila) argila.cur -= r.bombas!;
      const dmg = r.info ? (r.info.v !== undefined ? `${r.info.label} ${r.info.v}` : "") : r.fixed ? `${r.fixed.v} fixo` : `base ${r.base}`;
      log(
        `${row.name} · Nv ${lvl}${dmg ? ` · ${dmg}` : ""}${metas.length ? ` · ${metas.join(" + ")}` : ""}${r.cost ? ` · −${r.cost} chakra` : ""}${argila ? ` · −${r.bombas} argila` : ""}`,
        "chk",
      );
      if (r.ativa) {
        // Montaria de Argila: liga o estado na forma usada e enche a absorção.
        const e = pl.effects.find((x) => x.auto === r.ativa!.estado);
        if (e) {
          setEstadoStage(pl, e.id, r.ativa.stage, c, log);
          if (!e.active) toggleEffect(pl, e.id, log, c);
        }
        const abs = pl.counters.find((x) => x.n === ABSORCAO_MONTARIA);
        if (abs) abs.cur = abs.max;
      }
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

  const renderRow = (g: AtkGroup, row: AtkRow, ri: number, withKanji: boolean) => {
    const divider = !withKanji && row.util && !g.rows[ri - 1]?.util;
    const lvl = Math.min(row.max, Math.max(row.min, lvls[row.key] ?? row.max));
    const isFree = !!free[row.key] && row.free && lvl >= 2;
    const r = row.calc(lvl, { free: isFree, pot: pot && row.meta && !isFree ? pot : undefined });
    const half = row.plusHalf || (tp && row.meta && r.cost > 0);
    // Distância até o alvo: armas pelas faixas (−1 no dobro, −3 no quádruplo); técnicas até o alcance delas.
    const alc = r.geo?.alcance ?? "";
    // Corpo a corpo e toque alcançam 1m (armas longas já dizem "2m").
    const maxM = alc === "corpo-a-corpo" || alc === "toque" ? 1 : Number(/^(\d+)m$/.exec(alc)?.[1] ?? 0);
    // Só o que tem teste de acerto contra um alvo (Montaria, Imergir e afins são em você).
    const pen = dist === null || !row.teste ? 0 : row.faixa ? penDistancia(row.faixa, dist) : maxM && dist > maxM ? null : 0;
    const fora = pen === null;
    const teste = row.teste && !fora ? `teste de ${row.teste.k} ${row.teste.v + (pen ?? 0)}` : "";
    const porque = [...(row.teste?.why ?? []), pen ? `${sg(pen)} a ${dist}m` : ""].filter(Boolean).join(", ");
    const sub = [fora ? `fora de alcance (máx. ${row.faixa ? 4 * row.faixa : maxM}m)` : teste && porque ? `${teste} (${porque})` : teste, row.sub].filter(Boolean).join(" · ");
    return (
      <Fragment key={row.key}>
        {divider && (
          <li className="flex items-center gap-2 pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-faint" aria-hidden="true">
            Sem dano <span className="h-px flex-1 bg-line" />
          </li>
        )}
        <AttackRow
          name={row.name}
          sub={sub}
          note={row.note}
          r={r}
          faixa={row.faixa}
          fora={fora}
          short={r.cost > p.chk}
          halfGrade={!!half}
          minGrau={row.minGrau}
          kanji={withKanji ? { k: groupKanji(g), color: corPoder(groupPower(g.id)) } : undefined}
          pinned={pins.has(row.key)}
          onPin={() => togglePin(row.key)}
          open={openRow === row.key}
          onToggle={() => setOpenRow(openRow === row.key ? null : row.key)}
          level={
            row.tags && row.min === row.max ? (
              <span className="block max-w-[6.5rem] truncate text-xs text-muted @2xl:max-w-none @2xl:whitespace-normal @2xl:text-center" title={row.tags.join(" · ")}>
                {row.tags.join(" · ")}
              </span>
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
                className={`rounded-full border px-2.5 py-1 text-xs font-bold transition ${isFree ? "border-chakra bg-chakra/15 text-[#ffd3a8]" : "border-line-2 text-faint hover:text-text"}`}
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
  };

  const chips: { k: Filtro; label: string; n: number; kanji?: string; color?: string }[] = [
    { k: "fixados", label: "Fixados", n: pinned.length, kanji: "★", color: "var(--color-chakra)" },
    { k: "todos", label: "Todas", n: allRows.length },
    ...groups.map((g) => ({ k: g.id, label: shortTitle(g.title), n: g.rows.length, kanji: groupKanji(g), color: corPoder(groupPower(g.id)) })),
    ...(outros.length ? [{ k: "outros", label: "Outros poderes", n: outros.length }] : []),
  ];

  return (
    <section aria-labelledby="h-atk" className="@container card flex flex-col gap-4 p-4 sm:p-5">
      <SectionTitle id="h-atk" title="Técnicas e ataques">
        Dano final = dano base × grau; o grau sai do 2d8 do teste de ataque e 15 ou 16 é acerto crítico (grau 4, alvo sangrando). Fixe com a ☆ as técnicas que você mais usa.
      </SectionTitle>

      {/* Busca e filtros */}
      <div className="flex flex-col gap-2.5">
        <div className="flex gap-2">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-line-2 bg-ink-2 pr-1.5 pl-3 focus-within:border-chakra">
            <IconSearch className="size-4 shrink-0 text-muted" />
            <span className="sr-only">Buscar técnica</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar técnica (ex.: Chidori, Canhão)" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint" />
            {q && (
              <button type="button" onClick={() => setQ("")} aria-label="Limpar busca" className="grid size-8 place-items-center rounded-lg bg-panel-2">
                <IconX className="size-3.5" />
              </button>
            )}
          </label>
          <button type="button" aria-pressed={soDano} onClick={() => setSoDano(!soDano)} className={`chip min-h-11 shrink-0 font-bold ${soDano ? "border-chakra bg-chakra text-paper-ink" : "text-text hover:border-muted"}`}>
            Só com dano
          </button>
        </div>
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-none sm:-mx-5 sm:px-5 @3xl:mx-0 @3xl:flex-wrap @3xl:px-0">
          {chips.map((x) => {
            const on = f === x.k;
            return (
              <button key={x.k} type="button" aria-pressed={on} onClick={() => setFiltro(x.k)} className={`chip shrink-0 font-bold whitespace-nowrap ${on ? "border-paper bg-paper text-paper-ink" : "text-text hover:border-muted"}`}>
                {x.kanji && (
                  <span className="font-display" style={{ color: on ? undefined : x.color }} aria-hidden="true">
                    {x.kanji}
                  </span>
                )}
                {x.label}
                <span className={`text-[11px] ${on ? "text-paper-muted" : "text-muted"}`}>{x.n}</span>
              </button>
            );
          })}
        </div>
        <div className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 scrollbar-none sm:-mx-5 sm:px-5 @3xl:mx-0 @3xl:flex-wrap @3xl:px-0" role="group" aria-label="Distância até o alvo">
          <span className="label shrink-0 pr-1">Alvo a</span>
          {DISTANCIAS.map((d) => {
            const on = dist === d;
            return (
              <button key={d ?? "nd"} type="button" aria-pressed={on} onClick={() => setDist(d)} className={`chip shrink-0 font-bold whitespace-nowrap ${on ? "border-paper bg-paper text-paper-ink" : "text-text hover:border-muted"}`}>
                {d === null ? "—" : d === 1 ? "corpo a corpo" : `até ${d}m`}
              </button>
            );
          })}
          {dist !== null && <span className="hidden text-xs text-faint @3xl:inline">O teste de cada linha já desconta a distância.</span>}
        </div>
      </div>

      {(canPot || canTP || canEnerg || canPoderoso || v.dano !== 0) && (
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 scrollbar-none sm:-mx-5 sm:px-5 @3xl:mx-0 @3xl:flex-wrap @3xl:px-0">
          {v.dano !== 0 && <span className="chip border-chakra text-[#ffd3a8]">Estados: dano base {sg(v.dano)}</span>}
          {canEnerg && <MetaChip on={energ} onClick={() => setEnerg(!energ)} label="Golpe energizado" hint="Espírito no dano" />}
          {canPoderoso && <MetaChip on={poderoso} onClick={() => setPoderoso(!poderoso)} label="Ataque Poderoso" hint="+1 dano, −1 acerto" />}
          {canPot &&
            (Object.keys(POT_LABEL) as PotMode[]).map((m) => (
              <MetaChip key={m} on={pot === m} onClick={() => setPot(pot === m ? null : m)} label="Potencializar" hint={POT_LABEL[m]} />
            ))}
          {canTP && <MetaChip on={tp} onClick={() => setTp(!tp)} label="Técnica Poderosa" hint="+0,5 de grau" />}
          {(canPot || canTP) && <span className="hidden text-xs text-faint @3xl:inline">Meta-aptidão: ação de movimento, uma por técnica, vale para o próximo ataque.</span>}
        </div>
      )}

      <div className="flex flex-col gap-3 [&:has([data-custo-extra])]:[--usar:7.75rem]">
        {/* Celular: legenda da linha de números */}
        <p className="flex items-center gap-1.5 px-1 text-[11px] text-faint @2xl:hidden" aria-hidden="true">
          Nível · <span className="rounded border border-chakra/60 px-1 text-chakra">base</span> · G1 · G2 · G3 · <span className="rounded bg-[#3d1f18] px-1 text-[#ff9a80]">G4 crítico</span>
        </p>
        {/* Cabeçalho das colunas na tabela larga */}
        <div className={`hidden items-end gap-2 pr-[9px] pl-[5px] @2xl:grid ${COLS}`} aria-hidden="true">
          <span />
          <span className="label">Técnica</span>
          <span className="label text-center">Nível</span>
          <span className="label text-center text-chakra">Base</span>
          {GRAU_2D8.map((r, i) => (
            <span key={r} className={`flex flex-col items-center leading-tight ${i === 3 ? "text-[#ff9a80]" : "text-muted"}`}>
              <span className="text-[11px] font-bold uppercase tracking-wider">G{i + 1}</span>
              <span className="text-[10px] text-faint">{r}</span>
            </span>
          ))}
          <span />
        </div>

        {f === "fixados" ? (
          pinned.filter((x) => match(x.row)).length ? (
            <ul className="flex flex-col gap-1.5">{pinned.filter((x) => match(x.row)).map((x, i) => renderRow(x.g, x.row, i, true))}</ul>
          ) : (
            <p className="rounded-xl border border-dashed border-line-2 p-5 text-center text-sm text-muted">{pins.size ? "Nenhuma técnica fixada com esse filtro." : "Toque na ☆ de uma técnica para fixá-la aqui. Ótimo para builds grandes: só o que você usa no combate."}</p>
          )
        ) : (
          shownGroups.map((g) => {
            const rows = g.rows.filter(match);
            if (!rows.length && (t || soDano)) return null;
            const open = forceOpen || !closed[g.id];
            return (
              <div key={g.id} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line-2 pb-1.5">
                  <button type="button" aria-expanded={open} onClick={() => setClosed((s) => ({ ...s, [g.id]: open }))} disabled={forceOpen} className="flex min-h-10 min-w-0 items-center gap-2 text-left disabled:cursor-default">
                    <IconRight className={`size-4 shrink-0 text-faint transition ${open ? "rotate-90" : ""} ${forceOpen ? "opacity-0" : ""}`} />
                    <span className="font-display text-lg font-extrabold" style={{ color: corPoder(groupPower(g.id)) }} aria-hidden="true">
                      {groupKanji(g)}
                    </span>
                    <span className="font-display text-lg font-extrabold text-paper">{g.title}</span>
                    {g.level > 0 && <span className="text-sm font-bold text-chakra">Nv {g.level}</span>}
                    <span className="rounded-full bg-panel-2 px-2 text-[11px] font-bold text-muted">{rows.length}</span>
                  </button>
                  <div className="ml-auto flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
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
                    {g.prec && <span className="text-ok">{g.prec}</span>}
                    {g.recurso && <span className="text-[#f6d2ae]">{g.recurso}</span>}
                    <button type="button" className="min-h-8 font-bold text-faint underline-offset-2 hover:text-text hover:underline" aria-expanded={adjust === g.id} onClick={() => setAdjust(adjust === g.id ? null : g.id)}>
                      Ajustar
                    </button>
                  </div>
                </div>
                {g.notice && <p className="rounded-xl border border-chakra/40 bg-chakra/10 px-3 py-2 text-xs leading-snug text-[#ffd3a8]">{g.notice}</p>}
                {adjust === g.id && (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl bg-ink-2 px-3 py-2.5">
                    <span className="flex-1 text-xs leading-snug text-muted">
                      Bônus de dano que a ficha não calcula (Satetsu, Domínio Simples, item…). Soma em todos os ataques de {g.title}.
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
                {open && <ul className="flex flex-col gap-1.5">{rows.map((row, ri) => renderRow(g, row, ri, false))}</ul>}
              </div>
            );
          })
        )}

        {showOutros &&
          outros
            .filter((o) => !t || norm(`${o.title} ${o.items.join(" ")}`).includes(t))
            .map((o) => {
              const open = forceOpen || !closed[o.id];
              return (
                <div key={o.id} className="flex flex-col gap-2">
                  <button type="button" aria-expanded={open} onClick={() => setClosed((s) => ({ ...s, [o.id]: open }))} disabled={forceOpen} className="flex min-h-10 items-center gap-2 border-b border-line-2 pb-1.5 text-left disabled:cursor-default">
                    <IconRight className={`size-4 shrink-0 text-faint transition ${open ? "rotate-90" : ""} ${forceOpen ? "opacity-0" : ""}`} />
                    <span className="font-display text-lg font-extrabold" style={{ color: corPoder(groupPower(o.id)) }} aria-hidden="true">
                      {KANJI_PODER[groupPower(o.id)] ?? ""}
                    </span>
                    <span className="font-display text-lg font-extrabold text-paper">{o.title}</span>
                    {o.level > 0 && <span className="text-sm font-bold text-chakra">Nv {o.level}</span>}
                    <span className="rounded-full bg-panel-2 px-2 text-[11px] font-bold text-muted">{o.items.length}</span>
                  </button>
                  {open && (
                    <>
                      {o.items.length > 0 ? (
                        <ul className="flex flex-wrap gap-2">
                          {o.items.map((it) => (
                            <li key={it} className="rounded-lg border border-line bg-ink-2 px-2.5 py-1.5 text-sm text-text">
                              {it}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        !o.note && <p className="text-xs text-faint">Técnicas deste poder ficam no livro; anote custos e danos em “Anotar ataque”.</p>
                      )}
                      {o.note && <p className="whitespace-pre-line text-xs leading-snug text-muted">{o.note}</p>}
                    </>
                  )}
                </div>
              );
            })}

        {f === "todos" && custom.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="border-b border-line-2 pb-1.5">
              <h3 className="font-display text-lg font-extrabold text-paper">Anotados</h3>
            </div>
            <ul className="flex flex-col gap-1.5">
              {custom
                .filter((a) => !t || norm(a.name).includes(t))
                .map((a) => {
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
                      open={openRow === a.id}
                      onToggle={() => setOpenRow(openRow === a.id ? null : a.id)}
                      level={
                        <button
                          type="button"
                          className="grid size-8 place-items-center rounded-lg text-faint hover:text-bad"
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

/**
 * Uma técnica: uma linha densa (fixar, nome, nível, base, 4 graus, usar). No celular, nome e "Usar" em cima e os
 * números embaixo. Observação, parcelas do dano e área abrem ao tocar no nome.
 */
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
  kanji,
  pinned,
  onPin,
  open,
  onToggle,
  faixa,
  fora,
}: {
  name: string;
  sub: string;
  note: string;
  r: Calc;
  /** Arma à distância: mostra as três faixas de alcance no detalhe. */
  faixa?: number;
  /** O alvo escolhido está além do alcance. */
  fora?: boolean;
  halfGrade: boolean;
  minGrau?: number;
  noDif?: boolean;
  level: React.ReactNode;
  extra?: React.ReactNode;
  onUse: () => void;
  /** Chakra insuficiente para usar. */
  short?: boolean;
  /** Kanji do grupo, quando a linha aparece fora dele (lista de fixados). */
  kanji?: { k: string; color: string };
  pinned?: boolean;
  onPin?: () => void;
  open: boolean;
  onToggle: () => void;
}) {
  const cells = graus(r.base, halfGrade, minGrau);
  const resumo = [sub, !noDif && !r.noDif ? `Dif ${r.dif}` : "", r.geo?.alcance, halfGrade ? "grau +0,5" : ""].filter(Boolean).join(" · ");
  const temDetalhe = !!(note || r.info?.txt || r.geo?.area || extra || (!r.fixed && !r.info && r.parts.length > 1));
  return (
    <li className={`rounded-xl border bg-ink-2 ${open ? "border-line-2" : "border-line"} ${fora ? "opacity-55" : ""}`}>
      <div className={`grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5 py-1.5 pr-2 pl-1 ${COLS}`}>
        {onPin ? (
          <button type="button" onClick={onPin} aria-pressed={!!pinned} aria-label={`${pinned ? "Desafixar" : "Fixar"} ${name}`} className={`grid size-8 place-items-center rounded-lg text-base transition ${pinned ? "text-chakra" : "text-line-2 hover:text-muted"}`}>
            {pinned ? "★" : "☆"}
          </button>
        ) : (
          <span />
        )}
        <button type="button" onClick={onToggle} aria-expanded={open} disabled={!temDetalhe} className="flex min-h-10 min-w-0 flex-col justify-center text-left disabled:cursor-default">
          <span className="flex min-w-0 items-baseline gap-1.5">
            {kanji && (
              <span className="shrink-0 font-display text-sm font-extrabold" style={{ color: kanji.color }} aria-hidden="true">
                {kanji.k}
              </span>
            )}
            <span className="truncate font-bold text-paper" title={name}>
              {name}
            </span>
            {temDetalhe && <IconRight className={`size-3.5 shrink-0 self-center text-faint transition ${open ? "rotate-90" : ""}`} />}
          </span>
          {resumo && <span className="truncate text-xs text-muted">{resumo}</span>}
        </button>
        <UseButton cost={r.cost} vis={r.vis} bombas={r.bombas} short={short} onUse={onUse} className="@2xl:order-last" />

        {/* Celular: segunda linha com nível e números; na tabela larga, cada um vira uma coluna */}
        <div className="col-span-3 flex items-center gap-1 pl-1 @2xl:contents">
          <span className="flex shrink-0 items-center @2xl:justify-center">{level}</span>
          {r.info ? (
            r.info.v !== undefined ? (
              <span className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#2d5577] bg-chk-bg px-2.5 py-1 @2xl:col-span-5 @2xl:justify-center">
                <span className="font-display text-lg font-extrabold leading-none tabular-nums text-chk @2xl:text-2xl">{r.info.v}</span>
                <span className="truncate text-[11px] font-bold uppercase leading-tight tracking-wider text-chk-muted">{r.info.label}</span>
              </span>
            ) : (
              <span className="min-w-0 truncate text-xs text-muted @2xl:col-span-5">{r.info.txt}</span>
            )
          ) : r.fixed ? (
            <span className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-line-2 px-2.5 py-1 @2xl:col-span-5">
              <span className="font-display text-lg font-extrabold tabular-nums text-paper @2xl:text-2xl">{r.fixed.v}</span>
              <span className="truncate text-xs text-muted">de dano fixo · não multiplica pelo grau</span>
            </span>
          ) : (
            <>
              <span className="flex min-w-0 flex-1 items-center justify-center rounded-md border border-chakra/60 bg-chakra/10 px-1 py-0.5 @2xl:h-9 @2xl:flex-none" title={`Dano base = ${partsText(r.parts)}`}>
                <span className="sr-only">Dano base:</span>
                <AnimatedNumber value={r.base} className="text-sm font-extrabold text-[#ffd3a8] @2xl:text-base" />
              </span>
              {cells.map(({ g, v }) => (
                <span
                  key={g}
                  className={`flex min-w-0 flex-1 items-center justify-center rounded-md px-0.5 py-1 @2xl:h-9 @2xl:flex-none @2xl:px-1.5 ${g === 4 ? "bg-[#3d1f18] ring-1 ring-[#6b3526]" : "bg-panel"}`}
                  title={v === null ? `Grau mínimo ${minGrau}` : `Grau ${g}${halfGrade ? ",5" : ""}: ${r.base} × ${g}${halfGrade ? ",5" : ""}`}
                >
                  <span className="sr-only">Grau {g}:</span>
                  <AnimatedNumber value={v ?? "—"} className={`font-display text-[15px] font-extrabold leading-none @2xl:text-xl ${v === null ? "text-faint" : g === 4 ? "text-vit" : "text-paper"}`} />
                </span>
              ))}
            </>
          )}
        </div>
      </div>

      {open && temDetalhe && (
        <div className="flex flex-col gap-1.5 border-t border-line px-3 py-2.5 @2xl:pl-11">
          {extra && <div>{extra}</div>}
          {r.geo && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {faixa ? (
                FAIXAS.map((x) => (
                  <span key={x.mult} className={`inline-flex items-center gap-1 rounded-md bg-panel px-1.5 py-0.5 ${x.pen ? "text-muted" : "text-text"}`}>
                    <IconAlcance />
                    <span className="sr-only">Alcance:</span>
                    até {faixa * x.mult}m{x.pen ? ` · ${sg(x.pen)}` : ""}
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-panel px-1.5 py-0.5 text-text">
                  <IconAlcance />
                  <span className="sr-only">Alcance:</span>
                  {r.geo.alcance}
                </span>
              )}
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
          {r.info?.v !== undefined && r.info.txt && <p className="text-xs leading-snug text-muted">{r.info.txt}</p>}
          {!r.fixed && !r.info && r.parts.length > 1 && (
            <p className="text-[11px] leading-snug text-faint">
              <span className="font-bold text-chakra/80">Base</span> = {partsText(r.parts)}
            </p>
          )}
          {r.fixed && <p className="text-xs leading-snug text-muted">{r.fixed.txt}</p>}
        </div>
      )}
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

function UseButton({ cost, vis, bombas, short, onUse, className = "" }: { cost: number; vis?: number; bombas?: number; short?: boolean; onUse: () => void; className?: string }) {
  // Com dois custos (chakra + argila/visão), na tabela larga eles empilham para a coluna "usar" não roubar espaço do nome.
  const extra = [cost > 0, !!bombas, !!vis].filter(Boolean).length > 1;
  return (
    <button
      type="button"
      disabled={short}
      title={short ? "Chakra insuficiente" : undefined}
      data-custo-extra={extra ? "" : undefined}
      className={`btn min-h-10 shrink-0 gap-1.5 bg-[#1f4e73] px-3 text-white hover:bg-[#1a4262] ${className}`}
      onClick={onUse}
    >
      Usar
      <span className={`flex gap-1.5 ${extra ? "@2xl:flex-col @2xl:items-stretch @2xl:gap-0.5" : ""}`}>
        {cost > 0 && <span className="rounded-md bg-[#0e1821]/60 px-1.5 py-0.5 text-xs whitespace-nowrap tabular-nums text-chk">{cost} chk</span>}
        {!!bombas && <span className="rounded-md bg-[#3a2a18]/90 px-1.5 py-0.5 text-xs whitespace-nowrap tabular-nums text-[#f6d2ae]">{bombas} argila</span>}
        {!!vis && <span className="rounded-md bg-[#3a0f0c]/70 px-1.5 py-0.5 text-xs whitespace-nowrap tabular-nums text-vit">{vis} visão</span>}
      </span>
    </button>
  );
}

/** Faixas de alcance de uma arma (Livro Básico, Armas): até o alcance, o dobro (−1) e o quádruplo (−3). */
const FAIXAS = [
  { mult: 1, pen: 0 },
  { mult: 2, pen: -1 },
  { mult: 4, pen: -3 },
] as const;

/** Penalidade no teste pela distância até o alvo; null = fora de alcance. */
function penDistancia(faixa: number, dist: number): number | null {
  const f = FAIXAS.find((x) => dist <= faixa * x.mult);
  return f ? f.pen : null;
}

function MetaChip({ on, onClick, label, hint }: { on: boolean; onClick: () => void; label: string; hint: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`chip shrink-0 whitespace-nowrap ${on ? "border-chakra bg-chakra text-paper-ink" : "text-text hover:border-muted"}`}>
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
