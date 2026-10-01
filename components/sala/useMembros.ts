"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useMesa, type Member } from "@/lib/sala";
import { supabase } from "@/lib/supabase/client";

const COLS = "user_id, username, role, status, character_id, summary";

/**
 * Quem está na sala, ao vivo: mudanças em room_members (resumo de Vit/Chakra, entradas,
 * expulsões), presença (quem está com a sala aberta agora) e a rodada do combate (rooms).
 */
export function useMembros(roomId: string, userId: string) {
  const [members, setMembers] = useState<Record<string, Member>>({});
  const [online, setOnline] = useState<Set<string>>(() => new Set());
  const [gone, setGone] = useState<null | "kicked" | "deleted">(null);

  useEffect(() => {
    const sb = supabase();
    let alive = true;
    let ch: RealtimeChannel | null = null;

    const applyRound = (r: { round?: number; round_rev?: number } | null) => {
      if (typeof r?.round === "number" && typeof r.round_rev === "number") {
        useMesa.getState().setCombate({ roomId, round: r.round, rev: r.round_rev });
      }
    };

    const fetchAll = async () => {
      const [{ data, error }, room] = await Promise.all([
        sb.from("room_members").select(COLS).eq("room_id", roomId),
        sb.from("rooms").select("round, round_rev").eq("id", roomId).maybeSingle(),
      ]);
      if (!alive) return;
      applyRound(room.data);
      if (error || !data) return;
      const list = data as Member[];
      const me = list.find((m) => m.user_id === userId);
      if (!me) setGone("deleted");
      else if (me.status === "kicked") setGone("kicked");
      setMembers(Object.fromEntries(list.filter((m) => m.status === "active").map((m) => [m.user_id, m])));
    };

    const apply = (m: Member) => {
      if (m.user_id === userId && m.status === "kicked") setGone("kicked");
      setMembers((prev) => {
        const next = { ...prev };
        if (m.status === "active") next[m.user_id] = m;
        else delete next[m.user_id];
        return next;
      });
    };

    void fetchAll();

    (async () => {
      // O tempo real precisa do token da conta para aplicar a RLS.
      const { data } = await sb.auth.getSession();
      if (!alive) return;
      if (data.session) await sb.realtime.setAuth(data.session.access_token);
      if (!alive) return;
      const filter = `room_id=eq.${roomId}`;
      const channel = sb.channel(`sala:${roomId}`, { config: { presence: { key: userId } } });
      ch = channel
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_members", filter }, (pl) => apply(pl.new as Member))
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "room_members", filter }, (pl) => apply(pl.new as Member))
        // O mestre iniciou, passou a rodada ou encerrou o combate.
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, (pl) => applyRound(pl.new))
        // Remoções não aceitam filtro: chegam só com a chave (room_id, user_id).
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "room_members" }, (pl) => {
          const old = pl.old as { room_id?: string; user_id?: string };
          if (!old.user_id || (old.room_id && old.room_id !== roomId)) return;
          // Expulso continua vendo o aviso de expulsão quando o mestre gera um novo código (que apaga a expulsão).
          if (old.user_id === userId) setGone((g) => g ?? "deleted");
          setMembers((prev) => {
            const next = { ...prev };
            delete next[old.user_id!];
            return next;
          });
        })
        .on("presence", { event: "sync" }, () => setOnline(new Set(Object.keys(channel.presenceState()))))
        .subscribe((status) => {
          if (status !== "SUBSCRIBED") return;
          // Pega o que mudou entre a primeira consulta e a inscrição.
          void fetchAll();
          void channel.track({ at: Date.now() });
        });
    })();

    return () => {
      alive = false;
      if (ch) void sb.removeChannel(ch);
    };
  }, [roomId, userId]);

  return { members, online, gone };
}
