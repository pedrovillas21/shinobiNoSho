import type { Logger, PlayView } from "@/lib/play";
import type { Character, PlayState } from "@/lib/types";

export interface MesaProps {
  c: Character;
  p: PlayState;
  v: PlayView;
  /** Ação de jogo: entra no histórico e pode ser desfeita. */
  commit: (fn: (p: PlayState, log: Logger, c: Character) => void) => void;
  /** Edição silenciosa (nomes, notas, campos de configuração). */
  patch: (fn: (p: PlayState) => void) => void;
}

export function SectionTitle({ id, title, children }: { id: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 id={id} className="font-display text-2xl font-extrabold text-paper">
        {title}
      </h2>
      {children && <p className="text-sm leading-relaxed text-muted">{children}</p>}
    </div>
  );
}

/** Campo numérico que aceita vazio e negativos enquanto se digita. */
export function NumInput({
  id,
  label,
  value,
  onChange,
  className = "",
  inputClass = "",
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  className?: string;
  inputClass?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-xs text-muted">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        className={`field py-2 text-center ${inputClass}`}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}
