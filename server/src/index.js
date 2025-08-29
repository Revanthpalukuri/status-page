import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import dotenv from 'dotenv';

import sequelize from './database/config.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import organizationRoutes from './routes/organizations.js';
import serviceRoutes from './routes/services.js';
import incidentRoutes from './routes/incidents.js';
import publicRoutes from './routes/public.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Initialize Socket.io
const io = new SocketServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting removed as requested

app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/public', publicRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join organization room for real-time updates
  socket.on('join-organization', (organizationId) => {
    socket.join(`org-${organizationId}`);
    console.log(`Socket ${socket.id} joined organization room: org-${organizationId}`);
  });

  // Join public status page room
  socket.on('join-status-page', (organizationSlug) => {
    socket.join(`status-${organizationSlug}`);
    console.log(`Socket ${socket.id} joined status page room: status-${organizationSlug}`);
  });

  // Leave organization room
  socket.on('leave-organization', (organizationId) => {
    socket.leave(`org-${organizationId}`);
    console.log(`Socket ${socket.id} left organization room: org-${organizationId}`);
  });

  // Leave status page room
  socket.on('leave-status-page', (organizationSlug) => {
    socket.leave(`status-${organizationSlug}`);
    console.log(`Socket ${socket.id} left status page room: status-${organizationSlug}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// WebSocket event emitters (to be used by other parts of the application)
export const emitToOrganization = (organizationId, event, data) => {
  io.to(`org-${organizationId}`).emit(event, data);
};

export const emitToStatusPage = (organizationSlug, event, data) => {
  io.to(`status-${organizationSlug}`).emit(event, data);
};

// Example usage of WebSocket emitters:
// emitToOrganization('org-123', 'service-updated', { serviceId: '456', status: 'operational' });
// emitToStatusPage('demo-company', 'incident-created', { incidentId: '789', title: 'New Incident' });

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Database connection and server startup
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync database models (create tables if they don't exist)
    try {
      await sequelize.sync({ 
        force: false, // Never drop tables
        alter: false  // Don't alter existing tables to avoid constraint conflicts
      });
      console.log('✅ Database models synchronized.');
    } catch (syncError) {
      console.warn('⚠️ Database sync had issues, trying without alter:', syncError.message);
      // If sync fails, try again without any modifications
      await sequelize.sync({ force: false, alter: false });
      console.log('✅ Database models synchronized (minimal mode).');
    }

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 WebSocket server ready for real-time connections`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
        console.log(`📋 Example Status Page: http://localhost:${PORT}/api/public/status/demo-company`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  
  try {
    await sequelize.close();
    console.log('✅ Database connection closed.');
    
    server.close(() => {
      console.log('✅ Server closed.');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received. Shutting down gracefully...');
  
  try {
    await sequelize.close();
    server.close(() => {
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
startServer();

export default app;
