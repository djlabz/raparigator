# Identity Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extrair regras de CPF, e-mail, senha, telefone e completion de perfil para `lib/identity*`, unificar mensagens PT-BR e migrar conta + signups cliente/profissional.

**Architecture:** Módulo de domínio puro (sem store React): formatadores + validadores por campo (`string | null`) + `getProfileFieldErrors` / `isProfileFormComplete`. Telas mantêm estado de form/wizard/`localStorage`; só deixam de duplicar máscaras e critérios. `lib/profile-completion.ts` é removido após a migração da conta.

**Tech Stack:** TypeScript strict · Next.js 16 · React 19 · mocks · verificação `npm run check` + Playwright pontual em signup. Sem Vitest/Jest.

## Global Constraints

- Consumir apenas mocks/serviços em `lib/` — sem fetch para backend real
- Tipos compartilhados de usuário continuam em `lib/types.ts`; tipos do módulo em `lib/identity-types.ts`
- Textos de UI em PT-BR; sem comentários no código novo/alterado
- Imports com alias `@/`
- Não commitar a menos que o usuário peça — pular passos de commit
- Subagents SDD: apenas `cursor-grok-4.5-high-fast` ou `composer-2.5-fast`
- Rodar `npm run lint` / `npm run check` antes de encerrar
- CPF: apenas 11 dígitos (sem checksum)
- Senha: mínimo 8 caracteres + confirmação igual (signup e troca de senha)
- Telefone: ≥10 dígitos (com DDD)
- Fora de escopo: máquina de steps do wizard, persistência `localStorage` da conta, verificação e-mail/telefone (`lib/verification`), login screen, checksum CPF
- Não tocar em `components/screens/ad-details/standard-sidebar-cta.tsx` nem outros arquivos fora da lista

## Canonical messages (verbatim)

| Case | Message |
|------|---------|
| CPF inválido / incompleto | `Informe um CPF válido.` |
| Nome vazio (cliente/conta) | `Informe seu nome completo.` |
| Nome civil vazio (profissional) | `Informe seu nome civil.` |
| E-mail vazio | `Informe seu e-mail.` |
| E-mail formato inválido | `Informe um e-mail válido.` |
| Confirmação e-mail vazia | `Confirme seu e-mail.` |
| E-mails diferentes | `Os e-mails devem ser iguais.` |
| Senha vazia | `Informe sua senha.` |
| Confirmação senha vazia | `Confirme sua senha.` |
| Senha &lt; 8 | `A senha deve ter ao menos 8 caracteres.` |
| Senhas diferentes | `As senhas devem ser iguais.` |
| Telefone &lt; 10 dígitos | `Informe um telefone válido com DDD.` |
| Cidade vazia (cliente conta) | `Informe sua cidade.` |
| Preferência vazia (cliente conta) | `Selecione uma preferência principal.` |

## File Structure

| File | Responsibility |
|------|----------------|
| `lib/identity-types.ts` | `ProfileIdentityForm`, maps de erro, roles de completion |
| `lib/identity.ts` | sanitize/format + validate* + getProfileFieldErrors + isProfileFormComplete |
| `components/screens/account-screen.tsx` | Usa identity; remove helpers locais; remove import profile-completion |
| `components/screens/client-signup-screen.tsx` | Usa identity no step 1/2; remove maskCPF local |
| `components/screens/professional-signup-screen/professional-signup-screen.tsx` | Usa identity; remove formatCpf local; phone com validatePhone |
| `lib/profile-completion.ts` | **Delete** após Task 2 |
| `tests/identity-signup.spec.ts` | Smoke: senha curta bloqueia avanço no signup cliente |

---

### Task 1: `identity-types` + `identity` module

**Files:**
- Create: `lib/identity-types.ts`
- Create: `lib/identity.ts`
- Test: `npm run typecheck` (módulo isolado; profile-completion ainda existe)

