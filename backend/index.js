// index.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// --- IMPORTANT: Load dotenv at the very beginning ---
dotenv.config();

// Load routes
const authRoutes = require('./routes/authRoutes');
const orgRoutes = require('./routes/orgRoutes');
const postRoutes = require('./routes/postRoutes');
const mailRoutes = require('./routes/mailRoutes'); // <-- IMPORT NEW MAIL ROUTES

// Optional middlewares
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger'); // Assuming you have this middleware

const app = express();

// --- CORS Configuration ---
// Consider making this more specific for production
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:5173']; // Add your frontend dev/prod URLs
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`); // Log blocked origins
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // If you use cookies or sessions
}));


// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

if (logger) { // Conditionally use logger if it exists
    app.use(logger);
}


// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Voicebox API is live 🚀' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/mail', mailRoutes); // <-- USE NEW MAIL ROUTES

// Error Handler (keep at bottom)
if (errorHandler) { // Conditionally use error handler
    app.use(errorHandler);
} else {
    // Basic fallback error handler
    app.use((err, req, res, next) => {
        console.error("Fallback Error Handler:", err.stack);
        res.status(500).send('Something broke!');
    });
}


// Mongo Connection & Server Start
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in .env file');
    process.exit(1); // Exit if DB connection string is missing
}

mongoose
  .connect(MONGO_URI) // Removed deprecated options
  .then(() => {
    console.log('✅ MongoDB Connected Successfully.');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
      console.log(`✉️  Contact form emails will be sent from: ${process.env.BREVO_SENDER_EMAIL || 'Not configured'}`);
      console.log(`✉️  Contact form emails will be sent to: ${process.env.YOUR_RECEIVING_EMAIL || 'Not configured'}`);

    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1); // Exit if DB connection fails
});