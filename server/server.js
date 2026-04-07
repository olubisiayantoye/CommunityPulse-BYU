// server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Import database connection
import connectDB from './config/db.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { initializeWeeklySummaryScheduler } from './utils/weeklySummaryScheduler.js';

// Add import
import categoryRoutes from './routes/categoryRoutes.js';





// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// =============================================================================
// 🔒 SECURITY MIDDLEWARE
// =============================================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "https://api.huggingface.co"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
}));

// CORS - allow same origin for single deploy
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  exposedHeaders: ['X-Total-Count','X-Page-Count'],
  maxAge: 86400
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: NODE_ENV === 'production' ? 100 : 1000,
  message: {
    success: false,
    message: 'Too many requests, please try again in 15 minutes',
    retryAfter: '900'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});
app.use('/api/', limiter);

// =============================================================================
// 📊 PARSING & LOGGING
// =============================================================================
app.use(cookieParser());
app.use(express.json({ limit: '10mb', strict: true, type: ['application/json','application/csp-report'] }));
app.use(express.urlencoded({ extended: true, limit: '10mb', parameterLimit: 1000 }));

if(NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'));
}

// =============================================================================
// 🗂️ API ROUTES
// =============================================================================
app.get('/api/health', (req,res) => {
  res.status(200).json({
    success: true,
    service: 'CommunityPulse API',
    status: 'healthy',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use('/api/categories', categoryRoutes);
// =============================================================================
// ⚠️ ERROR HANDLING
// =============================================================================

// =============================================================================
// 🌐 SERVE FRONTEND (React SPA) - MUST BE LAST
// =============================================================================
const __dirname = path.resolve();
const clientDistPath = path.join(__dirname, '../client/dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');
if (fs.existsSync(clientIndexPath)) {
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    res.sendFile(clientIndexPath);
  });
}

app.use(notFound);
app.use(errorHandler);

// =============================================================================
// 🚀 SERVER STARTUP
// =============================================================================
const startServer = async () => {
  try {
    await connectDB();
    console.log('✅ MongoDB connected successfully');

    const server = app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 CommunityPulse API Server Running                    ║
║                                                           ║
║   Environment: ${NODE_ENV.padEnd(35)}║
║   Port: ${PORT.toString().padEnd(42)}║
║   URL: http://localhost:${PORT.toString().padEnd(29)}║
║                                                           ║
║   Press Ctrl+C to stop                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    initializeWeeklySummaryScheduler();

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        try {
          await mongoose.connection.close();
          console.log('🗄️  MongoDB connection closed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error('❌ Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
