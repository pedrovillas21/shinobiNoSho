"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NC_MAX, NC_MIN, POWER_BONUS, POWER_BONUS_NCS, budgetFor, derived, rankLabel, spent, validate } from "@/lib/rules";
import { downloadJSON, useChars, useHydrated } from "@/lib/store";
import type { Character } from "@/lib/types";
import { AnimatedNumber, IconAlert, IconDownload, IconLeft, IconList, IconRight, Logo, Sheet } from "../ui";
import { STEPS, type StepKey } from "./shared";
import { StepAptidoes } from "./steps/StepAptidoes";
import { StepAtributos } from "./steps/StepAtributos";
import { StepCla } from "./steps/StepCla";
import { StepConceito } from "./steps/StepConceito";
import { StepEquipamento } from "./steps/StepEquipamento";
import { StepFicha } from "./steps/StepFicha";
import { StepHistoria } from "./steps/StepHistoria";
import { StepPericias } from "./steps/StepPericias";
import { StepPoderes } from "./steps/StepPoderes";

export function Builder({ id }: { id: string }) {
  const hydrated = useHydrated();
  const c = useChars((s) => s.chars[id]);
  const update = useChars((s) => s.update);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const set = useCallback((fn: (d: Character) => void) => update(id, fn), [id, update]);

  const go = useCallback((i: number) => {
    setStep((cur) => {
      setDir(i >= cur ? 1 : -1);
      return Math.max(0, Math.min(STEPS.length - 1, i));
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!c) return;
    document.title = `${c.name || "Nova ficha"} · Shinobi no Sho`;
  }, [c?.name, c]);

  if (!hydrated) return <div className="grid min-h-dvh place-items-center text-muted">Abrindo pergaminho…</div>;
  if (!c)
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <p className="font-display text-2xl font-extrabold text-paper">Ficha não encontrada neste navegador.</p>
          <Link href="/" className="btn-primary">
            Voltar ao início
          </Link>
        </div>
      </div>
    );

  return <BuilderView c={c} set={set} step={step} dir={dir} go={go} summaryOpen={summaryOpen} setSummaryOpen={setSummaryOpen} />;
}

