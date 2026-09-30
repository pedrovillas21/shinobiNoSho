"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

/** Cliente do navegador (a sessão vem dos cookies que o servidor grava). Um só por aba. */
export function supabase() {
  const { url, key } = supabaseEnv();
  return createBrowserClient(url, key);
}

/** Id da conta logada, lido da sessão local (a RLS do banco é quem garante o acesso). */
export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase().auth.getSession();
  return data.session?.user.id ?? null;
}

/** Mensagens das funções da sala (raise exception no SQL) em português. */
export function roomError(e: { message?: string } | null | undefined): string {
  const m = e?.message ?? "";
  if (m.includes("room_not_found")) return "Sala não encontrada. Confira o código.";
  if (m.includes("kicked")) return "Você foi removido desta sala pelo mestre.";
  if (m.includes("character_required")) return "Escolha uma ficha para entrar.";
  if (m.includes("invalid_character")) return "Essa ficha não é sua.";
  if (m.includes("room_full")) return "A sala está cheia.";
  if (m.includes("too_many_rooms")) return "Você já criou salas demais. Apague alguma antiga.";
  if (m.includes("invalid_name")) return "Dê um nome de 1 a 60 caracteres para a sala.";
  if (m.includes("forbidden")) return "Só o mestre da sala pode fazer isso.";
  return "Algo deu errado. Tente de novo.";
}
