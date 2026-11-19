import { loadConfig } from './config.js';
import { connectDb, disconnectDb } from './db/connect.js';
import { createApp } from './app.js';

const config = loadConfig();

try {
  await connectDb(config.mongoUri);
} catch (err) {
  console.error(`Could not connect to MongoDB: ${err.message}`);
  console.error('Set MONGODB_URI in server/.env (see .env.example).');
  process.exit(1);
}

const server = createApp(config).listen(config.port, () => {
  console.log(`Lean Body Club API listening on http://localhost:${config.port}/api`);
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down.`);
  server.close();
  await disconnectDb();
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
