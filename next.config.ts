import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Os painéis financeiros são HTML lido do disco em tempo de execução
  // (src/app/financeiro/[painel]/route.ts) — precisam entrar no deploy.
  outputFileTracingIncludes: {
    "/financeiro/*": ["./src/financeiro/**/*"],
  },
};

export default nextConfig;
