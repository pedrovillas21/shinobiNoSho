"use client";

import { motion } from "motion/react";
import { useActionState, useState } from "react";
import { entrar, registrar } from "@/app/entrar/actions";
import { Logo } from "./ui";

type Mode = "login" | "register";

export function EntrarClient({ next }: { next: string }) {
  const [mode, setMode] = useState<Mode>("login");
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-ink-2 px-16 py-14 lg:flex">
        <Brand />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-10 select-none font-display text-[520px] font-extrabold leading-none text-panel">
          巻
        </span>
        <div className="relative flex max-w-md flex-col gap-4">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-chakra">Naruto RPG · Sistema D8</span>
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] text-paper">Suas fichas, sua mesa, seu grupo.</h1>
          <p className="text-base leading-relaxed text-muted">
            Crie fichas na sua conta e entre nas salas do grupo com um código. O mestre vê a mesa de todos em tempo real.
          </p>
        </div>
        <span className="relative text-xs text-faint">Ferramenta de fã, sem fins comerciais.</span>
      </section>

      <section className="flex flex-col items-center justify-center gap-8 px-4 py-10 sm:px-8">
        <div className="lg:hidden">
          <Brand />
        </div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card flex w-full max-w-[420px] flex-col gap-5 p-6 sm:p-8">
          <div role="tablist" aria-label="Entrar ou criar conta" className="grid grid-cols-2 gap-1 rounded-xl border border-line-2 bg-ink-2 p-1">
            {(
              [
                ["login", "Entrar"],
                ["register", "Criar conta"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={mode === k}
                onClick={() => setMode(k)}
                className={`h-10 rounded-lg text-sm font-bold transition ${mode === k ? "bg-chakra text-paper-ink" : "text-muted hover:text-text"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Cada aba tem seu próprio formulário e estado de erro */}
          {mode === "login" ? <LoginForm next={next} /> : <RegisterForm next={next} />}
        </motion.div>
      </section>
    </main>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <Logo />
      <div className="flex flex-col leading-tight">
        <span className="font-display text-lg font-extrabold sm:text-xl">Shinobi no Sho</span>
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted">Fichas &amp; Mesa · 4.1b</span>
      </div>
    </div>
  );
}

function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(entrar, undefined);
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <Field id="username" label="Usuário" defaultValue={state?.username} autoComplete="username" placeholder="ex.: kakashi_hatake" />
      <Field id="password" label="Senha" type="password" autoComplete="current-password" placeholder="••••••••" />
      <ErrorLine msg={state?.error} />
      <button type="submit" className="btn-primary h-12 text-base" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
      <p className="text-center text-[13px] leading-relaxed text-faint">Esqueceu a senha? Peça ao dono do site para redefinir no painel do Supabase.</p>
    </form>
  );
}

function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(registrar, undefined);
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <Field
        id="username"
        label="Usuário"
        defaultValue={state?.username}
        autoComplete="username"
        placeholder="ex.: kakashi_hatake"
        hint="3 a 20 caracteres: letras minúsculas, números e _"
        pattern="[a-z0-9_]{3,20}"
      />
      <Field id="password" label="Senha" type="password" autoComplete="new-password" placeholder="••••••••" minLength={8} />
      <Field id="confirm" label="Confirmar senha" type="password" autoComplete="new-password" placeholder="••••••••" minLength={8} hint="Mínimo de 8 caracteres." />
      <ErrorLine msg={state?.error} />
      <button type="submit" className="btn-primary h-12 text-base" disabled={pending}>
        {pending ? "Criando…" : "Criar conta"}
      </button>
      <p className="text-center text-[13px] leading-relaxed text-faint">Sua senha é guardada com criptografia. Ninguém do grupo tem acesso a ela.</p>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  type = "text",
  ...rest
}: { id: string; label: string; hint?: string; type?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input id={id} name={id} type={type} required className="field h-12" autoCapitalize="none" spellCheck={false} {...rest} />
      {hint && <span className="text-xs text-faint">{hint}</span>}
    </div>
  );
}

function ErrorLine({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="alert" className="rounded-xl border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">
      {msg}
    </p>
  );
}
