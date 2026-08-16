import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loading } from "../components/AsyncState";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading label="در حال بررسی نشست کاربری…" />;
  return user ? <Outlet /> : <Navigate to="/auth" replace state={{ from: location.pathname + location.search }} />;
}

export function SupportRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="در حال بررسی دسترسی…" />;
  if (!user) return <Navigate to="/auth" replace />;
  return user.role_name === "support" ? <Outlet /> : <Navigate to="/" replace />;
}
