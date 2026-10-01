"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { newPlay, playView, syncPlay } from "@/lib/play";
import { originKanji, originName } from "@/lib/rules";
import { useMesa, type SalaInfo } from "@/lib/sala";
import { useChars, useCharsStatus, useHydrated } from "@/lib/store";
import { roomError, supabase } from "@/lib/supabase/client";
import type { PlayState } from "@/lib/types";
import { CombateBotoes, CombateErro, Rodada, useCombate } from "../mesa/Combate";
import { Mesa } from "../mesa/Mesa";
import { IconCopy, IconLeft, IconPlus, Logo, Sheet } from "../ui";
import { EscolherFicha } from "./EscolherFicha";
import { Jogadores } from "./Jogadores";
import { useMembros } from "./useMembros";

export function SalaCliente({
  room,
  userId,
  role,
  characterId,
}: {
  room: SalaInfo;
  userId: string;
  role: "adm" | "player";
  /** Ficha aberta ao entrar (a do jogador, ou a última que o mestre abriu). */
  characterId: string | null;
}) {
  const isAdm = role === "adm";
  const { members, online, gone } = useMembros(room.id, userId);

  if (gone) {
    return (
      <Aviso
        title={gone === "kicked" ? "Você foi removido desta sala" : "Esta sala foi encerrada"}
        text={gone === "kicked" ? "O mestre tirou você da mesa. Se ele gerar um novo código, você pode entrar de novo com ele." : "O mestre apagou a sala ou você saiu dela."}
      />
    );
  }

  // Jogador cuja ficha foi apagada escolhe outra (jogador não troca de ficha de outro jeito).
  if (!isAdm && !characterId) return <EscolherFicha room={room} />;

  return (
    <>
      <SalaMesa room={room} userId={userId} isAdm={isAdm} initialActive={characterId} />
      <Jogadores roomId={room.id} members={members} online={online} meId={userId} isAdm={isAdm} actions={<SalaAcoes room={room} isAdm={isAdm} />} />
    </>
  );
}

/** Carrega o estado de jogo de todas as fichas da conta nesta sala e mostra a aberta. */
function SalaMesa({ room, userId, isAdm, initialActive }: { room: SalaInfo; userId: string; isAdm: boolean; initialActive: string | null }) {
  const hydrated = useHydrated();
  const status = useCharsStatus();
  const chars = useChars((s) => s.chars);
  const ready = useMesa((s) => s.ctx?.roomId === room.id);
  const activeId = useMesa((s) => s.activeId);
  const open = useMesa((s) => s.open);
  const close = useMesa((s) => s.close);
  const [error, setError] = useState<string | null>(null);
  const [manage, setManage] = useState(false);

  useEffect(() => {
    if (!hydrated || useMesa.getState().ctx?.roomId === room.id) return;
    let alive = true;
    void (async () => {
      const { data, error } = await supabase()
        .from("room_characters")
        .select("character_id, play")
        .eq("room_id", room.id)
        .eq("user_id", userId)
        .order("added_at", { ascending: true });
      if (!alive) return;
      if (error) return setError("Não foi possível abrir a mesa. Recarregue a página.");
      const all = useChars.getState().chars;
      const plays: Record<string, PlayState> = {};
      const order: string[] = [];
      for (const row of data ?? []) {
        const c = all[row.character_id as string];
        if (!c) continue;
        const play = (row.play as PlayState | null) ?? newPlay(c);
        // Aptidões compradas ou escolhas mudadas depois da última sessão entram na mesa.
        syncPlay(c, play);
        plays[c.id] = play;
        order.push(c.id);
      }
      open({ roomId: room.id, userId, isAdm }, plays, order, initialActive && plays[initialActive] ? initialActive : isAdm ? null : (order[0] ?? null));
    })();
    return () => {
      alive = false;
    };
  }, [hydrated, room.id, userId, isAdm, initialActive, open]);

  // Ficha editada em outra aba: a mesa acompanha (aptidões, estados automáticos).
  useEffect(() => {
    const st = useMesa.getState();
    if (st.ctx?.roomId !== room.id) return;
    for (const id of st.order) {
      const c = chars[id];
      const p = st.plays[id];
      if (!c || !p) continue;
      const next = structuredClone(p);
      if (syncPlay(c, next)) st.setPlay(id, next);
    }
  }, [chars, room.id]);

  useEffect(() => () => close(), [close]);

  if (error || status === "error") return <Aviso title="Mesa indisponível" text={error ?? "Não foi possível carregar suas fichas. Recarregue a página."} />;
  if (!hydrated || !ready) return <div className="grid min-h-dvh place-items-center text-muted">Abrindo pergaminho…</div>;

  const c = activeId ? chars[activeId] : undefined;
  const switcher = isAdm ? <TrocaRapida onManage={() => setManage(true)} /> : undefined;

  return (
    <>
      {c ? (
        <Mesa c={c} room={<SalaChip room={room} />} switcher={switcher} />
      ) : isAdm ? (
        <MestreView room={room} switcher={switcher} onManage={() => setManage(true)} />
      ) : (
        <Aviso title="A ficha desta sala não existe mais" text="Saia da sala pelo balão de jogadores e entre de novo com outra ficha." />
      )}
      {isAdm && <GerenciarFichas room={room} open={manage} onClose={() => setManage(false)} />}
    </>
  );
}