**Interfaces:**
- Consumes: nada de telas; role `"cliente" | "profissional"`
- Produces:
  - Types: `ProfileIdentityRole`, `ProfileIdentityForm`, `ProfileIdentityFieldErrors`, `EmailPairErrors`, `PasswordPairErrors`
  - `sanitizeCpfDigits(value: string): string`
  - `formatCpf(value: string): string`
  - `sanitizePhoneDigits(value: string): string`
  - `formatPhone(value: string): string`
  - `validateCpf(value: string): string | null`
  - `validateRequiredName(value: string, kind: "full" | "civil"): string | null`
  - `validateEmail(value: string): string | null` — vazio → mensagem vazia; formato inválido → formato
  - `validateEmailPair(email: string, confirmEmail: string): EmailPairErrors`
  - `validatePasswordPair(password: string, confirmPassword: string): PasswordPairErrors`
  - `validatePhone(value: string): string | null`
  - `getProfileFieldErrors(role: ProfileIdentityRole, form: ProfileIdentityForm): ProfileIdentityFieldErrors`
  - `isProfileFormComplete(role: ProfileIdentityRole, form: ProfileIdentityForm): boolean`

- [ ] **Step 1: Criar `lib/identity-types.ts`**

```ts
export type ProfileIdentityRole = "cliente" | "profissional";

export type ProfileIdentityForm = {
  fullName: string;
  cpf: string;
  email: string;
  confirmEmail: string;
  phone: string;
  city: string;
  preference: string;
};

export type ProfileIdentityFieldErrors = Partial<Record<keyof ProfileIdentityForm, string>>;

export type EmailPairErrors = {
  email?: string;
  confirmEmail?: string;
};

export type PasswordPairErrors = {
  password?: string;
  confirmPassword?: string;
};
```

- [ ] **Step 2: Criar `lib/identity.ts` completo**

```ts
import type {
  EmailPairErrors,
  PasswordPairErrors,
  ProfileIdentityFieldErrors,
  ProfileIdentityForm,
  ProfileIdentityRole,
} from "@/lib/identity-types";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD_LENGTH = 8;
const CPF_LENGTH = 11;
const MIN_PHONE_DIGITS = 10;

export function sanitizeCpfDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, CPF_LENGTH);
}

export function formatCpf(value: string): string {
  const digits = sanitizeCpfDigits(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export function sanitizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function formatPhone(value: string): string {
  const digits = sanitizePhoneDigits(value);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function validateCpf(value: string): string | null {
  if (sanitizeCpfDigits(value).length !== CPF_LENGTH) {
    return "Informe um CPF válido.";
  }
  return null;
}

export function validateRequiredName(value: string, kind: "full" | "civil"): string | null {
  if (value.trim()) {
    return null;
  }
  return kind === "civil" ? "Informe seu nome civil." : "Informe seu nome completo.";
}

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Informe seu e-mail.";
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return "Informe um e-mail válido.";
  }
  return null;
}

export function validateEmailPair(email: string, confirmEmail: string): EmailPairErrors {
  const errors: EmailPairErrors = {};
  const emailError = validateEmail(email);
  if (emailError) {
    errors.email = emailError;
  }

  if (!confirmEmail.trim()) {
    errors.confirmEmail = "Confirme seu e-mail.";
  } else if (email.trim() && confirmEmail.trim() && email.trim() !== confirmEmail.trim()) {
    errors.email = "Os e-mails devem ser iguais.";
    errors.confirmEmail = "Os e-mails devem ser iguais.";
  }

  return errors;
}

export function validatePasswordPair(password: string, confirmPassword: string): PasswordPairErrors {
  const errors: PasswordPairErrors = {};

  if (!password.trim()) {
    errors.password = "Informe sua senha.";
  } else if (password.trim().length < MIN_PASSWORD_LENGTH) {
    errors.password = "A senha deve ter ao menos 8 caracteres.";
  }

  if (!confirmPassword.trim()) {
    errors.confirmPassword = "Confirme sua senha.";
  } else if (password && confirmPassword && password !== confirmPassword) {
    errors.password = "As senhas devem ser iguais.";
    errors.confirmPassword = "As senhas devem ser iguais.";
  }

  return errors;
}

export function validatePhone(value: string): string | null {
  if (sanitizePhoneDigits(value).length < MIN_PHONE_DIGITS) {
    return "Informe um telefone válido com DDD.";
  }
  return null;
}

export function getProfileFieldErrors(
  role: ProfileIdentityRole,
  form: ProfileIdentityForm,
): ProfileIdentityFieldErrors {
  const errors: ProfileIdentityFieldErrors = {};

  const fullNameError = validateRequiredName(form.fullName, "full");
  if (fullNameError) errors.fullName = fullNameError;

  const cpfError = validateCpf(form.cpf);
  if (cpfError) errors.cpf = cpfError;

  const emailPair = validateEmailPair(form.email, form.confirmEmail);
  if (emailPair.email) errors.email = emailPair.email;
  if (emailPair.confirmEmail) errors.confirmEmail = emailPair.confirmEmail;

  const phoneError = validatePhone(form.phone);
  if (phoneError) errors.phone = phoneError;

  if (role === "cliente") {
    if (!form.city.trim()) {
      errors.city = "Informe sua cidade.";
    }
    if (!form.preference.trim()) {
      errors.preference = "Selecione uma preferência principal.";
    }
  }

  return errors;
}

export function isProfileFormComplete(role: ProfileIdentityRole, form: ProfileIdentityForm): boolean {
  return Object.keys(getProfileFieldErrors(role, form)).length === 0;
}
```

