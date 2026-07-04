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
