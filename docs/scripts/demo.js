// Demo functionality for RANDSUM site
// This is a simplified dice rolling implementation for demo purposes

class SimpleDiceRoller {
    constructor() {
        this.modifiers = {
            'H': 'Keep Highest',
            'L': 'Drop Lowest', 
            '!': 'Exploding',
            'R': 'Reroll'
        };
    }

    // Simple dice notation parser for demo
    parseNotation(notation) {
        const cleanNotation = notation.replace(/\s/g, '');
        
        // Basic pattern: XdY[modifiers][+/-Z]
        const match = cleanNotation.match(/^(\d+)d(\d+)([HL!R{<>=}\d]*)([\+\-]\d+)?$/);
        
        if (!match) {
            throw new Error('Invalid dice notation');
        }

        const [, quantity, sides, modifierStr, bonus] = match;
        
        return {
            quantity: parseInt(quantity),
            sides: parseInt(sides),
            modifiers: this.parseModifiers(modifierStr || ''),
            bonus: bonus ? parseInt(bonus) : 0
        };
    }

    parseModifiers(modifierStr) {
        const modifiers = {};
        
        if (modifierStr.includes('H')) {
            modifiers.keepHighest = true;
        }
        if (modifierStr.includes('L')) {
            modifiers.dropLowest = true;
        }
        if (modifierStr.includes('!')) {
            modifiers.exploding = true;
        }
        if (modifierStr.includes('R')) {
            modifiers.reroll = true;
            // Simple reroll condition parsing
            const rerollMatch = modifierStr.match(/R\{<(\d+)\}/);
            if (rerollMatch) {
                modifiers.rerollBelow = parseInt(rerollMatch[1]);
            }
        }
        
        return modifiers;
    }

    rollDie(sides) {
        return Math.floor(Math.random() * sides) + 1;
    }

    roll(notation) {
        try {
            const config = this.parseNotation(notation);
            const rolls = [];
            const droppedRolls = [];
            
            // Roll initial dice
            for (let i = 0; i < config.quantity; i++) {
                let roll = this.rollDie(config.sides);
                
                // Handle exploding dice
                if (config.modifiers.exploding && roll === config.sides) {
                    const explosions = [roll];
                    let explodingRoll = roll;
                    while (explodingRoll === config.sides) {
                        explodingRoll = this.rollDie(config.sides);
                        explosions.push(explodingRoll);
                    }
                    roll = explosions.reduce((sum, r) => sum + r, 0);
                    rolls.push({ value: roll, explosions, exploded: true });
                } else {
                    rolls.push({ value: roll, exploded: false });
                }
            }

            // Handle rerolls
            if (config.modifiers.reroll && config.modifiers.rerollBelow) {
                rolls.forEach(roll => {
                    if (!roll.exploded && roll.value < config.modifiers.rerollBelow) {
                        const originalValue = roll.value;
                        roll.value = this.rollDie(config.sides);
                        roll.rerolled = true;
                        roll.originalValue = originalValue;
                    }
                });
            }

            // Handle drop/keep modifiers
            let finalRolls = [...rolls];
            if (config.modifiers.dropLowest && config.quantity > 1) {
                const sorted = [...rolls].sort((a, b) => a.value - b.value);
                const dropped = sorted.shift();
                droppedRolls.push(dropped);
                finalRolls = sorted;
            } else if (config.modifiers.keepHighest && config.quantity > 1) {
                const sorted = [...rolls].sort((a, b) => b.value - a.value);
                const kept = sorted.shift();
                droppedRolls.push(...sorted);
                finalRolls = [kept];
            }

            const sum = finalRolls.reduce((total, roll) => total + roll.value, 0);
            const total = sum + config.bonus;

            return {
                notation,
                config,
                rolls: finalRolls,
                droppedRolls,
                sum,
                total,
                bonus: config.bonus
            };

        } catch (error) {
            throw new Error(`Failed to roll "${notation}": ${error.message}`);
        }
    }
}

