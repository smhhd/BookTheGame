import { useCallback, useEffect, useState } from "react";
import { api } from "../api/endpoints";
import { EmptyState, ErrorState, Loading } from "../components/AsyncState";
import { StatusBadge } from "../components/StatusBadge";
import type { Report, Reservation } from "../types/api";
import { formatDate, formatPrice, friendlyError } from "../utils/format";

export function SupportPage() {
  const [tab, setTab] = useState<"reports" | "reservations" | "payments">(
    "reports",
  );
  const [reports, setReports] = useState<Report[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [payments, setPayments] = useState<Array<Record<string, unknown>>>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "reports")
        setReports((await api.adminReports(filter || undefined)).items);
      else if (tab === "reservations")
        setReservations((await api.adminReservations(filter || undefined)).items);
      else setPayments(await api.suspiciousPayments());
    } catch (reason) {
      setError(friendlyError(reason));
    } finally {
      setLoading(false);
    }
  }, [tab, filter]);
  useEffect(() => {
    void load();
  }, [load]);
  const switchTab = (next: "reports" | "reservations" | "payments") => {
    setTab(next);
    setFilter("");
  };
  const review = async (report: Report, status: "reviewed" | "rejected") => {
    const response = window.prompt(
      "پاسخ پشتیبان برای کاربر:",
      report.support_response ?? "",
    );
    if (response === null) return;
    try {
      await api.updateReport(report.report_id, status, response || undefined);
      await load();
    } catch (reason) {
      setError(friendlyError(reason));
    }
  };
  const changeReservation = async (
    id: string,
    status: "cancelled" | "expired",
  ) => {
    if (!window.confirm(`وضعیت رزرو ${id} به ${status} تغییر کند؟`)) return;
    try {
      await api.updateReservationStatus(id, status);
      await load();
    } catch (reason) {
      setError(friendlyError(reason));
    }
  };
  const changeTicket = async (id: string) => {
    const ticketId = window.prompt("شناسه بلیت جایگزین از همین مسابقه:");
    if (!ticketId) return;
    try {
      await api.changeReservationTicket(id, ticketId);
      await load();
    } catch (reason) {
      setError(friendlyError(reason));
    }
  };
  return (
    <div className="page">
      <span className="eyebrow">دسترسی پشتیبان</span>
      <h1>مرکز عملیات و بررسی</h1>
      <div className="tabs support-tabs">
        <button
          className={tab === "reports" ? "active" : ""}
          onClick={() => switchTab("reports")}
        >
          گزارش‌ها
        </button>
        <button
          className={tab === "reservations" ? "active" : ""}
          onClick={() => switchTab("reservations")}
        >
          رزروها
        </button>
        <button
          className={tab === "payments" ? "active" : ""}
          onClick={() => switchTab("payments")}
        >
          پرداخت مشکوک
        </button>
      </div>
      {tab !== "payments" && (
        <label className="inline-filter">
          فیلتر وضعیت
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="">همه</option>
            {tab === "reports" ? (
              <>
                <option value="pending">در انتظار</option>
                <option value="reviewed">بررسی‌شده</option>
                <option value="rejected">ردشده</option>
              </>
            ) : (
              <>
                <option value="pending">در انتظار</option>
                <option value="paid">پرداخت‌شده</option>
                <option value="cancelled">لغوشده</option>
                <option value="expired">منقضی</option>
              </>
            )}
          </select>
        </label>
      )}
      {error && <ErrorState message={error} retry={load} />}
      {loading ? (
        <Loading />
      ) : tab === "reports" ? (
        reports.length ? (
          <div className="stack">
            {reports.map((report) => (
              <article className="admin-row" key={report.report_id}>
                <div>
                  <div className="reservation-title">
                    <h3>
                      گزارش {report.report_id} · {report.category_name}
                    </h3>
                    <StatusBadge status={report.status} />
                  </div>
                  <p>{report.description}</p>
                  <small>
                    {report.first_name} {report.last_name} ·{" "}
                    {formatDate(report.created_at)}
                  </small>
                </div>
                <div className="row-actions">
                  <button onClick={() => review(report, "reviewed")}>
                    بررسی شد
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => review(report, "rejected")}
                  >
                    رد گزارش
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState />
        )
      ) : tab === "reservations" ? (
        reservations.length ? (
          <div className="stack">
            {reservations.map((reservation) => (
              <article
                className="admin-row"
                key={reservation.reservation_id}
              >
                <div>
                  <div className="reservation-title">
                    <h3>رزرو {reservation.reservation_id}</h3>
                    <StatusBadge status={reservation.status} />
                  </div>
                  <p>
                    {reservation.home_team} — {reservation.away_team}
                  </p>
                  <small>
                    {formatDate(reservation.created_at)} ·{" "}
                    {formatPrice(reservation.price_at_reservation)}
                  </small>
                </div>
                {reservation.status === "pending" && (
                  <div className="row-actions">
                    <button
                      onClick={() =>
                        changeTicket(reservation.reservation_id)
                      }
                    >
                      تغییر بلیت
                    </button>
                    <button
                      className="danger-button"
                      onClick={() =>
                        changeReservation(reservation.reservation_id, "cancelled")
                      }
                    >
                      لغو
                    </button>
                    <button
                      className="secondary"
                      onClick={() =>
                        changeReservation(reservation.reservation_id, "expired")
                      }
                    >
                      منقضی
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState />
        )
      ) : payments.length ? (
        <div className="data-table" role="table">
          {payments.map((payment) => (
            <div className="admin-row" key={String(payment.payment_id)}>
              <div>
                <strong>پرداخت {String(payment.payment_id)}</strong>
                <p>
                  {formatPrice(String(payment.amount))} ·{" "}
                  {String(payment.method)}
                </p>
              </div>
              <div>
                <StatusBadge status={String(payment.status)} />
                <small>
                  {Array.isArray(payment.reasons)
                    ? payment.reasons.join("، ")
                    : ""}
                </small>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="پرداخت مشکوکی شناسایی نشد." />
      )}
    </div>
  );
}
