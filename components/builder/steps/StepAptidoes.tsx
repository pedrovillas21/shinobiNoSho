"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { APTIDOES, APT_BY_ID, APT_CATEGORIES, BANNED_APTS } from "@/lib/data/aptidoes";
import { JUUINKA_BONUS, JUUINKA_ICHI_PICKS, JUUINKA_NI_DEFAULT, JUUINKA_SELOS, niChoices } from "@/lib/data/juuinka";
import { APT_COST, FREE_APTS, allowedRestricted, budgetFor, isFreeEligible, ownersText, reqsMet, spent, uid } from "@/lib/rules";
import type { AptCategory, AptEntry, Aptidao } from "@/lib/types";
import { Badge, IconCheck, IconPlus, IconSearch, IconTrash, Stepper, StepHeader, Toggle } from "../../ui";
import type { StepProps } from "../shared";

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function StepAptidoes({ c, set }: StepProps) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<AptCategory | "todas">("todas");
  const [onlyAvail, setOnlyAvail] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const [custom, setCustom] = useState("");
  const b = budgetFor(c.nc, c.optionals);
  const s = spent(c);
  const allowed = useMemo(() => allowedRestricted(c), [c]);
  const powerLeft = b.power - s.power;

  const status = (a: Aptidao) => {
    const banned = c.optionals.aptidoesBanidas && BANNED_APTS.includes(a.id);
    const restricted = (a.cat === "restrita" || a.cat === "especial") && !allowed.apts.has(a.id);
    const met = reqsMet(c, a.req);
    const owned = c.aptidoes.some((e) => e.id === a.id);
    return { banned, restricted, met, owned, available: !banned && !restricted && met };
  };

  const catalog = useMemo(() => {
    return APTIDOES.filter((a) => {
      if (cat !== "todas" && a.cat !== cat) return false;
      if (!showOthers && (a.cat === "restrita" || a.cat === "especial") && !allowed.apts.has(a.id) && cat !== "restrita" && cat !== "especial") return false;
      if (q && !norm(`${a.name} ${a.desc} ${a.reqText ?? ""}`).includes(norm(q))) return false;
      if (onlyAvail && !status(a).available) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, q, onlyAvail, showOthers, c, allowed]);

  const add = (a: Aptidao) =>
    set((d) => {
      const freeUsed = d.aptidoes.filter((x) => x.free).length;
      d.aptidoes.push({ uid: uid(), id: a.id, level: 1, free: freeUsed < FREE_APTS && isFreeEligible(a), detail: a.generic ? "" : undefined });
    });

  const addCustom = () => {
    const name = custom.trim();
    if (!name) return;
    set((d) => void d.aptidoes.push({ uid: uid(), id: "custom", customName: name, level: 1, free: false }));
    setCustom("");
  };

  return (
    <div className="flex flex-col gap-8">
      <StepHeader kicker="Etapa 5" title="Aptidões">
        Você tem {FREE_APTS} aptidões gratuitas (das opções marcadas como gratuitas, ou restritas alcançáveis por um Genin). Cada aptidão adicional custa {APT_COST} pontos de poder. Qualquer aptidão pode ser adicionada; o que não seria possível pelas regras normais ganha uma observação.
      </StepHeader>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-2xl font-extrabold text-paper">Suas aptidões</h3>
          <div className="flex gap-2 text-sm">
            <Badge tone={s.freeUsed > FREE_APTS ? "bad" : s.freeUsed === FREE_APTS ? "ok" : "chakra"}>
              {s.freeUsed}/{FREE_APTS} gratuitas
            </Badge>
            <Badge tone={powerLeft < 0 ? "bad" : "muted"}>{s.paidApts} pts de poder</Badge>
          </div>
        </div>
        {c.aptidoes.length === 0 ? (
          <p className="card px-4 py-6 text-center text-sm text-muted">Nenhuma aptidão ainda. Escolha no catálogo abaixo.</p>
        ) : (
          <motion.ul layout className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {c.aptidoes.map((e) => {
                const a = APT_BY_ID[e.id];
                const st = a ? status(a) : null;
                const freeOk = a ? isFreeEligible(a) : false;
                return (
                  <motion.li
                    layout
                    key={e.uid}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    className={`card flex flex-col gap-3 p-3 sm:flex-row sm:items-center ${st && !st.available ? "border-bad/50" : ""}`}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-paper">{a?.name ?? e.customName}</span>
                        <Badge>{a ? APT_CATEGORIES.find((x) => x.key === a.cat)?.label : "Personalizada"}</Badge>
                        {st?.restricted && <Badge tone="bad">restrita: {ownersText("aptidoes", a!.id)}</Badge>}
                        {st?.banned && <Badge tone="bad">banida</Badge>}
                        {st && !st.met && <Badge tone="bad">pré-req.</Badge>}
                        {e.free && !freeOk && <Badge tone="bad">gratuita fora da regra</Badge>}
                      </div>
                      {a?.reqText && <span className={`text-xs ${st?.met ? "text-faint" : "text-bad"}`}>Pré-requisito: {a.reqText}</span>}
                      {a?.generic && (
                        <input
                          className="field mt-1 max-w-sm py-1.5 text-sm"
                          placeholder="Categoria (ex.: Kunai, Katon, Furtividade)"
                          value={e.detail ?? ""}
                          onChange={(ev) => set((d) => void (d.aptidoes.find((x) => x.uid === e.uid)!.detail = ev.target.value))}
                          aria-label={`Categoria de ${a.name}`}
                        />
                      )}
                      {a && (a.id === "juuinka-ichi" || a.id === "juuinka-ni") && <JuuinkaChoices e={e} set={set} />}
                      {!a && (
                        <textarea
                          rows={2}
                          className="field mt-1 resize-y py-1.5 text-sm"
                          placeholder="Efeito da aptidão (o que ela faz, pré-requisito combinado com o mestre, custo…)"
                          value={e.note ?? ""}
                          onChange={(ev) => set((d) => void (d.aptidoes.find((x) => x.uid === e.uid)!.note = ev.target.value))}
                          aria-label={`Efeito de ${e.customName}`}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {a?.maxLevel && a.maxLevel > 1 && (
                        <div className="flex flex-col items-center">
                          <span className="text-[11px] text-faint">nível</span>
                          <Stepper size="sm" label={`nível de ${a.name}`} value={e.level} min={1} max={a.maxLevel} onChange={(n) => set((d) => void (d.aptidoes.find((x) => x.uid === e.uid)!.level = n))} />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => set((d) => void (d.aptidoes.find((x) => x.uid === e.uid)!.free = !e.free))}
                        className={`chip min-h-10 font-bold ${e.free ? "border-ok bg-ok/15 text-ok" : "text-muted"} disabled:opacity-40`}
                        aria-pressed={e.free}
                      >
                        {e.free ? (
                          <>
                            <IconCheck className="size-4" /> Gratuita
                          </>
                        ) : (
                          `${APT_COST * e.level} pts`
                        )}
                      </button>
                      <button type="button" onClick={() => set((d) => void (d.aptidoes = d.aptidoes.filter((x) => x.uid !== e.uid)))} className="btn-ghost size-10 min-h-10 px-0" aria-label={`Remover ${a?.name ?? e.customName}`}>
                        <IconTrash className="size-4" />
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ul>
        )}
        <form
          className="flex gap-2"
          onSubmit={(ev) => {
            ev.preventDefault();
            addCustom();
          }}
        >
          <input className="field" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Aptidão personalizada (ex.: técnica criada com o mestre)" aria-label="Nome da aptidão personalizada" />
          <button type="submit" className="btn-ghost shrink-0" disabled={!custom.trim()}>
            <IconPlus className="size-4" /> Adicionar
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="font-display text-2xl font-extrabold text-paper">Catálogo</h3>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="flex h-12 flex-1 items-center gap-3 rounded-xl border border-line-2 bg-panel px-4 focus-within:border-chakra">
            <IconSearch className="size-5 text-muted" />
            <span className="sr-only">Buscar aptidão</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, efeito ou pré-requisito" className="flex-1 bg-transparent outline-none placeholder:text-faint" />
          </label>
          <div className="md:w-72">
            <Toggle checked={onlyAvail} onChange={setOnlyAvail} label="Só as que posso pegar" />
          </div>
          <div className="md:w-80">
            <Toggle checked={showOthers} onChange={setShowOthers} label="Mostrar restritas de outros clãs" />
          </div>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
          {[{ key: "todas" as const, label: "Todas" }, ...APT_CATEGORIES].map((x) => (
            <button key={x.key} type="button" onClick={() => setCat(x.key)} className={`chip shrink-0 ${cat === x.key ? "border-chakra bg-chakra font-bold text-paper-ink" : "text-muted hover:border-muted"}`}>
              {x.label}
            </button>
          ))}
        </div>

        <ul className="grid gap-2 md:grid-cols-2">
          {catalog.map((a) => {
            const st = status(a);
            const disabled = st.owned && !a.generic;
            return (
              <li key={a.id} className={`card flex gap-3 p-3 ${st.available ? "" : "opacity-70"}`}>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-paper">{a.name}</span>
                    {isFreeEligible(a) && <Badge tone="ok">gratuita</Badge>}
                    {a.generic && <Badge>genérica</Badge>}
                    {a.maxLevel && a.maxLevel > 1 && <Badge>até nv {a.maxLevel}</Badge>}
                    <span className="text-[11px] text-faint">{a.source}</span>
                  </div>
                  <span className="text-sm leading-snug text-muted">{a.desc}</span>
                  {a.reqText && (
                    <span className={`text-xs ${st.met ? "text-ok" : "text-bad"}`}>
                      {st.met ? "✓" : "✗"} {a.reqText}
                    </span>
                  )}
                  {st.banned && <span className="text-xs text-bad">Banida pela regra opcional.</span>}
                  {st.restricted && <span className="text-xs text-bad">Restrita a: {ownersText("aptidoes", a.id)}. Pode pegar, mas fica como observação.</span>}
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => add(a)}
                  disabled={disabled}
                  className={`grid size-11 shrink-0 place-items-center self-center rounded-xl transition disabled:opacity-40 ${st.owned && !a.generic ? "bg-ok/20 text-ok" : "bg-seal text-white"}`}
                  aria-label={st.owned && !a.generic ? `${a.name} já adicionada` : `Adicionar ${a.name}`}
                >
                  {st.owned && !a.generic ? <IconCheck /> : <IconPlus />}
                </motion.button>
              </li>
            );
          })}
        </ul>
        {catalog.length === 0 && <p className="text-center text-muted">Nenhuma aptidão com esses filtros.</p>}
      </section>
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
