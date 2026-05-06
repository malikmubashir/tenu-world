# EX-1 — PDF Generation Leg

**Status:** implementation  
**Author:** CC (runbook-2026-05-06)  
**Date:** 2026-05-06

---

## Goal

Surface the scan PDF as a first-class database column (`pdf_url`, `pdf_sha256` on
`inspections`) instead of a side-car key buried inside the `risk_score` jsonb blob.
Add a dedicated `/api/pdf/build` route that on-demand regenerates the PDF and
returns a short-lived presigned download URL.

---

## Context

`src/lib/pdf/scan-report.tsx` and `src/lib/pdf/render-and-upload.tsx` already
exist and work. `/api/ai/scan` already calls `renderAndUploadScanPdf` and stores
`pdfUrl` in the `risk_score` jsonb blob. The gaps are:

1. No dedicated `pdf_url` / `pdf_sha256` columns — hard to query, no constraint.
2. No SHA-256 fingerprint — can't verify download integrity.
3. No dedicated route to regenerate or fetch a time-limited presigned URL.

---

## Database change

**`supabase/migrations/006_scans_pdf_url.sql`**

```sql
alter table public.inspections
  add column if not exists pdf_url    text,
  add column if not exists pdf_sha256 text;
```

`pdf_url` is the permanent R2 path (not a presigned URL — those expire).  
`pdf_sha256` is the hex SHA-256 of the rendered PDF buffer.

---

## `render-and-upload.tsx` changes

- Accept optional `presign: boolean` flag.
- Compute `sha256 = crypto.createHash('sha256').update(buffer).digest('hex')`.
- Always return `{ key, url, sizeBytes, sha256 }`.
- When `presign: true`, also return `{ presignedUrl }` via
  `getSignedUrl(s3, new GetObjectCommand(...), { expiresIn: 7200 })`.

---

## New route: `/api/pdf/build`

```
POST /api/pdf/build
Body: { scan_id: string }   // scan_id === inspectionId
Auth: user session (same as /api/ai/scan)
export const runtime    = 'nodejs'
export const maxDuration = 60
```

**Steps:**

1. Authenticate user, verify ownership of `scan_id`.
2. If `inspections.pdf_url` is already populated, skip render — just generate
   a fresh presigned URL from the stored key and return it.
3. Otherwise, fetch rooms + photos (admin client), call `renderAndUploadScanPdf`,
   persist `pdf_url` and `pdf_sha256` on `inspections`, return presigned URL.

**Response:**

```json
{ "url": "<presigned-url-2h>", "sha256": "<hex>" }
```

---

## `/api/ai/scan` wire-up

After the PDF render succeeds, additionally `UPDATE inspections SET pdf_url =
$1, pdf_sha256 = $2` using the returned values. Keep the `pdfUrl` field inside
`risk_score` jsonb for backwards compatibility during migration.

---

## Acceptance criteria

- [ ] `tsc --noEmit` clean.
- [ ] `GET /api/pdf/build` (wrong method) returns 405.
- [ ] POST with valid `scan_id` returns `{ url, sha256 }` where `url` starts with
      `https://` and `sha256` is a 64-char hex string.
- [ ] `inspections` row has `pdf_url` and `pdf_sha256` populated after a scan.
- [ ] Route header `Content-Type: application/json` (not HTML).
