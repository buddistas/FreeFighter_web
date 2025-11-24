// Константы игры
const TIE_ROUND_HP = 2;
const ACTIONS_PER_PHASE = 3;
const DELAY_BETWEEN_ACTIONS = 1000; // 1 секунда
const DELAY_BETWEEN_PHASES = 2000; // 2 секунды

// Вероятности критического удара по умолчанию
const DEFAULT_CRIT_CHANCE = {
    high: 0.10,  // 10% в голову
    mid: 0.05,   // 5% в тело
    low: 0.05    // 5% в ноги
};

// Характеры оппонента
const OPPONENT_PERSONALITY = {
    RANDOM: 'random',
    PERSISTENT: 'persistent',
    ADAPTIVE: 'adaptive'
};

const PERSONALITY_NAMES = {
    [OPPONENT_PERSONALITY.RANDOM]: 'Рандомный',
    [OPPONENT_PERSONALITY.PERSISTENT]: 'Упорный',
    [OPPONENT_PERSONALITY.ADAPTIVE]: 'Адаптивный'
};

// Класс боевого стиля
class FightingStyle {
    constructor(id, name, description, advantages, disadvantages) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.advantages = advantages; // Массив преимуществ
        this.disadvantages = disadvantages; // Массив недостатков
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

    // Проверяет, может ли боец выбрать действие (для ограничений стиля)
    canSelectAction(action, selectedActions, isAttacking) {
        if (this.id === 'boxing' && isAttacking) {
            // Boxing: не может провести серию из 2+ атак в ноги
            // Если уже выбрана атака в ноги, блокируем повторный выбор
            if (action === 'low' && selectedActions.includes('low')) {
                return false;
            }
        } else if (this.id === 'kickboxing' && isAttacking) {
            // Kickboxing: не может провести серию из 3 атак в ноги (максимум 2)
            // Считаем количество уже выбранных ударов в ноги
            const lowCount = selectedActions.filter(a => a === 'low').length;
            if (action === 'low' && lowCount >= 2) {
                return false; // Уже выбрано 2 удара в ноги, блокируем третий
            }
        }
        return true;
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
        this.name = name; // Короткое название для отображения в игре
        this.fullName = fullName; // Полное название для экрана выбора
        this.description = description; // Описание эффекта
        this.targetZone = targetZone; // Зона, на которую влияет перк ('high', 'mid', 'low')
    }

    // Применяет эффект перка к бойцу
    apply(fighter) {
        if (!fighter || !this.targetZone) {
            return;
        }
        
        // Прибавляем базовое значение к вероятности крита для выбранной зоны
        fighter.critChance[this.targetZone] += DEFAULT_CRIT_CHANCE[this.targetZone];
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
        'В дополнительных раундах получаете 4 HP вместо 2',
        null // Этот перк не влияет на криты, а на HP в дополнительных раундах
    ),
    HP_BOOST: new Perk(
        'hp_boost',
        'HPBoost',
        'Дополнительное HP в начале боя',
        'В начале боя получаете 13 HP вместо 12',
        null // Этот перк не влияет на криты, а на начальное HP
    ),
    CRIT_DEFLECTOR: new Perk(
        'crit_deflector',
        'CritDeflector',
        'Защита от критических ударов',
        'С шансом 50% превращает критический удар противника в обычный удар',
        null // Этот перк работает при получении урона, а не при атаке
    ),
    LUCKER: new Perk(
        'lucker',
        'Lucker?',
        'Усиление критических ударов',
        'С шансом 50% удваивает урон от крита',
        null // Этот перк работает при атаке, а не на конкретную зону
    ),
    BLOCK_MASTER: new Perk(
        'block_master',
        'BlockMaster',
        'Мастер защиты',
        'При успешном блокировании двух ударов подряд восстанавливает 1 HP',
        null // Этот перк работает при защите, а не на конкретную зону
    ),
    FINISH_HIM: new Perk(
        'finish_him',
        'FinishHim',
        'Добивание',
        'Если у противника на конец раунда осталось 1 HP, уменьшает его HP на 1',
        null // Этот перк работает в конце раунда, не в дополнительных раундах
    ),
    EQUALIZER: new Perk(
        'equalizer',
        'Equalizer',
        'Уравнитель',
        'Если на конец раунда у владельца перка количество HP на 4+ меньше чем у противника, противник лишается 2 HP',
        null // Этот перк работает в конце раунда
    )
};

const ALL_PERKS = [PERKS.HEAD_HUNTER, PERKS.BODY_HUNTER, PERKS.LEG_HUNTER, PERKS.TIE_BREAKER, PERKS.HP_BOOST, PERKS.CRIT_DEFLECTOR, PERKS.LUCKER, PERKS.BLOCK_MASTER, PERKS.FINISH_HIM, PERKS.EQUALIZER];
const ENEMY_PERKS_COUNT = 2; // Количество случайных перков для противника
const PLAYER_PERKS_COUNT = 2; // Количество перков для игрока
const PERKS_PER_SELECTION = 3; // Количество перков на выбор в каждом окне

// Пути к изображениям
const IMAGE_PATHS = {
    attack: {
        high: 'pics/hikick.jpg',
        mid: 'pics/midkick.jpg',
        low: 'pics/lowkick.jpg'
    },
    block: {
        high: 'pics/block_hi.png',
        mid: 'pics/block_mid.png',
        low: 'pics/block_low.png'
    }
};

// Класс бойца
class Fighter {
    constructor(name, isPlayer = false, maxHp = 12, damage = 1, defense = 0) {
        this.name = name;
        this.maxHp = maxHp;
        this.hp = maxHp;
        this.damage = damage;
        this.defense = defense;
        this.isPlayer = isPlayer;
        this.attackSequence = [];
        this.blockSequence = [];
        // Вероятности критического удара по зонам
        this.critChance = { ...DEFAULT_CRIT_CHANCE };
        // Активные перки (массив)
        this.activePerks = [];
        // Боевой стиль
        this.fightingStyle = null;
        // Бонус крита для кикбоксинга (накапливается при успешных ударах)
        this.critBonus = 0;
    }

    setAttackSequence(sequence) {
        this.attackSequence = sequence;
    }

    setBlockSequence(sequence) {
        this.blockSequence = sequence;
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
    }

    calculateDamage(attackerDamage) {
        // Урон = урон атакующего - защита защищающегося
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

    reset(hp) {
        this.hp = hp;
        this.maxHp = hp;
        this.attackSequence = [];
        this.blockSequence = [];
        // Сбрасываем перки и вероятности критов
        this.activePerks = [];
        this.critChance = { ...DEFAULT_CRIT_CHANCE };
        // Сбрасываем бонус крита для кикбоксинга
        this.critBonus = 0;
        // Восстанавливаем эффект боевого стиля
        if (this.fightingStyle) {
            this.fightingStyle.apply(this);
        }
    }

    setFightingStyle(style) {
        this.fightingStyle = style;
        if (style) {
            style.apply(this);
        }
    }

    hasPerk(perkId) {
        return this.activePerks.some(perk => perk && perk.id === perkId);
    }

    applyPerk(perk) {
        if (!perk) {
            return; // Не применяем перк, если он null или undefined
        }
        
        // Проверяем, был ли уже добавлен этот перк
        const alreadyHasPerk = this.activePerks.some(p => p && p.id === perk.id);
        
        // Если перк уже был добавлен, не применяем его повторно
        if (alreadyHasPerk) {
            return;
        }
        
        // Добавляем перк в массив
        this.activePerks.push(perk);
        
        // Специальная обработка для HP_BOOST - увеличиваем HP
        if (perk.id === 'hp_boost') {
            this.maxHp += 1;
            this.hp += 1;
        } else {
            // Применяем стандартный эффект перка (для критов)
            perk.apply(this);
        }
    }

    applyPerks(perks) {
        // Применяем массив перков
        if (perks && Array.isArray(perks)) {
            perks.forEach(perk => this.applyPerk(perk));
        }
    }
}

// Класс для анализа паттернов поведения игрока
class PatternAnalyzer {
    constructor() {
        // Статистика атак игрока
        this.playerAttacks = [];
        // Статистика блоков игрока
        this.playerBlocks = [];
        // Последние последовательности атак (храним последние 5)
        this.attackSequences = [];
        // Последние последовательности блоков (храним последние 5)
        this.blockSequences = [];
        // Максимальное количество хранимых последовательностей
        this.maxSequences = 5;
        // Минимальное количество раундов для активации анализа
        this.minRoundsForAnalysis = 3;
    }

