import mongoose from 'mongoose';

// Treat values in query filters as literals, so a body like { "email": { "$ne": null } }
// can't turn into a query operator (NoSQL injection).
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

export async function connectDb(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  // Build the indexes declared in the models (unique email, unique like per user, TTL on sessions...).
  await mongoose.syncIndexes();
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
