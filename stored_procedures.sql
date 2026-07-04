SET search_path TO book_the_game;

-- =========================================================
-- Phase 2 Stored Procedures / PostgreSQL Functions
-- =========================================================

-- 1. By email or phone, list purchased tickets ordered by purchase time.
CREATE OR REPLACE FUNCTION sp_user_purchased_tickets(p_contact TEXT)
RETURNS TABLE (
    paid_at TIMESTAMP,
    ticket_id BIGINT,
    sport_type VARCHAR,
    home_team VARCHAR,
    away_team VARCHAR,
    venue_name VARCHAR,
    match_datetime TIMESTAMP,
    ticket_category VARCHAR,
    paid_amount NUMERIC
)
LANGUAGE sql
AS $$
    SELECT
        p.paid_at,
        t.ticket_id,
        st.name AS sport_type,
        ht.name AS home_team,
        at.name AS away_team,
        v.name AS venue_name,
        m.match_datetime,
        tc.name AS ticket_category,
        rs.price_at_reservation AS paid_amount
    FROM users u
    JOIN orders o ON o.user_id = u.user_id
    JOIN payments p ON p.order_id = o.order_id AND p.status IN ('success', 'refunded')
    JOIN reservations rs ON rs.order_id = o.order_id
    JOIN tickets t ON t.ticket_id = rs.ticket_id
    JOIN matches m ON m.match_id = t.match_id
    JOIN sport_types st ON st.sport_type_id = m.sport_type_id
    JOIN teams ht ON ht.team_id = m.home_team_id
    JOIN teams at ON at.team_id = m.away_team_id
    JOIN venues v ON v.venue_id = m.venue_id
    JOIN ticket_categories tc ON tc.category_id = t.category_id
    WHERE (u.email = p_contact OR u.phone = p_contact)
      AND rs.status IN ('paid', 'cancelled')
    ORDER BY p.paid_at ASC;
$$;

-- 5. Receive user email/phone and return other users in the same city.
CREATE OR REPLACE FUNCTION sp_same_city_users(p_contact TEXT)
RETURNS TABLE (
    user_id BIGINT,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    city_name VARCHAR
)
LANGUAGE sql
AS $$
    WITH target_user AS (
        SELECT user_id, city_id
        FROM users
        WHERE email = p_contact OR phone = p_contact
        LIMIT 1
    )
    SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone, c.name
    FROM target_user tu
    JOIN users u ON u.city_id = tu.city_id AND u.user_id <> tu.user_id
    JOIN cities c ON c.city_id = u.city_id
    ORDER BY u.last_name, u.first_name;
$$;

-- 6. Receive date and n, return top n users by ticket purchases after that date.
CREATE OR REPLACE FUNCTION sp_top_buyers_after_date(p_start_date DATE, p_limit INT)
RETURNS TABLE (
    user_id BIGINT,
    first_name VARCHAR,
    last_name VARCHAR,
    purchased_ticket_count BIGINT
)
LANGUAGE sql
AS $$
    SELECT
        u.user_id,
        u.first_name,
        u.last_name,
        COUNT(*) AS purchased_ticket_count
    FROM users u
    JOIN orders o ON o.user_id = u.user_id
    JOIN payments p ON p.order_id = o.order_id AND p.status IN ('success', 'refunded')
    JOIN reservations rs ON rs.order_id = o.order_id
    WHERE p.paid_at::date >= p_start_date
      AND rs.status IN ('paid', 'cancelled')
    GROUP BY u.user_id, u.first_name, u.last_name
    ORDER BY purchased_ticket_count DESC, u.user_id
    LIMIT p_limit;
$$;

-- 7. By sport type, list cancelled tickets ordered by cancellation date.
CREATE OR REPLACE FUNCTION sp_cancelled_tickets_by_sport(p_sport_type TEXT)
RETURNS TABLE (
    ticket_id BIGINT,
    reservation_id BIGINT,
    buyer_name TEXT,
    cancelled_at TIMESTAMP,
    match_datetime TIMESTAMP,
    venue_name VARCHAR
)
LANGUAGE sql
AS $$
    SELECT
        t.ticket_id,
        rs.reservation_id,
        CONCAT(u.first_name, ' ', u.last_name) AS buyer_name,
        rs.cancelled_at,
        m.match_datetime,
        v.name AS venue_name
    FROM reservations rs
    JOIN orders o ON o.order_id = rs.order_id
    JOIN users u ON u.user_id = o.user_id
    JOIN tickets t ON t.ticket_id = rs.ticket_id
    JOIN matches m ON m.match_id = t.match_id
    JOIN sport_types st ON st.sport_type_id = m.sport_type_id
    JOIN venues v ON v.venue_id = m.venue_id
    WHERE rs.status = 'cancelled'
      AND st.name ILIKE p_sport_type
    ORDER BY rs.cancelled_at ASC NULLS LAST;
$$;