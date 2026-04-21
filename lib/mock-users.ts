import type { AuthRole, MockUser } from "@/lib/types";

export const mockUsers: MockUser[] = [
  {
    id: "cliente-sigillus",
    role: "cliente",
    fullName: "Cliente Sigillus",
    email: "cliente@sigillus.dev",
    password: "Cliente@123",
    label: "Perfil Cliente",
  },
  {
    id: "profissional-sigillus",
    role: "profissional",
    fullName: "Profissional Sigillus",
    email: "profissional@sigillus.dev",
    password: "Profissional@123",
    label: "Perfil Profissional",
  },
];

export function getMockUserByRole(role: Exclude<AuthRole, "visitor">) {
  return mockUsers.find((user) => user.role === role) ?? mockUsers[0];
}
