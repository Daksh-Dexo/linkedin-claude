/**
 * Manually set your LinkedIn Person URN in .env
 * Usage: node scripts/linkedin-set-urn.js <person-id>
 * Example: node scripts/linkedin-set-urn.js ACoAABxxxxxxxxx
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env');

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

const id = process.argv[2];
if (!id) {
  console.error('Usage: node scripts/linkedin-set-urn.js <person-id>');
  process.exit(1);
}

const urn = id.startsWith('urn:li:person:') ? id : `urn:li:person:${id}`;
saveEnv({ LINKEDIN_PERSON_URN: urn });
console.log(`✓ Person URN saved: ${urn}`);
