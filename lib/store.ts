"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { currentUserId, supabase } from "./supabase/client";
import { newCharacter, normalize, uid } from "./rules";
import type { Character } from "./types";

/*
 * Fichas da conta, guardadas no Supabase (tabela characters, só o dono lê e escreve).
 * A tela muda na hora e o banco recebe a ficha logo depois (com espera curta, para não
 * salvar a cada tecla). O estado de jogo não fica mais na ficha: cada sala tem o seu.
 */

type Status = "idle" | "loading" | "ready" | "error";

interface State {
  userId: string | null;
  status: Status;
  chars: Record<string, Character>;
  /** Salvamentos ainda não confirmados pelo banco. */
  pending: number;
  saveError: boolean;
  ensureLoaded: () => Promise<void>;
  create: (nc?: number) => string;
  update: (id: string, fn: (c: Character) => Character | void) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => string | null;
  importChar: (raw: unknown) => string;
  importMany: (list: Character[]) => Promise<number>;
}

const SAVE_DELAY = 600;
const timers = new Map<string, ReturnType<typeof setTimeout>>();

/** Ficha como vai para o banco: sem o estado de jogo antigo. */
function toRow(c: Character) {
  const { play: _play, ...data } = c;
  return { id: c.id, name: (c.name || "").slice(0, 120), nc: c.nc, data };
}

function newId() {
  return crypto.randomUUID();
}

export const useChars = create<State>()((set, get) => {
  async function save(id: string) {
    timers.delete(id);
    const c = get().chars[id];
    if (!c) return;
    set((s) => ({ pending: s.pending + 1 }));
    const { error } = await supabase().from("characters").upsert(toRow(c));
    set((s) => ({ pending: s.pending - 1, saveError: Boolean(error) }));
  }

  function schedule(id: string, delay = SAVE_DELAY) {
    const t = timers.get(id);
    if (t) clearTimeout(t);
    timers.set(id, setTimeout(() => void save(id), delay));
  }

  function put(c: Character, delay?: number) {
    set((s) => ({ chars: { ...s.chars, [c.id]: c } }));
    schedule(c.id, delay);
  }

  let inflight: Promise<void> | null = null;

  async function load() {
    const uidNow = await currentUserId();
    const s = get();
    if (s.userId === uidNow && s.status === "ready") return;
    // Outra conta na mesma aba (saiu e entrou com outro usuário): começa do zero.
    set({ userId: uidNow, status: "loading", chars: s.userId === uidNow ? s.chars : {} });
    if (!uidNow) return set({ status: "error" });
    const { data, error } = await supabase().from("characters").select("id, data").order("updated_at", { ascending: false });
    if (error) return set({ status: "error" });
    const chars: Record<string, Character> = {};
    for (const row of data ?? []) {
      const c = normalize({ ...(row.data as Partial<Character>), id: row.id as string });
      chars[c.id] = c;
    }
    // Ficha criada enquanto a lista carregava ainda não está no banco: mantém a versão local.
    for (const id of timers.keys()) {
      const local = get().chars[id];
      if (local) chars[id] = local;
    }
    set({ chars, status: "ready" });
  }

  return {
    userId: null,
    status: "idle",
    chars: {},
    pending: 0,
    saveError: false,

    // Várias telas pedem ao mesmo tempo: uma só consulta por vez.
    ensureLoaded: () => (inflight ??= load().finally(() => (inflight = null))),

    create: (nc = 4) => {
      const c = { ...newCharacter(nc), id: newId() };
      put(c, 0);
      return c.id;
    },

    update: (id, fn) => {
      const cur = get().chars[id];
      if (!cur) return;
      const draft = structuredClone(cur);
      const next = fn(draft) ?? draft;
      next.updatedAt = Date.now();
      put(next);
    },

    remove: (id) => {
      const t = timers.get(id);
      if (t) clearTimeout(t);
      timers.delete(id);
      set((s) => {
        const { [id]: _gone, ...rest } = s.chars;
        return { chars: rest };
      });
      void supabase()
        .from("characters")
        .delete()
        .eq("id", id)
        .then(({ error }) => error && set({ saveError: true }));
    },

    duplicate: (id) => {
      const cur = get().chars[id];
      if (!cur) return null;
      const copy: Character = { ...structuredClone(cur), id: newId(), name: `${cur.name || "Shinobi"} (cópia)`, createdAt: Date.now(), updatedAt: Date.now() };
      delete copy.play;
      put(copy, 0);
      return copy.id;
    },

    importChar: (raw) => {
      if (!raw || typeof raw !== "object") throw new Error("Arquivo inválido");
      const c = normalize({ ...(raw as Partial<Character>), id: newId(), updatedAt: Date.now() });
      delete c.play;
      put(c, 0);
      return c.id;
    },

    importMany: async (list) => {
      const fresh = list.map((raw) => {
        const c = normalize({ ...raw, id: newId() });
        delete c.play;
        return c;
      });
      if (fresh.length === 0) return 0;
      const { error } = await supabase().from("characters").insert(fresh.map(toRow));
      if (error) throw error;
      set((s) => ({ chars: { ...s.chars, ...Object.fromEntries(fresh.map((c) => [c.id, c])) } }));
      return fresh.length;
    },
  };
});

// Fecha a aba com ficha por salvar: manda na hora.
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    for (const [id, t] of timers) {
      clearTimeout(t);
      const c = useChars.getState().chars[id];
      if (c) void supabase().from("characters").upsert(toRow(c));
    }
    timers.clear();
  });
}

/** Carrega as fichas da conta e diz se já chegaram. */
export function useHydrated() {
  const status = useChars((s) => s.status);
  const ensureLoaded = useChars((s) => s.ensureLoaded);
  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);
  return status === "ready";
}

export const useCharsStatus = () => useChars((s) => s.status);

/* ---------------- fichas antigas do navegador ---------------- */

const LEGACY_KEY = "sns-fichas-v1";
const LEGACY_DONE = "sns-fichas-v1-enviadas";

/** Fichas que ficaram no localStorage da versão sem conta (vazio se já foram enviadas ou dispensadas). */
export function legacyChars(): Character[] {
  try {
    if (localStorage.getItem(LEGACY_DONE)) return [];
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const chars = (JSON.parse(raw) as { state?: { chars?: Record<string, Partial<Character>> } })?.state?.chars ?? {};
    return Object.entries(chars).map(([id, c]) => normalize({ ...c, id: id || uid() }));
  } catch {
    return [];
  }
}

/** Marca as fichas antigas como resolvidas (os dados continuam no navegador). */
export function dismissLegacy() {
  try {
    localStorage.setItem(LEGACY_DONE, new Date().toISOString());
  } catch {
    // sem armazenamento: o aviso volta na próxima visita
  }
}

/* ---------------- arquivos ---------------- */

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
