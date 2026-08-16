SET search_path TO book_the_game;

-- Optional profile data requested by phase 3. Existing users remain valid.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(14, 2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'book_the_game.users'::regclass
      AND conname = 'users_birth_date_before_registration'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_birth_date_before_registration
      CHECK (birth_date IS NULL OR birth_date <= registered_at::date);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'book_the_game.users'::regclass
      AND conname = 'users_wallet_balance_nonnegative'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_wallet_balance_nonnegative
      CHECK (wallet_balance >= 0);
  END IF;
END $$;

-- A support user can now leave the textual response required by the assignment.
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS support_response TEXT;
