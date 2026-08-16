import { useState, type FormEvent } from "react";
import { api } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { friendlyError } from "../utils/format";

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  if (!user) return null;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const raw = Object.fromEntries(new FormData(event.currentTarget));
    const body = Object.fromEntries(
      Object.entries(raw).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ]),
    );
    try {
      await api.updateMe(body);
      await refreshUser();
      setMessage("اطلاعات حساب با موفقیت ذخیره شد.");
    } catch (reason) {
      setMessage(friendlyError(reason));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="page narrow-page">
      <span className="eyebrow">تنظیمات حساب</span>
      <h1>پروفایل من</h1>
      <section className="panel">
        <div className="wallet">
          <span>موجودی کیف پول</span>
          <strong>
            {Number(user.wallet_balance).toLocaleString("fa-IR")} تومان
          </strong>
        </div>
        <form onSubmit={submit}>
          <label>
            نام
            <input name="firstName" required defaultValue={user.first_name} />
          </label>
          <label>
            نام خانوادگی
            <input name="lastName" required defaultValue={user.last_name} />
          </label>
          <label>
            ایمیل
            <input name="email" type="email" defaultValue={user.email ?? ""} />
          </label>
          <label>
            شماره تلفن
            <input name="phone" dir="ltr" defaultValue={user.phone ?? ""} />
          </label>
          <label>
            تاریخ تولد
            <input
              name="birthDate"
              type="date"
              defaultValue={user.birth_date?.slice(0, 10) ?? ""}
            />
          </label>
          <label>
            آدرس تصویر
            <input
              name="profileImageUrl"
              type="url"
              dir="ltr"
              defaultValue={user.profile_image_url ?? ""}
            />
          </label>
          {message && <div className="inline-alert">{message}</div>}
          <button disabled={busy}>
            {busy ? "در حال ذخیره…" : "ذخیره تغییرات"}
          </button>
        </form>
      </section>
    </div>
  );
}
