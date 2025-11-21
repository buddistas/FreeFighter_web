// Массовый запуск турниров с агрегацией результатов
// Использует классы из tournament-simulator.js

const { Tournament } = require('./tournament-simulator');
const fs = require('fs');
const path = require('path');

// Статистика по каждому перку
const globalStats = {};

// Функция для обновления глобальной статистики
function updateGlobalStats(tournament) {
    tournament.fighters.forEach(fighter => {
        const perkName = fighter.perk.name;
        
        if (!globalStats[perkName]) {
            globalStats[perkName] = {
                name: perkName,
                wins: 0,
                draws: 0,
                losses: 0,
                points: 0,
                tournaments: 0
            };
        }
        
        globalStats[perkName].wins += fighter.wins;
        globalStats[perkName].draws += fighter.draws;
        globalStats[perkName].losses += fighter.losses;
        globalStats[perkName].points += fighter.points;
        globalStats[perkName].tournaments++;
    });
}

// Проводим 1000 турниров (3201-4200) с ослабленным FinishHim (только при 1 HP)
const startTournament = 3201;
const endTournament = 4200;
const totalTournaments = endTournament - startTournament + 1;

console.log(`Начинаем проведение ${totalTournaments} турниров (${startTournament}-${endTournament})...`);
console.log('Это может занять некоторое время...\n');

const startTime = Date.now();

for (let i = startTournament; i <= endTournament; i++) {
    if (i % 100 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const progress = ((i - startTournament + 1) / totalTournaments * 100).toFixed(1);
        console.log(`Прогресс: ${i - startTournament + 1}/${totalTournaments} (${progress}%) - Турнир ${i} - Время: ${elapsed}с`);
    }
    
    const tournament = new Tournament(i);
    tournament.run();
    updateGlobalStats(tournament);
}

const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\nВсе ${totalTournaments} турниров завершены за ${elapsedTime} секунд!`);

// Сортируем по очкам (убывание)
const sortedStats = Object.values(globalStats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return b.draws - a.draws;
});

// Генерируем Markdown таблицу
let md = `# Сводная таблица результатов турниров (3201-4200)\n\n`;
md += `## Итоговая статистика по ${totalTournaments} турнирам с ослабленным FinishHim\n\n`;
md += `**Изменение:** FinishHim теперь срабатывает только при 1 HP противника (вместо 1-2 HP)\n\n`;
md += `**Общее количество боев на каждого бойца:** ${totalTournaments * 7} боев\n\n`;
md += `| Место | Боец | Победы | Ничьи | Поражения | Очки | Средние очки за турнир | Винрейт |\n`;
md += `|-------|------|--------|-------|-----------|------|------------------------|----------|\n`;

sortedStats.forEach((stat, index) => {
    const avgPoints = (stat.points / stat.tournaments).toFixed(2);
    const totalFights = stat.wins + stat.draws + stat.losses;
    const winrate = totalFights > 0 ? ((stat.wins / totalFights) * 100).toFixed(2) : '0.00';
    md += `| ${index + 1} | ${stat.name} | ${stat.wins} | ${stat.draws} | ${stat.losses} | ${stat.points} | ${avgPoints} | ${winrate}% |\n`;
});

// Сохраняем файл
const outputFile = path.join(__dirname, 'summary-1000-tournaments-finishhim-nerfed.md');
fs.writeFileSync(outputFile, md, 'utf8');

console.log(`\nСводная таблица создана: summary-1000-tournaments.md`);
console.log(`Обработано турниров: ${totalTournaments}`);
console.log(`Уникальных бойцов (перков): ${sortedStats.length}`);
console.log(`Боев на каждого бойца: ${totalTournaments * 8}`); // 9 бойцов = 8 боев на каждого

// Выводим краткую статистику
console.log('\n=== Краткая статистика ===');
sortedStats.forEach((stat, index) => {
    const totalFights = stat.wins + stat.draws + stat.losses;
    const winrate = totalFights > 0 ? ((stat.wins / totalFights) * 100).toFixed(2) : '0.00';
    console.log(`${index + 1}. ${stat.name}: ${winrate}% винрейт (${stat.wins}/${totalFights})`);
});

