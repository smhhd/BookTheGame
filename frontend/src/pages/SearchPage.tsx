import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/endpoints";
import { ErrorState, EmptyState, Loading } from "../components/AsyncState";
import { Pagination } from "../components/Pagination";
import { TicketCard } from "../components/TicketCard";
import type { TicketSearchResult } from "../types/api";
import { friendlyError } from "../utils/format";

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<TicketSearchResult | null>(null);
  const [cities, setCities] = useState<Array<{ city_id: number; name: string }>>([]);
  const [venues, setVenues] = useState<Array<{ venue_id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    const effective = new URLSearchParams(params);
    if (!effective.has("page")) effective.set("page", "1");
    if (!effective.has("limit")) effective.set("limit", "12");
    if (!effective.has("sortBy")) effective.set("sortBy", "matchDate");
    try { setResult(await api.searchTickets(effective)); }
    catch (reason) { setError(friendlyError(reason)); }
    finally { setLoading(false); }
  }, [params]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { api.cities().then((data) => setCities(data.items)).catch(() => undefined); }, []);
  useEffect(() => {
    api.venues(params.get("cityId") ?? undefined).then((data) => setVenues(data.items)).catch(() => setVenues([]));
  }, [params]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    data.forEach((value, key) => {
      const text = String(value).trim();
      if (!text) return;
      next.set(key, key === "startDate" || key === "endDate" ? new Date(text).toISOString() : text);
    });
    next.set("page", "1"); next.set("limit", "12");
    setParams(next);
  };
  const page = result?.pagination.page ?? 1;

  return <>
    <section className="hero">
      <div><span className="eyebrow">جستجوی هوشمند مسابقات</span><h1>صندلی تو، وسط هیجان بازی</h1><p>میان مسابقات، تیم‌ها و شهرها جستجو کن و بلیت مناسب را امن و سریع رزرو کن.</p></div>
      <div className="hero-stat"><strong>{result?.pagination.total?.toLocaleString("fa-IR") ?? "—"}</strong><span>بلیت مطابق جستجوی شما</span></div>
    </section>
    <section className="search-panel" aria-label="جستجوی بلیت">
      <form onSubmit={submit} key={params.toString()}>
        <label className="wide">جستجوی آزاد<input name="q" defaultValue={params.get("q") ?? ""} placeholder="نام تیم، ورزشگاه، لیگ…" /></label>
        <label>نام تیم<input name="team" defaultValue={params.get("team") ?? ""} placeholder="مثلاً پرسپولیس" /></label>
        <label>شناسه نوع ورزش<input name="sportTypeId" inputMode="numeric" defaultValue={params.get("sportTypeId") ?? ""} /></label>
        <label>شهر<select name="cityId" defaultValue={params.get("cityId") ?? ""}><option value="">همه شهرها</option>{cities.map((city) => <option key={city.city_id} value={city.city_id}>{city.name}</option>)}</select></label>
        <label>محل برگزاری<select name="venueId" defaultValue={params.get("venueId") ?? ""}><option value="">همه محل‌ها</option>{venues.map((venue) => <option key={venue.venue_id} value={venue.venue_id}>{venue.name}</option>)}</select></label>
        <label>از تاریخ<input type="datetime-local" name="startDate" defaultValue={params.get("startDate")?.slice(0, 16) ?? ""} /></label>
        <label>تا تاریخ<input type="datetime-local" name="endDate" defaultValue={params.get("endDate")?.slice(0, 16) ?? ""} /></label>
        <label>حداقل قیمت<input type="number" min="0" name="minPrice" defaultValue={params.get("minPrice") ?? ""} /></label>
        <label>حداکثر قیمت<input type="number" min="0" name="maxPrice" defaultValue={params.get("maxPrice") ?? ""} /></label>
        <label>امکانات<input name="facility" defaultValue={params.get("facility") ?? ""} placeholder="مثلاً پارکینگ" /></label>
        <label>مرتب‌سازی<select name="sortBy" defaultValue={params.get("sortBy") ?? "matchDate"}><option value="matchDate">نزدیک‌ترین مسابقه</option><option value="price">قیمت</option><option value="createdAt">جدیدترین بلیت</option><option value="relevance">مرتبط‌ترین</option></select></label>
        <label>جهت<select name="sortOrder" defaultValue={params.get("sortOrder") ?? "asc"}><option value="asc">صعودی</option><option value="desc">نزولی</option></select></label>
        <div className="form-actions wide"><button type="submit">جستجوی بلیت</button><button type="button" className="secondary" onClick={() => setParams({})}>پاک‌کردن فیلترها</button></div>
      </form>
    </section>
    <section className="results-section">
      <div className="section-heading"><div><span className="eyebrow">نتایج جستجو</span><h2>بلیت‌های قابل رزرو</h2></div>{result?.search && <small>منبع: {result.search.source === "elasticsearch" ? "جستجوی سریع" : "پایگاه داده پشتیبان"} · {result.search.tookMs.toLocaleString("fa-IR")} ms</small>}</div>
      {loading ? <Loading /> : error ? <ErrorState message={error} retry={load} /> : !result?.items.length ? <EmptyState message="با این فیلترها بلیتی پیدا نشد؛ محدوده جستجو را تغییر دهید." /> : <div className="ticket-grid">{result.items.map((ticket) => <TicketCard key={ticket.ticket_id} ticket={ticket} />)}</div>}
      {result && <Pagination page={page} totalPages={result.pagination.totalPages} onPage={(nextPage) => { const next = new URLSearchParams(params); next.set("page", String(nextPage)); setParams(next); window.scrollTo({ top: 300, behavior: "smooth" }); }} />}
    </section>
  </>;
}
