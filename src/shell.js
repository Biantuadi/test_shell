// const readline = require('readline');
// const { execAsync } = require('./utils/exec');
// const { commands, history, aliases, expandHistory } = require('./commands');

import readline from 'readline';
import { execAsync } from './utils/exec.js';
import { commands, history, aliases, expandHistory } from './commands/index.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

export async function executeCommandString(input) {
    const expandedInput = expandHistory(input);
    const parts = expandedInput.split(/(&&|\|\|)/).map(p => p.trim());

    let lastSuccess = true;

    for (let i = 0; i < parts.length; i += 2) {
        const part = parts[i];
        const operator = i > 0 ? parts[i - 1] : null;

        // Gérer les opérateurs logiques
        if (operator === '&&' && !lastSuccess) {
            // Skip si la précédente a échoué
            break;
        }
        if (operator === '||' && lastSuccess) {
            // Skip si la précédente a réussi
            break;
        }

        const [cmd, ...args] = part.split(' ');
        const actualCommand = aliases.has(cmd) ? aliases.get(cmd) : cmd;

        try {
            if (commands[actualCommand]) {
                await commands[actualCommand](args);
            } else {
                const { stdout } = await execAsync(part);
                console.log(stdout);
            }
            lastSuccess = true;
        } catch (error) {
            lastSuccess = false;
        }
    }

    return lastSuccess;
}



// Main shell loop
async function startShell() {
    while (true) {
        const input = await new Promise(resolve => {
            rl.question('fakeshell> ', resolve);
        });

        if (input.toLowerCase() === 'exit') {
            break;
        }

        // Expand history references
        const expandedInput = expandHistory(input);
        if (expandedInput !== input) {
            console.log(expandedInput);
        }

        // Add to history
        history.push(expandedInput);

        // Split input into command and arguments
        const [cmd, ...args] = expandedInput.split(' ');

        // Check for aliases
        const actualCommand = aliases.has(cmd) ? aliases.get(cmd) : cmd;

        // Handle && and || operators
        if (expandedInput.includes('&&') || expandedInput.includes('||')) {
            const parts = expandedInput.split(/(&&|\|\|)/);
            let lastSuccess = true;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i].trim();
                if (part === '&&' || part === '||') {
                    continue;
                }

                const [subCmd, ...subArgs] = part.split(' ');
                try {
                    if (commands[subCmd]) {
                        await commands[subCmd](subArgs);
                        lastSuccess = true;
                    } else {
                        const { stdout } = await execAsync(part);
                        console.log(stdout);
                        lastSuccess = true;
                    }
                } catch (error) {
                    lastSuccess = false;
                    if (part === '||') {
                        continue;
                    }
                    break;
                }
            }
            continue;
        }

        // Execute command
        try {
            if (commands[actualCommand]) {
                await commands[actualCommand](args);
            } else {
                // Try to execute as system command
                try {
                    const { stdout } = await execAsync(expandedInput);
                    console.log(stdout);
                } catch (error) {
                    console.error(`Commande inconnue : ${cmd}`);
                    console.log('Utilisez "help" pour voir la liste des commandes disponibles.');
                }
            }
        } catch (error) {
            console.error(`Error executing command: ${error.message}`);
        }
    }

    rl.close();
}

console.log('Welcome to FakeShell!');
console.log('Available commands: tree, sort, alias, ps, history, calc, help');
console.log('Type "help" for more information');
console.log('Type "exit" to quit');
startShell();