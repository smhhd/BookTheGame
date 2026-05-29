-- Enums
CREATE TYPE user_role AS ENUM ('Customer', 'Admin');

CREATE TYPE user_status AS ENUM ('active', 'disactive');

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