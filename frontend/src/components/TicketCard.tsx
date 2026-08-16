import { Link } from "react-router-dom";
import type { Ticket } from "../types/api";
import { formatDate, formatPrice } from "../utils/format";
import { StatusBadge } from "./StatusBadge";

export function TicketCard({
  ticket,
  showMatchInfo = true,
}: {
  ticket: Ticket;
  showMatchInfo?: boolean;
}) {
  return (
    <article
      className={`ticket-card${ticket.status === "available" ? "" : " unavailable"}`}
    >
      <div className="ticket-card-top">
        <span className="sport-tag">{ticket.sport_type}</span>
        <StatusBadge status={ticket.status} />
      </div>
      <h2>
        {ticket.home_team} <span>—</span> {ticket.away_team}
      </h2>
      <dl className="ticket-meta">
        {showMatchInfo && (
          <>
            <div>
              <dt>زمان</dt>
              <dd>{formatDate(ticket.match_datetime)}</dd>
            </div>
            <div>
              <dt>محل</dt>
              <dd>
                {ticket.venue_name}، {ticket.city_name}
              </dd>
            </div>
          </>
        )}
        <div>
          <dt>رده</dt>
          <dd>{ticket.category_name}</dd>
        </div>
        <div>
          <dt>جایگاه</dt>
          <dd className="seat-info">
            بخش {ticket.section_name || "—"} · ردیف {ticket.row_number || "—"} ·
            صندلی {ticket.seat_number || "—"}
          </dd>
        </div>
      </dl>
      <div className="ticket-card-footer">
        <strong>{formatPrice(ticket.price)}</strong>
        <Link className="button secondary" to={`/tickets/${ticket.ticket_id}`}>
          جزئیات بلیت
        </Link>
      </div>
    </article>
  );
}
