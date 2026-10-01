"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { APTIDOES, APT_BY_ID, APT_CATEGORIES, BANNED_APTS } from "@/lib/data/aptidoes";
import { JUUINKA_BONUS, JUUINKA_ICHI_PICKS, JUUINKA_NI_DEFAULT, JUUINKA_SELOS, niChoices } from "@/lib/data/juuinka";
import { EFEITO_BY_ID } from "@/lib/data/poderes";
import { ATIRADOR } from "@/lib/dano";
import { SENSOR_LIMITES } from "@/lib/estados";
import { APT_COST, FREE_APTS, MANGEKYOU_PARES, allowedRestricted, aptCost, mangekyou, budgetFor, grantedApts, isFreeEligible, ownersText, reqsMet, spent, talentoEffects, talentoTargets, uid, versatileName } from "@/lib/rules";
import type { AptCategory, AptEntry, Aptidao, Character } from "@/lib/types";
import { Badge, IconCheck, IconPlus, IconRight, IconSearch, IconTrash, RulesNote, Sheet, Stepper, StepHeader, Toggle } from "../../ui";
import { stepKicker, type StepProps } from "../shared";

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

type AptStatus = { banned: boolean; restricted: boolean; met: boolean; owned: boolean; available: boolean };

/**
 * Aptidões: as compradas numa tabela agrupada por categoria (uma linha cada, detalhes ao expandir) e o catálogo
 * numa coluna fixa em telas largas ou numa gaveta nas menores.
 */
