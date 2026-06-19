# 01 — Installation

Ce guide installe **tout ce qu'il faut** pour utiliser le plugin. Suivez les sections dans l'ordre.
Comptez 30 à 60 minutes la première fois.

> 💡 Sous Windows, ouvrez **PowerShell** pour les commandes `dotnet`/`npm`, et **Git Bash** pour
> les scripts `.sh`. Les commandes ci-dessous précisent quand utiliser l'un ou l'autre.

---

## 1. Prérequis (à installer une fois)

| Outil | Pourquoi | Vérifier avec |
|-------|----------|---------------|
| **Git** | Cloner le dépôt du plugin et le code | `git --version` |
| **Node.js 20+** | Claude Code + plusieurs serveurs MCP (lancés via `npx`) | `node --version` |
| **.NET SDK 8, 9 ou 10** | Outils AL (`al`, `al-runner`, `al-mutate`) | `dotnet --version` |
| **Extension AL pour VS Code** (`ms-dynamics-smb.al`) | Compilation AL + symboles + serveur de langage | visible dans VS Code |

- Node.js : <https://nodejs.org> (version LTS).
- .NET SDK : <https://aka.ms/dotnet/download>.
- Extension AL : dans VS Code, onglet Extensions, chercher « AL Language ».

---

## 2. Installer Claude Code

Suivez la documentation officielle : <https://docs.claude.com/claude-code>.
Méthode courante (nécessite Node.js) :

```powershell
npm install -g @anthropic-ai/claude-code
```

Vérifiez :

```powershell
claude --version
```

---

## 3. Ajouter le marketplace du plugin

Le plugin est publié sur GitHub : **`DynamicsInternational/di-claude-configs`**. Deux méthodes.

### Méthode A — directement depuis GitHub (recommandée)

Pas besoin de cloner quoi que ce soit : Claude Code récupère le dépôt tout seul.

```powershell
claude plugin marketplace add DynamicsInternational/di-claude-configs
```

