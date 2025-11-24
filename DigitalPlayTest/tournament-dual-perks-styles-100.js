// Симулятор турнира FreeFighter с комбинациями перков и боевыми стилями
// Проводит круговые турниры между 135 бойцами с уникальными комбинациями из 2 перков и 1 боевого стиля
// (45 комбинаций перков × 3 боевых стиля = 135 участников)

// Константы игры
const TIE_ROUND_HP = 2;
const ACTIONS_PER_PHASE = 3;

// Вероятности критического удара по умолчанию
const DEFAULT_CRIT_CHANCE = {
    high: 0.10,  // 10% в голову
    mid: 0.05,   // 5% в тело
    low: 0.05    // 5% в ноги
};

// Класс боевого стиля
class FightingStyle {
    constructor(id, name, description, advantages, disadvantages) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.advantages = advantages;
        this.disadvantages = disadvantages;
    }

    // Применяет эффект стиля к бойцу
    apply(fighter) {
        if (!fighter) {
            return;
        }

        if (this.id === 'boxing') {
            // Boxing: прибавляем базовое значение к вероятности крита в тело и голову
            fighter.critChance.mid += DEFAULT_CRIT_CHANCE.mid; // 5% -> 10%
            fighter.critChance.high += DEFAULT_CRIT_CHANCE.high; // 10% -> 20%
        } else if (this.id === 'muay_thai') {
            // Muay Thai: прибавляем тройное базовое значение к вероятности крита в ноги
            fighter.critChance.low += DEFAULT_CRIT_CHANCE.low * 2; // 5% -> 15% (тройной бонус: +10%)
        }
    }

    // Обрабатывает получение урона (для защитных эффектов стиля)
    handleIncomingCrit(action, isCritical) {
        if (this.id === 'muay_thai' && action === 'low' && isCritical) {
            // Muay Thai: 50% шанс превратить пропущенный крит в ноги в обычный удар
            if (Math.random() < 0.5) {
                return false; // Превращаем крит в обычный удар
            }
        }
        return isCritical; // Возвращаем исходное значение
    }
}

// Определение всех боевых стилей
const FIGHTING_STYLES = {
    BOXING: new FightingStyle(
        'boxing',
        'Boxing',
        'Классический бокс',
        ['Удвоенная вероятность крита в тело (+5%)', 'Удвоенная вероятность крита в голову (+10%)'],
        ['Не может провести серию из 2+ атак в ноги']
    ),
    MUAY_THAI: new FightingStyle(
        'muay_thai',
        'Muay Thai',
        'Тайский бокс',
        ['Утроенная вероятность крита в ноги (+10%)', '50% шанс превратить пропущенный крит в ноги в обычный удар'],
        []
    ),
    KICKBOXING: new FightingStyle(
        'kickboxing',
        'Kickboxing',
        'Кикбоксинг',
        ['Каждый успешный удар повышает шанс крита на 10% для всех зон'],
        ['Не может провести серию из 3 атак в ноги (максимум 2)']
    )
};

const ALL_FIGHTING_STYLES = [FIGHTING_STYLES.BOXING, FIGHTING_STYLES.MUAY_THAI, FIGHTING_STYLES.KICKBOXING];

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

// Класс бойца с поддержкой двух перков и боевого стиля
class Fighter {
    constructor(name, perks, fightingStyle) {
        this.name = name;
        this.perks = perks; // Массив из 2 перков
        this.fightingStyle = fightingStyle; // Боевой стиль
        this.maxHp = 12;
        this.hp = 12;
        this.damage = 1;
        this.defense = 0;
        this.critChance = { ...DEFAULT_CRIT_CHANCE };
        this.critBonus = 0; // Бонус крита для Kickboxing
        this.wins = 0;
        this.losses = 0;
        this.draws = 0;
        this.points = 0; // Победа = 3, Ничья = 1, Поражение = 0
        
        // Применяем боевой стиль и перки
        this.applyFightingStyle();
        this.applyPerks();
    }

    // Проверяет, есть ли у бойца перк с указанным id
    hasPerk(perkId) {
        return this.perks.some(perk => perk.id === perkId);
    }

    applyFightingStyle() {
        if (this.fightingStyle) {
            this.fightingStyle.apply(this);
        }
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
        this.critBonus = 0; // Сбрасываем бонус крита
        
        // Применяем боевой стиль и перки
        this.applyFightingStyle();
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
        // Проверяем вероятность критического удара для данной зоны
        let chance = this.critChance[action] || 0;
        
        // Для кикбоксинга добавляем накопленный бонус ко всем зонам
        if (this.fightingStyle && this.fightingStyle.id === 'kickboxing') {
            chance += this.critBonus;
        }
        
        return Math.random() < chance;
    }

