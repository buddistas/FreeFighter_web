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
    PERSISTENT: 'persistent'
};

const PERSONALITY_NAMES = {
    [OPPONENT_PERSONALITY.RANDOM]: 'Рандомный',
    [OPPONENT_PERSONALITY.PERSISTENT]: 'Упорный'
};

// Перки
const PERKS = {
    DOUBLE_CRIT_HIGH: 'double_crit_high',
    DOUBLE_CRIT_MID: 'double_crit_mid',
    DOUBLE_CRIT_LOW: 'double_crit_low'
};

const PERK_NAMES = {
    [PERKS.DOUBLE_CRIT_HIGH]: 'Удвоенная вероятность крита в голову',
    [PERKS.DOUBLE_CRIT_MID]: 'Удвоенная вероятность крита в тело',
    [PERKS.DOUBLE_CRIT_LOW]: 'Удвоенная вероятность крита в ноги'
};

const PERK_DESCRIPTIONS = {
    [PERKS.DOUBLE_CRIT_HIGH]: 'Вероятность критического удара в голову удваивается',
    [PERKS.DOUBLE_CRIT_MID]: 'Вероятность критического удара в тело удваивается',
    [PERKS.DOUBLE_CRIT_LOW]: 'Вероятность критического удара в ноги удваивается'
};

const ALL_PERKS = [PERKS.DOUBLE_CRIT_HIGH, PERKS.DOUBLE_CRIT_MID, PERKS.DOUBLE_CRIT_LOW];
const ENEMY_PERKS_COUNT = 1; // Количество случайных перков для противника

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
        // Активный перк
        this.activePerk = null;
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
        const chance = this.critChance[action] || 0;
        return Math.random() < chance;
    }

    reset(hp) {
        this.hp = hp;
        this.maxHp = hp;
        this.attackSequence = [];
        this.blockSequence = [];
        // Сбрасываем перк и вероятности критов
        this.activePerk = null;
        this.critChance = { ...DEFAULT_CRIT_CHANCE };
    }

    applyPerk(perk) {
        if (!perk) {
            return; // Не применяем перк, если он null или undefined
        }
        
        this.activePerk = perk;
        // Удваиваем вероятность крита для выбранной зоны (добавляем +100% к базовой)
        if (perk === PERKS.DOUBLE_CRIT_HIGH) {
            this.critChance.high = DEFAULT_CRIT_CHANCE.high * 2; // 10% → 20%
        } else if (perk === PERKS.DOUBLE_CRIT_MID) {
            this.critChance.mid = DEFAULT_CRIT_CHANCE.mid * 2; // 5% → 10%
        } else if (perk === PERKS.DOUBLE_CRIT_LOW) {
            this.critChance.low = DEFAULT_CRIT_CHANCE.low * 2; // 5% → 10%
        }
    }
}

// Класс игры
class Game {
    constructor() {
        this.player = new Fighter('Игрок', true);
        this.enemy = new Fighter('Противник', false);
        this.currentPhase = 'personality-selection'; // personality-selection, selection, playing, finished
        this.roundNumber = 1;
        this.isPlayerAttacking = true; // В первом раунде игрок атакует первым
        this.selectedActions = [];
        this.isTieRound = false;
        this.opponentPersonality = null; // Характер оппонента
        this.playerPerk = null; // Выбранный перк игрока
        
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
        this.controlsContainer = document.getElementById('controls-container');
        this.restartContainer = document.getElementById('restart-container');
        this.restartBtn = document.getElementById('restart-btn');
        this.gameResult = document.getElementById('game-result');
        
        // Экран выбора характера
        this.personalitySelectionContainer = document.getElementById('personality-selection-container');
        this.personalityRandomBtn = document.getElementById('personality-random-btn');
        this.personalityPersistentBtn = document.getElementById('personality-persistent-btn');
        
        // Экран выбора перка
        this.perkSelectionContainer = document.getElementById('perk-selection-container');
        this.perkDoubleCritHighBtn = document.getElementById('perk-double-crit-high-btn');
        this.perkDoubleCritMidBtn = document.getElementById('perk-double-crit-mid-btn');
        this.perkDoubleCritLowBtn = document.getElementById('perk-double-crit-low-btn');
        
        // Отображение активных перков
        this.playerPerkDisplay = document.getElementById('player-perk-display');
        this.enemyPerkDisplay = document.getElementById('enemy-perk-display');
        
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
        
        // Метка противника (для отображения характера)
        this.enemyLabel = document.querySelector('.enemy-section .fighter-label');
        
        // Обработчики событий
        this.btnHigh.addEventListener('click', () => this.selectAction('high'));
        this.btnMid.addEventListener('click', () => this.selectAction('mid'));
        this.btnLow.addEventListener('click', () => this.selectAction('low'));
        this.restartBtn.addEventListener('click', () => this.restart());
        this.personalityRandomBtn.addEventListener('click', () => this.selectPersonality(OPPONENT_PERSONALITY.RANDOM));
        this.personalityPersistentBtn.addEventListener('click', () => this.selectPersonality(OPPONENT_PERSONALITY.PERSISTENT));
        
        // Обработчики выбора перка
        this.perkDoubleCritHighBtn.addEventListener('click', () => this.selectPerk(PERKS.DOUBLE_CRIT_HIGH));
        this.perkDoubleCritMidBtn.addEventListener('click', () => this.selectPerk(PERKS.DOUBLE_CRIT_MID));
        this.perkDoubleCritLowBtn.addEventListener('click', () => this.selectPerk(PERKS.DOUBLE_CRIT_LOW));
        
        // Обработчик изменения размера окна для обновления засечек
        window.addEventListener('resize', () => {
            this.updateHealthBars();
        });
        
        // Показываем экран выбора характера при старте
        this.showPersonalitySelection();
    }

