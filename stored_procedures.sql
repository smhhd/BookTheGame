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

-- 4. Search tickets by spectator name, teams, venue, or ticket category.
CREATE OR REPLACE FUNCTION sp_search_tickets(p_phrase TEXT)
RETURNS TABLE (
    ticket_id BIGINT,
    buyer_name TEXT,
    sport_type VARCHAR,
    home_team VARCHAR,
    away_team VARCHAR,
    venue_name VARCHAR,
    ticket_category VARCHAR,
    match_datetime TIMESTAMP
)
LANGUAGE sql
AS $$
    SELECT DISTINCT
        t.ticket_id,
        CONCAT(u.first_name, ' ', u.last_name) AS buyer_name,
        st.name AS sport_type,
        ht.name AS home_team,
        at.name AS away_team,
        v.name AS venue_name,
        tc.name AS ticket_category,
        m.match_datetime
    FROM tickets t
    JOIN matches m ON m.match_id = t.match_id
    JOIN sport_types st ON st.sport_type_id = m.sport_type_id
    JOIN teams ht ON ht.team_id = m.home_team_id
    JOIN teams at ON at.team_id = m.away_team_id
    JOIN venues v ON v.venue_id = m.venue_id
    JOIN ticket_categories tc ON tc.category_id = t.category_id
    LEFT JOIN reservations rs ON rs.ticket_id = t.ticket_id
    LEFT JOIN orders o ON o.order_id = rs.order_id
    LEFT JOIN users u ON u.user_id = o.user_id
    WHERE COALESCE(CONCAT(u.first_name, ' ', u.last_name), '') ILIKE '%' || p_phrase || '%'
       OR ht.name ILIKE '%' || p_phrase || '%'
       OR at.name ILIKE '%' || p_phrase || '%'
       OR v.name ILIKE '%' || p_phrase || '%'
       OR tc.name ILIKE '%' || p_phrase || '%'
    ORDER BY m.match_datetime, t.ticket_id;
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

-- 8. By report subject, list users with the highest report count in that subject.
CREATE OR REPLACE FUNCTION sp_top_reporters_by_subject(p_subject TEXT)
RETURNS TABLE (
    user_id BIGINT,
    first_name VARCHAR,
    last_name VARCHAR,
    report_count BIGINT
)
LANGUAGE sql
AS $$
    WITH user_report_counts AS (
        SELECT
            u.user_id,
            u.first_name,
            u.last_name,
            COUNT(*) AS report_count,
            DENSE_RANK() OVER (ORDER BY COUNT(*) DESC) AS rnk
        FROM users u
        JOIN reports r ON r.user_id = u.user_id
        JOIN report_categories rc ON rc.report_category_id = r.report_category_id
        WHERE rc.name ILIKE p_subject
        GROUP BY u.user_id, u.first_name, u.last_name
    )
    SELECT user_id, first_name, last_name, report_count
    FROM user_report_counts
    WHERE rnk = 1;
$$;