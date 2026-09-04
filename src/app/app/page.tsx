import { redirect } from "next/navigation";
import { requireUsuario } from "@/lib/auth";

export default async function AppIndexPage() {
  const user = await requireUsuario();
  redirect(user.papel === "COLABORADOR" ? "/app/minhas" : "/app/dashboard");
}
