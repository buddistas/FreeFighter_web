// Анализ эффективности отдельных перков на основе данных турниров с комбинациями
// Самодостаточный скрипт с полной логикой игры

// Константы игры
const TIE_ROUND_HP = 2;
const ACTIONS_PER_PHASE = 3;

// Вероятности критического удара по умолчанию
const DEFAULT_CRIT_CHANCE = {
    high: 0.10,  // 10% в голову
    mid: 0.05,   // 5% в тело
    low: 0.05    // 5% в ноги
};

// Класс перка
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

// Определение всех перков
const PERKS = {
    HEAD_HUNTER: new Perk('head_hunter', 'HeadHunter', 'Удвоенная вероятность крита в голову', 'Вероятность критического удара в голову удваивается', 'high'),
    BODY_HUNTER: new Perk('body_hunter', 'BodyHunter', 'Удвоенная вероятность крита в тело', 'Вероятность критического удара в тело удваивается', 'mid'),
    LEG_HUNTER: new Perk('leg_hunter', 'LegHunter', 'Удвоенная вероятность крита в ноги', 'Вероятность критического удара в ноги удваивается', 'low'),
    TIE_BREAKER: new Perk('tie_breaker', 'TieBreaker', 'Дополнительное HP в дополнительных раундах', 'В дополнительных раундах получаете 2 дополнительных HP (4 HP вместо 2)', null),
    HP_BOOST: new Perk('hp_boost', 'HPBoost', 'Дополнительное HP в начале боя', 'В начале боя получаете 13 HP вместо 12', null),
    CRIT_DEFLECTOR: new Perk('crit_deflector', 'CritDeflector', 'Защита от критических ударов', 'С шансом 50% превращает критический удар противника в обычный удар', null),
    LUCKER: new Perk('lucker', 'Lucker?', 'Усиление критических ударов', 'С шансом 50% удваивает урон от крита (x4 вместо x2)', null),
    BLOCK_MASTER: new Perk('block_master', 'BlockMaster', 'Мастер защиты', 'При успешном блокировании двух ударов подряд восстанавливает 1 HP', null),
    FINISH_HIM: new Perk('finish_him', 'FinishHim', 'Добивание', 'Если у противника на конец раунда осталось 1 HP, уменьшает его HP на 1', null)
};

const ALL_PERKS = [
    PERKS.HEAD_HUNTER, PERKS.BODY_HUNTER, PERKS.LEG_HUNTER,
    PERKS.TIE_BREAKER, PERKS.HP_BOOST, PERKS.CRIT_DEFLECTOR,
    PERKS.LUCKER, PERKS.BLOCK_MASTER, PERKS.FINISH_HIM
];

// Генерация всех уникальных комбинаций из 2 перков
function generatePerkCombinations() {
    const combinations = [];
    for (let i = 0; i < ALL_PERKS.length; i++) {
        for (let j = i + 1; j < ALL_PERKS.length; j++) {
            combinations.push([ALL_PERKS[i], ALL_PERKS[j]]);
        }
    }
    return combinations;
}

// Создание уникального имени для комбинации перков
function getCombinationName(perks) {
    const sortedPerks = [...perks].sort((a, b) => a.name.localeCompare(b.name));
    return sortedPerks.map(p => p.name).join(' + ');
}

// Класс бойца с поддержкой двух перков
class Fighter {
    constructor(name, perks) {
        this.name = name;
        this.perks = perks;
        this.maxHp = 12;
        this.hp = 12;
        this.damage = 1;
        this.defense = 0;
        this.critChance = { ...DEFAULT_CRIT_CHANCE };
        this.wins = 0;
        this.losses = 0;
        this.draws = 0;
        this.points = 0;
        this.applyPerks();
    }

    hasPerk(perkId) {
        return this.perks.some(perk => perk.id === perkId);
    }

    applyPerks() {
        if (!this.perks || this.perks.length === 0) return;
        const hasHPBoost = this.hasPerk('hp_boost');
        if (hasHPBoost) {
            this.maxHp = 13;
            this.hp = 13;
        }
        this.perks.forEach(perk => {
            if (perk.id !== 'hp_boost') {
                perk.apply(this);
            }
        });
    }

    reset() {
        const hasHPBoost = this.hasPerk('hp_boost');
        if (hasHPBoost) {
            this.maxHp = 13;
            this.hp = 13;
        } else {
            this.maxHp = 12;
            this.hp = 12;
        }
        this.critChance = { ...DEFAULT_CRIT_CHANCE };
        this.perks.forEach(perk => {
            if (perk.id !== 'hp_boost') {
                perk.apply(this);
            }
        });
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
    }

