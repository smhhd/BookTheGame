import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { friendlyError } from "../utils/format";

export function AuthPage() {
  const [mode, setMode] = useState<"otp" | "signup">("otp");
  const [identifier, setIdentifier] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = (location.state as { from?: string } | null)?.from ?? "/";
  const finish = (session: Awaited<ReturnType<typeof api.signup>>) => { login(session); navigate(destination, { replace: true }); };
  const submitSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try { await finish(await api.signup(data)); } catch (reason) { setError(friendlyError(reason)); } finally { setBusy(false); }
  };
  const requestOtp = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try { const data = await api.requestOtp(identifier); setDevOtp(data.devOtp ?? ""); setOtpRequested(true); }
    catch (reason) { setError(friendlyError(reason)); } finally { setBusy(false); }
  };
  const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError("");
    const otp = String(new FormData(event.currentTarget).get("otp") ?? "");
    try { finish(await api.verifyOtp(identifier, otp)); } catch (reason) { setError(friendlyError(reason)); } finally { setBusy(false); }
  };
  return <div className="auth-page"><section className="auth-intro"><span className="eyebrow">حساب کاربری</span><h1>برای رزرو، فقط چند لحظه فاصله داری</h1><p>ورود یک‌بارمصرف امن یا ثبت‌نام سریع؛ بعد از ورود به همان مرحله‌ای که بودی برمی‌گردی.</p><ul><li>رزرو موقت و امن صندلی</li><li>پرداخت شبیه‌سازی‌شده</li><li>کنسلی و بازپرداخت شفاف</li></ul></section><section className="auth-card">
    <div className="tabs"><button className={mode === "otp" ? "active" : ""} onClick={() => setMode("otp")}>ورود با رمز یک‌بارمصرف</button><button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>ثبت‌نام</button></div>
    {error && <div className="inline-alert error" role="alert">{error}</div>}
    {mode === "signup" ? <form onSubmit={submitSignup}><label>نام<input required name="firstName" maxLength={100} /></label><label>نام خانوادگی<input required name="lastName" maxLength={100} /></label><label>ایمیل<input required type="email" name="email" /></label><label>رمز عبور<input required type="password" name="password" minLength={8} placeholder="حروف بزرگ، کوچک و عدد" /></label><button disabled={busy}>{busy ? "در حال ثبت…" : "ساخت حساب و ورود"}</button></form> : !otpRequested ? <form onSubmit={requestOtp}><label>ایمیل یا شماره تلفن<input required value={identifier} onChange={(event) => setIdentifier(event.target.value)} dir="ltr" /></label><button disabled={busy}>{busy ? "در حال ارسال…" : "دریافت رمز یک‌بارمصرف"}</button></form> : <form onSubmit={verifyOtp}><p className="muted">رمز ارسال‌شده برای <bdi>{identifier}</bdi> را وارد کنید.</p>{devOtp && <div className="dev-otp">رمز محیط توسعه: <strong>{devOtp}</strong></div>}<label>رمز شش‌رقمی<input required name="otp" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} dir="ltr" /></label><button disabled={busy}>{busy ? "در حال بررسی…" : "ورود"}</button><button type="button" className="link-button" onClick={() => setOtpRequested(false)}>تغییر ایمیل یا تلفن</button></form>}
  </section></div>;
}
