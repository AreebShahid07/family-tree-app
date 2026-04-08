import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'node:path';

// Local dev with `vercel dev` can miss root env files in some setups.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const srvUri = process.env.MONGODB_URI;
const directUri = process.env.MONGODB_URI_DIRECT || '';
const dbName = process.env.MONGODB_DB_NAME || 'FamilyTree';
const familyCollectionName = process.env.MONGODB_COLLECTION_NAME || 'Data';
const authCollectionName = process.env.MONGODB_AUTH_COLLECTION_NAME || 'auth';
const feedbackCollectionName = process.env.MONGODB_FEEDBACK_COLLECTION_NAME || 'feedback';

if (!srvUri && !directUri) {
  throw new Error('Missing Mongo URI. Set MONGODB_URI (SRV) or MONGODB_URI_DIRECT.');
}

let cachedClient = globalThis.__familyTreeMongoClient;
let cachedUri = globalThis.__familyTreeMongoUri || '';

function createClient(uri) {
  return new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8000
  });
}

function isSrvDnsFailure(error) {
  const msg = String(error?.message || '').toLowerCase();
  return msg.includes('querysrv') || msg.includes('econnrefused') || msg.includes('enotfound') || msg.includes('dns');
}

async function ensureConnected() {
  if (cachedClient) {
    try {
      await cachedClient.connect();
      return;
    } catch {
      // Recreate below.
    }
  }

  const primaryUri = srvUri || directUri;

  try {
    cachedClient = createClient(primaryUri);
    await cachedClient.connect();
    cachedUri = primaryUri;
    globalThis.__familyTreeMongoClient = cachedClient;
    globalThis.__familyTreeMongoUri = cachedUri;
    return;
  } catch (error) {
    const canFallbackToDirect = Boolean(directUri) && primaryUri !== directUri;

    if (canFallbackToDirect && isSrvDnsFailure(error)) {
      try {
        cachedClient = createClient(directUri);
        await cachedClient.connect();
        cachedUri = directUri;
        globalThis.__familyTreeMongoClient = cachedClient;
        globalThis.__familyTreeMongoUri = cachedUri;
        return;
      } catch (fallbackError) {
        throw new Error(
          `Mongo connect failed using SRV and direct URI. SRV: ${error?.message || 'unknown'}. Direct: ${fallbackError?.message || 'unknown'}`
        );
      }
    }

    if (isSrvDnsFailure(error) && !directUri) {
      throw new Error(
        `Mongo SRV DNS lookup failed (${error?.message || 'unknown'}). Add MONGODB_URI_DIRECT from Atlas (standard connection string, non-SRV) in your local env.`
      );
    }

    throw new Error(`Mongo connect failed (${error?.message || 'unknown'})`);
  }
}

export async function getMongoCollection() {
  await ensureConnected();

  return cachedClient.db(dbName).collection(familyCollectionName);
}

export async function getMongoDb() {
  await ensureConnected();
  return cachedClient.db(dbName);
}

export async function getFamilyCollection() {
  const db = await getMongoDb();
  return db.collection(familyCollectionName);
}

export async function getAuthCollection() {
  const db = await getMongoDb();
  return db.collection(authCollectionName);
}

export async function getFeedbackCollection() {
  const db = await getMongoDb();
  return db.collection(feedbackCollectionName);
}

export function sendJson(res, statusCode, payload) {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(payload));
}