Nota de ordem em `validatePasswordPair`: se senha vazia, não sobrescrever com mismatch; se senha curta e confirm vazio, manter ambos. Se senha ok (≥8) e confirm difere, mismatch nos dois. Se senha curta e confirm preenchido igual, manter erro de comprimento em `password` (não mismatch).

- [ ] **Step 3: Commit** — pular

---

### Task 2: Migrar `account-screen` e remover `profile-completion`

**Files:**
- Modify: `components/screens/account-screen.tsx`
- Delete: `lib/profile-completion.ts`
- Test: `npm run typecheck`

**Interfaces:**
- Consumes: APIs da Task 1
- Produces: conta sem helpers locais de CPF/e-mail; `isProfileFormComplete` de `@/lib/identity`

- [ ] **Step 1: Trocar imports e remover helpers locais**

Remover:
```ts
import { isProfileFormComplete } from "@/lib/profile-completion";
```
e as funções locais `isValidEmail`, `sanitizeCpfDigits`, `formatCpf`.

Adicionar:
```ts
import {
  formatCpf,
  formatPhone,
  getProfileFieldErrors,
  isProfileFormComplete,
  validatePasswordPair,
} from "@/lib/identity";
```

- [ ] **Step 2: Wire CPF/telefone e validateForm**

`handleCpfChange` usa `formatCpf` importado.

Adicionar handler de telefone (ou inline no `updateField` não — telefone precisa máscara):

```ts
const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
  setForm((current) => ({ ...current, phone: formatPhone(event.target.value) }));
  setSaveMessage(null);
  clearFieldError("phone");
};
```

No JSX do input phone, trocar `onChange={updateField("phone")}` por `onChange={handlePhoneChange}`.

Substituir corpo de `validateForm` por:

```ts
const validateForm = () => {
  const nextErrors = getProfileFieldErrors(role, {
    fullName: form.fullName,
    cpf: form.cpf,
    email: form.email,
    confirmEmail: form.confirmEmail,
    phone: form.phone,
    city: form.city,
    preference: form.preference,
  });
  setFieldErrors(nextErrors);
  const isValid = Object.keys(nextErrors).length === 0;
  setFormError(isValid ? null : "Revise os campos destacados para continuar.");
  return isValid;
};
```

(Se a mensagem de `formError` atual for outra, manter o texto **já existente** na tela para o banner genérico — só os field errors vêm do módulo.)

- [ ] **Step 3: Modal de senha**

