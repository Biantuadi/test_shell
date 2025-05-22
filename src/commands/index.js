import { execAsync } from '../utils/exec.js';
import fs from 'fs';
import path from 'path';

// Store command history
const history = [];

// Store aliases
const aliases = new Map();

// Command descriptions
const commandDescriptions = {
    tree: "Affiche l'arborescence des fichiers et dossiers",
    sort: "Trie des nombres ou le contenu d'un fichier",
    alias: "Gère les alias (création, affichage)",
    ps: "Affiche les processus en cours d'exécution",
    history: "Affiche l'historique des commandes",
    calc: "Effectue des calculs mathématiques",
    help: "Affiche l'aide pour les commandes disponibles"
};

// Helper function for tree command
function buildTree(dir, prefix = '', isLast = true) {
    const files = fs.readdirSync(dir);
    const filteredFiles = files.filter(file => 
        !file.startsWith('.') && 
        file !== 'node_modules' && 
        file !== 'package-lock.json'
    );

    filteredFiles.forEach((file, index) => {
        const filePath = path.join(dir, file);
        const isLastFile = index === filteredFiles.length - 1;
        const marker = isLastFile ? '└── ' : '├── ';
        const newPrefix = prefix + (isLast ? '    ' : '│   ');

        console.log(prefix + marker + file);

        if (fs.statSync(filePath).isDirectory()) {
            buildTree(filePath, newPrefix, isLastFile);
        }
    });
}

// Helper function to expand history references
function expandHistory(input) {
    if (input.startsWith('!')) {
        const ref = input.slice(1);
        if (ref === '!') {
            // !! refers to the last command
            return history[history.length - 1] || input;
        } else if (/^\d+$/.test(ref)) {
            // !n refers to command number n
            const index = parseInt(ref) - 1;
            if (index >= 0 && index < history.length) {
                return history[index];
            }
        } else {
            // !string refers to the most recent command starting with string
            for (let i = history.length - 1; i >= 0; i--) {
                if (history[i].startsWith(ref)) {
                    return history[i];
                }
            }
        }
    }
    return input;
}

