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