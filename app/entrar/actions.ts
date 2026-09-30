"use server";

import { redirect } from "next/navigation";
import { USERNAME_RE, usernameToEmail } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string; username: string } | undefined;

/** Só caminhos internos (evita redirecionar para outro site). */
function safeNext(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/";
}

function readForm(form: FormData) {
  return {
    username: String(form.get("username") ?? "").trim().toLowerCase(),
    password: String(form.get("password") ?? ""),
    next: safeNext(form.get("next")),
  };
}

export async function entrar(_prev: AuthState, form: FormData): Promise<AuthState> {
  const { username, password, next } = readForm(form);
  if (!USERNAME_RE.test(username) || password.length < 8 || password.length > 72) {
    return { error: "Usuário ou senha inválidos.", username };
  }
  const sb = await createClient();
  const { error } = await sb.auth.signInWithPassword({ email: usernameToEmail(username), password });
  if (error) return { error: "Usuário ou senha inválidos.", username };
  redirect(next);
}

export async function registrar(_prev: AuthState, form: FormData): Promise<AuthState> {
  const { username, password, next } = readForm(form);
  const confirm = String(form.get("confirm") ?? "");
  if (!USERNAME_RE.test(username)) return { error: "Use de 3 a 20 caracteres: letras minúsculas, números e _.", username };
  if (password.length < 8) return { error: "A senha precisa de pelo menos 8 caracteres.", username };
  if (password.length > 72) return { error: "A senha pode ter no máximo 72 caracteres.", username };
  if (password !== confirm) return { error: "As senhas não conferem.", username };

  const sb = await createClient();
  const { data, error } = await sb.auth.signUp({
    email: usernameToEmail(username),
    password,
    options: { data: { username } },
  });
  if (error) {
    // Motivo real no terminal do servidor (sem a senha), para diagnosticar.
    console.error(`[registrar] Supabase recusou o cadastro de "${username}": code=${error.code ?? "-"} status=${error.status ?? "-"} ${error.message}`);
    return { error: signUpMessage(error), username };
  }
  if (!data.session) {
    return { error: "Conta criada, mas o Supabase pede confirmação de e-mail. Desligue \"Confirm email\" no painel (veja SUPABASE.md).", username };
  }
  redirect(next);
}

function signUpMessage(error: { code?: string; message: string }) {
  const code = error.code ?? "";
  if (code === "user_already_exists" || /already/i.test(error.message)) return "Esse nome de usuário já existe.";
  if (code === "email_address_invalid" || /email.*invalid/i.test(error.message)) {
    return "O Supabase recusou o domínio de e-mail interno. Troque NEXT_PUBLIC_AUTH_EMAIL_DOMAIN no .env.local (ex.: shinobi-no-sho.app) e reinicie o npm run dev.";
  }
  if (code === "weak_password") return "O Supabase achou a senha fraca. Use uma senha mais longa, misturando letras e números.";
  if (code === "signup_disabled" || code === "email_provider_disabled") return "Cadastro desligado no Supabase. Ative o provedor Email em Authentication › Sign In / Providers.";
  if (code === "over_email_send_rate_limit" || /email rate limit/i.test(error.message)) {
    return "O Supabase está tentando mandar e-mail de confirmação. Desligue \"Confirm email\" em Authentication › Sign In / Providers › Email, espere alguns minutos e tente de novo.";
  }
  if (code.startsWith("over_") || error.message.includes("rate limit")) return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
  if (/database error/i.test(error.message)) return "O banco recusou a conta nova. Confira se as migrações foram aplicadas (npm run db:migrate).";
  return "Não foi possível criar a conta agora. Veja o motivo no terminal do servidor.";
}

export async function sair() {
  const sb = await createClient();
  await sb.auth.signOut();
  redirect("/entrar");
}
