import type { Metadata } from "next";
import { EntrarClient } from "@/components/EntrarClient";

export const metadata: Metadata = { title: "Entrar" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return <EntrarClient next={typeof next === "string" ? next : "/"} />;
}
