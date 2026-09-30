"use client";

import { create } from "zustand";
import { followRound, playView, withLog } from "./play";
import { originKanji, originName } from "./rules";
import { useChars } from "./store";
import { roomError, supabase } from "./supabase/client";
import type { Character, PlayState } from "./types";

/** O que os outros da sala veem de cada jogador no balão. */
export interface MemberSummary {
  name: string;
  kanji: string;
  origin: string | null;
  nc: number;
  vit: number;
  vitMax: number;
  chk: number;
  chkMax: number;
}

export interface SalaInfo {
  id: string;
  code: string;
  name: string;
  ownerUsername: string;
}

export interface Member {
  user_id: string;
  username: string;
  role: "adm" | "player";
  status: "active" | "kicked";
  character_id: string | null;
  summary: MemberSummary | null;
}

export function summarize(c: Character, p: PlayState): MemberSummary {
  const v = playView(c, p);
  return {
    name: c.name || "Shinobi sem nome",
    kanji: originKanji(c),
    origin: originName(c),
    nc: c.nc,
    vit: p.vit,
    vitMax: v.vitMax,
    chk: p.chk,
    chkMax: v.chkMax,
  };
}

interface Ctx {
  roomId: string;
  userId: string;
  /** O mestre tem várias fichas na sala e não publica resumo (as fichas dele são segredo). */
  isAdm: boolean;
}

/** Rodada do combate da sala (0 = fora de combate). rev sobe a cada mudança feita pelo mestre. */
export interface Combate {
  roomId: string;
  round: number;
  rev: number;
}

interface MesaState {
  ctx: Ctx | null;
  /** Estado de jogo de cada ficha nesta sala (vida, chakra, condições, histórico), por id da ficha. */
  plays: Record<string, PlayState>;
  /** Fichas na sala, na ordem em que entraram. */
  order: string[];
  /** Ficha aberta na mesa (null = mestre só mestrando). */
  activeId: string | null;
  saveError: boolean;
  /** Combate da sala: só o mestre muda; todas as fichas acompanham. */
  combate: Combate | null;
  combateBusy: boolean;
  combateError: string | null;
  /** Desfazer por ficha, na sessão aberta (o mestre troca de ficha e volta sem perder). Zera quando a rodada muda. */
  hist: Record<string, PlayState[]>;
  open: (ctx: Ctx, plays: Record<string, PlayState>, order: string[], activeId: string | null) => void;
  setActive: (id: string | null) => void;
  setPlay: (id: string, p: PlayState) => void;
  setHist: (id: string, h: PlayState[]) => void;
  add: (id: string, p: PlayState) => void;
  remove: (id: string) => void;
  close: () => void;
  /** Rodada vinda do banco (consulta ou tempo real). Avisos mais velhos que o último visto são ignorados. */
  setCombate: (c: Combate) => void;
  /** Mestre: 'next' inicia ou passa a rodada; 'end' encerra o combate. */
  mudarCombate: (action: "next" | "end") => Promise<void>;
}

const SAVE_DELAY = 500;
const timers = new Map<string, ReturnType<typeof setTimeout>>();
let lastSummary = "";

