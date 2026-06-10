import sharp from "sharp";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, "bjjlogo.png");
const pub = resolve(__dirname, "public");

const icons = [
  { file: "icon.png",             size: 32  },
  { file: "icon-192.png",         size: 192 },
  { file: "icon-512.png",         size: 512 },
  { file: "icon-maskable-512.png",size: 512 },
  { file: "apple-icon.png",       size: 180 },
];

for (const { file, size } of icons) {
  await sharp(src)
    .resize(size, size, { fit: "contain", background: { r: 9, g: 9, b: 11, alpha: 1 } })
    .png()
    .toFile(`${pub}/${file}`);
  console.log(`✓ ${file} (${size}x${size})`);
}
