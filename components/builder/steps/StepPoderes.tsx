"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { EFEITO_BY_ID, EXCLUSIVOS, KANJI_PODER, NINPOU_BASE, PODERES, PODER_BY_ID, VERSATEIS } from "@/lib/data/poderes";
import { allowedRestricted, budgetFor, espParam, evolutionIndex, evolutionLevel, firstEvolution, isRepurchase, nextEvolution, ownersText, powerLevel, reqsMet, spent, tecId, tecIndex, uid, versatileName, versatilePicks, versatileSlots } from "@/lib/rules";
import type { Efeito, Poder, PowerEntry } from "@/lib/types";
import { Badge, IconCheck, IconPlus, IconSearch, IconTrash, IconX, Stepper, StepHeader, Toggle } from "../../ui";
import { EffectPicker, type PickGroup, type PickOption, type PickTab } from "../EffectPicker";
import { norm, type StepProps } from "../shared";

export function StepPoderes({ c, set }: StepProps) {
  const b = budgetFor(c.nc, c.optionals);
  const s = spent(c);
  const left = b.power - s.power;
  const allowed = useMemo(() => allowedRestricted(c), [c]);
  const [custom, setCustom] = useState("");
  const [showOthers, setShowOthers] = useState(false);
  const [pq, setPq] = useState("");
  const [pf, setPf] = useState<PowerFilter>("todos");
  // Controle Perfeito: Inteligência no lugar do Espírito.
  const halfEsp = Math.ceil(espParam(c).val / 2);
  const pular = c.optionals.pularEvolucoes;

  const blocked = (p: Poder) => (p.restricted ? !allowed.powers.has(p.id) : c.originId === "samurai");
  const available = PODERES.filter((p) => showOthers || !blocked(p) || c.poderes.some((x) => x.id === p.id));
  // Busca no nome, na descrição e nos efeitos/técnicas do poder (ex.: "Meteoros" acha Katon e Raiton).
  const searched = available.map((p) => ({ p, hit: searchHit(p, pq) })).filter((x): x is { p: Poder; hit: string } => x.hit !== null);
  const shown = searched.filter((x) => POWER_FILTERS.find((f) => f.key === pf)!.match(x.p));
  const owned = new Set(c.poderes.map((p) => p.id));

  const add = (p: Poder) =>
    set((d) => void d.poderes.push({ id: p.id, level: 1, effects: [null], techniques: [""], ...(p.id === "versatilidade" ? { versatile: ["", ""], owner: [null] } : {}) }));

  const edit = (idx: number, fn: (p: PowerEntry) => void) => set((d) => fn(d.poderes[idx]));

  return (
    <div className="flex flex-col gap-8">
      <StepHeader kicker="Etapa 6" title="Poderes">
        Cada nível custa 1 ponto de poder e, pela regra, o nível máximo é {b.cap} (metade do NC). Poderes de efeitos ganham um efeito novo a cada nível, de nível igual ou menor, ou evoluem um efeito que já têm (ex.: Raio escolhido de novo com o poder no nível 5 vira Raio Nv 5). A ordem das escolhas não importa: qualquer efeito até o nível do poder pode ir em qualquer escolha. Dá para comprar o mesmo poder outra vez para ter mais efeitos: o nível 1 da nova compra é grátis e vale o nível mais alto. No NC estendido, poderes passam do nível 10. Nada é travado: o que sair da regra vira observação.
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
            const again = isRepurchase(c, idx);
            const nth = c.poderes.slice(0, idx + 1).filter((x) => x.id === p.id).length;
            const top = powerLevel(c, p.id);
            return (
              <motion.li layout key={`${p.id}-${idx}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="overflow-hidden rounded-2xl border border-line bg-panel">
                <div className="flex flex-col gap-3 bg-paper p-4 text-paper-ink sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-xl font-extrabold">{name}</span>
                      {def?.restricted && <span className="rounded-full bg-seal px-2 py-0.5 text-[11px] font-bold text-white">restrito</span>}
                      {def?.element && <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[11px] font-bold text-paper-muted">elemento</span>}
                      {def && blocked(def) && (
                        <span className="rounded-full bg-seal-dark px-2 py-0.5 text-[11px] font-bold text-white">
                          {def.restricted ? `restrito: ${ownersText("poderes", def.id)}` : "Samurai não compra poderes comuns"}
                        </span>
                      )}
                      {again && <span className="rounded-full bg-ok px-2 py-0.5 text-[11px] font-bold text-paper-ink">{nth}ª compra · nível 1 grátis</span>}
                      {p.level > b.cap && <span className="rounded-full bg-seal-dark px-2 py-0.5 text-[11px] font-bold text-white">acima do limite {b.cap}</span>}
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
                  {(p.id === "ninpou" || p.id === "hibon" || !def) && (
                    <label className="flex flex-col gap-1.5">
                      <span className="label">{def ? "Nome / estilo do poder" : "Nome do poder"}</span>
                      <input className="field" value={p.customName ?? ""} placeholder="Ex.: Ninpou: Hari Jizou" onChange={(e) => edit(idx, (x) => void (x.customName = e.target.value))} />
                    </label>
                  )}

                  {def?.mode === "efeitos" && top > p.level && (
                    <p className="text-xs text-muted">Os parâmetros usam o nível mais alto entre as compras de {name}: {top}.</p>
                  )}
                  {def?.mode === "efeitos" && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        ["Dano base", `${top} + ${halfEsp}`, top + halfEsp],
                        ["Dif. padrão", `9 + ${top} + ${halfEsp}`, 9 + top + halfEsp],
                        ["Custo máx.", "chakra = nível", `${top} PC`],
                      ].map(([k, f, v]) => (
                        <div key={k as string} className="rounded-xl bg-ink-2 px-2 py-2">
                          <div className="text-[11px] text-faint">{k}</div>
                          <div className="font-display text-xl font-extrabold text-paper">{v}</div>
                          <div className="text-[10px] text-faint">{f}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {p.id === "versatilidade" && (
                    <VersatileEditor
                      p={p}
                      slots={versatileSlots(c, idx)}
                      taken={c.poderes.flatMap((x, j) => (j !== idx && x.id === "versatilidade" ? (x.versatile ?? []) : []))}
                      lista={c.optionals.fuuinjutsuLista}
                      pular={pular}
                      edit={(fn) => edit(idx, fn)}
                    />
                  )}

                  {def?.mode === "efeitos" && p.id !== "versatilidade" && (
                    <ol className="flex flex-col gap-2">
                      {Array.from({ length: p.level }, (_, i) => {
                        const chosen = p.effects[i];
                        // A ordem das escolhas não importa: qualquer efeito do poder cabe em qualquer escolha.
                        const others = p.effects.slice(0, p.level).filter((x, j): x is string => j !== i && !!x);
                        // Efeitos novos: ainda não escolhidos nas outras escolhas desta compra.
                        const fresh = (def.effects ?? [])
                          .map((id) => EFEITO_BY_ID[id])
                          .filter((e) => e && !others.includes(e.id))
                          .sort((a, b) => a.level - b.level);
                        // Evoluções: efeitos já escolhidos em outra escolha que ainda têm evolução.
                        // Pular evoluções (regra opcional): vai direto à mais alta que o nível desta escolha permite.
                        const evoAt = (id: string) => {
                          const hyp = p.effects.slice();
                          hyp[i] = id;
                          return evolutionIndex(hyp, i, pular) || nextEvolution(id, others.filter((x) => x === id).length - 1, i + 1, pular);
                        };
                        const evos = [...new Set(others)]
                          .map((id) => ({ e: EFEITO_BY_ID[id], need: evolutionLevel(id, evoAt(id)) }))
                          .filter((o): o is { e: NonNullable<typeof o.e>; need: number } => !!o.e && o.need !== null);
                        const k = evolutionIndex(p.effects, i, pular);
                        const need = chosen && k ? evolutionLevel(chosen, k) : null;
                        const stale = !!chosen && !fresh.some((e) => e.id === chosen) && !evos.some((o) => o.e.id === chosen);
                        return (
                          <li key={i} className="grid items-center gap-2 sm:grid-cols-[3.5rem_1fr_1fr]">
                            <span className="text-sm font-bold text-chakra">{i + 1}º</span>
                            <EffectPicker
                              label={`${i + 1}º efeito`}
                              context={`${name.split(" (")[0]} nível ${top}`}
                              value={chosen ?? null}
                              {...effectChoices(p.id, top, fresh, evos, stale ? chosen : null, (id) => firstEvolution(id, i + 1, pular))}
                              onChange={(v) => edit(idx, (x) => void (x.effects[i] = v))}
                            />
                            <input
                              aria-label={`Nome da técnica do ${i + 1}º efeito`}
                              className="field py-2"
                              placeholder="Nome da técnica (opcional)"
                              value={p.techniques[i] ?? ""}
                              onChange={(e) => edit(idx, (x) => void (x.techniques[i] = e.target.value))}
                            />
                            {chosen && (
                              <span className="text-xs text-faint sm:col-start-2 sm:col-end-4">
                                {k ? (
                                  <>
                                    <span className="font-bold text-ok">
                                      Evolução {EFEITO_BY_ID[chosen]?.name} Nv {need ?? "?"}
                                    </span>{" "}
                                    · ganha o melhoramento dessa evolução descrito no livro.
                                  </>
                                ) : (
                                  <>
                                    {EFEITO_BY_ID[chosen]?.desc}
                                    {EFEITO_BY_ID[chosen]?.evolves && <span className="text-muted"> Evolui no Nv {EFEITO_BY_ID[chosen].evolves!.join(" e ")}.</span>}
                                  </>
                                )}
                              </span>
                            )}
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-2xl font-extrabold text-paper">Adicionar poder</h3>
          <div className="w-full sm:w-80">
            <Toggle checked={showOthers} onChange={setShowOthers} label="Mostrar restritos de outros clãs" />
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="flex h-12 flex-1 items-center gap-3 rounded-xl border border-line-2 bg-panel pr-1.5 pl-4 focus-within:border-chakra">
            <IconSearch className="size-5 shrink-0 text-muted" />
            <span className="sr-only">Buscar poder</span>
            <input value={pq} onChange={(e) => setPq(e.target.value)} placeholder="Buscar poder, elemento ou efeito (ex.: Meteoros, cura, sombra)" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-faint" />
            {pq && (
              <button type="button" onClick={() => setPq("")} aria-label="Limpar busca de poder" className="grid size-9 place-items-center rounded-lg bg-panel-2">
                <IconX className="size-4" />
              </button>
            )}
          </label>
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
            {POWER_FILTERS.map((f) => {
              const on = pf === f.key;
              return (
                <button key={f.key} type="button" aria-pressed={on} onClick={() => setPf(f.key)} className={`chip shrink-0 font-bold ${on ? "border-paper bg-paper text-paper-ink" : "text-text hover:border-muted"}`}>
                  {f.label}
                  <span className={`text-[11px] ${on ? "text-paper-muted" : "text-muted"}`}>{searched.filter((x) => f.match(x.p)).length}</span>
                </button>
              );
            })}
          </div>
        </div>
        <span className="text-sm text-muted">
          {shown.length} de {available.length} poderes
        </span>
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map(({ p, hit }) => {
            const has = owned.has(p.id);
            const again = has && p.mode === "efeitos";
            const met = reqsMet(c, p.req);
            return (
              <li key={p.id}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  disabled={has && !again}
                  onClick={() => add(p)}
                  className={`flex h-full w-full items-start gap-3 rounded-2xl border p-3 text-left transition disabled:opacity-50 ${p.restricted ? "border-seal/50 bg-seal/10" : "border-line bg-panel hover:border-line-2"}`}
                >
                  <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${has ? "bg-ok/20 text-ok" : "bg-seal text-white"}`}>{has && !again ? <IconCheck className="size-4" /> : <IconPlus className="size-4" />}</span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-1.5 font-bold text-paper">
                      {p.name} {p.restricted && <Badge tone="seal">restrito</Badge>}
                      <Badge>{p.element ? "elemento" : MODE_LABEL[p.mode]}</Badge>
                    </span>
                    <span className="text-xs leading-snug text-muted">{p.desc}</span>
                    {hit && <span className="text-xs font-bold text-chakra">Tem: {hit}</span>}
                    {again && p.id === "versatilidade" ? (
                      <span className="text-xs font-bold text-ok">
                        Cada tabela extra pede uma Aprendizagem Rápida: {c.poderes.filter((x) => x.id === "versatilidade").length} de {1 + c.aptidoes.filter((x) => x.id === "aprendizagem-rapida").length} tabela(s) liberada(s). Comprar a aptidão já cria a tabela.
                      </span>
                    ) : (
                      again && <span className="text-xs font-bold text-ok">Você já tem. Comprar de novo: nível 1 grátis, mais efeitos.</span>
                    )}
                    {p.reqText && <span className={`text-xs ${met ? "text-ok" : "text-bad"}`}>{met ? "✓" : "✗"} {p.reqText}</span>}
                    {blocked(p) && <span className="text-xs text-bad">{p.restricted ? `Restrito a: ${ownersText("poderes", p.id)}.` : "Samurais não compram poderes comuns."} Pode pegar, mas fica como observação.</span>}
                  </span>
                </motion.button>
              </li>
            );
          })}
        </ul>
        {shown.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line-2 p-6 text-center text-sm text-muted">
            {pq ? `Nenhum poder com “${pq}”.` : "Nenhum poder neste filtro."} Se for de outro livro, crie como poder personalizado abaixo.
          </p>
        )}
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
        {c.originId === "samurai" && <p className="text-sm text-muted">Pela regra, Samurais não compram poderes comuns (ficam como observação).</p>}
      </section>
    </div>
  );
}

