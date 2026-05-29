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