#!/usr/bin/env node
// Tenu app-icon ladder generator.
//
// Produces the full iOS + Android PNG ladder from the three SVG sources in
// resources/. This is a fallback for environments where @capacitor/assets
// cannot run (e.g. Linux CI without native image libs). On the Mac, the
// canonical path is `npx capacitor-assets generate` — this script writes
// the same set of PNGs so MH can commit them and skip that step if needed.
//
// Usage: node scripts/generate-icons.mjs
//        npm run icons:generate
//
// Outputs:
//   resources/icons-generated/ios/AppIcon-<size>.png
//   resources/icons-generated/android/mipmap-<dpi>/ic_launcher.png
//   resources/icons-generated/android/mipmap-<dpi>/ic_launcher_foreground.png
//   resources/icons-generated/android/mipmap-<dpi>/ic_launcher_background.png
//   resources/icons-generated/android/playstore-icon-512.png

import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const RES = resolve(ROOT, "resources");
const OUT = resolve(RES, "icons-generated");
const OUT_IOS = resolve(OUT, "ios");
const OUT_ANDROID = resolve(OUT, "android");

const SRC_ICON = resolve(RES, "icon.svg");
const SRC_FOREGROUND = resolve(RES, "icon-foreground.svg");
const SRC_BACKGROUND = resolve(RES, "icon-background.svg");

// iOS App Icon sizes (px). Matches the standard AppIcon.appiconset bucket
// shipped by Xcode 15 + iOS 17 / iPadOS 17, plus App Store marketing 1024.
// name: target filename stem (written as AppIcon-<size>.png for easy
// drag-and-drop into Xcode — rename to match Contents.json if preferred).
const IOS_SIZES = [
  { size: 1024, name: "marketing" },   // App Store Connect submission
  { size: 180, name: "iphone-60@3x" }, // iPhone @3x
  { size: 167, name: "ipad-83.5@2x" }, // iPad Pro
  { size: 152, name: "ipad-76@2x" },   // iPad @2x
  { size: 120, name: "iphone-60@2x" }, // iPhone @2x + iPad Spotlight @3x
  { size: 87, name: "iphone-29@3x" },  // iPhone Settings @3x
  { size: 80, name: "iphone-40@2x" },  // iPhone Spotlight @2x
  { size: 76, name: "ipad-76@1x" },    // iPad @1x
  { size: 60, name: "iphone-20@3x" },  // iPhone Notification @3x
  { size: 58, name: "iphone-29@2x" },  // iPhone Settings @2x
  { size: 40, name: "ipad-20@2x" },    // iPad Notification @2x
  { size: 29, name: "ipad-29@1x" },    // iPad Settings @1x
  { size: 20, name: "ipad-20@1x" },    // iPad Notification @1x
];

// Android mipmap density buckets.
// Play Store requires 512x512. Adaptive icon foreground + background
// must be 432x432 at mdpi base (per Google: 108dp × 4 scale factors).
const ANDROID_DENSITIES = [
  { folder: "mipmap-mdpi", launcher: 48, adaptive: 108 },
  { folder: "mipmap-hdpi", launcher: 72, adaptive: 162 },
  { folder: "mipmap-xhdpi", launcher: 96, adaptive: 216 },
  { folder: "mipmap-xxhdpi", launcher: 144, adaptive: 324 },
  { folder: "mipmap-xxxhdpi", launcher: 192, adaptive: 432 },
];

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function renderSvg(svgBuffer, size, { flatten = false } = {}) {
  let pipeline = sharp(svgBuffer, { density: 384 }).resize(size, size, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  if (flatten) {
    pipeline = pipeline.flatten({ background: "#F4F1EA" });
  }
  return pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
}

async function main() {
  const [icon, foreground, background] = await Promise.all([
    readFile(SRC_ICON),
    readFile(SRC_FOREGROUND),
    readFile(SRC_BACKGROUND),
  ]);

  await ensureDir(OUT_IOS);
  await ensureDir(OUT_ANDROID);

  // iOS — full ladder. No transparency: Apple rejects icons with alpha.
  for (const { size, name } of IOS_SIZES) {
    const buf = await renderSvg(icon, size, { flatten: true });
    const out = resolve(OUT_IOS, `AppIcon-${size}-${name}.png`);
    await writeFile(out, buf);
    process.stdout.write(`ios   ${size.toString().padStart(4)}  ${out}\n`);
  }

  // Android — Play Store 512.
  await ensureDir(OUT_ANDROID);
  {
    const buf = await renderSvg(icon, 512, { flatten: true });
    const out = resolve(OUT_ANDROID, "playstore-icon-512.png");
    await writeFile(out, buf);
    process.stdout.write(`play  ${(512).toString().padStart(4)}  ${out}\n`);
  }

  // Android — legacy launcher + adaptive layers per density.
  for (const { folder, launcher, adaptive } of ANDROID_DENSITIES) {
    const dir = resolve(OUT_ANDROID, folder);
    await ensureDir(dir);

    const launcherBuf = await renderSvg(icon, launcher, { flatten: true });
    await writeFile(resolve(dir, "ic_launcher.png"), launcherBuf);

    const launcherRoundBuf = await renderSvg(icon, launcher, { flatten: true });
    await writeFile(resolve(dir, "ic_launcher_round.png"), launcherRoundBuf);

    const fgBuf = await renderSvg(foreground, adaptive);
    await writeFile(resolve(dir, "ic_launcher_foreground.png"), fgBuf);

    const bgBuf = await renderSvg(background, adaptive, { flatten: true });
    await writeFile(resolve(dir, "ic_launcher_background.png"), bgBuf);

    process.stdout.write(
      `and   ${launcher.toString().padStart(4)}  ${folder} (launcher ${launcher}, adaptive ${adaptive})\n`,
    );
  }

  process.stdout.write("\nDone. Drop resources/icons-generated/ios/* into Xcode AppIcon.appiconset,\n");
  process.stdout.write("and copy resources/icons-generated/android/mipmap-*/* into\n");
  process.stdout.write("android/app/src/main/res/.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
