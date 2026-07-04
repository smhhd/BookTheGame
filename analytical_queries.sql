SET search_path TO book_the_game;

-- =========================================================
-- Phase 2 Analytical Queries
-- Definition used in this file:
-- Purchased ticket = reservation.status = 'paid' and its order has a successful payment.
-- =========================================================

-- 1. Users who have never reserved any ticket.
SELECT u.first_name, u.last_name
FROM users u
JOIN roles r ON r.role_id = u.role_id
WHERE r.role_name = 'spectator'
  AND NOT EXISTS (
      SELECT 1
      FROM orders o
      JOIN reservations rs ON rs.order_id = o.order_id
      WHERE o.user_id = u.user_id
  );

-- 12. Users who purchased at least 2 tickets.
SELECT u.first_name, u.last_name, COUNT(*) AS purchased_ticket_count
FROM users u
JOIN orders o ON o.user_id = u.user_id
JOIN payments p ON p.order_id = o.order_id AND p.status IN ('success', 'refunded')
JOIN reservations rs ON rs.order_id = o.order_id
WHERE rs.status IN ('paid', 'cancelled')
GROUP BY u.user_id, u.first_name, u.last_name
HAVING COUNT(*) >= 2
ORDER BY purchased_ticket_count DESC;

-- 13. Users who bought at most 2 tickets from a specific sport type, e.g. Football.
SELECT u.first_name, u.last_name, COUNT(*) AS football_ticket_count
FROM users u
JOIN orders o ON o.user_id = u.user_id
JOIN payments p ON p.order_id = o.order_id AND p.status IN ('success', 'refunded')
JOIN reservations rs ON rs.order_id = o.order_id
JOIN tickets t ON t.ticket_id = rs.ticket_id
JOIN matches m ON m.match_id = t.match_id
JOIN sport_types st ON st.sport_type_id = m.sport_type_id
WHERE st.name = 'Football'
  AND rs.status IN ('paid', 'cancelled')
GROUP BY u.user_id, u.first_name, u.last_name
HAVING COUNT(*) <= 2
ORDER BY football_ticket_count DESC;

-- 14. Users who bought at least one ticket from Football, Volleyball, and Basketball.
SELECT u.email, u.phone
FROM users u
WHERE NOT EXISTS (
    SELECT 1
    FROM sport_types required_st
    WHERE required_st.name IN ('Football', 'Volleyball', 'Basketball')
      AND NOT EXISTS (
          SELECT 1
          FROM orders o
          JOIN payments p ON p.order_id = o.order_id AND p.status IN ('success', 'refunded')
          JOIN reservations rs ON rs.order_id = o.order_id
          JOIN tickets t ON t.ticket_id = rs.ticket_id
          JOIN matches m ON m.match_id = t.match_id
          WHERE o.user_id = u.user_id
            AND rs.status IN ('paid', 'cancelled')
            AND m.sport_type_id = required_st.sport_type_id
      )
);

-- 15. Tickets purchased today ordered by purchase time.
SELECT
    p.paid_at,
    t.ticket_id,
    u.first_name,
    u.last_name,
    st.name AS sport_type,
    ht.name AS home_team,
    at.name AS away_team,
    v.name AS venue_name,
    rs.price_at_reservation
FROM payments p
JOIN orders o ON o.order_id = p.order_id
JOIN users u ON u.user_id = o.user_id
JOIN reservations rs ON rs.order_id = o.order_id
JOIN tickets t ON t.ticket_id = rs.ticket_id
JOIN matches m ON m.match_id = t.match_id
JOIN sport_types st ON st.sport_type_id = m.sport_type_id
JOIN teams ht ON ht.team_id = m.home_team_id
JOIN teams at ON at.team_id = m.away_team_id
JOIN venues v ON v.venue_id = m.venue_id
WHERE p.status IN ('success', 'refunded')
  AND rs.status IN ('paid', 'cancelled')
  AND p.paid_at::date = CURRENT_DATE
ORDER BY p.paid_at ASC;