    // Увеличивает бонус крита для кикбоксинга при успешном ударе
    increaseCritBonus() {
        if (this.fightingStyle && this.fightingStyle.id === 'kickboxing') {
            this.critBonus += 0.10; // Увеличиваем на 10%
        }
    }

    // Сбрасывает бонус крита для кикбоксинга
    resetCritBonus() {
        if (this.fightingStyle && this.fightingStyle.id === 'kickboxing') {
            this.critBonus = 0;
        }
    }

    generateRandomSequence() {
        const actions = ['high', 'mid', 'low'];
        const sequence = [];
        
        for (let i = 0; i < ACTIONS_PER_PHASE; i++) {
            let availableActions = [...actions];
            
            // Применяем ограничения боевых стилей
            if (this.fightingStyle) {
                if (this.fightingStyle.id === 'boxing') {
                    // Boxing: не может провести серию из 2+ атак в ноги
                    // Если уже выбрана атака в ноги, исключаем её из доступных
                    if (sequence.includes('low')) {
                        availableActions = availableActions.filter(a => a !== 'low');
                    }
                } else if (this.fightingStyle.id === 'kickboxing') {
                    // Kickboxing: не может провести серию из 3 атак в ноги (максимум 2)
                    const lowCount = sequence.filter(a => a === 'low').length;
                    if (lowCount >= 2) {
                        availableActions = availableActions.filter(a => a !== 'low');
                    }
                }
            }
            
            // Выбираем случайное действие из доступных
            const randomIndex = Math.floor(Math.random() * availableActions.length);
            sequence.push(availableActions[randomIndex]);
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
                    // Попадание (успешный удар) - сбрасываем счетчик последовательных блоков
                    // Бонус крита для Kickboxing накапливается только при успешных ударах, не при блоках
                    consecutiveBlocks1 = 0;
                    let damage = defender.calculateDamage(attacker.damage);
                    
                    // Проверяем критический удар с текущим бонусом (если есть)
                    let isCritical = attacker.checkCriticalHit(attackAction);
                    
                    // Проверяем защиту Muay Thai от критов в ноги
                    if (isCritical && attackAction === 'low' && defender.fightingStyle) {
                        isCritical = defender.fightingStyle.handleIncomingCrit(attackAction, isCritical);
                    }
                    
                    if (isCritical) {
                        // Сбрасываем бонус крита для Kickboxing после крита
                        attacker.resetCritBonus();
                        
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
                    } else {
                        // Крита не было - увеличиваем бонус крита для Kickboxing
                        // Бонус накапливается только при успешных ударах без крита
                        attacker.increaseCritBonus();
                    }
                    
                    defender.takeDamage(damage);
                } else {
                    // Блок - бонус крита для Kickboxing НЕ накапливается при блоках
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
                    // Попадание (успешный удар) - сбрасываем счетчик последовательных блоков
                    // Бонус крита для Kickboxing накапливается только при успешных ударах, не при блоках
                    consecutiveBlocks2 = 0;
                    let damage = defender.calculateDamage(attacker.damage);
                    
                    // Проверяем критический удар с текущим бонусом (если есть)
                    let isCritical = attacker.checkCriticalHit(attackAction);
                    
                    // Проверяем защиту Muay Thai от критов в ноги
                    if (isCritical && attackAction === 'low' && defender.fightingStyle) {
                        isCritical = defender.fightingStyle.handleIncomingCrit(attackAction, isCritical);
                    }
                    
                    if (isCritical) {
                        // Сбрасываем бонус крита для Kickboxing после крита
                        attacker.resetCritBonus();
                        
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
                    } else {
                        // Крита не было - увеличиваем бонус крита для Kickboxing
                        // Бонус накапливается только при успешных ударах без крита
                        attacker.increaseCritBonus();
                    }
                    
                    defender.takeDamage(damage);
                } else {
                    // Блок - бонус крита для Kickboxing НЕ накапливается при блоках
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

            // Сбрасываем бонус крита для Kickboxing после окончания раунда
            this.fighter1.resetCritBonus();
            this.fighter2.resetCritBonus();

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
                    // Попадание (успешный удар) - бонус крита для Kickboxing накапливается только при успешных ударах
                    let damage = defender.calculateDamage(attacker.damage);
                    
                    // Проверяем критический удар с текущим бонусом (если есть)
                    let isCritical = attacker.checkCriticalHit(attackAction);
                    
                    // Проверяем защиту Muay Thai от критов в ноги
                    if (isCritical && attackAction === 'low' && defender.fightingStyle) {
                        isCritical = defender.fightingStyle.handleIncomingCrit(attackAction, isCritical);
                    }
                    
                    if (isCritical) {
                        // Сбрасываем бонус крита для Kickboxing после крита
                        attacker.resetCritBonus();
                        
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
                    } else {
                        // Крита не было - увеличиваем бонус крита для Kickboxing
                        // Бонус накапливается только при успешных ударах без крита
                        attacker.increaseCritBonus();
                    }
                    
                    defender.takeDamage(damage);
                }
                // При блоке (attackAction === blockAction) бонус НЕ накапливается
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
                    // Попадание (успешный удар) - бонус крита для Kickboxing накапливается только при успешных ударах
                    let damage = defender.calculateDamage(attacker.damage);
                    
                    // Проверяем критический удар с текущим бонусом (если есть)
                    let isCritical = attacker.checkCriticalHit(attackAction);
                    
                    // Проверяем защиту Muay Thai от критов в ноги
                    if (isCritical && attackAction === 'low' && defender.fightingStyle) {
                        isCritical = defender.fightingStyle.handleIncomingCrit(attackAction, isCritical);
                    }
                    
                    if (isCritical) {
                        // Сбрасываем бонус крита для Kickboxing после крита
                        attacker.resetCritBonus();
                        
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
                    } else {
                        // Крита не было - увеличиваем бонус крита для Kickboxing
                        // Бонус накапливается только при успешных ударах без крита
                        attacker.increaseCritBonus();
                    }
                    
                    defender.takeDamage(damage);
                }
                // При блоке (attackAction === blockAction) бонус НЕ накапливается
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