export function StepAptidoes({ c, set }: StepProps) {
  const [q, setQ] = useState("");
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const b = budgetFor(c.nc, c.optionals);
  const s = spent(c);
  const allowed = useMemo(() => allowedRestricted(c), [c]);
  const granted = useMemo(() => grantedApts(c), [c]);
  const powerLeft = b.power - s.power;

  const status = (a: Aptidao): AptStatus => {
    const banned = c.optionals.aptidoesBanidas && BANNED_APTS.includes(a.id);
    const restricted = (a.cat === "restrita" || a.cat === "especial") && !allowed.apts.has(a.id);
    const met = reqsMet(c, a.req);
    const owned = c.aptidoes.some((e) => e.id === a.id) || granted.includes(a.id);
    return { banned, restricted, met, owned, available: !banned && !restricted && met };
  };

  const add = (a: Aptidao) => {
    const id = uid();
    set((d) => {
      const freeUsed = d.aptidoes.filter((x) => x.free).length;
      d.aptidoes.push({ uid: id, id: a.id, level: 1, free: freeUsed < FREE_APTS && isFreeEligible(a), detail: a.generic ? "" : undefined });
      // Aprendizagem Rápida: cada compra libera mais uma tabela de Versatilidade, que já aparece na etapa Poderes.
      if (a.id === "aprendizagem-rapida") {
        const tabelas = d.poderes.filter((p) => p.id === "versatilidade").length;
        const liberadas = 1 + d.aptidoes.filter((x) => x.id === "aprendizagem-rapida").length;
        if (tabelas >= 1 && tabelas < liberadas) d.poderes.push({ id: "versatilidade", level: 1, effects: [null], techniques: [""], versatile: ["", ""], owner: [null] });
      }
    });
    // A nova já abre, para as escolhas que ela pede (categoria, aptidões da Técnica Avançada…).
    setOpen(id);
    setClosed((x) => ({ ...x, [a.cat]: false }));
  };

  const addCustom = (name: string) => {
    const id = uid();
    set((d) => void d.aptidoes.push({ uid: id, id: "custom", customName: name, level: 1, free: false }));
    setOpen(id);
    setClosed((x) => ({ ...x, custom: false }));
  };

  const hit = (e: AptEntry) => {
    const a = APT_BY_ID[e.id];
    return !q.trim() || norm(`${a?.name ?? e.customName ?? ""} ${a?.desc ?? ""} ${e.detail ?? ""}`).includes(norm(q.trim()));
  };
  const groups = [...APT_CATEGORIES, { key: "custom" as const, label: "Personalizadas" }]
    .map((g) => ({ ...g, items: c.aptidoes.filter((e) => (APT_BY_ID[e.id]?.cat ?? "custom") === g.key && hit(e)) }))
    .filter((g) => g.items.length);

  const catalog = <AptCatalog c={c} status={status} granted={granted} onAdd={add} onAddCustom={addCustom} />;

  return (
    <div className="flex flex-col gap-5">
      <StepHeader kicker={stepKicker(c, "aptidoes")} title="Aptidões" />
      <RulesNote>
        Você tem {FREE_APTS} aptidões gratuitas (das opções marcadas como gratuitas, ou restritas alcançáveis por um Genin). Cada aptidão adicional custa {APT_COST} pontos de poder, e cada nível a mais de uma aptidão evolutiva é uma nova compra de {APT_COST} pontos, mesmo numa gratuita. Qualquer aptidão pode ser adicionada; o que não seria possível pelas regras normais ganha uma observação.
      </RulesNote>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
        <section aria-labelledby="h-apts" className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="h-apts" className="mr-auto font-display text-2xl font-extrabold text-paper">
              Suas aptidões <span className="text-base text-muted">{c.aptidoes.length}</span>
            </h3>
            <Badge tone={s.freeUsed > FREE_APTS ? "bad" : s.freeUsed === FREE_APTS ? "ok" : "chakra"}>
              {s.freeUsed}/{FREE_APTS} gratuitas
            </Badge>
            <Badge tone={powerLeft < 0 ? "bad" : "muted"}>{s.paidApts} pts de poder</Badge>
            <button type="button" className="btn-primary min-h-10 xl:hidden" onClick={() => setCatOpen(true)}>
              <IconPlus className="size-4" /> Adicionar
            </button>
          </div>
          {c.aptidoes.length > 6 && (
            <label className="flex h-11 items-center gap-2.5 rounded-xl border border-line-2 bg-ink-2 px-3 focus-within:border-chakra">
              <IconSearch className="size-4 shrink-0 text-muted" />
              <span className="sr-only">Filtrar suas aptidões</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar suas aptidões" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint" />
            </label>
          )}

          {c.aptidoes.length === 0 ? (
            <p className="card px-4 py-6 text-center text-sm text-muted">Nenhuma aptidão ainda. Escolha no catálogo.</p>
          ) : groups.length === 0 ? (
            <p className="card px-4 py-6 text-center text-sm text-muted">Nenhuma aptidão com “{q}”.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-line bg-panel">
              {groups.map((g) => {
                const isOpen = !!q.trim() || !closed[g.key];
                return (
                  <div key={g.key} className="border-b border-line last:border-0">
                    <button
                      type="button"
                      onClick={() => setClosed((x) => ({ ...x, [g.key]: isOpen }))}
                      aria-expanded={isOpen}
                      className="flex min-h-11 w-full items-center gap-2.5 bg-ink-2 px-3 text-left"
                    >
                      <IconRight className={`size-4 shrink-0 text-faint transition ${isOpen ? "rotate-90" : ""}`} />
                      <span className="text-xs font-bold tracking-[0.12em] text-muted uppercase">{g.label}</span>
                      <span className="rounded-full bg-panel-2 px-2 text-[11px] font-bold text-muted">{g.items.length}</span>
                      {!isOpen && <span className="min-w-0 flex-1 truncate text-right text-xs text-faint">{g.items.map((e) => APT_BY_ID[e.id]?.name ?? e.customName).join(", ")}</span>}
                    </button>
                    {isOpen && (
                      <ul>
                        {g.items.map((e) => (
                          <AptRow key={e.uid} c={c} e={e} set={set} st={APT_BY_ID[e.id] ? status(APT_BY_ID[e.id]) : null} open={open === e.uid} onToggle={() => setOpen(open === e.uid ? null : e.uid)} />
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Telas largas: catálogo fixo ao lado; nas menores, na gaveta do botão "Adicionar" */}
        <aside aria-label="Catálogo de aptidões" className="hidden xl:sticky xl:top-[5.5rem] xl:flex xl:max-h-[calc(100dvh-7rem)] xl:flex-col xl:gap-3 xl:overflow-y-auto xl:rounded-2xl xl:border xl:border-line-2 xl:bg-ink-2 xl:p-4">
          <h3 className="font-display text-xl font-extrabold text-paper">Adicionar aptidão</h3>
          {catalog}
        </aside>
      </div>

      <Sheet open={catOpen} onClose={() => setCatOpen(false)} title="Adicionar aptidão">
        {catalog}
      </Sheet>
    </div>
  );
}

/** Falta escolher algo que a aptidão pede (categoria, aptidões ganhas, alvo do Talento…). */
function pending(a: Aptidao | undefined, e: AptEntry) {
  if (!a) return false;
  if (a.generic && !e.detail?.trim()) return true;
  if (a.grants && (e.choices ?? []).filter(Boolean).length < a.grants.n) return true;
  if (a.id === "talento-natural" && !(e.choices?.[0] && e.choices?.[1])) return true;
  if ((a.id === "atirador" || a.id === "mangekyou") && !e.variant) return true;
  return false;
}

/** Uma aptidão comprada: uma linha (nome, avisos, resumo, custo); o resto abre ao expandir. */
function AptRow({ c, e, set, st, open, onToggle }: { c: Character; e: AptEntry; set: StepProps["set"]; st: AptStatus | null; open: boolean; onToggle: () => void }) {
  const a = APT_BY_ID[e.id];
  const freeOk = a ? isFreeEligible(a) : false;
  const name = a?.name ?? e.customName;
  const falta = pending(a, e);
  return (
    <motion.li layout="position" className={`border-t border-line first:border-t-0 ${open ? "bg-panel-2" : ""}`}>
      <div className="flex min-h-12 items-center gap-2 py-1 pr-2 pl-3">
        <button type="button" onClick={onToggle} aria-expanded={open} aria-label={`${open ? "Recolher" : "Ver detalhes de"} ${name}`} className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 text-left">
          <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
            <span className="flex min-w-0 shrink-0 flex-wrap items-center gap-1.5 sm:w-60">
              <span className="font-bold text-paper">
                {name}
                {a?.maxLevel && a.maxLevel > 1 ? ` Nv ${e.level}` : ""}
              </span>
              {e.detail && <span className="text-xs text-muted">({e.detail})</span>}
              {st?.restricted && <Badge tone="bad">restrita</Badge>}
              {st?.banned && <Badge tone="bad">banida</Badge>}
              {st && !st.met && <Badge tone="bad">pré-req.</Badge>}
              {e.free && !freeOk && <Badge tone="bad">gratuita fora da regra</Badge>}
              {falta && <Badge tone="chakra">escolher</Badge>}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs text-muted sm:text-[13px]">{a?.desc ?? e.note ?? "Aptidão personalizada"}</span>
          </span>
          <IconRight className={`size-4 shrink-0 text-faint transition ${open ? "rotate-90" : ""}`} />
        </button>
        <button
          type="button"
          onClick={() => set((d) => void (d.aptidoes.find((x) => x.uid === e.uid)!.free = !e.free))}
          className={`chip min-h-10 shrink-0 px-2.5 text-xs font-bold ${e.free ? "border-ok bg-ok/15 text-ok" : "text-muted"}`}
          aria-pressed={e.free}
          aria-label={`${name}: ${e.free ? "gratuita" : `${aptCost(e)} pontos`} (tocar alterna gratuita)`}
        >
          {e.free ? (
            <>
              <IconCheck className="size-3.5" /> Grátis{aptCost(e) > 0 && ` +${aptCost(e)}`}
            </>
          ) : (
            `${aptCost(e)} pts`
          )}
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-2.5 px-3 pb-3 sm:pl-9">
          {a?.reqText && <span className={`text-xs ${st?.met ? "text-ok" : "text-bad"}`}>{st?.met ? "✓" : "✗"} Pré-requisito: {a.reqText}</span>}
          {st?.restricted && <span className="text-xs text-bad">Restrita a: {ownersText("aptidoes", a!.id)}.</span>}
          {a?.generic && (
            <input
              className="field max-w-sm py-1.5 text-sm"
              placeholder="Categoria (ex.: Kunai, Katon, Furtividade)"
              value={e.detail ?? ""}
              onChange={(ev) => set((d) => void (d.aptidoes.find((x) => x.uid === e.uid)!.detail = ev.target.value))}
              aria-label={`Categoria de ${a.name}`}
            />
          )}
          {a?.levels && <LevelList c={c} a={a} level={e.level} />}
          {a?.grants && <GrantChoices c={c} a={a} e={e} set={set} />}
          {a && (a.id === "juuinka-ichi" || a.id === "juuinka-ni") && <JuuinkaChoices e={e} set={set} />}
          {a?.id === "talento-natural" && <TalentoChoices c={c} e={e} set={set} />}
          {a?.id === "sensor" && <SensorChoice e={e} set={set} />}
          {a?.id === "atirador" && <AtiradorChoice e={e} set={set} />}
          {a?.id === "mangekyou" && <MangekyouChoice c={c} e={e} set={set} />}
          {!a && (
            <textarea
              rows={2}
              className="field resize-y py-1.5 text-sm"
              placeholder="Efeito da aptidão (o que ela faz, pré-requisito combinado com o mestre, custo…)"
              value={e.note ?? ""}
              onChange={(ev) => set((d) => void (d.aptidoes.find((x) => x.uid === e.uid)!.note = ev.target.value))}
              aria-label={`Efeito de ${e.customName}`}
            />
          )}
          <div className="flex flex-wrap items-center gap-3">
            {a?.maxLevel && a.maxLevel > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-faint">nível</span>
                <Stepper size="sm" label={`nível de ${a.name}`} value={e.level} min={1} max={a.maxLevel} onChange={(n) => set((d) => void (d.aptidoes.find((x) => x.uid === e.uid)!.level = n))} />
              </div>
            )}
            <button type="button" onClick={() => set((d) => void (d.aptidoes = d.aptidoes.filter((x) => x.uid !== e.uid)))} className="btn-ghost min-h-10 text-muted">
              <IconTrash className="size-4" /> Remover
            </button>
          </div>
        </div>
      )}
    </motion.li>
  );
}

/** Catálogo de aptidões (coluna fixa ou gaveta): busca, categoria e "só as que posso pegar". */
function AptCatalog({ c, status, granted, onAdd, onAddCustom }: { c: Character; status: (a: Aptidao) => AptStatus; granted: string[]; onAdd: (a: Aptidao) => void; onAddCustom: (name: string) => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<AptCategory | "todas">("todas");
  const [onlyAvail, setOnlyAvail] = useState(true);
  const [showOthers, setShowOthers] = useState(false);
  const [custom, setCustom] = useState("");
  const allowed = useMemo(() => allowedRestricted(c), [c]);

  const list = APTIDOES.filter((a) => {
    if (cat !== "todas" && a.cat !== cat) return false;
    if (!showOthers && (a.cat === "restrita" || a.cat === "especial") && !allowed.apts.has(a.id) && cat !== "restrita" && cat !== "especial") return false;
    if (q && !norm(`${a.name} ${a.desc} ${a.reqText ?? ""}`).includes(norm(q))) return false;
    if (onlyAvail && !status(a).available) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-3">
      <label className="flex h-11 items-center gap-2.5 rounded-xl border border-line-2 bg-panel px-3 focus-within:border-chakra">
        <IconSearch className="size-4 shrink-0 text-muted" />
        <span className="sr-only">Buscar aptidão</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, efeito ou pré-requisito" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint" />
      </label>
      <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 scrollbar-none xl:mx-0 xl:flex-wrap xl:px-0">
        {[{ key: "todas" as const, label: "Todas" }, ...APT_CATEGORIES].map((x) => (
          <button key={x.key} type="button" aria-pressed={cat === x.key} onClick={() => setCat(x.key)} className={`chip min-h-9 shrink-0 text-[13px] ${cat === x.key ? "border-chakra bg-chakra font-bold text-paper-ink" : "text-muted hover:border-muted"}`}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col">
        <Toggle checked={onlyAvail} onChange={setOnlyAvail} label="Só as que posso pegar" />
        <Toggle checked={showOthers} onChange={setShowOthers} label="Mostrar restritas de outros clãs" />
      </div>
      <span className="text-xs text-muted">{list.length} aptidões</span>
      <ul className="flex flex-col gap-1.5">
        {list.map((a) => {
          const st = status(a);
          const many = a.generic || a.repeatable;
          const disabled = st.owned && !many;
          return (
            <li key={a.id} className={`flex items-center gap-2.5 rounded-xl border border-line bg-panel py-2 pr-2 pl-3 ${st.available ? "" : "opacity-70"}`}>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-bold text-paper">{a.name}</span>
                  {isFreeEligible(a) && <Badge tone="ok">gratuita</Badge>}
                  {a.maxLevel && a.maxLevel > 1 && <Badge>até nv {a.maxLevel}</Badge>}
                  {a.repeatable && st.owned && <Badge>{c.aptidoes.filter((x) => x.id === a.id).length}×</Badge>}
                  {granted.includes(a.id) && <Badge tone="ok">pela Técnica Avançada</Badge>}
                </span>
                <span className="line-clamp-1 text-xs text-muted" title={a.desc}>
                  {a.desc}
                </span>
                {a.reqText && (
                  <span className={`truncate text-xs ${st.met ? "text-ok" : "text-bad"}`} title={a.reqText}>
                    {st.met ? "✓" : "✗"} {a.reqText}
                  </span>
                )}
                {st.banned && <span className="text-xs text-bad">Banida pela regra opcional.</span>}
                {st.restricted && <span className="text-xs text-bad">Restrita a: {ownersText("aptidoes", a.id)}.</span>}
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => onAdd(a)}
                disabled={disabled}
                className={`grid size-11 shrink-0 place-items-center rounded-xl transition disabled:opacity-40 ${disabled ? "bg-ok/20 text-ok" : "bg-seal text-white"}`}
                aria-label={disabled ? `${a.name} já adicionada` : `Adicionar ${a.name}`}
              >
                {disabled ? <IconCheck /> : <IconPlus />}
              </motion.button>
            </li>
          );
        })}
      </ul>
      {list.length === 0 && <p className="text-center text-sm text-muted">Nenhuma aptidão com esses filtros.</p>}
      <form
        className="flex gap-2"
        onSubmit={(ev) => {
          ev.preventDefault();
          if (!custom.trim()) return;
          onAddCustom(custom.trim());
          setCustom("");
        }}
      >
        <input className="field py-2 text-sm" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Aptidão personalizada" aria-label="Nome da aptidão personalizada" />
        <button type="submit" className="btn-ghost shrink-0" disabled={!custom.trim()}>
          <IconPlus className="size-4" /> Criar
        </button>
      </form>
    </div>
  );
}

/** Níveis 2, 3… de uma aptidão evolutiva, com pré-requisito e custo. `level` = nível já comprado (0 no catálogo). */
function LevelList({ c, a, level }: { c: Character; a: Aptidao; level: number }) {
  return (
    <ul className="mt-0.5 flex flex-col gap-0.5 text-xs leading-snug">
      {a.levels!.map((l, i) => {
        const n = i + 2;
        const met = reqsMet(c, l.req);
        const tone = level >= n ? (met ? "text-ok" : "text-bad") : "text-faint";
        return (
          <li key={n} className={tone}>
            <strong>Nv {n}</strong> ({l.reqText}; {a.levelsFree ? "sem custo" : `+${APT_COST} pts`}): {l.desc}
          </li>
        );
      })}
    </ul>
  );
}

/** Aptidões recebidas de graça por outra, como as 2 de técnica da Técnica Avançada (Livro Básico, pág. 243). */
function GrantChoices({ c, a, e, set }: { c: Character; a: Aptidao; e: AptEntry; set: StepProps["set"] }) {
  const { cat, n } = a.grants!;
  const options = APTIDOES.filter((x) => x.cat === cat);
  const picks = e.choices ?? [];
  const pick = (i: number, id: string) =>
    set((d) => {
      const x = d.aptidoes.find((y) => y.uid === e.uid)!;
      const cur = Array.from({ length: n }, (_, k) => x.choices?.[k] ?? "");
      cur[i] = id;
      x.choices = cur;
    });
  return (
    <div className="mt-1 grid gap-2 sm:grid-cols-2">
      {Array.from({ length: n }, (_, i) => (
        <label key={i} className="flex flex-col gap-1 text-xs text-muted">
          Aptidão {APT_CATEGORIES.find((x) => x.key === cat)?.label.toLowerCase()} {i + 1} (gratuita)
          <select className="field py-1.5 text-sm" value={picks[i] ?? ""} onChange={(ev) => pick(i, ev.target.value)}>
            <option value="">Escolher…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id} disabled={picks.includes(o.id) && picks[i] !== o.id}>
                {o.name}
                {reqsMet(c, o.req) ? "" : ` (pede ${o.reqText})`}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

/** Talento Natural (Livro Básico, pág. 243): um efeito não exclusivo para um poder versátil ou Hibon Ninpou, com as evoluções de graça. */
function TalentoChoices({ c, e, set }: { c: Character; e: AptEntry; set: StepProps["set"] }) {
  const targets = talentoTargets(c);
  const [target = "", eff = ""] = e.choices ?? [];
  const edit = (i: number, v: string) =>
    set((d) => {
      const x = d.aptidoes.find((y) => y.uid === e.uid)!;
      const cur = [x.choices?.[0] ?? "", x.choices?.[1] ?? ""];
      cur[i] = v;
      if (i === 0) cur[1] = "";
      x.choices = cur;
    });
  const label = (id: string) => (id === "hibon" ? "Hibon Ninpou" : versatileName(id));
  return (
    <div className="mt-1 grid gap-2 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-xs text-muted">
        Poder
        <select className="field py-1.5 text-sm" value={target} onChange={(ev) => edit(0, ev.target.value)}>
          <option value="">{targets.length ? "Escolher…" : "Nenhum poder versátil ou Hibon na ficha"}</option>
          {target && !targets.includes(target) && <option value={target}>{label(target)} (não está na ficha)</option>}
          {targets.map((id) => (
            <option key={id} value={id}>
              {label(id)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        Efeito (ganha as evoluções no nível certo)
        <select className="field py-1.5 text-sm" value={eff} disabled={!target} onChange={(ev) => edit(1, ev.target.value)}>
          <option value="">Escolher…</option>
          {target &&
            talentoEffects(target)
              .map((id) => EFEITO_BY_ID[id])
              .filter(Boolean)
              .sort((a, b) => a.level - b.level)
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} (nv {x.level})
                </option>
              ))}
        </select>
      </label>
    </div>
  );
}

/** Sensor Limitado (Livro Básico, aptidão Sensor): escolhido na compra, custa 3 de chakra em vez de 5. */
function SensorChoice({ e, set }: { e: AptEntry; set: StepProps["set"] }) {
  return (
    <label className="mt-1 flex max-w-sm flex-col gap-1 text-xs text-muted">
      Tipo de sensor
      <select className="field py-1.5 text-sm" value={e.variant ?? ""} onChange={(ev) => set((d) => void (d.aptidoes.find((x) => x.uid === e.uid)!.variant = ev.target.value))}>
        <option value="">Completo · 5 chakra</option>
        {Object.entries(SENSOR_LIMITES).map(([k, l]) => (
          <option key={k} value={k}>
            Limitado ({l}) · 3 chakra
          </option>
        ))}
      </select>
    </label>
  );
}

/** Atirador: arcos (+1 de dano) ou armas simples de arremesso (+3 de dano). */
function AtiradorChoice({ e, set }: { e: AptEntry; set: StepProps["set"] }) {
  return (
    <label className="mt-1 flex max-w-sm flex-col gap-1 text-xs text-muted">
      Tipo de arma
      <select className="field py-1.5 text-sm" value={e.variant ?? ""} onChange={(ev) => set((d) => void (d.aptidoes.find((x) => x.uid === e.uid)!.variant = ev.target.value))}>
        <option value="">Escolher…</option>
        {Object.entries(ATIRADOR).map(([k, l]) => (
          <option key={k} value={k}>
            {l[0].toUpperCase() + l.slice(1)}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Mangekyou Sharingan (Livro Básico, pág. 183): um par de técnicas nos olhos; o Susanoo vem ao dominar as duas.
 * Cada técnica desperta quando a ficha cumpre os pré-requisitos dela.
 */
function MangekyouChoice({ c, e, set }: { c: Character; e: AptEntry; set: StepProps["set"] }) {
  const m = mangekyou(c);
  const tecs = m ? [...m.tecs, m.susanoo] : [];
  return (
    <div className="mt-1 flex flex-col gap-2">
      <label className="flex max-w-sm flex-col gap-1 text-xs text-muted">
        Par de técnicas dos olhos
        <select className="field py-1.5 text-sm" value={e.variant ?? ""} onChange={(ev) => set((d) => void (d.aptidoes.find((x) => x.uid === e.uid)!.variant = ev.target.value))}>
          <option value="">Escolher…</option>
          {MANGEKYOU_PARES.map((x) => (
            <option key={x.k} value={x.k}>
              {x.label}
            </option>
          ))}
        </select>
      </label>
      {m?.par && (
        <ul className="flex flex-wrap gap-1.5">
          {tecs.map((t) => (
            <li key={t.id} className={`rounded-full px-2.5 py-1 text-xs ${t.ok ? "bg-ok/15 font-bold text-ok" : "bg-panel-2 text-muted"}`}>
              {t.ok ? "✓" : "✗"} {t.name}
              {!t.ok && ` · falta ${t.falta.join(", ")}`}
            </li>
          ))}
        </ul>
      )}
      <span className="text-xs leading-relaxed text-muted">
        {m?.eterno
          ? "Mangekyou Eterno: as técnicas não custam pontos de visão."
          : "10 pontos de visão para as técnicas, que não se recuperam (só o Descanso do Sharingan, depois de zerar, devolve até 5). A Mesa desconta e aplica o ofuscado."}
      </span>
    </div>
  );
}

/** Escolhas feitas na compra do Juuinka (Livro de Hijutsus, pág. 56–57). A Mesa usa isso para montar os bônus do selo. */
function JuuinkaChoices({ e, set }: { e: AptEntry; set: StepProps["set"] }) {
  const edit = (fn: (x: AptEntry) => void) => set((d) => fn(d.aptidoes.find((x) => x.uid === e.uid)!));

  if (e.id === "juuinka-ichi")
    return (
      <span className="mt-1 text-xs text-muted">
        Regra da mesa: os {JUUINKA_ICHI_PICKS} bônus do selo são escolhidos na Mesa, a cada ativação (dá para trocar ao vivo).
      </span>
    );

  const ni = niChoices(e.choices);
  const setNi = (i: number, k: string) =>
    edit((x) => {
      const cur = niChoices(x.choices);
      cur[i] = k;
      x.choices = cur;
    });
  return (
    <div className="mt-1 grid gap-2 sm:grid-cols-3">
      {JUUINKA_NI_DEFAULT.map((d, i) => (
        <label key={d.k} className="flex flex-col gap-1 text-xs text-muted">
          Benefício {i + 1}
          <select className="field py-1.5 text-sm" value={ni[i]} onChange={(ev) => setNi(i, ev.target.value)}>
            <option value={d.k}>{d.label}</option>
            {JUUINKA_BONUS.map((b) => (
              <option key={b.k} value={b.k}>
                Trocar por {b.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <label className="flex flex-col gap-1 text-xs text-muted">
        Tipo de selo
        <select className="field py-1.5 text-sm" value={e.variant ?? ""} onChange={(ev) => edit((x) => void (x.variant = ev.target.value))}>
          {JUUINKA_SELOS.map((x) => (
            <option key={x.k} value={x.k}>
              {x.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
