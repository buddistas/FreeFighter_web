// Простой скрипт для генерации базовых иконок
// Требует: npm install canvas (опционально, можно использовать онлайн-генераторы)

const fs = require('fs');
const path = require('path');

// Размеры иконок для Android
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Создаем простой SVG шаблон для иконки
function createIconSVG(size) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">FF</text>
</svg>`;
}

// Создаем папку icons если её нет (в корне проекта)
const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Создание базовых SVG иконок...');
console.log('Примечание: Для Android нужны PNG файлы.');
console.log('Используйте онлайн-конвертер SVG->PNG или установите canvas: npm install canvas');

// Создаем SVG файлы
iconSizes.forEach(size => {
    const svgContent = createIconSVG(size);
    const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
    fs.writeFileSync(svgPath, svgContent);
    console.log(`✓ Создан icon-${size}x${size}.svg`);
});

console.log('\nДля конвертации SVG в PNG:');
console.log('1. Используйте онлайн-конвертер: https://convertio.co/svg-png/');
console.log('2. Или установите canvas: npm install canvas');
console.log('3. Или используйте ImageMagick: magick convert icon-512x512.svg icon-512x512.png');

