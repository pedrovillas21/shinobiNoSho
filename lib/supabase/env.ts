// As variáveis NEXT_PUBLIC_ precisam aparecer literalmente para o Next embutir no navegador.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const EMAIL_DOMAIN = process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN || "shinobi-no-sho.app";

export function supabaseEnv() {
  if (!URL || !KEY) {
    throw new Error(
      "Supabase não configurado: faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copie .env.example para .env.local e preencha (veja SUPABASE.md).",
    );
  }
  return { url: URL, key: KEY };
}

export const hasSupabaseEnv = () => Boolean(URL && KEY);

/** Regras do nome de usuário (as mesmas da tabela profiles). */
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

/** O login é por usuário; por baixo o Supabase Auth recebe um e-mail que não precisa existir. */
export const usernameToEmail = (username: string) => `${username}@${EMAIL_DOMAIN}`;