/** Faixa do mestre: um toque troca a ficha aberta na mesa. */
function TrocaRapida({ onManage }: { onManage: () => void }) {
  const order = useMesa((s) => s.order);
  const plays = useMesa((s) => s.plays);
  const activeId = useMesa((s) => s.activeId);
  const setActive = useMesa((s) => s.setActive);
  const chars = useChars((s) => s.chars);

  return (
    <nav aria-label="Fichas do mestre nesta sala" className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 py-0.5 scrollbar-none">
      <button
        type="button"
        aria-pressed={activeId === null}
        onClick={() => setActive(null)}
        className={`flex h-11 shrink-0 items-center gap-2 rounded-xl border px-2.5 text-sm font-bold transition ${activeId === null ? "border-chakra bg-chakra/15 text-paper" : "border-line-2 text-muted hover:text-text"}`}
      >
        <span className="grid size-7 place-items-center rounded-lg bg-paper-muted font-display text-base font-extrabold text-white">師</span>
        Mestre
      </button>
      {order.map((id) => {
        const c = chars[id];
        const p = plays[id];
        if (!c || !p) return null;
        const on = activeId === id;
        const vitMax = playView(c, p).vitMax;
        const low = p.vit <= vitMax / 4;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            onClick={() => setActive(id)}
            title={originName(c) ?? undefined}
            className={`flex h-11 max-w-52 shrink-0 items-center gap-2 rounded-xl border pl-1.5 pr-3 text-left transition ${on ? "border-chakra bg-chakra/15" : "border-line-2 hover:border-muted"}`}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-seal font-display text-base font-extrabold text-white">{originKanji(c)}</span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className={`truncate text-[13px] font-bold ${on ? "text-paper" : "text-text"}`}>{c.name || "Sem nome"}</span>
              <span className={`text-[11px] ${low ? "text-bad" : "text-faint"}`}>
                Vit {p.vit}/{vitMax} · Chk {p.chk}
              </span>
            </span>
          </button>
        );
      })}
      <button type="button" onClick={onManage} aria-label="Adicionar ou tirar fichas da sala" className="btn-ghost size-11 min-h-11 shrink-0 px-0">
        <IconPlus className="size-5" />
      </button>
    </nav>
  );
}