```ts
const handlePasswordChange = () => {
  setPasswordModalError(null);
  const pair = validatePasswordPair(newPassword, confirmNewPassword);
  const firstError = pair.password ?? pair.confirmPassword;
  if (firstError) {
    setPasswordModalError(firstError);
    return;
  }
  setPasswordModalSuccess(true);
  setTimeout(() => {
    setShowPasswordModal(false);
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordModalSuccess(false);
    setSaveMessage("Senha alterada com sucesso.");
  }, 1500);
};
```

- [ ] **Step 4: Delete `lib/profile-completion.ts`**

Garantir zero imports restantes (`rg profile-completion`).

- [ ] **Step 5: Commit** — pular

---

### Task 3: Migrar `client-signup-screen`

**Files:**
- Modify: `components/screens/client-signup-screen.tsx`
- Test: typecheck

**Interfaces:**
- Consumes: `formatCpf`, `validateCpf`, `validateRequiredName`, `validateEmailPair`, `validatePasswordPair`
- Produces: step 1/2 sem `maskCPF` local; senha mín. 8

- [ ] **Step 1: Imports e remover `maskCPF` + comentários do topo do arquivo relacionados à máscara**

```ts
import {
  formatCpf,
  validateCpf,
  validateEmailPair,
  validatePasswordPair,
  validateRequiredName,
} from "@/lib/identity";
```

Remover a função `maskCPF` e comentários associados (arquivo já viola “no comments” nas linhas da máscara — limpar o que esta task tocar).

- [ ] **Step 2: `handleCpfChange`**

```ts
const handleCpfChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setCpfValue(formatCpf(event.target.value));
};
```

- [ ] **Step 3: `validateStepOne`**

```ts
const validateStepOne = () => {
  clearStepOneErrors();
  const cpfErrorMessage = validateCpf(cpfValue);
  const nameErrorMessage = validateRequiredName(fullName, "full");
  if (cpfErrorMessage) setCpfError(cpfErrorMessage);
  if (nameErrorMessage) setFullNameError(nameErrorMessage);
  if (cpfErrorMessage || nameErrorMessage) {
    triggerShake(1);
    return false;
  }
  return true;
};
```

- [ ] **Step 4: `validateStepTwo`**

```ts
const validateStepTwo = () => {
  clearCredentialErrors();
  const emailErrors = validateEmailPair(email, confirmEmail);
  const passwordErrors = validatePasswordPair(password, confirmPassword);
  if (emailErrors.email) setEmailError(emailErrors.email);
  if (emailErrors.confirmEmail) setConfirmEmailError(emailErrors.confirmEmail);
  if (passwordErrors.password) setPasswordError(passwordErrors.password);
  if (passwordErrors.confirmPassword) setConfirmPasswordError(passwordErrors.confirmPassword);
  const hasError = Boolean(
    emailErrors.email ||
      emailErrors.confirmEmail ||
      passwordErrors.password ||
      passwordErrors.confirmPassword,
  );
  if (hasError) {
    triggerShake(2);
    showToast({
      title: "Quase lá, só um ajuste",
      message: "E-mail ou senha precisam de um ajuste. Confere e tenta de novo?",
      type: "error",
    });
    return false;
  }
  return true;
};
```

- [ ] **Step 5: Commit** — pular

---

### Task 4: Migrar `professional-signup-screen`

**Files:**
- Modify: `components/screens/professional-signup-screen/professional-signup-screen.tsx`
- Test: `npm run check`

**Interfaces:**
- Consumes: `formatCpf`, `formatPhone`, `validateCpf`, `validateRequiredName`, `validateEmailPair`, `validatePasswordPair`, `validatePhone`
- Produces: sem `formatCpf` local; telefone com máscara + ≥10 dígitos

- [ ] **Step 1: Imports; remover `formatCpf` local**

```ts
import {
  formatCpf,
  formatPhone,
  validateCpf,
  validateEmailPair,
  validatePasswordPair,
  validatePhone,
  validateRequiredName,
} from "@/lib/identity";
```

- [ ] **Step 2: `validateStepOne`**

