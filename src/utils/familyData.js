const CSV_HEADER = 'Identity Num';

function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields;
}

function normalizeIdentity(rawIdentity) {
  const cleaned = String(rawIdentity || '').trim();
  if (!cleaned) return '';

  const segments = cleaned
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const digits = segment.replace(/\D/g, '');
      if (!digits) return null;
      return String(Number.parseInt(digits, 10)).padStart(2, '0');
    })
    .filter(Boolean);

  return segments.join('.');
}

function getSignificantSegments(identity) {
  const segments = String(identity || '').split('.').filter(Boolean);
  while (segments.length > 0 && segments[segments.length - 1] === '00') {
    segments.pop();
  }
  return segments;
}

export function compareIdentity(a, b) {
  const aParts = String(a || '').split('.').filter(Boolean).map((segment) => Number.parseInt(segment, 10));
  const bParts = String(b || '').split('.').filter(Boolean).map((segment) => Number.parseInt(segment, 10));
  const maxLength = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < maxLength; i += 1) {
    const av = Number.isFinite(aParts[i]) ? aParts[i] : -1;
    const bv = Number.isFinite(bParts[i]) ? bParts[i] : -1;
    if (av !== bv) return av - bv;
  }

  return String(a || '').localeCompare(String(b || ''));
}

export function parseFamilyCsvToTree(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    return { name: 'Family Root', branch_id: 'ROOT', children: [] };
  }

  const lines = csvText.split(/\r?\n/);
  const nodesByKey = new Map();
  const firstNodeByIdentity = new Map();
  const firstNodeBySignificantPath = new Map();
  const identityCount = new Map();
  const inferredChildCounters = new Map();
  const inputOrder = [];
  let lastValidIdentity = '';

  lines.forEach((line) => {
    if (!line || !line.trim()) return;

    const [rawIdentity = '', rawName = '', rawSpouse = ''] = parseCsvLine(line);
    const name = rawName;
    const spouse = rawSpouse;
    const rawIdentityTrimmed = rawIdentity.trim();

    if (rawIdentityTrimmed === CSV_HEADER) return;

    let identity = normalizeIdentity(rawIdentityTrimmed);

    if (!identity) {
      if (!String(name || '').trim()) {
        return;
      }

      if (!lastValidIdentity) {
        return;
      }

      const current = inferredChildCounters.get(lastValidIdentity) || 1;
      inferredChildCounters.set(lastValidIdentity, current + 1);
      identity = `${lastValidIdentity}.${String(current).padStart(2, '0')}`;
    }

    lastValidIdentity = identity;

    const count = (identityCount.get(identity) || 0) + 1;
    identityCount.set(identity, count);
    const key = count === 1 ? identity : `${identity}__${count}`;

    const node = {
      _key: key,
      branch_id: identity,
      name,
      spouse,
      children: []
    };

    nodesByKey.set(key, node);
    inputOrder.push(key);

    if (!firstNodeByIdentity.has(identity)) {
      firstNodeByIdentity.set(identity, key);
    }

    const significantPath = getSignificantSegments(identity).join('.');
    if (!firstNodeBySignificantPath.has(significantPath)) {
      firstNodeBySignificantPath.set(significantPath, key);
    }
  });

  const root = {
    _key: 'ROOT',
    branch_id: 'ROOT',
    name: 'Family Root',
    spouse: '',
    children: []
  };

  inputOrder.forEach((key) => {
    const node = nodesByKey.get(key);
    if (!node) return;

    const significantSegments = getSignificantSegments(node.branch_id);
    let parentKey = null;

    if (significantSegments.length > 0) {
      const parentSignificantPath = significantSegments.slice(0, -1).join('.');
      parentKey = firstNodeBySignificantPath.get(parentSignificantPath) || null;
    }

    if (!parentKey) {
      const directParentIdentity = node.branch_id.split('.').slice(0, -1).join('.');
      parentKey = firstNodeByIdentity.get(directParentIdentity);
    }

    const parentNode = parentKey ? nodesByKey.get(parentKey) : null;

    if (parentNode) {
      parentNode.children.push(node);
    } else {
      root.children.push(node);
    }
  });

  const sortRecursively = (node) => {
    if (!node.children || node.children.length === 0) return node;

    node.children.sort((a, b) => compareIdentity(a.branch_id, b.branch_id));
    node.children.forEach(sortRecursively);
    return node;
  };

  return sortRecursively(root);
}

