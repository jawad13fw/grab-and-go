import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const DEFAULT_DB = 'grabandgo';
const CONNECT_TIMEOUT_MS = Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 7000);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PERSISTENT_DB_PATH = path.resolve(__dirname, '..', '..', '.mongo-data');

let memoryServer = null;

async function startMemoryServer({ useTemp = false } = {}) {
  if (!memoryServer) {
    const forceTemp = process.env.DEV_MEM_DB_TMP === '1';
    const tempMode = useTemp || forceTemp;

    // Use a temp dbPath in dev when requested, otherwise keep persistent data.
    if (!tempMode) fs.mkdirSync(PERSISTENT_DB_PATH, { recursive: true });
    const instanceOpts = { dbName: DEFAULT_DB };
    if (!tempMode) instanceOpts.dbPath = PERSISTENT_DB_PATH;

    memoryServer = await MongoMemoryServer.create({
      instance: instanceOpts,
    });
  }

  return memoryServer.getUri();
}

const mongoConnectOptions = {
  serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
  connectTimeoutMS: CONNECT_TIMEOUT_MS,
  socketTimeoutMS: Math.max(CONNECT_TIMEOUT_MS, 10000),
};

async function connectToUri(uri) {
  await mongoose.connect(uri, mongoConnectOptions);
  console.log('MongoDB connected successfully to', uri);
  return uri;
}

export async function connectDB() {
  const envUri = process.env.MONGODB_URI;
  const localUri = `mongodb://127.0.0.1:27017/${DEFAULT_DB}`;
  const candidateUris = process.env.NODE_ENV === 'production'
    ? [...new Set([envUri].filter(Boolean))]
    : [...new Set([envUri, localUri].filter(Boolean))];

  let lastError = null;

  for (const uri of candidateUris) {
    try {
      return await connectToUri(uri);
    } catch (error) {
      lastError = error;
      console.warn('MongoDB connection attempt failed for', uri, '-', error.message);
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    // First try persistent local path; if it's locked/busy, retry with temp mode.
    try {
      const memoryUri = await startMemoryServer({ useTemp: false });
      await connectToUri(memoryUri);
      console.log('MongoDB connected successfully to in-memory server (persistent path)');
      return memoryUri;
    } catch (memoryErr) {
      lastError = memoryErr;
      console.warn('Persistent in-memory MongoDB start failed:', memoryErr.message);

      try {
        const tempMemoryUri = await startMemoryServer({ useTemp: true });
        await connectToUri(tempMemoryUri);
        console.log('MongoDB connected successfully to in-memory server (temp path)');
        return tempMemoryUri;
      } catch (tempErr) {
        lastError = tempErr;
        console.error('Temp in-memory MongoDB start failed:', tempErr.message);
      }
    }
  }

  throw new Error(`MongoDB connection failed. Last error: ${lastError?.message || 'unknown error'}`);
}

export async function disconnectDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    console.log('MongoDB disconnected');
  } catch (err) {
    console.error('Error during MongoDB disconnect:', err);
  }

  if (memoryServer) {
    try {
      await memoryServer.stop();
    } finally {
      memoryServer = null;
    }
  }
}
