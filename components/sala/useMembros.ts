"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import type { Member } from "@/lib/sala";
import { supabase } from "@/lib/supabase/client";

const COLS = "user_id, username, role, status, character_id, summary";

/**
 * Quem está na sala, ao vivo: mudanças em room_members (resumo de Vit/Chakra, entradas,
 * expulsões) e presença (quem está com a sala aberta agora).
 */
export function useMembros(roomId: string, userId: string) {
  const [members, setMembers] = useState<Record<string, Member>>({});
  const [online, setOnline] = useState<Set<string>>(() => new Set());
  const [gone, setGone] = useState<null | "kicked" | "deleted">(null);

  useEffect(() => {
    const sb = supabase();
    let alive = true;
    let ch: RealtimeChannel | null = null;

    const fetchAll = async () => {
      const { data, error } = await sb.from("room_members").select(COLS).eq("room_id", roomId);
      if (!alive || error || !data) return;
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
        // Remoções não aceitam filtro: chegam só com a chave (room_id, user_id).
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "room_members" }, (pl) => {
          const old = pl.old as { room_id?: string; user_id?: string };
          if (!old.user_id || (old.room_id && old.room_id !== roomId)) return;
          if (old.user_id === userId) setGone("deleted");
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
