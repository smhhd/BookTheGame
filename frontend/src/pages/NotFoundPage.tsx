import { Link } from "react-router-dom";

export function NotFoundPage() {
  return <div className="page not-found"><strong>۴۰۴</strong><h1>این صفحه پیدا نشد</h1><p>ممکن است آدرس تغییر کرده باشد یا صفحه وجود نداشته باشد.</p><Link className="button" to="/">بازگشت به صفحه اصلی</Link></div>;
}
