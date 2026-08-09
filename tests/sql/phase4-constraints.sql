\set ON_ERROR_STOP on
SET search_path TO book_the_game, public;
BEGIN;

DO $$
BEGIN
  BEGIN
    INSERT INTO roles (role_id, role_name) VALUES (NULL, 'spectator');
    RAISE EXCEPTION 'primary key accepted NULL';
  EXCEPTION WHEN not_null_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO users (
      user_id, role_id, city_id, first_name, last_name, email, password_hash, status
    ) VALUES (
      900001, 1, 999999, 'QA', 'ForeignKey', 'qa-fk@example.com', 'hash', 'active'
    );
    RAISE EXCEPTION 'invalid foreign key was accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO users (
      user_id, role_id, first_name, last_name, email, password_hash, status
    ) VALUES (
      900002, 1, 'QA', 'Duplicate', 'ali.ahmadi@example.com', 'hash', 'active'
    );
    RAISE EXCEPTION 'duplicate email was accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO users (
      user_id, role_id, first_name, last_name, email, password_hash, status
    ) VALUES (
      900003, 1, 'QA', 'Status', 'qa-status@example.com', 'hash', 'invalid'
    );
    RAISE EXCEPTION 'invalid user status was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO tickets (
      ticket_id, match_id, venue_id, category_id, seat_id, price, status
    ) VALUES (900004, 1, 1, 1, 3, -1, 'available');
    RAISE EXCEPTION 'negative ticket price was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO orders (
      order_id, user_id, status, reserved_at, reserved_until
    ) VALUES (
      900005, 1, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP - INTERVAL '1 minute'
    );
    RAISE EXCEPTION 'invalid reservation interval was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO payments (
      payment_id, order_id, amount, method, status, transaction_code
    ) VALUES (900006, 999999, 100, 'bank_card', 'failed', 'QA-INVALID-ORDER');
    RAISE EXCEPTION 'payment for an invalid order was accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
END
$$;

ROLLBACK;
SELECT 'phase4 constraints passed' AS result;
