import { startServer } from './web/server';

// Log environment for debugging
console.log(`[Server] Starting with NODE_ENV=${process.env.NODE_ENV}`);

// Start the server
startServer();
