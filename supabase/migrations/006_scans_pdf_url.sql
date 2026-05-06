-- EX-1: promote pdf_url + pdf_sha256 from risk_score jsonb blob to first-class
-- columns so they are queryable and constrainable without jsonb path operators.

alter table public.inspections
  add column if not exists pdf_url    text,
  add column if not exists pdf_sha256 text;

-- Back-fill existing rows that already have pdfUrl inside the jsonb blob.
-- Runs once; safe to re-run (add column if not exists + idempotent update).
update public.inspections
set
  pdf_url    = risk_score->>'pdfUrl',
  pdf_sha256 = risk_score->>'pdfSha256'
where
  risk_score ? 'pdfUrl'
  and pdf_url is null;
