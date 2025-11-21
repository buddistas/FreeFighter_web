// Тест для проверки равномерности распределения зон и сравнения BodyHunter vs LegHunter
const { Tournament, Fighter, PERKS } = require('./tournament-simulator');

// Тест 1: Проверка равномерности распределения зон
console.log('=== Тест 1: Равномерность распределения зон ===');
const zoneCounts = { high: 0, mid: 0, low: 0 };
const totalActions = 100000;

for (let i = 0; i < totalActions; i++) {
    const actions = ['high', 'mid', 'low'];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    zoneCounts[randomAction]++;
}

console.log(`Всего действий: ${totalActions}`);
console.log(`High: ${zoneCounts.high} (${(zoneCounts.high/totalActions*100).toFixed(2)}%)`);
console.log(`Mid: ${zoneCounts.mid} (${(zoneCounts.mid/totalActions*100).toFixed(2)}%)`);
console.log(`Low: ${zoneCounts.low} (${(zoneCounts.low/totalActions*100).toFixed(2)}%)`);
console.log('Ожидается: ~33.33% для каждой зоны\n');

// Тест 2: Прямое сравнение BodyHunter vs LegHunter
console.log('=== Тест 2: Прямое сравнение BodyHunter vs LegHunter ===');
const bodyHunterWins = { wins: 0, losses: 0, draws: 0 };
const legHunterWins = { wins: 0, losses: 0, draws: 0 };
const directFights = 10000;

for (let i = 0; i < directFights; i++) {
    const bodyHunter = new Fighter('BodyHunter', PERKS.BODY_HUNTER);
    const legHunter = new Fighter('LegHunter', PERKS.LEG_HUNTER);
    
    const { Fight } = require('./tournament-simulator');
    const fight = new Fight(bodyHunter, legHunter);
    const result = fight.simulate();
    
    if (result.winner === bodyHunter) {
        bodyHunterWins.wins++;
        legHunterWins.losses++;
    } else if (result.winner === legHunter) {
        legHunterWins.wins++;
        bodyHunterWins.losses++;
    } else {
        bodyHunterWins.draws++;
        legHunterWins.draws++;
    }
}

const bodyHunterWinrate = (bodyHunterWins.wins / directFights * 100).toFixed(2);
const legHunterWinrate = (legHunterWins.wins / directFights * 100).toFixed(2);

console.log(`Прямых боев: ${directFights}`);
console.log(`BodyHunter: ${bodyHunterWins.wins} побед (${bodyHunterWinrate}%)`);
console.log(`LegHunter: ${legHunterWins.wins} побед (${legHunterWinrate}%)`);
console.log(`Ничьих: ${bodyHunterWins.draws}`);
console.log(`Разница: ${Math.abs(bodyHunterWins.wins - legHunterWins.wins)} боев (${Math.abs(parseFloat(bodyHunterWinrate) - parseFloat(legHunterWinrate)).toFixed(2)}%)\n`);

// Тест 3: Статистика по зонам в боях
console.log('=== Тест 3: Статистика использования зон в боях ===');
const zoneStats = { high: { attacks: 0, crits: 0 }, mid: { attacks: 0, crits: 0 }, low: { attacks: 0, crits: 0 } };

// Модифицируем класс Fight для сбора статистики
class TestFight {
    constructor(fighter1, fighter2) {
        this.fighter1 = fighter1;
        this.fighter2 = fighter2;
    }
    
    simulateWithStats() {
        this.fighter1.reset();
        this.fighter2.reset();
        
        let fighter1Attacking = true;
        let round = 1;
        const maxRounds = 100;
        
        while (round <= maxRounds) {
            let attacker = fighter1Attacking ? this.fighter1 : this.fighter2;
            let defender = fighter1Attacking ? this.fighter2 : this.fighter1;
            
            const attackSequence = attacker.generateRandomSequence();
            const blockSequence = defender.generateRandomSequence();
            
            for (let i = 0; i < 3; i++) {
                const attackAction = attackSequence[i];
                const blockAction = blockSequence[i];
                
                if (attackAction !== blockAction) {
                    zoneStats[attackAction].attacks++;
                    const isCritical = attacker.checkCriticalHit(attackAction);
                    if (isCritical) {
                        zoneStats[attackAction].crits++;
                    }
                    
                    let damage = defender.calculateDamage(attacker.damage);
                    if (isCritical) {
                        damage *= 2;
                    }
                    defender.takeDamage(damage);
                }
            }
            
            const fighter1Dead = this.fighter1.hp <= 0;
            const fighter2Dead = this.fighter2.hp <= 0;
            
            if (fighter1Dead && fighter2Dead) {
                return { winner: null, draw: true };
            } else if (fighter1Dead) {
                return { winner: this.fighter2, draw: false };
            } else if (fighter2Dead) {
                return { winner: this.fighter1, draw: false };
            }
            
            fighter1Attacking = !fighter1Attacking;
            round++;
        }
        
        return { winner: null, draw: true };
    }
}

// Сброс статистики
zoneStats.high = { attacks: 0, crits: 0 };
zoneStats.mid = { attacks: 0, crits: 0 };
zoneStats.low = { attacks: 0, crits: 0 };

for (let i = 0; i < 10000; i++) {
    const fighter1 = new Fighter('Fighter1', PERKS.BODY_HUNTER);
    const fighter2 = new Fighter('Fighter2', PERKS.LEG_HUNTER);
    const fight = new TestFight(fighter1, fighter2);
    fight.simulateWithStats();
}

const totalAttacks = zoneStats.high.attacks + zoneStats.mid.attacks + zoneStats.low.attacks;
console.log(`Всего атак: ${totalAttacks}`);
console.log(`High: ${zoneStats.high.attacks} атак (${(zoneStats.high.attacks/totalAttacks*100).toFixed(2)}%), ${zoneStats.high.crits} критов (${(zoneStats.high.crits/zoneStats.high.attacks*100).toFixed(2)}%)`);
console.log(`Mid: ${zoneStats.mid.attacks} атак (${(zoneStats.mid.attacks/totalAttacks*100).toFixed(2)}%), ${zoneStats.mid.crits} критов (${(zoneStats.mid.crits/zoneStats.mid.attacks*100).toFixed(2)}%)`);
console.log(`Low: ${zoneStats.low.attacks} атак (${(zoneStats.low.attacks/totalAttacks*100).toFixed(2)}%), ${zoneStats.low.crits} критов (${(zoneStats.low.crits/zoneStats.low.attacks*100).toFixed(2)}%)`);