    // Записывает последовательность атак игрока
    recordAttackSequence(sequence) {
        this.playerAttacks.push(...sequence);
        this.attackSequences.push([...sequence]);
        // Ограничиваем количество хранимых последовательностей
        if (this.attackSequences.length > this.maxSequences) {
            this.attackSequences.shift();
        }
    }

    // Записывает последовательность блоков игрока
    recordBlockSequence(sequence) {
        this.playerBlocks.push(...sequence);
        this.blockSequences.push([...sequence]);
        // Ограничиваем количество хранимых последовательностей
        if (this.blockSequences.length > this.maxSequences) {
            this.blockSequences.shift();
        }
    }

    // Анализирует преобладание зоны в атаках
    analyzeAttackZonePreference() {
        if (this.playerAttacks.length === 0) {
            return null;
        }

        const zoneCounts = { high: 0, mid: 0, low: 0 };
        this.playerAttacks.forEach(zone => {
            zoneCounts[zone]++;
        });

        const total = this.playerAttacks.length;
        const percentages = {
            high: zoneCounts.high / total,
            mid: zoneCounts.mid / total,
            low: zoneCounts.low / total
        };

        // Ищем зону с преобладанием >50%
        for (const [zone, percentage] of Object.entries(percentages)) {
            if (percentage > 0.5) {
                return {
                    zone: zone,
                    percentage: percentage,
                    strength: percentage >= 0.7 ? 'strong' : 'weak'
                };
            }
        }

        return null;
    }

    // Анализирует преобладание зоны в блоках
    analyzeBlockZonePreference() {
        if (this.playerBlocks.length === 0) {
            return null;
        }

        const zoneCounts = { high: 0, mid: 0, low: 0 };
        this.playerBlocks.forEach(zone => {
            zoneCounts[zone]++;
        });

        const total = this.playerBlocks.length;
        const percentages = {
            high: zoneCounts.high / total,
            mid: zoneCounts.mid / total,
            low: zoneCounts.low / total
        };

        // Ищем зону с преобладанием >50%
        for (const [zone, percentage] of Object.entries(percentages)) {
            if (percentage > 0.5) {
                return {
                    zone: zone,
                    percentage: percentage,
                    strength: percentage >= 0.7 ? 'strong' : 'weak'
                };
            }
        }

        return null;
    }

    // Анализирует повторяющиеся последовательности атак
    analyzeRepeatingAttackSequence() {
        if (this.attackSequences.length < 2) {
            return null;
        }

        // Ищем последнюю последовательность в истории
        const lastSequence = this.attackSequences[this.attackSequences.length - 1];
        
        // Проверяем, сколько раз эта последовательность встречалась в последних последовательностях
        let matchCount = 0;
        for (let i = 0; i < this.attackSequences.length - 1; i++) {
            if (this.sequencesEqual(this.attackSequences[i], lastSequence)) {
                matchCount++;
            }
        }

        // Если последовательность повторяется 2+ раза, считаем это паттерном
        if (matchCount >= 2) {
            return {
                sequence: lastSequence,
                repeatCount: matchCount + 1, // +1 для последней последовательности
                strength: matchCount >= 3 ? 'strong' : 'weak'
            };
        }

        return null;
    }

    // Анализирует повторяющиеся последовательности блоков
    analyzeRepeatingBlockSequence() {
        if (this.blockSequences.length < 2) {
            return null;
        }

        // Ищем последнюю последовательность в истории
        const lastSequence = this.blockSequences[this.blockSequences.length - 1];
        
        // Проверяем, сколько раз эта последовательность встречалась в последних последовательностях
        let matchCount = 0;
        for (let i = 0; i < this.blockSequences.length - 1; i++) {
            if (this.sequencesEqual(this.blockSequences[i], lastSequence)) {
                matchCount++;
            }
        }

        // Если последовательность повторяется 2+ раза, считаем это паттерном
        if (matchCount >= 2) {
            return {
                sequence: lastSequence,
                repeatCount: matchCount + 1, // +1 для последней последовательности
                strength: matchCount >= 3 ? 'strong' : 'weak'
            };
        }

        return null;
    }

    // Проверяет равенство двух последовательностей
    sequencesEqual(seq1, seq2) {
        if (seq1.length !== seq2.length) {
            return false;
        }
        for (let i = 0; i < seq1.length; i++) {
            if (seq1[i] !== seq2[i]) {
                return false;
            }
        }
        return true;
    }

    // Проверяет, достаточно ли данных для анализа
    hasEnoughData() {
        const totalRounds = Math.max(
            this.attackSequences.length,
            this.blockSequences.length
        );
        return totalRounds >= this.minRoundsForAnalysis;
    }

    // Сбрасывает всю статистику
    reset() {
        this.playerAttacks = [];
        this.playerBlocks = [];
        this.attackSequences = [];
        this.blockSequences = [];
    }
}

// Класс игры
class Game {
    constructor() {
        this.player = new Fighter('Игрок', true);
        this.enemy = new Fighter('Противник', false);
        this.currentPhase = 'personality-selection'; // personality-selection, fighting-style-selection, perk-ban, perk-selection, selection, playing, finished
        this.roundNumber = 1;
        this.isPlayerAttacking = true; // В первом раунде игрок атакует первым
        this.selectedActions = [];
        this.actionResults = []; // Результаты действий для отображения на пиктограммах
        this.isTieRound = false;
        this.opponentPersonality = null; // Характер оппонента
        this.playerFightingStyle = null; // Выбранный боевой стиль игрока
        this.enemyFightingStyle = null; // Случайный боевой стиль противника
        this.playerPerks = []; // Выбранные перки игрока (массив)
        this.enemyPerks = []; // Перки противника (массив)
        this.playerPerkSelectionStep = 0; // Шаг выбора перка игрока (0 - первый выбор, 1 - второй выбор)
        this.bannedPerk = null; // Забаненный перк (исключается из доступных)
        this.patternAnalyzer = new PatternAnalyzer(); // Анализатор паттернов для адаптивного AI
        
        this.initializeUI();
    }