export const useMesa = create<MesaState>()((set, get) => {
  async function save(id: string) {
    timers.delete(id);
    const { ctx, plays } = get();
    const play = plays[id];
    if (!ctx || !play) return;
    const sb = supabase();
    const { error } = await sb.from("room_characters").update({ play }).eq("room_id", ctx.roomId).eq("character_id", id);
    let summaryError = null;
    const c = useChars.getState().chars[id];
    if (!ctx.isAdm && c) {
      const summary = summarize(c, play);
      const key = JSON.stringify(summary);
      if (key !== lastSummary) {
        ({ error: summaryError } = await sb.from("room_members").update({ summary }).eq("room_id", ctx.roomId).eq("user_id", ctx.userId));
        if (!summaryError) lastSummary = key;
      }
    }
    set({ saveError: Boolean(error || summaryError) });
  }

  function schedule(id: string, delay = SAVE_DELAY) {
    const t = timers.get(id);
    if (t) clearTimeout(t);
    timers.set(id, setTimeout(() => void save(id), delay));
  }

  function flushAll() {
    for (const [id, t] of timers) {
      clearTimeout(t);
      void save(id);
    }
  }

  /** Cada ficha desta conta na sala vai para a rodada da sala (sangramento, durações etc. correm aqui). */
  function followAll() {
    const { ctx, combate, plays, order, hist } = get();
    if (!ctx || combate?.roomId !== ctx.roomId) return;
    const nextPlays = { ...plays };
    const nextHist = { ...hist };
    const changed: string[] = [];
    for (const id of order) {
      const cur = plays[id];
      if (!cur || cur.round === combate.round) continue;
      const play = structuredClone(cur);
      withLog(play, (log) => followRound(play, combate.round, log));
      nextPlays[id] = play;
      // Desfazer não volta para antes da rodada do mestre.
      nextHist[id] = [];
      changed.push(id);
    }
    if (!changed.length) return;
    set({ plays: nextPlays, hist: nextHist });
    changed.forEach((id) => schedule(id));
  }

  return {
    ctx: null,
    plays: {},
    order: [],
    activeId: null,
    saveError: false,
    combate: null,
    combateBusy: false,
    combateError: null,
    hist: {},
    open: (ctx, plays, order, activeId) => {
      flushAll();
      lastSummary = "";
      set({ ctx, plays, order, activeId, saveError: false, hist: {}, combateError: null });
      followAll();
      // Publica logo ao abrir: o balão dos outros mostra a ficha do jogador, e fichas novas ganham o estado inicial.
      order.forEach((id) => schedule(id, 0));
    },
    setActive: (activeId) => {
      const { ctx } = get();
      set({ activeId });
      if (!ctx?.isAdm) return;
      // Guarda a escolha para abrir na mesma ficha ao voltar; a troca na tela não espera o banco.
      void supabase()
        .rpc("set_active_character", { p_room: ctx.roomId, p_character: activeId })
        .then(({ error }) => error && set({ saveError: true }));
    },
    setPlay: (id, play) => {
      set((s) => ({ plays: { ...s.plays, [id]: play } }));
      schedule(id);
    },
    setHist: (id, h) => set((s) => ({ hist: { ...s.hist, [id]: h } })),
    add: (id, play) => {
      set((s) => ({ plays: { ...s.plays, [id]: play }, order: s.order.includes(id) ? s.order : [...s.order, id], activeId: id }));
      // Ficha posta no meio do combate já entra na rodada atual.
      followAll();
      schedule(id, 0);
    },
    remove: (id) => {
      const t = timers.get(id);
      if (t) clearTimeout(t);
      timers.delete(id);
      set((s) => {
        const { [id]: _gone, ...plays } = s.plays;
        return { plays, order: s.order.filter((x) => x !== id), activeId: s.activeId === id ? null : s.activeId };
      });
    },
    close: () => {
      flushAll();
      set({ ctx: null, plays: {}, order: [], activeId: null, hist: {} });
    },
    setCombate: (c) => {
      const cur = get().combate;
      if (cur?.roomId === c.roomId && c.rev <= cur.rev) return;
      set({ combate: c });
      followAll();
    },
    mudarCombate: async (action) => {
      const { ctx, combateBusy } = get();
      if (!ctx?.isAdm || combateBusy) return;
      set({ combateBusy: true, combateError: null });
      const { data, error } = await supabase()
        .rpc("set_room_round", { p_room: ctx.roomId, p_action: action })
        .single<{ new_round: number; new_rev: number }>();
      set({ combateBusy: false });
      if (error || !data) return set({ combateError: roomError(error) });
      // Não espera o tempo real: a mesa do mestre já anda.
      get().setCombate({ roomId: ctx.roomId, round: data.new_round, rev: data.new_rev });
    },
  };
});

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    const { ctx, plays } = useMesa.getState();
    for (const [id, t] of timers) {
      clearTimeout(t);
      if (ctx && plays[id]) void supabase().from("room_characters").update({ play: plays[id] }).eq("room_id", ctx.roomId).eq("character_id", id);
    }
    timers.clear();
  });
}
