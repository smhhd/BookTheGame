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

-- 16. Second best-selling ticket among all tickets.
SELECT ticket_id, sold_count
FROM (
    SELECT
        t.ticket_id,
        COUNT(rs.reservation_id) AS sold_count,
        DENSE_RANK() OVER (ORDER BY COUNT(rs.reservation_id) DESC) AS sales_rank
    FROM tickets t
    JOIN reservations rs ON rs.ticket_id = t.ticket_id
    JOIN orders o ON o.order_id = rs.order_id
    JOIN payments p ON p.order_id = o.order_id AND p.status IN ('success', 'refunded')
    WHERE rs.status IN ('paid', 'cancelled')
    GROUP BY t.ticket_id
) ranked
WHERE sales_rank = 2;

-- 17. Support user with highest cancellation count and cancellation percentage.
WITH support_cancel_stats AS (
    SELECT
        su.user_id,
        COUNT(cri.reservation_id) FILTER (
            WHERE cr.status = 'approved'
              AND cri.status = 'approved'
              AND cri.item_action = 'cancel'
        ) AS approved_cancelled_tickets,
        COUNT(cri.reservation_id) FILTER (
            WHERE cr.reviewed_by_support_id IS NOT NULL
        ) AS reviewed_ticket_items
    FROM support_users su
    LEFT JOIN cancellation_requests cr ON cr.reviewed_by_support_id = su.user_id
    LEFT JOIN cancellation_request_items cri ON cri.request_id = cr.request_id
    GROUP BY su.user_id
)
SELECT
    u.first_name,
    u.last_name,
    scs.approved_cancelled_tickets,
    CASE
        WHEN scs.reviewed_ticket_items = 0 THEN 0
        ELSE ROUND((scs.approved_cancelled_tickets::numeric / scs.reviewed_ticket_items) * 100, 2)
    END AS cancellation_percentage
FROM support_cancel_stats scs
JOIN users u ON u.user_id = scs.user_id
ORDER BY scs.approved_cancelled_tickets DESC, cancellation_percentage DESC
LIMIT 1;

-- 18. Change the last name of the user with the most cancelled tickets to 'Reddington'.
WITH target_user AS (
    SELECT o.user_id
    FROM orders o
    JOIN reservations rs ON rs.order_id = o.order_id
    WHERE rs.status = 'cancelled'
    GROUP BY o.user_id
    ORDER BY COUNT(*) DESC
    LIMIT 1
)
UPDATE users u
SET last_name = 'Reddington'
FROM target_user tu
WHERE u.user_id = tu.user_id;
