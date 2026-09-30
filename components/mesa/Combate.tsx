"use client";

import { useMesa } from "@/lib/sala";
import { AnimatedNumber, IconRight } from "../ui";

/** Rodada da sala (null = ainda carregando) e se quem vê é o mestre, o único que mexe no combate. */
export function useCombate() {
  const round = useMesa((s) => (s.combate && s.combate.roomId === s.ctx?.roomId ? s.combate.round : null));
  const isAdm = useMesa((s) => Boolean(s.ctx?.isAdm));
  const busy = useMesa((s) => s.combateBusy);
  const error = useMesa((s) => s.combateError);
  const mudar = useMesa((s) => s.mudarCombate);
  return { round, isAdm, busy, error, next: () => void mudar("next"), end: () => void mudar("end") };
}

export function Rodada({ round }: { round: number }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-line bg-panel px-3 py-1 leading-tight">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Rodada</span>
      <span className="font-display text-xl font-extrabold text-paper">{round > 0 ? <AnimatedNumber value={round} /> : "—"}</span>
    </div>
  );
}

/** Botões do mestre: iniciar, passar a rodada e encerrar valem para todas as fichas da sala. */
export function CombateBotoes({ bar = false }: { bar?: boolean }) {
  const { round, busy, next, end } = useCombate();
  const inCombat = (round ?? 0) > 0;
  const off = busy || round === null;
  const passar = (
    <button type="button" className={bar ? "btn-primary h-11 min-h-11 flex-[2]" : "btn-primary hidden lg:inline-flex"} onClick={next} disabled={off}>
      {inCombat ? "Próximo turno" : "Iniciar combate"} <IconRight className="size-4" />
    </button>
  );
  const encerrar = inCombat && (
    <button type="button" className={bar ? "btn-ghost h-11 min-h-11 flex-1" : "btn-ghost hidden lg:inline-flex"} onClick={end} disabled={off}>
      {bar ? "Encerrar" : "Encerrar combate"}
    </button>
  );
  // Na barra de baixo o botão principal fica à direita, perto do polegar.
  return bar ? (
    <>
      {encerrar}
      {passar}
    </>
  ) : (
    <>
      {passar}
      {encerrar}
    </>
  );
}

/** Jogador: quem mexe no combate é o mestre. */
export function CombateAviso({ round }: { round: number }) {
  return (
    <p className="flex-1 text-center text-xs leading-snug text-muted">
      {round > 0 ? `Rodada ${round} · o mestre passa o turno` : "Fora de combate · o mestre inicia o combate"}
    </p>
  );
}

export function CombateErro() {
  const error = useMesa((s) => s.combateError);
  if (!error) return null;
  return (
    <p role="alert" className="text-xs text-bad">
      {error}
    </p>
  );
}
