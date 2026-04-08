import { clearAdminAuthCookie } from '../_lib/auth.js';
import { sendJson } from '../_lib/mongo.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  clearAdminAuthCookie(res);
  return sendJson(res, 200, { ok: true });
}