    selectAction(action) {
        if (this.currentPhase !== 'selection' || this.selectedActions.length >= ACTIONS_PER_PHASE) {
            return;
        }

        this.selectedActions.push(action);
        this.updateSelectedActionsDisplay();
        
        // Обновляем стиль кнопки
        const btn = document.getElementById(`btn-${action}`);
        btn.classList.add('selected');
        
        if (this.selectedActions.length >= ACTIONS_PER_PHASE) {
            this.startPhase();
        }
    }

    updateSelectedActionsDisplay() {
        this.selectedList.innerHTML = '';
        this.selectedActions.forEach((action, index) => {
            const item = document.createElement('div');
            item.className = 'selected-item';
            const actionNames = { high: 'Верх', mid: 'Середина', low: 'Низ' };
            item.textContent = `${index + 1}. ${actionNames[action]}`;
            this.selectedList.appendChild(item);
        });
    }

    startPhase() {
        this.currentPhase = 'playing';
        
        // Отключаем кнопки
        [this.btnHigh, this.btnMid, this.btnLow].forEach(btn => {
            btn.disabled = true;
            btn.classList.remove('selected');
        });
        
        // Устанавливаем последовательности
        if (this.isPlayerAttacking) {
            this.player.setAttackSequence([...this.selectedActions]);
            this.enemy.setBlockSequence(this.generateEnemySequence());
        } else {
            this.player.setBlockSequence([...this.selectedActions]);
            this.enemy.setAttackSequence(this.generateEnemySequence());
        }
        
        this.selectedActions = [];
        
        // Запускаем выполнение фаз
        this.executePhases();
    }

