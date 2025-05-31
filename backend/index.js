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
const { authMiddleware } = require('./middleware/auth');
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
  'http://localhost:5173',
  'https://voicebox-anonymous-g3khw2bir-biki-hackers-projects.vercel.app',
  'https://voicebox-anonymous.vercel.app'
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

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes); // authMiddleware is applied in the router
app.use('/api/posts', postRoutes); // authMiddleware is applied in the router
app.use('/api/mail', mailRoutes);

// --- Error Handling ---
app.use(errorHandler);

// --- Request Timeout Middleware ---
app.use((req, res, next) => {
  req.setTimeout(60000, () => {
    console.error(`Request timeout for ${req.method} ${req.originalUrl}`);
    res.status(504).json({ message: 'Request timeout' });
  });
  next();
});

// --- Database Connection & Server Start ---
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('🚨 FATAL ERROR: MONGO_URI is not defined in .env file');
  process.exit(1);
}

// MongoDB connection options
const mongoOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority'
};

// MongoDB connection with retry logic
const connectWithRetry = async () => {
  try {
    await mongoose.connect(MONGO_URI, mongoOptions);
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectWithRetry();
});

const WebSocket = require('ws');

// Start server after MongoDB connection is established
mongoose.connection.once('open', () => {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔒 Authentication required for protected routes`);
    console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
    console.log(`📅 Current Date and Time: ${new Date().toLocaleString()}`);
    console.log(`🔄 Uptime: ${process.uptime()} seconds`);
    console.log(`✉️  Contact form emails will be sent from: ${process.env.BREVO_SENDER_EMAIL || 'Not configured'}`);
    console.log(`✉️  Contact form emails will be sent to: ${process.env.YOUR_RECEIVING_EMAIL || 'Not configured'}`);
  });

  // WebSocket server setup
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('message', (message) => {
      console.log('Received message from client:', message);
      // For now, just echo the message back to the client
      // ws.send(`Server received: ${message}`);
      // In a real application, you would parse the message and handle it accordingly
      // For example, if it's a new post, broadcast it to all clients
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('WebSocket server initialized and listening on the same port.');

  // Function to broadcast messages to all connected clients
  const broadcastMessage = (message) => {
    try {
      // Validate message format
      if (!message || typeof message !== 'object' || !message.type) {
        console.error('[WebSocket] Invalid message format for broadcast:', message);
        return;
      }

      const messageString = JSON.stringify(message);
      console.log(`[WebSocket] Broadcasting ${message.type} to ${wss.clients.size} clients`);
      
      let sentCount = 0;
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(messageString);
            sentCount++;
          } catch (err) {
            console.error('[WebSocket] Error sending message to client:', err);
          }
        }
      });
      
      console.log(`[WebSocket] Successfully sent ${message.type} to ${sentCount} clients`);
    } catch (err) {
      console.error('[WebSocket] Broadcast error:', err);
    }
  };

  // Make broadcastMessage available to routes
  app.set('broadcastMessage', broadcastMessage);

  // Example of how you might use broadcastMessage from your routes (this is conceptual)
  // app.post('/api/posts', async (req, res) => {
  //   // ... your existing post creation logic ...
  //   const newPost = {}; // your newly created post object
  //   broadcastMessage({ type: 'NEW_POST', payload: newPost });
  //   res.status(201).json(newPost);
  // });

  // Handle server errors
  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  });
});

// Initialize MongoDB connection
connectWithRetry();

// --- Handle Uncaught Exceptions and Rejections ---
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
  // Don't exit immediately, let the process end naturally
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});