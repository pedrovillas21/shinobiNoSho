"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ETAPAS_CRIATURA, contrato, validarInvocacao } from "@/lib/kuchiyose";
import { NC_MAX, NC_MIN, POWER_BONUS, POWER_BONUS_NCS, budgetFor, derived, rankLabel, spent, validate } from "@/lib/rules";
import { downloadJSON, useChars, useCharsStatus, useHydrated } from "@/lib/store";
import type { Character } from "@/lib/types";
import { AnimatedNumber, IconAlert, IconCheck, IconDownload, IconLeft, IconList, IconRight, Sheet } from "../ui";
import { ABAS_CONTRATO, stepsFor, type InvNav, type StepKey } from "./shared";
import { StepAptidoes } from "./steps/StepAptidoes";
import { StepAtributos } from "./steps/StepAtributos";
import { StepCla } from "./steps/StepCla";
import { StepConceito } from "./steps/StepConceito";
import { StepEquipamento } from "./steps/StepEquipamento";
import { StepFicha } from "./steps/StepFicha";
import { StepGolem } from "./steps/StepGolem";
import { StepHistoria } from "./steps/StepHistoria";
import { CriaturaResumo, StepInvocacoes } from "./steps/StepInvocacoes";
import { StepPericias } from "./steps/StepPericias";
import { StepPoderes } from "./steps/StepPoderes";

/** Próxima posição dentro da etapa Invocações, ou null quando é hora de sair dela. */
function invMove(nav: InvNav, editing: boolean, d: 1 | -1): InvNav | null {
  if (editing) {
    const etapa = nav.etapa + d;
    // Antes da 1ª sub-etapa ou depois da última ("Salvar criatura"): volta à lista de criaturas.
    return etapa >= 1 && etapa <= ETAPAS_CRIATURA.length ? { ...nav, etapa } : { aba: 3, edit: null, etapa: 1 };
  }
  const aba = nav.aba + d;
  return aba >= 1 && aba <= ABAS_CONTRATO.length ? { ...nav, aba, edit: null } : null;
}

export function Builder({ id }: { id: string }) {
  const hydrated = useHydrated();
  const status = useCharsStatus();
  const c = useChars((s) => s.chars[id]);
  const update = useChars((s) => s.update);
  const [stepKey, setStepKey] = useState<StepKey>("conceito");
  const [dir, setDir] = useState(1);
  const [nav, setNav] = useState<InvNav>({ aba: 1, edit: null, etapa: 1 });
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);

  const set = useCallback((fn: (d: Character) => void) => update(id, fn), [id, update]);

  useEffect(() => {
    if (!c) return;
    document.title = `${c.name || "Nova ficha"} · Shinobi no Sho`;
  }, [c?.name, c]);

  if (status === "error") return <div className="grid min-h-dvh place-items-center px-6 text-center text-muted">Não foi possível carregar suas fichas. Recarregue a página.</div>;
  if (!hydrated) return <div className="grid min-h-dvh place-items-center text-muted">Abrindo pergaminho…</div>;
  if (!c)
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <p className="font-display text-2xl font-extrabold text-paper">Ficha não encontrada na sua conta.</p>
          <Link href="/" className="btn-primary">
            Voltar ao início
          </Link>
        </div>
      </div>
    );

  return (
    <BuilderView
      c={c}
      set={set}
      stepKey={stepKey}
      setStepKey={setStepKey}
      dir={dir}
      setDir={setDir}
      nav={nav}
      setNav={setNav}
      summaryOpen={summaryOpen}
      setSummaryOpen={setSummaryOpen}
      stepsOpen={stepsOpen}
      setStepsOpen={setStepsOpen}
    />
  );
}

