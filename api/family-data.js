import { compareIdentity } from '../src/utils/familyData.js';
import { requireAdminAuth } from './_lib/auth.js';
import { getFamilyCollection, sendJson } from './_lib/mongo.js';

function normalizeIdentity(value) {
  const raw = String(value || '').trim();
  if (!raw || !/^\d+(\.\d+)*$/.test(raw)) return '';
  return raw
    .split('.')
    .map((part) => String(Number.parseInt(part, 10)).padStart(2, '0'))
    .join('.');
}

function normalizeMember(input) {
  const identityNum = normalizeIdentity(input?.identityNum ?? input?.branch_id ?? input?.['Identity Num']);
  if (!identityNum) return null;

  return {
    identityNum,
    name: String(input?.name ?? input?.Name ?? '').trim(),
    spouse: String(input?.spouse ?? input?.Spouse ?? '').trim()
  };
}

function buildIdentityQuery(identityNum) {
  return {
    $or: [
      { identityNum },
      { branch_id: identityNum },
      { 'Identity Num': identityNum }
    ]
  };
}

async function ensureIndexes(collection) {
  const indexes = await collection.indexes();
  const identityIndex = indexes.find((index) => index.name === 'identityNum_1');

  // Existing datasets can contain duplicate or empty identity values.
  // Keep this index non-unique to avoid runtime failures during startup.
  if (identityIndex?.unique) {
    await collection.dropIndex('identityNum_1');
  }

  await collection.createIndex({ identityNum: 1 }, { name: 'identityNum_1' });
}

export default async function handler(req, res) {
  try {
    const collection = await getFamilyCollection();
    await ensureIndexes(collection);

    if (req.method === 'GET') {
      const docs = await collection
        .find(
          {},
          {
            projection: {
              _id: 0,
              _key: 1,
              identityNum: 1,
              branch_id: 1,
              name: 1,
              Name: 1,
              spouse: 1,
              Spouse: 1,
              'Identity Num': 1
            }
          }
        )
        .toArray();

      const rows = docs
        .map(normalizeMember)
        .filter(Boolean)
        .sort((a, b) => compareIdentity(a.identityNum, b.identityNum));

      return sendJson(res, 200, { rows, count: rows.length });
    }

    const auth = await requireAdminAuth(req, res);
    if (!auth) return;

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const member = normalizeMember(body);

      if (!member) {
        return sendJson(res, 400, { error: 'Invalid identity number' });
      }

      const exists = await collection.findOne(buildIdentityQuery(member.identityNum));
      if (exists) {
        return sendJson(res, 409, { error: `Identity ${member.identityNum} already exists` });
      }

      await collection.insertOne({
        ...member,
        branch_id: member.identityNum,
        Name: member.name,
        Spouse: member.spouse,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: auth.username
      });

      return sendJson(res, 200, { ok: true, member });
    }

    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const originalIdentityNum = normalizeIdentity(body.originalIdentityNum || body.previousIdentityNum || body.originalIdentity);
      const member = normalizeMember(body);

      if (!originalIdentityNum || !member) {
        return sendJson(res, 400, { error: 'Invalid identity number' });
      }

      if (originalIdentityNum !== member.identityNum) {
        const targetExists = await collection.findOne(buildIdentityQuery(member.identityNum));
        if (targetExists) {
          return sendJson(res, 409, { error: `Identity ${member.identityNum} already exists` });
        }
      }

      const result = await collection.updateOne(
        buildIdentityQuery(originalIdentityNum),
        {
          $set: {
            identityNum: member.identityNum,
            branch_id: member.identityNum,
            'Identity Num': member.identityNum,
            name: member.name,
            Name: member.name,
            spouse: member.spouse,
            Spouse: member.spouse,
            updatedAt: new Date().toISOString(),
            updatedBy: auth.username
          }
        }
      );

      if (!result.matchedCount) {
        return sendJson(res, 404, { error: `Member ${originalIdentityNum} not found` });
      }

      return sendJson(res, 200, { ok: true, member });
    }

    if (req.method === 'DELETE') {
      const identityRaw = req.query?.identityNum;
      const identityNum = normalizeIdentity(identityRaw);
      if (!identityNum) {
        return sendJson(res, 400, { error: 'Missing or invalid identity number' });
      }

      const result = await collection.deleteOne(buildIdentityQuery(identityNum));
      if (!result.deletedCount) {
        return sendJson(res, 404, { error: `Member ${identityNum} not found` });
      }

      return sendJson(res, 200, { ok: true, deleted: identityNum });
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return sendJson(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || 'MongoDB request failed' });
  }
}
