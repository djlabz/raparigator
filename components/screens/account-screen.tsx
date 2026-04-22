"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
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
  phone: string;
  city: string;
  notes: string;
  preference: string;
}

const profileCompleteKey = (role: AuthRole) => `sigillus-account-profile-complete-${role}`;
const profileFormKey = (role: AuthRole, userEmail: string) => `sigillus-account-profile-form-${role}-${userEmail.toLowerCase()}`;
const SAVE_CONFIRMATION_AUTO_DISMISS_MS = 3200;

type ProfileFieldErrors = Partial<Record<keyof ProfileFormState, string>>;

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
    phone: "",
    city: "",
    notes: "",
    preference: "",
  };
}

function readStoredForm(key: string, user: MockUser | null): ProfileFormState {
  if (typeof window === "undefined") {
    return initialFormState(user);
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return initialFormState(user);
    }

    const parsed = JSON.parse(raw) as Partial<ProfileFormState>;
    return {
      ...initialFormState(user),
      ...parsed,
    };
  } catch {
    return initialFormState(user);
  }
}

function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value.trim());
}

type VerificationState = {
  email: boolean;
  phone: boolean;
  document: boolean;
};

function sanitizeCpfDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function formatCpf(value: string) {
  const digits = sanitizeCpfDigits(value);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

type PasswordStrength = {
  level: 1 | 2 | 3;
  label: "Fraca" | "Moderada" | "Forte";
};

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { level: 1, label: "Fraca" };
  if (score <= 3) return { level: 2, label: "Moderada" };
  return { level: 3, label: "Forte" };
}

export function AccountScreen() {
  const { role, user } = useAuthSession();

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
      <AccountWorkspace key={role} role={role} user={user} />
    </AppShell>
  );
}

