import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth";

export default async function RootPage() {
  const user = await getUsuarioAtual();
  redirect(user ? "/app" : "/login");
}
