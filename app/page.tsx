import { redirect } from "next/navigation";
import { HomeClient } from "@/components/HomeClient";
import { getUser } from "@/lib/supabase/server";

export default async function Page() {
  const { sb, user } = await getUser();
  if (!user) redirect("/entrar");
  const { data } = await sb.from("profiles").select("username").eq("id", user.id).maybeSingle();
  return <HomeClient userId={user.id} username={(data?.username as string | undefined) ?? "shinobi"} />;
}
