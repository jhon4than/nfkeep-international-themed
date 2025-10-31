-- Add numeric warranty_days to invoices for storing warranty in days
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'warranty_days'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN warranty_days INTEGER;
  END IF;
END$$;

-- Optional index for filtering by warranty_days (safe if column exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_invoices_warranty_days' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_invoices_warranty_days ON public.invoices(warranty_days);
  END IF;
END$$;