// Симулятор турнира FreeFighter с комбинациями перков
// Проводит круговые турниры между 45 бойцами с уникальными комбинациями из 2 перков (10 перков, включая новый Equalizer)

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
    HEAD_HUNTER: new Perk(
        'head_hunter',
        'HeadHunter',
        'Удвоенная вероятность крита в голову',
        'Вероятность критического удара в голову удваивается',
        'high'
    ),
    BODY_HUNTER: new Perk(
        'body_hunter',
        'BodyHunter',
        'Удвоенная вероятность крита в тело',
        'Вероятность критического удара в тело удваивается',
        'mid'
    ),
    LEG_HUNTER: new Perk(
        'leg_hunter',
        'LegHunter',
        'Удвоенная вероятность крита в ноги',
        'Вероятность критического удара в ноги удваивается',
        'low'
    ),
    TIE_BREAKER: new Perk(
        'tie_breaker',
        'TieBreaker',
        'Дополнительное HP в дополнительных раундах',
        'В дополнительных раундах получаете 2 дополнительных HP (4 HP вместо 2)',
        null
    ),
    HP_BOOST: new Perk(
        'hp_boost',
        'HPBoost',
        'Дополнительное HP в начале боя',
        'В начале боя получаете 13 HP вместо 12',
        null
    ),
    CRIT_DEFLECTOR: new Perk(
        'crit_deflector',
        'CritDeflector',
        'Защита от критических ударов',
        'С шансом 50% превращает критический удар противника в обычный удар',
        null
    ),
    LUCKER: new Perk(
        'lucker',
        'Lucker?',
        'Усиление критических ударов',
        'С шансом 50% удваивает урон от крита (x4 вместо x2)',
        null
    ),
    BLOCK_MASTER: new Perk(
        'block_master',
        'BlockMaster',
        'Мастер защиты',
        'При успешном блокировании двух ударов подряд восстанавливает 1 HP',
        null
    ),
    FINISH_HIM: new Perk(
        'finish_him',
        'FinishHim',
        'Добивание',
        'Если у противника на конец раунда осталось 1 HP, уменьшает его HP на 1',
        null
    ),
    EQUALIZER: new Perk(
        'equalizer',
        'Equalizer',
        'Уравнитель',
        'Если на конец раунда у владельца перка количество HP на 4+ меньше чем у противника, противник лишается 2 HP',
        null
    )
};

const ALL_PERKS = [
    PERKS.HEAD_HUNTER,
    PERKS.BODY_HUNTER,
    PERKS.LEG_HUNTER,
    PERKS.TIE_BREAKER,
    PERKS.HP_BOOST,
    PERKS.CRIT_DEFLECTOR,
    PERKS.LUCKER,
    PERKS.BLOCK_MASTER,
    PERKS.FINISH_HIM,
    PERKS.EQUALIZER
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
    // Сортируем перки по имени для единообразия (порядок не важен)
    const sortedPerks = [...perks].sort((a, b) => a.name.localeCompare(b.name));
    return sortedPerks.map(p => p.name).join(' + ');
}

// Класс бойца с поддержкой двух перков
class Fighter {
    constructor(name, perks) {
        this.name = name;
        this.perks = perks; // Массив из 2 перков
        this.maxHp = 12;
        this.hp = 12;
        this.damage = 1;
        this.defense = 0;
        this.critChance = { ...DEFAULT_CRIT_CHANCE };
        this.wins = 0;
        this.losses = 0;
        this.draws = 0;
        this.points = 0; // Победа = 3, Ничья = 1, Поражение = 0
        
        // Применяем оба перка
        this.applyPerks();
    }

    // Проверяет, есть ли у бойца перк с указанным id
    hasPerk(perkId) {
        return this.perks.some(perk => perk.id === perkId);
    }

    applyPerks() {
        if (!this.perks || this.perks.length === 0) return;
        
        // Применяем HP_BOOST (если есть, добавляем +1 HP)
        const hasHPBoost = this.hasPerk('hp_boost');
        if (hasHPBoost) {
            this.maxHp = 13;
            this.hp = 13;
        }
        
        // Применяем остальные перки (криты)
        this.perks.forEach(perk => {
            if (perk.id !== 'hp_boost') {
                perk.apply(this);
            }
        });
    }

