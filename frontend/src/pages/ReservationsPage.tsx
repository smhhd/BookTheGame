import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/endpoints";
import { Countdown } from "../components/Countdown";
import { EmptyState, ErrorState, Loading } from "../components/AsyncState";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import type { Reservation } from "../types/api";
import { formatDate, formatPrice, friendlyError } from "../utils/format";

export function ReservationsPage() {
  const { refreshUser } = useAuth();
  const [active, setActive] = useState<Reservation[]>([]);
  const [history, setHistory] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cancelling, setCancelling] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [current, past] = await Promise.all([
        api.activeReservations(),
        api.reservationHistory(),
      ]);
      setActive(current);
      setHistory(past.items);
    } catch (reason) {
      setError(friendlyError(reason));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const cancelReservation = async (reservation: Reservation) => {
    setCancelling(reservation.reservation_id);
    setNotice("");
    try {
      const penalty = await api.penalty(reservation.reservation_id);
      const accepted = window.confirm(
        `جریمه کنسلی ${formatPrice(penalty.penaltyAmount)} و مبلغ قابل استرداد ${formatPrice(penalty.refundableAmount)} است. ادامه می‌دهید؟`,
      );
      if (accepted) {
        const result = await api.cancel(
          reservation.reservation_id,
          "Cancelled from web client",
        );
        await Promise.all([refreshUser(), load()]);
        setNotice(
          result?.refund?.walletBalance
            ? `رزرو لغو شد و مبلغ ${formatPrice(result.refund.amount)} به کیف پول شما برگشت. موجودی جدید: ${formatPrice(result.refund.walletBalance)}`
            : "رزرو با موفقیت لغو شد.",
        );
      }
    } catch (reason) {
      setError(friendlyError(reason));
    } finally {
      setCancelling("");
    }
  };
  const card = (reservation: Reservation, isActive = false) => (
    <article className="reservation-card" key={reservation.reservation_id}>
      <div>
        <div className="reservation-title">
          <h3>
            {reservation.home_team} — {reservation.away_team}
          </h3>
          <StatusBadge status={reservation.status} />
        </div>
        <p>
          {reservation.venue_name} · {formatDate(reservation.match_datetime)}
        </p>
        <small>
          ایجاد: {formatDate(reservation.created_at)} · مبلغ:{" "}
          {formatPrice(reservation.price_at_reservation)}
        </small>
      </div>
      <div className="reservation-actions">
        {isActive && (
          <>
            <Countdown until={reservation.reserved_until} />
            <Link className="button" to={`/pay/${reservation.reservation_id}`}>
              پرداخت
            </Link>
          </>
        )}
        {["pending", "paid"].includes(reservation.status) && (
          <button
            className="danger-button"
            disabled={cancelling === reservation.reservation_id}
            onClick={() => cancelReservation(reservation)}
          >
            {cancelling === reservation.reservation_id
              ? "در حال بررسی…"
              : "لغو رزرو"}
          </button>
        )}
      </div>
    </article>
  );
  if (loading) return <Loading />;
  return (
    <div className="page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">حساب من</span>
          <h1>رزروها و خریدها</h1>
        </div>
        <button className="secondary" onClick={load}>
          به‌روزرسانی
        </button>
      </div>
      {error && <ErrorState message={error} retry={load} />}
      {notice && <div className="inline-alert success">{notice}</div>}
      <section>
        <h2>رزروهای فعال</h2>
        {active.length ? (
          <div className="stack">{active.map((item) => card(item, true))}</div>
        ) : (
          <EmptyState message="رزرو فعالی ندارید." />
        )}
      </section>
      <section>
        <h2>تاریخچه</h2>
        {history.length ? (
          <div className="stack">{history.map((item) => card(item))}</div>
        ) : (
          <EmptyState message="هنوز خرید یا رزروی ثبت نشده است." />
        )}
      </section>
    </div>
  );
}