            // Сбрасываем бонус крита для Kickboxing после окончания раунда
            this.fighter1.resetCritBonus();
            this.fighter2.resetCritBonus();

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
        
        // Создаем 135 бойцов: для каждой комбинации перков создаем 3 бойца (по одному на каждый стиль)
        for (let i = 0; i < combinations.length; i++) {
            const perks = combinations[i];
            const perkName = getCombinationName(perks);
            
            // Создаем бойца для каждого боевого стиля
            for (let j = 0; j < ALL_FIGHTING_STYLES.length; j++) {
                const fightingStyle = ALL_FIGHTING_STYLES[j];
                const name = `${fightingStyle.name} - ${perkName}`;
                this.fighters.push(new Fighter(name, perks, fightingStyle));
            }
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

// Статистика по каждой комбинации перков и стилей
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

// Проводим 100 турниров
const startTournament = 1;
const endTournament = 100;
const totalTournaments = endTournament - startTournament + 1;

console.log(`Начинаем проведение ${totalTournaments} турниров (${startTournament}-${endTournament})...`);
console.log(`Количество бойцов в каждом турнире: 135 (45 комбинаций перков × 3 боевых стиля)`);
console.log('Это может занять некоторое время...\n');

const startTime = Date.now();

for (let i = startTournament; i <= endTournament; i++) {
    if (i % 10 === 0 || i === 1) {
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
let md = `# Аналитика комбинаций перков и боевых стилей (${totalTournaments} турниров)\n\n`;
md += `## Итоговая статистика по комбинациям из 2 перков и 1 боевого стиля\n\n`;
md += `**Количество бойцов в каждом турнире:** 135 (45 комбинаций перков × 3 боевых стиля)\n\n`;
md += `**Количество боев на каждого бойца:** ${totalTournaments * 134} боев (круговая система: каждый с каждым)\n\n`;
md += `| Место | Комбинация (Стиль + Перки) | Победы | Ничьи | Поражения | Очки | Средние очки за турнир | Винрейт |\n`;
md += `|-------|----------------------------|--------|-------|-----------|------|------------------------|----------|\n`;

sortedStats.forEach((stat, index) => {
    const avgPoints = (stat.points / stat.tournaments).toFixed(2);
    const totalFights = stat.wins + stat.draws + stat.losses;
    const winrate = totalFights > 0 ? ((stat.wins / totalFights) * 100).toFixed(2) : '0.00';
    md += `| ${index + 1} | ${stat.name} | ${stat.wins} | ${stat.draws} | ${stat.losses} | ${stat.points} | ${avgPoints} | ${winrate}% |\n`;
});

// Сохраняем файл
const outputFile = path.join(__dirname, 'analytics-dual-perks-styles-100.md');
fs.writeFileSync(outputFile, md, 'utf8');

console.log(`\nАналитика создана: analytics-dual-perks-styles.md`);
console.log(`Обработано турниров: ${totalTournaments}`);
console.log(`Уникальных комбинаций: ${sortedStats.length}`);
console.log(`Боев на каждого бойца: ${totalTournaments * 134}`);

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