// Initialize demo when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const roller = new SimpleDiceRoller();
    const diceInput = document.getElementById('diceInput');
    const rollBtn = document.getElementById('rollBtn');
    const demoOutput = document.getElementById('demoOutput');
    const presetBtns = document.querySelectorAll('.preset-btn');

    // Roll button click handler
    rollBtn.addEventListener('click', function() {
        const notation = diceInput.value.trim();
        if (!notation) {
            showError('Please enter dice notation');
            return;
        }

        try {
            const result = roller.roll(notation);
            displayResult(result);
        } catch (error) {
            showError(error.message);
        }
    });

    // Enter key handler for input
    diceInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            rollBtn.click();
        }
    });

    // Preset button handlers
    presetBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const notation = this.getAttribute('data-notation');
            diceInput.value = notation;
            
            // Remove active class from all buttons
            presetBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Auto-roll the preset
            try {
                const result = roller.roll(notation);
                displayResult(result);
            } catch (error) {
                showError(error.message);
            }
        });
    });

    function displayResult(result) {
        const resultHtml = `
            <div class="demo-result">
                <div class="demo-result-header">
                    ${result.notation} → ${result.total}
                </div>
                <div class="demo-result-details">
                    <strong>Rolls:</strong> [${result.rolls.map(formatRoll).join(', ')}]
                    ${result.droppedRolls.length > 0 ? `<br><strong>Dropped:</strong> [${result.droppedRolls.map(formatRoll).join(', ')}]` : ''}
                    <br><strong>Sum:</strong> ${result.sum}
                    ${result.bonus !== 0 ? `<br><strong>Bonus:</strong> ${result.bonus > 0 ? '+' : ''}${result.bonus}` : ''}
                    <br><strong>Total:</strong> ${result.total}
                    ${getModifierDescription(result.config.modifiers)}
                </div>
            </div>
        `;
        
        // Add to output (keep last 3 results)
        const existingResults = demoOutput.querySelectorAll('.demo-result');
        if (existingResults.length >= 3) {
            existingResults[0].remove();
        }
        
        // Remove placeholder if it exists
        const placeholder = demoOutput.querySelector('.demo-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        demoOutput.insertAdjacentHTML('beforeend', resultHtml);
        
        // Scroll to bottom
        demoOutput.scrollTop = demoOutput.scrollHeight;
    }

    function formatRoll(roll) {
        let display = roll.value.toString();
        
        if (roll.exploded) {
            display += '!';
        }
        if (roll.rerolled) {
            display += ` (was ${roll.originalValue})`;
        }
        
        return display;
    }

    function getModifierDescription(modifiers) {
        const descriptions = [];
        
        if (modifiers.keepHighest) descriptions.push('Keep highest');
        if (modifiers.dropLowest) descriptions.push('Drop lowest');
        if (modifiers.exploding) descriptions.push('Exploding dice');
        if (modifiers.reroll) {
            if (modifiers.rerollBelow) {
                descriptions.push(`Reroll < ${modifiers.rerollBelow}`);
            } else {
                descriptions.push('Reroll');
            }
        }
        
        return descriptions.length > 0 ? `<br><strong>Modifiers:</strong> ${descriptions.join(', ')}` : '';
    }

    function showError(message) {
        const errorHtml = `
            <div class="demo-result" style="border-left-color: #ef4444;">
                <div class="demo-result-header" style="color: #ef4444;">
                    Error
                </div>
                <div class="demo-result-details">
                    ${message}
                </div>
            </div>
        `;
        
        // Remove placeholder if it exists
        const placeholder = demoOutput.querySelector('.demo-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        demoOutput.insertAdjacentHTML('beforeend', errorHtml);
        
        // Scroll to bottom
        demoOutput.scrollTop = demoOutput.scrollHeight;
    }

    // Add CSS for active preset button
    const style = document.createElement('style');
    style.textContent = `
        .preset-btn.active {
            background: var(--primary-color) !important;
            color: white !important;
            border-color: var(--primary-color) !important;
        }
    `;
    document.head.appendChild(style);
});