    calculateDamage(attackerDamage) {
        return Math.max(0, attackerDamage - this.defense);
    }

    checkCriticalHit(action) {
        const chance = this.critChance[action] || 0;
        return Math.random() < chance;
    }

    generateRandomSequence() {
        const actions = ['high', 'mid', 'low'];
        const sequence = [];
        for (let i = 0; i < ACTIONS_PER_PHASE; i++) {
            sequence.push(actions[Math.floor(Math.random() * actions.length)]);
        }
        return sequence;
    }
}

// Класс боя (упрощенная версия для анализа)
class Fight {
    constructor(fighter1, fighter2) {
        this.fighter1 = fighter1;
        this.fighter2 = fighter2;
    }

    simulate() {
        this.fighter1.reset();
        this.fighter2.reset();
        let fighter1Attacking = true;
        let round = 1;
        const maxRounds = 100;

        while (round <= maxRounds) {
            let attacker = fighter1Attacking ? this.fighter1 : this.fighter2;
            let defender = fighter1Attacking ? this.fighter2 : this.fighter1;
            const attackSequence1 = attacker.generateRandomSequence();
            const blockSequence1 = defender.generateRandomSequence();
            let consecutiveBlocks1 = 0;

            for (let i = 0; i < ACTIONS_PER_PHASE; i++) {
                const attackAction = attackSequence1[i];
                const blockAction = blockSequence1[i];

                if (attackAction !== blockAction) {
                    consecutiveBlocks1 = 0;
                    let damage = defender.calculateDamage(attacker.damage);
                    const isCritical = attacker.checkCriticalHit(attackAction);
                    if (isCritical) {
                        const hasCritDeflector = defender.hasPerk('crit_deflector');
                        if (hasCritDeflector && Math.random() < 0.5) {
                            // Крит заблокирован
                        } else {
                            const hasLucker = attacker.hasPerk('lucker');
                            if (hasLucker && Math.random() < 0.5) {
                                damage *= 4;
                            } else {
                                damage *= 2;
                            }
                        }
                    }
                    defender.takeDamage(damage);
                } else {
                    consecutiveBlocks1++;
                    if (consecutiveBlocks1 === 2) {
                        const hasBlockMaster = defender.hasPerk('block_master');
                        if (hasBlockMaster) {
                            defender.hp = Math.min(defender.maxHp, defender.hp + 1);
                        }
                    }
                }
            }

            fighter1Attacking = !fighter1Attacking;
            attacker = fighter1Attacking ? this.fighter1 : this.fighter2;
            defender = fighter1Attacking ? this.fighter2 : this.fighter1;
            const attackSequence2 = attacker.generateRandomSequence();
            const blockSequence2 = defender.generateRandomSequence();
            let consecutiveBlocks2 = 0;

            for (let i = 0; i < ACTIONS_PER_PHASE; i++) {
                const attackAction = attackSequence2[i];
                const blockAction = blockSequence2[i];

                if (attackAction !== blockAction) {
                    consecutiveBlocks2 = 0;
                    let damage = defender.calculateDamage(attacker.damage);
                    const isCritical = attacker.checkCriticalHit(attackAction);
                    if (isCritical) {
                        const hasCritDeflector = defender.hasPerk('crit_deflector');
                        if (hasCritDeflector && Math.random() < 0.5) {
                            // Крит заблокирован
                        } else {
                            const hasLucker = attacker.hasPerk('lucker');
                            if (hasLucker && Math.random() < 0.5) {
                                damage *= 4;
                            } else {
                                damage *= 2;
                            }
                        }
                    }
                    defender.takeDamage(damage);
                } else {
                    consecutiveBlocks2++;
                    if (consecutiveBlocks2 === 2) {
                        const hasBlockMaster = defender.hasPerk('block_master');
                        if (hasBlockMaster) {
                            defender.hp = Math.min(defender.maxHp, defender.hp + 1);
                        }
                    }
                }
            }

            const hasFinishHim1 = this.fighter1.hasPerk('finish_him');
            if (hasFinishHim1 && this.fighter2.hp === 1) {
                this.fighter2.takeDamage(1);
            }
            const hasFinishHim2 = this.fighter2.hasPerk('finish_him');
            if (hasFinishHim2 && this.fighter1.hp === 1) {
                this.fighter1.takeDamage(1);
            }

            const fighter1Dead = this.fighter1.hp <= 0;
            const fighter2Dead = this.fighter2.hp <= 0;

            if (fighter1Dead && fighter2Dead) {
                return this.simulateTieRound();
            } else if (fighter1Dead) {
                this.fighter2.wins++;
                this.fighter2.points += 3;
                this.fighter1.losses++;
                return { winner: this.fighter2, loser: this.fighter1, draw: false };
            } else if (fighter2Dead) {
                this.fighter1.wins++;
                this.fighter1.points += 3;
                this.fighter2.losses++;
                return { winner: this.fighter1, loser: this.fighter2, draw: false };
            }

            fighter1Attacking = !fighter1Attacking;
            round++;
        }

        return this.simulateTieRound();
    }

