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

-- 2. Users who have purchased at least one ticket.
SELECT DISTINCT u.first_name, u.last_name
FROM users u
JOIN orders o ON o.user_id = u.user_id
JOIN reservations rs ON rs.order_id = o.order_id
JOIN payments p ON p.order_id = o.order_id
WHERE rs.status = 'paid'
  AND p.status = 'success';

-- 3. Total successful payments by each user in different months.
SELECT
    u.user_id,
    u.first_name,
    u.last_name,
    DATE_TRUNC('month', p.paid_at)::date AS payment_month,
    SUM(p.amount) AS total_paid
FROM users u
JOIN orders o ON o.user_id = u.user_id
JOIN payments p ON p.order_id = o.order_id
WHERE p.status IN ('success', 'refunded')
  AND p.paid_at IS NOT NULL
GROUP BY u.user_id, u.first_name, u.last_name, DATE_TRUNC('month', p.paid_at)
ORDER BY payment_month, u.user_id;

-- 4. Users who purchased exactly once in each city.
SELECT c.name AS city_name, u.first_name, u.last_name, COUNT(DISTINCT o.order_id) AS purchase_count
FROM users u
JOIN cities c ON c.city_id = u.city_id
JOIN orders o ON o.user_id = u.user_id
JOIN payments p ON p.order_id = o.order_id AND p.status IN ('success', 'refunded')
GROUP BY c.name, u.user_id, u.first_name, u.last_name
HAVING COUNT(DISTINCT o.order_id) = 1
ORDER BY c.name, u.last_name;

-- 5. User who purchased the newest/latest ticket.
SELECT u.*
FROM users u
JOIN orders o ON o.user_id = u.user_id
JOIN payments p ON p.order_id = o.order_id
WHERE p.status IN ('success', 'refunded')
ORDER BY p.paid_at DESC
LIMIT 1;

-- 6. Contact of users whose total payments are greater than average total payment per paying user.
WITH user_totals AS (
    SELECT o.user_id, SUM(p.amount) AS total_paid
    FROM orders o
    JOIN payments p ON p.order_id = o.order_id
    WHERE p.status IN ('success', 'refunded')
    GROUP BY o.user_id
)
SELECT u.email, u.phone, ut.total_paid
FROM user_totals ut
JOIN users u ON u.user_id = ut.user_id
WHERE ut.total_paid > (SELECT AVG(total_paid) FROM user_totals);

-- 7. Sold ticket count by sport type.
SELECT st.name AS sport_type, COUNT(*) AS sold_ticket_count
FROM reservations rs
JOIN orders o ON o.order_id = rs.order_id
JOIN payments p ON p.order_id = o.order_id AND p.status IN ('success', 'refunded')
JOIN tickets t ON t.ticket_id = rs.ticket_id
JOIN matches m ON m.match_id = t.match_id
JOIN sport_types st ON st.sport_type_id = m.sport_type_id
WHERE rs.status IN ('paid', 'cancelled')
GROUP BY st.name
ORDER BY sold_ticket_count DESC;

-- 8. User with the most ticket purchases in the recent week.
SELECT u.user_id, u.first_name, u.last_name, COUNT(*) AS purchased_ticket_count
FROM users u
JOIN orders o ON o.user_id = u.user_id
JOIN payments p ON p.order_id = o.order_id AND p.status IN ('success', 'refunded')
JOIN reservations rs ON rs.order_id = o.order_id
WHERE p.paid_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
  AND rs.status IN ('paid', 'cancelled')
GROUP BY u.user_id, u.first_name, u.last_name
ORDER BY purchased_ticket_count DESC
LIMIT 1;

-- 9. Sold tickets in Tehran province by city.
SELECT c.name AS city_name, COUNT(*) AS sold_ticket_count
FROM reservations rs
JOIN orders o ON o.order_id = rs.order_id
JOIN payments p ON p.order_id = o.order_id AND p.status IN ('success', 'refunded')
JOIN tickets t ON t.ticket_id = rs.ticket_id
JOIN matches m ON m.match_id = t.match_id
JOIN venues v ON v.venue_id = m.venue_id
JOIN cities c ON c.city_id = v.city_id
JOIN provinces pr ON pr.province_id = c.province_id
WHERE pr.name = 'Tehran'
  AND rs.status IN ('paid', 'cancelled')
GROUP BY c.name
ORDER BY c.name;

-- 10. Cities where the oldest registered user has purchased tickets.
WITH oldest_user AS (
    SELECT user_id
    FROM users
    WHERE role_id = 1
    ORDER BY registered_at ASC
    LIMIT 1
)
SELECT DISTINCT c.name AS purchased_city
FROM oldest_user ou
JOIN orders o ON o.user_id = ou.user_id
JOIN payments p ON p.order_id = o.order_id AND p.status IN ('success', 'refunded')
JOIN reservations rs ON rs.order_id = o.order_id
JOIN tickets t ON t.ticket_id = rs.ticket_id
JOIN matches m ON m.match_id = t.match_id
JOIN venues v ON v.venue_id = m.venue_id
JOIN cities c ON c.city_id = v.city_id;

-- 11. List support users.
SELECT u.first_name, u.last_name, u.email, u.phone
FROM support_users su
JOIN users u ON u.user_id = su.user_id
ORDER BY u.user_id;

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

-- 19. Delete all cancelled ticket reservations of user Reddington.
UPDATE tickets t
SET status = 'cancelled'
FROM reservations rs, orders o, users u
WHERE rs.ticket_id = t.ticket_id
  AND rs.order_id = o.order_id
  AND o.user_id = u.user_id
  AND u.last_name IN ('ردینگتون', 'Reddington')
  AND rs.status = 'cancelled';

-- 20. Delete all cancelled ticket reservations in the system.
UPDATE tickets t
SET status = 'cancelled'
FROM reservations rs
WHERE rs.ticket_id = t.ticket_id
  AND rs.status = 'cancelled';

-- 21. Reduce by 10% the price of tickets sold yesterday for matches at Azadi Stadium.
UPDATE tickets t
SET price = ROUND(t.price * 0.90, 2)
FROM reservations rs
JOIN orders o ON o.order_id = rs.order_id
JOIN payments p ON p.order_id = o.order_id
JOIN matches m ON TRUE
JOIN venues v ON v.venue_id = m.venue_id
WHERE rs.ticket_id = t.ticket_id
  AND t.match_id = m.match_id
  AND p.status IN ('success', 'refunded')
  AND p.paid_at::date = CURRENT_DATE - 1
  AND v.name = 'Azadi Stadium';