    initializeUI() {
        // Кнопки выбора
        this.btnHigh = document.getElementById('btn-high');
        this.btnMid = document.getElementById('btn-mid');
        this.btnLow = document.getElementById('btn-low');
        
        // Элементы UI
        this.phaseLabel = document.getElementById('phase-label');
        this.selectedList = document.getElementById('selected-list');
        this.draftIconsContainer = document.getElementById('draft-icons-container');
        this.controlsContainer = document.getElementById('controls-container');
        this.restartContainer = document.getElementById('restart-container');
        this.restartBtn = document.getElementById('restart-btn');
        this.gameResult = document.getElementById('game-result');
        this.fightersContainer = document.getElementById('fighters-container');
        
        // Экран выбора характера
        this.personalitySelectionContainer = document.getElementById('personality-selection-container');
        this.personalityRandomBtn = document.getElementById('personality-random-btn');
        this.personalityPersistentBtn = document.getElementById('personality-persistent-btn');
        this.personalityAdaptiveBtn = document.getElementById('personality-adaptive-btn');
        
        // Экран выбора боевого стиля
        this.fightingStyleSelectionContainer = document.getElementById('fighting-style-selection-container');
        this.fightingStyleBoxingBtn = document.getElementById('fighting-style-boxing-btn');
        this.fightingStyleMuayThaiBtn = document.getElementById('fighting-style-muay-thai-btn');
        this.fightingStyleKickboxingBtn = document.getElementById('fighting-style-kickboxing-btn');
        
        // Экран выбора перка
        this.perkSelectionContainer = document.getElementById('perk-selection-container');
        this.perkHeadHunterBtn = document.getElementById('perk-head-hunter-btn');
        this.perkBodyHunterBtn = document.getElementById('perk-body-hunter-btn');
        this.perkLegHunterBtn = document.getElementById('perk-leg-hunter-btn');
        this.perkTieBreakerBtn = document.getElementById('perk-tie-breaker-btn');
        this.perkHPBoostBtn = document.getElementById('perk-hp-boost-btn');
        this.perkCritDeflectorBtn = document.getElementById('perk-crit-deflector-btn');
        this.perkLuckerBtn = document.getElementById('perk-lucker-btn');
        this.perkBlockMasterBtn = document.getElementById('perk-block-master-btn');
        this.perkFinishHimBtn = document.getElementById('perk-finish-him-btn');
        this.perkEqualizerBtn = document.getElementById('perk-equalizer-btn');
        
        // Отображение активных перков
        this.playerPerkDisplay = document.getElementById('player-perk-display');
        this.enemyPerkDisplay = document.getElementById('enemy-perk-display');
        
        // Отображение боевого стиля
        this.playerFightingStyleDisplay = document.getElementById('player-fighting-style-display');
        this.enemyFightingStyleDisplay = document.getElementById('enemy-fighting-style-display');
        
        // Полоски здоровья
        this.playerHealthBar = document.getElementById('player-health-bar');
        this.playerHealthFill = document.getElementById('player-health-fill');
        this.playerHealthText = document.getElementById('player-health-text');
        this.enemyHealthBar = document.getElementById('enemy-health-bar');
        this.enemyHealthFill = document.getElementById('enemy-health-fill');
        this.enemyHealthText = document.getElementById('enemy-health-text');
        
        // Области отображения действий
        this.playerActionDisplay = document.getElementById('player-action-display');
        this.playerActionImage = document.getElementById('player-action-image');
        this.enemyActionDisplay = document.getElementById('enemy-action-display');
        this.enemyActionImage = document.getElementById('enemy-action-image');
        this.actionResultText = document.getElementById('action-result-text');
        this.actionResultDisplay = document.getElementById('action-result-display');
        
        // Метка противника (для отображения характера)
        this.enemyLabel = document.querySelector('.enemy-section .fighter-label');
        
        // Обработчики событий
        this.btnHigh.addEventListener('click', () => this.selectAction('high'));
        this.btnMid.addEventListener('click', () => this.selectAction('mid'));
        this.btnLow.addEventListener('click', () => this.selectAction('low'));
        this.restartBtn.addEventListener('click', () => this.restart());
        this.personalityRandomBtn.addEventListener('click', () => this.selectPersonality(OPPONENT_PERSONALITY.RANDOM));
        this.personalityPersistentBtn.addEventListener('click', () => this.selectPersonality(OPPONENT_PERSONALITY.PERSISTENT));
        this.personalityAdaptiveBtn.addEventListener('click', () => this.selectPersonality(OPPONENT_PERSONALITY.ADAPTIVE));
        
        // Обработчики выбора боевого стиля
        if (this.fightingStyleBoxingBtn) {
            this.fightingStyleBoxingBtn.addEventListener('click', () => this.selectFightingStyle(FIGHTING_STYLES.BOXING));
        }
        if (this.fightingStyleMuayThaiBtn) {
            this.fightingStyleMuayThaiBtn.addEventListener('click', () => this.selectFightingStyle(FIGHTING_STYLES.MUAY_THAI));
        }
        if (this.fightingStyleKickboxingBtn) {
            this.fightingStyleKickboxingBtn.addEventListener('click', () => this.selectFightingStyle(FIGHTING_STYLES.KICKBOXING));
        }
        
        // Обработчики выбора/бана перка (работают в зависимости от фазы)
        this.perkHeadHunterBtn.addEventListener('click', () => this.handlePerkButtonClick(PERKS.HEAD_HUNTER));
        this.perkBodyHunterBtn.addEventListener('click', () => this.handlePerkButtonClick(PERKS.BODY_HUNTER));
        this.perkLegHunterBtn.addEventListener('click', () => this.handlePerkButtonClick(PERKS.LEG_HUNTER));
        this.perkTieBreakerBtn.addEventListener('click', () => this.handlePerkButtonClick(PERKS.TIE_BREAKER));
        this.perkHPBoostBtn.addEventListener('click', () => this.handlePerkButtonClick(PERKS.HP_BOOST));
        this.perkCritDeflectorBtn.addEventListener('click', () => this.handlePerkButtonClick(PERKS.CRIT_DEFLECTOR));
        this.perkLuckerBtn.addEventListener('click', () => this.handlePerkButtonClick(PERKS.LUCKER));
        this.perkBlockMasterBtn.addEventListener('click', () => this.handlePerkButtonClick(PERKS.BLOCK_MASTER));
        this.perkFinishHimBtn.addEventListener('click', () => this.handlePerkButtonClick(PERKS.FINISH_HIM));
        this.perkEqualizerBtn.addEventListener('click', () => this.handlePerkButtonClick(PERKS.EQUALIZER));
        
        // Обработчик изменения размера окна для обновления засечек
        window.addEventListener('resize', () => {
            this.updateHealthBars();
        });
        
        // Инициализируем засечки на HP барах
        this.updateHealthBars();
        
        // Показываем экран выбора характера при старте
        this.showPersonalitySelection();
    }

    selectAction(action) {
        if (this.currentPhase !== 'selection' || this.selectedActions.length >= ACTIONS_PER_PHASE) {
            return;
        }

        // Проверяем ограничения боевого стиля (только в фазе атаки)
        if (this.isPlayerAttacking && this.player.fightingStyle) {
            if (!this.player.fightingStyle.canSelectAction(action, this.selectedActions, this.isPlayerAttacking)) {
                return; // Нельзя выбрать это действие
            }
        }

        this.selectedActions.push(action);
        this.updateSelectedActionsDisplay();
        
        // Обновляем состояние кнопок с учетом ограничений стиля
        this.updateActionButtonsState();
        
        if (this.selectedActions.length >= ACTIONS_PER_PHASE) {
            this.startPhase();
        }
    }

    updateActionButtonsState() {
        // Для Boxing: блокируем кнопку low, если уже выбрана атака в ноги (только в фазе атаки)
        if (this.isPlayerAttacking && this.player.fightingStyle && this.player.fightingStyle.id === 'boxing') {
            if (this.selectedActions.includes('low')) {
                this.btnLow.disabled = true;
            } else {
                this.btnLow.disabled = false;
            }
        } else if (this.isPlayerAttacking && this.player.fightingStyle && this.player.fightingStyle.id === 'kickboxing') {
            // Для Kickboxing: блокируем кнопку low, если уже выбрано 2 удара в ноги
            const lowCount = this.selectedActions.filter(a => a === 'low').length;
            if (lowCount >= 2) {
                this.btnLow.disabled = true;
            } else {
                this.btnLow.disabled = false;
            }
        } else {
            // В остальных случаях кнопки активны (если не достигнут лимит)
            if (this.selectedActions.length < ACTIONS_PER_PHASE) {
                [this.btnHigh, this.btnMid, this.btnLow].forEach(btn => {
                    btn.disabled = false;
                });
            }
        }
    }

    updateSelectedActionsDisplay() {
        this.draftIconsContainer.innerHTML = '';
        this.actionResults = []; // Сбрасываем результаты при новом выборе
        // Выбираем правильные изображения в зависимости от фазы
        const imageType = this.isPlayerAttacking ? 'attack' : 'block';
        this.selectedActions.forEach((action, index) => {
            const iconWrapper = document.createElement('div');
            iconWrapper.className = 'draft-icon-wrapper';
            
            const icon = document.createElement('img');
            icon.className = 'draft-icon';
            icon.src = IMAGE_PATHS[imageType][action];
            icon.alt = action;
            
            iconWrapper.appendChild(icon);
            this.draftIconsContainer.appendChild(iconWrapper);
            
            // Добавляем небольшую задержку для анимации появления
            setTimeout(() => {
                icon.style.animation = 'iconAppear 0.3s ease forwards';
            }, index * 100);
        });
    }
    
