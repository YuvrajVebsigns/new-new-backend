const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

dns.setServers(['1.1.1.1', '8.8.8.8']);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

const collections = [
  'attendees',
  'cxo_network_members',
  'nominations',
  'nomination_categories',
];

async function run() {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  const db = mongoose.connection.db;

  for (const collName of collections) {
    const exists = await db.listCollections({ name: collName }).hasNext();
    console.log(`${collName}: ${exists ? 'exists' : 'missing'}`);
    if (exists) {
      await db.collection(collName).drop();
      console.log(`Dropped collection ${collName}`);
    }
  }

  await mongoose.disconnect();
  console.log('Cleanup complete.');
}

run().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});