export function treeToMemberRows(treeData) {
  if (!treeData) return [];

  const rows = [];

  const walk = (node) => {
    if (!node) return;

    if (node.branch_id && node.branch_id !== 'ROOT') {
      rows.push({
        _key: node._key,
        identityNum: node.branch_id,
        name: node.name || '',
        spouse: node.spouse || ''
      });
    }

    (node.children || []).forEach(walk);
  };

  if (Array.isArray(treeData)) {
    treeData.forEach(walk);
  } else {
    walk(treeData);
  }

  return rows;
}

export function buildTreeFromMemberRows(memberRows = []) {
  const rows = memberRows.filter((row) => String(row?.identityNum || '').trim());
  const nodesByKey = new Map();
  const firstNodeByIdentity = new Map();
  const firstNodeBySignificantPath = new Map();
  const identityCount = new Map();
  const inputOrder = [];

  rows.forEach((row, index) => {
    const identity = normalizeIdentity(row.identityNum);
    if (!identity) return;

    const count = (identityCount.get(identity) || 0) + 1;
    identityCount.set(identity, count);

    const key = row._key || `${identity}__${count}__${index}`;
    const node = {
      _key: key,
      branch_id: identity,
      name: row.name || '',
      spouse: row.spouse || '',
      children: []
    };

    nodesByKey.set(key, node);
    inputOrder.push(key);

    if (!firstNodeByIdentity.has(identity)) {
      firstNodeByIdentity.set(identity, key);
    }

    const significantPath = getSignificantSegments(identity).join('.');
    if (!firstNodeBySignificantPath.has(significantPath)) {
      firstNodeBySignificantPath.set(significantPath, key);
    }
  });

  const root = {
    _key: 'ROOT',
    branch_id: 'ROOT',
    name: 'Family Root',
    spouse: '',
    children: []
  };

  inputOrder.forEach((key) => {
    const node = nodesByKey.get(key);
    if (!node) return;

    const significantSegments = getSignificantSegments(node.branch_id);
    let parentKey = null;

    if (significantSegments.length > 0) {
      const parentSignificantPath = significantSegments.slice(0, -1).join('.');
      parentKey = firstNodeBySignificantPath.get(parentSignificantPath) || null;
    }

    if (!parentKey) {
      const directParentIdentity = node.branch_id.split('.').slice(0, -1).join('.');
      parentKey = firstNodeByIdentity.get(directParentIdentity);
    }

    const parentNode = parentKey ? nodesByKey.get(parentKey) : null;

    if (parentNode) {
      parentNode.children.push(node);
    } else {
      root.children.push(node);
    }
  });

  const sortRecursively = (node) => {
    if (!node.children || node.children.length === 0) return node;

    node.children.sort((a, b) => compareIdentity(a.branch_id, b.branch_id));
    node.children.forEach(sortRecursively);
    return node;
  };

  return sortRecursively(root);
}

export function getNextChildIdentity(parentId, children = []) {
  const parent = String(parentId || '').trim();
  if (!parent || parent === 'ROOT') return null;

  const parentDepth = parent.split('.').filter(Boolean).length;
  let maxSegment = 0;

  children.forEach((child) => {
    const childId = String(child?.branch_id || '').trim();
    if (!childId.startsWith(`${parent}.`)) return;

    const segments = childId.split('.').filter(Boolean);
    if (segments.length !== parentDepth + 1) return;

    const lastSegment = Number.parseInt(segments[segments.length - 1], 10);
    if (Number.isFinite(lastSegment) && lastSegment > maxSegment) {
      maxSegment = lastSegment;
    }
  });

  const next = String(maxSegment + 1).padStart(2, '0');
  return `${parent}.${next}`;
}