    updateDraftIconResult(index, success) {
        const iconWrappers = this.draftIconsContainer.querySelectorAll('.draft-icon-wrapper');
        if (iconWrappers[index]) {
            // Удаляем предыдущий индикатор, если есть
            const existingIndicator = iconWrappers[index].querySelector('.draft-result-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
            
            // Создаем новый индикатор
            const indicator = document.createElement('div');
            indicator.className = `draft-result-indicator ${success ? 'success' : 'failure'}`;
            indicator.textContent = success ? '✓' : '✗';
            iconWrappers[index].appendChild(indicator);
        }
    }

    startPhase() {
        this.currentPhase = 'playing';
        
        // Скрываем кнопки выбора и показываем область результатов
        this.controlsContainer.style.display = 'none';
        this.actionResultDisplay.classList.remove('hidden');
        
        // Отключаем кнопки
        [this.btnHigh, this.btnMid, this.btnLow].forEach(btn => {
            btn.disabled = true;
        });
        
        // Устанавливаем последовательности
        if (this.isPlayerAttacking) {
            this.player.setAttackSequence([...this.selectedActions]);
            // Записываем последовательность атак игрока для анализа
            if (this.opponentPersonality === OPPONENT_PERSONALITY.ADAPTIVE) {
                this.patternAnalyzer.recordAttackSequence([...this.selectedActions]);
            }
            this.enemy.setBlockSequence(this.generateEnemySequence());
        } else {
            this.player.setBlockSequence([...this.selectedActions]);
            // Записываем последовательность блоков игрока для анализа
            if (this.opponentPersonality === OPPONENT_PERSONALITY.ADAPTIVE) {
                this.patternAnalyzer.recordBlockSequence([...this.selectedActions]);
            }
            this.enemy.setAttackSequence(this.generateEnemySequence());
        }
        
        this.selectedActions = [];
        
        // Запускаем выполнение фаз
        this.executePhases();
    }

    generateEnemySequence() {
        let sequence;
        if (this.opponentPersonality === OPPONENT_PERSONALITY.PERSISTENT) {
            sequence = this.generatePersistentSequence();
        } else if (this.opponentPersonality === OPPONENT_PERSONALITY.ADAPTIVE) {
            sequence = this.generateAdaptiveSequence();
        } else {
            sequence = this.generateRandomSequence();
        }
        
        // Применяем ограничения боевого стиля противника
        return this.applyFightingStyleRestrictions(sequence);
    }

    applyFightingStyleRestrictions(sequence) {
        // Если противник атакует и имеет стиль Boxing, применяем ограничение
        const isEnemyAttacking = !this.isPlayerAttacking;
        if (isEnemyAttacking && this.enemy.fightingStyle && this.enemy.fightingStyle.id === 'boxing') {
            // Boxing: не может провести серию из 2+ атак в ноги
            const restrictedSequence = [];
            let hasLowAttack = false;
            
            for (const action of sequence) {
                if (action === 'low' && hasLowAttack) {
                    // Уже была атака в ноги, выбираем случайную другую зону
                    const otherZones = ['high', 'mid'];
                    restrictedSequence.push(otherZones[Math.floor(Math.random() * otherZones.length)]);
                } else {
                    restrictedSequence.push(action);
                    if (action === 'low') {
                        hasLowAttack = true;
                    }
                }
            }
            
            return restrictedSequence;
        } else if (isEnemyAttacking && this.enemy.fightingStyle && this.enemy.fightingStyle.id === 'kickboxing') {
            // Kickboxing: не может провести серию из 3 атак в ноги (максимум 2)
            const restrictedSequence = [];
            let lowCount = 0;
            
            for (const action of sequence) {
                if (action === 'low' && lowCount >= 2) {
                    // Уже выбрано 2 удара в ноги, выбираем случайную другую зону
                    const otherZones = ['high', 'mid'];
                    restrictedSequence.push(otherZones[Math.floor(Math.random() * otherZones.length)]);
                } else {
                    restrictedSequence.push(action);
                    if (action === 'low') {
                        lowCount++;
                    }
                }
            }
            
            return restrictedSequence;
        }
        
        return sequence;
    }

    generateRandomSequence() {
        const actions = ['high', 'mid', 'low'];
        const sequence = [];
        for (let i = 0; i < ACTIONS_PER_PHASE; i++) {
            sequence.push(actions[Math.floor(Math.random() * actions.length)]);
        }
        return sequence;
    }

    generatePersistentSequence() {
        const actions = ['high', 'mid', 'low'];
        const sequence = [];
        
        // Первое действие выбираем случайно
        let lastAction = actions[Math.floor(Math.random() * actions.length)];
        sequence.push(lastAction);
        
        // Для остальных двух действий с вероятностью 70% повторяем предыдущее
        for (let i = 1; i < ACTIONS_PER_PHASE; i++) {
            if (Math.random() < 0.7) {
                // 70% вероятность - повторяем предыдущее действие
                sequence.push(lastAction);
            } else {
                // 30% вероятность - выбираем случайное действие
                lastAction = actions[Math.floor(Math.random() * actions.length)];
                sequence.push(lastAction);
            }
        }
        
        return sequence;
    }

    generateAdaptiveSequence() {
        // Если недостаточно данных, используем случайную стратегию
        if (!this.patternAnalyzer.hasEnoughData()) {
            return this.generateRandomSequence();
        }

        const isAttacking = !this.isPlayerAttacking; // Если игрок защищается, противник атакует
        
        if (isAttacking) {
            // Противник атакует - анализируем блоки игрока
            return this.generateAdaptiveAttackSequence();
        } else {
            // Противник защищается - анализируем атаки игрока
            return this.generateAdaptiveBlockSequence();
        }
    }

    generateAdaptiveAttackSequence() {
        // Анализируем паттерны блоков игрока, чтобы атаковать в незащищенные зоны
        const blockPreference = this.patternAnalyzer.analyzeBlockZonePreference();
        const repeatingBlock = this.patternAnalyzer.analyzeRepeatingBlockSequence();
        
        // Приоритет: повторяющаяся последовательность > преобладание зоны
        if (repeatingBlock) {
            // Если игрок повторяет последовательность блоков, атакуем в другие зоны
            const sequence = this.generateCounterSequence(repeatingBlock.sequence, repeatingBlock.strength);
            return sequence;
        } else if (blockPreference) {
            // Если игрок часто защищает одну зону, атакуем другие зоны
            const sequence = this.generateCounterZoneSequence(blockPreference.zone, blockPreference.strength);
            return sequence;
        }
        
        // Если паттернов нет, используем случайную стратегию
        return this.generateRandomSequence();
    }

    generateAdaptiveBlockSequence() {
        // Анализируем паттерны атак игрока, чтобы блокировать их
        const attackPreference = this.patternAnalyzer.analyzeAttackZonePreference();
        const repeatingAttack = this.patternAnalyzer.analyzeRepeatingAttackSequence();
        
        // Приоритет: повторяющаяся последовательность > преобладание зоны
        if (repeatingAttack) {
            // Если игрок повторяет последовательность атак, блокируем её
            const sequence = this.generateMatchingSequence(repeatingAttack.sequence, repeatingAttack.strength);
            return sequence;
        } else if (attackPreference) {
            // Если игрок часто атакует одну зону, блокируем её
            const sequence = this.generateMatchingZoneSequence(attackPreference.zone, attackPreference.strength);
            return sequence;
        }
        
        // Если паттернов нет, используем случайную стратегию
        return this.generateRandomSequence();
    }

    // Генерирует последовательность, которая блокирует повторяющуюся последовательность игрока
    generateMatchingSequence(playerSequence, strength) {
        const sequence = [...playerSequence];
        
        // Сильный паттерн: 80% использовать паттерн, 20% случайность
        // Слабый паттерн: 60% использовать паттерн, 40% случайность
        const patternWeight = strength === 'strong' ? 0.8 : 0.6;
        
        // Применяем случайность к каждому действию
        for (let i = 0; i < sequence.length; i++) {
            if (Math.random() > patternWeight) {
                // Заменяем на случайную зону
                const actions = ['high', 'mid', 'low'];
                sequence[i] = actions[Math.floor(Math.random() * actions.length)];
            }
        }
        
        return sequence;
    }

    // Генерирует последовательность, которая блокирует преобладающую зону игрока
    generateMatchingZoneSequence(preferredZone, strength) {
        const sequence = [];
        const actions = ['high', 'mid', 'low'];
        
        // Сильный паттерн: 80% блокировать предпочитаемую зону, 20% случайность
        // Слабый паттерн: 60% блокировать предпочитаемую зону, 40% случайность
        const patternWeight = strength === 'strong' ? 0.8 : 0.6;
        
        for (let i = 0; i < ACTIONS_PER_PHASE; i++) {
            if (Math.random() < patternWeight) {
                sequence.push(preferredZone);
            } else {
                // Случайная зона
                sequence.push(actions[Math.floor(Math.random() * actions.length)]);
            }
        }
        
        return sequence;
    }

    // Генерирует последовательность, которая атакует в зоны, отличные от повторяющейся последовательности блоков игрока
    generateCounterSequence(playerBlockSequence, strength) {
        const sequence = [];
        const actions = ['high', 'mid', 'low'];
        
        // Сильный паттерн: 80% атаковать в другие зоны, 20% случайность
        // Слабый паттерн: 60% атаковать в другие зоны, 40% случайность
        const patternWeight = strength === 'strong' ? 0.8 : 0.6;
        
        for (let i = 0; i < ACTIONS_PER_PHASE; i++) {
            const playerBlock = playerBlockSequence[i];
            
            if (Math.random() < patternWeight) {
                // Атакуем в зоны, отличные от блока игрока
                const otherZones = actions.filter(zone => zone !== playerBlock);
                sequence.push(otherZones[Math.floor(Math.random() * otherZones.length)]);
            } else {
                // Случайная зона
                sequence.push(actions[Math.floor(Math.random() * actions.length)]);
            }
        }
        
        return sequence;
    }

    // Генерирует последовательность, которая атакует в зоны, отличные от предпочитаемой зоны блоков игрока
    generateCounterZoneSequence(preferredBlockZone, strength) {
        const sequence = [];
        const actions = ['high', 'mid', 'low'];
        const otherZones = actions.filter(zone => zone !== preferredBlockZone);
        
        // Сильный паттерн: 80% атаковать в другие зоны, 20% случайность
        // Слабый паттерн: 60% атаковать в другие зоны, 40% случайность
        const patternWeight = strength === 'strong' ? 0.8 : 0.6;
        
        for (let i = 0; i < ACTIONS_PER_PHASE; i++) {
            if (Math.random() < patternWeight) {
                // Атакуем в зоны, отличные от предпочитаемой зоны блоков
                sequence.push(otherZones[Math.floor(Math.random() * otherZones.length)]);
            } else {
                // Случайная зона
                sequence.push(actions[Math.floor(Math.random() * actions.length)]);
            }
        }
        
        return sequence;
    }

    async executePhases() {
        const playerActions = this.isPlayerAttacking ? 
            this.player.attackSequence : this.player.blockSequence;
        const enemyActions = this.isPlayerAttacking ? 
            this.enemy.blockSequence : this.enemy.attackSequence;
        
        // Отслеживаем последовательные блоки для проверки перка BlockMaster
        let playerConsecutiveBlocks = 0;
        let enemyConsecutiveBlocks = 0;
        
        // Выполняем все 3 действия в фазе
        for (let i = 0; i < ACTIONS_PER_PHASE; i++) {
            const playerAction = playerActions[i];
            const enemyAction = enemyActions[i];
            
            const result = await this.executeAction(playerAction, enemyAction, i);
            
            // Определяем успешность действия игрока и обновляем индикатор
            let playerSuccess = false;
            if (this.isPlayerAttacking) {
                // Игрок атакует - успех если попал (не заблокирован)
                playerSuccess = !result.enemyBlocked;
            } else {
                // Игрок защищается - успех если заблокировал
                playerSuccess = result.playerBlocked;
            }
            this.updateDraftIconResult(i, playerSuccess);
            
            // Отслеживаем последовательные блоки для BlockMaster
            if (this.isPlayerAttacking) {
                // Игрок атакует, противник защищается
                if (result.enemyBlocked) {
                    enemyConsecutiveBlocks++;
                    // Проверяем перк BlockMaster при двух блоках подряд
                    if (enemyConsecutiveBlocks === 2) {
                        const hasBlockMaster = this.enemy.hasPerk('block_master');
                        if (hasBlockMaster) {
                            const oldHp = this.enemy.hp;
                            this.enemy.hp = Math.min(this.enemy.maxHp, this.enemy.hp + 1);
                            if (this.enemy.hp > oldHp) {
                                this.showActionText('BlockMaster +1HP', 'hit');
                                this.updateHealthBars();
                                await this.delay(1500); // Показываем сообщение
                            }
                        }
                    }
                } else {
                    // Попадание - сбрасываем счетчик
                    enemyConsecutiveBlocks = 0;
                }
            } else {
                // Противник атакует, игрок защищается
                if (result.playerBlocked) {
                    playerConsecutiveBlocks++;
                    // Проверяем перк BlockMaster при двух блоках подряд
                    if (playerConsecutiveBlocks === 2) {
                        const hasBlockMaster = this.player.hasPerk('block_master');
                        if (hasBlockMaster) {
                            const oldHp = this.player.hp;
                            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
                            if (this.player.hp > oldHp) {
                                this.showActionText('BlockMaster +1HP', 'hit');
                                this.updateHealthBars();
                                await this.delay(1500); // Показываем сообщение
                            }
                        }
                    }
                } else {
                    // Попадание - сбрасываем счетчик
                    playerConsecutiveBlocks = 0;
                }
            }
            
            // Задержка между действиями (кроме последнего)
            if (i < ACTIONS_PER_PHASE - 1) {
                await this.delay(DELAY_BETWEEN_ACTIONS);
            }
        }
        
        // Задержка между фазами
        await this.delay(DELAY_BETWEEN_PHASES);
        
        // Переключаем фазы
        this.isPlayerAttacking = !this.isPlayerAttacking;
        
        // Проверяем окончание раунда (после второй фазы isPlayerAttacking становится true)
        if (this.isPlayerAttacking) {
            // Раунд завершен (обе фазы выполнены), проверяем перк FinishHim
            // FinishHim не работает в дополнительных раундах
            if (!this.isTieRound) {
                // Проверяем перк FinishHim для игрока
                const hasFinishHimPlayer = this.player.hasPerk('finish_him');
                if (hasFinishHimPlayer && this.enemy.hp === 1) {
                    this.enemy.takeDamage(1);
                    this.showActionText('FinishHim!', 'hit critical');
                    this.updateHealthBars();
                    await this.delay(1500);
                }
                // Проверяем перк FinishHim для противника
                const hasFinishHimEnemy = this.enemy.hasPerk('finish_him');
                if (hasFinishHimEnemy && this.player.hp === 1) {
                    this.player.takeDamage(1);
                    this.showActionText('FinishHim!', 'hit critical');
                    this.updateHealthBars();
                    await this.delay(1500);
                }
            }

            // Проверяем перк Equalizer (работает в обычных и дополнительных раундах)
            // Проверяем перк Equalizer для игрока
            const hasEqualizerPlayer = this.player.hasPerk('equalizer');
            if (hasEqualizerPlayer && this.enemy.hp - this.player.hp >= 4) {
                this.enemy.takeDamage(2);
                this.showActionText('Equalizer!', 'hit critical');
                this.updateHealthBars();
                await this.delay(1500);
            }
            // Проверяем перк Equalizer для противника
            const hasEqualizerEnemy = this.enemy.hasPerk('equalizer');
            if (hasEqualizerEnemy && this.player.hp - this.enemy.hp >= 4) {
                this.player.takeDamage(2);
                this.showActionText('Equalizer!', 'hit critical');
                this.updateHealthBars();
                await this.delay(1500);
            }
            // Проверяем условия победы
            this.checkGameEnd();
        } else {
            // Нужна вторая фаза раунда, запрашиваем выбор
            this.startNewRound();
        }
    }

    async executeAction(playerAction, enemyAction, index) {
        // Очищаем предыдущие действия
        this.clearActionDisplays();
        
        // Ждем завершения fade-out перед показом новых элементов
        await this.delay(400);
        
        let result = { playerBlocked: false, enemyBlocked: false };
        
        if (this.isPlayerAttacking) {
            // Игрок атакует, противник защищается
            this.showAction(this.playerActionImage, 'attack', playerAction);
            this.showAction(this.enemyActionImage, 'block', enemyAction);
            
            // Проверяем попадание
            if (playerAction !== enemyAction) {
                // Попадание! Урон = урон атакующего - защита защищающегося
                let damage = this.enemy.calculateDamage(this.player.damage);
                
                // Проверяем критический удар с текущим бонусом (если есть)
                let isCritical = this.player.checkCriticalHit(playerAction);
                
                // Проверяем эффект боевого стиля Muay Thai противника (только для критов в ноги)
                if (isCritical && playerAction === 'low' && this.enemy.fightingStyle && this.enemy.fightingStyle.id === 'muay_thai') {
                    isCritical = this.enemy.fightingStyle.handleIncomingCrit(playerAction, isCritical);
                    if (!isCritical) {
                        // Muay Thai противника превратил крит в обычный удар
                        this.showActionText('MUAY THAI DEFENSE!', 'hit critical');
                    }
                }
                
                if (isCritical) {
                    // Крит произошел - сбрасываем бонус крита для кикбоксинга
                    this.player.resetCritBonus();
                    
                    // Проверяем, есть ли у противника перк CritDeflector
                    const hasCritDeflector = this.enemy.hasPerk('crit_deflector');
                    if (hasCritDeflector && Math.random() < 0.5) {
                        // Перк сработал - крит превращается в обычный удар
                        this.showActionText('CRIT DEFLECTED!', 'hit critical');
                    } else {
                        // Крит прошел
                        // Проверяем перк Lucker у атакующего
                        const hasLucker = this.player.hasPerk('lucker');
                        if (hasLucker && Math.random() < 0.5) {
                            // Перк Lucker сработал - учетверяем урон
                            damage *= 4;
                            this.showActionText('LUCKY PUNCH!', 'hit critical');
                        } else {
                            // Обычный крит
                            damage *= 2; // Удваиваем урон при критическом ударе
                            this.showActionText('CRITICAL HIT!', 'hit critical');
                        }
                    }
                } else {
                    // Крита не было - увеличиваем бонус крита для кикбоксинга
                    // Бонус накапливается только при успешных ударах без крита
                    this.player.increaseCritBonus();
                    this.showActionText('HIT', 'hit');
                }
                
                this.enemy.takeDamage(damage);
            } else {
                // Блок!
                this.showActionText('BLOCK!', 'block');
                result.enemyBlocked = true; // Противник заблокировал
            }
        } else {
            // Противник атакует, игрок защищается
            this.showAction(this.enemyActionImage, 'attack', enemyAction);
            this.showAction(this.playerActionImage, 'block', playerAction);
            
            // Проверяем попадание
            if (enemyAction !== playerAction) {
                // Попадание! Урон = урон атакующего - защита защищающегося
                let damage = this.player.calculateDamage(this.enemy.damage);
                
                // Проверяем критический удар с текущим бонусом (если есть)
                let isCritical = this.enemy.checkCriticalHit(enemyAction);
                
                // Проверяем эффект боевого стиля Muay Thai (только для критов в ноги)
                if (isCritical && enemyAction === 'low' && this.player.fightingStyle && this.player.fightingStyle.id === 'muay_thai') {
                    isCritical = this.player.fightingStyle.handleIncomingCrit(enemyAction, isCritical);
                    if (!isCritical) {
                        // Muay Thai превратил крит в обычный удар
                        this.showActionText('MUAY THAI DEFENSE!', 'hit critical');
                    }
                }
                
                if (isCritical) {
                    // Крит произошел - сбрасываем бонус крита для кикбоксинга
                    this.enemy.resetCritBonus();
                    
                    // Проверяем, есть ли у игрока перк CritDeflector
                    const hasCritDeflector = this.player.hasPerk('crit_deflector');
                    if (hasCritDeflector && Math.random() < 0.5) {
                        // Перк сработал - крит превращается в обычный удар
                        this.showActionText('CRIT DEFLECTED!', 'hit critical');
                    } else {
                        // Крит прошел
                        // Проверяем перк Lucker у атакующего
                        const hasLucker = this.enemy.hasPerk('lucker');
                        if (hasLucker && Math.random() < 0.5) {
                            // Перк Lucker сработал - учетверяем урон
                            damage *= 4;
                            this.showActionText('LUCKY PUNCH!', 'hit critical');
                        } else {
                            // Обычный крит
                            damage *= 2; // Удваиваем урон при критическом ударе
                            this.showActionText('CRITICAL HIT!', 'hit critical');
                        }
                    }
                } else {
                    // Крита не было - увеличиваем бонус крита для кикбоксинга
                    // Бонус накапливается только при успешных ударах без крита
                    this.enemy.increaseCritBonus();
                    this.showActionText('HIT', 'hit');
                }
                
                this.player.takeDamage(damage);
            } else {
                // Блок!
                this.showActionText('BLOCK!', 'block');
                result.playerBlocked = true; // Игрок заблокировал
            }
        }
        
        this.updateHealthBars();
        return result;
    }

    showAction(imgElement, type, action) {
        const imagePath = IMAGE_PATHS[type][action];
        imgElement.src = imagePath;
        imgElement.alt = `${type} ${action}`;
        // Используем requestAnimationFrame для плавного fade-in
        requestAnimationFrame(() => {
            imgElement.classList.add('visible');
        });
    }

    showActionText(text, className) {
        this.actionResultText.textContent = text;
        this.actionResultText.className = `action-result-text ${className}`;
    }

    clearActionDisplays() {
        // Плавно скрываем картинки
        this.playerActionImage.classList.remove('visible');
        this.enemyActionImage.classList.remove('visible');
        
        // Плавно скрываем надпись
        this.actionResultText.classList.remove('hit', 'block', 'critical');
    }

    updateHealthBars() {
        // Обновляем засечки на основе максимального HP
        this.updateHealthBarNotches(this.playerHealthBar, this.player.maxHp);
        this.updateHealthBarNotches(this.enemyHealthBar, this.enemy.maxHp);
        
        // Вычисляем процент здоровья
        const playerPercent = (this.player.hp / this.player.maxHp) * 100;
        const enemyPercent = (this.enemy.hp / this.enemy.maxHp) * 100;
        
        // Округляем до целого числа делений для точного попадания на засечки
        const playerDivisions = Math.floor(this.player.hp);
        const enemyDivisions = Math.floor(this.enemy.hp);
        
        // Вычисляем процент с учетом целого числа делений
        const playerPercentRounded = (playerDivisions / this.player.maxHp) * 100;
        const enemyPercentRounded = (enemyDivisions / this.enemy.maxHp) * 100;
        
        // Устанавливаем ширину заполненной части (останавливается точно на засечках)
        this.playerHealthFill.style.width = `${playerPercentRounded}%`;
        this.playerHealthText.textContent = `${this.player.hp} / ${this.player.maxHp}`;
        
        this.enemyHealthFill.style.width = `${enemyPercentRounded}%`;
        this.enemyHealthText.textContent = `${this.enemy.hp} / ${this.enemy.maxHp}`;
    }

    updateHealthBarNotches(healthBarElement, maxHp) {
        // Количество засечек = maxHp - 1
        const notchCount = maxHp - 1;
        
        if (notchCount <= 0) {
            // Если засечек нет, убираем градиент
            healthBarElement.style.setProperty('--health-bar-notches', 'none');
            return;
        }
        
        // Создаем массив для градиента
        const gradientParts = ['transparent 0%'];
        
        // Для каждой засечки создаем позицию
        for (let i = 1; i <= notchCount; i++) {
            // Позиция засечки: i / maxHp * 100%
            const position = (i / maxHp) * 100;
            const positionStr = position.toFixed(6);
            
            // Добавляем засечку: прозрачный до засечки, черный на засечке, прозрачный после
            gradientParts.push(
                `transparent calc(${positionStr}% - 0.5px)`,
                `#000 calc(${positionStr}% - 0.5px)`,
                `#000 calc(${positionStr}% + 0.5px)`,
                `transparent calc(${positionStr}% + 0.5px)`
            );
        }
        
        // Завершаем градиент
        gradientParts.push('transparent 100%');
        
        // Создаем строку градиента
        const gradientString = `linear-gradient(to right, ${gradientParts.join(', ')})`;
        
        // Устанавливаем CSS переменную
        healthBarElement.style.setProperty('--health-bar-notches', gradientString);
    }

    checkGameEnd() {
        const playerDead = this.player.hp <= 0;
        const enemyDead = this.enemy.hp <= 0;
        
        if (playerDead && enemyDead) {
            // Ничья - играем дополнительный раунд
            this.startTieRound();
        } else if (playerDead) {
            this.endGame(false);
        } else if (enemyDead) {
            this.endGame(true);
        } else {
            // Игра продолжается
            this.roundNumber++;
            this.startNewRound();
        }
    }

    startTieRound() {
        this.isTieRound = true;
        
        // Определяем HP для дополнительного раунда: 4 если есть TieBreaker, иначе 2
        const playerTieHP = this.player.hasPerk('tie_breaker') ? TIE_ROUND_HP + 2 : TIE_ROUND_HP;
        const enemyTieHP = this.enemy.hasPerk('tie_breaker') ? TIE_ROUND_HP + 2 : TIE_ROUND_HP;
        
        this.player.reset(playerTieHP);
        this.enemy.reset(enemyTieHP);
        this.roundNumber = 1;
        this.isPlayerAttacking = true;
        
        // Восстанавливаем перки после сброса
        if (this.playerPerks && this.playerPerks.length > 0) {
            this.player.applyPerks(this.playerPerks);
        }
        if (this.enemyPerks && this.enemyPerks.length > 0) {
            this.enemy.applyPerks(this.enemyPerks);
        }
        
        // Восстанавливаем боевые стили после сброса
        if (this.playerFightingStyle) {
            this.player.setFightingStyle(this.playerFightingStyle);
        }
        if (this.enemyFightingStyle) {
            this.enemy.setFightingStyle(this.enemyFightingStyle);
        }
        
        this.updateHealthBars();
        this.updatePerkDisplays();
        this.startNewRound();
    }

    startNewRound() {
        this.currentPhase = 'selection';
        this.selectedActions = [];
        this.actionResults = [];
        this.selectedList.innerHTML = '';
        this.draftIconsContainer.innerHTML = '';
        
        // Сбрасываем бонус крита для кикбоксинга между раундами
        this.player.resetCritBonus();
        this.enemy.resetCritBonus();
        
        // Показываем кнопки выбора и скрываем область результатов
        this.controlsContainer.style.display = 'flex';
        this.actionResultDisplay.classList.add('hidden');
        
        // Очищаем текст результатов ударов
        this.actionResultText.textContent = '';
        this.actionResultText.classList.remove('hit', 'block', 'critical');
        
        // Обновляем метку фазы
        const phaseText = this.isPlayerAttacking ? 
            'Выберите 3 атаки' : 'Выберите 3 блока';
        this.phaseLabel.textContent = phaseText;
        
        // Включаем кнопки и обновляем их состояние
        [this.btnHigh, this.btnMid, this.btnLow].forEach(btn => {
            btn.disabled = false;
        });
        this.updateActionButtonsState();
    }

    endGame(playerWon) {
        this.currentPhase = 'finished';
        this.controlsContainer.style.display = 'none';
        this.restartContainer.style.display = 'block';
        
        if (playerWon) {
            this.gameResult.textContent = 'ПОБЕДА!';
            this.gameResult.className = 'game-result win';
        } else {
            this.gameResult.textContent = 'ПОРАЖЕНИЕ';
            this.gameResult.className = 'game-result lose';
        }
    }

    showPersonalitySelection() {
        this.currentPhase = 'personality-selection';
        this.personalitySelectionContainer.style.display = 'block';
        this.controlsContainer.style.display = 'none';
        this.restartContainer.style.display = 'none';
    }

    selectPersonality(personality) {
        this.opponentPersonality = personality;
        this.personalitySelectionContainer.style.display = 'none';
        
        // Обновляем метку противника
        this.enemyLabel.textContent = PERSONALITY_NAMES[personality];
        
        // Сбрасываем статистику паттернов при выборе новой личности
        this.patternAnalyzer.reset();
        
        // Показываем экран выбора боевого стиля (если он есть)
        if (this.fightingStyleSelectionContainer) {
            this.showFightingStyleSelection();
        } else {
            // Если экран выбора стиля отсутствует, сразу переходим к бану перка
            this.showPerkBan();
        }
    }

    showFightingStyleSelection() {
        this.currentPhase = 'fighting-style-selection';
        this.personalitySelectionContainer.style.display = 'none';
        if (this.fightingStyleSelectionContainer) {
            this.fightingStyleSelectionContainer.style.display = 'block';
        }
        this.controlsContainer.style.display = 'none';
        this.restartContainer.style.display = 'none';
    }

    selectFightingStyle(style) {
        this.playerFightingStyle = style;
        this.player.setFightingStyle(style);
        if (this.fightingStyleSelectionContainer) {
            this.fightingStyleSelectionContainer.style.display = 'none';
        }
        
        // Обновляем отображение боевого стиля
        this.updateFightingStyleDisplay();
        
        // Показываем экран бана перка
        this.showPerkBan();
    }

    showPerkBan() {
        this.currentPhase = 'perk-ban';
        this.perkSelectionContainer.style.display = 'block';
        this.controlsContainer.style.display = 'none';
        this.restartContainer.style.display = 'none';
        
        // Обновляем заголовок
        const titleElement = this.perkSelectionContainer.querySelector('.perk-selection-title');
        if (titleElement) {
            titleElement.textContent = 'Забанить перк (исключить из боя)';
        }
        
        // Показываем все доступные перки для бана
        this.showAllPerksForBan();
    }

    showAllPerksForBan() {
        // Массив пар [кнопка, перк] для правильного сопоставления
        const buttonPerkPairs = [
            [this.perkHeadHunterBtn, PERKS.HEAD_HUNTER],
            [this.perkBodyHunterBtn, PERKS.BODY_HUNTER],
            [this.perkLegHunterBtn, PERKS.LEG_HUNTER],
            [this.perkTieBreakerBtn, PERKS.TIE_BREAKER],
            [this.perkHPBoostBtn, PERKS.HP_BOOST],
            [this.perkCritDeflectorBtn, PERKS.CRIT_DEFLECTOR],
            [this.perkLuckerBtn, PERKS.LUCKER],
            [this.perkBlockMasterBtn, PERKS.BLOCK_MASTER],
            [this.perkFinishHimBtn, PERKS.FINISH_HIM],
            [this.perkEqualizerBtn, PERKS.EQUALIZER]
        ];
        
        // Обновляем текст и показываем все кнопки
        buttonPerkPairs.forEach(([btn, perk]) => {
            if (btn && perk) {
                btn.style.display = 'block';
                // Обновляем текст кнопки из объектов Perk
                const title = btn.querySelector('.perk-btn-title');
                const desc = btn.querySelector('.perk-btn-description');
                if (title) {
                    title.textContent = perk.name;
                    title.title = perk.description; // Добавляем tooltip с описанием
                }
                if (desc) {
                    desc.textContent = perk.fullName;
                    desc.title = perk.description; // Добавляем tooltip с описанием
                }
                // Также добавляем tooltip на саму кнопку
                btn.title = perk.description;
            }
        });
    }

    handlePerkButtonClick(perk) {
        // В зависимости от фазы вызываем соответствующий метод
        if (this.currentPhase === 'perk-ban') {
            this.banPerk(perk);
        } else if (this.currentPhase === 'perk-selection') {
            this.selectPerk(perk);
        }
    }

    banPerk(perk) {
        // Запоминаем забаненный перк
        this.bannedPerk = perk;
        
        // Переходим к выбору перков
        this.showPerkSelection();
    }

    showPerkSelection() {
        this.currentPhase = 'perk-selection';
        this.perkSelectionContainer.style.display = 'block';
        this.controlsContainer.style.display = 'none';
        this.restartContainer.style.display = 'none';
        
        // Показываем 3 случайных перка для выбора
        this.showRandomPerks();
    }

    showRandomPerks() {
        // Получаем доступные перки (исключаем уже выбранные и забаненный перк)
        const availablePerks = ALL_PERKS.filter(perk => 
            !this.playerPerks.some(selected => selected && selected.id === perk.id) &&
            (!this.bannedPerk || perk.id !== this.bannedPerk.id)
        );
        
        // Выбираем 3 случайных перка
        const randomPerks = [];
        const perksToShow = Math.min(PERKS_PER_SELECTION, availablePerks.length);
        const shuffled = [...availablePerks].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < perksToShow; i++) {
            randomPerks.push(shuffled[i]);
        }
        
        // Обновляем заголовок
        const titleElement = this.perkSelectionContainer.querySelector('.perk-selection-title');
        if (titleElement) {
            if (this.playerPerkSelectionStep === 0) {
                titleElement.textContent = 'Выберите первый перк';
            } else {
                titleElement.textContent = 'Выберите второй перк';
            }
        }
        
        // Скрываем все кнопки перков
        const allPerkButtons = [
            this.perkHeadHunterBtn, this.perkBodyHunterBtn, this.perkLegHunterBtn,
            this.perkTieBreakerBtn, this.perkHPBoostBtn, this.perkCritDeflectorBtn,
            this.perkLuckerBtn, this.perkBlockMasterBtn, this.perkFinishHimBtn,
            this.perkEqualizerBtn
        ];
        allPerkButtons.forEach(btn => {
            if (btn) btn.style.display = 'none';
        });
        
        // Показываем только выбранные случайные перки
        randomPerks.forEach(perk => {
            const btn = this.getPerkButton(perk);
            if (btn) {
                btn.style.display = 'block';
                // Обновляем текст кнопки
                const title = btn.querySelector('.perk-btn-title');
                const desc = btn.querySelector('.perk-btn-description');
                if (title) {
                    title.textContent = perk.name;
                    title.title = perk.description; // Добавляем tooltip с описанием
                }
                if (desc) {
                    desc.textContent = perk.fullName;
                    desc.title = perk.description; // Добавляем tooltip с описанием
                }
                // Также добавляем tooltip на саму кнопку
                btn.title = perk.description;
            }
        });
    }

