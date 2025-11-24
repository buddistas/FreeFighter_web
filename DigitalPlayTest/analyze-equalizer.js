// Анализ эффективности нового перка Equalizer
const fs = require('fs');
const path = require('path');

// Читаем результаты турниров
const data = fs.readFileSync(path.join(__dirname, 'analytics-dual-perks-equalizer-v2.md'), 'utf8');

// Парсим данные из таблицы
const lines = data.split('\n');
const combinations = [];

for (const line of lines) {
    if (line.startsWith('|') && !line.startsWith('| Место') && !line.startsWith('|-------')) {
        const parts = line.split('|').map(p => p.trim()).filter(p => p);
        if (parts.length >= 8) {
            const place = parseInt(parts[0]);
            const combination = parts[1];
            const wins = parseInt(parts[2]);
            const draws = parseInt(parts[3]);
            const losses = parseInt(parts[4]);
            const points = parseInt(parts[5]);
            const avgPoints = parseFloat(parts[6]);
            const winrate = parseFloat(parts[7].replace('%', ''));
            
            combinations.push({
                place,
                combination,
                wins,
                draws,
                losses,
                points,
                avgPoints,
                winrate
            });
        }
    }
}

// Анализируем Equalizer
const equalizerCombinations = combinations.filter(c => c.combination.includes('Equalizer'));
const otherPerks = ['FinishHim', 'TieBreaker', 'HPBoost', 'BlockMaster', 'Lucker?', 'CritDeflector', 'HeadHunter', 'BodyHunter', 'LegHunter'];

// Собираем статистику по каждому перку
const perkStats = {};
otherPerks.forEach(perk => {
    perkStats[perk] = {
        name: perk,
        combinations: [],
        totalWins: 0,
        totalLosses: 0,
        totalFights: 0,
        totalPoints: 0
    };
});

// Анализируем все комбинации для каждого перка
combinations.forEach(combo => {
    const perkNames = combo.combination.split(' + ');
    perkNames.forEach(perkName => {
        if (perkStats[perkName]) {
            perkStats[perkName].combinations.push(combo);
            perkStats[perkName].totalWins += combo.wins;
            perkStats[perkName].totalLosses += combo.losses;
            perkStats[perkName].totalFights += (combo.wins + combo.losses);
            perkStats[perkName].totalPoints += combo.points;
        }
    });
});

// Статистика по Equalizer
const equalizerStats = {
    name: 'Equalizer',
    combinations: equalizerCombinations,
    totalWins: equalizerCombinations.reduce((sum, c) => sum + c.wins, 0),
    totalLosses: equalizerCombinations.reduce((sum, c) => sum + c.losses, 0),
    totalFights: equalizerCombinations.reduce((sum, c) => sum + c.wins + c.losses, 0),
    totalPoints: equalizerCombinations.reduce((sum, c) => sum + c.points, 0)
};

equalizerStats.winrate = equalizerStats.totalFights > 0 ? 
    (equalizerStats.totalWins / equalizerStats.totalFights * 100) : 0;

// Сортируем комбинации Equalizer по винрейту
equalizerCombinations.sort((a, b) => b.winrate - a.winrate);

// Вычисляем статистику для других перков
const otherPerkStats = Object.values(perkStats).map(stat => {
    const winrate = stat.totalFights > 0 ? (stat.totalWins / stat.totalFights * 100) : 0;
    return {
        name: stat.name,
        winrate: winrate,
        totalWins: stat.totalWins,
        totalLosses: stat.totalLosses,
        totalFights: stat.totalFights,
        totalPoints: stat.totalPoints,
        avgWinrate: stat.combinations.length > 0 ?
            stat.combinations.reduce((sum, c) => sum + c.winrate, 0) / stat.combinations.length : 0
    };
});

otherPerkStats.sort((a, b) => b.winrate - a.winrate);

// Генерируем отчет
let md = `# Подробная аналитика обновленного перка Equalizer v2 (1000 турниров)\n\n`;
md += `## Описание перка\n\n`;
md += `**Equalizer v2** - Если на конец раунда у владельца перка количество HP на 4+ меньше чем у противника, противник лишается 2 HP.\n\n`;

