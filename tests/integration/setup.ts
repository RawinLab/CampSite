/**
 * Jest setup file for integration tests
 * Loads environment variables before running tests
 */

// Import dotenv from the backend's node_modules
const dotenv = require('../../apps/campsite-backend/node_modules/dotenv');
const path = require('path');

// Load environment variables from the root .env file
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Map environment variables to expected names
// The .env file uses different names than the backend expects
if (process.env.SUPABASE_PUBLIC_URL && !process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.SUPABASE_PUBLIC_URL;
}

if (process.env.SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;
}

// Verify critical environment variables are loaded
if (!process.env.SUPABASE_URL) {
  console.warn('Warning: SUPABASE_URL not loaded from .env file');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY not loaded from .env file');
}
