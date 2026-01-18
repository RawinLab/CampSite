// Load environment variables BEFORE any imports that might use them
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load dotenv first
const path = require('path');
const { fileURLToPath } = require('url');
const dotenv = require('dotenv');

// Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from .env in backend directory
const envPath = path.resolve(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn('Warning: .env file not found at', envPath, '- using system environment variables only');
} else {
  console.log('Loaded .env from:', envPath);
}

// Debug: log loaded CORS origins
if (process.env.CORS_ORIGINS) {
  console.log('Loaded CORS_ORIGINS:', process.env.CORS_ORIGINS);
}

// Now use require to load app synchronously
const { default: app } = require('./app.js');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