md += `## Общая статистика Equalizer\n\n`;
md += `**Всего комбинаций с Equalizer:** ${equalizerCombinations.length}\n\n`;
md += `**Общая статистика:**\n`;
md += `- Победы: ${equalizerStats.totalWins}\n`;
md += `- Поражения: ${equalizerStats.totalLosses}\n`;
md += `- Всего боев: ${equalizerStats.totalFights}\n`;
md += `- Очки: ${equalizerStats.totalPoints}\n`;
md += `- **Винрейт: ${equalizerStats.winrate.toFixed(2)}%**\n\n`;

md += `## Рейтинг Equalizer среди всех перков\n\n`;
md += `| Место | Перк | Винрейт | Победы | Поражения | Очки |\n`;
md += `|-------|------|---------|--------|-----------|------|\n`;

let equalizerPlace = 0;
otherPerkStats.forEach((stat, index) => {
    if (stat.winrate > equalizerStats.winrate) {
        md += `| ${index + 1} | ${stat.name} | ${stat.winrate.toFixed(2)}% | ${stat.totalWins} | ${stat.totalLosses} | ${stat.totalPoints} |\n`;
    } else if (equalizerPlace === 0) {
        equalizerPlace = index + 1;
        md += `| **${equalizerPlace}** | **Equalizer** | **${equalizerStats.winrate.toFixed(2)}%** | **${equalizerStats.totalWins}** | **${equalizerStats.totalLosses}** | **${equalizerStats.totalPoints}** |\n`;
        md += `| ${index + 2} | ${stat.name} | ${stat.winrate.toFixed(2)}% | ${stat.totalWins} | ${stat.totalLosses} | ${stat.totalPoints} |\n`;
    } else {
        md += `| ${index + 2} | ${stat.name} | ${stat.winrate.toFixed(2)}% | ${stat.totalWins} | ${stat.totalLosses} | ${stat.totalPoints} |\n`;
    }
});

if (equalizerPlace === 0) {
    equalizerPlace = otherPerkStats.length + 1;
    md += `| **${equalizerPlace}** | **Equalizer** | **${equalizerStats.winrate.toFixed(2)}%** | **${equalizerStats.totalWins}** | **${equalizerStats.totalLosses}** | **${equalizerStats.totalPoints}** |\n`;
}

md += `\n## Комбинации с Equalizer (отсортированы по винрейту)\n\n`;
md += `| Место | Комбинация | Винрейт | Победы | Поражения | Очки | Место в общем рейтинге |\n`;
md += `|-------|------------|---------|--------|-----------|------|------------------------|\n`;

equalizerCombinations.forEach((combo, index) => {
    md += `| ${index + 1} | ${combo.combination} | ${combo.winrate.toFixed(2)}% | ${combo.wins} | ${combo.losses} | ${combo.points} | ${combo.place} |\n`;
});

md += `\n## Анализ синергии Equalizer с другими перками\n\n`;

// Анализируем синергию с каждым перком
const synergyAnalysis = [];
otherPerks.forEach(perk => {
    const combo = equalizerCombinations.find(c => c.combination.includes(perk));
    if (combo) {
        const otherCombo = combinations.find(c => 
            c.combination.includes(perk) && !c.combination.includes('Equalizer')
        );
        const perkStat = otherPerkStats.find(s => s.name === perk);
        
        synergyAnalysis.push({
            perk: perk,
            withEqualizer: combo.winrate,
            perkAverage: perkStat ? perkStat.winrate : 0,
            difference: combo.winrate - (perkStat ? perkStat.winrate : 0),
            combo: combo
        });
    }
});

synergyAnalysis.sort((a, b) => b.withEqualizer - a.withEqualizer);

md += `| Перк | Винрейт с Equalizer | Средний винрейт перка | Разница | Комбинация |\n`;
md += `|------|---------------------|----------------------|---------|------------|\n`;

synergyAnalysis.forEach(analysis => {
    const diff = analysis.difference >= 0 ? `+${analysis.difference.toFixed(2)}%` : `${analysis.difference.toFixed(2)}%`;
    md += `| ${analysis.perk} | ${analysis.withEqualizer.toFixed(2)}% | ${analysis.perkAverage.toFixed(2)}% | ${diff} | ${analysis.combo.combination} |\n`;
});

