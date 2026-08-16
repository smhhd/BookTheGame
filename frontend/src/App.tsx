import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { AuthPage } from "./pages/AuthPage";
import { CompetitionDetailsPage } from "./pages/CompetitionDetailsPage";
import { CompetitionsPage } from "./pages/CompetitionsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PaymentPage } from "./pages/PaymentPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ReportsPage } from "./pages/ReportsPage";
import { ReservationsPage } from "./pages/ReservationsPage";
import { ReservePage } from "./pages/ReservePage";
import { SearchPage } from "./pages/SearchPage";
import { SupportPage } from "./pages/SupportPage";
import { TicketDetailsPage } from "./pages/TicketDetailsPage";
import { ProtectedRoute, SupportRoute } from "./routes/guards";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<CompetitionsPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route
          path="matches/:matchId/tickets"
          element={<CompetitionDetailsPage />}
        />
        <Route
          path="competitions/:competitionId/tickets"
          element={<CompetitionDetailsPage />}
        />
        <Route path="tickets/:ticketId" element={<TicketDetailsPage />} />
        <Route path="auth" element={<AuthPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="reserve/:ticketId" element={<ReservePage />} />
          <Route path="pay/:reservationId" element={<PaymentPage />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
        <Route element={<SupportRoute />}>
          <Route path="support" element={<SupportPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
