import { APT_BY_ID } from "@/lib/data/aptidoes";
import { JUUINKA_SELOS, juuinkaChoiceLabel, niChoices } from "@/lib/data/juuinka";
import { ATTRS, COMBAT, JUTSUS_BASICOS, SKILLS } from "@/lib/data/base";
import { ATIRADOR, ataquesBasicos, critText, fichaCtx, letalText } from "@/lib/dano";
import { EFEITO_BY_ID, PODER_BY_ID } from "@/lib/data/poderes";
import { SENSOR_LIMITES } from "@/lib/estados";
import { contrato, especieDe, formaDe, hasInvocacoes, kuchiyoseLevel, ncMaxFor, qtyOptions, statsInvocacao, tecnicaAtiva } from "@/lib/kuchiyose";
import { CUSTOM_ORIGIN, budgetFor, mangekyou, combatTotal, derived, espParam, evolutionIndex, evolutionLevel, hasApt, isRepurchase, kekkeiGratis, nivelGratis, originName, powerLevel, rankLabel, skillTotal, socialTests, tecIndex, versatileName, versatilePicks, versatileTechs } from "@/lib/rules";
import type { Character } from "@/lib/types";

function H({ children }: { children: React.ReactNode }) {
  return <h3 className="border-b-2 border-paper-ink pb-1 font-display text-lg font-extrabold">{children}</h3>;
}