    simulateTieRound(tieRoundDepth = 0) {
        const MAX_TIE_ROUNDS = 1000;
        if (tieRoundDepth >= MAX_TIE_ROUNDS) {
            this.fighter1.draws++;
            this.fighter1.points += 1;
            this.fighter2.draws++;
            this.fighter2.points += 1;
            return { winner: null, loser: null, draw: true };
        }
        
        const fighter1HasTieBreaker = this.fighter1.hasPerk('tie_breaker');
        const fighter2HasTieBreaker = this.fighter2.hasPerk('tie_breaker');
        const fighter1TieHP = fighter1HasTieBreaker ? TIE_ROUND_HP + 2 : TIE_ROUND_HP;
        const fighter2TieHP = fighter2HasTieBreaker ? TIE_ROUND_HP + 2 : TIE_ROUND_HP;

        this.fighter1.hp = fighter1TieHP;
        this.fighter1.maxHp = fighter1TieHP;
        this.fighter2.hp = fighter2TieHP;
        this.fighter2.maxHp = fighter2TieHP;

        let fighter1Attacking = true;
        const maxRounds = 50;

        for (let round = 1; round <= maxRounds; round++) {
            let attacker = fighter1Attacking ? this.fighter1 : this.fighter2;
            let defender = fighter1Attacking ? this.fighter2 : this.fighter1;
            const attackSequence1 = attacker.generateRandomSequence();
            const blockSequence1 = defender.generateRandomSequence();

            for (let i = 0; i < ACTIONS_PER_PHASE; i++) {
                const attackAction = attackSequence1[i];
                const blockAction = blockSequence1[i];
                if (attackAction !== blockAction) {
                    let damage = defender.calculateDamage(attacker.damage);
                    const isCritical = attacker.checkCriticalHit(attackAction);
                    if (isCritical) {
                        const hasCritDeflector = defender.hasPerk('crit_deflector');
                        if (hasCritDeflector && Math.random() < 0.5) {
                            // Крит заблокирован
                        } else {
                            const hasLucker = attacker.hasPerk('lucker');
                            if (hasLucker && Math.random() < 0.5) {
                                damage *= 4;
                            } else {
                                damage *= 2;
                            }
                        }
                    }
                    defender.takeDamage(damage);
                }
            }

            fighter1Attacking = !fighter1Attacking;
            attacker = fighter1Attacking ? this.fighter1 : this.fighter2;
            defender = fighter1Attacking ? this.fighter2 : this.fighter1;
            const attackSequence2 = attacker.generateRandomSequence();
            const blockSequence2 = defender.generateRandomSequence();

            for (let i = 0; i < ACTIONS_PER_PHASE; i++) {
                const attackAction = attackSequence2[i];
                const blockAction = blockSequence2[i];
                if (attackAction !== blockAction) {
                    let damage = defender.calculateDamage(attacker.damage);
                    const isCritical = attacker.checkCriticalHit(attackAction);
                    if (isCritical) {
                        const hasCritDeflector = defender.hasPerk('crit_deflector');
                        if (hasCritDeflector && Math.random() < 0.5) {
                            // Крит заблокирован
                        } else {
                            const hasLucker = attacker.hasPerk('lucker');
                            if (hasLucker && Math.random() < 0.5) {
                                damage *= 4;
                            } else {
                                damage *= 2;
                            }
                        }
                    }
                    defender.takeDamage(damage);
                }
            }

            const fighter1Dead = this.fighter1.hp <= 0;
            const fighter2Dead = this.fighter2.hp <= 0;

            if (fighter1Dead && fighter2Dead) {
                return this.simulateTieRound(tieRoundDepth + 1);
            } else if (fighter1Dead) {
                this.fighter2.wins++;
                this.fighter2.points += 3;
                this.fighter1.losses++;
                return { winner: this.fighter2, loser: this.fighter1, draw: false };
            } else if (fighter2Dead) {
                this.fighter1.wins++;
                this.fighter1.points += 3;
                this.fighter2.losses++;
                return { winner: this.fighter1, loser: this.fighter2, draw: false };
            }

            fighter1Attacking = !fighter1Attacking;
        }

        return this.simulateTieRound(tieRoundDepth + 1);
    }
}

