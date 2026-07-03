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