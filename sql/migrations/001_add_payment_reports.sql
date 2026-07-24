SET search_path TO book_the_game;

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS payment_id BIGINT;

DO $$
DECLARE constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'book_the_game.reports'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%ticket_id%reservation_id%';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE reports DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE reports
  DROP CONSTRAINT IF EXISTS reports_exactly_one_subject,
  ADD CONSTRAINT reports_exactly_one_subject CHECK (
    num_nonnulls(ticket_id, reservation_id, payment_id) = 1
    AND (reservation_id IS NULL OR order_id IS NOT NULL)
    AND (payment_id IS NULL OR order_id IS NOT NULL)
  ),
  DROP CONSTRAINT IF EXISTS reports_payment_order_fk,
  ADD CONSTRAINT reports_payment_order_fk
    FOREIGN KEY (payment_id, order_id)
    REFERENCES payments(payment_id, order_id)
    ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_reports_payment_id ON reports(payment_id);
