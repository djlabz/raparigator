"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  UserCheck,
  UserX,
  MapPin,
  Calendar,
  ShoppingBag,
  X,
  Users,
} from "lucide-react";
import { AdminLayoutShell } from "./admin-layout-shell";
import { useAdminSession } from "@/lib/admin-session";
import { getClients, suspendClient, reinstateClient } from "@/lib/admin-service";
import type { MockClient } from "@/lib/types";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  const visible = local.slice(0, 3);
  return `${visible}${"*".repeat(Math.max(local.length - 3, 3))}@${domain}`;
}

function maskCpf(cpf: string): string {
  return cpf.replace(/^(\d{3}\.\d{3}\.)(\d{3}-\d{2})$/, "***.***.$2");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function avatarColor(name: string): string {
  const colors = [
    "bg-blue-800 text-blue-200",
    "bg-violet-800 text-violet-200",
    "bg-emerald-800 text-emerald-200",
    "bg-amber-800 text-amber-200",
    "bg-pink-800 text-pink-200",
    "bg-cyan-800 text-cyan-200",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

type FilterStatus = "all" | "active" | "suspended";

interface SuspendModal {
  client: MockClient;
  reason: string;
}

export function AdminClientsScreen() {
  const { admin } = useAdminSession();
  const [clients, setClients] = useState<MockClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [suspendModal, setSuspendModal] = useState<SuspendModal | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    setLoading(true);
    const data = await getClients();
    setClients(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => { await loadClients(); })();
  }, [loadClients]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSuspend = async () => {
    if (!admin || !suspendModal || !suspendModal.reason.trim()) return;
    setActionLoading(suspendModal.client.id);
    await suspendClient(suspendModal.client.id, admin.id, suspendModal.reason.trim());
    await loadClients();
    setActionLoading(null);
    setSuspendModal(null);
    showToast(`${suspendModal.client.fullName} foi suspenso(a).`);
  };

  const handleReinstate = async (client: MockClient) => {
    if (!admin) return;
    setActionLoading(client.id);
    await reinstateClient(client.id, admin.id);
    await loadClients();
    setActionLoading(null);
    showToast(`${client.fullName} foi reativado(a).`);
  };

  const filtered = clients.filter((c) => {
    const matchStatus = filter === "all" || c.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.fullName.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    all: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    suspended: clients.filter((c) => c.status === "suspended").length,
  };

  return (
    <AdminLayoutShell breadcrumb="Clientes">
      {/* Toast */}
      {toast && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-200 shadow-2xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Gestão de Clientes</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {counts.active} ativos · {counts.suspended} suspensos
          </p>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <input
            type="search"
            placeholder="Nome, e-mail ou cidade…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-4 text-sm text-zinc-300 placeholder-zinc-600 outline-none transition-all focus:border-zinc-600"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1 w-fit">
        {(["all", "active", "suspended"] as FilterStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              filter === f
                ? "bg-zinc-800 text-zinc-100 shadow"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Suspensos"}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === f ? "bg-wine-700 text-white" : "bg-zinc-800 text-zinc-500"}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-wine-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/30 py-20 text-center">
          <Users className="mb-3 h-10 w-10 text-zinc-700" />
          <p className="text-sm font-semibold text-zinc-500">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          {/* Table header */}
          <div className="hidden grid-cols-[auto_1fr_1fr_1fr_auto_auto_auto] items-center gap-4 border-b border-zinc-800 bg-zinc-900/80 px-5 py-3 md:grid">
            {["", "Nome", "E-mail", "Localização", "Cadastro", "Atendimentos", ""].map((h, i) => (
              <p key={i} className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                {h}
              </p>
            ))}
          </div>

          <div className="divide-y divide-zinc-800/60">
            {filtered.map((client) => (
              <div
                key={client.id}
                className="grid grid-cols-1 gap-3 bg-zinc-900/40 px-5 py-4 transition-colors hover:bg-zinc-900/80 md:grid-cols-[auto_1fr_1fr_1fr_auto_auto_auto] md:items-center md:gap-4"
              >
                {/* Avatar */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColor(client.fullName)}`}
                >
                  {client.fullName.charAt(0)}
                </div>

                {/* Nome + status */}
                <div>
                  <p className="font-medium text-zinc-200">{client.fullName}</p>
                  <div className="mt-0.5">
                    {client.status === "active" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                        <UserCheck className="h-3 w-3" /> Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400">
                        <UserX className="h-3 w-3" /> Suspenso
                      </span>
                    )}
                  </div>
                </div>

                {/* E-mail + CPF */}
                <div>
                  <p className="text-sm text-zinc-400">{maskEmail(client.email)}</p>
                  <p className="text-[11px] text-zinc-600">{maskCpf(client.cpf)}</p>
                </div>

                {/* Localização */}
                <div className="flex items-center gap-1 text-sm text-zinc-400">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                  {client.city}, {client.state}
                </div>

                {/* Data de cadastro */}
                <div className="flex items-center gap-1 text-sm text-zinc-500">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                  {formatDate(client.registeredAt)}
                </div>

                {/* Atendimentos */}
                <div className="flex items-center gap-1 text-sm text-zinc-400">
                  <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                  {client.totalBookings}
                </div>

                {/* Ação */}
                <div>
                  {client.status === "active" ? (
                    <button
                      onClick={() => setSuspendModal({ client, reason: "" })}
                      disabled={actionLoading === client.id}
                      className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-900/20 disabled:opacity-50"
                    >
                      Suspender
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReinstate(client)}
                      disabled={actionLoading === client.id}
                      className="rounded-lg border border-emerald-900/50 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-900/20 disabled:opacity-50"
                    >
                      {actionLoading === client.id ? "…" : "Reativar"}
                    </button>
                  )}
                </div>

                {/* Motivo de suspensão (expanded) */}
                {client.status === "suspended" && client.suspensionReason && (
                  <div className="col-span-full rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs text-red-400">
                    <span className="font-semibold">Motivo:</span> {client.suspensionReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de suspensão */}
      {suspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-red-400" />
                <h2 className="font-semibold text-zinc-100">Suspender cliente</h2>
              </div>
              <button
                onClick={() => setSuspendModal(null)}
                className="rounded-lg p-1 text-zinc-600 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-1 text-sm font-medium text-zinc-300">{suspendModal.client.fullName}</p>
            <p className="mb-4 text-sm text-zinc-500">
              Informe o motivo da suspensão. Este registro ficará salvo no histórico do cliente.
            </p>

            <textarea
              value={suspendModal.reason}
              onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })}
              placeholder="Ex: Comportamento inadequado relatado por profissional…"
              rows={3}
              className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all focus:border-red-700/60"
            />

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setSuspendModal(null)}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSuspend}
                disabled={!suspendModal.reason.trim() || actionLoading !== null}
                className="flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {actionLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <UserX className="h-4 w-4" />
                )}
                Confirmar suspensão
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayoutShell>
  );
}
