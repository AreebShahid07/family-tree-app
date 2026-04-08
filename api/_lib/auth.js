import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getAuthCollection, sendJson } from './mongo.js';

const jwtSecret = process.env.JWT_SECRET || 'change-me-in-production';
const defaultAdminUsername = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
const defaultAdminPassword = process.env.ADMIN_DEFAULT_PASSWORD || '123';

function parseCookieHeader(header) {
  return String(header || '')
    .split(';')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const idx = pair.indexOf('=');
      if (idx === -1) return acc;
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      acc[key] = decodeURIComponent(val);
      return acc;
    }, {});
}

function getTokenFromRequest(req) {
  const cookies = parseCookieHeader(req.headers.cookie);
  return cookies.ft_admin_token || '';
}

export function signAdminToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

export function setAdminAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookie = [
    `ft_admin_token=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    isProd ? 'Secure' : '',
    'Max-Age=604800'
  ]
    .filter(Boolean)
    .join('; ');

  res.setHeader('Set-Cookie', cookie);
}

export function clearAdminAuthCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookie = [
    'ft_admin_token=',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    isProd ? 'Secure' : '',
    'Max-Age=0'
  ]
    .filter(Boolean)
    .join('; ');

  res.setHeader('Set-Cookie', cookie);
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, jwtSecret);
  } catch {
    return null;
  }
}

export async function ensureDefaultAdminUser() {
  const authCollection = await getAuthCollection();
  await authCollection.createIndex({ username: 1 }, { unique: true });

  const exists = await authCollection.findOne({ username: defaultAdminUsername });
  if (exists) return;

  const passwordHash = await bcrypt.hash(defaultAdminPassword, 10);
  await authCollection.insertOne({
    username: defaultAdminUsername,
    passwordHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

export async function requireAdminAuth(req, res) {
  const token = getTokenFromRequest(req);
  const decoded = verifyToken(token);

  if (!decoded?.username) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return null;
  }

  return decoded;
}
