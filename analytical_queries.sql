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