const mongoose = require('mongoose');

let mongod = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/guardian_agent';
  
  try {
    // Attempt connecting to configured URI with short timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[DB] Connected to MongoDB at ${uri}`);
  } catch (err) {
    console.warn(`[DB] Primary MongoDB connection failed (${err.message}). Starting embedded memory database...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[DB] Connected to embedded in-memory MongoDB at ${memoryUri}`);
    } catch (memErr) {
      console.error('[DB] Failed to initialize embedded MongoDB:', memErr.message);
      throw memErr;
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error('[DB] Mongoose connection error:', err);
  });
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}

module.exports = { connectDB, disconnectDB };
