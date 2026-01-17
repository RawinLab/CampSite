// Load environment variables BEFORE any imports that might use them
import dotenv from 'dotenv';
import path from 'path';

// Load from .env in backend directory (one level up from src/)
// Note: __dirname is available in CommonJS context
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Debug: log loaded CORS origins (remove in production)
if (process.env.CORS_ORIGINS) {
  console.log('Loaded CORS_ORIGINS:', process.env.CORS_ORIGINS);
}

// Now import the rest of the application
import app from './app';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
