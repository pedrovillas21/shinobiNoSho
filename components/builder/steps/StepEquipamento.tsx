"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ITEM_PRESETS, VILLAGE_ITEMS_NOTE } from "@/lib/data/base";
import { budgetFor, compLimit, hasApt, spent, uid } from "@/lib/rules";
import type { ItemEntry } from "@/lib/types";
import { IconPlus, IconTrash, NumberField, StepHeader } from "../../ui";
import type { StepProps } from "../shared";

export function StepEquipamento({ c, set }: StepProps) {
  const b = budgetFor(c.nc, c.optionals);
  const s = spent(c);
  const total = b.ryos + (c.extraRyos || 0);
  const left = total - s.ryos;
  const limit = compLimit(c);
  const [name, setName] = useState("");

  const addItem = (item: Partial<ItemEntry> & { name: string }) =>
    set((d) => void d.items.push({ uid: uid(), qty: 1, price: 0, comps: 0, ...item }));
  const edit = (u: string, fn: (i: ItemEntry) => void) => set((d) => fn(d.items.find((x) => x.uid === u)!));

  return (
    <div className="flex flex-col gap-8">
      <StepHeader kicker="Etapa 7" title="Equipamento">
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
