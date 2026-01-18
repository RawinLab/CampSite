-- Google Places API Integration - Module 12
-- Create ENUM types for sync status and import candidate status

-- Sync status enum for tracking Google Places sync operations
CREATE TYPE sync_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Import candidate status enum for tracking campsite import workflow
CREATE TYPE import_candidate_status AS ENUM ('pending', 'approved', 'rejected', 'imported');

-- Add comment for documentation
COMMENT ON TYPE sync_status IS 'Status of Google Places sync operations: pending, processing, completed, failed';
COMMENT ON TYPE import_candidate_status IS 'Status of import candidates: pending, approved, rejected, imported';
