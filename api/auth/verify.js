import { requireAdminAuth } from '../_lib/auth.js';
import { sendJson } from '../_lib/mongo.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const auth = await requireAdminAuth(req, res);
  if (!auth) return;

  return sendJson(res, 200, { ok: true, username: auth.username });
}
