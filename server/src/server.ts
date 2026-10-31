import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Production-ready CORS Configuration
const allowedOriginsList = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()) : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server health checks)
      if (!origin) return callback(null, true);

      if (
        process.env.NODE_ENV !== 'production' ||
        origin.includes('vercel.app') ||
        origin.includes('onrender.com') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        allowedOriginsList.some((allowed) => allowed && origin.startsWith(allowed.replace(/\/+$/, '')))
      ) {
        return callback(null, true);
      }

      // Permissive fallback so users' Vercel deployments are never rejected
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Top-level /health check for cloud load-balancers & container orchestrators
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    platform: 'RENTORA',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

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

  const portNumber = Number(PORT) || 5000;
  app.listen(portNumber, '0.0.0.0', () => {
    console.log(`
=====================================================
🚀 RENTORA Backend API is live!
🏛️ Smart Institutional Resource Sharing Platform
📡 Port: ${portNumber} (host: 0.0.0.0)
🩺 Health Check: http://localhost:${portNumber}/health
=====================================================
    `);
  });
};

startServer().catch((err) => {
  console.error('Fatal Server Boot Error:', err);
});

export default app;