function BuilderView({
  c,
  set,
  stepKey,
  setStepKey,
  dir,
  setDir,
  nav,
  setNav,
  summaryOpen,
  setSummaryOpen,
  stepsOpen,
  setStepsOpen,
}: {
  c: Character;
  set: (fn: (d: Character) => void) => void;
  stepKey: StepKey;
  setStepKey: (k: StepKey) => void;
  dir: number;
  setDir: (d: number) => void;
  nav: InvNav;
  setNav: (n: InvNav) => void;
  summaryOpen: boolean;
  setSummaryOpen: (v: boolean) => void;
  stepsOpen: boolean;
  setStepsOpen: (v: boolean) => void;
}) {
  const b = budgetFor(c.nc, c.optionals);
  const s = spent(c);
  const issues = useMemo(() => validate(c), [c]);
  const errorsByStep = useMemo(() => {
    const m: Record<string, number> = {};
    issues.filter((i) => i.sev === "erro").forEach((i) => (m[i.step] = (m[i.step] ?? 0) + 1));
    return m;
  }, [issues]);
  const STEPS = stepsFor(c);
  // Invocações (ou Golem) some se o Kuchiyose (ou o Mokuton) deixar de existir: quem estava nela volta para Poderes.
  const found = STEPS.findIndex((x) => x.key === stepKey);
  const step = found >= 0 ? found : Math.max(0, STEPS.findIndex((x) => x.key === "poderes"));
  const key = STEPS[step].key;

  const scrollTop = () => typeof window !== "undefined" && window.scrollTo({ top: 0, behavior: "smooth" });
  const go = (i: number, fromNext = true) => {
    const t = Math.max(0, Math.min(STEPS.length - 1, i));
    setDir(t >= step ? 1 : -1);
    setStepKey(STEPS[t].key);
    // Entrando em Invocações pelo "Anterior" (vindo de Equipamento), abre na última parte do contrato.
    if (STEPS[t].key === "invocacoes" && STEPS[t].key !== key) setNav({ aba: fromNext ? 1 : ABAS_CONTRATO.length, edit: null, etapa: 1 });
    scrollTop();
  };
  const goKey = (k: string) => {
    go(Math.max(0, STEPS.findIndex((x) => x.key === k)));
    // Observações de Invocações são, quase sempre, das criaturas: abre a lista delas.
    if (k === "invocacoes") setNav({ aba: ABAS_CONTRATO.length, edit: null, etapa: 1 });
  };

  // Criatura aberta no editor da etapa Invocações.
  const editing = key === "invocacoes" && nav.edit ? contrato(c).criaturas.find((x) => x.uid === nav.edit) : undefined;
  const move = (d: 1 | -1) => {
    if (key === "invocacoes") {
      const r = invMove(nav, !!editing, d);
      if (r) {
        setDir(d);
        setNav(r);
        scrollTop();
        return;
      }
    }
    go(step + d, d > 0);
  };
  let prevLabel = step > 0 ? STEPS[step - 1].label : "Anterior";
  let nextLabel: string | null = step < STEPS.length - 1 ? STEPS[step + 1].label : null;
  if (editing) {
    prevLabel = nav.etapa > 1 ? ETAPAS_CRIATURA[nav.etapa - 2] : "Criaturas";
    nextLabel = nav.etapa < ETAPAS_CRIATURA.length ? ETAPAS_CRIATURA[nav.etapa] : "Salvar criatura";
  } else if (key === "invocacoes") {
    if (nav.aba > 1) prevLabel = ABAS_CONTRATO[nav.aba - 2];
    if (nav.aba < ABAS_CONTRATO.length) nextLabel = ABAS_CONTRATO[nav.aba];
  }
  const canPrev = step > 0 || !!editing;
  const resumoErr = editing ? validarInvocacao(c, editing).some((i) => i.sev === "erro") : issues.some((i) => i.sev === "erro");
  const resumo = editing ? (
    <CriaturaResumo
      c={c}
      inv={editing}
      onGo={(etapa) => {
        setSummaryOpen(false);
        setNav({ ...nav, etapa });
      }}
    />
  ) : null;

  const budgets = [
    { label: "Atributos", short: "Atrib.", used: s.attr, total: b.attr },
    { label: "Perícias", short: "Períc.", used: s.skill, total: b.skill },
    { label: "Poderes", short: "Poder.", used: s.power, total: b.power },
    { label: "Sociais", short: "Soc.", used: s.social, total: b.social },
    { label: "Aptidões grátis", short: "Apt.", used: s.freeUsed, total: 3 },
  ];
  // Orçamento que importa em cada etapa (no celular só ele aparece na faixa da etapa).
  const stepBudget = budgets[STEP_BUDGET[key] ?? -1];
  const errCount = issues.filter((i) => i.sev === "erro").length;

  const setNc = (v: number) => set((d) => void (d.nc = Math.max(NC_MIN, Math.min(NC_MAX, v))));

  return (
    <div className="min-h-dvh pb-28 lg:pb-12">
      {/* Cabeçalho: uma linha no computador (nome, NC e orçamentos); no celular, a faixa da etapa abre as etapas */}
      <header className="no-print sticky top-0 z-30 border-b border-line bg-ink/92 backdrop-blur supports-[backdrop-filter]:bg-ink/80">
        <div className="mx-auto flex max-w-[90rem] items-center gap-3 px-4 py-2.5 sm:px-6">
          <Link href="/" className="btn-ghost size-11 shrink-0 px-0" aria-label="Voltar às fichas">
            <IconLeft />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col leading-tight lg:w-52 lg:flex-none">
            <span className="truncate font-display text-lg font-extrabold text-paper">{c.name || "Novo shinobi"}</span>
            <span className="truncate text-xs text-muted">
              {rankLabel(c.nc)} · <SaveStatus />
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 rounded-xl border border-line-2 bg-ink-2 p-0.5">
            <button type="button" className="grid size-10 place-items-center rounded-lg text-lg font-bold hover:bg-panel-2 disabled:opacity-30" onClick={() => setNc(c.nc - 1)} disabled={c.nc <= NC_MIN} aria-label="Diminuir NC">
              −
            </button>
            <span className="min-w-12 text-center text-sm font-bold">
              NC <AnimatedNumber value={c.nc} />
            </span>
            <button type="button" className="grid size-10 place-items-center rounded-lg text-lg font-bold hover:bg-panel-2 disabled:opacity-30" onClick={() => setNc(c.nc + 1)} disabled={c.nc >= NC_MAX} aria-label="Aumentar NC">
              +
            </button>
          </div>
          <div className="hidden min-w-0 flex-1 gap-2 lg:flex">
            {budgets.map((x) => (
              <BudgetPill key={x.label} {...x} />
            ))}
          </div>
          <button type="button" className="btn-ghost hidden size-11 shrink-0 px-0 xl:inline-flex" onClick={() => downloadJSON(c)} aria-label="Exportar ficha">
            <IconDownload className="size-4" />
          </button>
          <button type="button" className="btn-ghost hidden shrink-0 sm:inline-flex" onClick={() => go(STEPS.length - 1)}>
            Ver ficha
          </button>
        </div>

        <button type="button" onClick={() => setStepsOpen(true)} aria-label="Ver todas as etapas e orçamentos" className="flex w-full items-center gap-3 border-t border-line bg-ink-2/80 px-4 py-2 text-left sm:px-6 lg:hidden">
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="truncate text-sm font-bold">
              <span className="text-muted">
                Etapa {step + 1} de {STEPS.length} ·
              </span>{" "}
              {STEPS[step].label}
            </span>
            <span className="flex gap-0.5" aria-hidden="true">
              {STEPS.map((st, i) => (
                <span key={st.key} className={`h-[3px] flex-1 rounded-full ${errorsByStep[st.key] ? "bg-bad" : i === step ? "bg-chakra" : i < step ? "bg-ok" : "bg-line-2"}`} />
              ))}
            </span>
          </span>
          {stepBudget && (
            <span className="shrink-0 text-sm font-bold" style={{ color: budgetTone(stepBudget.total - stepBudget.used) }}>
              {stepBudget.total - stepBudget.used}
              <span className="text-faint">/{stepBudget.total}</span>
            </span>
          )}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0 text-muted" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </header>

      <div className="mx-auto grid max-w-[90rem] gap-8 px-4 pt-6 sm:px-6 lg:grid-cols-[12.5rem_minmax(0,1fr)]">
        {/* Computador: etapas numa coluna, com energias e observações embaixo */}
        <aside className="no-print hidden lg:block">
          <div className="sticky top-[5.5rem] flex flex-col gap-4">
            <nav aria-label="Etapas">
              <ol className="flex flex-col gap-0.5">
                {STEPS.map((st, i) => {
                  const on = i === step;
                  const errs = errorsByStep[st.key] ?? 0;
                  const n = stepCount(c, st.key);
                  return (
                    <li key={st.key}>
                      <button
                        type="button"
                        onClick={() => go(i)}
                        aria-current={on ? "step" : undefined}
                        className={`flex h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-sm font-bold transition ${on ? "bg-panel-2 text-paper" : "text-muted hover:bg-panel hover:text-text"}`}
                      >
                        <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs ${on ? "bg-chakra text-paper-ink" : errs ? "bg-bad/20 text-bad" : i < step ? "bg-ok/20 text-ok" : "bg-line-2 text-muted"}`}>
                          {errs ? "!" : i < step ? <IconCheck className="size-3.5" /> : i + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{st.label}</span>
                        {n > 0 && <span className="text-xs font-normal text-faint">{n}</span>}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
            <RailResumo c={c} errors={errCount} warns={issues.length - errCount} onOpen={() => setSummaryOpen(true)} />
          </div>
        </aside>

        <main className="min-w-0">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={key}
              custom={dir}
              initial={{ opacity: 0, x: 24 * dir }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 * dir }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {key === "conceito" && <StepConceito c={c} set={set} />}
              {key === "cla" && <StepCla c={c} set={set} />}
              {key === "atributos" && <StepAtributos c={c} set={set} />}
              {key === "pericias" && <StepPericias c={c} set={set} />}
              {key === "aptidoes" && <StepAptidoes c={c} set={set} />}
              {key === "poderes" && <StepPoderes c={c} set={set} />}
              {key === "golem" && <StepGolem c={c} set={set} />}
              {key === "invocacoes" && <StepInvocacoes c={c} set={set} nav={nav} setNav={setNav} />}
              {key === "equipamento" && <StepEquipamento c={c} set={set} />}
              {key === "historia" && <StepHistoria c={c} set={set} />}
              {key === "ficha" && <StepFicha c={c} set={set} issues={issues} goTo={goKey} />}
            </motion.div>
          </AnimatePresence>

          <div className="no-print mt-10 hidden items-center justify-between lg:flex">
            <button type="button" className="btn-ghost" onClick={() => move(-1)} disabled={!canPrev}>
              <IconLeft className="size-4" /> {prevLabel}
            </button>
            {nextLabel ? (
              <button type="button" className="btn-primary" onClick={() => move(1)}>
                {nextLabel} <IconRight className="size-4" />
              </button>
            ) : (
              <Link href="/" className="btn-primary">
                Concluir <IconRight className="size-4" />
              </Link>
            )}
          </div>
        </main>
      </div>

      {/* Barra inferior (celular) */}
      <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink-2/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <button type="button" className="btn-ghost size-12 px-0" onClick={() => move(-1)} disabled={!canPrev} aria-label={`Voltar para ${prevLabel}`}>
            <IconLeft />
          </button>
          <button type="button" className="btn-ghost h-12 flex-1" onClick={() => setSummaryOpen(true)}>
            <IconList className="size-4" /> Resumo
            {resumoErr && <IconAlert className="size-4 text-bad" />}
          </button>
          {nextLabel ? (
            <button type="button" className="btn-primary h-12 min-w-0 flex-1" onClick={() => move(1)}>
              <span className="truncate">{nextLabel}</span> <IconRight className="size-4 shrink-0" />
            </button>
          ) : (
            <Link href="/" className="btn-primary h-12 flex-1">
              Concluir <IconRight className="size-4" />
            </Link>
          )}
        </div>
      </div>

      <Sheet open={summaryOpen} onClose={() => setSummaryOpen(false)} title={editing ? "Resumo da criatura" : "Resumo da ficha"}>
        {resumo ? (
          <div className="flex flex-col gap-4">{resumo}</div>
        ) : (
          <Summary
            c={c}
            issues={issues}
            goTo={(k) => {
              setSummaryOpen(false);
              goKey(k);
            }}
          />
        )}
      </Sheet>

      {/* Celular: todas as etapas e orçamentos, a partir da faixa da etapa */}
      <Sheet open={stepsOpen} onClose={() => setStepsOpen(false)} title="Etapas">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-2">
            {budgets.map((x) => (
              <BudgetPill key={x.label} {...x} />
            ))}
          </div>
          <ol className="flex flex-col gap-1">
            {STEPS.map((st, i) => {
              const on = i === step;
              const errs = errorsByStep[st.key] ?? 0;
              const n = stepCount(c, st.key);
              return (
                <li key={st.key}>
                  <button
                    type="button"
                    onClick={() => {
                      setStepsOpen(false);
                      go(i);
                    }}
                    aria-current={on ? "step" : undefined}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left font-bold ${on ? "bg-panel-2 text-paper" : "text-text"}`}
                  >
                    <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs ${on ? "bg-chakra text-paper-ink" : errs ? "bg-bad/20 text-bad" : i < step ? "bg-ok/20 text-ok" : "bg-line-2 text-muted"}`}>{errs ? "!" : i + 1}</span>
                    <span className="flex-1">{st.label}</span>
                    {errs > 0 && <span className="text-xs text-bad">{errs} fora da regra</span>}
                    {!errs && n > 0 && <span className="text-sm font-normal text-faint">{n}</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </Sheet>
    </div>
  );
}

/** Orçamento de cada etapa: índice em `budgets`. */
const STEP_BUDGET: Partial<Record<StepKey, number>> = { atributos: 0, pericias: 1, poderes: 2, aptidoes: 4 };

const budgetTone = (left: number) => (left < 0 ? "var(--color-bad)" : left === 0 ? "var(--color-ok)" : "var(--color-chakra)");

/** Quantos itens a ficha tem na etapa (aparece ao lado do nome da etapa). */
function stepCount(c: Character, key: StepKey) {
  if (key === "aptidoes") return c.aptidoes.length;
  if (key === "poderes") return c.poderes.length;
  return 0;
}

function BudgetPill({ label, short, used, total }: { label: string; short: string; used: number; total: number }) {
  const left = total - used;
  const tone = budgetTone(left);
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-xl bg-panel px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-[11px] text-muted" title={label}>
          <span className="lg:max-xl:hidden">{label}</span>
          <span className="hidden lg:max-xl:inline">{short}</span>
        </span>
        <span className="text-sm font-bold" style={{ color: tone }}>
          <AnimatedNumber value={left} />
          <span className="text-faint">/{total}</span>
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-line">
        <motion.div className="h-1 rounded-full" style={{ background: tone }} animate={{ width: `${Math.min(100, (used / Math.max(1, total)) * 100)}%` }} />
      </div>
    </div>
  );
}

/** Coluna das etapas: energias e observações sempre à vista; o resumo completo abre na gaveta. */
function RailResumo({ c, errors, warns, onOpen }: { c: Character; errors: number; warns: number; onOpen: () => void }) {
  const d = derived(c);
  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col rounded-xl bg-vit-bg px-3 py-2">
          <span className="text-[11px] text-vit-muted">Vitalidade</span>
          <AnimatedNumber value={d.vit} className="font-display text-2xl font-extrabold text-vit" />
        </div>
        <div className="flex flex-col rounded-xl bg-chk-bg px-3 py-2">
          <span className="text-[11px] text-chk-muted">Chakra</span>
          <AnimatedNumber value={d.chakra} className="font-display text-2xl font-extrabold text-chk" />
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-1 text-center">
        {[
          ["Inic.", d.ini],
          ["Esq.", d.reacaoEsquiva],
          ["Desl.", `${d.desloc}m`],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-col-reverse">
            <dt className="text-[11px] text-faint">{k}</dt>
            <dd className="font-bold text-paper">{v}</dd>
          </div>
        ))}
      </dl>
      <button type="button" onClick={onOpen} className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-left text-sm font-bold ${errors ? "bg-bad/12 text-bad" : warns ? "bg-chakra/10 text-chakra" : "bg-ok/10 text-ok"}`}>
        <span className={`size-2.5 shrink-0 rounded-full ${errors ? "bg-bad" : warns ? "bg-chakra" : "bg-ok"}`} />
        <span className="flex-1">{errors ? `${errors} fora da regra` : warns ? `${warns} em aberto` : "Dentro das regras"}</span>
        <span className="text-xs font-normal text-muted">Resumo</span>
      </button>
    </div>
  );
}

function Summary({ c, issues, goTo }: { c: Character; issues: ReturnType<typeof validate>; goTo: (k: string) => void }) {
  const d = derived(c);
  const b = budgetFor(c.nc, c.optionals);
  const errors = issues.filter((i) => i.sev === "erro");
  const warns = issues.filter((i) => i.sev === "aviso");
  const shown = [...errors, ...warns].slice(0, 8);
  return (
    <>
      <div className="card flex flex-col gap-4 p-5">
        <span className="label">Energias</span>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-0.5 rounded-xl bg-vit-bg p-3">
            <span className="text-xs text-vit-muted">Vitalidade</span>
            <AnimatedNumber value={d.vit} className="font-display text-4xl font-extrabold text-vit" />
            <span className="text-[11px] text-vit-muted/80">10 + 3×VIG + 5×NC</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-xl bg-chk-bg p-3">
            <span className="text-xs text-chk-muted">Chakra</span>
            <AnimatedNumber value={d.chakra} className="font-display text-4xl font-extrabold text-chk" />
            <span className="text-[11px] text-chk-muted/80">10 + 3×ESP</span>
          </div>
        </div>
        <dl className="flex flex-col text-sm">
          {[
            ["Iniciativa", d.ini],
            ["Reação de Esquiva", d.reacaoEsquiva],
            ["Deslocamento", `${d.desloc}m`],
            ["Limite de poder/perícia", b.cap],
            ["Atributo mín. / máx.", `${b.minAttr} / ${c.nc}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-line py-2 last:border-0">
              <dt className="text-muted">{k}</dt>
              <dd className="font-bold text-paper">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="card mt-4 flex flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between">
          <span className="label">Observações</span>
          <span className="text-xs text-faint">
            {errors.length} fora da regra · {warns.length} em aberto
          </span>
        </div>
        {shown.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-ok">
            <span className="size-2.5 rounded-full bg-ok" /> Tudo certo! Ficha dentro das regras.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {shown.map((i, n) => (
              <li key={n}>
                <button type="button" onClick={() => goTo(i.step)} className="flex w-full items-start gap-2.5 rounded-lg p-1.5 text-left text-sm leading-snug hover:bg-panel-2">
                  <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${i.sev === "erro" ? "bg-bad" : "bg-chakra"}`} />
                  <span>{i.text}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {c.nc > 20 && (
        <div className="mt-4 rounded-2xl bg-chakra p-4 text-paper-ink">
          <p className="font-display text-base font-extrabold">NC estendido da mesa</p>
          <p className="text-sm leading-snug">Acima do NC 20, cada nível soma +6 atributos, +4 perícias e +2 poderes, com +{POWER_BONUS} poderes extras nos NCs {POWER_BONUS_NCS.filter((x) => x > 20).join(", ")}. Poderes podem passar do nível 10 e ganham um efeito novo por nível.</p>
        </div>
      )}
    </>
  );
}

/** Se a ficha já chegou ao banco. */
function SaveStatus() {
  const pending = useChars((s) => s.pending);
  const saveError = useChars((s) => s.saveError);
  if (saveError) return <span className="text-bad">erro ao salvar, tentando de novo na próxima edição</span>;
  return <span>{pending > 0 ? "salvando…" : "salva na conta"}</span>;
}
