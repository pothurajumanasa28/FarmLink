require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const { apiLimiter } = require('./src/middleware/rateLimiter');

// Initialize MongoDB connection
connectDB();

const app = express();

// Security and CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: This origin is not allowed by Access-Control-Allow-Origin.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply rate limiting to all standard API calls
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    name: 'FarmLink — Local Farm-to-Institution Procurement API',
    time: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/listings', require('./src/routes/listingRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/bulk-requirements', require('./src/routes/bulkRequirementRoutes'));
app.use('/api/bulk-offers', require('./src/routes/bulkOfferRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/feedback', require('./src/routes/feedbackRoutes'));
app.use('/api/complaints', require('./src/routes/complaintRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.originalUrl}`
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err.name || 'Error', err.message);
  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode === 500 ? 'An internal server error occurred.' : (err.message || 'Internal server error'),
    stack: isProduction ? undefined : err.stack
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Server] Farm Procurement API running on port ${PORT}`);
    console.log(`[Institution] Seshadri Rao Gudlavalleru Engineering College`);
  });
}

module.exports = app;
