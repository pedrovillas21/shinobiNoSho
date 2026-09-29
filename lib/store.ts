"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { newCharacter, normalize, uid } from "./rules";
import type { Character } from "./types";

interface State {
  chars: Record<string, Character>;
  create: (nc?: number) => string;
  update: (id: string, fn: (c: Character) => Character | void) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => string | null;
  importChar: (raw: unknown) => string;
}

export const useChars = create<State>()(
  persist(
    (set, get) => ({
      chars: {},
      create: (nc = 4) => {
        const c = newCharacter(nc);
        set((s) => ({ chars: { ...s.chars, [c.id]: c } }));
        return c.id;
      },
      update: (id, fn) =>
        set((s) => {
          const cur = s.chars[id];
          if (!cur) return s;
          const draft = structuredClone(cur);
          const next = fn(draft) ?? draft;
          next.updatedAt = Date.now();
          return { chars: { ...s.chars, [id]: next } };
        }),
      remove: (id) =>
        set((s) => {
          const { [id]: _gone, ...rest } = s.chars;
          return { chars: rest };
        }),
      duplicate: (id) => {
        const cur = get().chars[id];
        if (!cur) return null;
        const copy: Character = { ...structuredClone(cur), id: uid(), name: `${cur.name || "Shinobi"} (cópia)`, createdAt: Date.now(), updatedAt: Date.now() };
        set((s) => ({ chars: { ...s.chars, [copy.id]: copy } }));
        return copy.id;
      },
      importChar: (raw) => {
        if (!raw || typeof raw !== "object") throw new Error("Arquivo inválido");
        const c = normalize({ ...(raw as Partial<Character>), id: uid(), updatedAt: Date.now() });
        set((s) => ({ chars: { ...s.chars, [c.id]: c } }));
        return c.id;
      },
    }),
    {
      name: "sns-fichas-v1",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      // Fichas antigas ganham os campos novos (clã próprio, perícias próprias, escolhas de aptidões).
      migrate: (persisted) => {
        const p = persisted as { chars?: Record<string, Partial<Character>> };
        const chars = Object.fromEntries(Object.entries(p?.chars ?? {}).map(([id, c]) => [id, normalize({ ...c, id })]));
        return { ...(p as object), chars } as State;
      },
    },
  ),
);

/** Evita divergência entre o HTML do servidor e o localStorage. */
export function useHydrated() {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  return ok;
}

export function downloadJSON(c: Character) {
  const blob = new Blob([JSON.stringify(c, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = (c.name || "shinobi").normalize("NFD").replace(/[^\w]+/g, "-").toLowerCase();
  a.href = url;
  a.download = `ficha-${slug}-nc${c.nc}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readJSONFile(file: File): Promise<unknown> {
  return JSON.parse(await file.text());
}
