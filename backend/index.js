const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// --- Load environment variables first ---
dotenv.config();

// Load routes
const authRoutes = require('./routes/authRoutes');
const orgRoutes = require('./routes/orgRoutes');
const postRoutes = require('./routes/postRoutes');
const mailRoutes = require('./routes/mailRoutes');

// Middlewares
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');
const logger = require('./middleware/logger');

const app = express();

// --- Enhanced Security Headers ---
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// --- CORS Configuration ---
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚨 CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma']
}));

// --- Essential Middlewares ---
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(logger);

// --- Rate Limiting (Example) ---
const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 60 * 1000, // 5 hours
  max: 250000, // Limit each IP to 250000 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', apiLimiter);

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'Voicebox API is operational 🚀',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// --- Protected Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/organizations', authMiddleware, orgRoutes);
app.use('/api/posts', authMiddleware, postRoutes);
app.use('/api/mail', mailRoutes);

// --- Error Handling ---
app.use(errorHandler);

// --- Database Connection & Server Start ---
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('🚨 FATAL ERROR: MONGO_URI is not defined in .env file');
  process.exit(1);
}

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 10000
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully');
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔒 Authentication required for protected routes`);
    console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
    console.log(`📅 Current Date and Time: ${new Date().toLocaleString()}`);
    console.log(`🔄 Uptime: ${process.uptime()} seconds`);
    console.log(`✉️  Contact form emails will be sent from: ${process.env.BREVO_SENDER_EMAIL || 'Not configured'}`);
    console.log(`✉️  Contact form emails will be sent to: ${process.env.YOUR_RECEIVING_EMAIL || 'Not configured'}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB Connection Error:', err.message);
  process.exit(1);
});

// --- Handle Uncaught Exceptions ---
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});