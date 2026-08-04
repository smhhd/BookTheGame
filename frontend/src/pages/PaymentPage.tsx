import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../api/endpoints";
import { Countdown } from "../components/Countdown";
import type { Ticket } from "../types/api";
import { formatPrice, friendlyError } from "../utils/format";

export function PaymentPage() {
  const { reservationId = "" } = useParams();
  const state = useLocation().state as { ticket?: Ticket; reservedUntil?: string; orderId?: string } | null;
  const [method, setMethod] = useState("CARD");
  const [busy, setBusy] = useState(false);
  const [payment, setPayment] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const pay = async () => {
    setBusy(true); setError("");
    try { setPayment(await api.pay(reservationId, method)); }
    catch (reason) { setError(friendlyError(reason)); }
    finally { setBusy(false); }
  };
  if (payment) return <div className="page narrow-page"><section className="success-card"><span className="success-mark">✓</span><h1>پرداخت با موفقیت انجام شد</h1><p>شناسه پرداخت: <bdi>{String(payment.payment_id ?? "—")}</bdi></p><Link className="button" to="/reservations">مشاهده خریدهای من</Link></section></div>;
  return <div className="page narrow-page"><span className="eyebrow">پرداخت شبیه‌سازی‌شده</span><h1>تکمیل خرید</h1><section className="panel payment-card">{state?.reservedUntil && <div className="reservation-timer"><span>مهلت باقی‌مانده</span><Countdown until={state.reservedUntil} /></div>}<h2>{state?.ticket ? `${state.ticket.home_team} — ${state.ticket.away_team}` : `رزرو شماره ${reservationId}`}</h2><div className="payable"><span>مبلغ قابل پرداخت</span><strong>{formatPrice(state?.ticket?.price)}</strong></div><fieldset><legend>روش پرداخت</legend><label className="radio"><input type="radio" checked={method === "CARD"} onChange={() => setMethod("CARD")} />کارت بانکی</label><label className="radio"><input type="radio" checked={method === "WALLET"} onChange={() => setMethod("WALLET")} />کیف پول</label><label className="radio"><input type="radio" checked={method === "CRYPTO"} onChange={() => setMethod("CRYPTO")} />رمزارز آزمایشی</label></fieldset>{error && <div className="inline-alert error">{error}</div>}<button className="full" disabled={busy} onClick={pay}>{busy ? "در حال پرداخت…" : "پرداخت امن"}</button><small className="muted">این پرداخت محلی و آزمایشی است و به درگاه واقعی متصل نیست.</small></section></div>;
}
