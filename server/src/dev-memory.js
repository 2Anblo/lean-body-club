// Runs the API on a throwaway in-memory MongoDB filled with the demo data.
// For trying the full stack without installing MongoDB:  npm run dev:memory
// Everything is lost when the process stops.
import { MongoMemoryServer } from 'mongodb-memory-server';
import { loadConfig } from './config.js';
import { connectDb } from './db/connect.js';
import { seedDatabase } from './db/seed.js';
import { createApp } from './app.js';

const config = loadConfig();
const mongo = await MongoMemoryServer.create();
await connectDb(mongo.getUri());
await seedDatabase({ bcryptRounds: 4 });

createApp(config).listen(config.port, () => {
  console.log(`Lean Body Club API (in-memory DB) on http://localhost:${config.port}/api`);
  console.log('Demo sign-in: zhanboc2@illinois.edu / password123');
});

const stop = async () => {
  await mongo.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
