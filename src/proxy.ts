import { NextResponse, type NextRequest } from "next/server";

// Nenhuma página abre sem login: sem o cookie de sessão, qualquer link leva pro /login.
// Aqui só se checa se o cookie existe (rápido); a validação de verdade (sessão no banco,
// expiração, usuário ativo, acesso ao app) continua em cada página/rota.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("sessao")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
