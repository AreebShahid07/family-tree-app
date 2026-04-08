import { requireAdminAuth } from './_lib/auth.js';
import { getFeedbackCollection, sendJson } from './_lib/mongo.js';

function escapeRegex(input) {
  return String(input || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseDateRange(value, endOfDay = false) {
  if (!value) return null;
  const date = new Date(`${value}${endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z'}`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

async function ensureIndexes(collection) {
  await collection.createIndex({ createdAt: -1 });
}

export default async function handler(req, res) {
  try {
    const collection = await getFeedbackCollection();
    await ensureIndexes(collection);

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const name = String(body.name || '').trim();
      const rating = String(body.rating || '').trim();
      const message = String(body.message || '').trim();

      if (!name || !message) {
        return sendJson(res, 400, { error: 'Name and message are required' });
      }

      const now = new Date();
      const doc = {
        name,
        rating,
        message,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      const result = await collection.insertOne(doc);
      return sendJson(res, 200, { ok: true, id: result.insertedId });
    }

    if (req.method === 'GET') {
      const auth = await requireAdminAuth(req, res);
      if (!auth) return;

      const term = String(req.query?.search || '').trim();
      const fromDate = parseDateRange(req.query?.fromDate, false);
      const toDate = parseDateRange(req.query?.toDate, true);

      const query = {};

      if (term) {
        const rx = new RegExp(escapeRegex(term), 'i');
        query.$or = [{ name: rx }, { rating: rx }, { message: rx }];
      }

      if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate) query.createdAt.$gte = fromDate.toISOString();
        if (toDate) query.createdAt.$lte = toDate.toISOString();
      }

      const entries = await collection
        .find(query, { projection: { _id: 0, name: 1, rating: 1, message: 1, createdAt: 1 } })
        .sort({ createdAt: -1 })
        .limit(5000)
        .toArray();

      return sendJson(res, 200, { entries, count: entries.length });
    }

    if (req.method === 'DELETE') {
      const auth = await requireAdminAuth(req, res);
      if (!auth) return;

      const result = await collection.deleteMany({});
      return sendJson(res, 200, { ok: true, deletedCount: result.deletedCount });
    }

    res.setHeader('Allow', 'POST, GET, DELETE');
    return sendJson(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || 'Feedback API failed' });
  }
}
