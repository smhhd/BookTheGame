CREATE SCHEMA IF NOT EXISTS book_the_game;
SET search_path TO book_the_game;

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE roles (
    role_id SMALLINT PRIMARY KEY,
    role_name VARCHAR(30) NOT NULL UNIQUE,

    CHECK (
        (role_id = 1 AND role_name = 'spectator')
        OR
        (role_id = 2 AND role_name = 'support')
    )
);

CREATE TABLE provinces (
    province_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE cities (
    city_id SERIAL PRIMARY KEY,
    province_id INT NOT NULL REFERENCES provinces(province_id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,

    UNIQUE (province_id, name)
);

CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    role_id SMALLINT NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT,
    city_id INT REFERENCES cities(city_id) ON DELETE SET NULL,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,

    password_hash TEXT NOT NULL,
    profile_image_url TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'active',
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (email IS NOT NULL OR phone IS NOT NULL),
    CHECK (status IN ('active', 'inactive', 'blocked')),

    UNIQUE (user_id, role_id)
);

CREATE TABLE support_users (
    user_id BIGINT PRIMARY KEY,
    support_role_id SMALLINT NOT NULL DEFAULT 2,

    CHECK (support_role_id = 2),

    FOREIGN KEY (user_id, support_role_id)
        REFERENCES users(user_id, role_id)
        ON DELETE CASCADE
);

CREATE TABLE organizers (
    organizer_id BIGSERIAL PRIMARY KEY,
    city_id INT REFERENCES cities(city_id) ON DELETE SET NULL,

    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,

    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (email IS NOT NULL OR phone IS NOT NULL),
    CHECK (status IN ('active', 'inactive'))
);

CREATE TABLE sport_types (
    sport_type_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE teams (
    team_id SERIAL PRIMARY KEY,
    sport_type_id INT NOT NULL REFERENCES sport_types(sport_type_id) ON DELETE RESTRICT,
    city_id INT REFERENCES cities(city_id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,

    UNIQUE (sport_type_id, name),
    UNIQUE (team_id, sport_type_id)
);

CREATE TABLE venues (
    venue_id SERIAL PRIMARY KEY,
    city_id INT NOT NULL REFERENCES cities(city_id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    venue_type VARCHAR(30) NOT NULL,

    CHECK (venue_type IN ('stadium', 'hall', 'arena')),
    UNIQUE (city_id, name)
);

CREATE TABLE competitions (
    competition_id SERIAL PRIMARY KEY,
    sport_type_id INT NOT NULL REFERENCES sport_types(sport_type_id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,

    UNIQUE (sport_type_id, name),
    UNIQUE (competition_id, sport_type_id)
);

CREATE TABLE matches (
    match_id BIGSERIAL PRIMARY KEY,

    sport_type_id INT NOT NULL REFERENCES sport_types(sport_type_id) ON DELETE RESTRICT,
    competition_id INT,
    organizer_id BIGINT NOT NULL REFERENCES organizers(organizer_id) ON DELETE RESTRICT,

    home_team_id INT NOT NULL,
    away_team_id INT NOT NULL,
    venue_id INT NOT NULL REFERENCES venues(venue_id) ON DELETE RESTRICT,

    match_datetime TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',

    CHECK (home_team_id <> away_team_id),
    CHECK (status IN ('scheduled', 'postponed', 'cancelled', 'finished')),

    UNIQUE (match_id, venue_id),
    UNIQUE (match_id, organizer_id, sport_type_id),

    FOREIGN KEY (home_team_id, sport_type_id)
        REFERENCES teams(team_id, sport_type_id)
        ON DELETE RESTRICT,

    FOREIGN KEY (away_team_id, sport_type_id)
        REFERENCES teams(team_id, sport_type_id)
        ON DELETE RESTRICT,

    FOREIGN KEY (competition_id, sport_type_id)
        REFERENCES competitions(competition_id, sport_type_id)
        ON DELETE RESTRICT
);

CREATE TABLE ticket_categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE seats (
    seat_id BIGSERIAL PRIMARY KEY,
    venue_id INT NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,

    section_name VARCHAR(100) NOT NULL,
    row_number VARCHAR(20) NOT NULL,
    seat_number VARCHAR(20) NOT NULL,

    UNIQUE (venue_id, section_name, row_number, seat_number),
    UNIQUE (seat_id, venue_id)
);

CREATE TABLE tickets (
    ticket_id BIGSERIAL PRIMARY KEY,

    match_id BIGINT NOT NULL,
    venue_id INT NOT NULL,
    category_id INT NOT NULL REFERENCES ticket_categories(category_id) ON DELETE RESTRICT,
    seat_id BIGINT NOT NULL,

    price NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (price >= 0),
    CHECK (status IN ('available', 'reserved', 'sold', 'cancelled')),

    UNIQUE (match_id, seat_id),
    UNIQUE (ticket_id, match_id),

    FOREIGN KEY (match_id, venue_id)
        REFERENCES matches(match_id, venue_id)
        ON DELETE CASCADE,

    FOREIGN KEY (seat_id, venue_id)
        REFERENCES seats(seat_id, venue_id)
        ON DELETE RESTRICT
);

CREATE TABLE orders (
    order_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,

    status VARCHAR(25) NOT NULL DEFAULT 'pending',
    reserved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reserved_until TIMESTAMP NOT NULL,

    CHECK (status IN ('pending', 'paid', 'partially_cancelled', 'cancelled', 'expired')),
    CHECK (reserved_until > reserved_at),

    UNIQUE (order_id, user_id)
);

CREATE TABLE reservations (
    reservation_id BIGSERIAL PRIMARY KEY,

    order_id BIGINT NOT NULL REFERENCES orders(order_id) ON DELETE RESTRICT,
    ticket_id BIGINT NOT NULL REFERENCES tickets(ticket_id) ON DELETE RESTRICT,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    price_at_reservation NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,

    CHECK (status IN ('pending', 'paid', 'cancelled', 'expired')),
    CHECK (price_at_reservation >= 0),

    UNIQUE (reservation_id, order_id),
    UNIQUE (reservation_id, order_id, ticket_id)
);

CREATE TABLE payments (
    payment_id BIGSERIAL PRIMARY KEY,

    order_id BIGINT NOT NULL REFERENCES orders(order_id) ON DELETE RESTRICT,

    amount NUMERIC(12, 2) NOT NULL,
    method VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP,
    transaction_code VARCHAR(100) UNIQUE,

    CHECK (amount >= 0),
    CHECK (method IN ('bank_card', 'wallet', 'crypto')),
    CHECK (status IN ('pending', 'success', 'failed', 'refunded')),

    UNIQUE (payment_id, order_id)
);

CREATE TABLE cancellation_policies (
    policy_id BIGSERIAL PRIMARY KEY,

    organizer_id BIGINT NOT NULL REFERENCES organizers(organizer_id) ON DELETE CASCADE,
    sport_type_id INT NOT NULL REFERENCES sport_types(sport_type_id) ON DELETE RESTRICT,

    name VARCHAR(150) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (status IN ('active', 'inactive')),

    UNIQUE (organizer_id, sport_type_id, name),
    UNIQUE (policy_id, organizer_id, sport_type_id)
);

CREATE TABLE cancellation_policy_rules (
    rule_id BIGSERIAL PRIMARY KEY,

    policy_id BIGINT NOT NULL REFERENCES cancellation_policies(policy_id) ON DELETE CASCADE,

    min_hours_before_match NUMERIC(8, 2) NOT NULL,
    max_hours_before_match NUMERIC(8, 2),
    penalty_percent NUMERIC(5, 2) NOT NULL,

    CHECK (min_hours_before_match >= 0),
    CHECK (max_hours_before_match IS NULL OR max_hours_before_match > min_hours_before_match),
    CHECK (penalty_percent >= 0 AND penalty_percent <= 100),

    UNIQUE (rule_id, policy_id)
);

ALTER TABLE cancellation_policy_rules
ADD CONSTRAINT ex_cancellation_policy_rules_no_overlap
EXCLUDE USING gist (
    policy_id WITH =,
    numrange(min_hours_before_match, max_hours_before_match, '[)') WITH &&
);

CREATE TABLE cancellation_requests (
    request_id BIGSERIAL PRIMARY KEY,

    order_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,

    request_type VARCHAR(20) NOT NULL,
    reason TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    reviewed_by_support_id BIGINT REFERENCES support_users(user_id) ON DELETE RESTRICT,
    reviewed_at TIMESTAMP,

    CHECK (request_type IN ('single_ticket', 'whole_order', 'change_seat')),
    CHECK (status IN ('pending', 'approved', 'rejected')),

    FOREIGN KEY (order_id, user_id)
        REFERENCES orders(order_id, user_id)
        ON DELETE RESTRICT,

    UNIQUE (request_id, order_id),
    UNIQUE (request_id, order_id, request_type)
);

CREATE TABLE cancellation_request_items (
    request_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,
    request_type VARCHAR(20) NOT NULL,

    reservation_id BIGINT NOT NULL,
    ticket_id BIGINT NOT NULL,
    match_id BIGINT NOT NULL,

    item_action VARCHAR(20) NOT NULL,

    requested_new_ticket_id BIGINT,

    policy_id BIGINT,
    policy_rule_id BIGINT,
    organizer_id BIGINT,
    sport_type_id INT,

    penalty_percent_applied NUMERIC(5, 2) NOT NULL DEFAULT 0,
    refund_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    CHECK (request_type IN ('single_ticket', 'whole_order', 'change_seat')),
    CHECK (item_action IN ('cancel', 'change_seat')),

    CHECK (
        (
            request_type IN ('single_ticket', 'whole_order')
            AND item_action = 'cancel'
            AND requested_new_ticket_id IS NULL
        )
        OR
        (
            request_type = 'change_seat'
            AND item_action = 'change_seat'
            AND requested_new_ticket_id IS NOT NULL
            AND requested_new_ticket_id <> ticket_id
        )
    ),

    CHECK (
        (
            policy_id IS NULL
            AND policy_rule_id IS NULL
            AND organizer_id IS NULL
            AND sport_type_id IS NULL
        )
        OR
        (
            policy_id IS NOT NULL
            AND policy_rule_id IS NOT NULL
            AND organizer_id IS NOT NULL
            AND sport_type_id IS NOT NULL
        )
    ),

    CHECK (penalty_percent_applied >= 0 AND penalty_percent_applied <= 100),
    CHECK (refund_amount >= 0),
    CHECK (status IN ('pending', 'approved', 'rejected')),

    PRIMARY KEY (request_id, reservation_id),

    FOREIGN KEY (request_id, order_id, request_type)
        REFERENCES cancellation_requests(request_id, order_id, request_type)
        ON DELETE CASCADE,

    FOREIGN KEY (reservation_id, order_id, ticket_id)
        REFERENCES reservations(reservation_id, order_id, ticket_id)
        ON DELETE RESTRICT,

    FOREIGN KEY (ticket_id, match_id)
        REFERENCES tickets(ticket_id, match_id)
        ON DELETE RESTRICT,

    FOREIGN KEY (requested_new_ticket_id, match_id)
        REFERENCES tickets(ticket_id, match_id)
        ON DELETE RESTRICT,

    FOREIGN KEY (match_id, organizer_id, sport_type_id)
        REFERENCES matches(match_id, organizer_id, sport_type_id)
        ON DELETE RESTRICT,

    FOREIGN KEY (policy_id, organizer_id, sport_type_id)
        REFERENCES cancellation_policies(policy_id, organizer_id, sport_type_id)
        ON DELETE RESTRICT,

    FOREIGN KEY (policy_rule_id, policy_id)
        REFERENCES cancellation_policy_rules(rule_id, policy_id)
        ON DELETE RESTRICT
);

CREATE TABLE refunds (
    refund_id BIGSERIAL PRIMARY KEY,

    payment_id BIGINT NOT NULL,
    cancellation_request_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,

    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    refunded_at TIMESTAMP,

    CHECK (amount >= 0),
    CHECK (status IN ('pending', 'success', 'failed')),

    FOREIGN KEY (payment_id, order_id)
        REFERENCES payments(payment_id, order_id)
        ON DELETE RESTRICT,

    FOREIGN KEY (cancellation_request_id, order_id)
        REFERENCES cancellation_requests(request_id, order_id)
        ON DELETE RESTRICT
);

CREATE TABLE report_categories (
    report_category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE reports (
    report_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,

    order_id BIGINT,
    ticket_id BIGINT,
    reservation_id BIGINT,

    report_category_id INT NOT NULL REFERENCES report_categories(report_category_id) ON DELETE RESTRICT,

    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    reviewed_by_support_id BIGINT REFERENCES support_users(user_id) ON DELETE RESTRICT,
    reviewed_at TIMESTAMP,

    CHECK (status IN ('pending', 'reviewed', 'rejected')),

    CHECK (
        (
            ticket_id IS NOT NULL
            AND reservation_id IS NULL
            AND order_id IS NULL
        )
        OR
        (
            ticket_id IS NULL
            AND reservation_id IS NOT NULL
            AND order_id IS NOT NULL
        )
    ),

    FOREIGN KEY (ticket_id)
        REFERENCES tickets(ticket_id)
        ON DELETE RESTRICT,

    FOREIGN KEY (order_id, user_id)
        REFERENCES orders(order_id, user_id)
        ON DELETE RESTRICT,

    FOREIGN KEY (reservation_id, order_id)
        REFERENCES reservations(reservation_id, order_id)
        ON DELETE RESTRICT
);

CREATE TABLE facilities (
    facility_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ticket_facilities (
    ticket_id BIGINT NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    facility_id INT NOT NULL REFERENCES facilities(facility_id) ON DELETE CASCADE,

    PRIMARY KEY (ticket_id, facility_id)
);