const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const orgRoutes = require('./routes/orgRoutes');
const postRoutes = require('./routes/postRoutes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/posts', postRoutes);

// ERROR HANDLER
app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log('Server running on port ' + (process.env.PORT || 5000));
    });
  })
  .catch((err) => console.error('MongoDB connection error:', err));
