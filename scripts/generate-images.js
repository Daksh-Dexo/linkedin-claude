const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Usage: node scripts/generate-images.js <post-folder>
// Example: node scripts/generate-images.js posts/drafts/roas-is-not-the-starting-point

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1080;

async function generateImages(postFolder) {
  const cardsDir = path.join(postFolder, 'cards');
  const imagesDir = path.join(postFolder, 'images');

  if (!fs.existsSync(cardsDir)) {
    console.error(`No cards/ folder found in ${postFolder}`);
    process.exit(1);
  }

  fs.mkdirSync(imagesDir, { recursive: true });

  const htmlFiles = fs.readdirSync(cardsDir)
    .filter(f => f.endsWith('.html'))
    .sort();

  if (htmlFiles.length === 0) {
    console.error('No HTML files found in cards/ folder');
    process.exit(1);
  }

  console.log(`Found ${htmlFiles.length} card(s). Launching browser...`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: CARD_WIDTH, height: CARD_HEIGHT });

  for (let i = 0; i < htmlFiles.length; i++) {
    const htmlFile = htmlFiles[i];
    const cardPath = path.resolve(path.join(cardsDir, htmlFile));
    const outputName = `card-${String(i + 1).padStart(2, '0')}.png`;
    const outputPath = path.join(imagesDir, outputName);

    await page.goto(`file://${cardPath}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: outputPath, clip: { x: 0, y: 0, width: CARD_WIDTH, height: CARD_HEIGHT } });

    console.log(`✓ ${htmlFile} → images/${outputName}`);
  }

  await browser.close();
  console.log(`\nDone. ${htmlFiles.length} image(s) saved to ${imagesDir}`);
}

const postFolder = process.argv[2];
if (!postFolder) {
  console.error('Usage: node scripts/generate-images.js <post-folder>');
  console.error('Example: node scripts/generate-images.js posts/drafts/roas-is-not-the-starting-point');
  process.exit(1);
}

generateImages(postFolder).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
