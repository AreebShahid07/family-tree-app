import { buildTreeFromMemberRows } from '../utils/familyData';
import { pushToast } from '../utils/toastBus';

const centralApiBaseUrl = import.meta.env.VITE_CENTRAL_API_BASE_URL || '';

function buildApiUrl(path) {
  const base = centralApiBaseUrl.trim();
  if (!base) return path;
  return `${base.replace(/\/$/, '')}${path}`;
}

async function parseErrorResponse(res, fallbackMessage) {
  try {
    const payload = await res.json();
    if (payload?.error) return payload.error;
  } catch {
    // Ignore parse failures.
  }
  return `${fallbackMessage} (${res.status})`;
}

async function parseJsonPayload(res, fallbackMessage) {
  const contentType = String(res.headers.get('content-type') || '').toLowerCase();

  if (!contentType.includes('application/json')) {
    let preview = '';
    try {
      preview = (await res.text()).slice(0, 80);
    } catch {
      // Ignore body read failures for preview.
    }

    const normalizedPreview = preview.replace(/\s+/g, ' ').trim();
    throw new Error(
      `${fallbackMessage}. API returned non-JSON content (${contentType || 'unknown'}). ` +
      `This usually means /api is not running in local dev. Start backend with "vercel dev" ` +
      `or set VITE_CENTRAL_API_BASE_URL to your deployed domain. Preview: ${normalizedPreview || 'empty response'}`
    );
  }

  try {
    return await res.json();
  } catch {
    throw new Error(`${fallbackMessage}. Response body is not valid JSON.`);
  }
}

async function apiRequest(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const requestName = options.toastLabel || `${method} ${path}`;

  const res = await fetch(buildApiUrl(path), {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (res.ok) {
    pushToast(`${requestName} succeeded`, 'success');
  } else {
    const message = await parseErrorResponse(res.clone(), `${requestName} failed`);
    pushToast(message, 'error', 3400);
  }

  return res;
}

export async function fetchFamilyRows() {
  const res = await apiRequest('/api/family-data', { method: 'GET' });
  if (!res.ok) {
    throw new Error(await parseErrorResponse(res, 'Family data fetch failed'));
  }

  const payload = await parseJsonPayload(res, 'Family data fetch failed');
  return Array.isArray(payload?.rows) ? payload.rows : [];
}

export async function fetchFamilyTree() {
  const rows = await fetchFamilyRows();
  return buildTreeFromMemberRows(rows);
}

export async function createFamilyMember(member) {
  const res = await apiRequest('/api/family-data', {
    method: 'POST',
    body: JSON.stringify(member)
  });

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res, 'Create member failed'));
  }
}

export async function updateFamilyMember(payload) {
  const res = await apiRequest('/api/family-data', {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res, 'Update member failed'));
  }
}

export async function deleteFamilyMember(identityNum) {
  const query = new URLSearchParams({ identityNum: String(identityNum || '') });
  const res = await apiRequest(`/api/family-data?${query.toString()}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res, 'Delete member failed'));
  }
}

export async function loginAdmin(username, password) {
  const res = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res, 'Login failed'));
  }

  return parseJsonPayload(res, 'Login failed');
}

export async function verifyAdminSession() {
  const res = await apiRequest('/api/auth/verify', { method: 'GET' });
  return res.ok;
}

export async function logoutAdmin() {
  await apiRequest('/api/auth/logout', { method: 'POST' });
}

export async function submitFeedback(feedback) {
  const res = await apiRequest('/api/feedback', {
    method: 'POST',
    body: JSON.stringify(feedback)
  });

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res, 'Feedback submit failed'));
  }
}

export async function loadFeedbackEntries(filters = {}) {
  const query = new URLSearchParams();
  if (filters.search) query.set('search', filters.search);
  if (filters.fromDate) query.set('fromDate', filters.fromDate);
  if (filters.toDate) query.set('toDate', filters.toDate);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const res = await apiRequest(`/api/feedback${suffix}`, { method: 'GET' });

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res, 'Feedback load failed'));
  }

  const payload = await parseJsonPayload(res, 'Feedback load failed');
  return Array.isArray(payload?.entries) ? payload.entries : [];
}

export async function clearFeedbackEntries() {
  const res = await apiRequest('/api/feedback', { method: 'DELETE' });

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res, 'Feedback clear failed'));
  }
}
