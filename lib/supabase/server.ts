import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

/** Cliente do servidor (Server Components e Server Actions), com a sessão dos cookies. */
export async function createClient() {
  // cookies() primeiro: marca a rota como dinâmica (nada disso roda no build).
  const store = await cookies();
  const { url, key } = supabaseEnv();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server Component não grava cookies; o proxy.ts já renova a sessão.
        }
      },
    },
  });
}

/** Conta logada, conferida no servidor de autenticação (não só lida do cookie). */
export async function getUser() {
  const sb = await createClient();
  const { data } = await sb.auth.getUser();
  return { sb, user: data.user };
}
