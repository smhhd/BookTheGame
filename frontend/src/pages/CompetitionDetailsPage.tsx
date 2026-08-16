import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/endpoints";
import { EmptyState, ErrorState, Loading } from "../components/AsyncState";
import { TicketCard } from "../components/TicketCard";
import type { Ticket } from "../types/api";
import { formatDate, friendlyError } from "../utils/format";
import { normalizeTicket } from "../utils/tickets";

export function CompetitionDetailsPage() {
  const { matchId, competitionId } = useParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = matchId ?? competitionId;
    if (!id) {
      setError("شناسه مسابقه نامعتبر است.");
      setLoading(false);
      return;
    }

    const request = matchId
      ? api.getMatchTickets(Number(matchId))
      : api.getCompetitionTickets(Number(competitionId));

    request
      .then((data) => {
        setTickets(data.items.map(normalizeTicket));
      })
      .catch((reason) => {
        setError(friendlyError(reason));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [matchId, competitionId]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  const homeTeam = tickets[0]?.home_team || "تیم خانگی";
  const awayTeam = tickets[0]?.away_team || "تیم مهمان";
  const sportType = tickets[0]?.sport_type || "ورزش";
  const competitionName = tickets[0]?.competition_name || "مسابقه ورزشی";
  const matchDatetime = tickets[0]?.match_datetime;
  const venueName = tickets[0]?.venue_name || "—";
  const cityName = tickets[0]?.city_name || "";
  const availableTickets = tickets.filter(
    (ticket) => ticket.status === "available",
  );
  const otherTickets = tickets.filter(
    (ticket) => ticket.status !== "available",
  );

  return (
    <>
      <div className="back-bar">
        <Link to="/" className="button secondary">
          بازگشت به صفحه اصلی
        </Link>
      </div>

      <section className="competition-header">
        <div className="competition-header-copy">
          <span className="eyebrow">بلیت‌های مسابقه</span>
          <h1>
            {homeTeam} <span>vs</span> {awayTeam}
          </h1>
          <p className="match-when-where">
            <span>🕒 {formatDate(matchDatetime)}</span>
            <span>
              📍 {venueName}، {cityName}
            </span>
          </p>
          <p>
            از {availableTickets.length.toLocaleString("fa-IR")} صندلی قابل رزرو از{" "}
            {tickets.length.toLocaleString("fa-IR")} بلیت این مسابقه باقی مانده
            است.
          </p>
        </div>

        <div className="competition-summary">
          <div>
            <span>لیگ</span>
            <strong>{competitionName}</strong>
          </div>
          <div>
            <span>نوع ورزش</span>
            <strong>{sportType}</strong>
          </div>
          <div>
            <span>ظرفیت باقی‌مانده</span>
            <strong>{availableTickets.length.toLocaleString("fa-IR")}</strong>
          </div>
        </div>
      </section>

      <section className="results-section details-results">
        <div className="section-heading">
          <div>
            <span className="eyebrow">لیست بلیت‌ها</span>
            <h2>بلیت‌های مرتبط با مسابقه</h2>
          </div>
        </div>

        {!tickets.length ? (
          <EmptyState message="برای این مسابقه هنوز بلیتی ثبت نشده است." />
        ) : !availableTickets.length ? (
          <div className="inline-alert error" role="alert">
            هیچ بلیت قابل رزروی برای این مسابقه وجود ندارد؛ تمام بلیت‌ها
            فروخته یا لغو شده‌اند.
          </div>
        ) : (
          <div className="ticket-grid">
            {availableTickets.map((ticket) => (
              <TicketCard key={ticket.ticket_id} ticket={ticket} showMatchInfo={false} />
            ))}
          </div>
        )}

        {otherTickets.length > 0 && (
          <div className="soldout-section">
            <h3>بلیت‌های ناموجود</h3>
            <div className="ticket-grid">
              {otherTickets.map((ticket) => (
                <TicketCard key={ticket.ticket_id} ticket={ticket} showMatchInfo={false} />
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
