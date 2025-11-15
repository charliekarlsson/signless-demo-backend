#!/usr/bin/env node
import { argv, exit } from 'node:process';
import { URL } from 'node:url';

const USAGE = `Usage: node scripts/check-railway.mjs <railway-base-url>

Example:
  node scripts/check-railway.mjs https://signless-production.up.railway.app
`;

const baseUrl = argv[2];

if (!baseUrl || baseUrl === '--help' || baseUrl === '-h') {
  console.error(USAGE);
  exit(baseUrl ? 0 : 1);
}

let normalized;

try {
  normalized = new URL(baseUrl);
} catch (error) {
  console.error(`Invalid URL: ${baseUrl}`);
  exit(1);
}

const pathsToCheck = [
  { path: '/health', method: 'GET' },
  { path: '/api/auth/register', method: 'OPTIONS' },
];

const fetchWithTimeout = async (input, options = {}, timeoutMs = 10_000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const analyzeResponse = async (label, response) => {
  const result = {
    label,
    status: response.status,
    ok: response.ok,
    headers: Object.fromEntries(response.headers.entries()),
    body: null,
    notes: [],
  };

  const contentType = response.headers.get('content-type') ?? '';
  const shouldReadBody = contentType.includes('application/json') || contentType.includes('text');

  if (shouldReadBody) {
    try {
      result.body = await response.text();
    } catch (error) {
      result.notes.push(`Failed to read body: ${error.message}`);
    }
  }

  if (result.status === 404 && result.body && result.body.includes('Application not found')) {
    result.notes.push('Railway fallback detected: service is not running or domain not linked.');
  }

  if (!response.headers.has('access-control-allow-origin')) {
    result.notes.push('Access-Control-Allow-Origin header missing. Check Express CORS config and any CDN overrides.');
  }

  if (label.includes('OPTIONS') && result.status >= 400) {
    result.notes.push('Preflight failed. Verify CORS settings and that the route exists.');
  }

  return result;
};

(async () => {
  const diagnostics = [];

  for (const { path, method } of pathsToCheck) {
    const url = new URL(path, normalized);
    try {
      const response = await fetchWithTimeout(url, { method, headers: { 'Content-Type': 'application/json' } });
      diagnostics.push(await analyzeResponse(`${method} ${url}`, response));
    } catch (error) {
      diagnostics.push({
        label: `${method} ${url}`,
        status: null,
        ok: false,
        headers: {},
        body: null,
        notes: [`Request failed: ${error.message}`],
      });
    }
  }

  const hasFailures = diagnostics.some((item) => !item.ok);

  for (const item of diagnostics) {
    console.log(`\n=== ${item.label} ===`);
    console.log(`Status: ${item.status ?? 'request_failed'}`);
    console.log('Headers:', item.headers);
    if (item.body) {
      console.log('Body preview:', item.body.slice(0, 300));
    }
    if (item.notes.length) {
      console.log('Notes:');
      for (const note of item.notes) {
        console.log(`  - ${note}`);
      }
    }
  }

  if (hasFailures) {
    console.error('\n❌ Issues detected. See notes above.');
    exit(1);
  }

  console.log('\n✅ Railway endpoint looks healthy.');
})();
