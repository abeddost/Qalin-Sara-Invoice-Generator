-- Add soft delete column for invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
