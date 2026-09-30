import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/supabase/env";

// Renova a sessão do Supabase a cada navegação e manda quem não está logado para /entrar.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();
  const sb = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(toSet, headers) {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  const { data } = await sb.auth.getClaims();
  const logged = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;
  const onLogin = pathname === "/entrar";

  if (!logged && !onLogin) {
    const to = new URL("/entrar", request.url);
    if (pathname !== "/") to.searchParams.set("next", pathname + search);
    return redirectKeepingCookies(to, response);
  }
  if (logged && onLogin) return redirectKeepingCookies(new URL("/", request.url), response);
  return response;
}

function redirectKeepingCookies(to: URL, from: NextResponse) {
  const res = NextResponse.redirect(to);
  from.cookies.getAll().forEach((c) => res.cookies.set(c));
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)"],
};
