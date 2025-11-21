// Генератор сводной таблицы по всем турнирам
const fs = require('fs');
const path = require('path');

// Статистика по каждому перку
const stats = {};

// Читаем все 100 турниров
for (let i = 1; i <= 100; i++) {
    const fileName = path.join(__dirname, `tournament-${i}.md`);
    const content = fs.readFileSync(fileName, 'utf8');
    
    // Парсим таблицу
    const lines = content.split('\n');
    let inTable = false;
    
    for (const line of lines) {
        if (line.startsWith('| Место |')) {
            inTable = true;
            continue;
        }
        
        if (inTable && line.startsWith('|') && !line.startsWith('|-------')) {
            // Парсим строку таблицы: | Место | Боец | Перк | Победы | Ничьи | Поражения | Очки |
            const parts = line.split('|').map(p => p.trim()).filter(p => p);
            if (parts.length >= 7) {
                const fighterName = parts[1]; // Название бойца (название перка)
                const wins = parseInt(parts[3]);
                const draws = parseInt(parts[4]);
                const losses = parseInt(parts[5]);
                const points = parseInt(parts[6]);
                
                if (!stats[fighterName]) {
                    stats[fighterName] = {
                        name: fighterName,
                        wins: 0,
                        draws: 0,
                        losses: 0,
                        points: 0,
                        tournaments: 0
                    };
                }
                
                stats[fighterName].wins += wins;
                stats[fighterName].draws += draws;
                stats[fighterName].losses += losses;
                stats[fighterName].points += points;
                stats[fighterName].tournaments++;
            }
        }
    }
}

// Сортируем по очкам (убывание)
const sortedStats = Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return b.draws - a.draws;
});

// Генерируем Markdown таблицу
let md = `# Сводная таблица результатов всех турниров\n\n`;
md += `## Итоговая статистика по всем 100 турнирам\n\n`;
md += `| Место | Боец | Победы | Ничьи | Поражения | Очки | Средние очки за турнир |\n`;
md += `|-------|------|--------|-------|-----------|------|------------------------|\n`;

sortedStats.forEach((stat, index) => {
    const avgPoints = (stat.points / stat.tournaments).toFixed(2);
    md += `| ${index + 1} | ${stat.name} | ${stat.wins} | ${stat.draws} | ${stat.losses} | ${stat.points} | ${avgPoints} |\n`;
});

// Сохраняем файл
const outputFile = path.join(__dirname, 'summary.md');
fs.writeFileSync(outputFile, md, 'utf8');

console.log('Сводная таблица создана: summary.md');
console.log(`\nОбработано турниров: 100`);
console.log(`Уникальных бойцов (перков): ${sortedStats.length}`);

