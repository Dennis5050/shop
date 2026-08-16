import http from 'http';
import app from './app.js';
import config from './config/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initializeSocketServer } from './sockets/index.js';
import { logger } from './utils/logger.js';

const httpServer = http.createServer(app);

// Initialize Socket.IO Server
const io = initializeSocketServer(httpServer);

async function startServer() {
  try {
    await connectDatabase();

    const PORT = config.server.port;
    httpServer.listen(PORT, () => {
      logger.info(`========================================================`);
      logger.info(`  🚀 Nexus Real-Time Server running on port ${PORT}`);
      logger.info(`  🌐 Environment: ${config.server.env}`);
      logger.info(`  💬 Socket.IO: Ready for real-time WebSocket traffic`);
      logger.info(`  📡 REST API: http://localhost:${PORT}/api/v1`);
      logger.info(`========================================================`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful Shutdown
const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  io.close(() => {
    logger.info('Socket.IO server closed');
  });

  httpServer.close(async () => {
    logger.info('HTTP server closed');
    await disconnectDatabase();
    process.exit(0);
  });

  // Force close after 10s if stuck
  setTimeout(() => {
    logger.error('Forcing server shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { httpServer, io };
export default httpServer;