    generateEnemySequence() {
        if (this.opponentPersonality === OPPONENT_PERSONALITY.PERSISTENT) {
            return this.generatePersistentSequence();
        } else {
            return this.generateRandomSequence();
        }
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

    async executePhases() {
        const playerActions = this.isPlayerAttacking ? 
            this.player.attackSequence : this.player.blockSequence;
        const enemyActions = this.isPlayerAttacking ? 
            this.enemy.blockSequence : this.enemy.attackSequence;
        
        // Выполняем все 3 действия в фазе
        for (let i = 0; i < ACTIONS_PER_PHASE; i++) {
            const playerAction = playerActions[i];
            const enemyAction = enemyActions[i];
            
            await this.executeAction(playerAction, enemyAction, i);
            
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
            // Раунд завершен (обе фазы выполнены), проверяем условия победы
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
        
        if (this.isPlayerAttacking) {
            // Игрок атакует, противник защищается
            this.showAction(this.playerActionImage, 'attack', playerAction);
            this.showAction(this.enemyActionImage, 'block', enemyAction);
            
            // Проверяем попадание
            if (playerAction !== enemyAction) {
                // Попадание! Урон = урон атакующего - защита защищающегося
                let damage = this.enemy.calculateDamage(this.player.damage);
                
                // Проверяем критический удар
                const isCritical = this.player.checkCriticalHit(playerAction);
                if (isCritical) {
                    damage *= 2; // Удваиваем урон при критическом ударе
                    this.showActionText('CRITICAL HIT!', 'hit critical');
                } else {
                    this.showActionText('HIT', 'hit');
                }
                
                this.enemy.takeDamage(damage);
            } else {
                // Блок!
                this.showActionText('BLOCK!', 'block');
            }
        } else {
            // Противник атакует, игрок защищается
            this.showAction(this.enemyActionImage, 'attack', enemyAction);
            this.showAction(this.playerActionImage, 'block', playerAction);
            
            // Проверяем попадание
            if (enemyAction !== playerAction) {
                // Попадание! Урон = урон атакующего - защита защищающегося
                let damage = this.player.calculateDamage(this.enemy.damage);
                
                // Проверяем критический удар
                const isCritical = this.enemy.checkCriticalHit(enemyAction);
                if (isCritical) {
                    damage *= 2; // Удваиваем урон при критическом ударе
                    this.showActionText('CRITICAL HIT!', 'hit critical');
                } else {
                    this.showActionText('HIT', 'hit');
                }
                
                this.player.takeDamage(damage);
            } else {
                // Блок!
                this.showActionText('BLOCK!', 'block');
            }
        }
        
        this.updateHealthBars();
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
        this.player.reset(TIE_ROUND_HP);
        this.enemy.reset(TIE_ROUND_HP);
        this.roundNumber = 1;
        this.isPlayerAttacking = true;
        
        // Восстанавливаем перки после сброса
        if (this.playerPerk) {
            this.player.applyPerk(this.playerPerk);
        }
        const enemyPerk = this.getRandomEnemyPerk();
        if (enemyPerk) {
            this.enemy.applyPerk(enemyPerk);
        }
        
        this.updateHealthBars();
        this.updatePerkDisplays();
        this.startNewRound();
    }

    startNewRound() {
        this.currentPhase = 'selection';
        this.selectedActions = [];
        this.selectedList.innerHTML = '';
        
        // Обновляем метку фазы
        const phaseText = this.isPlayerAttacking ? 
            'Выберите 3 атаки' : 'Выберите 3 блока';
        this.phaseLabel.textContent = phaseText;
        
        // Включаем кнопки и снимаем выделение
        [this.btnHigh, this.btnMid, this.btnLow].forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('selected');
        });
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
        
        // Показываем экран выбора перка
        this.showPerkSelection();
    }

    showPerkSelection() {
        this.currentPhase = 'perk-selection';
        this.perkSelectionContainer.style.display = 'block';
        this.controlsContainer.style.display = 'none';
        this.restartContainer.style.display = 'none';
    }

    selectPerk(perk) {
        this.playerPerk = perk;
        this.player.applyPerk(perk);
        
        // Даем противнику случайный перк
        const enemyPerk = this.getRandomEnemyPerk();
        if (enemyPerk) {
            this.enemy.applyPerk(enemyPerk);
        }
        
        // Скрываем экран выбора перка и показываем игру
        this.perkSelectionContainer.style.display = 'none';
        this.controlsContainer.style.display = 'block';
        this.currentPhase = 'selection';
        
        // Обновляем отображение перков
        this.updatePerkDisplays();
        
        // Инициализируем игру
        this.updateHealthBars();
    }

    getRandomEnemyPerk() {
        // Выбираем случайный перк из доступных
        const availablePerks = [...ALL_PERKS];
        
        if (availablePerks.length === 0) {
            return null;
        }
        
        // Выбираем ENEMY_PERKS_COUNT случайных перков
        const selectedPerks = [];
        for (let i = 0; i < ENEMY_PERKS_COUNT && availablePerks.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availablePerks.length);
            selectedPerks.push(availablePerks[randomIndex]);
            availablePerks.splice(randomIndex, 1);
        }
        
        // Возвращаем первый выбранный перк (пока только один)
        return selectedPerks[0] || null;
    }

    updatePerkDisplays() {
        // Обновляем отображение перка игрока
        if (this.player.activePerk) {
            this.playerPerkDisplay.textContent = PERK_NAMES[this.player.activePerk];
            this.playerPerkDisplay.classList.add('active');
        } else {
            this.playerPerkDisplay.textContent = '';
            this.playerPerkDisplay.classList.remove('active');
        }
        
        // Обновляем отображение перка противника
        if (this.enemy.activePerk) {
            this.enemyPerkDisplay.textContent = PERK_NAMES[this.enemy.activePerk];
            this.enemyPerkDisplay.classList.add('active');
        } else {
            this.enemyPerkDisplay.textContent = '';
            this.enemyPerkDisplay.classList.remove('active');
        }
    }

    restart() {
        this.player.reset(this.player.maxHp);
        this.enemy.reset(this.enemy.maxHp);
        this.roundNumber = 1;
        this.isPlayerAttacking = true;
        this.selectedActions = [];
        this.isTieRound = false;
        this.playerPerk = null;
        
        this.clearActionDisplays();
        this.updateHealthBars();
        this.selectedList.innerHTML = '';
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

