// Loads the demo data into MongoDB.
//
//   npm run seed               wipe every collection, then insert the demo data
//   npm run seed -- --if-empty only seed a database that has no users yet (safe for deploys)
//
// Every seed account's password is "password123". Demo sign-in: zhanboc2@illinois.edu.
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { loadConfig } from '../config.js';
import { connectDb, disconnectDb } from './connect.js';
import { CheckIn, Comment, Group, Like, Membership, Session, User } from '../models/index.js';
import { DEMO_PASSWORD, buildSeed } from './seedData.js';

const ALL = [User, Session, Group, Membership, CheckIn, Like, Comment];

/** Inserts the demo data into an already-connected database. Returns the created documents by key. */
export async function seedDatabase({ now = new Date(), bcryptRounds = 10, wipe = true } = {}) {
  if (wipe) await Promise.all(ALL.map((Model) => Model.deleteMany({})));
  const data = buildSeed(now);
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, bcryptRounds);

  const users = {};
  for (const { key, ...u } of data.users) users[key] = await User.create({ ...u, passwordHash });

  const groups = {};
  for (const { key, ...g } of data.groups) groups[key] = await Group.create(g);

  await Membership.insertMany(data.memberships.map((m) => ({ ...m, user: users[m.user]._id, group: groups[m.group]._id })));

  const checkIns = {};
  for (const { key, user, group, createdAt, ...c } of data.checkIns) {
    // timestamps: false keeps the backdated createdAt from the seed.
    const [doc] = await CheckIn.insertMany(
      [{ ...c, user: users[user]._id, group: group ? groups[group]._id : null, createdAt, updatedAt: createdAt }],
      { timestamps: false },
    );
    checkIns[key] = doc;
  }

  await Like.insertMany(data.likes.map((l) => ({ user: users[l.user]._id, checkIn: checkIns[l.checkIn]._id })));
  await Comment.insertMany(
    data.comments.map((m) => ({ text: m.text, user: users[m.user]._id, checkIn: checkIns[m.checkIn]._id, createdAt: m.createdAt, updatedAt: m.createdAt })),
    { timestamps: false },
  );

  return { users, groups, checkIns };
}

async function main() {
  const config = loadConfig();
  const ifEmpty = process.argv.includes('--if-empty');
  await connectDb(config.mongoUri);
  try {
    if (ifEmpty && (await User.estimatedDocumentCount()) > 0) {
      console.log('Database already has data; skipping seed.');
      return;
    }
    if (!ifEmpty && config.env === 'production' && !process.argv.includes('--force')) {
      console.error('Refusing to wipe a production database. Use --if-empty, or --force if you really mean it.');
      process.exitCode = 1;
      return;
    }
    await seedDatabase({ bcryptRounds: config.bcryptRounds });
    console.log('Seeded demo data. Sign in as zhanboc2@illinois.edu / password123.');
  } finally {
    await disconnectDb();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
