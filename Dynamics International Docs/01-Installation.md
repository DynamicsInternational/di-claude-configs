# 01 — Installation

Ce guide installe tout le nécessaire pour utiliser le plugin DI avec Claude Code sur un projet Business Central AL.

Temps estimé :

- Première installation : 30 à 60 minutes
- Installation sur un poste déjà configuré : 10 à 15 minutes

Suivez les sections **dans l'ordre**.

---

# Avant de commencer

## Où exécuter les commandes ?

Toutes les commandes de ce guide doivent être exécutées dans **PowerShell**. Deux options équivalentes :

- le terminal PowerShell **intégré à VS Code** (pratique : déjà positionné dans le dossier du projet) ;
- une **fenêtre PowerShell externe** (menu Démarrer → « PowerShell » ou « Windows PowerShell »).

Ouvrir le terminal intégré dans VS Code :

```text
VS Code
└── Terminal
    └── Nouveau terminal
```

ou :

```text
Ctrl + Shift + `
```

Ne pas exécuter ces commandes :

- dans Claude Code
- dans la fenêtre de chat Claude
- dans Git Bash (sauf indication contraire)
- dans l'invite de commandes Windows (cmd)

---

# 1. Prérequis système

## Outils requis

| Outil | Pourquoi |
|---------|----------|
| Git | Gestion du code source |
| Node.js 22 LTS | Claude Code et serveurs MCP |
| .NET SDK 8, 9 ou 10 | Outils Business Central |
| VS Code | Développement AL |
| Extension AL Language | Compilation et symboles AL |

---

## Installer Git

Téléchargement :

<https://git-scm.com/downloads>

Vérification :

```powershell
git --version
```

Résultat attendu :

```text
git version 2.x.x
```

---

## Installer Node.js

Recommandation :

```text
Node.js 22 LTS
```

Téléchargement :

<https://nodejs.org>

⚠️ Éviter Node.js 24+.

Certaines dépendances MCP (notamment better-sqlite3) peuvent nécessiter une compilation native et provoquer des erreurs.

Vérification :

```powershell
node --version
npm --version
```

Résultat attendu :

```text
v22.x.x
10.x ou supérieur
```

---

## Installer .NET SDK

Téléchargement :

<https://aka.ms/dotnet/download>

Vérification :

```powershell
dotnet --version
```

Résultat attendu :

```text
8.x
9.x
ou
10.x
```

---

## Installer VS Code et l'extension AL

VS Code : <https://code.visualstudio.com>

Puis, dans VS Code :

```text
Extensions
└── Rechercher
    └── AL Language
