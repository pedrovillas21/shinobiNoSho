"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { EFEITO_BY_ID, PODERES, PODER_BY_ID } from "@/lib/data/poderes";
import { allowedRestricted, budgetFor, limitsFor, reqsMet, spent, uid } from "@/lib/rules";
import type { Poder, PowerEntry } from "@/lib/types";
import { Badge, IconCheck, IconPlus, IconTrash, Stepper, StepHeader } from "../../ui";
import type { StepProps } from "../shared";

export function StepPoderes({ c, set }: StepProps) {
  const b = budgetFor(c.nc, c.optionals);
  const s = spent(c);
  const lim = limitsFor(c);
  const left = b.power - s.power;
  const allowed = useMemo(() => allowedRestricted(c), [c]);
  const [custom, setCustom] = useState("");
  const halfEsp = Math.ceil(c.attrs.ESP / 2);

  const available = PODERES.filter((p) => !lim.enforce || (p.restricted ? allowed.powers.has(p.id) : c.originId !== "samurai"));
  const owned = new Set(c.poderes.map((p) => p.id));

  const add = (p: Poder) =>
    set((d) => void d.poderes.push({ id: p.id, level: 1, effects: [null], techniques: [""] }));

  const edit = (idx: number, fn: (p: PowerEntry) => void) => set((d) => fn(d.poderes[idx]));

  return (
    <div className="flex flex-col gap-8">
      <StepHeader kicker="Etapa 6" title="Poderes">
        Cada nível custa 1 ponto de poder e o nível máximo é {b.cap} (metade do NC). Poderes de efeitos ganham um efeito novo a cada nível, de nível igual ou menor. No NC estendido, poderes passam do nível 10.
      </StepHeader>
      <div className="flex flex-wrap gap-2">
        <span className={`rounded-xl px-3 py-2 text-sm font-bold ${left < 0 ? "bg-bad/15 text-bad" : left === 0 ? "bg-ok/15 text-ok" : "bg-chakra/15 text-chakra"}`}>
          {left >= 0 ? `${left} ponto(s) de poder restantes` : `${-left} ponto(s) a mais`}
        </span>
        <span className="rounded-xl bg-panel px-3 py-2 text-sm text-muted">
          {s.powerLevels} em poderes · {s.paidApts} em aptidões
        </span>
      </div>

      <motion.ul layout className="flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {c.poderes.map((p, idx) => {
            const def = PODER_BY_ID[p.id];
            const name = def?.name ?? p.customName ?? "Poder";
            const met = def ? reqsMet(c, def.req) : true;
            return (
              <motion.li layout key={`${p.id}-${idx}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="overflow-hidden rounded-2xl border border-line bg-panel">
                <div className="flex flex-col gap-3 bg-paper p-4 text-paper-ink sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-xl font-extrabold">{name}</span>
                      {def?.restricted && <span className="rounded-full bg-seal px-2 py-0.5 text-[11px] font-bold text-white">restrito</span>}
                      {def?.element && <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[11px] font-bold text-paper-muted">elemento</span>}
                    </div>
                    {def?.reqText && <span className={`text-xs ${met ? "text-paper-muted" : "font-bold text-seal-dark"}`}>Pré-requisito: {def.reqText}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] text-paper-muted">nível</span>
                      <Stepper
                        tone="paper"
                        size="sm"
                        label={`nível de ${name}`}
                        value={p.level}
                        min={1}
                        max={lim.cap}
                        canInc={!lim.enforce || left > 0}
                        onChange={(n) =>
                          edit(idx, (x) => {
                            x.level = n;
                            while (x.effects.length < n) x.effects.push(null);
                            while (x.techniques.length < n) x.techniques.push("");
                          })
                        }
                      />
                    </div>
                    <button type="button" onClick={() => set((d) => void d.poderes.splice(idx, 1))} className="grid size-10 place-items-center rounded-xl border border-[#cdbb9c] text-paper-ink" aria-label={`Remover ${name}`}>
                      <IconTrash className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4 p-4">
                  {(p.id === "ninpou" || p.id === "hibon" || p.id === "versatilidade" || !def) && (
                    <label className="flex flex-col gap-1.5">
                      <span className="label">{def ? "Nome / estilo do poder" : "Nome do poder"}</span>
                      <input className="field" value={p.customName ?? ""} placeholder={p.id === "versatilidade" ? "Ex.: Katon Versátil + Suiton Versátil" : "Ex.: Ninpou: Hari Jizou"} onChange={(e) => edit(idx, (x) => void (x.customName = e.target.value))} />
                    </label>
                  )}

                  {def?.mode === "efeitos" && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        ["Dano base", `${p.level} + ${halfEsp}`, p.level + halfEsp],
                        ["Dif. padrão", `9 + ${p.level} + ${halfEsp}`, 9 + p.level + halfEsp],
                        ["Custo máx.", "chakra = nível", `${p.level} PC`],
                      ].map(([k, f, v]) => (
                        <div key={k as string} className="rounded-xl bg-ink-2 px-2 py-2">
                          <div className="text-[11px] text-faint">{k}</div>
                          <div className="font-display text-xl font-extrabold text-paper">{v}</div>
                          <div className="text-[10px] text-faint">{f}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {def?.mode === "efeitos" && (
                    <ol className="flex flex-col gap-2">
                      {Array.from({ length: p.level }, (_, i) => {
                        const chosen = p.effects[i];
                        const opts = (def.effects ?? []).map((id) => EFEITO_BY_ID[id]).filter((e) => e && e.level <= i + 1 && (e.id === chosen || !p.effects.includes(e.id)));
                        return (
                          <li key={i} className="grid items-center gap-2 sm:grid-cols-[3.5rem_1fr_1fr]">
                            <span className="text-sm font-bold text-chakra">Nv {i + 1}</span>
                            <select
                              aria-label={`Efeito do nível ${i + 1}`}
                              className="field py-2"
                              value={chosen ?? ""}
                              onChange={(e) => edit(idx, (x) => void (x.effects[i] = e.target.value || null))}
                            >
                              <option value="">Escolher efeito…</option>
                              {opts.map((e) => (
                                <option key={e.id} value={e.id}>
                                  {e.name} (nv {e.level})
                                </option>
                              ))}
                            </select>
                            <input
                              aria-label={`Nome da técnica do nível ${i + 1}`}
                              className="field py-2"
                              placeholder="Nome da técnica (opcional)"
                              value={p.techniques[i] ?? ""}
                              onChange={(e) => edit(idx, (x) => void (x.techniques[i] = e.target.value))}
                            />
                            {chosen && <span className="text-xs text-faint sm:col-start-2 sm:col-end-4">{EFEITO_BY_ID[chosen]?.desc}</span>}
                          </li>
                        );
                      })}
                    </ol>
                  )}

                  {def?.mode === "tecnicas" && (
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {def.techniques!.map((t) => {
                        const on = t.level <= p.level;
                        return (
                          <li key={t.name} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${on ? "bg-ok/10 text-text" : "bg-ink-2 text-faint"}`}>
                            <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${on ? "bg-ok text-paper-ink" : "bg-line-2"}`}>{on ? <IconCheck className="size-3.5" /> : t.level}</span>
                            <span>
                              <span className="text-xs text-faint">Nv {t.level} · </span>
                              {t.name}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <label className="flex flex-col gap-1.5">
                    <span className="label">Anotações</span>
                    <textarea rows={2} className="field resize-y" value={p.note ?? ""} placeholder={def?.mode === "livre" ? "Técnicas, invocações, benefícios por nível…" : "Detalhes, visual, combinações…"} onChange={(e) => edit(idx, (x) => void (x.note = e.target.value))} />
                  </label>
                  {def && <p className="text-xs leading-relaxed text-faint">{def.desc}</p>}
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-2xl font-extrabold text-paper">Adicionar poder</h3>
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {available.map((p) => {
            const has = owned.has(p.id);
            const met = reqsMet(c, p.req);
            return (
              <li key={p.id}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  disabled={has}
                  onClick={() => add(p)}
                  className={`flex h-full w-full items-start gap-3 rounded-2xl border p-3 text-left transition disabled:opacity-50 ${p.restricted ? "border-seal/50 bg-seal/10" : "border-line bg-panel hover:border-line-2"}`}
                >
                  <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${has ? "bg-ok/20 text-ok" : "bg-seal text-white"}`}>{has ? <IconCheck className="size-4" /> : <IconPlus className="size-4" />}</span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-1.5 font-bold text-paper">
                      {p.name} {p.restricted && <Badge tone="seal">restrito</Badge>}
                    </span>
                    <span className="text-xs leading-snug text-muted">{p.desc}</span>
                    {p.reqText && <span className={`text-xs ${met ? "text-ok" : "text-bad"}`}>{met ? "✓" : "✗"} {p.reqText}</span>}
                  </span>
                </motion.button>
              </li>
            );
          })}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!custom.trim()) return;
            set((d) => void d.poderes.push({ id: `custom:${uid()}`, customName: custom.trim(), level: 1, effects: [null], techniques: [""] }));
            setCustom("");
          }}
        >
          <input className="field" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Poder personalizado ou de outro livro" aria-label="Nome do poder personalizado" />
          <button type="submit" className="btn-ghost shrink-0" disabled={!custom.trim()}>
            <IconPlus className="size-4" /> Adicionar
          </button>
        </form>
        {c.originId === "samurai" && <p className="text-sm text-muted">Samurais não podem comprar poderes comuns.</p>}
      </section>
    </div>
  );
}
