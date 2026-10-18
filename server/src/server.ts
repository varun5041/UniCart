import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';

const PORT = parseInt(process.env.PORT || '5000', 10);

const server = app.listen(PORT, () => {
  console.log(`[UniCart] Server listening on http://localhost:${PORT}`);
  console.log(`[UniCart] Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown handling
const handleShutdown = (signal: string) => {
  console.log(`[UniCart] Received ${signal}. Initiating graceful shutdown...`);
  server.close(() => {
    console.log('[UniCart] HTTP server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[UniCart] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
