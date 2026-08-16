import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/endpoints";
import { ErrorState, Loading } from "../components/AsyncState";
import type { Ticket } from "../types/api";
import { formatDate, formatPrice, friendlyError } from "../utils/format";

export function ReservePage() {
  const { ticketId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>((location.state as { ticket?: Ticket } | null)?.ticket ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (!ticket) api.ticket(ticketId).then(setTicket).catch((reason) => setError(friendlyError(reason))); }, [ticket, ticketId]);
  const reserve = async () => {
    setBusy(true); setError("");
    try {
      const result = await api.reserve([ticketId]);
      const reservationId = String(result.reservations[0]?.reservation_id ?? "");
      navigate(`/pay/${reservationId}`, { replace: true, state: { ticket, reservedUntil: result.reservedUntil, orderId: result.orderId } });
    } catch (reason) { setError(friendlyError(reason)); setBusy(false); }
  };
  if (!ticket && !error) return <Loading />;
  if (!ticket) return <div className="page"><ErrorState message={error} /></div>;
  return <div className="page narrow-page"><span className="eyebrow">تأیید رزرو</span><h1>این صندلی برای توست؟</h1><section className="panel checkout-summary"><h2>{ticket.home_team} — {ticket.away_team}</h2><dl className="details-list"><div><dt>زمان</dt><dd>{formatDate(ticket.match_datetime)}</dd></div><div><dt>ورزشگاه</dt><dd>{ticket.venue_name}</dd></div><div><dt>رده</dt><dd>{ticket.category_name}</dd></div><div><dt>جایگاه / ردیف / صندلی</dt><dd>{ticket.section_name} / {ticket.row_number} / {ticket.seat_number}</dd></div><div><dt>مبلغ</dt><dd>{formatPrice(ticket.price)}</dd></div></dl>{error && <div className="inline-alert error">{error}</div>}<p className="notice">بعد از ثبت، زمان دقیق انقضا از سرور دریافت و نمایش داده می‌شود.</p><button className="full" disabled={busy} onClick={reserve}>{busy ? "در حال رزرو…" : "تأیید و رزرو موقت"}</button></section></div>;
}
