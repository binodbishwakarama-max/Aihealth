const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

sizes.forEach(s => {
    const rx = Math.round(s * 0.2);
    const fontSize = Math.round(s * 0.35);
    const cx = Math.round(s * 0.72);
    const cy = Math.round(s * 0.25);
    const r = Math.round(s * 0.07);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#14b8a6"/>
      <stop offset="100%" style="stop-color:#10b981"/>
    </linearGradient>
  </defs>
  <rect width="${s}" height="${s}" rx="${rx}" fill="url(#bg)"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="${fontSize}" fill="white">H</text>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#f97316"/>
</svg>`;

    fs.writeFileSync(path.join(outDir, `icon-${s}x${s}.svg`), svg);
    console.log(`Created icon-${s}x${s}.svg`);
});

console.log('All icons generated!');