    getPerkButton(perk) {
        const buttonMap = {
            'head_hunter': this.perkHeadHunterBtn,
            'body_hunter': this.perkBodyHunterBtn,
            'leg_hunter': this.perkLegHunterBtn,
            'tie_breaker': this.perkTieBreakerBtn,
            'hp_boost': this.perkHPBoostBtn,
            'crit_deflector': this.perkCritDeflectorBtn,
            'lucker': this.perkLuckerBtn,
            'block_master': this.perkBlockMasterBtn,
            'finish_him': this.perkFinishHimBtn,
            'equalizer': this.perkEqualizerBtn
        };
        return buttonMap[perk.id] || null;
    }

    updatePerkButtons() {
        // Массив пар [кнопка, перк] для обновления
        const buttonPerkPairs = [
            [this.perkHeadHunterBtn, PERKS.HEAD_HUNTER],
            [this.perkBodyHunterBtn, PERKS.BODY_HUNTER],
            [this.perkLegHunterBtn, PERKS.LEG_HUNTER],
            [this.perkTieBreakerBtn, PERKS.TIE_BREAKER],
            [this.perkHPBoostBtn, PERKS.HP_BOOST],
            [this.perkCritDeflectorBtn, PERKS.CRIT_DEFLECTOR],
            [this.perkLuckerBtn, PERKS.LUCKER],
            [this.perkBlockMasterBtn, PERKS.BLOCK_MASTER],
            [this.perkFinishHimBtn, PERKS.FINISH_HIM],
            [this.perkEqualizerBtn, PERKS.EQUALIZER]
        ];
        
        // Обновляем все кнопки
        buttonPerkPairs.forEach(([btn, perk]) => {
            if (btn && perk) {
                const title = btn.querySelector('.perk-btn-title');
                const desc = btn.querySelector('.perk-btn-description');
                if (title) {
                    title.textContent = perk.name;
                    title.title = perk.description; // Добавляем tooltip с описанием
                }
                if (desc) {
                    desc.textContent = perk.fullName;
                    desc.title = perk.description; // Добавляем tooltip с описанием
                }
                // Также добавляем tooltip на саму кнопку
                btn.title = perk.description;
            }
        });
    }

