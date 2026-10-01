"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { ataquesBasicos, fichaCtx } from "@/lib/dano";
import { ARMAS, ARMA_BY_ID, ARMA_CAT_LABEL, armaDoItem, type Arma } from "@/lib/data/armas";
import { ITEM_PRESETS, VILLAGE_ITEMS_NOTE } from "@/lib/data/base";
import { budgetFor, compLimit, hasApt, spent, uid } from "@/lib/rules";
import type { ItemEntry } from "@/lib/types";
import { IconPlus, IconTrash, NumberField, StepHeader } from "../../ui";
import { stepKicker, type StepProps } from "../shared";

const danoTxt = (a: Arma) => (a.cat === "explosivo" ? `dano base ${a.dano}` : `+${a.dano}${a.par ? ` (par +${a.par})` : ""}`);

/** Compartimentos de uma arma que ocupa espaço inteiro ("1 por 2 comp." = 2); as que vêm em lote ficam com 0. */
const armaComps = (a: Arma) => {
  const m = /^1 (?:par )?por (\d+ )?comp/.exec(a.perComp);
  return m ? Number(m[1] ?? 1) : 0;
};

/** Seções do seletor de armas, na ordem da Tabela de Armas. */
const GRUPOS_ARMAS: [string, Arma[]][] = (["simples", "marcial", "especial"] as const).flatMap((g) =>
  (Object.keys(ARMA_CAT_LABEL) as Arma["cat"][])
    .map((cat): [string, Arma[]] => [`${g === "simples" ? "Simples" : g === "marcial" ? "Marciais" : "Especiais"} · ${ARMA_CAT_LABEL[cat]}`, ARMAS.filter((a) => a.grupo === g && a.cat === cat && a.cat !== "desarmado")])
    .filter(([, l]) => l.length > 0),
);

export function StepEquipamento({ c, set }: StepProps) {
  const b = budgetFor(c.nc, c.optionals);
  const s = spent(c);
  const total = b.ryos + (c.extraRyos || 0);
  const left = total - s.ryos;
  const limit = compLimit(c);
  const [name, setName] = useState("");
  // Dano base de cada arma com os números da ficha (o mesmo da ficha impressa).
  const danos = useMemo(() => new Map(ataquesBasicos(c, fichaCtx(c)).map((r) => [r.key, r])), [c]);

  const addItem = (item: Partial<ItemEntry> & { name: string }) =>
    set((d) => void d.items.push({ uid: uid(), qty: 1, price: 0, comps: 0, ...item }));
  const edit = (u: string, fn: (i: ItemEntry) => void) => set((d) => fn(d.items.find((x) => x.uid === u)!));

  return (
    <div className="flex flex-col gap-8">
      <StepHeader kicker={stepKicker(c, "equipamento")} title="Equipamento">
        {b.rank} começa com {b.ryos.toLocaleString("pt-BR")} ryos. {VILLAGE_ITEMS_NOTE}
      </StepHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card flex flex-col gap-1 p-4">
          <span className="text-xs text-muted">Ryos disponíveis</span>
          <span className={`font-display text-3xl font-extrabold ${left < 0 ? "text-bad" : "text-paper"}`}>{left.toLocaleString("pt-BR")}</span>
          <span className="text-xs text-faint">de {total.toLocaleString("pt-BR")}</span>
        </div>
        <div className="card flex flex-col gap-1 p-4">
          <span className="text-xs text-muted">Compartimentos usados</span>
          <span className={`font-display text-3xl font-extrabold ${s.comps > limit ? "text-chakra" : "text-paper"}`}>
            {s.comps} / {limit}
          </span>
          <span className="text-xs text-faint">
            cada um acima: −3m de deslocamento e −1 de precisão{hasApt(c, "burro-carga") ? " · Burro de Carga: 4, 5 com Força 8, 6 com Força 12" : ""}
          </span>
        </div>
        <NumberField label="Ryos extras (missões, mestre)" value={c.extraRyos} onChange={(n) => set((d) => void (d.extraRyos = n))} className="card p-4" />
      </div>

      <section className="flex flex-col gap-3">
        <span className="label">Adicionar rápido</span>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
          {ITEM_PRESETS.map((p) => (
            <motion.button whileTap={{ scale: 0.94 }} key={p.name} type="button" onClick={() => addItem({ name: p.name, price: p.price, note: p.perComp })} className="chip shrink-0 text-text hover:border-muted">
              <IconPlus className="size-3.5" /> {p.name} <span className="text-faint">{p.price}R</span>
            </motion.button>
          ))}
        </div>
        <select
          className="field"
          value=""
          aria-label="Adicionar arma da Tabela de Armas"
          onChange={(e) => {
            const a = ARMA_BY_ID[e.target.value];
            if (a) addItem({ name: a.name, price: a.price, comps: armaComps(a), arma: a.id, note: `${ARMA_CAT_LABEL[a.cat]} ${a.grupo} · ${danoTxt(a)} · ${a.perComp}` });
          }}
        >
          <option value="">Adicionar arma da tabela…</option>
          {GRUPOS_ARMAS.map(([label, list]) => (
            <optgroup key={label} label={label}>
              {list.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {danoTxt(a)} · {a.price}R
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            addItem({ name: name.trim() });
            setName("");
          }}
        >
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Outro item (arma, armadura, pergaminho…)" aria-label="Nome do item" />
          <button type="submit" className="btn-ghost shrink-0" disabled={!name.trim()}>
            <IconPlus className="size-4" /> Adicionar
          </button>
        </form>
      </section>

      <motion.ul layout className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {c.items.map((i) => (
            <motion.li layout key={i.uid} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 16 }} className="card grid grid-cols-2 items-end gap-2 p-3 sm:grid-cols-[1fr_5rem_6rem_5rem_2.75rem]">
              <label className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                <span className="text-xs text-faint">Item</span>
                <input className="field py-2" value={i.name} onChange={(e) => edit(i.uid, (x) => void (x.name = e.target.value))} />
                {i.note && <span className="text-[11px] text-faint">{i.note}</span>}
                <DanoArma item={i} danos={danos} />
              </label>
              <NumberField label="Qtd." value={i.qty} onChange={(n) => edit(i.uid, (x) => void (x.qty = Math.max(0, n)))} />
              <NumberField label="Preço (un.)" value={i.price} onChange={(n) => edit(i.uid, (x) => void (x.price = Math.max(0, n)))} />
              <NumberField label="Comp." value={i.comps} onChange={(n) => edit(i.uid, (x) => void (x.comps = Math.max(0, n)))} />
              <button type="button" onClick={() => set((d) => void (d.items = d.items.filter((x) => x.uid !== i.uid)))} className="btn-ghost size-11 px-0" aria-label={`Remover ${i.name}`}>
                <IconTrash className="size-4" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      {c.items.length === 0 && <p className="card px-4 py-6 text-center text-sm text-muted">Mochila vazia.</p>}
    </div>
  );
}

/** Dano base da arma do item, como sai na ficha, e o que falta para usá-la. */
function DanoArma({ item, danos }: { item: ItemEntry; danos: Map<string, ReturnType<typeof ataquesBasicos>[number]> }) {
  const a = armaDoItem(item);
  if (!a) return null;
  const r = danos.get(`arma:${a.id}`);
  if (!r) return null;
  return (
    <span className="text-[11px] leading-snug">
      <span className="font-bold text-chakra">Dano base {r.base}</span> <span className="text-faint">({r.parts.join(" + ")})</span>
      {r.warn.map((w) => (
        <span key={w} className="block text-bad">
          {w}
        </span>
      ))}
    </span>
  );
}