// Класс турнира
class Tournament {
    constructor(tournamentNumber) {
        this.tournamentNumber = tournamentNumber;
        this.fighters = [];
        this.fights = [];
        const combinations = generatePerkCombinations();
        for (let i = 0; i < combinations.length; i++) {
            const perks = combinations[i];
            const name = getCombinationName(perks);
            this.fighters.push(new Fighter(name, perks));
        }
    }

    run() {
        for (let i = 0; i < this.fighters.length; i++) {
            for (let j = i + 1; j < this.fighters.length; j++) {
                const fight = new Fight(this.fighters[i], this.fighters[j]);
                const result = fight.simulate();
                this.fights.push({
                    fighter1: this.fighters[i],
                    fighter2: this.fighters[j],
                    result: result
                });
            }
        }
        this.fighters.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.wins !== a.wins) return b.wins - a.wins;
            if (a.losses !== b.losses) return a.losses - b.losses;
            return b.draws - a.draws;
        });
    }
}

// Основная логика анализа
const fs = require('fs');
const path = require('path');

const combinationStats = {};

function updateCombinationStats(tournament) {
    tournament.fighters.forEach(fighter => {
        const combinationName = fighter.name;
        if (!combinationStats[combinationName]) {
            combinationStats[combinationName] = {
                name: combinationName,
                wins: 0,
                draws: 0,
                losses: 0,
                points: 0,
                tournaments: 0
            };
        }
        combinationStats[combinationName].wins += fighter.wins;
        combinationStats[combinationName].draws += fighter.draws;
        combinationStats[combinationName].losses += fighter.losses;
        combinationStats[combinationName].points += fighter.points;
        combinationStats[combinationName].tournaments++;
    });
}

const startTournament = 1;
const endTournament = 1000;
const totalTournaments = endTournament - startTournament + 1;

console.log(`Проводим ${totalTournaments} турниров для анализа эффективности перков...`);
console.log('Это может занять некоторое время...\n');

const startTime = Date.now();

for (let i = startTournament; i <= endTournament; i++) {
    if (i % 100 === 0 || (i <= 100 && i % 10 === 0)) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const progress = ((i - startTournament + 1) / totalTournaments * 100).toFixed(1);
        console.log(`Прогресс: ${i - startTournament + 1}/${totalTournaments} (${progress}%) - Турнир ${i} - Время: ${elapsed}с`);
    }
    const tournament = new Tournament(i);
    tournament.run();
    updateCombinationStats(tournament);
}

const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\nВсе ${totalTournaments} турниров завершены за ${elapsedTime} секунд!`);

// Анализируем эффективность каждого перка
const perkStats = {};

ALL_PERKS.forEach(perk => {
    perkStats[perk.id] = {
        name: perk.name,
        fullName: perk.fullName,
        combinations: [],
        totalWins: 0,
        totalDraws: 0,
        totalLosses: 0,
        totalPoints: 0,
        totalFights: 0
    };
});

Object.values(combinationStats).forEach(combination => {
    const combinationName = combination.name;
    const totalFights = combination.wins + combination.draws + combination.losses;
    const perkNames = combinationName.split(' + ');
    
    perkNames.forEach(perkName => {
        const perk = ALL_PERKS.find(p => p.name === perkName);
        if (perk) {
            perkStats[perk.id].combinations.push({
                combination: combinationName,
                wins: combination.wins,
                draws: combination.draws,
                losses: combination.losses,
                points: combination.points,
                fights: totalFights
            });
            
            perkStats[perk.id].totalWins += combination.wins;
            perkStats[perk.id].totalDraws += combination.draws;
            perkStats[perk.id].totalLosses += combination.losses;
            perkStats[perk.id].totalPoints += combination.points;
            perkStats[perk.id].totalFights += totalFights;
        }
    });
});

const perkEffectiveness = Object.values(perkStats).map(stat => {
    const winrate = stat.totalFights > 0 ? (stat.totalWins / stat.totalFights) * 100 : 0;
    const avgPointsPerTournament = stat.combinations.length > 0 ? 
        (stat.totalPoints / (stat.combinations.length * totalTournaments)) : 0;
    const avgWinrate = stat.combinations.length > 0 ?
        stat.combinations.reduce((sum, c) => sum + (c.wins / c.fights * 100), 0) / stat.combinations.length : 0;
    
    return {
        name: stat.name,
        fullName: stat.fullName,
        combinationsCount: stat.combinations.length,
        totalWins: stat.totalWins,
        totalDraws: stat.totalDraws,
        totalLosses: stat.totalLosses,
        totalPoints: stat.totalPoints,
        totalFights: stat.totalFights,
        winrate: winrate,
        avgPointsPerTournament: avgPointsPerTournament,
        avgWinrateAcrossCombinations: avgWinrate
    };
});

perkEffectiveness.sort((a, b) => {
    if (b.winrate !== a.winrate) return b.winrate - a.winrate;
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return b.totalWins - a.totalWins;
});

let md = `# Аналитика эффективности отдельных перков (1000 турниров)\n\n`;
md += `## Статистика по каждому перку\n\n`;
md += `**Методология:** Для каждого перка анализируются все комбинации, где он участвует (8 комбинаций для каждого перка).\n\n`;
md += `**Количество боев на каждую комбинацию:** ${totalTournaments * 35} боев\n\n`;
md += `| Место | Перк | Полное название | Комбинаций | Победы | Ничьи | Поражения | Очки | Винрейт | Средний винрейт по комбинациям |\n`;
md += `|-------|------|-----------------|------------|--------|-------|-----------|------|---------|--------------------------------|\n`;

