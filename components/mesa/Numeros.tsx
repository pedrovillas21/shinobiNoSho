import { ATTRS, COMBAT } from "@/lib/data/base";
import { sg } from "@/lib/play";
import { SectionTitle, type MesaProps } from "./shared";

const toneOf = (delta: number) => (delta > 0 ? "text-chakra" : delta < 0 ? "text-bad" : "text-paper");

export function Numeros({ v }: MesaProps) {
  const rows: { l: string; val: React.ReactNode; note?: string; delta: number }[] = [
    {
      l: "Iniciativa",
      val: sg(v.ini),
      note: v.acel >= 2 ? "super acelerado +4" : v.acel ? "acelerado +2" : v.iniPen ? "surdo −3" : undefined,
      delta: v.ini - v.baseIni,
    },
    { l: "Deslocamento", val: `${v.desloc}m`, note: v.lento ? "lento: metade" : v.acel ? "Agilidade dobrada" : undefined, delta: v.lento ? -1 : v.acel || v.add.desloc ? 1 : 0 },
    { l: "Reação de Esquiva", val: v.reacao, delta: v.reacao - v.baseReacao },
    { l: "Precisão de ataque", val: sg(v.precAtk), note: v.atk ? `condições ${sg(v.atk)}` : undefined, delta: v.precAtk },
    { l: "Precisão de defesa", val: sg(v.precDef), note: v.def ? `condições ${sg(v.def)}` : undefined, delta: v.precDef },
    { l: "Dano base extra", val: sg(v.dano), delta: v.dano },
    { l: "Dificuldade das técnicas", val: sg(v.dif), delta: v.dif },
    { l: "Dureza de corpo", val: v.dureza, delta: v.dureza },
  ];

  return (
    <section aria-labelledby="h-num" className="card flex flex-col gap-4 p-4 sm:p-5">
      <SectionTitle id="h-num" title="Números em jogo">
        Valores da ficha com estados e condições aplicados. Em laranja, o que está alterado agora.
      </SectionTitle>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {ATTRS.map((a) => {
          const delta = v.attrs[a.key] - v.baseAttrs[a.key];
          return (
            <div key={a.key} className={`flex flex-col items-center rounded-xl border bg-ink-2 px-1 py-2 ${delta ? "border-chakra" : "border-line"}`}>
              <span className="text-[11px] font-bold tracking-wider text-muted">{a.key}</span>
              <span className={`font-display text-3xl font-extrabold leading-tight ${toneOf(delta)}`}>{v.attrs[a.key]}</span>
              <span className="text-[11px] text-muted">{delta ? `base ${v.baseAttrs[a.key]} · ${sg(delta)}` : a.name}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {COMBAT.map((k) => {
          const delta = v.combat[k.key] - v.baseCombat[k.key];
          return (
            <div key={k.key} className={`flex items-center justify-between gap-2 rounded-xl border bg-ink-2 px-3 py-2.5 ${delta ? "border-chakra" : "border-line"}`}>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-bold">{k.name}</span>
                <span className="text-[11px] text-muted">{delta ? `base ${v.baseCombat[k.key]} · ${sg(delta)}` : k.short}</span>
              </div>
              <span className={`font-display text-3xl font-extrabold ${toneOf(delta)}`}>{v.combat[k.key]}</span>
            </div>
          );
        })}
      </div>

      <dl className="grid gap-x-6 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.l} className="flex items-baseline justify-between gap-3 border-b border-line py-2.5">
            <dt className="text-sm text-muted">
              {r.l} {r.note && <span className="text-xs text-[#ffd3a8]">{r.note}</span>}
            </dt>
            <dd className={`text-base font-bold tabular-nums ${toneOf(r.delta)}`}>{r.val}</dd>
          </div>
        ))}
      </dl>

      <details className="group rounded-xl bg-ink-2 px-3 py-2">
        <summary className="cursor-pointer select-none py-1.5 text-sm font-bold text-muted group-open:text-text">Perícias em jogo</summary>
        <div className="grid gap-x-6 pb-1 sm:grid-cols-2">
          {v.skills.map((s) => {
            const delta = (s.eff ?? 0) - (s.base ?? 0);
            return (
              <div key={s.key} className="flex justify-between gap-2 border-b border-line py-1.5 text-sm last:border-0">
                <span className="text-muted">{s.name}</span>
                <span className={`font-bold tabular-nums ${toneOf(s.eff === null ? 0 : delta)}`}>{s.eff ?? "—"}</span>
              </div>
            );
          })}
        </div>
      </details>
    </section>
  );
}
