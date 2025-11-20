// Константы игры
const MAX_HP = 12;
const TIE_ROUND_HP = 2;
const ACTIONS_PER_PHASE = 3;
const DELAY_BETWEEN_ACTIONS = 1000; // 1 секунда
const DELAY_BETWEEN_PHASES = 2000; // 2 секунды

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
    constructor(name, isPlayer = false) {
        this.name = name;
        this.hp = MAX_HP;
        this.maxHp = MAX_HP;
        this.isPlayer = isPlayer;
        this.attackSequence = [];
        this.blockSequence = [];
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

    reset(hp = MAX_HP) {
        this.hp = hp;
        this.maxHp = hp;
        this.attackSequence = [];
        this.blockSequence = [];
    }
}

// Класс игры
class Game {
    constructor() {
        this.player = new Fighter('Игрок', true);
        this.enemy = new Fighter('Противник', false);
        this.currentPhase = 'selection'; // selection, playing, finished
        this.roundNumber = 1;
        this.isPlayerAttacking = true; // В первом раунде игрок атакует первым
        this.selectedActions = [];
        this.isTieRound = false;
        
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
        
        // Полоски здоровья
        this.playerHealthFill = document.getElementById('player-health-fill');
        this.playerHealthText = document.getElementById('player-health-text');
        this.enemyHealthFill = document.getElementById('enemy-health-fill');
        this.enemyHealthText = document.getElementById('enemy-health-text');
        
        // Области отображения действий
        this.playerActionDisplay = document.getElementById('player-action-display');
        this.playerActionImage = document.getElementById('player-action-image');
        this.enemyActionDisplay = document.getElementById('enemy-action-display');
        this.enemyActionImage = document.getElementById('enemy-action-image');
        this.actionResultText = document.getElementById('action-result-text');
        
        // Обработчики событий
        this.btnHigh.addEventListener('click', () => this.selectAction('high'));
        this.btnMid.addEventListener('click', () => this.selectAction('mid'));
        this.btnLow.addEventListener('click', () => this.selectAction('low'));
        this.restartBtn.addEventListener('click', () => this.restart());
        
        this.updateHealthBars();
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
            this.enemy.setBlockSequence(this.generateRandomSequence());
        } else {
            this.player.setBlockSequence([...this.selectedActions]);
            this.enemy.setAttackSequence(this.generateRandomSequence());
        }
        
        this.selectedActions = [];
        
        // Запускаем выполнение фаз
        this.executePhases();
    }

    generateRandomSequence() {
        const actions = ['high', 'mid', 'low'];
        const sequence = [];
        for (let i = 0; i < ACTIONS_PER_PHASE; i++) {
            sequence.push(actions[Math.floor(Math.random() * actions.length)]);
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
                // Попадание!
                this.enemy.takeDamage(1);
                this.showActionText('HIT', 'hit');
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
                // Попадание!
                this.player.takeDamage(1);
                this.showActionText('HIT', 'hit');
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
        this.actionResultText.classList.remove('hit', 'block');
    }

    updateHealthBars() {
        const playerPercent = (this.player.hp / this.player.maxHp) * 100;
        const enemyPercent = (this.enemy.hp / this.enemy.maxHp) * 100;
        
        this.playerHealthFill.style.width = `${playerPercent}%`;
        this.playerHealthText.textContent = `${this.player.hp} / ${this.player.maxHp}`;
        
        this.enemyHealthFill.style.width = `${enemyPercent}%`;
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
        this.updateHealthBars();
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

    restart() {
        this.player.reset(MAX_HP);
        this.enemy.reset(MAX_HP);
        this.currentPhase = 'selection';
        this.roundNumber = 1;
        this.isPlayerAttacking = true;
        this.selectedActions = [];
        this.isTieRound = false;
        
        this.clearActionDisplays();
        this.updateHealthBars();
        this.selectedList.innerHTML = '';
        this.phaseLabel.textContent = 'Выберите 3 действия';
        
        this.controlsContainer.style.display = 'block';
        this.restartContainer.style.display = 'none';
        
        [this.btnHigh, this.btnMid, this.btnLow].forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('selected');
        });
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

