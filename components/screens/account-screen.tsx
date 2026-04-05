"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { AppShell } from "../layout/app-shell";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { EmptyState } from "../ui/empty-state";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { useAuthSession } from "../../lib/auth-session";
import { useAccountNotifications } from "../../lib/account-notifications";
import { getRoleLabel } from "../../lib/navigation";
import type { AuthRole, MockUser } from "../../lib/types";

interface ProfileFormState {
  fullName: string;
  alias: string;
  cpf: string;
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
  city: string;
  phone: string;
  bio: string;
  category: string;
  availability: string;
  pixKey: string;
  preference: string;
}

const profileCompleteKey = (role: AuthRole) => `sigillus-account-profile-complete-${role}`;

function readStorageFlag(key: string) {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(key) === "true";
}

function initialFormState(user: MockUser | null): ProfileFormState {
  return {
    fullName: user?.fullName ?? "",
    alias: "",
    cpf: "",
    email: user?.email ?? "",
    confirmEmail: user?.email ?? "",
    password: "",
    confirmPassword: "",
    city: "",
    phone: "",
    bio: "",
    category: "",
    availability: "",
    pixKey: "",
    preference: "",
  };
}

export function AccountScreen() {
  const { role, user, logout } = useAuthSession();

  if (!user || role === "visitor") {
    return (
      <AppShell>
        <EmptyState
          title="Conta indisponível"
          description="Acesse com uma conta de Cliente ou Profissional para completar o cadastro."
          actionLabel="Entrar"
          onAction={() => {
            window.location.href = "/auth/login";
          }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AccountWorkspace key={role} role={role} user={user} onLogout={logout} />
    </AppShell>
  );
}

function AccountWorkspace({ role, user, onLogout }: { role: Exclude<AuthRole, "visitor">; user: MockUser; onLogout: () => void }) {
  const { notifications, unreadCount, bannerClosed, setBannerClosed, markAllAsRead } = useAccountNotifications(role);
  const [profileCompleted, setProfileCompleted] = useState<boolean>(() => readStorageFlag(profileCompleteKey(role)));
  const [step, setStep] = useState<1 | 2>(1);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileFormState>(() => initialFormState(user));

  const updateField =
    <FieldName extends keyof ProfileFormState>(fieldName: FieldName) =>
      (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = event.target.value;
        setForm((current) => ({ ...current, [fieldName]: value }));
      };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(profileCompleteKey(role), String(profileCompleted));
  }, [profileCompleted, role]);

  const showBanner = !profileCompleted && !bannerClosed && unreadCount > 0;

  const openCompletionStep = () => {
    markAllAsRead();
    setStep(2);
    setBannerClosed(true);
    setTimeout(() => {
      document.getElementById("profile-workflow")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };

  const handleSaveProfile = () => {
    setProfileCompleted(true);
    markAllAsRead();
    setBannerClosed(true);
    setSaveMessage("Cadastro concluído. Sua conta está pronta para uso.");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/70 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Configuração da conta</p>
          <h1 className="text-3xl font-semibold text-zinc-900">Complete seu perfil</h1>
          <p className="max-w-2xl text-sm text-zinc-600">
            {role === "cliente"
              ? "Finalize seus dados e preferências para contratar, acompanhar e organizar suas interações com mais fluidez."
              : "Finalize seus dados e preferências para gerenciar anúncios, atendimento e disponibilidade com mais segurança."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
          >
            Sair
          </button>
        </div>
      </section>

      {showBanner ? (
        <Card className="border-zinc-200 bg-white shadow-sm shadow-zinc-200/70">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Notificação</p>
              <h2 className="mt-1 text-lg font-semibold text-zinc-900">Complete seu cadastro para liberar o restante da plataforma</h2>
              <p className="mt-1 text-sm text-zinc-600">Você pode fechar este aviso e abrir novamente pelo sino no topo.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setBannerClosed(true)}>
                Fechar
              </Button>
              <Button onClick={openCompletionStep}>Completar cadastro</Button>
            </div>
          </div>
        </Card>
      ) : null}

      <div id="profile-workflow">
        <Card className="space-y-5 border-zinc-200 bg-white shadow-sm shadow-zinc-200/70">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Etapa {step} de 2</p>
              <h2 className="mt-1 text-2xl font-semibold text-zinc-900">{step === 1 ? "Dados iniciais" : "Configuração do perfil"}</h2>
            </div>
            <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Perfil: {getRoleLabel(role)}
            </div>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
            <div className={`h-full bg-black transition-all duration-300 ${step === 1 ? "w-1/2" : "w-full"}`} />
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="full-name"
                  label="Nome"
                  placeholder="Seu nome completo"
                  value={form.fullName}
                  onChange={updateField("fullName")}
                />
                <Input
                  id="alias"
                  label={role === "cliente" ? "Apelido (opcional)" : "Nome Artístico (opcional)"}
                  placeholder={role === "cliente" ? "Como deseja ser chamado(a)" : "Como deseja ser vista(o)"}
                  value={form.alias}
                  onChange={updateField("alias")}
                  hint={role === "cliente" ? "Mantenha esse campo se quiser um nome alternativo." : "Mantenha esse campo se quiser destacar seu nome artístico."}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="cpf"
                  label="CPF"
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={updateField("cpf")}
                />
                <Input
                  id="email"
                  label="Email"
                  type="email"
                  placeholder="voce@email.com"
                  value={form.email}
                  onChange={updateField("email")}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="confirm-email"
                  label="Confirmação de Email"
                  type="email"
                  placeholder="Repita seu email"
                  value={form.confirmEmail}
                  onChange={updateField("confirmEmail")}
                />
                <Input
                  id="password"
                  label="Senha"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={updateField("password")}
                />
              </div>

              <Input
                id="confirm-password"
                label="Confirmação de senha"
                type="password"
                placeholder="Repita sua senha"
                value={form.confirmPassword}
                onChange={updateField("confirmPassword")}
              />

              <div className="flex justify-end">
                <Button type="button" onClick={() => setStep(2)}>
                  Continuar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {role === "cliente" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    id="city"
                    label="Cidade"
                    placeholder="Sua cidade principal"
                    value={form.city}
                    onChange={updateField("city")}
                  />
                  <Input
                    id="phone"
                    label="Telefone"
                    placeholder="+55 (00) 00000-0000"
                    value={form.phone}
                    onChange={updateField("phone")}
                  />
                  <Select
                    id="preference"
                    label="Preferência principal"
                    options={[
                      { value: "chat", label: "Chat" },
                      { value: "acompanhamento", label: "Acompanhamento" },
                      { value: "contratacao", label: "Contratação" },
                    ]}
                    value={form.preference}
                    onChange={updateField("preference")}
                  />
                  <Input
                    id="bio"
                    label="Observações da conta"
                    placeholder="Como você prefere usar a plataforma"
                    value={form.bio}
                    onChange={updateField("bio")}
                  />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    id="city"
                    label="Cidade de atendimento"
                    placeholder="Cidade principal"
                    value={form.city}
                    onChange={updateField("city")}
                  />
                  <Input
                    id="phone"
                    label="Telefone profissional"
                    placeholder="+55 (00) 00000-0000"
                    value={form.phone}
                    onChange={updateField("phone")}
                  />
                  <Select
                    id="category"
                    label="Categoria principal"
                    options={[
                      { value: "feminina", label: "Feminina" },
                      { value: "masculina", label: "Masculina" },
                      { value: "trans", label: "Trans" },
                      { value: "casais", label: "Casais" },
                    ]}
                    value={form.category}
                    onChange={updateField("category")}
                  />
                  <Select
                    id="availability"
                    label="Disponibilidade"
                    options={[
                      { value: "livre", label: "Livre" },
                      { value: "em_atendimento", label: "Em atendimento" },
                      { value: "indisponivel", label: "Indisponível" },
                    ]}
                    value={form.availability}
                    onChange={updateField("availability")}
                  />
                  <Input
                    id="pix"
                    label="Chave Pix / repasse"
                    placeholder="Chave Pix ou conta bancária"
                    value={form.pixKey}
                    onChange={updateField("pixKey")}
                  />
                  <Input
                    id="bio"
                    label="Resumo público"
                    placeholder="Uma breve apresentação do perfil"
                    value={form.bio}
                    onChange={updateField("bio")}
                  />
                </div>
              )}

              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                {role === "cliente"
                  ? "Aqui você ajusta preferências de uso e dados de contato para manter sua conta pronta para contratar com segurança."
                  : "Aqui você ajusta a apresentação pública, disponibilidade e dados operacionais do seu perfil profissional."}
              </div>

              {saveMessage ? <p className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900">{saveMessage}</p> : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="secondary" onClick={() => setStep(1)} className="sm:w-1/3">
                  Voltar
                </Button>
                <Button type="button" onClick={handleSaveProfile} className="sm:w-2/3">
                  Salvar e liberar acesso
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