function AccountWorkspace({ role, user }: { role: Exclude<AuthRole, "visitor">; user: MockUser }) {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/feed");
  };

  const { unreadCount, bannerClosed, setBannerClosed, markAllAsRead } = useAccountNotifications(role);
  const [profileCompleted, setProfileCompleted] = useState<boolean>(() => readStorageFlag(profileCompleteKey(role)));
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [form, setForm] = useState<ProfileFormState>(() => readStoredForm(profileFormKey(role, user.email), user));

  const clearFieldError = <FieldName extends keyof ProfileFormState>(fieldName: FieldName) => {
    setFieldErrors((current) => {
      if (!current[fieldName]) {
        return current;
      }

      const next = { ...current };
      delete next[fieldName];
      return next;
    });
  };

  const updateField =
    <FieldName extends keyof ProfileFormState>(fieldName: FieldName) =>
      (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = event.target.value;
        setForm((current) => ({ ...current, [fieldName]: value }));
        setSaveMessage(null);
        clearFieldError(fieldName);
      };

  const handleCpfChange = (event: ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCpf(event.target.value);
    setForm((current) => ({ ...current, cpf: formattedValue }));
    setSaveMessage(null);
    clearFieldError("cpf");
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(profileCompleteKey(role), String(profileCompleted));
  }, [profileCompleted, role]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(profileFormKey(role, user.email), JSON.stringify(form));
  }, [form, role, user.email]);

  useEffect(() => {
    if (!saveMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveMessage(null);
    }, SAVE_CONFIRMATION_AUTO_DISMISS_MS);

    return () => window.clearTimeout(timeoutId);
  }, [saveMessage]);

  const showBanner = !profileCompleted && !bannerClosed && unreadCount > 0;

  const openCompletionStep = () => {
    markAllAsRead();
    setBannerClosed(true);
    setTimeout(() => {
      document.getElementById("profile-workflow")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };

  const validateForm = () => {
    const nextErrors: ProfileFieldErrors = {};
    const cpfDigits = form.cpf.replace(/\D/g, "");
    const phoneDigits = form.phone.replace(/\D/g, "");
    const hasPasswordChange = form.password.trim().length > 0 || form.confirmPassword.trim().length > 0;

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Informe seu nome completo.";
    }

    if (cpfDigits.length !== 11) {
      nextErrors.cpf = "CPF inválido.";
    }

    if (!isValidEmail(form.email)) {
      nextErrors.email = "Informe um email válido.";
    }

    if (form.confirmEmail.trim() !== form.email.trim()) {
      nextErrors.confirmEmail = "Os emails não coincidem.";
    }

    if (phoneDigits.length < 10) {
      nextErrors.phone = "Informe um telefone válido com DDD.";
    }

    if (hasPasswordChange) {
      if (form.password.trim().length < 8) {
        nextErrors.password = "A senha deve ter ao menos 8 caracteres.";
      }

      if (form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = "As senhas não coincidem.";
      }
    }

    if (role === "cliente") {
      if (!form.city.trim()) {
        nextErrors.city = "Informe sua cidade.";
      }

      if (!form.preference.trim()) {
        nextErrors.preference = "Selecione uma preferência principal.";
      }
    }

    setFieldErrors(nextErrors);
    const isValid = Object.keys(nextErrors).length === 0;
    setFormError(isValid ? null : "Revise os campos destacados para continuar.");

    return isValid;
  };

  const handleSaveProfile = () => {
    if (!validateForm()) {
      setSaveMessage(null);
      return;
    }

    setProfileCompleted(true);
    markAllAsRead();
    setBannerClosed(true);
    setFieldErrors({});
    setFormError(null);
    setSaveMessage("Dados da conta salvos com sucesso.");
  };

  const openOperationalSettings = () => {
    window.location.href = "/profissional/dashboard?tab=Anúncio";
  };

  const openVerificationSettings = () => {
    window.location.href = "/profissional/dashboard?tab=Verificação";
  };

  const passwordStrength = getPasswordStrength(form.password);
  const verificationState: VerificationState = {
    email: isValidEmail(form.email) && form.confirmEmail.trim() === form.email.trim(),
    phone: false,
    document: false,
  };
  const verifiedItems = [verificationState.email, verificationState.phone, verificationState.document].filter(Boolean).length;
  const verificationProgress = Math.round((verifiedItems / 3) * 100);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div
        aria-hidden={!saveMessage}
        className={`pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 transition-all duration-200 ease-out ${
          saveMessage ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        <div
          className={`w-full max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50/95 px-4 py-3 text-sm text-emerald-900 shadow-xl backdrop-blur-sm transition-all duration-200 ease-out ${
            saveMessage ? "scale-100" : "scale-95"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <p className="leading-relaxed">{saveMessage}</p>
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/70 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Configuração da conta</p>
          <h1 className="text-3xl font-semibold text-zinc-900">Dados da sua conta</h1>
          <p className="max-w-2xl text-sm text-zinc-600">
            {role === "cliente"
              ? "Mantenha seus dados atualizados para uma experiência mais segura e fluida dentro da plataforma."
              : "Edite seus dados de conta e segurança. Informações do anúncio são gerenciadas no painel profissional."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleLogout}
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
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Cadastro essencial</p>
              <h2 className="mt-1 text-2xl font-semibold text-zinc-900">Informações de acesso e contato</h2>
            </div>
            <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Perfil: {getRoleLabel(role)}
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="full-name"
                label="Nome"
                placeholder="Seu nome completo"
                value={form.fullName}
                onChange={updateField("fullName")}
                error={fieldErrors.fullName}
              />
              <Input
                id="alias"
                label={role === "cliente" ? "Apelido (opcional)" : "Nome Artístico (opcional)"}
                placeholder={role === "cliente" ? "Como deseja ser chamado(a)" : "Como deseja ser vista(o)"}
                value={form.alias}
                onChange={updateField("alias")}
                hint={role === "cliente" ? "Use este campo se quiser um nome alternativo." : "Use este campo se quiser destacar seu nome artístico."}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="cpf"
                label="CPF"
                placeholder="000.000.000-00"
                value={form.cpf}
                onChange={handleCpfChange}
                error={fieldErrors.cpf}
                inputMode="numeric"
                maxLength={14}
              />
              <Input
                id="phone"
                label={role === "cliente" ? "Telefone" : "Telefone profissional"}
                type="tel"
                placeholder="+55 (00) 00000-0000"
                value={form.phone}
                onChange={updateField("phone")}
                error={fieldErrors.phone}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="voce@email.com"
                value={form.email}
                onChange={updateField("email")}
                error={fieldErrors.email}
              />
              <Input
                id="confirm-email"
                label="Confirmação de Email"
                type="email"
                placeholder="Repita seu email"
                value={form.confirmEmail}
                onChange={updateField("confirmEmail")}
                error={fieldErrors.confirmEmail}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="password"
                label="Senha"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={updateField("password")}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                error={fieldErrors.password}
              />
              <Input
                id="confirm-password"
                label="Confirmação de senha"
                type="password"
                placeholder="Repita sua senha"
                value={form.confirmPassword}
                onChange={updateField("confirmPassword")}
                error={fieldErrors.confirmPassword}
              />
            </div>

            <div
              aria-hidden={!isPasswordFocused}
              className={`-mt-1 space-y-1 overflow-hidden transition-all duration-200 ease-out ${
                isPasswordFocused ? "max-h-16 translate-y-0 opacity-100" : "pointer-events-none max-h-0 -translate-y-1 opacity-0"
              }`}
            >
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className={`h-1.5 w-12 rounded-full transition-colors ${passwordStrength.level >= 1 ? "bg-red-400" : "bg-zinc-200"}`} />
                <span className={`h-1.5 w-12 rounded-full transition-colors ${passwordStrength.level >= 2 ? "bg-amber-400" : "bg-zinc-200"}`} />
                <span className={`h-1.5 w-12 rounded-full transition-colors ${passwordStrength.level >= 3 ? "bg-emerald-500" : "bg-zinc-200"}`} />
              </div>
              <p className="text-xs text-zinc-500">Força da senha: <span className="font-medium text-zinc-700">{passwordStrength.label}</span></p>
            </div>

            {role === "cliente" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="city"
                  label="Cidade"
                  placeholder="Sua cidade principal"
                  value={form.city}
                  onChange={updateField("city")}
                  error={fieldErrors.city}
                />
                <Select
                  id="preference"
                  label="Preferência principal"
                  options={[
                    { value: "", label: "Selecione" },
                    { value: "chat", label: "Chat" },
                    { value: "acompanhamento", label: "Acompanhamento" },
                    { value: "contratacao", label: "Contratação" },
                  ]}
                  value={form.preference}
                  onChange={updateField("preference")}
                  className={fieldErrors.preference ? "border-red-500 focus:border-red-600 focus:ring-red-200" : undefined}
                />
                {fieldErrors.preference ? <p className="-mt-2 text-xs text-red-600 sm:col-span-2">{fieldErrors.preference}</p> : null}
                <Input
                  id="notes"
                  label="Observações da conta"
                  placeholder="Como você prefere usar a plataforma"
                  value={form.notes}
                  onChange={updateField("notes")}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Dados operacionais do anúncio</p>
                <h3 className="mt-2 text-lg font-semibold text-zinc-900">Localização, disponibilidade e resumo público</h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Dados de anúncio são editados no painel profissional para manter tudo centralizado.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="secondary" onClick={openOperationalSettings}>
                    Ir para gerenciar anúncio
                  </Button>
                </div>
              </div>
            )}

            {role === "cliente" ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                Aqui você mantém dados de conta e preferências pessoais para usar a plataforma com segurança.
              </div>
            ) : null}

            {formError ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{formError}</p> : null}
            <div className="flex justify-end">
              <Button type="button" onClick={handleSaveProfile} className="w-full sm:w-auto">
                Salvar dados da conta
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {role === "profissional" ? (
        <Card className="border-zinc-200 bg-white shadow-sm shadow-zinc-200/70">
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Segurança e confiança</p>
                <h3 className="mt-1 text-xl font-semibold text-zinc-900">Verifique sua conta</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Aumente a confiança do seu perfil em poucos minutos. Seus dados de validação não são compartilhados publicamente.
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={openVerificationSettings}>
                Verificar agora
              </Button>
            </div>

            <div className="space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${verificationProgress}%` }} />
              </div>
              <p className="text-xs font-medium text-zinc-500">{verifiedItems} de 3 etapas concluídas</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className={`rounded-xl border p-3 ${verificationState.email ? "border-emerald-200 bg-emerald-50/70" : "border-zinc-200 bg-zinc-50"}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">E-mail</p>
                <p className={`mt-1 text-sm font-semibold ${verificationState.email ? "text-emerald-700" : "text-zinc-700"}`}>{verificationState.email ? "Validado" : "Pendente"}</p>
              </div>
              <div className={`rounded-xl border p-3 ${verificationState.phone ? "border-emerald-200 bg-emerald-50/70" : "border-zinc-200 bg-zinc-50"}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Telefone</p>
                <p className={`mt-1 text-sm font-semibold ${verificationState.phone ? "text-emerald-700" : "text-zinc-700"}`}>{verificationState.phone ? "Validado" : "Verificar"}</p>
              </div>
              <div className={`rounded-xl border p-3 ${verificationState.document ? "border-emerald-200 bg-emerald-50/70" : "border-zinc-200 bg-zinc-50"}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Documento</p>
                <p className={`mt-1 text-sm font-semibold ${verificationState.document ? "text-emerald-700" : "text-zinc-700"}`}>{verificationState.document ? "Validado" : "Verificar"}</p>
              </div>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
