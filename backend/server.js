require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const db = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const sessionRoutes = require('./routes/session.routes');
const ecgRoutes = require('./routes/ecg.routes');
const analysisRoutes = require('./routes/analysis.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/ecg', ecgRoutes);
app.use('/api/analysis', analysisRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await db.query('SELECT 1');
    console.log('Connected to PostgreSQL');
    
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    const shutdown = () => {
      console.log('Gracefully shutting down...');
      server.close(() => {
        db.pool.end();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to connect to database', error);
    process.exit(1);
  }
};

startServer();