md += `\n## Выводы\n\n`;

// Анализ результатов
const bestCombo = equalizerCombinations[0];
const worstCombo = equalizerCombinations[equalizerCombinations.length - 1];
const bestSynergy = synergyAnalysis[0];
const worstSynergy = synergyAnalysis[synergyAnalysis.length - 1];

md += `### 1. Общая эффективность\n\n`;
md += `- Equalizer занимает **${equalizerPlace} место** из ${otherPerkStats.length + 1} перков по общему винрейту\n`;
md += `- Общий винрейт: **${equalizerStats.winrate.toFixed(2)}%**\n`;
md += `- Это ${equalizerStats.winrate < 50 ? '**ниже**' : '**выше**'} среднего уровня (50%)\n\n`;

md += `### 2. Лучшие комбинации\n\n`;
md += `- **Лучшая комбинация:** ${bestCombo.combination} (${bestCombo.winrate.toFixed(2)}% винрейт, место ${bestCombo.place} в общем рейтинге)\n`;
md += `- **Лучшая синергия:** ${bestSynergy.perk} + Equalizer (${bestSynergy.withEqualizer.toFixed(2)}% винрейт)\n\n`;

md += `### 3. Худшие комбинации\n\n`;
md += `- **Худшая комбинация:** ${worstCombo.combination} (${worstCombo.winrate.toFixed(2)}% винрейт, место ${worstCombo.place} в общем рейтинге)\n`;
md += `- **Худшая синергия:** ${worstSynergy.perk} + Equalizer (${worstSynergy.withEqualizer.toFixed(2)}% винрейт)\n\n`;

md += `### 4. Синергия с топ-перками\n\n`;
const topPerks = ['FinishHim', 'TieBreaker', 'HPBoost'];
topPerks.forEach(perk => {
    const synergy = synergyAnalysis.find(s => s.perk === perk);
    if (synergy) {
        md += `- **${perk} + Equalizer:** ${synergy.withEqualizer.toFixed(2)}% (${synergy.difference >= 0 ? '+' : ''}${synergy.difference.toFixed(2)}% от среднего ${perk})\n`;
    }
});

md += `\n### 5. Баланс перка\n\n`;
if (equalizerStats.winrate < 45) {
    md += `- Equalizer показывает **слабые** результаты (${equalizerStats.winrate.toFixed(2)}% < 45%)\n`;
    md += `- Перк может требовать усиления или изменения механики\n`;
} else if (equalizerStats.winrate < 50) {
    md += `- Equalizer показывает **ниже среднего** результаты (${equalizerStats.winrate.toFixed(2)}% < 50%)\n`;
    md += `- Перк находится в нижней части рейтинга, но не критически слаб\n`;
} else if (equalizerStats.winrate < 55) {
    md += `- Equalizer показывает **средние** результаты (${equalizerStats.winrate.toFixed(2)}%)\n`;
    md += `- Перк сбалансирован и находится в среднем диапазоне эффективности\n`;
} else {
    md += `- Equalizer показывает **сильные** результаты (${equalizerStats.winrate.toFixed(2)}% > 55%)\n`;
    md += `- Перк эффективен и может требовать ослабления\n`;
}

// Сохраняем отчет
const outputFile = path.join(__dirname, 'analytics-equalizer-detailed-v2.md');
fs.writeFileSync(outputFile, md, 'utf8');

console.log('Подробная аналитика создана: analytics-equalizer-detailed.md');
console.log(`\nОбщая статистика Equalizer:`);
console.log(`- Винрейт: ${equalizerStats.winrate.toFixed(2)}%`);
console.log(`- Место в рейтинге: ${equalizerPlace} из ${otherPerkStats.length + 1}`);
console.log(`- Лучшая комбинация: ${bestCombo.combination} (${bestCombo.winrate.toFixed(2)}%)`);
console.log(`- Худшая комбинация: ${worstCombo.combination} (${worstCombo.winrate.toFixed(2)}%)`);

