import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { v2 as cloudinary } from 'cloudinary'; // Optional: for avatar uploads

// Import database connection
import connectDB from './config/db.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// =============================================================================
// 🔒 SECURITY MIDDLEWARE
// =============================================================================

// Helmet - Set security HTTP headers
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
  crossOriginEmbedderPolicy: false, // Required for some frontend features
  crossOriginOpenerPolicy: false,
}));

// CORS - Configure cross-origin resource sharing
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // Cache preflight requests for 24 hours
}));

// Rate Limiting - Prevent API abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More lenient in dev
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
// 📊 PARSING & LOGGING MIDDLEWARE
// =============================================================================

// Cookie Parser - Parse cookies for JWT authentication
app.use(cookieParser());

// Body Parser - Parse JSON and URL-encoded data
app.use(express.json({ 
  limit: '10mb',
  strict: true,
  type: ['application/json', 'application/csp-report']
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 1000
}));

// Morgan - HTTP request logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Custom format for production logging
  app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'));
}

// =============================================================================
// 🗂️ API ROUTES
// =============================================================================

// Health check endpoint (for monitoring & load balancers)
app.get('/api/health', (req, res) => {
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

// Mount route handlers
app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);

// =============================================================================
// ⚠️ ERROR HANDLING MIDDLEWARE
// =============================================================================

// 404 Handler - Route not found
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

// =============================================================================
// 🚀 SERVER STARTUP
// =============================================================================

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ MongoDB connected successfully');

    // Start Express server
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

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Export app for testing
export default app;