-- Migration: add signature_bpm_url to tenants
-- Stores the Supabase Storage path for the BPM responsible's signature image.
-- The image is used to auto-populate POE/POES DOCX documents.
-- Path format stored: "{tenant_id}/firma_bpm.png" (within program-documents bucket)

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS signature_bpm_url TEXT;

COMMENT ON COLUMN tenants.signature_bpm_url IS
  'Supabase Storage path for BPM responsible signature image '
  '(program-documents bucket). Format: {tenant_id}/firma_bpm.png';