const commands = {
    // Help command
    help(args) {
        if (args.length === 0) {
            // Show all commands
            console.log('\nCommandes disponibles :');
            console.log('-------------------');
            Object.entries(commandDescriptions).forEach(([cmd, desc]) => {
                console.log(`${cmd.padEnd(10)} : ${desc}`);
            });
            console.log('\nUtilisez "help <commande>" pour plus de détails sur une commande spécifique.');
        } else {
            // Show specific command help
            const cmd = args[0];
            if (commands[cmd]) {
                console.log(`\nAide pour la commande : ${cmd}`);
                console.log('-------------------');
                console.log(commandDescriptions[cmd]);
                
                // Show specific examples for each command
                switch(cmd) {
                    case 'tree':
                        console.log('\nExemple :');
                        console.log('  tree');
                        break;
                    case 'sort':
                        console.log('\nExemples :');
                        console.log('  sort 5 2 8 1 9');
                        console.log('  sort fichier.txt');
                        break;
                    case 'alias':
                        console.log('\nExemples :');
                        console.log('  alias ll="ls -l"');
                        console.log('  alias');
                        console.log('  alias ll');
                        break;
                    case 'ps':
                        console.log('\nExemple :');
                        console.log('  ps');
                        break;
                    case 'history':
                        console.log('\nExemple :');
                        console.log('  history');
                        console.log('  !5        # Exécute la commande #5');
                        console.log('  !!        # Exécute la dernière commande');
                        console.log('  !calc     # Exécute la dernière commande commençant par "calc"');
                        break;
                    case 'calc':
                        console.log('\nExemples :');
                        console.log('  calc 2 + 2');
                        console.log('  calc 10 * 5');
                        console.log('  calc "2 + 2 * 3"');
                        console.log('  calc 2 ^ 3    # Puissance (2³)');
                        break;
                }
            } else {
                console.error(`Commande inconnue : ${cmd}`);
                console.log('Utilisez "help" pour voir la liste des commandes disponibles.');
            }
        }
    },

    // Tree command
    async tree() {
        try {
            console.log('.');
            buildTree('.');
        } catch (error) {
            console.error('Error executing tree:', error);
        }
    },

    // Sort command
    async sort(args) {
        try {
            if (args.length === 0) {
                console.error('Usage: sort <filename> or sort <numbers...>');
                console.error('Example: sort file.txt');
                console.error('Example: sort 5 2 8 1 9');
                return;
            }

            // Check if the first argument is a file
            if (fs.existsSync(args[0])) {
                // Sort file contents
                const { stdout } = await execAsync(`sort ${args.join(' ')}`);
                console.log(stdout);
            } else {
                // Sort numbers directly
                const numbers = args.map(arg => {
                    const num = parseFloat(arg);
                    if (isNaN(num)) {
                        throw new Error(`Invalid number: ${arg}`);
                    }
                    return num;
                });

                // Sort numbers
                const sortedNumbers = numbers.sort((a, b) => a - b);
                console.log(sortedNumbers.join(' '));
            }
        } catch (error) {
            if (error.message.includes('Invalid number')) {
                console.error(error.message);
            } else {
                console.error('Error executing sort:', error.message);
            }
        }
    },

    // Alias command
    // Fixed alias command with proper circular reference detection
alias(args) {
    if (args.length === 0) {
        // Display all aliases
        if (aliases.size === 0) {
            console.log('No aliases defined');
            return;
        }
        for (const [alias, command] of aliases.entries()) {
            console.log(`${alias}='${command}'`);
        }
    } else if (args.length === 1) {
        // Display specific alias
        const alias = args[0];
        if (aliases.has(alias)) {
            console.log(`${alias}='${aliases.get(alias)}'`);
        } else {
            console.log(`Alias '${alias}' not found`);
        }
    } else {
        // Set new alias
        const alias = args[0];
        // Join all remaining arguments as the command
        const command = args.slice(1).join(' ');
        
        // Remove quotes if present and handle the = sign
        const cleanCommand = command.replace(/^["']|["']$/g, '').replace(/^=/, '');

        console.log('Debug - Alias:', alias);
        console.log('Debug - Clean Command:', cleanCommand);
        console.log('Debug - Current Aliases:', Array.from(aliases.entries()));

        // Check for recursive alias (direct self-reference)
        if (cleanCommand === alias) {
            console.error(`Error: Cannot create recursive alias '${alias}'`);
            return;
        }

        // Check for circular references by simulating the new alias being added
        const tempAliases = new Map(aliases);
        tempAliases.set(alias, cleanCommand);
        
        // Function to detect cycles using the temporary alias map
        function hasCycle(startAlias, currentAlias, visited) {
            if (visited.has(currentAlias)) {
                return currentAlias === startAlias; // Only report cycle if it loops back to start
            }
            
            visited.add(currentAlias);
            
            if (tempAliases.has(currentAlias)) {
                const nextCommand = tempAliases.get(currentAlias);
                // Extract the first word as the command name for alias resolution
                const nextAlias = nextCommand.split(' ')[0];
                return hasCycle(startAlias, nextAlias, visited);
            }
            
            return false;
        }
        
        // Check if adding this alias would create a cycle
        if (hasCycle(alias, alias, new Set())) {
            console.error(`Error: Circular alias detected for '${alias}'`);
            return;
        }
        
        aliases.set(alias, cleanCommand);
        console.log(`Alias '${alias}' created`);
    }
},

    // PS command
    async ps() {
        try {
            // Format: F S UID PID PPID C PRI NI ADDR SZ WCHAN TTY TIME CMD
            const { stdout } = await execAsync('ps -l');
            const lines = stdout.split('\n');
            // Print header
            console.log('F S UID   PID  PPID  C PRI  NI ADDR SZ WCHAN TTY        TIME CMD');
            console.log('- - --- ---- ----- --- --- --- ---- -- ----- --- ----------- ---');
            
            // Print processes
            lines.slice(1).forEach(line => {
                if (line.trim()) {
                    console.log(line);
                }
            });
        } catch (error) {
            console.error('Error executing ps:', error);
        }
    },

    // History command
    history() {
        if (history.length === 0) {
            console.log('No commands in history');
            return;
        }
        
        // Get the width of the terminal
        const width = process.stdout.columns || 80;
        const maxNumWidth = String(history.length).length;
        
        history.forEach((cmd, index) => {
            const num = String(index + 1).padStart(maxNumWidth);
            const timestamp = new Date().toLocaleTimeString();
            console.log(`${num}  ${timestamp}  ${cmd}`);
        });
    },

    // Calculator command
    calc(expression) {
        try {
            if (expression.length === 0) {
                console.error('Usage: calc <expression>');
                console.error('Example: calc 2 + 2');
                console.error('Supported operators: +, -, *, /, %, ^');
                return;
            }

            // Join the expression and remove any extra spaces
            let expr = expression.join(' ').replace(/\s+/g, ' ').trim();
            
            // Replace ^ with ** for power operation
            expr = expr.replace(/\^/g, '**');
            
            // Validate the expression
            if (!/^[\d\s+\-*\/%()^]+$/.test(expr)) {
                console.error('Invalid expression. Only numbers and basic operators are allowed.');
                return;
            }

            // Calculate the result
            const result = eval(expr);
            
            // Format the output
            console.log(`${expr} = ${result}`);
        } catch (error) {
            console.error('Error in calculation:', error.message);
        }
    }
};

export {
    commands,
    history,
    aliases,
    commandDescriptions,
    expandHistory
};