/**
 * Versatilidade (Livro Básico, pág. 242–243): dois poderes versáteis (três na 4ª compra, regra da casa). O nível 1 dá o
 * efeito de nível 1 a todos; do 2º em diante, cada nível é de um deles, com no máximo 2 níveis seguidos no mesmo, e o
 * efeito tem nível igual ou menor.
 */
function VersatileEditor({ p, slots, taken, lista, pular, edit }: { p: PowerEntry; slots: number; taken: string[]; lista: boolean; pular: boolean; edit: (fn: (x: PowerEntry) => void) => void }) {
  const ks = Array.from({ length: slots }, (_, k) => k);
  const vv = ks.map((k) => p.versatile?.[k] ?? "");
  const fourth = slots === 3;
  const setV = (k: number, id: string) =>
    edit((x) => {
      const cur = ks.map((j) => x.versatile?.[j] ?? "");
      if (cur[k] === id) return;
      cur[k] = id;
      x.versatile = cur;
      // Trocar o poder apaga os efeitos escolhidos para ele.
      x.owner?.forEach((o, i) => o === k && (x.effects[i] = null));
    });
  // Cada nível do 2º em diante: o poder versátil e o efeito, escolhidos juntos ("k|efeito").
  const setLevel = (i: number, v: string | null) =>
    edit((x) => {
      const o = Array.from({ length: Math.max(x.level, i + 1) }, (_, j) => x.owner?.[j] ?? null);
      const cut = v ? v.indexOf("|") : -1;
      o[i] = v ? Number(v.slice(0, cut)) : null;
      x.owner = o;
      x.effects[i] = v ? v.slice(cut + 1) : null;
    });
  const firstOf = (id: string) => (PODER_BY_ID[id]?.mode === "tecnicas" ? PODER_BY_ID[id].techniques?.[0]?.name : "Canhão");

  return (
    <div className="flex flex-col gap-3">
      {fourth && (
        <p className="rounded-xl bg-chakra/10 px-3 py-2 text-xs leading-relaxed text-text">
          <strong>Regra da casa:</strong> a 4ª Versatilidade traz 3 poderes versáteis e pode repetir os de outras compras.
        </p>
      )}
      <div className={`grid gap-2 ${fourth ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {ks.map((k) => (
          <label key={k} className="flex flex-col gap-1.5">
            <span className="label">{k + 1}º poder versátil</span>
            <select className="field py-2" value={vv[k]} onChange={(e) => setV(k, e.target.value)}>
              <option value="">Escolher…</option>
              {VERSATEIS.map((id) => (
                <option key={id} value={id} disabled={vv.some((x, j) => j !== k && x === id)}>
                  {versatileName(id)}
                  {taken.includes(id) ? (fourth ? " (também em outra compra)" : " (já é versátil em outra compra)") : ""}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-muted">
        Cada poder versátil usa as regras do próprio poder (alcance, tamanho e bônus do elemento) com o nível da Versatilidade. Do 2º nível em diante, cada escolha é de um dos poderes: o seletor separa os efeitos por poder. Depois de 2
        níveis seguidos no mesmo, o próximo é de outro. O efeito precisa ser do nível escolhido ou menor.
      </p>
      <ol className="flex flex-col gap-2">
        <li className="grid items-center gap-2 sm:grid-cols-[3.5rem_1fr_1fr]">
          <span className="text-sm font-bold text-chakra">1º</span>
          <span className="text-sm text-text">
            {vv.some(Boolean)
              ? vv
                  .filter(Boolean)
                  .map((id) => `${firstOf(id)} (${versatileName(id)})`)
                  .join(" e ")
              : `Efeito de nível 1 dos ${fourth ? "três" : "dois"} poderes`}
          </span>
          <input aria-label="Nome da técnica do 1º nível" className="field py-2" placeholder="Nome da técnica (opcional)" value={p.techniques[0] ?? ""} onChange={(e) => edit((x) => void (x.techniques[0] = e.target.value))} />
        </li>
        {Array.from({ length: Math.max(0, p.level - 1) }, (_, j) => {
          const i = j + 1;
          const lvl = i + 1;
          const k = p.owner?.[i];
          const has = typeof k === "number" && k >= 0 && k < slots && !!vv[k] && !!p.effects[i];
          return (
            <li key={i} className="grid items-start gap-2 sm:grid-cols-[3.5rem_1fr_1fr]">
              <span className="pt-2.5 text-sm font-bold text-chakra">{lvl}º</span>
              {vv.some(Boolean) ? (
                <EffectPicker
                  label={`${lvl}º nível`}
                  context={`Versatilidade · nível ${lvl}`}
                  placeholder="Escolher poder e efeito…"
                  value={has ? `${k}|${p.effects[i]}` : null}
                  {...versatileChoices(p, vv, i, lista, pular)}
                  onChange={(v) => setLevel(i, v)}
                />
              ) : (
                <span className="pt-2.5 text-xs text-muted">Escolha os poderes versáteis acima.</span>
              )}
              <input aria-label={`Nome da técnica do nível ${lvl}`} className="field py-2" placeholder="Nome da técnica (opcional)" value={p.techniques[i] ?? ""} onChange={(e) => edit((x) => void (x.techniques[i] = e.target.value))} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------------- busca no catálogo ---------------- */

type PowerFilter = "todos" | "elemento" | "efeitos" | "tecnicas" | "livre" | "restritos";
const POWER_FILTERS: { key: PowerFilter; label: string; match: (p: Poder) => boolean }[] = [
  { key: "todos", label: "Todos", match: () => true },
  { key: "elemento", label: "Elementos", match: (p) => !!p.element },
  { key: "efeitos", label: "Efeitos", match: (p) => p.mode === "efeitos" && !p.element },
  { key: "tecnicas", label: "Técnicas", match: (p) => p.mode === "tecnicas" },
  { key: "livre", label: "Livres", match: (p) => p.mode === "livre" },
  { key: "restritos", label: "Restritos", match: (p) => !!p.restricted },
];
const MODE_LABEL: Record<Poder["mode"], string> = { efeitos: "efeitos", tecnicas: "técnicas", livre: "livre" };

/** null = não combina; "" = combina pelo nome ou descrição; senão, os efeitos/técnicas que combinam. */
function searchHit(p: Poder, q: string): string | null {
  const t = norm(q.trim());
  if (!t || norm(`${p.name} ${p.desc} ${p.reqText ?? ""}`).includes(t)) return "";
  const names = [...(p.effects ?? []).map((id) => EFEITO_BY_ID[id]?.name ?? ""), ...(p.techniques ?? []).map((x) => x.name)];
  const hits = names.filter((n) => n && norm(n).includes(t));
  return hits.length ? hits.slice(0, 3).join(", ") + (hits.length > 3 ? "…" : "") : null;
}

/* ---------------- opções do seletor de efeito ---------------- */

const shortName = (id: string) => (PODER_BY_ID[id]?.name ?? id).split(" (")[0];

/** Seletor de um poder de efeitos: exclusivos do elemento, evoluções, gerais e o que passa do nível do poder. */
/** Efeito novo no seletor. Pulando evoluções, ele já entra na evolução `ev` (ex.: Lâmina de Raios Nv 9). */
function freshLabel(e: Efeito, ev: number) {
  const need = ev ? evolutionLevel(e.id, ev) : null;
  if (!need) return { name: e.name, level: e.level, desc: e.desc };
  return { name: `${e.name} Nv ${need}`, level: e.level, desc: `Pular evoluções: já entra como ${e.name} Nv ${need}, com as evoluções anteriores. ${e.desc}` };
}

function effectChoices(powerId: string, top: number, fresh: Efeito[], evos: { e: Efeito; need: number }[], stale: string | null, firstEv: (id: string) => number = () => 0) {
  const short = shortName(powerId);
  const kanji = KANJI_PODER[powerId];
  const excl = (id: string) => EXCLUSIVOS.includes(id);
  const options: PickOption[] = [
    ...(stale ? [{ value: stale, name: EFEITO_BY_ID[stale]?.name ?? stale, level: EFEITO_BY_ID[stale]?.level ?? 0, desc: "Não cabe mais nesta escolha.", tone: "acima" as const, group: "fora" }] : []),
    ...[...fresh]
      .sort((a, b) => Number(excl(b.id)) - Number(excl(a.id)) || a.level - b.level)
      .map((e): PickOption => {
        const g = e.level > top ? "acima" : excl(e.id) ? "excl" : "geral";
        return { value: e.id, ...freshLabel(e, firstEv(e.id)), source: e.source, tone: g, group: g };
      }),
    ...evos.map((o): PickOption => {
      const g = o.need > top ? "acima" : "evo";
      return { value: o.e.id, name: `${o.e.name} → evolução`, level: o.need, desc: `Você já tem ${o.e.name}. Escolher de novo evolui para o Nv ${o.need}.`, source: o.e.source, tone: g, group: g };
    }),
  ];
  const groups: PickGroup[] = [
    { key: "fora", label: "Fora da regra", tone: "acima" },
    { key: "excl", label: `Do ${short}`, hint: "exclusivos", kanji, tone: "excl" },
    { key: "evo", label: "Evoluir efeito", hint: "o que você já tem", tone: "evo" },
    { key: "geral", label: "Efeitos gerais", hint: PODER_BY_ID[powerId]?.element ? "comuns a Ninpou e elementos" : undefined },
    { key: "acima", label: `Acima do nível ${top}`, hint: "pode escolher, mas vira observação", tone: "acima" },
  ];
  const all: PickTab[] = [
    { key: "excl", label: short, kanji, match: (o) => o.group === "excl" || (o.group === "acima" && excl(o.value)) },
    { key: "evo", label: "Evoluir", match: (o) => o.tone === "evo" },
    { key: "geral", label: "Gerais", match: (o) => o.group === "geral" },
  ];
  return { options, groups, tabs: all.filter((t) => options.some(t.match)) };
}

/**
 * Seletor de um nível da Versatilidade: um grupo por poder versátil (exclusivos, evoluções e gerais de cada um).
 * O valor é "k|efeito" (k = índice do poder versátil).
 */
function versatileChoices(p: PowerEntry, vv: string[], i: number, lista: boolean, pular: boolean) {
  const lvl = i + 1;
  const options: PickOption[] = [];
  const groups: PickGroup[] = [{ key: "fora", label: "Fora da regra", tone: "acima" }];
  const tabs: PickTab[] = [];
  vv.forEach((id, k) => {
    if (!id) return;
    const def = PODER_BY_ID[id];
    const kanji = KANJI_PODER[id];
    const group = `v${k}`;
    // O 3º nível seguido no mesmo poder não é permitido.
    const blocked = i - 2 >= 1 && p.owner?.[i - 1] === k && p.owner?.[i - 2] === k;
    groups.push({ key: group, label: versatileName(id), hint: blocked ? "3º nível seguido: escolha outro poder" : undefined, kanji, tone: "excl" });
    tabs.push({ key: group, label: shortName(id), kanji, match: (o) => o.group === group });
    const all = versatilePicks(p, k, pular);
    const picks = all.filter((x) => x.level !== lvl);
    const add = (eff: string, o: Omit<PickOption, "value" | "group" | "kanji" | "disabled">) => options.push({ ...o, value: `${k}|${eff}`, group, kanji, disabled: blocked });

    if (def?.mode === "tecnicas" && lista) {
      // Regra opcional da lista: o nível traz a técnica dele e as anteriores que faltaram.
      const prev = picks.filter((x) => x.level < lvl && x.eff).reduce((m, x) => Math.max(m, x.level), 0);
      const ts = def.techniques ?? [];
      const n = ts.reduce((best, t, j) => (t.level <= lvl && t.level > prev && (best < 0 || t.level >= ts[best].level) ? j : best), -1);
      if (n < 0) return;
      const junto = ts.filter((t, j) => j !== n && t.level > prev && t.level <= lvl).map((t) => t.name);
      add(tecId(n), { name: ts[n].name, level: ts[n].level, desc: junto.length ? `Lista (regra opcional): também traz ${junto.join(", ")}.` : undefined, tone: "tec" });
      return;
    }
    if (def?.mode === "tecnicas") {
      const used = picks.map((x) => x.eff);
      (def.techniques ?? []).forEach((t, n) => t.level <= lvl && !used.includes(tecId(n)) && add(tecId(n), { name: t.name, level: t.level, tone: "tec" }));
      return;
    }
    const others = picks.map((x) => x.eff);
    const before = picks.filter((x) => x.level < lvl).map((x) => x.eff).filter((x): x is string => !!x);
    const excl = (e: string) => EXCLUSIVOS.includes(e);
    (def?.effects ?? NINPOU_BASE)
      .map((e) => EFEITO_BY_ID[e])
      .filter((e) => e && e.level <= lvl && !others.includes(e.id))
      .sort((a, b) => Number(excl(b.id)) - Number(excl(a.id)) || a.level - b.level)
      .forEach((e) => add(e.id, { ...freshLabel(e, firstEvolution(e.id, lvl, pular)), source: e.source, tone: excl(e.id) ? "excl" : "geral" }));
    [...new Set(before)].forEach((e) => {
      const prevEv = all.filter((x) => x.level < lvl && x.eff === e).reduce((m, x) => Math.max(m, x.ev), 0);
      const need = evolutionLevel(e, nextEvolution(e, prevEv, lvl, pular));
      const ef = EFEITO_BY_ID[e];
      if (ef && need !== null && need <= lvl) add(e, { name: `${ef.name} → evolução`, level: need, desc: `Você já tem ${ef.name}. Escolher de novo evolui para o Nv ${need}.`, source: ef.source, tone: "evo" });
    });
  });
  // Escolha que não cabe mais (poder trocado, nível abaixo do efeito…): continua visível para ser trocada.
  const k = p.owner?.[i];
  const eff = p.effects[i];
  if (typeof k === "number" && vv[k] && eff && !options.some((o) => o.value === `${k}|${eff}`)) {
    const t = PODER_BY_ID[vv[k]]?.techniques?.[tecIndex(eff)];
    options.unshift({ value: `${k}|${eff}`, name: t?.name ?? EFEITO_BY_ID[eff]?.name ?? eff, level: t?.level ?? EFEITO_BY_ID[eff]?.level ?? 0, desc: `${versatileName(vv[k])} · não cabe mais neste nível.`, tone: "acima", group: "fora" });
  }
  tabs.push({ key: "evo", label: "Evoluir", match: (o) => o.tone === "evo" });
  return { options, groups, tabs: tabs.filter((t) => options.some(t.match)) };
}
