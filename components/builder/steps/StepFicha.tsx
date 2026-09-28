"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { downloadJSON } from "@/lib/store";
import type { Issue } from "@/lib/rules";
import { FichaSheet } from "../../FichaSheet";
import { IconDownload, IconPrint, IconRight, StepHeader } from "../../ui";
import type { StepProps } from "../shared";

export function StepFicha({ c, issues, goTo }: StepProps & { issues: Issue[]; goTo: (step: string) => void }) {
  const errors = issues.filter((i) => i.sev === "erro");
  const warns = issues.filter((i) => i.sev === "aviso");

  return (
    <div className="flex flex-col gap-6">
      <div className="no-print flex flex-col gap-4">
        <StepHeader kicker="Etapa 9" title="Ficha">
          Revise os pontos e pré-requisitos. Na criação, todos os pontos devem ser gastos.
        </StepHeader>
        <div className="flex flex-wrap gap-2">
          <Link href={`/ficha/${c.id}/mesa`} className="btn-primary">
            Jogar com a ficha (Mesa) <IconRight className="size-4" />
          </Link>
          <button type="button" className="btn-ghost" onClick={() => window.print()}>
            <IconPrint className="size-4" /> Imprimir / PDF
          </button>
          <button type="button" className="btn-ghost" onClick={() => downloadJSON(c)}>
            <IconDownload className="size-4" /> Exportar .json
          </button>
        </div>
        <div className={`rounded-2xl border p-4 ${errors.length ? "border-bad/50 bg-bad/10" : warns.length ? "border-chakra/40 bg-chakra/10" : "border-ok/40 bg-ok/10"}`}>
          <p className="font-bold">
            {errors.length ? `${errors.length} erro(s) para corrigir` : warns.length ? "Quase lá: alguns pontos em aberto" : "Ficha válida para a criação!"}
          </p>
          {(errors.length > 0 || warns.length > 0) && (
            <ul className="mt-2 flex flex-col gap-1">
              {[...errors, ...warns].map((i, n) => (
                <li key={n}>
                  <button type="button" onClick={() => goTo(i.step)} className="flex items-start gap-2 text-left text-sm hover:underline">
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${i.sev === "erro" ? "bg-bad" : "bg-chakra"}`} />
                    {i.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <motion.div initial={{ opacity: 0, y: 16, rotateX: 6 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 0.35 }} style={{ transformPerspective: 1200 }}>
        <FichaSheet c={c} />
      </motion.div>
    </div>
  );
}
