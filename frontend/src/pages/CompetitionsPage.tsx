import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/endpoints";
import { Loading, EmptyState } from "../components/AsyncState";
import { Pagination } from "../components/Pagination";
import type { MatchItem } from "../types/api";
import { formatDate, friendlyError } from "../utils/format";

const ITEMS_PER_PAGE = 9;

export function CompetitionsPage() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [cities, setCities] = useState<Array<{ city_id: number; name: string }>>([]);
  const [venues, setVenues] = useState<Array<{ venue_id: number; name: string }>>([]);
  const [competitions, setCompetitions] = useState<
    Array<{ competition_id: number; name: string }>
  >([]);
  const [query, setQuery] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");
  const [venueFilter, setVenueFilter] = useState("");
  const [competitionFilter, setCompetitionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getMatches()
      .then((data) => setMatches(data.items))
      .catch((reason) => setError(friendlyError(reason)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.cities().then((data) => setCities(data.items)).catch(() => undefined);
    api.venues().then((data) => setVenues(data.items)).catch(() => undefined);
    api
      .getCompetitions()
      .then((data) => setCompetitions(data.items))
      .catch(() => undefined);
  }, []);

  const selectedCityName = cities.find(
    (city) => String(city.city_id) === cityFilter,
  )?.name;
  const venueOptions = selectedCityName
    ? venues.filter((venue) =>
        matches.some(
          (match) =>
            match.venue_name === venue.name && match.city_name === selectedCityName,
        ),
      )
    : venues;

  const sportOptions = useMemo(
    () => Array.from(new Set(matches.map((item) => item.sport_type))).sort(),
    [matches],
  );

  const filteredMatches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTime = dateTo ? new Date(dateTo).getTime() : null;
    const min = Number(minPrice || 0);
    const max = Number(maxPrice || Number.POSITIVE_INFINITY);

    return matches.filter((match) => {
      const searchTarget = [
        match.competition_name,
        match.home_team,
        match.away_team,
        match.sport_type,
        match.venue_name,
        match.city_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchTime = new Date(match.match_datetime).getTime();
      const matchMin = Number(match.min_price ?? 0);
      const matchMax = Number(match.max_price ?? 0);

      return (
        (!normalizedQuery || searchTarget.includes(normalizedQuery)) &&
        (sportFilter === "all" || match.sport_type === sportFilter) &&
        (!selectedCityName || match.city_name === selectedCityName) &&
        (!venueFilter || match.venue_name === venueFilter) &&
        (!competitionFilter ||
          String(match.competition_id) === competitionFilter) &&
        (!fromTime || matchTime >= fromTime) &&
        (!toTime || matchTime <= toTime) &&
        (!minPrice || matchMax >= min) &&
        (!maxPrice || matchMin <= max) &&
        (!onlyAvailable || Number(match.available_count ?? 0) > 0)
      );
    });
  }, [
    matches,
    query,
    sportFilter,
    selectedCityName,
    venueFilter,
    competitionFilter,
    dateFrom,
    dateTo,
    minPrice,
    maxPrice,
    onlyAvailable,
  ]);

  const totalPages = Math.ceil(filteredMatches.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMatches = filteredMatches.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, sportFilter, cityFilter, venueFilter, competitionFilter, dateFrom, dateTo, minPrice, maxPrice, onlyAvailable]);

  if (loading) return <Loading />;
  if (error)
    return (
      <EmptyState message="لیست مسابقات بارگذاری نشد؛ لطفاً بعداً تلاش کنید." />
    );

  const advancedActive = Boolean(
    cityFilter ||
      venueFilter ||
      competitionFilter ||
      dateFrom ||
      dateTo ||
      minPrice ||
      maxPrice ||
      onlyAvailable,
  );

  return (
    <>
      <section className="page-hero">
        <span className="eyebrow">پروژه Book The Game</span>
        <h1>مسابقات</h1>
        <p>
          فهرست مسابقات فعال در سیستم؛ برای دیدن بلیت‌های هر مسابقه روی آن کلیک
          کنید.
        </p>
      </section>

      <section className="search-panel" aria-label="فیلتر مسابقات">
        <form onSubmit={(event) => event.preventDefault()}>
          <label className="wide">
            جستجوی مسابقه
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="نام تیم، لیگ، شهر یا ورزش"
            />
          </label>

          <label>
            نوع مسابقه
            <select
              value={sportFilter}
              onChange={(event) => setSportFilter(event.target.value)}
            >
              <option value="all">همه</option>
              {sportOptions.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </label>

          <div className="form-actions wide advanced-toggle">
            <button
              type="button"
              className={`secondary ${showAdvanced ? "active" : ""}`}
              onClick={() => setShowAdvanced((open) => !open)}
            >
              جستجوی پیشرفته {advancedActive ? "•" : ""} {showAdvanced ? "▲" : "▼"}
            </button>
          </div>

          {showAdvanced && (
            <>
              <label>
                شهر
                <select
                  value={cityFilter}
                  onChange={(event) => {
                    setCityFilter(event.target.value);
                    setVenueFilter("");
                  }}
                >
                  <option value="">همه شهرها</option>
                  {cities.map((city) => (
                    <option key={city.city_id} value={city.city_id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                ورزشگاه
                <select
                  value={venueFilter}
                  onChange={(event) => setVenueFilter(event.target.value)}
                >
                  <option value="">همه ورزشگاه‌ها</option>
                  {venueOptions.map((venue) => (
                    <option key={venue.venue_id} value={venue.name}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                لیگ
                <select
                  value={competitionFilter}
                  onChange={(event) => setCompetitionFilter(event.target.value)}
                >
                  <option value="">همه لیگ‌ها</option>
                  {competitions.map((comp) => (
                    <option key={comp.competition_id} value={comp.competition_id}>
                      {comp.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                از تاریخ
                <input
                  type="datetime-local"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                />
              </label>

              <label>
                تا تاریخ
                <input
                  type="datetime-local"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                />
              </label>

              <label>
                حداقل قیمت
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  placeholder="مثلاً 100000"
                />
              </label>

              <label>
                حداکثر قیمت
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  placeholder="مثلاً 500000"
                />
              </label>

              <label className="checkbox-filter">
                فقط بلیت موجود
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(event) => setOnlyAvailable(event.target.checked)}
                />
              </label>
            </>
          )}
        </form>
      </section>

      {!filteredMatches.length ? (
        <EmptyState message="مسابقه‌ای با این فیلترها پیدا نشد." />
      ) : (
        <>
          <div className="competitions-grid">
            {paginatedMatches.map((match) => (
              <div key={match.match_id} className="competition-card">
                <span className="sport-tag">{match.sport_type}</span>
                <h3>
                  {match.home_team} <span>vs</span> {match.away_team}
                </h3>

                <div className="ticket-meta">
                  <div>
                    <dt>مسابقه</dt>
                    <dd>{match.competition_name || "مسابقه عمومی"}</dd>
                  </div>
                  <div>
                    <dt>زمان</dt>
                    <dd>{formatDate(match.match_datetime)}</dd>
                  </div>
                  <div>
                    <dt>محل</dt>
                    <dd>
                      {match.venue_name}، {match.city_name}
                    </dd>
                  </div>
                  <div>
                    <dt>بلیت موجود</dt>
                    <dd>
                      {Number(match.available_count ?? 0).toLocaleString("fa-IR")}
                      {Number(match.available_count ?? 0) === 0 && (
                        <span className="sold-out-badge"> تمام شده</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>قیمت</dt>
                    <dd>
                      {match.min_price && match.max_price
                        ? `${Number(match.min_price).toLocaleString("fa-IR")} - ${Number(match.max_price).toLocaleString("fa-IR")} تومان`
                        : "نامشخص"}
                    </dd>
                  </div>
                </div>

                <Link
                  className="button secondary"
                  to={`/matches/${match.match_id}/tickets`}
                >
                  مشاهده بلیت‌های مرتبط
                </Link>
              </div>
            ))}
          </div>

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPage={setCurrentPage}
          />
        </>
      )}
    </>
  );
}
