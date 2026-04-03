/**
 * Generate favicon, PWA icons, and OGP image from SVG templates.
 * Run: node scripts/generate-icons.mjs
 * Requires: sharp (dev dependency)
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../public");
mkdirSync(outDir, { recursive: true });

const BRAND_PURPLE = "#7266cf";
const DARK_BG = "#121317";

/**
 * Bot icon SVG — Discord-style bot face on purple background.
 * Rounded rectangle with a stylized bot face (two eyes + antenna).
 */
const botIconSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND_PURPLE}" />
      <stop offset="100%" stop-color="#5a4fb8" />
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="108" fill="url(#bg)" />
  <!-- Antenna -->
  <circle cx="256" cy="115" r="18" fill="#fff" opacity="0.9" />
  <rect x="248" y="130" width="16" height="40" rx="8" fill="#fff" opacity="0.9" />
  <!-- Head -->
  <rect x="120" y="170" width="272" height="200" rx="40" fill="#fff" opacity="0.95" />
  <!-- Left eye -->
  <circle cx="200" cy="270" r="32" fill="${BRAND_PURPLE}" />
  <circle cx="210" cy="262" r="10" fill="#fff" />
  <!-- Right eye -->
  <circle cx="312" cy="270" r="32" fill="${BRAND_PURPLE}" />
  <circle cx="322" cy="262" r="10" fill="#fff" />
  <!-- Mouth -->
  <rect x="200" y="320" width="112" height="16" rx="8" fill="${BRAND_PURPLE}" opacity="0.6" />
  <!-- Ears -->
  <rect x="80" y="220" width="32" height="80" rx="16" fill="#fff" opacity="0.85" />
  <rect x="400" y="220" width="32" height="80" rx="16" fill="#fff" opacity="0.85" />
</svg>`;

/**
 * Maskable icon — same design but with extra padding (safe area = center 80%).
 */
const maskableIconSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BRAND_PURPLE}" />
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <!-- Antenna -->
    <circle cx="256" cy="115" r="18" fill="#fff" opacity="0.9" />
    <rect x="248" y="130" width="16" height="40" rx="8" fill="#fff" opacity="0.9" />
    <!-- Head -->
    <rect x="120" y="170" width="272" height="200" rx="40" fill="#fff" opacity="0.95" />
    <!-- Left eye -->
    <circle cx="200" cy="270" r="32" fill="${BRAND_PURPLE}" />
    <circle cx="210" cy="262" r="10" fill="#fff" />
    <!-- Right eye -->
    <circle cx="312" cy="270" r="32" fill="${BRAND_PURPLE}" />
    <circle cx="322" cy="262" r="10" fill="#fff" />
    <!-- Mouth -->
    <rect x="200" y="320" width="112" height="16" rx="8" fill="${BRAND_PURPLE}" opacity="0.6" />
    <!-- Ears -->
    <rect x="80" y="220" width="32" height="80" rx="16" fill="#fff" opacity="0.85" />
    <rect x="400" y="220" width="32" height="80" rx="16" fill="#fff" opacity="0.85" />
  </g>
</svg>`;

/**
 * OGP image — landscape 1200x630 with bot icon, title, and tagline.
 */
const ogpSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="ogp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${DARK_BG}" />
      <stop offset="100%" stop-color="#1a1b20" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="40%">
      <stop offset="0%" stop-color="${BRAND_PURPLE}" stop-opacity="0.3" />
      <stop offset="100%" stop-color="${DARK_BG}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#ogp-bg)" />
  <rect width="1200" height="630" fill="url(#glow)" />
  <!-- Bot icon (centered, smaller) -->
  <g transform="translate(500, 80) scale(0.35)">
    <rect width="512" height="512" rx="108" fill="${BRAND_PURPLE}" />
    <circle cx="256" cy="115" r="18" fill="#fff" opacity="0.9" />
    <rect x="248" y="130" width="16" height="40" rx="8" fill="#fff" opacity="0.9" />
    <rect x="120" y="170" width="272" height="200" rx="40" fill="#fff" opacity="0.95" />
    <circle cx="200" cy="270" r="32" fill="${BRAND_PURPLE}" />
    <circle cx="210" cy="262" r="10" fill="#fff" />
    <circle cx="312" cy="270" r="32" fill="${BRAND_PURPLE}" />
    <circle cx="322" cy="262" r="10" fill="#fff" />
    <rect x="200" y="320" width="112" height="16" rx="8" fill="${BRAND_PURPLE}" opacity="0.6" />
    <rect x="80" y="220" width="32" height="80" rx="16" fill="#fff" opacity="0.85" />
    <rect x="400" y="220" width="32" height="80" rx="16" fill="#fff" opacity="0.85" />
  </g>
  <!-- Title -->
  <text x="600" y="400" text-anchor="middle" font-family="system-ui, sans-serif" font-size="64" font-weight="800" fill="#e3e2e7">Spodule Bot</text>
  <!-- Tagline -->
  <text x="600" y="460" text-anchor="middle" font-family="system-ui, sans-serif" font-size="28" fill="#c6c5d7">Discord Bot Dashboard</text>
  <!-- URL -->
  <text x="600" y="560" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" fill="${BRAND_PURPLE}">discord.vspo-schedule.com</text>
</svg>`;

const icons = [
  { name: "favicon.png", size: 48, svg: botIconSvg },
  { name: "apple-touch-icon.png", size: 180, svg: botIconSvg },
  { name: "icon-192.png", size: 192, svg: botIconSvg },
  { name: "icon-512.png", size: 512, svg: botIconSvg },
];

async function generate() {
  // Standard icons
  for (const { name, size, svg } of icons) {
    await sharp(Buffer.from(svg(size)))
      .resize(size, size)
      .png()
      .toFile(resolve(outDir, name));
    console.log(`  ✓ ${name} (${size}x${size})`);
  }

  // Maskable icon
  await sharp(Buffer.from(maskableIconSvg()))
    .resize(512, 512)
    .png()
    .toFile(resolve(outDir, "icon-maskable.png"));
  console.log("  ✓ icon-maskable.png (512x512)");

  // OGP image
  await sharp(Buffer.from(ogpSvg()))
    .resize(1200, 630)
    .png()
    .toFile(resolve(outDir, "ogp.png"));
  console.log("  ✓ ogp.png (1200x630)");

  console.log("\nDone! Icons generated in public/");
}

generate().catch((err) => {
  console.error("Failed to generate icons:", err);
  process.exit(1);
});
