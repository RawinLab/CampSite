-- Initial setup migration
-- This file establishes the foundation for the Camping Thailand database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'owner', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Note: Further tables will be created in Module 2 (Database & API)