    selectPerk(perk) {
        // Проверяем, не был ли уже выбран этот перк
        if (this.playerPerks.some(selected => selected && selected.id === perk.id)) {
            // Перк уже выбран, игнорируем повторный выбор
            return;
        }
        
        // Добавляем выбранный перк в массив
        this.playerPerks.push(perk);
        this.player.applyPerk(perk);
        
        // Проверяем, выбрал ли игрок оба перка
        if (this.playerPerks.length < PLAYER_PERKS_COUNT) {
            // Еще нужно выбрать второй перк
            this.playerPerkSelectionStep = 1;
            this.showPerkSelection();
        } else {
            // Оба перка выбраны, даем противнику два случайных перка и случайный стиль
            this.enemyPerks = this.getRandomEnemyPerks();
            if (this.enemyPerks && this.enemyPerks.length > 0) {
                this.enemy.applyPerks(this.enemyPerks);
            }
            
            // Выбираем случайный боевой стиль для противника
            this.enemyFightingStyle = this.getRandomEnemyFightingStyle();
            if (this.enemyFightingStyle) {
                this.enemy.setFightingStyle(this.enemyFightingStyle);
            }
            
            // Скрываем экран выбора перка и показываем игру
            this.perkSelectionContainer.style.display = 'none';
            this.fightersContainer.style.display = 'flex';
            this.currentPhase = 'selection';
            
            // Обновляем отображение перков и боевых стилей
            this.updatePerkDisplays();
            
            // Инициализируем игру
            this.updateHealthBars();
            
            // Активируем кнопки выбора направления
            this.startNewRound();
        }
    }

