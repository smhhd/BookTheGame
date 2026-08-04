import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../api/endpoints";
import { ErrorState, Loading } from "../components/AsyncState";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import type { Ticket } from "../types/api";
import { formatDate, formatPrice, friendlyError } from "../utils/format";

export function TicketDetailsPage() {
  const { ticketId = "" } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api.ticket(ticketId).then(setTicket).catch((reason) => setError(friendlyError(reason))); }, [ticketId]);
  if (error) return <div className="page"><ErrorState message={error} /></div>;
  if (!ticket) return <Loading />;
  const reserveTo = user ? `/reserve/${ticketId}` : "/auth";
  const reserveState = user ? { ticket } : { from: `/reserve/${ticketId}` };
  return <div className="page details-page">
    <Link className="back-link" to={`/${location.search}`}>بازگشت به جستجو</Link>
    <section className="details-hero"><div><span className="sport-tag">{ticket.sport_type}</span><h1>{ticket.home_team} <span>—</span> {ticket.away_team}</h1><p>{ticket.competition_name || "مسابقه ورزشی"}</p></div><div className="price-box"><small>قیمت هر بلیت</small><strong>{formatPrice(ticket.price)}</strong><StatusBadge status={ticket.status} /></div></section>
    <section className="details-grid">
      <article className="panel"><h2>اطلاعات مسابقه</h2><dl className="details-list"><div><dt>تاریخ و ساعت</dt><dd>{formatDate(ticket.match_datetime)}</dd></div><div><dt>محل برگزاری</dt><dd>{ticket.venue_name}</dd></div><div><dt>شهر</dt><dd>{ticket.city_name}</dd></div><div><dt>رده بلیت</dt><dd>{ticket.category_name}</dd></div><div><dt>جایگاه</dt><dd>{ticket.section_name || "—"}</dd></div><div><dt>ردیف / صندلی</dt><dd>{ticket.row_number || "—"} / {ticket.seat_number || "—"}</dd></div><div><dt>ظرفیت</dt><dd>{ticket.remaining_capacity ? "یک صندلی قابل رزرو" : "تکمیل"}</dd></div></dl></article>
      <aside className="panel reserve-panel"><h2>امکانات بلیت</h2>{ticket.facilities?.length ? <ul className="facility-list">{ticket.facilities.map((facility) => <li key={facility.facilityId}>{facility.name}</li>)}</ul> : <p className="muted">امکانات ویژه‌ای ثبت نشده است.</p>}<Link className={`button full ${ticket.status !== "available" ? "disabled" : ""}`} aria-disabled={ticket.status !== "available"} to={ticket.status === "available" ? reserveTo : "#"} state={reserveState}>{user ? "ادامه و رزرو بلیت" : "ورود برای رزرو"}</Link></aside>
    </section>
  </div>;
}
