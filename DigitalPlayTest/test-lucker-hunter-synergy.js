// Тест синергии Lucker? с Hunter-перками
// Проверяем, правильно ли применяются перки и работает ли синергия

// Константы игры
const TIE_ROUND_HP = 2;
const ACTIONS_PER_PHASE = 3;

const DEFAULT_CRIT_CHANCE = {
    high: 0.10,
    mid: 0.05,
    low: 0.05
};

class Perk {
    constructor(id, name, fullName, description, targetZone) {
        this.id = id;
        this.name = name;
        this.fullName = fullName;
        this.description = description;
        this.targetZone = targetZone;
    }

    apply(fighter) {
        if (!fighter || !this.targetZone) {
            return;
        }
        fighter.critChance[this.targetZone] = DEFAULT_CRIT_CHANCE[this.targetZone] * 2;
    }
}

const PERKS = {
    HEAD_HUNTER: new Perk('head_hunter', 'HeadHunter', 'Удвоенная вероятность крита в голову', 'Вероятность критического удара в голову удваивается', 'high'),
    BODY_HUNTER: new Perk('body_hunter', 'BodyHunter', 'Удвоенная вероятность крита в тело', 'Вероятность критического удара в тело удваивается', 'mid'),
    LEG_HUNTER: new Perk('leg_hunter', 'LegHunter', 'Удвоенная вероятность крита в ноги', 'Вероятность критического удара в ноги удваивается', 'low'),
    LUCKER: new Perk('lucker', 'Lucker?', 'Усиление критических ударов', 'С шансом 50% удваивает урон от крита (x4 вместо x2)', null)
};

class Fighter {
    constructor(name, perks) {
        this.name = name;
        this.perks = perks;
        this.maxHp = 12;
        this.hp = 12;
        this.damage = 1;
        this.defense = 0;
        this.critChance = { ...DEFAULT_CRIT_CHANCE };
        this.applyPerks();
    }

    hasPerk(perkId) {
        return this.perks.some(perk => perk.id === perkId);
    }

    applyPerks() {
        if (!this.perks || this.perks.length === 0) return;
        this.perks.forEach(perk => {
            perk.apply(this);
        });
    }

    checkCriticalHit(action) {
        const chance = this.critChance[action] || 0;
        return Math.random() < chance;
    }
}

// Тест 1: Проверяем, правильно ли применяются Hunter-перки
console.log('=== ТЕСТ 1: Применение Hunter-перков ===');
const fighter1 = new Fighter('Test1', [PERKS.HEAD_HUNTER]);
console.log('HeadHunter только:');
console.log('  critChance.high:', fighter1.critChance.high, '(ожидается 0.20)');
console.log('  critChance.mid:', fighter1.critChance.mid, '(ожидается 0.05)');
console.log('  critChance.low:', fighter1.critChance.low, '(ожидается 0.05)');

const fighter2 = new Fighter('Test2', [PERKS.HEAD_HUNTER, PERKS.LUCKER]);
console.log('\nHeadHunter + Lucker?:');
console.log('  critChance.high:', fighter2.critChance.high, '(ожидается 0.20)');
console.log('  critChance.mid:', fighter2.critChance.mid, '(ожидается 0.05)');
console.log('  critChance.low:', fighter2.critChance.low, '(ожидается 0.05)');
console.log('  hasPerk("lucker"):', fighter2.hasPerk('lucker'));

// Тест 2: Симуляция атак для проверки частоты критов
console.log('\n=== ТЕСТ 2: Симуляция атак ===');
function simulateAttacks(fighter, zone, count) {
    let crits = 0;
    let luckerProcs = 0;
    let totalDamage = 0;
    
    for (let i = 0; i < count; i++) {
        const isCritical = fighter.checkCriticalHit(zone);
        if (isCritical) {
            crits++;
            let damage = 1;
            const hasLucker = fighter.hasPerk('lucker');
            if (hasLucker && Math.random() < 0.5) {
                damage = 4;
                luckerProcs++;
            } else {
                damage = 2;
            }
            totalDamage += damage;
        } else {
            totalDamage += 1;
        }
    }
    
    return {
        crits,
        critRate: crits / count,
        luckerProcs,
        luckerProcRate: luckerProcs / count,
        avgDamage: totalDamage / count
    };
}

const testCount = 100000;
console.log(`\nСимуляция ${testCount} атак в зону 'high':`);

const fighterNoPerks = new Fighter('NoPerks', []);
const resultNoPerks = simulateAttacks(fighterNoPerks, 'high', testCount);
console.log('\nБез перков:');
console.log('  Критов:', resultNoPerks.crits, `(${(resultNoPerks.critRate * 100).toFixed(2)}%)`);
console.log('  Средний урон:', resultNoPerks.avgDamage.toFixed(3));

const fighterHeadHunter = new Fighter('HeadHunter', [PERKS.HEAD_HUNTER]);
const resultHeadHunter = simulateAttacks(fighterHeadHunter, 'high', testCount);
console.log('\nТолько HeadHunter:');
console.log('  Критов:', resultHeadHunter.crits, `(${(resultHeadHunter.critRate * 100).toFixed(2)}%)`);
console.log('  Средний урон:', resultHeadHunter.avgDamage.toFixed(3));

