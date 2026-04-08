/**
 * Generate favicon, PWA icons, and OGP image from SVG templates.
 * Run: node scripts/generate-icons.mjs
 * Requires: sharp (dev dependency)
 *
 * Design: Calendar icon (matching vspo-schedule) with notification bell accent.
 * Keeps the "すぽじゅーる" brand identity while adding Discord dashboard context.
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
 * Calendar icon with notification badge — vspo-schedule style.
 * White calendar on purple background with a checkmark and small notification dot.
 */
const calendarIconSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND_PURPLE}" />
      <stop offset="100%" stop-color="#5a4fb8" />
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="108" fill="url(#bg)" />

  <!-- Calendar body -->
  <rect x="96" y="128" width="320" height="280" rx="28" fill="#fff" opacity="0.95" />
  <!-- Calendar header bar -->
  <rect x="96" y="128" width="320" height="64" rx="28" fill="#fff" />
  <rect x="96" y="164" width="320" height="28" fill="#fff" />
  <!-- Header line -->
  <rect x="112" y="188" width="288" height="3" fill="${BRAND_PURPLE}" opacity="0.2" />

  <!-- Calendar rings -->
  <rect x="176" y="104" width="20" height="52" rx="10" fill="#fff" opacity="0.95" />
  <rect x="316" y="104" width="20" height="52" rx="10" fill="#fff" opacity="0.95" />

  <!-- Checkmark circle (center of calendar body) -->
  <circle cx="256" cy="300" r="64" fill="${BRAND_PURPLE}" opacity="0.15" />
  <circle cx="256" cy="300" r="48" fill="${BRAND_PURPLE}" />
  <!-- Checkmark -->
  <polyline points="232,300 250,318 280,282" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />

  <!-- Notification dot (top-right, Discord-style) -->
  <circle cx="388" cy="140" r="28" fill="#ff6b6b" />
  <circle cx="388" cy="140" r="24" fill="#ff5252" />
  <!-- Bell icon inside dot -->
  <path d="M382,133 C382,129 385,126 388,126 C391,126 394,129 394,133 L394,139 L396,141 L380,141 L382,139 Z" fill="#fff" />
  <circle cx="388" cy="144" r="2.5" fill="#fff" />
</svg>`;

/**
 * Maskable icon — same calendar design with safe area padding (center 80%).
 */
const maskableIconSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BRAND_PURPLE}" />
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <!-- Calendar body -->
    <rect x="96" y="128" width="320" height="280" rx="28" fill="#fff" opacity="0.95" />
    <rect x="96" y="128" width="320" height="64" rx="28" fill="#fff" />
    <rect x="96" y="164" width="320" height="28" fill="#fff" />
    <rect x="112" y="188" width="288" height="3" fill="${BRAND_PURPLE}" opacity="0.2" />
    <!-- Calendar rings -->
    <rect x="176" y="104" width="20" height="52" rx="10" fill="#fff" opacity="0.95" />
    <rect x="316" y="104" width="20" height="52" rx="10" fill="#fff" opacity="0.95" />
    <!-- Checkmark circle -->
    <circle cx="256" cy="300" r="64" fill="${BRAND_PURPLE}" opacity="0.15" />
    <circle cx="256" cy="300" r="48" fill="${BRAND_PURPLE}" />
    <polyline points="232,300 250,318 280,282" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
    <!-- Notification dot -->
    <circle cx="388" cy="140" r="28" fill="#ff6b6b" />
    <circle cx="388" cy="140" r="24" fill="#ff5252" />
    <path d="M382,133 C382,129 385,126 388,126 C391,126 394,129 394,133 L394,139 L396,141 L380,141 L382,139 Z" fill="#fff" />
    <circle cx="388" cy="144" r="2.5" fill="#fff" />
  </g>
</svg>`;

/**
 * OGP image — landscape 1200x630 with calendar icon, title, and tagline.
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

  <!-- Calendar icon (centered, smaller) -->
  <g transform="translate(500, 60) scale(0.35)">
    <rect width="512" height="512" rx="108" fill="${BRAND_PURPLE}" />
    <rect x="96" y="128" width="320" height="280" rx="28" fill="#fff" opacity="0.95" />
    <rect x="96" y="128" width="320" height="64" rx="28" fill="#fff" />
    <rect x="96" y="164" width="320" height="28" fill="#fff" />
    <rect x="112" y="188" width="288" height="3" fill="${BRAND_PURPLE}" opacity="0.2" />
    <rect x="176" y="104" width="20" height="52" rx="10" fill="#fff" opacity="0.95" />
    <rect x="316" y="104" width="20" height="52" rx="10" fill="#fff" opacity="0.95" />
    <circle cx="256" cy="300" r="64" fill="${BRAND_PURPLE}" opacity="0.15" />
    <circle cx="256" cy="300" r="48" fill="${BRAND_PURPLE}" />
    <polyline points="232,300 250,318 280,282" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="388" cy="140" r="24" fill="#ff5252" />
    <path d="M382,133 C382,129 385,126 388,126 C391,126 394,129 394,133 L394,139 L396,141 L380,141 L382,139 Z" fill="#fff" />
    <circle cx="388" cy="144" r="2.5" fill="#fff" />
  </g>

  <!-- Title -->
  <text x="600" y="390" text-anchor="middle" font-family="system-ui, sans-serif" font-size="64" font-weight="800" fill="#e3e2e7">すぽじゅーる Bot</text>
  <!-- Tagline -->
  <text x="600" y="450" text-anchor="middle" font-family="system-ui, sans-serif" font-size="28" fill="#c6c5d7">Discord 通知設定ダッシュボード</text>
  <!-- URL -->
  <text x="600" y="550" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" fill="${BRAND_PURPLE}">discord.vspo-schedule.com</text>
</svg>`;

const icons = [
  { name: "favicon.png", size: 48, svg: calendarIconSvg },
  { name: "apple-touch-icon.png", size: 180, svg: calendarIconSvg },
  { name: "icon-192.png", size: 192, svg: calendarIconSvg },
  { name: "icon-512.png", size: 512, svg: calendarIconSvg },
];

async function generate() {
  for (const { name, size, svg } of icons) {
    await sharp(Buffer.from(svg(size)))
      .resize(size, size)
      .png()
      .toFile(resolve(outDir, name));
    console.log(`  ✓ ${name} (${size}x${size})`);
  }

  await sharp(Buffer.from(maskableIconSvg()))
    .resize(512, 512)
    .png()
    .toFile(resolve(outDir, "icon-maskable.png"));
  console.log("  ✓ icon-maskable.png (512x512)");

  await sharp(Buffer.from(ogpSvg()))
    .resize(1200, 630)
    .png({ quality: 80, compressionLevel: 9 })
    .toFile(resolve(outDir, "ogp.png"));
  console.log("  ✓ ogp.png (1200x630)");

  console.log("\nDone! Icons generated in public/");
}

generate().catch((err) => {
  console.error("Failed to generate icons:", err);
  process.exit(1);
});
