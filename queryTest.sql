-- ====================================================================
-- DATABASE UNIT TESTS
-- Exactly matched with the finalized "create.sql" schema.
-- Includes Setup Data, Negative Tests (Constraints), and Positive Tests.
-- ====================================================================

-- ****************** 0. SETUP DATA FOR FOREIGN KEYS ******************
-- Required dummy data to satisfy NOT NULL foreign key constraints in subsequent tests.

INSERT INTO users (id, first_name, last_name, email, phone, password_hash, city, role)
VALUES (1, 'Admin', 'User', 'admin@ticket.com', '09121111111', 'hash', 'Tehran', 'Admin');

INSERT INTO venue (id, name, province, city, address, capacity)
VALUES (1, 'Azadi Stadium', 'Tehran', 'Tehran', 'West Tehran', 80000);

INSERT INTO team (id, name) VALUES (1, 'Team A'), (2, 'Team B');
INSERT INTO sport_type (id, name) VALUES (1, 'Football');
INSERT INTO league (id, name) VALUES (1, 'Pro League');
INSERT INTO organizer (id, name) VALUES (1, 'National Federation');
INSERT INTO seat_category (id, name) VALUES (1, 'VIP');

INSERT INTO match (id, home_team_id, away_team_id, venue_id, organizer_id, sport_type_id, league_id, match_date_time, title)
VALUES (1, 1, 2, 1, 1, 1, 1, '2026-09-15 18:00:00', 'Big Match');


-- ****************** 1. USERS TABLE CONSTRAINTS ******************

-- Negative Test: Attempt to insert a user with BOTH email and phone as NULL (Should Fail due to valid_email_or_phone CHECK)
INSERT INTO users (first_name, last_name, password_hash, city, role)
VALUES ('Test', 'Failed User', 'hash123', 'Tehran', 'Customer');

-- Positive Test: Insert a user providing at least one contact info and required fields (Should Pass)
INSERT INTO users (first_name, last_name, phone, password_hash, city, role)
VALUES ('Nima', 'Ahmadi', '09120000000', 'hash456', 'Tehran', 'Customer');


-- ****************** 2. MATCH TABLE CONSTRAINTS ******************

-- Negative Test: Home team and Away team IDs are identical (Should Fail due to CHECK (home_team_id <> away_team_id))
INSERT INTO match (home_team_id, away_team_id, venue_id, organizer_id, sport_type_id, league_id, match_date_time, title)
VALUES (1, 1, 1, 1, 1, 1, '2026-09-15 18:00:00', 'Invalid Match');


-- ****************** 3. TICKET_INFO TABLE CONSTRAINTS ******************

-- Negative Test: Ticket price or remaining_capacity is a negative number (Should Fail due to CHECK constraints)
INSERT INTO ticket_info (seat_category_id, match_id, price, remaining_capacity, sale_start_date, sale_end_date)
VALUES (1, 1, -50000, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '2 days');

-- Negative Test: sale_end_date is before or equal to sale_start_date (Should Fail due to CHECK (sale_end_date > sale_start_date))
INSERT INTO ticket_info (seat_category_id, match_id, price, remaining_capacity, sale_start_date, sale_end_date)
VALUES (1, 1, 150000, 100, '2026-06-10 12:00:00', '2026-06-10 11:00:00');

-- Positive Test: Valid ticket info pricing and chronological dates (Should Pass)
INSERT INTO ticket_info (id, seat_category_id, match_id, price, remaining_capacity, sale_start_date, sale_end_date)
VALUES (1, 1, 1, 250000, 500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '5 days');


-- ****************** 4. VENUE_SEAT UNIQUE CONSTRAINT ******************

-- Setup: Insert a base row into venue_seat
INSERT INTO venue_seat (id, venue_id, section, row_number, seat_number, ticket_class)
VALUES (1, 1, 'VIP-A', 5, 12, 'FirstClass');

-- Negative Test: Attempt to insert duplicate seat allocation for the same venue (Should Fail due to unique_seat_per_venue)
INSERT INTO venue_seat (id, venue_id, section, row_number, seat_number, ticket_class)
VALUES (2, 1, 'VIP-A', 5, 12, 'FirstClass');


-- ****************** 5. RESERVATION TIME CONSTRAINTS ******************

-- Negative Test: expiration_time is set before reservation_time (Should Fail due to CHECK (expiration_time > reservation_time))
INSERT INTO reservation (user_id, status, reservation_time, expiration_time)
VALUES (1, 'Pending', '2026-06-01 20:00:00', '2026-06-01 19:30:00');

-- Positive Test: Valid pending reservation structure with clear 10 minute expiration interval (Should Pass)
INSERT INTO reservation (id, user_id, status, reservation_time, expiration_time)
VALUES (1, 1, 'Pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '10 minutes');


-- ****************** 6. PAYMENT UNIQUE & CHECK CONSTRAINTS ******************

-- Negative Test: Payment amount is negative (Should Fail due to CHECK (amount >= 0))
INSERT INTO payment (user_id, reservation_id, amount, payment_method, status)
VALUES (1, 1, -20000, 'OnlineBanking', 'Pending');

-- Setup: Create a successful base payment
INSERT INTO payment (id, user_id, reservation_id, amount, payment_method, status, payment_time)
VALUES (1, 1, 1, 250000, 'CreditCard', 'Success', CURRENT_TIMESTAMP);

-- Negative Test: Duplicate payment attempt for the exact same reservation_id (Should Fail due to UNIQUE reservation_id)
INSERT INTO payment (id, user_id, reservation_id, amount, payment_method, status)
VALUES (2, 1, 1, 250000, 'CreditCard', 'Pending');


-- ****************** 7. REPORT CONDITIONAL CONSTRAINT ******************

-- Negative Test: Report without associating to either a reservation or a ticket (Should Fail due to check clause)
INSERT INTO report (user_id, report_category_id, description, status)
VALUES (1, 1, 'General problem without ticket reference', 'Pending');
