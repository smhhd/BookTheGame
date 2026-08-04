import { apiRequest, toQuery } from "./client";
import type { AuthSession, Pagination, Report, Reservation, Ticket, TicketSearchResult, User } from "../types/api";

export const api = {
  signup: (body: Record<string, unknown>) => apiRequest<AuthSession>("/api/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  requestOtp: (identifier: string) => apiRequest<{ expiresInSeconds: number; devOtp?: string }>("/api/auth/otp/request", { method: "POST", body: JSON.stringify({ identifier }) }),
  verifyOtp: (identifier: string, otp: string) => apiRequest<AuthSession>("/api/auth/otp/verify", { method: "POST", body: JSON.stringify({ identifier, otp }) }),
  me: () => apiRequest<User>("/api/users/me"),
  updateMe: (body: Record<string, unknown>) => apiRequest<User>("/api/users/me", { method: "PATCH", body: JSON.stringify(body) }),
  cities: () => apiRequest<{ items: Array<{ city_id: number; name: string; province_name: string }> }>("/api/cities"),
  venues: (cityId?: string) => apiRequest<{ items: Array<{ venue_id: number; name: string; city_name: string }> }>(`/api/venues${toQuery({ cityId })}`),
  searchTickets: (params: URLSearchParams) => apiRequest<TicketSearchResult>(`/api/tickets?${params}`),
  ticket: (id: string) => apiRequest<Ticket>(`/api/tickets/${id}`),
  reserve: (ticketIds: string[]) => apiRequest<{ orderId: string; reservedUntil: string; reservations: Reservation[] }>("/api/reservations", { method: "POST", body: JSON.stringify({ ticketIds: ticketIds.map(Number) }) }),
  activeReservations: () => apiRequest<Reservation[]>("/api/reservations/active"),
  reservationHistory: (status?: string) => apiRequest<{ items: Reservation[]; pagination: Pagination }>(`/api/reservations/history${toQuery({ status, limit: 100 })}`),
  penalty: (id: string) => apiRequest<{ originalAmount: number; penaltyPercent: number; penaltyAmount: number; refundableAmount: number }>(`/api/reservations/${id}/cancellation-penalty`),
  cancel: (id: string, reason?: string) => apiRequest<unknown>(`/api/reservations/${id}/cancel`, { method: "POST", body: JSON.stringify({ ...(reason ? { reason } : {}) }) }),
  pay: (reservationId: string, method: string) => apiRequest<Record<string, unknown>>("/api/payments", { method: "POST", body: JSON.stringify({ reservationId: Number(reservationId), method, simulateStatus: "SUCCESS" }) }),
  reports: () => apiRequest<Report[]>("/api/reports/my"),
  createReport: (body: Record<string, unknown>) => apiRequest<Report>("/api/reports", { method: "POST", body: JSON.stringify(body) }),
  adminReports: (status?: string) => apiRequest<{ items: Report[]; pagination: Pagination }>(`/api/admin/reports${toQuery({ status, limit: 100 })}`),
  adminReport: (id: string) => apiRequest<Report>(`/api/admin/reports/${id}`),
  updateReport: (id: string, status: string, response?: string) => apiRequest<Report>(`/api/admin/reports/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, ...(response ? { response } : {}) }) }),
  adminReservations: (status?: string) => apiRequest<{ items: Reservation[]; pagination: Pagination }>(`/api/admin/reservations${toQuery({ status, limit: 100 })}`),
  updateReservationStatus: (id: string, status: string) => apiRequest<unknown>(`/api/admin/reservations/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  changeReservationTicket: (id: string, ticketId: string) => apiRequest<unknown>(`/api/admin/reservations/${id}/ticket`, { method: "PATCH", body: JSON.stringify({ ticketId: Number(ticketId) }) }),
  suspiciousPayments: () => apiRequest<Array<Record<string, unknown>>>("/api/admin/payments/suspicious")
};
