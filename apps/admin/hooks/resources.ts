"use client";

import { useQuery } from "@tanstack/react-query";
import type { Paginated } from "@infitv/types";
import { api } from "@/lib/api";
import { qs } from "@/lib/query";
import type {
  AdminPlan,
  AdminUser,
  AuditLogEntry,
  CodeDetail,
  CodeListItem,
  CustomerDetail,
  CustomerListItem,
  DashboardStats,
  DeviceListItem,
  SessionListItem,
} from "@/lib/types";

export interface ListParams {
  page: number;
  pageSize?: number;
  search?: string;
  status?: string;
  planId?: string;
  customerId?: string;
  deviceId?: string;
  action?: string;
}

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => api.get<DashboardStats>("/admin/stats"),
  });
}

/** Planes activos e inactivos (para selects y la página de planes). */
export function usePlans() {
  return useQuery({
    queryKey: ["plans", "all"],
    queryFn: () => api.get<Paginated<AdminPlan>>("/admin/plans?page=1&pageSize=100"),
    select: (data) => data.items,
  });
}

export function useCustomers(params: ListParams) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () =>
      api.get<Paginated<CustomerListItem>>(`/admin/customers${qs(params)}`),
  });
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => api.get<CustomerDetail>(`/admin/customers/${id}`),
    enabled: id !== null,
  });
}

export function useCodes(params: ListParams) {
  return useQuery({
    queryKey: ["codes", params],
    queryFn: () =>
      api.get<Paginated<CodeListItem>>(`/admin/codes${qs(params)}`),
  });
}

export function useCode(id: string | null) {
  return useQuery({
    queryKey: ["code", id],
    queryFn: () => api.get<CodeDetail>(`/admin/codes/${id}`),
    enabled: id !== null,
  });
}

export function useDevices(params: ListParams) {
  return useQuery({
    queryKey: ["devices", params],
    queryFn: () =>
      api.get<Paginated<DeviceListItem>>(`/admin/devices${qs(params)}`),
  });
}

export function useSessions(params: ListParams) {
  return useQuery({
    queryKey: ["sessions", params],
    queryFn: () =>
      api.get<Paginated<SessionListItem>>(`/admin/sessions${qs(params)}`),
  });
}

export function useAuditLogs(params: ListParams) {
  return useQuery({
    queryKey: ["audit", params],
    queryFn: () =>
      api.get<Paginated<AuditLogEntry>>(`/admin/audit-logs${qs(params)}`),
  });
}

export function useAdminUsers(params: ListParams) {
  return useQuery({
    queryKey: ["admin-users", params],
    queryFn: () =>
      api.get<Paginated<AdminUser>>(`/admin/users${qs(params)}`),
  });
}
