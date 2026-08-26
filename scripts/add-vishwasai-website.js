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

async function run() {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  const db = mongoose.connection.db;
  const websites = db.collection('websites');

  const websiteData = {
    name: 'Vishwas AI',
    slug: 'vishwasai',
    domain: 'https://vishwasai.in/',
    allowedDomains: ['https://vishwasai.in/'],
    description: 'Official website of Vishwas AI',
    isActive: true,
    settings: {},
    seo: {
      metaTitle: 'Vishwas AI',
      metaDescription: 'Official website of Vishwas AI',
      metaKeywords: ['vishwasai', 'ai', 'website'],
      ogImage: '',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: null,
  };

  const existing = await websites.findOne({ slug: websiteData.slug });
  if (existing) {
    console.log('Website already exists with slug:', websiteData.slug);
    await mongoose.disconnect();
    return;
  }

  const result = await websites.insertOne(websiteData);
  console.log('Website created with _id:', result.insertedId.toString());
  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error inserting website:', err);
    process.exit(1);
  });