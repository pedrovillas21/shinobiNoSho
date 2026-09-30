import { APT_BY_ID } from "@/lib/data/aptidoes";
import { JUUINKA_SELOS, juuinkaChoiceLabel, niChoices } from "@/lib/data/juuinka";
import { ATTRS, COMBAT, JUTSUS_BASICOS, SKILLS } from "@/lib/data/base";
import { EFEITO_BY_ID, PODER_BY_ID } from "@/lib/data/poderes";
import { SENSOR_LIMITES } from "@/lib/estados";
import { CUSTOM_ORIGIN, budgetFor, combatTotal, derived, evolutionIndex, evolutionLevel, hasApt, isRepurchase, originName, powerLevel, rankLabel, skillTotal, socialTests, tecIndex, versatileName, versatilePicks } from "@/lib/rules";
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

export function FichaSheet({ c }: { c: Character }) {
  const b = budgetFor(c.nc, c.optionals);
  const d = derived(c);
  const origin = originName(c);
  const extras = c.extraOrigins.map((x) => originName(c, x)).filter(Boolean);
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
                    </span>
                  </div>
                  {p.id === "versatilidade" &&
                    (p.versatile ?? []).map((id, k) =>
                      id ? (
                        <p key={id} className="text-sm leading-snug">
                          <strong>{versatileName(id)}:</strong>{" "}
                          {versatilePicks(p, k)
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
                        Dano base {top + Math.ceil(c.attrs.ESP / 2)} · Dif {9 + top + Math.ceil(c.attrs.ESP / 2)} · Custo = nível usado
                      </p>
                      <ol className="text-sm leading-snug">
                        {p.effects.slice(0, p.level).map((e, n) => (
                          <li key={n}>
                            {e ? EFEITO_BY_ID[e]?.name : "—"}
                            {e && !evolutionIndex(p.effects, n) ? <span className="text-paper-muted"> (nv {EFEITO_BY_ID[e]?.level})</span> : null}
                            {e && evolutionIndex(p.effects, n) > 0 ? ` → evolução Nv ${evolutionLevel(e, evolutionIndex(p.effects, n)) ?? "?"}` : ""}
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
