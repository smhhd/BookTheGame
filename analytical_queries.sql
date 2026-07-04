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