// Детальное расследование предвзятости BodyHunter vs LegHunter
const { Fighter, PERKS, Fight } = require('./tournament-simulator');

console.log('=== Расследование предвзятости BodyHunter vs LegHunter ===\n');

// Тест: Меняем порядок бойцов
const results1 = { bodyHunter: 0, legHunter: 0, draws: 0 };
const results2 = { bodyHunter: 0, legHunter: 0, draws: 0 };

console.log('Тест 1: BodyHunter vs LegHunter (BodyHunter первый)');
for (let i = 0; i < 5000; i++) {
    const bodyHunter = new Fighter('BodyHunter', PERKS.BODY_HUNTER);
    const legHunter = new Fighter('LegHunter', PERKS.LEG_HUNTER);
    const fight = new Fight(bodyHunter, legHunter);
    const result = fight.simulate();
    
    if (result.winner === bodyHunter) results1.bodyHunter++;
    else if (result.winner === legHunter) results1.legHunter++;
    else results1.draws++;
}

console.log(`BodyHunter: ${results1.bodyHunter} (${(results1.bodyHunter/5000*100).toFixed(2)}%)`);
console.log(`LegHunter: ${results1.legHunter} (${(results1.legHunter/5000*100).toFixed(2)}%)`);
console.log(`Ничьих: ${results1.draws}`);
console.log(`Разница: ${Math.abs(results1.bodyHunter - results1.legHunter)} (${Math.abs(results1.bodyHunter/5000*100 - results1.legHunter/5000*100).toFixed(2)}%)\n`);

console.log('Тест 2: LegHunter vs BodyHunter (LegHunter первый)');
for (let i = 0; i < 5000; i++) {
    const legHunter = new Fighter('LegHunter', PERKS.LEG_HUNTER);
    const bodyHunter = new Fighter('BodyHunter', PERKS.BODY_HUNTER);
    const fight = new Fight(legHunter, bodyHunter);
    const result = fight.simulate();
    
    if (result.winner === legHunter) results2.legHunter++;
    else if (result.winner === bodyHunter) results2.bodyHunter++;
    else results2.draws++;
}

console.log(`LegHunter: ${results2.legHunter} (${(results2.legHunter/5000*100).toFixed(2)}%)`);
console.log(`BodyHunter: ${results2.bodyHunter} (${(results2.bodyHunter/5000*100).toFixed(2)}%)`);
console.log(`Ничьих: ${results2.draws}`);
console.log(`Разница: ${Math.abs(results2.legHunter - results2.bodyHunter)} (${Math.abs(results2.legHunter/5000*100 - results2.bodyHunter/5000*100).toFixed(2)}%)\n`);

// Объединенные результаты
const totalBodyHunter = results1.bodyHunter + results2.bodyHunter;
const totalLegHunter = results1.legHunter + results2.legHunter;
const total = totalBodyHunter + totalLegHunter + results1.draws + results2.draws;

console.log('Объединенные результаты (учитывая порядок):');
console.log(`BodyHunter: ${totalBodyHunter} (${(totalBodyHunter/total*100).toFixed(2)}%)`);
console.log(`LegHunter: ${totalLegHunter} (${(totalLegHunter/total*100).toFixed(2)}%)`);
console.log(`Разница: ${Math.abs(totalBodyHunter - totalLegHunter)} (${Math.abs(totalBodyHunter/total*100 - totalLegHunter/total*100).toFixed(2)}%)\n`);

// Проверка: может быть проблема в том, кто атакует первым?
console.log('=== Анализ: Кто атакует первым? ===');
const bodyHunter = new Fighter('BodyHunter', PERKS.BODY_HUNTER);
const legHunter = new Fighter('LegHunter', PERKS.LEG_HUNTER);

// Проверяем код Fight.simulate()
console.log('В Fight.simulate() первый атакует fighter1 (тот, кто передан первым)');
console.log('Это означает, что порядок создания бойцов влияет на результат!\n');

// Проверяем, как это влияет на результаты
console.log('Вывод: Если порядок бойцов влияет на результат, то это объясняет разницу!');
console.log('В турнире BodyHunter и LegHunter могут создаваться в разном порядке,');
console.log('что может создавать предвзятость в результатах.');

