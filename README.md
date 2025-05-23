# FakeShell

Un shell interactif personnalisé implémenté en JavaScript, offrant des fonctionnalités similaires à un shell Unix tout en étant plus convivial et robuste.

## Fonctionnalités

- Commandes intégrées :
  - `tree` : Affiche l'arborescence des fichiers et dossiers
  - `sort` : Trie des nombres ou le contenu d'un fichier
  - `alias` : Gère les alias (création, affichage)
  - `ps` : Affiche les processus en cours d'exécution
  - `history` : Affiche l'historique des commandes
  - `calc` : Effectue des calculs mathématiques avec support des grands nombres
  - `help` : Affiche l'aide pour les commandes disponibles

- Fonctionnalités avancées :
  - Gestion robuste des entrées utilisateur avec limitation de taille
  - Support des opérateurs `&&` et `||` pour l'enchaînement de commandes
  - Système d'alias avec détection des références circulaires
  - Historique des commandes avec expansion (`!n`, `!!`, `!string`)
  - Calculatrice supportant les grands nombres via la bibliothèque `big.js`

## Architecture

Le projet est organisé en plusieurs modules :

- `src/shell.js` : Point d'entrée principal du shell
- `src/commands/` : Implémentation des commandes intégrées
- `src/utils/` : Utilitaires et fonctions d'aide

## Tests Unitaires

Les tests unitaires sont implémentés pour garantir la robustesse et la fiabilité du shell. Voici les principaux aspects testés :

### 1. Gestion des Entrées
- Limitation de la taille des entrées (MAX_INPUT_LENGTH = 10000)
- Validation des caractères autorisés
- Gestion des entrées incomplètes

### 2. Commandes
- `calc` :
  - Validation des expressions mathématiques
  - Gestion des grands nombres
  - Protection contre les divisions par zéro
  - Limitation de la taille des exposants
  - Support des opérateurs : +, -, *, /, %, ^

- `alias` :
  - Création et suppression d'alias
  - Détection des références circulaires
  - Gestion des alias imbriqués

- `history` :
  - Enregistrement des commandes
  - Expansion des références historiques
  - Formatage de l'affichage

### 3. Gestion des Erreurs
- Messages d'erreur explicites
- Gestion des exceptions
- Protection contre les crashs

## Installation

```bash
npm install
```

## Utilisation

```bash
node src/shell.js
```

## Sécurité

- Validation stricte des entrées utilisateur
- Protection contre les injections de commandes
- Gestion sécurisée des alias
- Limitation des ressources utilisées

## Dépendances

- `big.js` : Pour la gestion des grands nombres dans la calculatrice
- Modules Node.js natifs : `child_process`, `fs`, `path` 