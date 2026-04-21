"use client"; // Importante para gerenciar estado no cliente

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { InfoBanner } from "@/components/ui/info-banner";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";

// Função auxiliar para aplicar a máscara de CPF (Formata: 000.000.000-00)
// E remove qualquer caractere que não seja número (Previne: letras, símbolos)
const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, "") // Remove tudo que não for número (Fulfillment Requirement)
    .replace(/(\d{3})(\d)/, "$1.$2") // Coloca o primeiro ponto
    .replace(/(\d{3})(\d)/, "$1.$2") // Coloca o segundo ponto
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2") // Coloca o hífen
    .replace(/(-\d{2})\d+?$/, "$1"); // Impede mais de 11 dígitos total (14 com a máscara)
};

export function ClientSignupScreen() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cpfValue, setCpfValue] = useState("");
  const [fullName, setFullName] = useState("");
  const [nicknameEnabled, setNicknameEnabled] = useState(false);
  const [nickname, setNickname] = useState("");

  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailError, setEmailError] = useState<string | undefined>();
  const [confirmEmailError, setConfirmEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | undefined>();
  const [cpfError, setCpfError] = useState<string | undefined>();
  const [fullNameError, setFullNameError] = useState<string | undefined>();
  const [shakeStep, setShakeStep] = useState<1 | 2 | null>(null);

  const [toast, setToast] = useState<{ title: string; message: string; type: "success" | "error" | "info" } | null>(null);

  const iconClassName = "h-4 w-4";

  const showToast = (payload: { title: string; message: string; type: "success" | "error" | "info" }) => {
    setToast(payload);
    setTimeout(() => setToast(null), 3000);
  };

  const clearCredentialErrors = () => {
    setEmailError(undefined);
    setConfirmEmailError(undefined);
    setPasswordError(undefined);
    setConfirmPasswordError(undefined);
  };

  const clearStepOneErrors = () => {
    setCpfError(undefined);
    setFullNameError(undefined);
  };

  const triggerShake = (targetStep: 1 | 2) => {
    setShakeStep(targetStep);
    window.setTimeout(() => setShakeStep((current) => (current === targetStep ? null : current)), 320);
  };

  const handleCpfChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const masked = maskCPF(rawValue);

    // Só atualiza o estado se a máscara não estourar o limite de 14 caracteres (000.000.000-00)
    // Isso previne que o usuário cole um CPF com caracteres extras.
    if (masked.length <= 14) {
      setCpfValue(masked);
    }
  };

  const handleNicknameToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setNicknameEnabled(enabled);

    if (!enabled) {
      setNickname("");
    }
  };

  const validateStepOne = () => {
    let hasError = false;
    clearStepOneErrors();

    if (cpfValue.replace(/\D/g, "").length !== 11) {
      setCpfError("Informe um CPF válido.");
      hasError = true;
    }

    if (!fullName.trim()) {
      setFullNameError("Informe seu nome completo.");
      hasError = true;
    }

    if (hasError) {
      triggerShake(1);
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStepOne()) {
      showToast({
        title: "Nao foi possivel continuar",
        message: "Preencha os dados obrigatorios do passo 1.",
        type: "error",
      });
      return;
    }

    setStep(2);
  };

  const prevStep = () => {
    clearCredentialErrors();
    setStep((current) => (current === 3 ? 2 : 1));
  };

  const validateStepTwo = () => {
    let hasError = false;
    clearCredentialErrors();

    if (!email.trim()) {
      setEmailError("Dados de acesso invalidos.");
      hasError = true;
    }

    if (!confirmEmail.trim()) {
      setConfirmEmailError("Dados de acesso invalidos.");
      hasError = true;
    }

    if (email.trim() && confirmEmail.trim() && email.trim() !== confirmEmail.trim()) {
      setEmailError("Dados de acesso invalidos.");
      setConfirmEmailError("Dados de acesso invalidos.");
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError("Dados de acesso invalidos.");
      hasError = true;
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Dados de acesso invalidos.");
      hasError = true;
    }

    if (password && confirmPassword && password !== confirmPassword) {
      setPasswordError("Dados de acesso invalidos.");
      setConfirmPasswordError("Dados de acesso invalidos.");
      hasError = true;
    }

    if (hasError) {
      triggerShake(2);
      showToast({
        title: "Nao foi possivel continuar",
        message: "E-mail ou senha invalidos.",
        type: "error",
      });
      return false;
    }

    return true;
  };

  const handleFinishSignup = () => {
    if (!validateStepTwo()) {
      return;
    }

    setStep(3);
  };

  const handleCreateAccount = () => {
    showToast({
      title: "Dados validados",
      message: "Cadastro pronto para criacao da conta.",
      type: "success",
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 md:grid md:grid-cols-2 md:items-start">
      <section className="relative hidden h-screen overflow-hidden bg-black md:sticky md:top-0 md:block">
        <Image
          src="/modelo_criar_conta_cliente_1.png"
          alt="Modelo para criacao de conta cliente"
          fill
          priority
          quality={100}
          className="object-contain object-center"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-linear-to-br from-black/55 via-black/25 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-wine-900/35 via-transparent to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-end px-10 pb-14 text-white lg:px-14">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Cadastro cliente</p>
          <h2 className="mt-4 max-w-lg font-display text-5xl leading-[0.95] text-white lg:text-6xl">Controle premium da sua experiencia.</h2>
          <div className="mt-7 h-px w-24 bg-white/45" />
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/80">
            Entre em um ambiente com suporte dedicado, contratacao protegida e rastreabilidade completa em cada interacao.
          </p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 md:flex md:min-h-screen md:items-center md:justify-center md:px-10">
        <div className="mx-auto w-full max-w-md space-y-6">
          <header>
            <div className="flex items-center gap-2">
              <BackButton />
              <Link href="/" className="font-display text-2xl text-wine-800">
                Sigillus
              </Link>
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-zinc-900">Crie sua conta Sigillus</h1>
            <p className="mt-1 text-base text-zinc-700">Passo {step} de 3: {step === 1 ? "Dados iniciais" : step === 2 ? "Credenciais de acesso" : "Revisao final"}</p>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
              <div className={`h-full bg-wine-800 transition-all duration-300 ease-in-out ${step === 1 ? "w-1/3" : step === 2 ? "w-2/3" : "w-full"}`} />
            </div>
          </header>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-300/40 md:p-6">
            <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-4 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">Passo 1: Dados iniciais</p>
                    <p className="text-sm text-zinc-700">Informe seus dados civis e configure como deseja ser chamada(o).</p>
                  </div>

                  <Input
                    id="cpf"
                    label="Seu CPF"
                    placeholder="000.000.000-00"
                    value={cpfValue}
                    onChange={handleCpfChange}
                    maxLength={14}
                    error={cpfError}
                    className={shakeStep === 1 && cpfError ? "field-shake" : undefined}
                    premium
                    leadingIcon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <path d="M8 8h8" />
                        <path d="M8 12h5" />
                      </svg>
                    }
                  />

                  <Input
                    id="full-name"
                    label="Nome completo civil"
                    placeholder="Como consta no seu documento"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    error={fullNameError}
                    className={shakeStep === 1 && fullNameError ? "field-shake" : undefined}
                    premium
                    leadingIcon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                        <circle cx="12" cy="8" r="4" />
                        <path d="M5 20a7 7 0 0 1 14 0" />
                      </svg>
                    }
                  />

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">Usar apelido (opcional)</p>
                        <p className="text-xs text-zinc-600">Ative se quiser ser chamada(o) por um nome alternativo.</p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" className="peer sr-only" checked={nicknameEnabled} onChange={handleNicknameToggle} />
                        <div className="h-5 w-9 rounded-full bg-zinc-200 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-wine-700 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                      </label>
                    </div>
                    {nicknameEnabled ? (
                      <div className="mt-3">
                        <Input
                          id="nickname"
                          label="Apelido"
                          placeholder="Como deseja ser chamado(a)"
                          value={nickname}
                          onChange={(event) => setNickname(event.target.value)}
                          premium
                          leadingIcon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                              <path d="m12 3 2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5Z" />
                            </svg>
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-4 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">Passo 2: Credenciais de acesso</p>
                    <p className="text-sm text-zinc-700">Confirme e-mail e senha para proteger o acesso da sua conta.</p>
                  </div>

                  <Input
                    id="email"
                    label="E-mail principal"
                    type="email"
                    placeholder="voce@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    error={emailError}
                    className={shakeStep === 2 && emailError ? "field-shake" : undefined}
                    premium
                    leadingIcon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="m4 7 8 6 8-6" />
                      </svg>
                    }
                  />

                  <Input
                    id="confirm-email"
                    label="Confirmar e-mail"
                    type="email"
                    placeholder="Repita seu e-mail"
                    value={confirmEmail}
                    onChange={(event) => setConfirmEmail(event.target.value)}
                    error={confirmEmailError}
                    className={shakeStep === 2 && confirmEmailError ? "field-shake" : undefined}
                    premium
                    leadingIcon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                        <path d="M4 4h16v16H4z" />
                        <path d="m4 8 8 5 8-5" />
                      </svg>
                    }
                  />

                  <Input
                    id="password"
                    label="Crie sua senha"
                    type="password"
                    placeholder="Minimo 8 caracteres"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    error={passwordError}
                    className={shakeStep === 2 && passwordError ? "field-shake" : undefined}
                    premium
                    leadingIcon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                        <rect x="4" y="11" width="16" height="10" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                      </svg>
                    }
                  />

                  <Input
                    id="confirm-password"
                    label="Confirmar senha"
                    type="password"
                    placeholder="Repita sua senha"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    error={confirmPasswordError}
                    className={shakeStep === 2 && confirmPasswordError ? "field-shake" : undefined}
                    premium
                    leadingIcon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                        <rect x="4" y="11" width="16" height="10" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                        <path d="M9 16h6" />
                      </svg>
                    }
                  />

                  <div className="pt-2 pb-1">
                    <InfoBanner
                      title="Ambiente protegido"
                      description="Seus dados passam por criptografia ponta a ponta e monitoramento continuo de seguranca."
                      tone="secure"
                      icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClassName}>
                          <path d="M12 2a10 10 0 0 0-7 3v6c0 6 7 11 7 11s7-5 7-11V5a10 10 0 0 0-7-3Z" />
                          <path d="M8.5 11a3.5 3.5 0 0 1 7 0" />
                          <path d="M9 14h6" />
                        </svg>
                      }
                    />
                    <div className="mt-2 flex flex-wrap gap-2 pl-11 text-[11px] font-semibold uppercase tracking-[0.12em] text-wine-800">
                      <span className="rounded-full border border-wine-300 bg-wine-50 px-2.5 py-1">Seguro</span>
                      <span className="rounded-full border border-wine-300 bg-wine-50 px-2.5 py-1">SSL</span>
                      <span className="rounded-full border border-wine-300 bg-wine-50 px-2.5 py-1">LGPD</span>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-2 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">Passo 3: Revisão final</p>
                    <p className="text-sm text-zinc-700">Tudo pronto. Confira os dados obrigatórios e finalize sua conta.</p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                    <p className="font-semibold text-zinc-900">Dados validados</p>
                    <ul className="mt-2 space-y-1">
                      <li>CPF e nome civil preenchidos</li>
                      <li>E-mail confirmado</li>
                      <li>Senha confirmada</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {step > 1 ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={prevStep}
                      className="flex w-1/3 items-center justify-center border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 h-4 w-4">
                        <path d="m12 19-7-7 7-7" />
                        <path d="M19 12H5" />
                      </svg>
                      Voltar
                    </Button>
                    {step === 2 ? (
                      <Button
                        type="button"
                        onClick={handleFinishSignup}
                        className="mt-0 w-2/3 bg-wine-700 py-6 text-base text-white shadow-md shadow-wine-700/20 hover:bg-wine-800"
                      >
                        Continuar
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleCreateAccount}
                        className="mt-0 w-2/3 bg-wine-700 py-6 text-base text-white shadow-md shadow-wine-700/20 hover:bg-wine-800"
                      >
                        Criar conta
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    type="button"
                    fullWidth
                    onClick={nextStep}
                    className="mt-0 flex items-center justify-center bg-wine-700 py-6 text-base text-white shadow-md shadow-wine-700/20 hover:bg-wine-800"
                  >
                    Continuar
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1.5 h-4 w-4">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Button>
                )}
              </div>
            </form>

            {toast ? <Toast title={toast.title} message={toast.message} type={toast.type} /> : null}

            <div className="mt-8 border-t border-zinc-100 pt-6 text-center text-sm text-zinc-600">
              <p>
                Ja possui cadastro?{" "}
                <Link href="/auth/login" className="font-bold text-wine-700 hover:underline">
                  Acesse sua conta
                </Link>
              </p>
              {/* Aumentamos a margem, a fonte para text-sm e o contraste */}
              <p className="mt-4 border-t border-dashed border-zinc-200 pt-4 text-sm text-zinc-600">
                Voce e profissional e quer se cadastrar?{" "}
                {/* Link agora usa a cor da marca (wine-700) e font-bold */}
                <Link href="/auth/cadastro/profissional" className="font-bold text-wine-700 hover:underline">
                  Anuncie seu perfil aqui
                </Link>
              </p>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.17em] text-zinc-600">
                Seguro. Criptografado. Exclusivo.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
