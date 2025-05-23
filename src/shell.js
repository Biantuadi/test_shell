import { execAsync } from './utils/exec.js';
import { commands, history, aliases, expandHistory } from './commands/index.js';

const MAX_INPUT_LENGTH = 10000;
let inputBuffer = '';
let isProcessing = false;

// Configuration de l'entrée standard
process.stdin.setEncoding('utf8');
process.stdin.setMaxListeners(1);

// Gestionnaire d'entrée avec buffer
process.stdin.on('data', (chunk) => {
    if (isProcessing) return;
    
    inputBuffer += chunk;
    
    // Vérifier si l'entrée est trop longue
    if (inputBuffer.length > MAX_INPUT_LENGTH) {
        console.error(`Error: Input is too long (${inputBuffer.length} characters). Maximum length is ${MAX_INPUT_LENGTH} characters.`);
        inputBuffer = '';
        return;
    }
    
    // Vérifier si nous avons une ligne complète
    if (inputBuffer.includes('\n')) {
        isProcessing = true;
        const lines = inputBuffer.split('\n');
        inputBuffer = lines.pop() || ''; // Garder la dernière ligne incomplète
        
        for (const line of lines) {
            if (line.trim()) {
                processCommand(line.trim());
            }
        }
        isProcessing = false;
    }
});

// Gestion des signaux
process.on('SIGINT', () => {
    console.log('\nExiting...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nExiting...');
    process.exit(0);
});

// Fonction pour traiter une commande
async function processCommand(input) {
    try {
        if (input.toLowerCase() === 'exit') {
            process.exit(0);
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
            return;
        }

        // Execute command
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

// Fonction pour démarrer le shell
function startShell() {
    console.log('Welcome to FakeShell!');
    console.log('Available commands: tree, sort, alias, ps, history, calc, help');
    console.log('Type "help" for more information');
    console.log('Type "exit" to quit');
    console.log('fakeshell> ');
}

// Démarrer le shell
startShell();