```ts
const validateStepOne = () => {
  const errors: { cpf?: string; civilName?: string } = {};
  const cpfError = validateCpf(cpf);
  const nameError = validateRequiredName(civilName, "civil");
  if (cpfError) errors.cpf = cpfError;
  if (nameError) errors.civilName = nameError;
  setStepOneErrors(errors);
  if (Object.keys(errors).length > 0) {
    triggerShake(1);
    return false;
  }
  return true;
};
```

- [ ] **Step 3: `validateStepTwo`**

```ts
const validateStepTwo = () => {
  const errors: {
    phone?: string;
    email?: string;
    confirmEmail?: string;
    password?: string;
    confirmPassword?: string;
  } = {};

  const phoneError = validatePhone(phone);
  if (phoneError) errors.phone = phoneError;

  const emailErrors = validateEmailPair(email, confirmEmail);
  if (emailErrors.email) errors.email = emailErrors.email;
  if (emailErrors.confirmEmail) errors.confirmEmail = emailErrors.confirmEmail;

  const passwordErrors = validatePasswordPair(password, confirmPassword);
  if (passwordErrors.password) errors.password = passwordErrors.password;
  if (passwordErrors.confirmPassword) errors.confirmPassword = passwordErrors.confirmPassword;

  setStepTwoErrors(errors);
  if (Object.keys(errors).length > 0) {
    triggerShake(2);
    return false;
  }
  return true;
};
```

- [ ] **Step 4: Wire onChange CPF/phone**

Onde hoje formata CPF, usar `formatCpf`. No input phone:

```ts
onChange={(event) => setPhone(formatPhone(event.target.value))}
```

- [ ] **Step 5: `npm run check`** — PASS

- [ ] **Step 6: Commit** — pular

---

### Task 5: E2E smoke senha curta + verificação final

**Files:**
- Create: `tests/identity-signup.spec.ts`
- Test: `npm run test:e2e:chromium -- tests/identity-signup.spec.ts` e `npm run check`

**Interfaces:**
- Consome UI do signup cliente em `/auth/...` — confirmar path real da rota

- [ ] **Step 1: Criar `tests/identity-signup.spec.ts`**

Rota real: `/auth/cadastro/cliente`. Labels reais: `Seu CPF`, `Nome completo civil`, `E-mail principal`, `Confirmar e-mail`, `Crie sua senha`, `Confirmar senha`. CTA dos passos 1 e 2: `Continuar`.

```ts
import { test, expect } from "@playwright/test";

test.describe("Identity signup", () => {
  test("cliente não avança no passo 2 com senha curta", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/auth/cadastro/cliente");

    await page.getByLabel("Seu CPF").fill("529.982.247-25");
    await page.getByLabel("Nome completo civil").fill("Cliente Teste");
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByLabel("E-mail principal").fill("cliente.teste@sigillus.dev");
    await page.getByLabel("Confirmar e-mail").fill("cliente.teste@sigillus.dev");
    await page.getByLabel("Crie sua senha").fill("curta");
    await page.getByLabel("Confirmar senha").fill("curta");
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByText("A senha deve ter ao menos 8 caracteres.")).toBeVisible();
  });
});
```

- [ ] **Step 2: Rodar E2E + check**

Run: `npm run test:e2e:chromium -- tests/identity-signup.spec.ts`  
Expected: 1 passed  

Run: `npm run check`  
Expected: PASS  

- [ ] **Step 3: Commit** — pular; pedir ao usuário se deseja commit

---

## Self-Review

**Spec coverage:** domínio B → Task 1; escopo A (sem wizard machine) → Tasks 2–4 só validação; CPF 11 dig → `validateCpf`; senha 8 → `validatePasswordPair`; arquivos B → identity*; API A → validadores por campo; três telas → Tasks 2–4; telefone → format/validate + pro signup; entrega SDD → header.

**Placeholder scan:** rota/labels do Task 5 preenchidos (`/auth/cadastro/cliente`).

**Type consistency:** `ProfileIdentityForm` fields match account form subset; `isProfileFormComplete` signature compatível com uso atual (`role`, form com os campos listados).
