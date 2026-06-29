"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  User,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  UserPlus,
  ShieldX,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { AdminLayoutShell } from "./admin-layout-shell";
import { getDashboardStats } from "@/lib/admin-service";
import type { AdminActivityLog, DashboardStats } from "@/lib/types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `há ${mins}min`;
  if (hours < 24) return `há ${hours}h`;
  return `há ${days}d`;
}

function ActivityIcon({ action }: { action: AdminActivityLog["action"] }) {
  switch (action) {
    case "profile_approved":
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case "profile_rejected":
      return <XCircle className="h-4 w-4 text-red-400" />;
    case "profile_submitted":
      return <Clock className="h-4 w-4 text-amber-400" />;
    case "client_registered":
      return <UserPlus className="h-4 w-4 text-blue-400" />;
    case "account_suspended":
      return <ShieldX className="h-4 w-4 text-orange-400" />;
    case "account_reinstated":
      return <ShieldCheck className="h-4 w-4 text-emerald-400" />;
  }
}

function activityLabel(log: AdminActivityLog): string {
  switch (log.action) {
    case "profile_approved":
      return `${log.targetName} — perfil aprovado`;
    case "profile_rejected":
      return `${log.targetName} — perfil recusado`;
    case "profile_submitted":
      return `${log.targetName} — perfil submetido para análise`;
    case "client_registered":
      return `${log.targetName} — novo cadastro de cliente`;
    case "account_suspended":
      return `${log.targetName} — conta suspensa`;
    case "account_reinstated":
      return `${log.targetName} — conta reativada`;
  }
}

export function AdminDashboardScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await getDashboardStats();
    setStats(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => { await load(); })();
  }, [load]);

  const maxBar = stats
    ? Math.max(...stats.weeklySignups.map((d) => d.clients + d.professionals), 1)
    : 1;

  return (
    <AdminLayoutShell breadcrumb="Dashboard">
      {loading || !stats ? (
        <div className="flex items-center justify-center py-20">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-wine-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                label: "Total de Clientes",
                value: stats.totalClients,
                icon: User,
                color: "text-blue-400",
                bg: "bg-blue-900/20 border-blue-800/40",
                href: "/admin/clientes",
              },
              {
                label: "Profissionais Ativos",
                value: stats.totalProfessionals,
                icon: Users,
                color: "text-wine-400",
                bg: "bg-wine-900/20 border-wine-800/40",
                href: "/admin/profissionais",
              },
              {
                label: "Em Análise",
                value: stats.pendingReview,
                icon: Clock,
                color: "text-amber-400",
                bg: "bg-amber-900/20 border-amber-800/40",
                href: "/admin/perfis",
              },
              {
                label: "Novos (7 dias)",
                value: stats.newThisWeek,
                icon: TrendingUp,
                color: "text-emerald-400",
                bg: "bg-emerald-900/20 border-emerald-800/40",
                href: "/admin/clientes",
              },
            ].map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className={`group rounded-2xl border p-5 transition-all hover:brightness-110 ${stat.bg}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      {stat.label}
                    </p>
                    <p className={`mt-2 text-4xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                  <stat.icon className={`h-6 w-6 ${stat.color} opacity-60`} />
                </div>
                <div className={`mt-3 flex items-center gap-1 text-[11px] font-semibold ${stat.color} opacity-60`}>
                  Ver detalhes <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* ── Gráfico semanal ── */}
            <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="mb-5 flex items-center justify-between">
                <p className="font-semibold text-zinc-200">Cadastros — últimos 7 dias</p>
                <div className="flex items-center gap-4 text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-wine-600" />
                    Clientes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-zinc-600" />
                    Profissionais
                  </span>
                </div>
              </div>

              <div className="flex h-36 items-end justify-between gap-2">
                {stats.weeklySignups.map((day) => {
                  const clientH = Math.round((day.clients / maxBar) * 144);
                  const profH = Math.round((day.professionals / maxBar) * 144);
                  return (
                    <div key={day.label} className="group flex flex-1 flex-col items-center gap-2">
                      <div className="flex w-full items-end justify-center gap-0.5">
                        <div
                          className="w-full max-w-[14px] rounded-t-sm bg-wine-600 transition-all group-hover:bg-wine-500"
                          style={{ height: `${clientH || 4}px` }}
                          title={`${day.clients} clientes`}
                        />
                        <div
                          className="w-full max-w-[14px] rounded-t-sm bg-zinc-600 transition-all group-hover:bg-zinc-500"
                          style={{ height: `${profH || 4}px` }}
                          title={`${day.professionals} profissionais`}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-600">{day.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Atividade recente ── */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <p className="mb-4 font-semibold text-zinc-200">Atividade Recente</p>
              <div className="space-y-3">
                {stats.recentActivity.map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800">
                      <ActivityIcon action={log.action} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-relaxed text-zinc-300">
                        {activityLabel(log)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-zinc-600">
                        {timeAgo(log.timestamp)}
                        {log.adminEmail && ` · ${log.adminEmail.split("@")[0]}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Ações rápidas ── */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
              Ações Rápidas
            </p>
            <div className="flex flex-wrap gap-3">
              {stats.pendingReview > 0 && (
                <Link
                  href="/admin/perfis"
                  className="flex items-center gap-2 rounded-xl border border-amber-800/60 bg-amber-900/20 px-4 py-2.5 text-sm font-semibold text-amber-400 transition-all hover:bg-amber-900/40"
                >
                  <Clock className="h-4 w-4" />
                  Revisar {stats.pendingReview} perfil{stats.pendingReview > 1 ? "is" : ""} pendente{stats.pendingReview > 1 ? "s" : ""}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
              <Link
                href="/admin/clientes"
                className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-all hover:bg-zinc-700/60"
              >
                <User className="h-4 w-4" />
                Ver todos os clientes
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/admin/profissionais"
                className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-all hover:bg-zinc-700/60"
              >
                <Users className="h-4 w-4" />
                Gerenciar profissionais
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </AdminLayoutShell>
  );
}
