export interface ApiEnvelope<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
  error: { code: string; details: unknown[] };
}

export interface User {
  user_id: string;
  role_name: "spectator" | "support";
  city_id: number | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  profile_image_url: string | null;
  birth_date: string | null;
  wallet_balance: string;
  status: string;
}

export interface AuthSession { user: User; token: string }

export interface Facility { facilityId: string; name: string }

export interface MatchItem {
  match_id: number;
  competition_id?: number | null;
  competition_name?: string | null;
  sport_type: string;
  home_team: string;
  away_team: string;
  venue_name: string;
  city_name: string;
  match_datetime: string;
  match_status: string;
  available_count?: number | null;
  ticket_count?: number | null;
  min_price?: string | number | null;
  max_price?: string | number | null;
}

export interface CompetitionSummaryItem {
  competition_id: number;
  name: string;
  sport_type: string;
  ticket_count?: number | null;
  min_price?: string | number | null;
  max_price?: string | number | null;
}

export interface CompetitionTicketItem {
  ticket_id: number;
  price: number;
  status: string;
  category_id: number;
  category_name: string;
  match_datetime: string;
  venue_name: string;
  city_name: string;
  sport_type: string;
  match_id: number;
  match_status: string;
  sport_type_id: number;
  competition_id: number;
  competition_name: string;
  home_team_id: number;
  home_team: string;
  away_team_id: number;
  away_team: string;
  venue_id: number;
  city_id: number;
  section_name: string;
  row_number: string;
  seat_number: string;
  remaining_capacity: number;
  facilities?: Array<{ facilityId: string; name: string }>;
}

export interface Ticket {
  ticket_id: string;
  match_id: string;
  sport_type_id: number;
  sport_type: string;
  home_team_id: string;
  home_team: string;
  away_team_id: string;
  away_team: string;
  venue_id: number;
  venue_name: string;
  city_id: number;
  city_name: string;
  match_datetime: string;
  match_status: string;
  category_id: number;
  category_name: string;
  price: string;
  status: string;
  remaining_capacity: number;
  section_name: string;
  row_number: string;
  seat_number: string;
  competition_name?: string | null;
  facilities?: Facility[];
  [key: string]: unknown;
}

export interface Pagination { page: number; limit: number; total: number; totalPages: number }
export interface TicketSearchResult {
  items: Ticket[];
  pagination: Pagination;
  search?: { source: "elasticsearch" | "postgresql-fallback"; tookMs: number };
  cacheHit?: boolean;
}

export interface Reservation {
  reservation_id: string;
  order_id: string;
  ticket_id: string;
  status: "pending" | "paid" | "cancelled" | "expired";
  price_at_reservation: string;
  created_at: string;
  cancelled_at?: string | null;
  reserved_until: string;
  match_datetime: string;
  home_team: string;
  away_team: string;
  venue_name: string;
  category_name?: string;
  section_name?: string;
  row_number?: string;
  seat_number?: string;
  payment_id?: string | null;
  payment_status?: string | null;
}

export interface Report {
  report_id: string;
  order_id?: string | null;
  ticket_id?: string | null;
  reservation_id?: string | null;
  payment_id?: string | null;
  description: string;
  status: "pending" | "reviewed" | "rejected";
  category_name: string;
  support_response?: string | null;
  created_at: string;
  first_name?: string;
  last_name?: string;
}