/** Gaveta do mestre: põe e tira fichas dele da sala. */
function GerenciarFichas({ room, open, onClose }: { room: SalaInfo; open: boolean; onClose: () => void }) {
  const chars = useChars((s) => s.chars);
  const order = useMesa((s) => s.order);
  const add = useMesa((s) => s.add);
  const remove = useMesa((s) => s.remove);
  const setActive = useMesa((s) => s.setActive);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmOut, setConfirmOut] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const list = Object.values(chars).sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));

  const put = async (id: string) => {
    const c = chars[id];
    if (!c) return;
    setBusy(id);
    setError(null);
    const { error } = await supabase().rpc("add_room_character", { p_room: room.id, p_character: id });
    setBusy(null);
    if (error) return setError(roomError(error));
    add(id, newPlay(c));
    onClose();
  };

  const takeOut = async (id: string) => {
    setBusy(id);
    setError(null);
    const { error } = await supabase().rpc("remove_room_character", { p_room: room.id, p_character: id });
    setBusy(null);
    setConfirmOut(null);
    if (error) return setError(roomError(error));
    remove(id);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Fichas do mestre nesta sala">
      <p className="mb-4 text-sm text-muted">Cada ficha guarda a própria vida, chakra e condições nesta sala. Os jogadores não veem as fichas do mestre.</p>
      {list.length === 0 ? (
        <p className="text-sm text-faint">Você ainda não tem fichas. Crie na tela inicial.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((c) => {
            const inRoom = order.includes(c.id);
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-ink-2 p-2.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-seal font-display text-xl font-extrabold text-white">{originKanji(c)}</span>
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate font-bold text-paper">{c.name || "Shinobi sem nome"}</span>
                  <span className="truncate text-xs text-faint">
                    {originName(c) ?? "Sem clã"} · NC {c.nc}
                  </span>
                </span>
                {inRoom ? (
                  confirmOut === c.id ? (
                    <span className="flex gap-2">
                      <button type="button" className="btn min-h-9 bg-bad px-3 text-xs text-white" disabled={busy === c.id} onClick={() => void takeOut(c.id)}>
                        Tirar e zerar
                      </button>
                      <button type="button" className="btn-ghost min-h-9 px-3 text-xs" onClick={() => setConfirmOut(null)}>
                        Cancelar
                      </button>
                    </span>
                  ) : (
                    <span className="flex gap-2">
                      <button
                        type="button"
                        className="btn-ghost min-h-9 px-3 text-xs"
                        onClick={() => {
                          setActive(c.id);
                          onClose();
                        }}
                      >
                        Abrir
                      </button>
                      <button type="button" className="btn-ghost min-h-9 px-3 text-xs text-bad" onClick={() => setConfirmOut(c.id)}>
                        Tirar da sala
                      </button>
                    </span>
                  )
                ) : (
                  <button type="button" className="btn-primary min-h-9 px-3 text-xs" disabled={busy === c.id} onClick={() => void put(c.id)}>
                    {busy === c.id ? "Pondo…" : "Pôr na sala"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-bad">
          {error}
        </p>
      )}
    </Sheet>
  );
}

/** Nome e código da sala no cabeçalho da mesa. */
function SalaChip({ room }: { room: SalaInfo }) {
  return (
    <div className="hidden items-center gap-2 rounded-xl border border-line-2 bg-ink-2 py-1 pl-3 pr-1 md:flex">
      <span className="flex flex-col leading-tight">
        <span className="max-w-40 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{room.name}</span>
        <span className="font-display text-base font-extrabold tracking-[0.2em] text-paper">{room.code}</span>
      </span>
      <CopyCode code={room.code} className="grid size-9 place-items-center rounded-lg bg-panel-2 hover:bg-line-2" />
    </div>
  );
}

function CopyCode({ code, className, label }: { code: string; className: string; label?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      // sem permissão de área de transferência: o código já está visível
    }
  };
  return (
    <button type="button" onClick={() => void copy()} className={className} aria-label={done ? "Código copiado" : "Copiar código da sala"}>
      <IconCopy className="size-4" />
      {label && <span>{done ? "Copiado!" : label}</span>}
    </button>
  );
}

/** Rodapé do balão: código, sair ou (mestre) novo código e apagar a sala. */
function SalaAcoes({ room, isAdm }: { room: SalaInfo; isAdm: boolean }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sair = async () => {
    const sb = supabase();
    const { data } = await sb.auth.getSession();
    const { error } = await sb.from("room_members").delete().eq("room_id", room.id).eq("user_id", data.session?.user.id ?? "");
    if (error) return setError(roomError(error));
    router.push("/");
  };
  const apagar = async () => {
    const { data, error } = await supabase().from("rooms").delete().eq("id", room.id).select("id");
    if (error || !data?.length) return setError(error ? roomError(error) : "Não foi possível apagar a sala.");
    router.push("/");
  };
  const novoCodigo = async () => {
    const { data, error } = await supabase().rpc("regenerate_room_code", { p_room: room.id });
    if (error) return setError(roomError(error));
    router.replace(`/sala/${data as string}`);
  };

  const small = "btn-ghost min-h-9 flex-1 px-2 text-xs";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-lg bg-panel px-3 py-1.5">
        <span className="flex-1 text-xs text-muted">
          Código <b className="font-display text-sm tracking-[0.2em] text-paper">{room.code}</b>
        </span>
        <CopyCode code={room.code} label="Copiar" className="btn min-h-8 gap-1.5 px-2 text-xs text-text hover:text-paper" />
      </div>
      <div className="flex gap-2">
        {isAdm ? (
          <>
            <button type="button" className={small} onClick={() => void novoCodigo()} title="O código antigo para de funcionar. Quem foi expulso pode voltar com o novo.">
              Novo código
            </button>
            {confirm ? (
              <button type="button" className="btn min-h-9 flex-1 bg-bad px-2 text-xs text-white" onClick={() => void apagar()}>
                Confirmar
              </button>
            ) : (
              <button type="button" className={`${small} text-bad`} onClick={() => setConfirm(true)}>
                Apagar sala
              </button>
            )}
          </>
        ) : confirm ? (
          <button type="button" className="btn min-h-9 flex-1 bg-bad px-2 text-xs text-white" onClick={() => void sair()}>
            Confirmar saída
          </button>
        ) : (
          <button type="button" className={small} onClick={() => setConfirm(true)}>
            Sair da sala
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-bad">
          {error}
        </p>
      )}
    </div>
  );
}

/** Mestre sem ficha aberta: o código em destaque e as fichas dele para abrir com um toque. */
function MestreView({ room, switcher, onManage }: { room: SalaInfo; switcher?: React.ReactNode; onManage: () => void }) {
  const hasChars = useMesa((s) => s.order.length > 0);
  const { round, error } = useCombate();
  useEffect(() => {
    document.title = `${room.name} · Sala · Shinobi no Sho`;
  }, [room.name]);
  return (
    <div className="min-h-dvh pb-40">
      <header className="sticky top-0 z-30 border-b border-line bg-ink/92 backdrop-blur supports-[backdrop-filter]:bg-ink/80">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-8">
          <Link href="/" className="btn-ghost size-11 shrink-0 px-0" aria-label="Voltar ao início">
            <IconLeft />
          </Link>
          <Logo className="hidden size-9 sm:block" />
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate font-display text-lg font-extrabold text-paper sm:text-xl">{room.name}</span>
            <span className="truncate text-xs text-muted">Você é o mestre desta sala</span>
          </div>
          <Rodada round={round ?? 0} />
          <CombateBotoes />
        </div>
        {error && (
          <div className="mx-auto max-w-7xl px-4 pb-2 sm:px-8">
            <CombateErro />
          </div>
        )}
        {switcher && <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-8">{switcher}</div>}
      </header>
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pt-12 text-center sm:px-8">
        <span className="label">Código da sala</span>
        <span className="font-display text-6xl font-extrabold tracking-[0.25em] text-paper sm:text-7xl">{room.code}</span>
        <p className="max-w-md text-base leading-relaxed text-muted">
          Passe este código aos jogadores. Eles entram em <b className="text-text">Início › Entrar com código</b> e escolhem a ficha.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <CopyCode code={room.code} label="Copiar código" className="btn-primary h-12 px-5" />
          <button type="button" className="btn-ghost h-12 px-5" onClick={onManage}>
            <IconPlus className="size-4" /> {hasChars ? "Pôr mais fichas" : "Pôr fichas na sala"}
          </button>
        </div>
        <p className="max-w-md text-[13px] text-faint">
          {hasChars
            ? "Toque numa ficha na faixa de cima para abrir a mesa dela. A vida e o chakra dos jogadores aparecem ao vivo no balão."
            : "Ponha quantas fichas quiser (NPCs, inimigos, aliados) e troque entre elas com um toque. A vida e o chakra dos jogadores aparecem ao vivo no balão."}
        </p>
        <p className="max-w-md text-[13px] text-faint">Só você inicia o combate, passa o turno e encerra. A rodada vale para todas as fichas da sala, as suas e as dos jogadores.</p>
      </main>
      {/* Celular e tablet: combate na barra de baixo, como na mesa */}
      <div data-bottom-bar className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink-2/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          <CombateBotoes bar />
        </div>
      </div>
    </div>
  );
}

function Aviso({ title, text }: { title: string; text: string }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <p className="font-display text-2xl font-extrabold text-paper">{title}</p>
        <p className="max-w-sm text-sm text-muted">{text}</p>
        <Link href="/" className="btn-primary">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