(équivalent depuis l'intérieur de Claude Code : `/plugin marketplace add DynamicsInternational/di-claude-configs`)

> Pour épingler une branche : `… add DynamicsInternational/di-claude-configs@main`.
> **Dépôt privé ?** Claude Code réutilise vos identifiants Git. Pour les mises à jour automatiques,
> définissez `GITHUB_TOKEN` (ou `GH_TOKEN`) dans votre environnement.

**Mettre à jour** plus tard (les mises à jour ne sont pas automatiques par défaut) :

```powershell
claude plugin marketplace update di-claude-configs
```

### Méthode B — clone local (pour les mainteneurs ou en hors-ligne)

```powershell
cd ~
git clone https://github.com/DynamicsInternational/di-claude-configs.git
```

Vous pointerez alors le marketplace sur ce dossier (voir la variante en §4).

---

## 4. Activer le plugin dans un projet AL

Une fois le marketplace ajouté (§3), activez le plugin. Le plus simple, dans Claude Code :

```
/plugin
```

puis activez **profile-al-development**. Sinon, déclarez-le dans le `.claude/settings.json` du projet :

```json
{
  "extraKnownMarketplaces": {
    "di-configs": {
      "source": {
        "source": "github",
        "repo": "DynamicsInternational/di-claude-configs"
      }
    }
  },
  "enabledPlugins": {
    "profile-al-development@di-configs": true
  }
}
```

> **Variante clone local** (méthode B) : remplacez le bloc `source` par
> `{ "source": "directory", "path": "~/di-claude-configs" }`.

Relancez Claude Code dans le projet ; tapez `/` pour voir apparaître les commandes du plugin
(`/plan`, `/develop`, etc.). Sinon, voir [Dépannage](06-Depannage-FAQ.md).

---

## 5. Les serveurs MCP (sources de connaissance)

Le plugin déclare **7 serveurs MCP**. La plupart se lancent **automatiquement** via `npx`
(aucune installation manuelle, juste Node.js) :

| Serveur | Installation | À quoi ça sert ([détails](05-MCP-et-outils.md)) |
|---------|--------------|--------------------------------------------------|
| `microsoft_docs_mcp` | aucune (service web) | Documentation Microsoft officielle |
| `al-mcp-server` | auto (`npx`) | Navigation des dépendances du projet |
| `bc-source-mcp` | auto (`npx`) | Code source de la base app BC, toutes versions |
| `bcquality-mcp` | auto (`npx`) | Règles de qualité AL (fork DI) |
| `nab-al-tools` | auto (`npx`) | Traduction XLIFF |
| `bc-code-intelligence-mcp` | **install manuelle** (voir ci-dessous) | Consultation d'experts BC |
| `alcops` | **install manuelle** (voir ci-dessous) | Analyse qualité de code AL |

Pour les deux serveurs à installer manuellement (commande globale attendue sur le `PATH`) :

```powershell
npm install -g bc-code-intelligence-mcp
npm install -g alcops-mcp
```

> ⚠️ Si le nom exact d'un de ces deux packages a changé, vérifiez auprès de l'équipe DI.
> Tant qu'ils ne sont pas installés, seuls ces deux serveurs seront indisponibles — le reste fonctionne.

Aucune clé ni configuration supplémentaire n'est requise : le serveur BCQuality pointe déjà sur le
fork DI (`DynamicsInternational/BCQuality`) via le plugin.

---

## 6. Les outils CLI de build et de test

Ces outils (de **Stefan Maron**) servent à compiler et tester l'AL en ligne de commande.

### al-compile (compilation)

Dépôt : <https://github.com/StefanMaron/al-smart-compile>

```powershell
git clone https://github.com/StefanMaron/al-smart-compile
cd al-smart-compile
.\install.ps1        # Windows (PowerShell). Sous Linux/macOS/Git Bash : ./install.sh
```

Prérequis : extension AL installée + **symboles téléchargés** (dans VS Code : `AL: Download Symbols`,
ou via le skill `/al-symbols`). `jq` recommandé pour l'analyse des logs.

### al-runner (tests rapides, sans serveur BC)

Dépôt : <https://github.com/StefanMaron/BusinessCentral.AL.Runner>

```powershell
dotnet tool install --global MSDyn365BC.AL.Runner
```

### al-mutate (qualité des tests)

```powershell
dotnet tool install --global MSDyn365BC.AL.Mutate
```

### bc-publish / bc-test (tests d'intégration sur un vrai serveur BC — optionnel)

> 🚧 **À confirmer par DI** : la source d'installation de `bc-publish` et `bc-test` n'est pas encore
> documentée ici. Ces deux outils ne sont nécessaires que pour les **tests d'intégration** contre une
> instance BC réelle (skills `/publish` et `/run-tests` en mode intégration). Le développement, la
> compilation et les tests rapides (`al-runner`) fonctionnent **sans** eux.
> Ils se configurent ensuite via un fichier `.bcconfig.json` (`bc-publish --init`).

---

## 7. Le serveur de langage AL (LSP) — recommandé

Le plugin fournit `.lsp.json`, qui branche le **serveur de langage AL officiel** sur l'outil de
navigation de code de Claude Code (aller à la définition, références, hiérarchie de types…).

Il faut l'outil `al` de Microsoft, **version BC 2026 wave 1 ou ultérieure** :

```powershell
dotnet tool install --global Microsoft.Dynamics.BusinessCentral.Development.Tools
# (ou, si déjà installé)  dotnet tool update --global Microsoft.Dynamics.BusinessCentral.Development.Tools
```

Vérifiez que la commande LSP existe :

```powershell
al --help        # doit lister « launchlspserver »
```

Si `launchlspserver` n'apparaît pas, votre `al` est trop ancien : mettez-le à jour avec la commande
ci-dessus.

---

## 8. Vérification finale

Dans un projet AL avec le plugin activé, lancez `claude` puis :

- Tapez `/` → vous devez voir `/plan`, `/develop`, `/fix`, etc.
- Lancez `/compile` → la compilation doit démarrer (`al-compile`).
- En cas de souci, voir [Dépannage / FAQ](06-Depannage-FAQ.md).

Vous êtes prêt → [02 - Démarrage rapide](02-Demarrage-rapide.md).
</content>
