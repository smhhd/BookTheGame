-- Enums
CREATE TYPE user_role AS ENUM ('Customer', 'Admin');

CREATE TYPE user_status AS ENUM ('active', 'disactive');

CREATE TYPE reservation_status AS ENUM ('Pending', 'Reserved', 'Cancelled', 'Expired');

CREATE TYPE payment_status AS ENUM ('Pending', 'Success', 'Failed', 'Refunded');

CREATE TYPE payment_method AS ENUM (
  'CreditCard',
  'Wallet',
  'Crypto',
  'OnlineBanking'
);

-- Tables
CREATE TABLE user (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'Customer',
  status user_status NOT NULL DEFAULT 'active',
  registration_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  credit INTEGER NOT NULL DEFAULT 0,
  user_pic_url VARCHAR(500),
  CONSTRAINT valid_email_or_phone CHECK (
    email IS NOT NULL
    OR phone IS NOT NULL
  )
);

CREATE TABLE seat_category (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE ticket_amenity (
  id SERIAL PRIMARY KEY,
  amenity_name VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE venue (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  province VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity >= 0)
);

CREATE TABLE organizer (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  contact_info TEXT,
  cancelation_policy JSON
);

CREATE TABLE team (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  logo_url VARCHAR(500)
);

CREATE TABLE sport_type (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE league (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL
);

CREATE TABLE venue_seat (
  id SERIAL,
  venue_id INTEGER NOT NULL,
  section VARCHAR(50) NOT NULL,
  row_number INTEGER NOT NULL,
  seat_number INTEGER NOT NULL,
  ticket_class VARCHAR(50) NOT NULL,
  PRIMARY KEY (id, venue_id),
  FOREIGN KEY (venue_id) REFERENCES venue(id) ON DELETE CASCADE,
  CONSTRAINT unique_seat_per_venue UNIQUE (venue_id, section, row_number, seat_number)
);

CREATE TABLE match (
  id SERIAL PRIMARY KEY,
  home_team_id INTEGER NOT NULL,
  away_team_id INTEGER NOT NULL,
  venue_id INTEGER NOT NULL,
  organizer_id INTEGER NOT NULL,
  sport_type_id INTEGER NOT NULL,
  league_id INTEGER NOT NULL,
  match_date_time TIMESTAMP NOT NULL,
  title VARCHAR(200) NOT NULL,
  FOREIGN KEY (home_team_id) REFERENCES team(id),
  FOREIGN KEY (away_team_id) REFERENCES team(id),
  FOREIGN KEY (venue_id) REFERENCES venue(id),
  FOREIGN KEY (organizer_id) REFERENCES organizer(id),
  FOREIGN KEY (sport_type_id) REFERENCES sport_type(id),
  FOREIGN KEY (league_id) REFERENCES league(id),
  CHECK (home_team_id <> away_team_id)
);

CREATE TABLE ticket_info (
  id SERIAL PRIMARY KEY,
  seat_category_id INTEGER NOT NULL,
  match_id INTEGER NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  remaining_capacity INTEGER NOT NULL CHECK (remaining_capacity >= 0),
  sale_start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sale_end_date TIMESTAMP NOT NULL,
  FOREIGN KEY (seat_category_id) REFERENCES seat_category(id),
  FOREIGN KEY (match_id) REFERENCES match(id) ON DELETE CASCADE,
  CHECK (sale_end_date > sale_start_date)
);

CREATE TABLE ticket_info_ticket_amenity (
  ticket_info_id INTEGER NOT NULL,
  ticket_amenity_id INTEGER NOT NULL,
  PRIMARY KEY (ticket_info_id, ticket_amenity_id),
  FOREIGN KEY (ticket_info_id) REFERENCES ticket_info(id) ON DELETE CASCADE,
  FOREIGN KEY (ticket_amenity_id) REFERENCES ticket_amenity(id) ON DELETE CASCADE
);

CREATE TABLE ticket (
  id SERIAL PRIMARY KEY,
  ticket_info_id INTEGER NOT NULL,
  venue_seat_id INTEGER NOT NULL,
  venue_id INTEGER NOT NULL,
  FOREIGN KEY (ticket_info_id) REFERENCES ticket_info(id) ON DELETE CASCADE,
  FOREIGN KEY (venue_seat_id, venue_id) REFERENCES venue_seat(id, venue_id) ON DELETE CASCADE,
  UNIQUE (ticket_info_id, venue_seat_id)
);

CREATE TABLE reservation (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  status reservation_status NOT NULL DEFAULT 'Pending',
  reservation_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expiration_time TIMESTAMP NOT NULL,
  cancelled_by_user_id INTEGER,
  cancelled_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (cancelled_by_user_id) REFERENCES user(id),
  CHECK (expiration_time > reservation_time),
  CHECK (
    cancelled_at IS NULL
    OR cancelled_at >= reservation_time
  )
);

CREATE TABLE reservation_ticket (
  reservation_id INTEGER NOT NULL,
  ticket_id INTEGER NOT NULL,
  PRIMARY KEY (reservation_id, ticket_id),
  FOREIGN KEY (reservation_id) REFERENCES reservation(id) ON DELETE CASCADE,
  FOREIGN KEY (ticket_id) REFERENCES ticket(id) ON DELETE CASCADE
);

CREATE TABLE payment (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  reservation_id INTEGER NOT NULL UNIQUE,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  payment_method payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'Pending',
  payment_time TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id),
  FOREIGN KEY (reservation_id) REFERENCES reservation(id) ON DELETE CASCADE
);

CREATE TABLE report (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  report_category_id INTEGER NOT NULL,
  reservation_id INTEGER,
  ticket_id INTEGER,
  description TEXT,
  admin_id INTEGER,
  admin_response TEXT,
  status report_status NOT NULL DEFAULT 'Pending',
  FOREIGN KEY (user_id) REFERENCES user(id),
  FOREIGN KEY (report_category_id) REFERENCES report_category(id),
  FOREIGN KEY (reservation_id) REFERENCES reservation(id) ON DELETE SET NULL,
  FOREIGN KEY (ticket_id) REFERENCES ticket(id) ON DELETE SET NULL,
  FOREIGN KEY (admin_id) REFERENCES user(id),
  CHECK (
    reservation_id IS NOT NULL
    OR ticket_id IS NOT NULL
  )
);

CREATE INDEX idx_user_email ON user(email) WHERE email IS NOT NULL;
CREATE INDEX idx_user_phone ON user(phone) WHERE phone IS NOT NULL;

CREATE INDEX idx_reservation_user ON reservation(user_id);
CREATE INDEX idx_reservation_status_expiration ON reservation(status, expiration_time);

CREATE INDEX idx_payment_user ON payment(user_id);
CREATE INDEX idx_payment_reservation ON payment(reservation_id);

CREATE INDEX idx_match_datetime ON match(match_date_time);
CREATE INDEX idx_match_teams ON match(home_team_id, away_team_id);
CREATE INDEX idx_match_venue ON match(venue_id);
CREATE INDEX idx_match_sport_league ON match(sport_type_id, league_id);

CREATE INDEX idx_ticketinfo_match ON ticket_info(match_id);
CREATE INDEX idx_ticketinfo_seatcategory ON ticket_info(seat_category_id);
CREATE INDEX idx_ticketinfo_price ON ticket_info(price);

CREATE INDEX idx_report_user ON report(user_id);
CREATE INDEX idx_report_status ON report(status);