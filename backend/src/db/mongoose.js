import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Conditionally import mongodb-memory-server (only available in dev)
let MongoMemoryServer = null;
try {
  const mod = await import('mongodb-memory-server');
  MongoMemoryServer = mod.MongoMemoryServer;
} catch {
  // Not available in production (devDependency) — that's fine
}
const DEFAULT_DB = 'grabandgo';
const CONNECT_TIMEOUT_MS = Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 7000);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PERSISTENT_DB_PATH = path.resolve(__dirname, '..', '..', '.mongo-data');

let memoryServer = null;

/**
 * Remove stale mongod.lock file that can prevent the memory server from starting
 * when the previous process was killed without cleanup.
 */
function cleanStaleLockFile() {
  try {
    const lockFile = path.join(PERSISTENT_DB_PATH, 'mongod.lock');
    if (fs.existsSync(lockFile)) {
      // Always remove the lock file — if another mongod is using this dbPath,
      // the MongoMemoryServer.create() call will fail and we'll fall back to temp mode.
      fs.unlinkSync(lockFile);
      console.log('Removed mongod.lock file from persistent DB path');
    }
  } catch {
    // Ignore cleanup failures (e.g. file in use by another process)
  }
}

async function startMemoryServer({ useTemp = false } = {}) {
  if (!MongoMemoryServer) {
    throw new Error('mongodb-memory-server is not installed (only available in development)');
  }
  if (!memoryServer) {
    const forceTemp = process.env.DEV_MEM_DB_TMP === '1';
    const tempMode = useTemp || forceTemp;

    // Use a temp dbPath in dev when requested, otherwise keep persistent data.
    if (!tempMode) {
      fs.mkdirSync(PERSISTENT_DB_PATH, { recursive: true });
      cleanStaleLockFile();
    }
    const instanceOpts = { dbName: DEFAULT_DB };
    if (!tempMode) instanceOpts.dbPath = PERSISTENT_DB_PATH;

    try {
      memoryServer = await MongoMemoryServer.create({
        instance: instanceOpts,
      });
    } catch (createErr) {
      // If using persistent path fails (e.g., locked DB), throw so caller can try temp
      if (!tempMode) {
        throw createErr;
      }
      // For temp mode, re-throw with clearer message
      throw new Error(`Failed to start temp MongoDB: ${createErr.message}`);
    }
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
    console.log('Local MongoDB not available. Starting in-memory MongoDB...');

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
