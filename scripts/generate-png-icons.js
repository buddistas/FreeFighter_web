const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Размеры иконок для Android
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Путь к папке icons в корне проекта
const iconsDir = path.join(__dirname, '..', 'icons');

console.log('Создание PNG иконок...');

iconSizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Создаем градиентный фон
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    
    // Рисуем закругленный прямоугольник
    const radius = size * 0.15;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
    
    // Добавляем текст "FF"
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FF', size / 2, size / 2);
    
    // Сохраняем PNG
    const buffer = canvas.toBuffer('image/png');
    const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    fs.writeFileSync(pngPath, buffer);
    console.log(`✓ Создан icon-${size}x${size}.png`);
});

console.log('\n✓ Все PNG иконки созданы успешно!');

