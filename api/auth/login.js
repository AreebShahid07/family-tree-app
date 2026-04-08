import bcrypt from 'bcryptjs';
import { ensureDefaultAdminUser, setAdminAuthCookie, signAdminToken } from '../_lib/auth.js';
import { getAuthCollection, sendJson } from '../_lib/mongo.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    await ensureDefaultAdminUser();

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    if (!username || !password) {
      return sendJson(res, 400, { error: 'Missing username or password' });
    }

    const authCollection = await getAuthCollection();
    const user = await authCollection.findOne({ username });

    if (!user?.passwordHash) {
      return sendJson(res, 401, { error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return sendJson(res, 401, { error: 'Invalid credentials' });
    }

    const token = signAdminToken({ username });
    setAdminAuthCookie(res, token);

    return sendJson(res, 200, { ok: true, username });
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || 'Login failed' });
  }
}