perkEffectiveness.forEach((stat, index) => {
    const winrate = stat.winrate.toFixed(2);
    const avgWinrate = stat.avgWinrateAcrossCombinations.toFixed(2);
    md += `| ${index + 1} | ${stat.name} | ${stat.fullName} | ${stat.combinationsCount} | ${stat.totalWins} | ${stat.totalDraws} | ${stat.totalLosses} | ${stat.totalPoints} | ${winrate}% | ${avgWinrate}% |\n`;
});

md += `\n## Детальная статистика по комбинациям для каждого перка\n\n`;

perkEffectiveness.forEach(stat => {
    const perkId = Object.keys(perkStats).find(id => perkStats[id].name === stat.name);
    const perkData = perkStats[perkId];
    
    md += `### ${stat.name} (${stat.fullName})\n\n`;
    md += `**Общая статистика:** ${stat.totalWins} побед, ${stat.totalDraws} ничьих, ${stat.totalLosses} поражений, ${stat.totalPoints} очков, винрейт ${stat.winrate.toFixed(2)}%\n\n`;
    md += `**Комбинации с этим перком:**\n\n`;
    md += `| Комбинация | Победы | Ничьи | Поражения | Очки | Винрейт |\n`;
    md += `|------------|--------|-------|-----------|------|----------|\n`;
    
    const sortedCombinations = [...perkData.combinations].sort((a, b) => {
        const winrateA = a.fights > 0 ? (a.wins / a.fights) * 100 : 0;
        const winrateB = b.fights > 0 ? (b.wins / b.fights) * 100 : 0;
        return winrateB - winrateA;
    });
    
    sortedCombinations.forEach(comb => {
        const winrate = comb.fights > 0 ? ((comb.wins / comb.fights) * 100).toFixed(2) : '0.00';
        md += `| ${comb.combination} | ${comb.wins} | ${comb.draws} | ${comb.losses} | ${comb.points} | ${winrate}% |\n`;
    });
    
    md += `\n`;
});

const outputFile = path.join(__dirname, 'analytics-perk-effectiveness.md');
fs.writeFileSync(outputFile, md, 'utf8');

console.log(`\nАналитика эффективности перков создана: analytics-perk-effectiveness.md`);
console.log(`Обработано турниров: ${totalTournaments}`);
console.log(`Уникальных перков: ${perkEffectiveness.length}`);

console.log('\n=== Рейтинг перков по винрейту ===');
perkEffectiveness.forEach((stat, index) => {
    console.log(`${index + 1}. ${stat.name} (${stat.fullName}): ${stat.winrate.toFixed(2)}% винрейт (${stat.totalWins}/${stat.totalFights}), ${stat.totalPoints} очков`);
});

console.log('\n=== Рейтинг перков по среднему винрейту комбинаций ===');
const sortedByAvgWinrate = [...perkEffectiveness].sort((a, b) => 
    b.avgWinrateAcrossCombinations - a.avgWinrateAcrossCombinations
);
sortedByAvgWinrate.forEach((stat, index) => {
    console.log(`${index + 1}. ${stat.name}: ${stat.avgWinrateAcrossCombinations.toFixed(2)}% средний винрейт`);
});
