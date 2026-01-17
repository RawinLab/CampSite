// Load environment variables BEFORE any imports that might use them
import dotenv from 'dotenv';
dotenv.config();

// Now import the rest of the application
import app from './app';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
