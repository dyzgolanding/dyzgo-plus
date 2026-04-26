-- Agrega soporte para cortesías en consumption_orders
ALTER TABLE consumption_orders
  ADD COLUMN IF NOT EXISTS order_type  TEXT NOT NULL DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS guest_email TEXT,
  ADD COLUMN IF NOT EXISTS guest_name  TEXT;