function Row({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2 border-b border-dotted border-[#b8a27f] py-1 text-sm">
      <span>{k}</span>
      <span className="font-bold tabular-nums">{v}</span>
    </div>
  );
}

/** Ataque desarmado, armas do equipamento e golpes de clã, com o dano base pelos números da ficha (sem estados). */
function Ataques({ c }: { c: Character }) {
  const x = fichaCtx(c);
  const rows = ataquesBasicos(c, x);
  return (
    <section className="flex flex-col gap-2">
      <H>Taijutsu e armas</H>
      <ul className="grid gap-x-6 md:grid-cols-2">
        {rows.map((a) => (
          <li key={a.key} className="print-avoid flex items-start justify-between gap-3 border-b border-dotted border-[#b8a27f] py-1.5">
            <div className="flex min-w-0 flex-col">
              <span className="text-sm">
                <strong>{a.name}</strong>
                {a.tag && <span className="text-paper-muted"> · {a.tag}</span>}
              </span>
              <span className="text-xs text-paper-muted">
                {a.test} {x.combat[a.test]} · {letalText(a.letal)} · {a.tipo} · {a.alcance} · crítico {critText(a.crit)}
                {a.cost > 0 && ` · ${a.cost} chakra`}
              </span>
              {a.note && <span className="text-xs leading-snug text-paper-muted">{a.note}</span>}
              {a.warn.map((w) => (
                <span key={w} className="text-xs font-bold text-seal-dark">
                  {w}
                </span>
              ))}
            </div>
            <div className="flex shrink-0 flex-col items-end">
              <span className="font-display text-2xl font-extrabold leading-none tabular-nums">{a.base}</span>
              <span className="max-w-40 text-right text-[10px] leading-tight text-paper-muted">{a.parts.join(" + ")}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-paper-muted">
        Dano base: ½ Força + dano de arma no corpo-a-corpo, ½ Destreza + dano de arma à distância (Livro Básico, pág. 257). Dano final = base × grau do 2d8. Estados (Hachimon, Baika, Selo…) entram na Mesa.
      </p>
    </section>
  );
}

/** Pergaminho de Contrato: o poder Kuchiyose e a ficha de cada criatura. */
function Contrato({ c }: { c: Character }) {
  const k = contrato(c);
  const e = especieDe(c);
  if (!hasInvocacoes(c) || (!e && k.criaturas.length === 0)) return null;
  const lvl = kuchiyoseLevel(c);
  const forma = formaDe(c);
  return (
    <section className="flex flex-col gap-3">
      <H>
        Pergaminho de Contrato{e ? `: ${e.name}` : ""} · Kuchiyose {lvl} ({forma === "hijutsu" ? "Hijutsu" : "comum"})
      </H>
      <p className="text-sm text-paper-muted">
        {qtyOptions(e)
          .map((q) => `${q === 1 ? "1 criatura" : `${q} criaturas`} até NC ${ncMaxFor(lvl, q, e)}`)
          .join(" · ")}{" "}
        · custo {2 * lvl} de chakra · {forma === "hijutsu" ? "1 + 1 uso (comum) por cena" : "1 uso por cena"}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {k.criaturas.map((inv) => {
          const s = statsInvocacao(c, inv);
          const power = inv.power ? `${e?.powers.find((p) => p.id === inv.power)?.name ?? inv.power} ${inv.powerLevel}` : "Nenhum";
          const tecs = (e?.techniques ?? []).filter((t) => !tecnicaAtiva(inv, t)).map((t) => t.name);
          return (
            <div key={inv.uid} className="print-avoid flex flex-col gap-2 rounded-xl border-[1.5px] border-paper-ink p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-xl font-extrabold">{inv.name.trim() || "Criatura sem nome"}</span>
                <span className="text-xs text-paper-muted">
                  NC {inv.nc} · {s.size.n}
                  {inv.qty > 1 ? ` · em grupo de ${inv.qty}` : ""}
                </span>
              </div>
              <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-paper-3 text-center">
                {ATTRS.map((a) => (
                  <div key={a.key} className={`py-1 ${e?.main.includes(a.key) ? "bg-paper-2" : ""}`}>
                    <div className={`text-[10px] font-bold ${e?.main.includes(a.key) ? "text-seal-dark" : "text-paper-muted"}`}>{a.key}</div>
                    <div className="font-display text-lg font-extrabold leading-tight">{inv.attrs[a.key]}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm">
                Vit <strong>{s.vit}</strong> · Chakra <strong>{s.chakra}</strong> · Dano CC <strong>{s.dano}</strong> · CC/CD/ESQ/LM{" "}
                <strong>
                  {s.combat.CC}/{s.combat.CD}/{s.combat.ESQ}/{s.combat.LM}
                </strong>{" "}
                · Desloc. <strong>{s.desloc}m</strong>
              </p>
              <dl className="grid grid-cols-[6rem_1fr] gap-x-2 gap-y-0.5 text-sm">
                <dt className="text-paper-muted">Perícias</dt>
                <dd>{s.skills.map((sk) => `${sk.name} ${sk.v}`).join(" · ") || "—"}</dd>
                <dt className="text-paper-muted">Poder</dt>
                <dd>{power}</dd>
                <dt className="text-paper-muted">Aptidões</dt>
                <dd>{inv.apts.length ? inv.apts.map((n, i) => (i < s.freeApts ? n : `${n} (paga)`)).join(", ") : "—"}</dd>
                <dt className="text-paper-muted">Técnicas</dt>
                <dd>{tecs.join(" · ") || "—"}</dd>
                <dt className="text-paper-muted">Ataques</dt>
                <dd>{e?.attacks ?? "—"}</dd>
              </dl>
              {inv.personality && <p className="text-xs text-paper-muted">{inv.personality}</p>}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-paper-muted">Fichas pelas regras do Kuchiyose (Livro Básico, pág. 224): Vitalidade já pela metade; tamanho pela Tabela de Tamanho (pág. 271).</p>
    </section>
  );
}

export function FichaSheet({ c }: { c: Character }) {
  const b = budgetFor(c.nc, c.optionals);
  const d = derived(c);
  const origin = originName(c);
  const extras = c.extraOrigins.map((x) => originName(c, x)).filter(Boolean);
  const ms = mangekyou(c);
  const danoExtra = c.optionals.danoExtraAuto && (combatTotal(c, "CC") >= 18 || combatTotal(c, "CD") >= 18) && !hasApt(c, "dano-extra");

  return (
    <article className="print-sheet flex flex-col gap-6 rounded-3xl bg-paper p-5 text-paper-ink shadow-2xl sm:p-8">
      <header className="flex items-start justify-between gap-4 border-b-4 border-double border-paper-ink pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-seal-dark">Naruto · Shinobi no Sho</span>
          <h2 className="break-words font-display text-3xl font-extrabold leading-none sm:text-5xl">{c.name || "Shinobi sem nome"}</h2>
          <p className="text-sm text-paper-muted">
            {[rankLabel(c.nc), origin ?? "Sem clã/hijutsu", ...extras, c.bijuu, c.village, c.alignment, c.age].filter(Boolean).join(" · ")}
          </p>
          {c.player && <p className="text-xs text-paper-muted">Jogador: {c.player}</p>}
        </div>
        <div className="grid size-20 shrink-0 place-items-center rounded-full bg-seal text-white sm:size-24">
          <div className="flex flex-col items-center leading-none">
            <span className="text-[10px] tracking-[0.2em]">NC</span>
            <span className="font-display text-4xl font-extrabold">{c.nc}</span>
          </div>
        </div>
      </header>

      {c.originId === CUSTOM_ORIGIN && c.customOrigin.desc && (
        <p className="whitespace-pre-line rounded-xl bg-paper-2 p-3 text-sm leading-relaxed">
          <strong className="font-display">{origin}:</strong> {c.customOrigin.desc}
        </p>
      )}

      <section className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {ATTRS.map((a) => (
          <div key={a.key} className="flex flex-col items-center rounded-xl border-[1.5px] border-paper-ink px-1 py-2">
            <span className="text-[11px] font-bold tracking-wider">{a.key}</span>
            <span className="font-display text-3xl font-extrabold leading-tight">{c.attrs[a.key]}</span>
            <span className="text-[10px] text-paper-muted">{a.name}</span>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="print-avoid flex flex-col gap-1 rounded-2xl bg-paper-2 p-4">
          <H>Combate</H>
          {COMBAT.map((k) => (
            <Row key={k.key} k={`${k.name}${k.key === "CC" && c.acuidade && hasApt(c, "acuidade") ? " (Acuidade)" : ""}`} v={combatTotal(c, k.key)} />
          ))}
          {danoExtra && <p className="pt-1 text-xs text-seal-dark">Dano Extra automático (regra opcional).</p>}
        </div>
        <div className="print-avoid flex flex-col gap-2 rounded-2xl bg-paper-2 p-4">
          <H>Energias</H>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-seal-dark p-3 text-white">
              <div className="text-xs">Vitalidade</div>
              <div className="font-display text-3xl font-extrabold">{d.vit}</div>
            </div>
            <div className="rounded-xl bg-[#1f4e73] p-3 text-white">
              <div className="text-xs">Chakra</div>
              <div className="font-display text-3xl font-extrabold">{d.chakra}</div>
            </div>
          </div>
          <Row k="Carisma" v={c.social.car} />
          <Row k="Manipulação" v={c.social.man} />
          {socialTests(c).map((t) => (
            <Row key={t.name} k={<span title={t.formula}>{t.name}</span>} v={t.v} />
          ))}
        </div>
        <div className="print-avoid flex flex-col gap-1 rounded-2xl bg-paper-2 p-4">
          <H>Estatísticas</H>
          <Row k="Iniciativa" v={d.ini} />
          <Row k="Reação de Esquiva" v={d.reacaoEsquiva} />
          <Row k="Deslocamento" v={`${d.desloc}m`} />
          {d.dureza > 0 && <Row k="Dureza de corpo" v={d.dureza} />}
          <Row k="Carga" v={`${d.carga} kg`} />
          <Row k="Limite de poder" v={b.cap} />
        </div>
      </section>

      <Ataques c={c} />

      <section className="grid gap-6 md:grid-cols-2">
        <div className="print-avoid flex flex-col gap-2">
          <H>Perícias</H>
          <div className="grid grid-cols-1 gap-x-6 min-[420px]:grid-cols-2">
            {SKILLS.map((s) => {
              const t = skillTotal(c, s.key);
              return <Row key={s.key} k={`${s.name}${s.trained ? " [x]" : ""}`} v={t ?? "—"} />;
            })}
            {c.customSkills.map((s) => (
              <Row key={s.uid} k={`${s.name || "Perícia"}${s.trained ? " [x]" : ""}`} v={s.trained && s.pts <= 0 ? "—" : Math.ceil(c.attrs[s.attr] / 2) + s.pts + (s.bonus || 0)} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="print-avoid flex flex-col gap-2">
            <H>Aptidões</H>
            {c.aptidoes.length === 0 ? (
              <p className="text-sm text-paper-muted">—</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {c.aptidoes.map((e) => {
                  const a = APT_BY_ID[e.id];
                  const name = a?.name ?? e.customName;
                  return (
                    <li key={e.uid} className="rounded-full border-[1.5px] border-paper-ink px-2.5 py-1 text-sm">
                      {name}
                      {e.detail ? `: ${e.detail}` : ""}
                      {e.level > 1 ? ` (nv ${e.level})` : ""}
                      {a?.grants && e.choices?.some(Boolean) ? `: ${e.choices.filter(Boolean).map((id) => APT_BY_ID[id]?.name ?? id).join(", ")}` : ""}
                      {e.id === "juuinka-ni" ? ` · ${niChoices(e.choices).map(juuinkaChoiceLabel).join(", ")}${e.variant ? ` · ${JUUINKA_SELOS.find((x) => x.k === e.variant)?.label}` : ""}` : ""}
                      {e.id === "talento-natural" && e.choices?.[1] ? `: ${EFEITO_BY_ID[e.choices[1]]?.name} (${e.choices[0] === "hibon" ? "Hibon Ninpou" : versatileName(e.choices[0])})` : ""}
                      {e.id === "sensor" && SENSOR_LIMITES[e.variant ?? ""] ? ` limitado (${SENSOR_LIMITES[e.variant!]})` : ""}
                      {e.id === "atirador" && ATIRADOR[e.variant ?? ""] ? `: ${ATIRADOR[e.variant!]}` : ""}
                      {e.id === "mangekyou" && ms ? `: ${ms.par ? [...ms.tecs, ms.susanoo].map((t) => (t.ok ? t.name : `${t.name} (a despertar)`)).join(", ") : "par de técnicas a escolher"}${ms.eterno ? "" : " · 10 pontos de visão"}` : ""}
                    </li>
                  );
                })}
              </ul>
            )}
            {c.aptidoes
              .filter((e) => !APT_BY_ID[e.id] && e.note?.trim())
              .map((e) => (
                <p key={e.uid} className="text-sm leading-snug">
                  <strong>{e.customName}:</strong> {e.note}
                </p>
              ))}
          </div>

          <div className="flex flex-col gap-2">
            <H>Poderes</H>
            {c.poderes.length === 0 && <p className="text-sm text-paper-muted">—</p>}
            {kekkeiGratis(c)
              .filter((g) => !c.poderes.some((p) => p.id === g.el))
              .map((g) => (
                <div key={g.el} className="print-avoid flex justify-between gap-2 rounded-xl bg-paper-2 p-3">
                  <span>
                    <span className="font-display font-extrabold">{PODER_BY_ID[g.el].name}</span>
                    <span className="block text-xs text-paper-muted">Grátis pelo {PODER_BY_ID[g.from].name.split(" (")[0]}: Canhão até o nível {g.lvl}.</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold">Nível 1</span>
                </div>
              ))}
            {c.poderes.map((p, i) => {
              const def = PODER_BY_ID[p.id];
              const title = p.customName && def ? `${def.name} — ${p.customName}` : def?.name ?? p.customName;
              const unlocked = def?.techniques?.filter((t) => t.level <= p.level) ?? [];
              const top = powerLevel(c, p.id);
              return (
                <div key={i} className="print-avoid flex flex-col gap-1 rounded-xl bg-paper-2 p-3">
                  <div className="flex justify-between gap-2">
                    <span className="font-display font-extrabold">{title}</span>
                    <span className="shrink-0 text-sm font-bold">
                      Nível {p.level}
                      {isRepurchase(c, i) ? " · nova compra" : ""}
                      {nivelGratis(c, i) ? ` · nível 1 grátis (${PODER_BY_ID[nivelGratis(c, i)!].name.split(" (")[0]})` : ""}
                    </span>
                  </div>
                  {p.id === "versatilidade" &&
                    (p.versatile ?? []).map((id, k) =>
                      id ? (
                        <p key={id} className="text-sm leading-snug">
                          <strong>{versatileName(id)}:</strong>{" "}
                          {c.optionals.fuuinjutsuLista && PODER_BY_ID[id]?.mode === "tecnicas"
                            ? versatileTechs(p, k, true)
                                .map((n) => PODER_BY_ID[id].techniques?.[n])
                                .map((t) => `Nv ${t?.level} ${t?.name}`)
                                .join(" · ")
                            : versatilePicks(p, k, c.optionals.pularEvolucoes)
                                .map((x) => {
                                  const t = PODER_BY_ID[id]?.techniques?.[tecIndex(x.eff)];
                                  const name = t ? t.name : x.eff ? EFEITO_BY_ID[x.eff]?.name : "—";
                                  const evo = x.ev && x.eff ? ` → evolução Nv ${evolutionLevel(x.eff, x.ev) ?? "?"}` : "";
                                  return `Nv ${x.level} ${name}${evo}${x.tech && !x.auto ? ` (${x.tech})` : ""}`;
                                })
                                .join(" · ")}
                        </p>
                      ) : null,
                    )}
                  {def?.mode === "efeitos" && p.id !== "versatilidade" && (
                    <>
                      <p className="text-xs text-paper-muted">
                        Dano base {top + Math.ceil(espParam(c).val / 2)} · Dif {9 + top + Math.ceil(espParam(c).val / 2)} · Custo = nível usado
                      </p>
                      <ol className="text-sm leading-snug">
                        {p.effects.slice(0, p.level).map((e, n) => (
                          <li key={n}>
                            {e ? EFEITO_BY_ID[e]?.name : "—"}
                            {e && !evolutionIndex(p.effects, n, c.optionals.pularEvolucoes) ? <span className="text-paper-muted"> (nv {EFEITO_BY_ID[e]?.level})</span> : null}
                            {e && evolutionIndex(p.effects, n, c.optionals.pularEvolucoes) > 0 ? ` → evolução Nv ${evolutionLevel(e, evolutionIndex(p.effects, n, c.optionals.pularEvolucoes)) ?? "?"}` : ""}
                            {p.techniques[n] ? ` (${p.techniques[n]})` : ""}
                          </li>
                        ))}
                      </ol>
                    </>
                  )}
                  {unlocked.length > 0 && <p className="text-sm leading-snug">{unlocked.map((t) => t.name).join(" · ")}</p>}
                  {p.note && <p className="whitespace-pre-line text-xs text-paper-muted">{p.note}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Contrato c={c} />

      <section className="grid gap-6 md:grid-cols-2">
        <div className="print-avoid flex flex-col gap-2">
          <H>Equipamento</H>
          {c.items.length === 0 ? (
            <p className="text-sm text-paper-muted">—</p>
          ) : (
            <p className="text-sm leading-relaxed">{c.items.map((i) => `${i.qty > 1 ? `${i.qty} ` : ""}${i.name}`).join(" · ")}</p>
          )}
        </div>
        <div className="print-avoid flex flex-col gap-2">
          <H>Jutsus básicos</H>
          <p className="text-sm leading-relaxed">{JUTSUS_BASICOS.map((j) => j.name).join(" · ")}</p>
        </div>
      </section>

      {(c.appearance || c.personality || c.goals || c.history) && (
        <section className="grid gap-6 md:grid-cols-2">
          {(
            [
              ["Aparência", c.appearance],
              ["Personalidade", c.personality],
              ["Objetivos", c.goals],
              ["História", c.history],
            ] as const
          )
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="print-avoid flex flex-col gap-1">
                <H>{k}</H>
                <p className="whitespace-pre-line text-sm leading-relaxed">{v}</p>
              </div>
            ))}
        </section>
      )}
    </article>
  );
}
