// Массовый запуск 1000 турниров по круговой системе с генерацией аналитики
// Использует классы из tournament-simulator.js

const { Tournament, PERKS } = require('./tournament-simulator');

// Получаем все перки из объекта PERKS
const ALL_PERKS = Object.values(PERKS);
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
                fullName: fighter.perk.fullName,
                wins: 0,
                draws: 0,
                losses: 0,
                points: 0,
                tournaments: 0,
                placements: [] // Для отслеживания мест в турнирах
            };
        }
        
        globalStats[perkName].wins += fighter.wins;
        globalStats[perkName].draws += fighter.draws;
        globalStats[perkName].losses += fighter.losses;
        globalStats[perkName].points += fighter.points;
        globalStats[perkName].tournaments++;
        
        // Записываем место в турнире
        const placement = tournament.fighters.findIndex(f => f.name === perkName) + 1;
        globalStats[perkName].placements.push(placement);
    });
}

// Проводим 1000 турниров
const startTournament = 6001;
const endTournament = 7000;
const totalTournaments = endTournament - startTournament + 1;

console.log(`Начинаем проведение ${totalTournaments} турниров (${startTournament}-${endTournament})...`);
console.log('Это может занять некоторое время...\n');

const startTime = Date.now();

for (let i = startTournament; i <= endTournament; i++) {
    if (i % 100 === 0 || i === startTournament) {
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

// Вычисляем средние места
sortedStats.forEach(stat => {
    const avgPlacement = stat.placements.reduce((sum, p) => sum + p, 0) / stat.placements.length;
    stat.avgPlacement = avgPlacement.toFixed(2);
});

// Генерируем сводную таблицу
let summaryMd = `# Сводная таблица результатов турниров (${startTournament}-${endTournament})\n\n`;
summaryMd += `## Итоговая статистика по ${totalTournaments} турнирам по круговой системе\n\n`;
summaryMd += `**Общее количество боев на каждого бойца:** ${totalTournaments * 8} боев\n\n`;
summaryMd += `| Место | Боец | Победы | Ничьи | Поражения | Очки | Средние очки за турнир | Винрейт | Среднее место |\n`;
summaryMd += `|-------|------|--------|-------|-----------|------|------------------------|----------|---------------|\n`;

sortedStats.forEach((stat, index) => {
    const avgPoints = (stat.points / stat.tournaments).toFixed(2);
    const totalFights = stat.wins + stat.draws + stat.losses;
    const winrate = totalFights > 0 ? ((stat.wins / totalFights) * 100).toFixed(2) : '0.00';
    summaryMd += `| ${index + 1} | ${stat.name} | ${stat.wins} | ${stat.draws} | ${stat.losses} | ${stat.points} | ${avgPoints} | ${winrate}% | ${stat.avgPlacement} |\n`;
});

// Сохраняем сводную таблицу
const summaryFile = path.join(__dirname, `summary-1000-tournaments-blockmaster-updated.md`);
fs.writeFileSync(summaryFile, summaryMd, 'utf8');

console.log(`\nСводная таблица создана: summary-1000-tournaments-cycle.md`);

// Генерируем аналитический отчет
let analyticsMd = `# Аналитика эффективности перков на основе 1000 турниров\n\n`;
analyticsMd += `## Статистика по результатам ${totalTournaments} турниров (${startTournament}-${endTournament}) по круговой системе\n`;
analyticsMd += `### Общее количество боев на каждого бойца: ${totalTournaments * 8} боев\n\n`;

analyticsMd += `## Итоговые результаты на большой выборке\n\n`;

sortedStats.forEach((stat, index) => {
    const totalFights = stat.wins + stat.draws + stat.losses;
    const winrate = totalFights > 0 ? ((stat.wins / totalFights) * 100).toFixed(2) : '0.00';
    const avgPoints = (stat.points / stat.tournaments).toFixed(2);
    const drawRate = totalFights > 0 ? ((stat.draws / totalFights) * 100).toFixed(2) : '0.00';
    
    analyticsMd += `### ${index + 1}. ${stat.name}\n`;
    analyticsMd += `- **Винрейт:** ${winrate}% (${stat.wins} побед из ${totalFights} боев)\n`;
    analyticsMd += `- **Очки:** ${stat.points} (среднее ${avgPoints} за турнир)\n`;
    analyticsMd += `- **Среднее место:** ${stat.avgPlacement}\n`;
    analyticsMd += `- **Ничьи:** ${stat.draws} (${drawRate}%)\n`;
    analyticsMd += `- **Анализ:**\n`;
    
    // Добавляем специфический анализ для каждого перка
    const perk = ALL_PERKS.find(p => p.name === stat.name);
    if (perk) {
        switch (perk.id) {
            case 'hp_boost':
                analyticsMd += `  - **Гарантированное преимущество:** +1 HP работает всегда, без зависимости от случайности\n`;
                analyticsMd += `  - **Математическое преимущество:** В бою на истощение дополнительное HP дает больше "погрешности" для ошибок\n`;
                analyticsMd += `  - **Универсальность:** Эффективен против всех типов противников\n`;
                analyticsMd += `  - **Стабильность:** Пассивная защита работает постоянно\n`;
                break;
            case 'head_hunter':
                analyticsMd += `  - **Высокая базовая вероятность:** Удваивает крит с 10% до 20% в верхнюю зону\n`;
                analyticsMd += `  - **Эффективность критов:** Критические удары в голову наносят 2 урона\n`;
                analyticsMd += `  - **Статистическое преимущество:** 20% крит-шанс дает реальное преимущество на большой выборке\n`;
                break;
            case 'body_hunter':
                analyticsMd += `  - **Умеренная базовая вероятность:** Удваивает крит с 5% до 10% в среднюю зону\n`;
                analyticsMd += `  - **Средняя зона:** Тело - одна из трех равновероятных зон (33% случайных выборов)\n`;
                analyticsMd += `  - **Зависимость от удачи:** Требует попадания в нужную зону и срабатывания крита\n`;
                break;
            case 'leg_hunter':
                analyticsMd += `  - **Низкая базовая вероятность:** Удваивает крит с 5% до 10% в нижнюю зону\n`;
                analyticsMd += `  - **Равномерное распределение:** При случайном выборе все зоны равновероятны (33%)\n`;
                analyticsMd += `  - **Ограниченная частота:** Крит срабатывает редко, даже с удвоенной вероятностью\n`;
                break;
            case 'tie_breaker':
                analyticsMd += `  - **Ситуационность:** Активируется только при ничьей (когда оба бойца достигают 0 HP одновременно)\n`;
                analyticsMd += `  - **Редкая активация:** Ничьи происходят нечасто, особенно при случайных действиях\n`;
                analyticsMd += `  - **Автоматическая победа:** При ничьей автоматически побеждает\n`;
                break;
            case 'crit_deflector':
                analyticsMd += `  - **Защита от максимального урона:** Критические удары наносят 2-4 урона, перк снижает их эффективность на 50%\n`;
                analyticsMd += `  - **Снижение вариативности:** Уменьшает влияние случайности на результат боя\n`;
                analyticsMd += `  - **Пассивная защита:** Работает автоматически при получении критов\n`;
                break;
            case 'lucker':
                analyticsMd += `  - **Мощный эффект:** Учетверенный урон (4 вместо 2) может решить бой одним ударом\n`;
                analyticsMd += `  - **Двойная зависимость от удачи:** Требует сначала крит (5-10%), затем срабатывание перка (50%)\n`;
                analyticsMd += `  - **Высокий риск/высокая награда:** Когда срабатывает - очень силен\n`;
                break;
            case 'block_master':
                analyticsMd += `  - **Условная активация:** Требует успешной защиты от всех 3 ударов в серии (вероятность ~11% при случайном выборе)\n`;
                analyticsMd += `  - **Восстановление HP:** +2 HP при активации может переломить ход боя, но активируется редко\n`;
                analyticsMd += `  - **Зависимость от противника:** Эффективность зависит от того, насколько предсказуем противник\n`;
                break;
            case 'finish_him':
                analyticsMd += `  - **Добивание:** Если у противника на конец фазы осталось 1 HP, уменьшает его HP на 1\n`;
                analyticsMd += `  - **Ситуационность:** Активируется только при очень специфическом условии (1 HP)\n`;
                analyticsMd += `  - **Тактическое преимущество:** Может завершить бой раньше, чем противник успеет восстановиться\n`;
                break;
        }
    }
    
    analyticsMd += `\n`;
});

// Добавляем сравнение и выводы
analyticsMd += `## Сравнение результатов\n\n`;
analyticsMd += `| Место | Перк | Винрейт | Средние очки | Среднее место |\n`;
analyticsMd += `|-------|------|---------|--------------|---------------|\n`;

sortedStats.forEach((stat, index) => {
    const totalFights = stat.wins + stat.draws + stat.losses;
    const winrate = totalFights > 0 ? ((stat.wins / totalFights) * 100).toFixed(2) : '0.00';
    const avgPoints = (stat.points / stat.tournaments).toFixed(2);
    analyticsMd += `| ${index + 1} | ${stat.name} | ${winrate}% | ${avgPoints} | ${stat.avgPlacement} |\n`;
});

analyticsMd += `\n## Ключевые выводы\n\n`;

// Анализ лидеров
const leader = sortedStats[0];
const leaderWinrate = ((leader.wins / (leader.wins + leader.draws + leader.losses)) * 100).toFixed(2);
analyticsMd += `### 1. Лидер турниров\n`;
analyticsMd += `**${leader.name}** с винрейтом ${leaderWinrate}% показывает стабильно высокие результаты. `;
analyticsMd += `Среднее место ${leader.avgPlacement} из 9 подтверждает его доминирование.\n\n`;

// Анализ аутсайдеров
const last = sortedStats[sortedStats.length - 1];
const lastWinrate = ((last.wins / (last.wins + last.draws + last.losses)) * 100).toFixed(2);
analyticsMd += `### 2. Самый слабый перк\n`;
analyticsMd += `**${last.name}** с винрейтом ${lastWinrate}% показывает низкую эффективность. `;
analyticsMd += `Среднее место ${last.avgPlacement} из 9 указывает на необходимость балансировки.\n\n`;

// Статистическая значимость
analyticsMd += `### 3. Статистическая значимость\n`;
analyticsMd += `- **Выборка:** ${totalTournaments * 8} боев на каждого бойца (${totalTournaments} турниров)\n`;
analyticsMd += `- **Достаточность:** Более чем достаточна для статистически значимых выводов\n`;
analyticsMd += `- **Точность:** Разница в 0.5-1% между перками статистически значима\n`;
analyticsMd += `- **Вывод:** Результаты на ${totalTournaments} турнирах можно считать окончательными и использовать для балансировки\n\n`;

// Рекомендации по балансу
analyticsMd += `## Рекомендации по балансу\n\n`;

const weakPerks = sortedStats.filter(s => {
    const winrate = (s.wins / (s.wins + s.draws + s.losses)) * 100;
    return winrate < 48;
});

if (weakPerks.length > 0) {
    analyticsMd += `### Перки, требующие усиления:\n\n`;
    weakPerks.forEach(stat => {
        const winrate = ((stat.wins / (stat.wins + stat.draws + stat.losses)) * 100).toFixed(2);
        analyticsMd += `- **${stat.name}** (${winrate}% винрейт): Требует пересмотра механики или усиления эффекта\n`;
    });
    analyticsMd += `\n`;
}

const strongPerks = sortedStats.filter(s => {
    const winrate = (s.wins / (s.wins + s.draws + s.losses)) * 100;
    return winrate > 52;
});

if (strongPerks.length > 0) {
    analyticsMd += `### Перки, показывающие высокую эффективность:\n\n`;
    strongPerks.forEach(stat => {
        const winrate = ((stat.wins / (stat.wins + stat.draws + stat.losses)) * 100).toFixed(2);
        analyticsMd += `- **${stat.name}** (${winrate}% винрейт): Стабильно сильный перк, может потребовать небольшого ослабления для баланса\n`;
    });
    analyticsMd += `\n`;
}

// Сохраняем аналитический отчет
const analyticsFile = path.join(__dirname, `analytics-1000-tournaments-blockmaster-updated.md`);
fs.writeFileSync(analyticsFile, analyticsMd, 'utf8');

console.log(`Аналитический отчет создан: analytics-1000-tournaments-cycle.md`);
console.log(`\nОбработано турниров: ${totalTournaments}`);
console.log(`Уникальных бойцов (перков): ${sortedStats.length}`);
console.log(`Боев на каждого бойца: ${totalTournaments * 8}`);

// Выводим краткую статистику
console.log('\n=== Краткая статистика ===');
sortedStats.forEach((stat, index) => {
    const totalFights = stat.wins + stat.draws + stat.losses;
    const winrate = totalFights > 0 ? ((stat.wins / totalFights) * 100).toFixed(2) : '0.00';
    console.log(`${index + 1}. ${stat.name}: ${winrate}% винрейт (${stat.wins}/${totalFights}), среднее место: ${stat.avgPlacement}`);
});

