import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../api/endpoints";
import { EmptyState, ErrorState, Loading } from "../components/AsyncState";
import { StatusBadge } from "../components/StatusBadge";
import type { Report } from "../types/api";
import { formatDate, friendlyError } from "../utils/format";

export function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); try { setReports(await api.reports()); } catch (reason) { setError(friendlyError(reason)); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    const subject = String(data.get("subject"));
    const body = { categoryId: Number(data.get("categoryId")), description: String(data.get("description")), [`${subject}Id`]: Number(data.get("subjectId")) };
    try { await api.createReport(body); event.currentTarget.reset(); await load(); }
    catch (reason) { setError(friendlyError(reason)); }
    finally { setBusy(false); }
  };
  return <div className="page"><div className="two-column"><section><span className="eyebrow">پشتیبانی</span><h1>گزارش یک مشکل</h1><div className="panel"><form onSubmit={submit}><label>نوع موضوع<select name="subject"><option value="reservation">رزرو</option><option value="ticket">بلیت</option><option value="payment">پرداخت</option></select></label><label>شناسه موضوع<input required type="number" min="1" name="subjectId" /></label><label>شناسه دسته گزارش<input required type="number" min="1" name="categoryId" defaultValue="1" /></label><label>شرح مشکل<textarea required minLength={5} maxLength={5000} name="description" rows={5} /></label>{error && <div className="inline-alert error">{error}</div>}<button disabled={busy}>{busy ? "در حال ارسال…" : "ثبت گزارش"}</button></form></div></section><section><span className="eyebrow">پیگیری</span><h2>گزارش‌های من</h2>{loading ? <Loading /> : error && !reports.length ? <ErrorState message={error} /> : !reports.length ? <EmptyState /> : <div className="stack">{reports.map((report) => <article className="report-card" key={report.report_id}><div className="reservation-title"><strong>{report.category_name}</strong><StatusBadge status={report.status} /></div><p>{report.description}</p>{report.support_response && <blockquote>پاسخ پشتیبان: {report.support_response}</blockquote>}<small>{formatDate(report.created_at)} · گزارش {report.report_id}</small></article>)}</div>}</section></div></div>;
}
