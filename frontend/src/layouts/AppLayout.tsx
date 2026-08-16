import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AppLayout() {
  const { user, logout } = useAuth();
  return <div className="app-shell">
    <header className="site-header">
      <NavLink to="/" className="brand"><span className="brand-mark">B</span><span>بلیت‌بازی<small>هیجان از همین‌جا شروع می‌شود</small></span></NavLink>
      <nav>
        <NavLink to="/">جستجو</NavLink>
        {user && <NavLink to="/reservations">رزروهای من</NavLink>}
        {user && <NavLink to="/reports">گزارش‌ها</NavLink>}
        {user && <NavLink to="/profile">پروفایل</NavLink>}
        {user?.role_name === "support" && <NavLink to="/support">پنل پشتیبان</NavLink>}
      </nav>
      <div className="header-actions">{user ? <><span className="user-name">{user.first_name}</span><button className="link-button" onClick={logout}>خروج</button></> : <NavLink className="button" to="/auth">ورود / ثبت‌نام</NavLink>}</div>
    </header>
    <main><Outlet /></main>
    <footer><span>Book The Game</span><span>سامانه رزرو بلیت مسابقات ورزشی</span></footer>
  </div>;
}
