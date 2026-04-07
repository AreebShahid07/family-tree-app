import { Account, Client, Storage } from 'appwrite';
import { compareIdentity, treeToMemberRows } from '../utils/familyData';

const LOCAL_TREE_KEY = 'family-tree:data:v1';
const LOCAL_FEEDBACK_KEY = 'family-tree:feedback:v1';

const defaultAdminUsername = import.meta.env.VITE_ADMIN_DEFAULT_USERNAME || 'admin';
const defaultAdminPassword = import.meta.env.VITE_ADMIN_DEFAULT_PASSWORD || '123';
const centralSourceMode = String(import.meta.env.VITE_CENTRAL_SOURCE_MODE || 'off').toLowerCase();
const appwriteEndpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const appwriteProjectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const appwriteBucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID;
const appwriteCsvFileId = import.meta.env.VITE_APPWRITE_CSV_FILE_ID;
const centralMinRows = Number.parseInt(import.meta.env.VITE_CENTRAL_MIN_ROWS || '50', 10);

const appwriteClient = new Client();
const appwriteReady = Boolean(appwriteEndpoint && appwriteProjectId);

if (appwriteReady) {
  appwriteClient.setEndpoint(appwriteEndpoint).setProject(appwriteProjectId);
}

const appwriteAccount = new Account(appwriteClient);
const appwriteStorage = new Storage(appwriteClient);

let sessionReady = false;

function canUseLocalStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function loadLocalJson(key, fallback = null) {
  if (!canUseLocalStorage()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveLocalJson(key, value) {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function shouldUseCentralCsvWrite() {
  return (
    centralSourceMode === 'appwrite' &&
    appwriteReady &&
    Boolean(appwriteBucketId) &&
    Boolean(appwriteCsvFileId)
  );
}

async function ensureAnonymousSession() {
  if (sessionReady || !appwriteReady) return;

  try {
    await appwriteAccount.get();
    sessionReady = true;
    return;
  } catch {
    // No active session, create anonymous if allowed.
  }

  try {
    await appwriteAccount.createAnonymousSession();
  } catch {
    // Anonymous may be disabled; public bucket permissions can still allow access.
  }

  sessionReady = true;
}

function toCsvCell(value) {
  const text = String(value ?? '');
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

function isValidIdentity(value) {
  const identity = String(value || '').trim();
  if (!identity) return false;
  if (identity.toLowerCase() === 'infinity') return false;
  return /^\d+(\.\d+)*$/.test(identity);
}

function formatStorageError(error, fallbackMessage) {
  const msg = String(error?.message || '');
  const isCorsLike = msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror');

  if (isCorsLike) {
    return `${fallbackMessage} (likely CORS/Platform issue in Appwrite project settings).`;
  }

  return `${fallbackMessage}: ${msg || 'Unknown error'}`;
}

function treeToCsvText(treeData) {
  const rows = treeToMemberRows(treeData)
    .filter((row) => isValidIdentity(row.identityNum))
    .sort((a, b) => compareIdentity(a.identityNum, b.identityNum));

  if (rows.length < Math.max(1, centralMinRows)) {
    throw new Error(
      `Central sync blocked: only ${rows.length} valid row(s) generated. Minimum required is ${centralMinRows}. Use Restore Data from CSV first.`
    );
  }

  const lines = [
    ['Identity Num', 'Name', 'Spouse'],
    ...rows.map((row) => [row.identityNum || '', row.name || '', row.spouse || ''])
  ];

  return lines.map((line) => line.map(toCsvCell).join(',')).join('\n');
}

async function uploadTreeCsvToCentral(treeData) {
  if (!shouldUseCentralCsvWrite()) return;

  await ensureAnonymousSession();

  const csvText = treeToCsvText(treeData);
  const csvFile = new File([csvText], 'family_tree_data.csv', { type: 'text/csv' });

  // Check existence first to avoid expected 409 conflict noise in browser console.
  let fileExists = false;
  try {
    await appwriteStorage.getFile(appwriteBucketId, appwriteCsvFileId);
    fileExists = true;
  } catch (error) {
    const code = Number(error?.code || 0);
    if (code !== 404) {
      throw new Error(formatStorageError(error, 'Central file check failed'));
    }
  }

  if (fileExists) {
    try {
      await appwriteStorage.deleteFile(appwriteBucketId, appwriteCsvFileId);
    } catch (error) {
      throw new Error(formatStorageError(error, 'Central replace delete failed'));
    }
  }

  try {
    await appwriteStorage.createFile(appwriteBucketId, appwriteCsvFileId, csvFile);
  } catch (error) {
    throw new Error(formatStorageError(error, 'Central upload failed'));
  }
}

export async function loadTreeData() {
  return loadLocalJson(LOCAL_TREE_KEY, null);
}

export async function saveTreeDataLocalOnly(treeData) {
  saveLocalJson(LOCAL_TREE_KEY, treeData);
}

export async function saveTreeData(treeData) {
  await saveTreeDataLocalOnly(treeData);

  if (shouldUseCentralCsvWrite()) {
    await uploadTreeCsvToCentral(treeData);
  }
}

export async function submitFeedback(feedback) {
  const existing = loadLocalJson(LOCAL_FEEDBACK_KEY, []);
  existing.push({
    ...feedback,
    createdAt: new Date().toISOString()
  });
  saveLocalJson(LOCAL_FEEDBACK_KEY, existing);
}

export async function loadFeedbackEntries() {
  const entries = loadLocalJson(LOCAL_FEEDBACK_KEY, []);
  if (!Array.isArray(entries)) return [];

  return entries
    .filter((entry) => entry && typeof entry === 'object')
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

export async function clearFeedbackEntries() {
  saveLocalJson(LOCAL_FEEDBACK_KEY, []);
}

export async function loginAdmin(username, password) {
  if (username === defaultAdminUsername && password === defaultAdminPassword) {
    return {
      token: `admin-local-${Date.now()}`,
      adminId: 'local-default'
    };
  }

  return null;
}

export async function runStorageSetupChecks(treeData) {
  const storageAvailable = canUseLocalStorage();
  const current = loadLocalJson(LOCAL_TREE_KEY, null);
  const hasStoredTree = Boolean(current && (current.children?.length || current.branch_id));

  const checks = [
    { key: 'Data mode', ok: true, message: 'Running in local storage mode' },
    { key: 'Local storage', ok: storageAvailable, message: storageAvailable ? 'Accessible' : 'Not available in this environment' },
    { key: 'Tree data', ok: hasStoredTree, message: hasStoredTree ? 'Saved data found on this device' : 'No saved tree yet on this device' }
  ];

  if (centralSourceMode === 'appwrite') {
    checks.push({ key: 'Central source mode', ok: true, message: 'Appwrite bucket mode enabled' });
    checks.push({ key: 'Appwrite endpoint', ok: Boolean(appwriteEndpoint), message: appwriteEndpoint ? 'Configured' : 'Missing' });
    checks.push({ key: 'Appwrite project', ok: Boolean(appwriteProjectId), message: appwriteProjectId ? 'Configured' : 'Missing' });
    checks.push({ key: 'Appwrite bucket', ok: Boolean(appwriteBucketId), message: appwriteBucketId ? 'Configured' : 'Missing' });
    checks.push({ key: 'Appwrite CSV file ID', ok: Boolean(appwriteCsvFileId), message: appwriteCsvFileId ? 'Configured' : 'Missing' });
  }

  if (treeData) {
    try {
      await saveTreeData(treeData);
      checks.push({ key: 'Write test', ok: true, message: shouldUseCentralCsvWrite() ? 'Local + central save succeeded' : 'Local save succeeded' });
    } catch (error) {
      checks.push({ key: 'Write test', ok: false, message: error?.message || 'Save failed' });
    }
  }

  return checks;
}