function BuilderView({
  c,
  set,
  step,
  dir,
  go,
  summaryOpen,
  setSummaryOpen,
}: {
  c: Character;
  set: (fn: (d: Character) => void) => void;
  step: number;
  dir: number;
  go: (i: number) => void;
  summaryOpen: boolean;
  setSummaryOpen: (v: boolean) => void;
}) {
  const b = budgetFor(c.nc, c.optionals);
  const s = spent(c);
  const issues = useMemo(() => validate(c), [c]);
  const errorsByStep = useMemo(() => {
    const m: Record<string, number> = {};
    issues.filter((i) => i.sev === "erro").forEach((i) => (m[i.step] = (m[i.step] ?? 0) + 1));
    return m;
  }, [issues]);
  const key = STEPS[step].key as StepKey;

  const budgets = [
    { label: "Atributos", used: s.attr, total: b.attr },
    { label: "Perícias", used: s.skill, total: b.skill },
    { label: "Poderes", used: s.power, total: b.power },
    { label: "Sociais", used: s.social, total: b.social },
    { label: "Aptidões grátis", used: s.freeUsed, total: 3 },
  ];

  const setNc = (v: number) => set((d) => void (d.nc = Math.max(NC_MIN, Math.min(NC_MAX, v))));

  return (
    <div className="min-h-dvh pb-28 lg:pb-12">
      {/* Cabeçalho */}
      <header className="no-print sticky top-0 z-30 border-b border-line bg-ink/92 backdrop-blur supports-[backdrop-filter]:bg-ink/80">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-8">
          <Link href="/" className="btn-ghost size-11 shrink-0 px-0" aria-label="Voltar às fichas">
            <IconLeft />
          </Link>
          <Logo className="hidden size-8 sm:block" />
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate font-display text-lg font-extrabold text-paper sm:text-xl">{c.name || "Novo shinobi"}</span>
            <span className="truncate text-xs text-muted">{rankLabel(c.nc)}</span>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-line-2 bg-ink-2 p-1">
            <button type="button" className="grid size-9 place-items-center rounded-lg text-lg font-bold hover:bg-panel-2 disabled:opacity-30" onClick={() => setNc(c.nc - 1)} disabled={c.nc <= NC_MIN} aria-label="Diminuir NC">
              −
            </button>
            <span className="min-w-14 text-center text-sm font-bold">
              NC <AnimatedNumber value={c.nc} />
            </span>
            <button type="button" className="grid size-9 place-items-center rounded-lg text-lg font-bold hover:bg-panel-2 disabled:opacity-30" onClick={() => setNc(c.nc + 1)} disabled={c.nc >= NC_MAX} aria-label="Aumentar NC">
              +
            </button>
          </div>
          <button type="button" className="btn-ghost hidden md:inline-flex" onClick={() => downloadJSON(c)}>
            <IconDownload className="size-4" /> Exportar
          </button>
          <button type="button" className="btn-ghost hidden sm:inline-flex" onClick={() => go(STEPS.length - 1)}>
            Ver ficha
          </button>
          <Link href={`/ficha/${c.id}/mesa`} className="btn-primary">
            Mesa <IconRight className="size-4" />
          </Link>
        </div>

        {/* Orçamento */}
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 pb-3 scrollbar-none sm:px-8">
          <div className="flex min-w-max gap-2 lg:grid lg:min-w-0 lg:grid-cols-5">
            {budgets.map((x) => {
              const left = x.total - x.used;
              const tone = left < 0 ? "var(--color-bad)" : left === 0 ? "var(--color-ok)" : "var(--color-chakra)";
              return (
                <div key={x.label} className="flex min-w-32 flex-col gap-1.5 rounded-xl bg-panel px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] text-muted">{x.label}</span>
                    <span className="text-sm font-bold" style={{ color: tone }}>
                      <AnimatedNumber value={left} />
                      <span className="text-faint">/{x.total}</span>
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-line">
                    <motion.div className="h-1 rounded-full" style={{ background: tone }} animate={{ width: `${Math.min(100, (x.used / Math.max(1, x.total)) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Etapas */}
        <nav aria-label="Etapas" className="mx-auto max-w-7xl overflow-x-auto px-2 scrollbar-none sm:px-6">
          <ol className="flex min-w-max">
            {STEPS.map((st, i) => {
              const on = i === step;
              const errs = errorsByStep[st.key] ?? 0;
              return (
                <li key={st.key}>
                  <button type="button" onClick={() => go(i)} aria-current={on ? "step" : undefined} className={`relative flex h-12 items-center gap-2 px-3 text-sm font-bold transition ${on ? "text-paper" : "text-faint hover:text-muted"}`}>
                    <span className={`grid size-6 place-items-center rounded-full text-xs ${on ? "bg-chakra text-paper-ink" : errs ? "bg-bad/20 text-bad" : i < step ? "bg-ok/20 text-ok" : "bg-line-2 text-muted"}`}>{errs ? "!" : i + 1}</span>
                    {st.label}
                    {on && <motion.span layoutId="step-underline" className="absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-chakra" />}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 pt-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
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
              {key === "equipamento" && <StepEquipamento c={c} set={set} />}
              {key === "historia" && <StepHistoria c={c} set={set} />}
              {key === "ficha" && <StepFicha c={c} set={set} issues={issues} goTo={(k) => go(STEPS.findIndex((x) => x.key === k))} />}
            </motion.div>
          </AnimatePresence>

          <div className="no-print mt-10 hidden items-center justify-between lg:flex">
            <button type="button" className="btn-ghost" onClick={() => go(step - 1)} disabled={step === 0}>
              <IconLeft className="size-4" /> {step > 0 ? STEPS[step - 1].label : "Anterior"}
            </button>
            <button type="button" className="btn-primary" onClick={() => go(step + 1)} disabled={step === STEPS.length - 1}>
              {step < STEPS.length - 1 ? STEPS[step + 1].label : "Fim"} <IconRight className="size-4" />
            </button>
          </div>
        </main>

        <aside className="no-print hidden lg:block">
          <div className="sticky top-[200px] flex flex-col gap-4">
            <Summary c={c} issues={issues} goTo={(k) => go(STEPS.findIndex((x) => x.key === k))} />
          </div>
        </aside>
      </div>

      {/* Barra inferior (celular) */}
      <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink-2/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <button type="button" className="btn-ghost size-12 px-0" onClick={() => go(step - 1)} disabled={step === 0} aria-label="Etapa anterior">
            <IconLeft />
          </button>
          <button type="button" className="btn-ghost h-12 flex-1" onClick={() => setSummaryOpen(true)}>
            <IconList className="size-4" /> Resumo
            {issues.some((i) => i.sev === "erro") && <IconAlert className="size-4 text-bad" />}
          </button>
          <button type="button" className="btn-primary h-12 flex-1" onClick={() => go(step + 1)} disabled={step === STEPS.length - 1}>
            {step < STEPS.length - 1 ? STEPS[step + 1].label : "Fim"} <IconRight className="size-4" />
          </button>
        </div>
      </div>

      <Sheet open={summaryOpen} onClose={() => setSummaryOpen(false)} title="Resumo da ficha">
        <Summary
          c={c}
          issues={issues}
          goTo={(k) => {
            setSummaryOpen(false);
            go(STEPS.findIndex((x) => x.key === k));
          }}
        />
      </Sheet>
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

      <div className="card flex flex-col gap-3 p-5">
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
        <div className="rounded-2xl bg-chakra p-4 text-paper-ink">
          <p className="font-display text-base font-extrabold">NC estendido da mesa</p>
          <p className="text-sm leading-snug">Acima do NC 20, cada nível soma +6 atributos, +4 perícias e +2 poderes, com +{POWER_BONUS} poderes extras nos NCs {POWER_BONUS_NCS.filter((x) => x > 20).join(", ")}. Poderes podem passar do nível 10 e ganham um efeito novo por nível.</p>
        </div>
      )}
    </>
  );
}