const fighterHeadHunterLucker = new Fighter('HeadHunter+Lucker', [PERKS.HEAD_HUNTER, PERKS.LUCKER]);
const resultHeadHunterLucker = simulateAttacks(fighterHeadHunterLucker, 'high', testCount);
console.log('\nHeadHunter + Lucker?:');
console.log('  Критов:', resultHeadHunterLucker.crits, `(${(resultHeadHunterLucker.critRate * 100).toFixed(2)}%)`);
console.log('  Lucker срабатываний:', resultHeadHunterLucker.luckerProcs, `(${(resultHeadHunterLucker.luckerProcRate * 100).toFixed(2)}%)`);
console.log('  Средний урон:', resultHeadHunterLucker.avgDamage.toFixed(3));

console.log('\n=== АНАЛИЗ СИНЕРГИИ ===');
const damageIncrease = resultHeadHunterLucker.avgDamage - resultHeadHunter.avgDamage;
const damageIncreasePercent = (damageIncrease / resultHeadHunter.avgDamage) * 100;
console.log(`Увеличение среднего урона от Lucker?: ${damageIncrease.toFixed(3)} (${damageIncreasePercent.toFixed(2)}%)`);

// Тест 3: Проверяем, что происходит при атаках в разные зоны
console.log('\n=== ТЕСТ 3: Атаки в разные зоны ===');
const zones = ['high', 'mid', 'low'];
zones.forEach(zone => {
    const result = simulateAttacks(fighterHeadHunterLucker, zone, testCount);
    const expectedCrit = zone === 'high' ? 0.20 : 0.05;
    console.log(`\nЗона ${zone} (ожидаемый крит-шанс: ${(expectedCrit * 100).toFixed(0)}%):`);
    console.log(`  Критов: ${result.crits} (${(result.critRate * 100).toFixed(2)}%)`);
    console.log(`  Lucker срабатываний: ${result.luckerProcs} (${(result.luckerProcRate * 100).toFixed(2)}%)`);
    console.log(`  Средний урон: ${result.avgDamage.toFixed(3)}`);
});

// Тест 4: Общий средний урон при случайных атаках
console.log('\n=== ТЕСТ 4: Случайные атаки (все зоны равновероятны) ===');
function simulateRandomAttacks(fighter, count) {
    let totalDamage = 0;
    let totalCrits = 0;
    let totalLuckerProcs = 0;
    const zones = ['high', 'mid', 'low'];
    
    for (let i = 0; i < count; i++) {
        const zone = zones[Math.floor(Math.random() * zones.length)];
        const isCritical = fighter.checkCriticalHit(zone);
        
        if (isCritical) {
            totalCrits++;
            let damage = 1;
            const hasLucker = fighter.hasPerk('lucker');
            if (hasLucker && Math.random() < 0.5) {
                damage = 4;
                totalLuckerProcs++;
            } else {
                damage = 2;
            }
            totalDamage += damage;
        } else {
            totalDamage += 1;
        }
    }
    
    return {
        totalDamage,
        avgDamage: totalDamage / count,
        critRate: totalCrits / count,
        luckerProcRate: totalLuckerProcs / count
    };
}

const randomResultNoPerks = simulateRandomAttacks(fighterNoPerks, testCount);
const randomResultHeadHunter = simulateRandomAttacks(fighterHeadHunter, testCount);
const randomResultHeadHunterLucker = simulateRandomAttacks(fighterHeadHunterLucker, testCount);

console.log('\nБез перков:');
console.log(`  Средний урон: ${randomResultNoPerks.avgDamage.toFixed(3)}`);
console.log(`  Крит-шанс: ${(randomResultNoPerks.critRate * 100).toFixed(2)}%`);

console.log('\nТолько HeadHunter:');
console.log(`  Средний урон: ${randomResultHeadHunter.avgDamage.toFixed(3)}`);
console.log(`  Крит-шанс: ${(randomResultHeadHunter.critRate * 100).toFixed(2)}%`);

console.log('\nHeadHunter + Lucker?:');
console.log(`  Средний урон: ${randomResultHeadHunterLucker.avgDamage.toFixed(3)}`);
console.log(`  Крит-шанс: ${(randomResultHeadHunterLucker.critRate * 100).toFixed(2)}%`);
console.log(`  Lucker срабатываний: ${(randomResultHeadHunterLucker.luckerProcRate * 100).toFixed(2)}%`);

const randomDamageIncrease = randomResultHeadHunterLucker.avgDamage - randomResultHeadHunter.avgDamage;
const randomDamageIncreasePercent = (randomDamageIncrease / randomResultHeadHunter.avgDamage) * 100;
console.log(`\nУвеличение среднего урона от Lucker? (случайные атаки): ${randomDamageIncrease.toFixed(3)} (${randomDamageIncreasePercent.toFixed(2)}%)`);

