/**
 * LinkedIn OAuth — one-time setup
 * Run: node scripts/linkedin-auth.js
 *
 * Opens a browser auth URL, captures the token via local callback,
 * and saves credentials to .env. Only needs to run once.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env');
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPE = 'w_member_social openid profile';

// ── env helpers ──────────────────────────────────────────────────────────────

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) return {};
  return Object.fromEntries(
    fs.readFileSync(ENV_FILE, 'utf8')
      .split('\n')
      .filter(l => l.trim() && !l.startsWith('#'))
      .map(l => {
        const idx = l.indexOf('=');
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
      })
      .filter(([k]) => k)
  );
}

function saveEnv(updates) {
  const existing = loadEnv();
  const merged = { ...existing, ...updates };
  fs.writeFileSync(
    ENV_FILE,
    Object.entries(merged).map(([k, v]) => `${k}=${v}`).join('\n') + '\n'
  );
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const env = loadEnv();
  const CLIENT_ID = env.LINKEDIN_CLIENT_ID;
  const CLIENT_SECRET = env.LINKEDIN_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET in .env');
    process.exit(1);
  }

  // Step 1 — show auth URL
  const authUrl =
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(SCOPE)}`;

  console.log('\n─────────────────────────────────────────');
  console.log('  LinkedIn Authorization');
  console.log('─────────────────────────────────────────');
  console.log('\nOpen this URL in your browser:\n');
  console.log(authUrl);
  console.log('\nWaiting for you to authorize...\n');

  // Step 2 — wait for callback
  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost:3000');
      if (url.pathname !== '/callback') return;

      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      res.writeHead(200, { 'Content-Type': 'text/html' });

      if (code) {
        res.end(`<html><body style="font-family:sans-serif;padding:40px;background:#f9f9f9;">
          <h2 style="color:#0a66c2;">✓ Authorized successfully.</h2>
          <p>You can close this tab and go back to the terminal.</p>
        </body></html>`);
        server.close(() => resolve(code));
      } else {
        res.end(`<html><body style="padding:40px;"><h2>Error: ${error}</h2></body></html>`);
        server.close(() => reject(new Error(error || 'Authorization failed')));
      }
    });

    server.listen(3000, () => {});
    server.on('error', reject);
  });

  console.log('✓ Authorization code received. Getting access token...');

  // Step 3 — exchange code for token
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    console.error('Failed to get access token:', tokenData);
    process.exit(1);
  }

  console.log('✓ Access token received. Fetching your profile...');

  // Step 4 — get person URN
  // Step 4 — try to get person URN from /v2/me
  let personUrn = '';
  let displayName = 'unknown';

  try {
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'LinkedIn-Version': '202401',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });
    const profile = await profileRes.json();

    if (profile.sub) {
      personUrn = `urn:li:person:${profile.sub}`;
      displayName = profile.name || profile.sub;
    }
  } catch (_) {}

  // Step 5 — save token (URN saved after user confirms it)
  saveEnv({ LINKEDIN_ACCESS_TOKEN: tokenData.access_token });

  if (personUrn) {
    saveEnv({ LINKEDIN_PERSON_URN: personUrn });
  } else {
    console.log('\n─────────────────────────────────────────');
    console.log('  Could not auto-fetch your Person URN.');
    console.log('  Find it manually:');
    console.log('  1. Go to linkedin.com in your browser');
    console.log('  2. Open DevTools → Network tab → reload page');
    console.log('  3. Search for a request to api.linkedin.com/v2/me');
    console.log('  4. Look for "id" in the response — copy that value');
    console.log('  5. Run: node scripts/linkedin-set-urn.js <your-id>');
    console.log('─────────────────────────────────────────\n');
  }

  console.log('\n─────────────────────────────────────────');
  if (displayName !== 'unknown') console.log(`✓ Logged in as: ${displayName}`);
  if (personUrn) console.log(`✓ Person URN:   ${personUrn}`);
  console.log('✓ Saved to .env');
  console.log('─────────────────────────────────────────');
  console.log('\nSetup complete. You can now post to LinkedIn.\n');
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