    getRandomEnemyPerks() {
        // Выбираем случайные перки из доступных (исключаем забаненный перк)
        const availablePerks = ALL_PERKS.filter(perk => 
            !this.bannedPerk || perk.id !== this.bannedPerk.id
        );
        
        if (availablePerks.length === 0) {
            return [];
        }
        
        // Выбираем ENEMY_PERKS_COUNT случайных перков
        const selectedPerks = [];
        const shuffled = [...availablePerks].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < ENEMY_PERKS_COUNT && i < shuffled.length; i++) {
            selectedPerks.push(shuffled[i]);
        }
        
        return selectedPerks;
    }

    getRandomEnemyFightingStyle() {
        // Выбираем случайный боевой стиль из доступных
        if (ALL_FIGHTING_STYLES.length === 0) {
            return null;
        }
        
        const randomIndex = Math.floor(Math.random() * ALL_FIGHTING_STYLES.length);
        return ALL_FIGHTING_STYLES[randomIndex];
    }

    updatePerkDisplays() {
        // Обновляем отображение перков игрока (короткие названия через запятую)
        if (this.player.activePerks && this.player.activePerks.length > 0) {
            const perkNames = this.player.activePerks
                .filter(p => p !== null)
                .map(p => p.name)
                .join(', ');
            this.playerPerkDisplay.textContent = perkNames;
            this.playerPerkDisplay.classList.add('active');
            // Добавляем tooltip с описанием всех перков
            const perkDescriptions = this.player.activePerks
                .filter(p => p !== null)
                .map(p => `${p.name}: ${p.description}`)
                .join('\n');
            this.playerPerkDisplay.title = perkDescriptions;
        } else {
            this.playerPerkDisplay.textContent = '';
            this.playerPerkDisplay.classList.remove('active');
            this.playerPerkDisplay.title = '';
        }
        
        // Обновляем отображение перков противника (короткие названия через запятую)
        if (this.enemy.activePerks && this.enemy.activePerks.length > 0) {
            const perkNames = this.enemy.activePerks
                .filter(p => p !== null)
                .map(p => p.name)
                .join(', ');
            this.enemyPerkDisplay.textContent = perkNames;
            this.enemyPerkDisplay.classList.add('active');
            // Добавляем tooltip с описанием всех перков
            const perkDescriptions = this.enemy.activePerks
                .filter(p => p !== null)
                .map(p => `${p.name}: ${p.description}`)
                .join('\n');
            this.enemyPerkDisplay.title = perkDescriptions;
        } else {
            this.enemyPerkDisplay.textContent = '';
            this.enemyPerkDisplay.classList.remove('active');
            this.enemyPerkDisplay.title = '';
        }
        
        // Обновляем отображение боевых стилей
        this.updateFightingStyleDisplay();
    }

