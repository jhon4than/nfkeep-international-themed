-- Fix runtime error: record "new" has no field "warranty_months"
-- Root cause: a trigger/function (update_warranty_end) references NEW.warranty_months
-- but the current public.invoices table in your environment does not have this column.

-- Safely drop trigger if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_warranty_end'
  ) THEN
    DROP TRIGGER set_warranty_end ON public.invoices;
  END IF;
END$$;

-- Safely drop function if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'update_warranty_end' AND n.nspname = 'public'
  ) THEN
    DROP FUNCTION public.update_warranty_end();
  END IF;
END$$;

-- Optional clean-up: drop index on warranty_end if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_invoices_warranty_end' AND n.nspname = 'public'
  ) THEN
    DROP INDEX public.idx_invoices_warranty_end;
  END IF;
END$$;

-- NOTE: We do NOT drop columns here to avoid schema drift where environments differ.
-- If you want warranty support, create the columns instead of dropping the trigger.
-- See alternative SQL in docs or apply via Supabase SQL editor:
--   ALTER TABLE public.invoices ADD COLUMN warranty_months INTEGER DEFAULT 3;
--   ALTER TABLE public.invoices ADD COLUMN warranty_end DATE;
--   CREATE OR REPLACE FUNCTION public.update_warranty_end() RETURNS TRIGGER AS $$
--   BEGIN
--     IF NEW.warranty_months IS NOT NULL AND NEW.issue_date IS NOT NULL THEN
--       NEW.warranty_end := NEW.issue_date + (NEW.warranty_months || ' months')::interval;
--     END IF;
--     RETURN NEW;
--   END; $$ LANGUAGE plpgsql;
--   CREATE TRIGGER set_warranty_end BEFORE INSERT OR UPDATE ON public.invoices
--   FOR EACH ROW EXECUTE FUNCTION public.update_warranty_end();