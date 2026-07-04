SET search_path TO book_the_game;

CREATE UNIQUE INDEX uq_active_reservation_per_ticket
ON reservations(ticket_id)
WHERE status IN ('pending', 'paid');

CREATE UNIQUE INDEX uq_success_payment_per_order
ON payments(order_id)
WHERE status = 'success';

CREATE UNIQUE INDEX uq_success_refund_per_cancellation_request
ON refunds(cancellation_request_id)
WHERE status = 'success';

CREATE UNIQUE INDEX uq_active_policy_per_organizer_sport
ON cancellation_policies(organizer_id, sport_type_id)
WHERE status = 'active';

CREATE UNIQUE INDEX uq_active_cancellation_item_per_reservation
ON cancellation_request_items(reservation_id)
WHERE status IN ('pending', 'approved');

CREATE INDEX idx_users_city_id
ON users(city_id);

CREATE INDEX idx_organizers_city_id
ON organizers(city_id);

CREATE INDEX idx_teams_sport_type_id
ON teams(sport_type_id);

CREATE INDEX idx_venues_city_id
ON venues(city_id);

CREATE INDEX idx_matches_sport_type_id
ON matches(sport_type_id);

CREATE INDEX idx_matches_organizer_id
ON matches(organizer_id);

CREATE INDEX idx_matches_venue_id
ON matches(venue_id);

CREATE INDEX idx_matches_datetime
ON matches(match_datetime);

CREATE INDEX idx_tickets_match_id
ON tickets(match_id);

CREATE INDEX idx_tickets_venue_id
ON tickets(venue_id);

CREATE INDEX idx_tickets_category_id
ON tickets(category_id);

CREATE INDEX idx_tickets_status
ON tickets(status);

CREATE INDEX idx_tickets_price
ON tickets(price);

CREATE INDEX idx_orders_user_id
ON orders(user_id);

CREATE INDEX idx_orders_status
ON orders(status);

CREATE INDEX idx_orders_reserved_until
ON orders(reserved_until);

CREATE INDEX idx_reservations_order_id
ON reservations(order_id);

CREATE INDEX idx_reservations_ticket_id
ON reservations(ticket_id);

CREATE INDEX idx_reservations_status
ON reservations(status);

CREATE INDEX idx_payments_order_id
ON payments(order_id);

CREATE INDEX idx_payments_status_paid_at
ON payments(status, paid_at);

CREATE INDEX idx_cancellation_policies_organizer_sport
ON cancellation_policies(organizer_id, sport_type_id);

CREATE INDEX idx_cancellation_policy_rules_policy_id
ON cancellation_policy_rules(policy_id);

CREATE INDEX idx_cancellation_requests_order_id
ON cancellation_requests(order_id);

CREATE INDEX idx_cancellation_requests_user_id
ON cancellation_requests(user_id);

CREATE INDEX idx_cancellation_request_items_reservation_id
ON cancellation_request_items(reservation_id);

CREATE INDEX idx_cancellation_request_items_ticket_id
ON cancellation_request_items(ticket_id);

CREATE INDEX idx_cancellation_request_items_requested_new_ticket_id
ON cancellation_request_items(requested_new_ticket_id);

CREATE INDEX idx_cancellation_request_items_match_id
ON cancellation_request_items(match_id);

CREATE INDEX idx_cancellation_request_items_action
ON cancellation_request_items(item_action);

CREATE INDEX idx_refunds_payment_id
ON refunds(payment_id);

CREATE INDEX idx_refunds_cancellation_request_id
ON refunds(cancellation_request_id);

CREATE INDEX idx_reports_user_id
ON reports(user_id);

CREATE INDEX idx_reports_order_id
ON reports(order_id);

CREATE INDEX idx_reports_ticket_id
ON reports(ticket_id);

CREATE INDEX idx_reports_reservation_id
ON reports(reservation_id);

CREATE INDEX idx_reports_category_id
ON reports(report_category_id);

CREATE INDEX idx_reports_status
ON reports(status);
