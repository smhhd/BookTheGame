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

-- 2. By support email or phone, list users whose reservations were cancelled at least once by that support.
CREATE OR REPLACE FUNCTION sp_users_cancelled_by_support(p_support_contact TEXT)
RETURNS TABLE (
    user_id BIGINT,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    cancelled_count BIGINT
)
LANGUAGE sql
AS $$
    SELECT
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        COUNT(*) AS cancelled_count
    FROM users support
    JOIN support_users su ON su.user_id = support.user_id
    JOIN cancellation_requests cr ON cr.reviewed_by_support_id = su.user_id
    JOIN orders o ON o.order_id = cr.order_id
    JOIN users u ON u.user_id = o.user_id
    WHERE (support.email = p_support_contact OR support.phone = p_support_contact)
      AND cr.status = 'approved'
    GROUP BY u.user_id, u.first_name, u.last_name, u.email, u.phone
    ORDER BY cancelled_count DESC, u.user_id;
$$;

-- 3. By city name, list purchased tickets in that venue city.
CREATE OR REPLACE FUNCTION sp_purchased_tickets_by_city(p_city_name TEXT)
RETURNS TABLE (
    ticket_id BIGINT,
    buyer_first_name VARCHAR,
    buyer_last_name VARCHAR,
    sport_type VARCHAR,
    venue_name VARCHAR,
    match_datetime TIMESTAMP,
    paid_at TIMESTAMP
)
LANGUAGE sql
AS $$
    SELECT
        t.ticket_id,
        u.first_name,
        u.last_name,
        st.name,
        v.name,
        m.match_datetime,
        p.paid_at
    FROM cities c
    JOIN venues v ON v.city_id = c.city_id
    JOIN matches m ON m.venue_id = v.venue_id
    JOIN sport_types st ON st.sport_type_id = m.sport_type_id
    JOIN tickets t ON t.match_id = m.match_id
    JOIN reservations rs ON rs.ticket_id = t.ticket_id
    JOIN orders o ON o.order_id = rs.order_id
    JOIN users u ON u.user_id = o.user_id
    JOIN payments p ON p.order_id = o.order_id AND p.status IN ('success', 'refunded')
    WHERE c.name ILIKE p_city_name
      AND rs.status IN ('paid', 'cancelled')
    ORDER BY p.paid_at DESC;
$$;
