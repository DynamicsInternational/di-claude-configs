# 05 — MCP et outils (en langage simple)

Un **serveur MCP** est une source de connaissance ou un outil que Claude Code peut interroger pour
travailler sur des **faits** plutôt que sur sa mémoire (voir [Glossaire](07-Glossaire.md)). Le
plugin en branche 7, plus le serveur de langage AL.

---

## Les 7 serveurs MCP

| Serveur | En une phrase | Quand il aide |
|---------|---------------|---------------|
| **bc-code-intelligence-mcp** | Consultation d'« experts » BC (personas, architecture) | « Comment aborder ce problème ? » |
| **microsoft_docs_mcp** | Documentation Microsoft officielle | Vérifier une API, un comportement plateforme |
| **al-mcp-server** | Navigation des **dépendances réelles** du projet (ce qui compile) | Trouver un objet/événement que vous étendez |
| **bc-source-mcp** | **Code source** complet de la base app, toutes versions/pays | Lire une implémentation, comparer des versions |
| **bcquality-mcp** | Corpus de **règles de qualité** (Microsoft + community + **custom DI**) | Concevoir/coder/relire selon les bonnes pratiques |
| **nab-al-tools** | Outils de **traduction** XLIFF | Localiser les libellés (FR…) |
| **alcops** | Analyse qualité de code AL + corrections | Détecter et corriger des défauts AL |

### Deux distinctions utiles

- **`al-mcp-server` vs `bc-source-mcp`** : le premier voit ce que **votre projet** compile
  (ses symboles) ; le second voit le **code source** de la base app, toutes versions. Pour lire une
  implémentation ou comparer des versions → `bc-source-mcp`.
- **`bcquality-mcp` vs `bc-code-intelligence-mcp`** : le premier donne des **règles précises et
  citables** (avec exemples) ; le second est une **consultation experte** plus ouverte.

### À propos de BCQuality et de la couche « custom »

Le corpus BCQuality a 3 couches, par priorité croissante : `microsoft` < `community` < **`custom`**.
La couche `custom` est le **fork Dynamics International** : les règles maison y prennent le dessus
sur celles de Microsoft. Toutes les décisions et findings citent la règle utilisée (son chemin),
visible dans les livrables (`02-…`, `03-…`, etc.).

---

## Le serveur de langage AL (LSP)

Le fichier `.lsp.json` du plugin branche le **serveur de langage AL officiel** (via
`al launchlspserver`) sur l'outil de navigation de Claude Code. Cela donne :

- aller à la définition, **trouver les références** (même entre projets),
- liste des symboles, renommage, **hiérarchie de types**,
- diagnostics en direct.

C'est **plus fiable** qu'une recherche texte (`grep`) : le serveur comprend les types, les portées
et les relations AL. **Prérequis :** l'outil `al` avec la commande `launchlspserver` (BC 2026
wave 1+) — voir [Installation §7](01-Installation.md).

> ℹ️ C'est pour cette raison qu'aucun MCP tiers de navigation sémantique (type *Serena*) n'est
> nécessaire : le LSP AL est natif et conçu pour les agents.

---

## Les outils CLI (build / test)

| Outil | Rôle | Skill associé |
|-------|------|---------------|
| `al-compile` | Compiler avec les analyseurs | `/compile` |
| `al-runner` | Tests unitaires **rapides** (sans serveur BC) | `/run-tests` |
| `al-mutate` | Test de mutation (qualité des tests) | `/al-mutate` |
| `bc-publish` | Déployer le `.app` sur un serveur BC | `/publish` |
| `bc-test` | Tests d'intégration via l'API OData de BC | `/run-tests` |

Installation : voir [01 - Installation §6](01-Installation.md).
</content>
