/**
 * LinkedIn Post Publisher
 * Usage: node scripts/linkedin-post.js <post-folder>
 * Example: node scripts/linkedin-post.js posts/ready/roas-is-not-the-starting-point
 *
 * - If images/ folder exists → merges PNGs into PDF → posts as carousel
 * - Otherwise → posts as text only
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const ENV_FILE = path.join(__dirname, '..', '.env');
const LI_VERSION = '202504';

// ── env ───────────────────────────────────────────────────────────────────────

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

// ── post text extraction ──────────────────────────────────────────────────────

function extractPostText(mdContent) {
  // Find first --- separator (after title/metadata block)
  const firstSep = mdContent.indexOf('\n---\n');
  if (firstSep === -1) return mdContent.trim();

  let text = mdContent.slice(firstSep + 5);

  // Stop before POST TEXT ENDS HERE marker
  const endMarker = text.indexOf('POST TEXT ENDS HERE');
  if (endMarker !== -1) {
    const lastSep = text.lastIndexOf('\n---\n', endMarker);
    text = lastSep !== -1 ? text.slice(0, lastSep) : text.slice(0, endMarker);
  }

  // Remove internal --- section dividers (not valid on LinkedIn)
  text = text.replace(/\n---\n/g, '\n\n');

  return text.trim();
}

// ── find post md file ─────────────────────────────────────────────────────────

function findPostMd(postFolder) {
  // Accept either a folder path or a direct .md path
  if (postFolder.endsWith('.md') && fs.existsSync(postFolder)) return postFolder;

  // Look for .md file with same name as folder
  const folderName = path.basename(postFolder.replace(/\/$/, ''));

  // Check posts/ready/[name].md or posts/drafts/[name].md
  const candidates = [
    `${postFolder}.md`,
    path.join(path.dirname(postFolder), `${folderName}.md`),
    path.join('posts', 'ready', `${folderName}.md`),
    path.join('posts', 'drafts', `${folderName}.md`),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  return null;
}

// ── pdf creation ──────────────────────────────────────────────────────────────

async function createPdfFromImages(imagesDir) {
  const pngFiles = fs.readdirSync(imagesDir)
    .filter(f => f.endsWith('.png'))
    .sort()
    .map(f => path.join(imagesDir, f));

  if (pngFiles.length === 0) return null;

  console.log(`  Creating PDF from ${pngFiles.length} image(s)...`);

  const pdfDoc = await PDFDocument.create();

  for (const pngPath of pngFiles) {
    const pngBytes = fs.readFileSync(pngPath);
    const pngImage = await pdfDoc.embedPng(pngBytes);
    const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
    page.drawImage(pngImage, { x: 0, y: 0, width: pngImage.width, height: pngImage.height });
  }

  return await pdfDoc.save();
}

// ── linkedin api helpers ──────────────────────────────────────────────────────

function liHeaders(token, extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    'LinkedIn-Version': LI_VERSION,
    'X-Restli-Protocol-Version': '2.0.0',
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function initDocumentUpload(token, personUrn) {
  const res = await fetch(
    'https://api.linkedin.com/rest/documents?action=initializeUpload',
    {
      method: 'POST',
      headers: liHeaders(token),
      body: JSON.stringify({
        initializeUploadRequest: { owner: personUrn },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Document upload init failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return {
    uploadUrl: data.value.uploadUrl,
    documentUrn: data.value.document,
  };
}

async function uploadPdfBytes(uploadUrl, pdfBytes) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: pdfBytes,
  });

  if (!res.ok && res.status !== 201) {
    const err = await res.text();
    throw new Error(`PDF upload failed (${res.status}): ${err}`);
  }
}

async function createPost(token, personUrn, text, documentUrn = null, title = '') {
  const body = {
    author: personUrn,
    commentary: text,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };

  if (documentUrn) {
    body.content = {
      media: {
        id: documentUrn,
        title: title || 'Dexo Media',
      },
    };
  }

  const res = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: liHeaders(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Post creation failed (${res.status}): ${err}`);
  }

  // LinkedIn returns the post URN in the x-linkedin-id header or body
  const postId = res.headers.get('x-linkedin-id') || res.headers.get('x-restli-id') || 'created';
  return postId;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const env = loadEnv();
  const token = env.LINKEDIN_ACCESS_TOKEN;
  const personUrn = env.LINKEDIN_PERSON_URN;

  if (!token || !personUrn) {
    console.error('\nNot authorized yet. Run first:\n  node scripts/linkedin-auth.js\n');
    process.exit(1);
  }

  const postArg = process.argv[2];
  if (!postArg) {
    console.error('Usage: node scripts/linkedin-post.js <post-folder-or-name>');
    console.error('Example: node scripts/linkedin-post.js posts/ready/roas-is-not-the-starting-point');
    process.exit(1);
  }

  // Find the .md file
  const mdPath = findPostMd(postArg);
  if (!mdPath) {
    console.error(`Could not find post markdown file for: ${postArg}`);
    process.exit(1);
  }

  const postText = extractPostText(fs.readFileSync(mdPath, 'utf8'));
  const postTitle = path.basename(mdPath, '.md').replace(/-/g, ' ');

  console.log('\n─────────────────────────────────────────');
  console.log('  LinkedIn Publisher — Dexo Media');
  console.log('─────────────────────────────────────────');
  console.log(`\nPost: ${postTitle}`);
  console.log(`Text: ${postText.slice(0, 60).replace(/\n/g, ' ')}...`);

  // Check for images
  const folderName = path.basename(postArg.replace(/\.md$/, ''));
  const imagesDir = path.join('posts', 'drafts', folderName, 'images');
  const hasImages = fs.existsSync(imagesDir) &&
    fs.readdirSync(imagesDir).some(f => f.endsWith('.png'));

  let documentUrn = null;

  if (hasImages) {
    console.log('\n  Carousel post detected.');
    const pdfBytes = await createPdfFromImages(imagesDir);

    if (pdfBytes) {
      console.log('  Initializing document upload...');
      const { uploadUrl, documentUrn: urn } = await initDocumentUpload(token, personUrn);

      console.log('  Uploading PDF to LinkedIn...');
      await uploadPdfBytes(uploadUrl, pdfBytes);

      documentUrn = urn;
      console.log('  ✓ Document uploaded.');
    }
  } else {
    console.log('\n  Text-only post.');
  }

  console.log('  Publishing post...');
  const postId = await createPost(token, personUrn, postText, documentUrn, postTitle);

  console.log(`\n✓ Posted successfully! ID: ${postId}`);
  console.log('─────────────────────────────────────────\n');
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
