import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const iconDir = path.resolve("public/icons");
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const drawIcon = (size: number) => {
  const png = new PNG({ width: size, height: size });
  const bg = { r: 124, g: 92, b: 30, a: 255 };
  const fg = { r: 245, g: 235, b: 210, a: 255 };

  const setPixel = (x: number, y: number, color: { r: number; g: number; b: number; a: number }) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const idx = (size * y + x) << 2;
    png.data[idx] = color.r;
    png.data[idx + 1] = color.g;
    png.data[idx + 2] = color.b;
    png.data[idx + 3] = color.a;
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) setPixel(x, y, bg);
  }

  const cx = Math.floor(size / 2);
  const crossW = Math.max(8, Math.floor(size * 0.08));
  const crossH = Math.floor(size * 0.46);
  const armW = Math.floor(size * 0.32);
  const armY = Math.floor(size * 0.32);

  for (let y = Math.floor(size * 0.2); y < Math.floor(size * 0.2) + crossH; y += 1) {
    for (let x = cx - Math.floor(crossW / 2); x < cx + Math.floor(crossW / 2); x += 1) setPixel(x, y, fg);
  }

  for (let y = armY; y < armY + crossW; y += 1) {
    for (let x = cx - Math.floor(armW / 2); x < cx + Math.floor(armW / 2); x += 1) setPixel(x, y, fg);
  }

  const output = path.join(iconDir, `icon-${size}.png`);
  fs.writeFileSync(output, PNG.sync.write(png));
};

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="64" fill="#7c5c1e"/><path d="M235 105h42v106h92v40h-92v156h-42V251h-92v-40h92z" fill="#f5ebd2"/></svg>`;

fs.mkdirSync(iconDir, { recursive: true });
fs.writeFileSync(path.resolve("public/icons/icon-base.svg"), svg, "utf8");
sizes.forEach(drawIcon);

fs.copyFileSync(path.join(iconDir, "icon-96.png"), path.join(iconDir, "shortcut-book.png"));
fs.copyFileSync(path.join(iconDir, "icon-96.png"), path.join(iconDir, "shortcut-search.png"));
fs.copyFileSync(path.join(iconDir, "icon-192.png"), path.resolve("public/favicon-192.png"));

console.log("Ícones gerados com sucesso.");
