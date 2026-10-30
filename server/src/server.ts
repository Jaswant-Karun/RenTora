import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// API Routes
app.use('/api', apiRouter);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found on RENTORA Server`,
  });
});

// Central Error Handler
app.use(errorHandler);

// Start Server
const startServer = async () => {
  // Connect to MongoDB Atlas / Local
  await connectDB();

  app.listen(PORT, () => {
    console.log(`
=====================================================
🚀 RENTORA Backend API is live!
🏛️ Smart Institutional Resource Sharing Platform
📡 URL: http://localhost:${PORT}
🩺 Health Check: http://localhost:${PORT}/api/health
=====================================================
    `);
  });
};

startServer().catch((err) => {
  console.error('Fatal Server Boot Error:', err);
});

export default app;
