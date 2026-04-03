import Link from "next/link";
import { AuthShell } from "./auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginScreen() {
  return (
    <AuthShell
      title="Bem-vindo de volta 👋"
      description="Acesse sua conta com segurança para continuar na plataforma."
    >
      {/* Opções de Login Social (Acelera o acesso e traz modernidade) */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Button variant="secondary" className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white text-zinc-700 shadow-sm shadow-zinc-300/40 hover:-translate-y-0.5 hover:bg-zinc-50 hover:shadow-md hover:shadow-zinc-300/50">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
          Google
        </Button>
        <Button variant="secondary" className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white text-zinc-700 shadow-sm shadow-zinc-300/40 hover:-translate-y-0.5 hover:bg-zinc-50 hover:shadow-md hover:shadow-zinc-300/50">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.34-.85 3.73-.78 1.78.11 3.26.85 4.13 2.14-3.32 1.96-2.75 6.42.42 7.75-.82 1.95-1.89 3.95-3.36 5.06zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.38-2.02 4.45-3.74 4.25z" /></svg>
          Apple
        </Button>
      </div>

      {/* Divisor Visual */}
      <div className="relative flex items-center mb-6">
        <div className="grow border-t border-zinc-200"></div>
        <span className="shrink-0 px-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Ou entre com e-mail
        </span>
        <div className="grow border-t border-zinc-200"></div>
      </div>

      <form className="space-y-4">
        <Input
          id="email"
          label="E-mail"
          type="email"
          placeholder="voce@email.com"
          className="bg-zinc-50 focus:bg-white transition-colors"
        />

        <div className="space-y-1">
          {/* Supondo que o seu Input aceite children ou que possamos colocar o link perto dele */}
          <Input
            id="password"
            label="Senha"
            type="password"
            placeholder="••••••••"
            className="bg-zinc-50 focus:bg-white transition-colors"
          />
          <div className="flex justify-end pt-1">
            <Link
              href="/auth/recuperar-senha"
              className="text-xs font-semibold text-wine-700 hover:text-wine-800 hover:underline transition-all"
            >
              Esqueceu a senha?
            </Link>
          </div>
        </div>

        <Button fullWidth className="mt-2 rounded-xl border border-wine-800/30 bg-wine-700 py-6 text-base text-white shadow-lg shadow-wine-700/30 hover:-translate-y-0.5 hover:bg-wine-800 hover:shadow-xl hover:shadow-wine-700/35">
          Entrar na plataforma
        </Button>
      </form>

      {/* Rodapé de Cadastro redesenhado */}
      <div className="mt-8 pt-6 border-t border-zinc-100 flex flex-col gap-3 text-center text-sm text-zinc-600">
        <p>
          Ainda não é cliente?{' '}
          <Link href="/auth/cadastro/cliente" className="font-bold text-wine-700 hover:underline">
            Criar conta grátis
          </Link>
        </p>
        <p className="text-xs text-zinc-500">
          Você é profissional?{' '}
          <Link href="/auth/cadastro/profissional" className="font-bold text-zinc-900 hover:underline">
            Anuncie seu perfil aqui
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