    reset() {
        // Восстанавливаем HP в зависимости от перков
        const hasHPBoost = this.hasPerk('hp_boost');
        if (hasHPBoost) {
            this.maxHp = 13;
            this.hp = 13;
        } else {
            this.maxHp = 12;
            this.hp = 12;
        }
        
        // Восстанавливаем криты
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

// Класс боя
class Fight {
    constructor(fighter1, fighter2) {
        this.fighter1 = fighter1;
        this.fighter2 = fighter2;
    }

    simulate() {
        // Сбрасываем HP бойцов
        this.fighter1.reset();
        this.fighter2.reset();

        // Определяем, кто атакует первым (порядок не важен, так как раунд симметричен)
        let fighter1Attacking = true;
        let round = 1;
        const maxRounds = 100; // Защита от бесконечного цикла

        while (round <= maxRounds) {
            // РАУНД: выполняем обе фазы перед проверкой окончания боя
            // Фаза 1
            let attacker = fighter1Attacking ? this.fighter1 : this.fighter2;
            let defender = fighter1Attacking ? this.fighter2 : this.fighter1;

            // Генерируем случайные последовательности для фазы 1
            const attackSequence1 = attacker.generateRandomSequence();
            const blockSequence1 = defender.generateRandomSequence();

            // Выполняем фазу 1 (3 действия)
            let consecutiveBlocks1 = 0;
            for (let i = 0; i < ACTIONS_PER_PHASE; i++) {
                const attackAction = attackSequence1[i];
                const blockAction = blockSequence1[i];

                if (attackAction !== blockAction) {
                    // Попадание - сбрасываем счетчик последовательных блоков
                    consecutiveBlocks1 = 0;
                    let damage = defender.calculateDamage(attacker.damage);
                    
                    // Проверяем критический удар
                    const isCritical = attacker.checkCriticalHit(attackAction);
                    if (isCritical) {
                        // Проверяем CritDeflector у защищающегося
                        const hasCritDeflector = defender.hasPerk('crit_deflector');
                        if (hasCritDeflector && Math.random() < 0.5) {
                            // Крит заблокирован перком
                            damage = damage; // Остается обычный урон
                        } else {
                            // Крит прошел, проверяем Lucker у атакующего
                            const hasLucker = attacker.hasPerk('lucker');
                            if (hasLucker && Math.random() < 0.5) {
                                damage *= 4; // Учетверенный урон
                            } else {
                                damage *= 2; // Удвоенный урон
                            }
                        }
                    }
                    
                    defender.takeDamage(damage);
                } else {
                    // Блок
                    consecutiveBlocks1++;
                    // Проверяем перк BlockMaster при двух блоках подряд
                    if (consecutiveBlocks1 === 2) {
                        const hasBlockMaster = defender.hasPerk('block_master');
                        if (hasBlockMaster) {
                            defender.hp = Math.min(defender.maxHp, defender.hp + 1);
                        }
                    }
                }
            }

            // Фаза 2: меняем роли (даже если кто-то достиг 0 HP, вторая фаза все равно выполняется)
            fighter1Attacking = !fighter1Attacking;
            attacker = fighter1Attacking ? this.fighter1 : this.fighter2;
            defender = fighter1Attacking ? this.fighter2 : this.fighter1;

            // Генерируем случайные последовательности для фазы 2
            const attackSequence2 = attacker.generateRandomSequence();
            const blockSequence2 = defender.generateRandomSequence();

            // Выполняем фазу 2 (3 действия)
            let consecutiveBlocks2 = 0;
            for (let i = 0; i < ACTIONS_PER_PHASE; i++) {
                const attackAction = attackSequence2[i];
                const blockAction = blockSequence2[i];

                if (attackAction !== blockAction) {
                    // Попадание - сбрасываем счетчик последовательных блоков
                    consecutiveBlocks2 = 0;
                    let damage = defender.calculateDamage(attacker.damage);
                    
                    // Проверяем критический удар
                    const isCritical = attacker.checkCriticalHit(attackAction);
                    if (isCritical) {
                        // Проверяем CritDeflector у защищающегося
                        const hasCritDeflector = defender.hasPerk('crit_deflector');
                        if (hasCritDeflector && Math.random() < 0.5) {
                            // Крит заблокирован перком
                            damage = damage; // Остается обычный урон
                        } else {
                            // Крит прошел, проверяем Lucker у атакующего
                            const hasLucker = attacker.hasPerk('lucker');
                            if (hasLucker && Math.random() < 0.5) {
                                damage *= 4; // Учетверенный урон
                            } else {
                                damage *= 2; // Удвоенный урон
                            }
                        }
                    }
                    
                    defender.takeDamage(damage);
                } else {
                    // Блок
                    consecutiveBlocks2++;
                    // Проверяем перк BlockMaster при двух блоках подряд
                    if (consecutiveBlocks2 === 2) {
                        const hasBlockMaster = defender.hasPerk('block_master');
                        if (hasBlockMaster) {
                            defender.hp = Math.min(defender.maxHp, defender.hp + 1);
                        }
                    }
                }
            }

            // Проверяем перк FinishHim в конце раунда (после обеих фаз)
            // Проверяем для Fighter1
            const hasFinishHim1 = this.fighter1.hasPerk('finish_him');
            if (hasFinishHim1 && this.fighter2.hp === 1) {
                this.fighter2.takeDamage(1);
            }
            // Проверяем для Fighter2
            const hasFinishHim2 = this.fighter2.hasPerk('finish_him');
            if (hasFinishHim2 && this.fighter1.hp === 1) {
                this.fighter1.takeDamage(1);
            }

            // Проверяем перк Equalizer в конце раунда (после FinishHim)
            // Проверяем для Fighter1
            const hasEqualizer1 = this.fighter1.hasPerk('equalizer');
            if (hasEqualizer1 && this.fighter2.hp - this.fighter1.hp >= 4) {
                this.fighter2.takeDamage(2);
            }
            // Проверяем для Fighter2
            const hasEqualizer2 = this.fighter2.hasPerk('equalizer');
            if (hasEqualizer2 && this.fighter1.hp - this.fighter2.hp >= 4) {
                this.fighter1.takeDamage(2);
            }

            // Проверяем окончание боя ТОЛЬКО после завершения обеих фаз раунда
            const fighter1Dead = this.fighter1.hp <= 0;
            const fighter2Dead = this.fighter2.hp <= 0;

            if (fighter1Dead && fighter2Dead) {
                // Ничья - начинаем дополнительный раунд
                return this.simulateTieRound();
            } else if (fighter1Dead) {
                // Fighter2 победил
                this.fighter2.wins++;
                this.fighter2.points += 3;
                this.fighter1.losses++;
                return { winner: this.fighter2, loser: this.fighter1, draw: false };
            } else if (fighter2Dead) {
                // Fighter1 победил
                this.fighter1.wins++;
                this.fighter1.points += 3;
                this.fighter2.losses++;
                return { winner: this.fighter1, loser: this.fighter2, draw: false };
            }

            // Переключаем для следующего раунда
            fighter1Attacking = !fighter1Attacking;
            round++;
        }

        // Если достигли максимального количества раундов в основном бое - начинаем дополнительный раунд
        return this.simulateTieRound();
    }

    simulateTieRound(tieRoundDepth = 0) {
        // Защита от бесконечной рекурсии
        const MAX_TIE_ROUNDS = 1000;
        if (tieRoundDepth >= MAX_TIE_ROUNDS) {
            // Если слишком много дополнительных раундов - фиксируем ничью
            this.fighter1.draws++;
            this.fighter1.points += 1;
            this.fighter2.draws++;
            this.fighter2.points += 1;
            return { winner: null, loser: null, draw: true };
        }
        
        // Определяем HP для дополнительного раунда
        // TieBreaker дает +2 HP (4 HP вместо 2)
        const fighter1HasTieBreaker = this.fighter1.hasPerk('tie_breaker');
        const fighter2HasTieBreaker = this.fighter2.hasPerk('tie_breaker');
        
        const fighter1TieHP = fighter1HasTieBreaker ? TIE_ROUND_HP + 2 : TIE_ROUND_HP;
        const fighter2TieHP = fighter2HasTieBreaker ? TIE_ROUND_HP + 2 : TIE_ROUND_HP;

        this.fighter1.hp = fighter1TieHP;
        this.fighter1.maxHp = fighter1TieHP;
        this.fighter2.hp = fighter2TieHP;
        this.fighter2.maxHp = fighter2TieHP;

        // Определяем, кто атакует первым
        let fighter1Attacking = true;
        const maxRounds = 50;

        for (let round = 1; round <= maxRounds; round++) {
            // РАУНД: выполняем обе фазы перед проверкой окончания боя
            // Фаза 1
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

            // Фаза 2: меняем роли
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

            // FinishHim не активируется в дополнительных раундах

            // Проверяем перк Equalizer в конце раунда (после обеих фаз)
            // Проверяем для Fighter1
            const hasEqualizer1 = this.fighter1.hasPerk('equalizer');
            if (hasEqualizer1 && this.fighter2.hp - this.fighter1.hp >= 4) {
                this.fighter2.takeDamage(2);
            }
            // Проверяем для Fighter2
            const hasEqualizer2 = this.fighter2.hasPerk('equalizer');
            if (hasEqualizer2 && this.fighter1.hp - this.fighter2.hp >= 4) {
                this.fighter1.takeDamage(2);
            }

            // Проверяем окончание боя ТОЛЬКО после завершения обеих фаз раунда
            const fighter1Dead = this.fighter1.hp <= 0;
            const fighter2Dead = this.fighter2.hp <= 0;

            if (fighter1Dead && fighter2Dead) {
                // Ничья в дополнительном раунде - начинаем новый дополнительный раунд
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

        // Если достигли максимального количества раундов в дополнительном раунде - начинаем новый дополнительный раунд
        return this.simulateTieRound(tieRoundDepth + 1);
    }
}

// Класс турнира
class Tournament {
    constructor(tournamentNumber) {
        this.tournamentNumber = tournamentNumber;
        this.fighters = [];
        this.fights = [];
        
        // Генерируем все комбинации перков
        const combinations = generatePerkCombinations();
        
        // Создаем 36 бойцов с уникальными комбинациями перков
        for (let i = 0; i < combinations.length; i++) {
            const perks = combinations[i];
            const name = getCombinationName(perks);
            this.fighters.push(new Fighter(name, perks));
        }
    }

    run() {
        // Круговая система: каждый с каждым
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

        // Сортируем бойцов по очкам (победы, ничьи, поражения)
        this.fighters.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.wins !== a.wins) return b.wins - a.wins;
            if (a.losses !== b.losses) return a.losses - b.losses;
            return b.draws - a.draws;
        });
    }
}

// Массовый запуск турниров с агрегацией результатов
const fs = require('fs');
const path = require('path');

// Статистика по каждой комбинации перков
const globalStats = {};

// Функция для обновления глобальной статистики
function updateGlobalStats(tournament) {
    tournament.fighters.forEach(fighter => {
        const combinationName = fighter.name;
        
        if (!globalStats[combinationName]) {
            globalStats[combinationName] = {
                name: combinationName,
                wins: 0,
                draws: 0,
                losses: 0,
                points: 0,
                tournaments: 0
            };
        }
        
        globalStats[combinationName].wins += fighter.wins;
        globalStats[combinationName].draws += fighter.draws;
        globalStats[combinationName].losses += fighter.losses;
        globalStats[combinationName].points += fighter.points;
        globalStats[combinationName].tournaments++;
    });
}

// Проводим 1000 турниров
const startTournament = 1;
const endTournament = 1000;
const totalTournaments = endTournament - startTournament + 1;

console.log(`Начинаем проведение ${totalTournaments} турниров (${startTournament}-${endTournament})...`);
console.log(`Количество бойцов в каждом турнире: 45 (все возможные комбинации из 10 перков по 2)`);
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
let md = `# Аналитика комбинаций перков с обновленным перком Equalizer v2 (${totalTournaments} турниров)\n\n`;
md += `## Итоговая статистика по комбинациям из 2 перков\n\n`;
md += `**Новый перк:** Equalizer - Если на конец раунда у владельца перка количество HP на 4+ меньше чем у противника, противник лишается 2 HP\n\n`;
md += `**Количество бойцов в каждом турнире:** 45 (все возможные комбинации из 10 перков по 2)\n\n`;
md += `**Количество боев на каждого бойца:** ${totalTournaments * 44} боев (круговая система: каждый с каждым)\n\n`;
md += `| Место | Комбинация перков | Победы | Ничьи | Поражения | Очки | Средние очки за турнир | Винрейт |\n`;
md += `|-------|-------------------|--------|-------|-----------|------|------------------------|----------|\n`;

sortedStats.forEach((stat, index) => {
    const avgPoints = (stat.points / stat.tournaments).toFixed(2);
    const totalFights = stat.wins + stat.draws + stat.losses;
    const winrate = totalFights > 0 ? ((stat.wins / totalFights) * 100).toFixed(2) : '0.00';
    md += `| ${index + 1} | ${stat.name} | ${stat.wins} | ${stat.draws} | ${stat.losses} | ${stat.points} | ${avgPoints} | ${winrate}% |\n`;
});

// Сохраняем файл
const outputFile = path.join(__dirname, 'analytics-dual-perks-equalizer-v2.md');
fs.writeFileSync(outputFile, md, 'utf8');

console.log(`\nАналитика создана: analytics-dual-perks-equalizer-v2.md`);
console.log(`Обработано турниров: ${totalTournaments}`);
console.log(`Уникальных комбинаций: ${sortedStats.length}`);
console.log(`Боев на каждого бойца: ${totalTournaments * 44}`);

// Выводим краткую статистику
console.log('\n=== Топ-10 комбинаций по винрейту ===');
sortedStats.slice(0, 10).forEach((stat, index) => {
    const totalFights = stat.wins + stat.draws + stat.losses;
    const winrate = totalFights > 0 ? ((stat.wins / totalFights) * 100).toFixed(2) : '0.00';
    console.log(`${index + 1}. ${stat.name}: ${winrate}% винрейт (${stat.wins}/${totalFights}), ${stat.points} очков`);
});

console.log('\n=== Топ-10 комбинаций по очкам ===');
sortedStats.slice(0, 10).forEach((stat, index) => {
    const avgPoints = (stat.points / stat.tournaments).toFixed(2);
    console.log(`${index + 1}. ${stat.name}: ${stat.points} очков (${avgPoints} за турнир)`);
});