    updateFightingStyleDisplay() {
        // Обновляем отображение боевого стиля игрока
        if (this.playerFightingStyleDisplay) {
            if (this.playerFightingStyle) {
                this.playerFightingStyleDisplay.textContent = this.playerFightingStyle.name;
                this.playerFightingStyleDisplay.classList.add('active');
                
                // Формируем описание для tooltip
                let description = `${this.playerFightingStyle.description}\n\n`;
                
                if (this.playerFightingStyle.advantages && this.playerFightingStyle.advantages.length > 0) {
                    description += 'Преимущества:\n';
                    this.playerFightingStyle.advantages.forEach(adv => {
                        description += `• ${adv}\n`;
                    });
                }
                
                if (this.playerFightingStyle.disadvantages && this.playerFightingStyle.disadvantages.length > 0) {
                    description += '\nНедостатки:\n';
                    this.playerFightingStyle.disadvantages.forEach(dis => {
                        description += `• ${dis}\n`;
                    });
                }
                
                this.playerFightingStyleDisplay.title = description.trim();
            } else {
                this.playerFightingStyleDisplay.textContent = '';
                this.playerFightingStyleDisplay.classList.remove('active');
                this.playerFightingStyleDisplay.title = '';
            }
        }
        
        // Обновляем отображение боевого стиля противника
        if (this.enemyFightingStyleDisplay) {
            if (this.enemyFightingStyle) {
                this.enemyFightingStyleDisplay.textContent = this.enemyFightingStyle.name;
                this.enemyFightingStyleDisplay.classList.add('active');
                
                // Формируем описание для tooltip
                let description = `${this.enemyFightingStyle.description}\n\n`;
                
                if (this.enemyFightingStyle.advantages && this.enemyFightingStyle.advantages.length > 0) {
                    description += 'Преимущества:\n';
                    this.enemyFightingStyle.advantages.forEach(adv => {
                        description += `• ${adv}\n`;
                    });
                }
                
                if (this.enemyFightingStyle.disadvantages && this.enemyFightingStyle.disadvantages.length > 0) {
                    description += '\nНедостатки:\n';
                    this.enemyFightingStyle.disadvantages.forEach(dis => {
                        description += `• ${dis}\n`;
                    });
                }
                
                this.enemyFightingStyleDisplay.title = description.trim();
            } else {
                this.enemyFightingStyleDisplay.textContent = '';
                this.enemyFightingStyleDisplay.classList.remove('active');
                this.enemyFightingStyleDisplay.title = '';
            }
        }
    }

    restart() {
        // Сбрасываем к базовому HP (12), так как перки будут выбраны заново
        this.player.reset(12);
        this.enemy.reset(12);
        this.roundNumber = 1;
        this.isPlayerAttacking = true;
        this.selectedActions = [];
        this.isTieRound = false;
        this.playerFightingStyle = null;
        this.player.fightingStyle = null;
        this.enemyFightingStyle = null;
        this.enemy.fightingStyle = null;
        this.playerPerks = [];
        this.enemyPerks = [];
        this.playerPerkSelectionStep = 0;
        this.bannedPerk = null;
        // Сбрасываем анализатор паттернов
        this.patternAnalyzer.reset();
        
        // Скрываем бойцов и кнопки
        this.fightersContainer.style.display = 'none';
        this.controlsContainer.style.display = 'none';
        this.restartContainer.style.display = 'none';
        
        this.clearActionDisplays();
        this.updateHealthBars();
        this.selectedList.innerHTML = '';
        this.draftIconsContainer.innerHTML = '';
        this.updatePerkDisplays();
        
        // Показываем экран выбора характера при рестарте
        this.showPersonalitySelection();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Инициализация игры при загрузке страницы
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});

