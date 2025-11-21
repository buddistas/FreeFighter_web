// Детальная отладка BodyHunter vs LegHunter
const { Fighter, PERKS, Fight } = require('./tournament-simulator');

console.log('=== Детальная отладка BodyHunter vs LegHunter ===\n');

// Создаем бойцов
const bodyHunter = new Fighter('BodyHunter', PERKS.BODY_HUNTER);
const legHunter = new Fighter('LegHunter', PERKS.LEG_HUNTER);

console.log('Крит-шансы BodyHunter:', bodyHunter.critChance);
console.log('Крит-шансы LegHunter:', legHunter.critChance);
console.log('');

// Проводим детальный бой
bodyHunter.reset();
legHunter.reset();

let bodyHunterAttacking = true;
const stats = {
    bodyHunter: { attacks: { high: 0, mid: 0, low: 0 }, crits: { high: 0, mid: 0, low: 0 }, damage: 0 },
    legHunter: { attacks: { high: 0, mid: 0, low: 0 }, crits: { high: 0, mid: 0, low: 0 }, damage: 0 }
};

for (let round = 1; round <= 20 && bodyHunter.hp > 0 && legHunter.hp > 0; round++) {
    let attacker = bodyHunterAttacking ? bodyHunter : legHunter;
    let defender = bodyHunterAttacking ? legHunter : bodyHunter;
    let attackerStats = bodyHunterAttacking ? stats.bodyHunter : stats.legHunter;
    
    const attackSequence = attacker.generateRandomSequence();
    const blockSequence = defender.generateRandomSequence();
    
    for (let i = 0; i < 3; i++) {
        const attackAction = attackSequence[i];
        const blockAction = blockSequence[i];
        
        if (attackAction !== blockAction) {
            attackerStats.attacks[attackAction]++;
            
            let damage = defender.calculateDamage(attacker.damage);
            const isCritical = attacker.checkCriticalHit(attackAction);
            
            if (isCritical) {
                attackerStats.crits[attackAction]++;
                damage *= 2;
            }
            
            defender.takeDamage(damage);
            attackerStats.damage += damage;
        }
    }
    
    bodyHunterAttacking = !bodyHunterAttacking;
}

console.log('Статистика BodyHunter:');
console.log(`  Атаки: High=${stats.bodyHunter.attacks.high}, Mid=${stats.bodyHunter.attacks.mid}, Low=${stats.bodyHunter.attacks.low}`);
console.log(`  Криты: High=${stats.bodyHunter.crits.high}, Mid=${stats.bodyHunter.crits.mid}, Low=${stats.bodyHunter.crits.low}`);
console.log(`  Крит-процент: High=${stats.bodyHunter.attacks.high > 0 ? (stats.bodyHunter.crits.high/stats.bodyHunter.attacks.high*100).toFixed(2) : 0}%, Mid=${stats.bodyHunter.attacks.mid > 0 ? (stats.bodyHunter.crits.mid/stats.bodyHunter.attacks.mid*100).toFixed(2) : 0}%, Low=${stats.bodyHunter.attacks.low > 0 ? (stats.bodyHunter.crits.low/stats.bodyHunter.attacks.low*100).toFixed(2) : 0}%`);
console.log(`  Общий урон: ${stats.bodyHunter.damage}`);
console.log('');

console.log('Статистика LegHunter:');
console.log(`  Атаки: High=${stats.legHunter.attacks.high}, Mid=${stats.legHunter.attacks.mid}, Low=${stats.legHunter.attacks.low}`);
console.log(`  Криты: High=${stats.legHunter.crits.high}, Mid=${stats.legHunter.crits.mid}, Low=${stats.legHunter.crits.low}`);
console.log(`  Крит-процент: High=${stats.legHunter.attacks.high > 0 ? (stats.legHunter.crits.high/stats.legHunter.attacks.high*100).toFixed(2) : 0}%, Mid=${stats.legHunter.attacks.mid > 0 ? (stats.legHunter.crits.mid/stats.legHunter.attacks.mid*100).toFixed(2) : 0}%, Low=${stats.legHunter.attacks.low > 0 ? (stats.legHunter.crits.low/stats.legHunter.attacks.low*100).toFixed(2) : 0}%`);
console.log(`  Общий урон: ${stats.legHunter.damage}`);
console.log('');

console.log(`Итог: BodyHunter HP=${bodyHunter.hp}, LegHunter HP=${legHunter.hp}`);