```

Éditeur :

```text
Microsoft
(ms-dynamics-smb.al)
```

---

## Vérification complète des prérequis

Dans PowerShell :

```powershell
git --version
node --version
npm --version
dotnet --version
```

Tous les outils doivent répondre sans erreur avant de continuer.

---

# 2. Configurer la source NuGet

À faire **avant** d'installer les outils .NET (section 6), sinon `dotnet tool install` échoue.

Vérifier :

```powershell
dotnet nuget list source
```

Vous devez voir :

```text
nuget.org
https://api.nuget.org/v3/index.json
```

Si ce n'est pas le cas, ajouter la source :

```powershell
dotnet nuget add source https://api.nuget.org/v3/index.json -n nuget.org
```

---

# 3. Installer Claude Code

Documentation officielle :

<https://docs.claude.com/claude-code>

Dans PowerShell :

```powershell
npm install -g @anthropic-ai/claude-code
```

Vérification :

```powershell
claude --version
```

Résultat attendu :

```text
Claude Code x.x.x
```

---

# 4. Installer le plugin DI

## Ajouter le marketplace

Le plugin est publié sur GitHub :

```text
DynamicsInternational/di-claude-configs
```

Installation :

```powershell
claude plugin marketplace add DynamicsInternational/di-claude-configs
```

Vérification :

```powershell
claude plugin marketplace list
```

Résultat attendu :

```text
claude-configs
Source: GitHub
```

> Mise à jour ultérieure (les mises à jour ne sont pas automatiques) :
> `claude plugin marketplace update di-claude-configs`

---

## Activer le plugin

Ouvrir votre projet AL dans VS Code, puis dans le terminal :

```powershell
claude
```

Dans Claude :

```text
/plugin
```

Activer :

```text
profile-al-development
```

Quitter puis relancer Claude.

---

# 5. Serveurs MCP

Le rôle de chaque serveur est détaillé dans [05 - MCP et outils](05-MCP-et-outils.md).

## MCP automatiques

Ces serveurs sont lancés automatiquement via `npx` (aucune action nécessaire) :

```text
microsoft_docs_mcp
al-mcp-server
bc-source-mcp
bcquality-mcp
nab-al-tools
```

---

## MCP à installer manuellement

Un seul serveur nécessite une installation globale :

```powershell
npm install -g bc-code-intelligence-mcp
```

Vérification :

```powershell
bc-code-intelligence-mcp .
```

Vous devez voir :

```text
MCP transport connected
Server ready
```

Puis interrompre avec :

```text
Ctrl+C
```

---

## ALCops (analyse qualité de code AL)

⚠️ Contrairement à `bc-code-intelligence-mcp`, ALCops n'est **pas** un package npm : c'est un **outil .NET global** (le binaire `alcops-mcp` attendu par le plugin).

Dépôt :

<https://github.com/ALCops/mcp-server>

Installation :

```powershell
dotnet tool install -g ALCops.Mcp
```

Prérequis :

- .NET 10 (SDK ou Runtime)
- Extension AL Language v17.0 ou supérieure

> Si la commande `alcops-mcp` n'est pas reconnue après installation, ajoutez `.dotnet\tools` au PATH (voir l'encadré en tête de la section 6).

L'absence d'ALCops n'empêche pas l'utilisation du plugin — il peut être désactivé s'il est en erreur.

---

# 6. Outils AL en ligne de commande

> ℹ️ Les outils installés via `dotnet tool install` arrivent dans `%USERPROFILE%\.dotnet\tools`.
> Si une commande n'est pas reconnue après installation, ajoutez ce dossier au PATH :
> ```powershell
> $env:Path += ";$env:USERPROFILE\.dotnet\tools"
> ```

## al-compile (compilation)

Outil de compilation AL en ligne de commande (de Stefan Maron). Requis par le skill `/compile`.

Dépôt :

<https://github.com/StefanMaron/al-smart-compile>

Installation :

```powershell
cd ~
git clone https://github.com/StefanMaron/al-smart-compile
cd al-smart-compile
.\install.ps1
```

> Sous Linux / macOS / Git Bash : `./install.sh`

Prérequis : extension AL installée + symboles téléchargés (dans VS Code : `AL: Download Symbols`, ou via le skill `/al-symbols`). `jq` est recommandé pour l'analyse des logs.

---

## al-runner (tests rapides)

Tests unitaires ultra rapides, sans serveur BC.

Installation :

```powershell
dotnet tool install --global MSDyn365BC.AL.Runner
```

Vérification :

```powershell
al-runner --help
```

---

## al-mutate (mutation testing)

Mesure la qualité des tests.

Installation :

```powershell
dotnet tool install --global MSDyn365BC.AL.Mutate
```

Vérification :

```powershell
al-mutate --help
```

---

## Serveur de langage AL (LSP)

Branche le serveur de langage AL officiel sur la navigation de code de Claude Code (aller à la définition, références, hiérarchie de types).

Installation :

```powershell
dotnet tool install --global Microsoft.Dynamics.BusinessCentral.Development.Tools
```

Vérification :

```powershell
al --help
```

Résultat attendu :

```text
launchmcpserver
```

ou :

```text
launchlspserver
```

selon la version installée. Si aucune de ces commandes n'apparaît, votre outil `al` est trop ancien : mettez-le à jour avec `dotnet tool update --global Microsoft.Dynamics.BusinessCentral.Development.Tools`.

---

## bc-publish / bc-test (intégration — optionnel)

Tests d'intégration contre une vraie instance BC (skills `/publish` et `/run-tests` en mode intégration). Ces outils ne sont **pas** nécessaires pour le développement, la compilation et les tests rapides (`al-runner`).

> 🚧 La source d'installation de `bc-publish` / `bc-test` est à confirmer auprès de l'équipe DI. Ils se configurent ensuite via un fichier `.bcconfig.json` (`bc-publish --init`).

---

# 7. Validation finale

## Vérifier les serveurs MCP

Dans votre projet :

```powershell
claude
```

Puis :

```text
/mcp
```

Les serveurs suivants doivent être connectés :

```text
al-mcp-server
bcquality-mcp
microsoft_docs_mcp
nab-al-tools
bc-source-mcp
bc-code-intelligence-mcp
alcops
```

`alcops` n'apparaît que si l'outil .NET `ALCops.Mcp` est installé (section 5). Il peut être désactivé s'il est en erreur — le plugin reste utilisable sans lui.

---

## Vérifier le plugin

Tester :

```text
/compile
```

La compilation doit démarrer.

Puis :

```text
Analyse complètement ce projet AL.
```

Claude doit être capable d'identifier :

- les dépendances
- les objets AL
- les flux métier
- les zones techniques à risque

---

# 8. Dépannage Windows

Pour les problèmes non couverts ici, voir [06 - Dépannage / FAQ](06-Depannage-FAQ.md).

## Node installé mais introuvable

Vérifier :

```powershell
Test-Path "C:\Program Files\nodejs\node.exe"
```

Puis :

```powershell
$env:Path += ";C:\Program Files\nodejs;$env:APPDATA\npm"
```

Tester :

```powershell
node --version
npm --version
```

---

## Outils .NET installés mais introuvables

Ajouter `.dotnet\tools` au PATH :

```powershell
$env:Path += ";$env:USERPROFILE\.dotnet\tools"
```

Puis :

```powershell
al --help
```

---

## Erreur Python lors de l'installation MCP

Installer Python :

```powershell
winget install Python.Python.3.12
```

Vérifier :

```powershell
python --version
```

Résultat attendu :

```text
Python 3.12.x
```

---

## Erreur « No NuGet sources are defined or enabled »

Voir la section 2 — Configurer la source NuGet :

```powershell
dotnet nuget add source https://api.nuget.org/v3/index.json -n nuget.org
```

---

# Première utilisation recommandée

Essayez successivement :

```text
Analyse complètement ce projet AL.
```

```text
Liste les dépendances et les objets les plus importants.
```

```text
Explique-moi l'architecture du projet comme si j'étais un nouveau développeur.
```

```text
Quels objets seraient impactés si je modifie cette table ?
```

```text
Analyse les 20 derniers commits Git et résume les évolutions fonctionnelles.
```

Si Claude répond correctement à ces questions, votre environnement est pleinement opérationnel.

Vous êtes prêt → [02 - Démarrage rapide](02-Demarrage-rapide.md)
