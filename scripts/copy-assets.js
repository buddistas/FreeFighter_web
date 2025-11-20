// Скрипт для копирования файлов в папку www перед синхронизацией
const fs = require('fs');
const path = require('path');

// Путь к корню проекта
const projectRoot = path.join(__dirname, '..');

const filesToCopy = [
  'index.html',
  'game.js',
  'styles.css',
  'manifest.json'
];

const dirsToCopy = [
  { src: 'pics', dest: 'www/pics' },
  { src: 'icons', dest: 'www/icons' }
];

console.log('Копирование файлов в www...');

// Копируем файлы
filesToCopy.forEach(file => {
  const src = path.join(projectRoot, file);
  const dest = path.join(projectRoot, 'www', file);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Скопирован ${file}`);
  } else {
    console.log(`⚠ Файл не найден: ${file}`);
  }
});

// Копируем директории
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

dirsToCopy.forEach(({ src, dest }) => {
  const srcPath = path.join(projectRoot, src);
  const destPath = path.join(projectRoot, dest);
  
  if (fs.existsSync(srcPath)) {
    copyDir(srcPath, destPath);
    console.log(`✓ Скопирована директория ${src} -> ${dest}`);
  } else {
    console.log(`⚠ Директория не найдена: ${src}`);
  }
});

console.log('\n✓ Копирование завершено!');

