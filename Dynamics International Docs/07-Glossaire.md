# 07 — Glossaire

Les termes que vous croiserez, expliqués simplement.

| Terme | Définition |
|-------|------------|
| **Claude Code** | L'outil en ligne de commande d'Anthropic dans lequel tourne le plugin. On le lance avec `claude`. |
| **Plugin** | Un ensemble de configurations (skills, agents, règles, serveurs MCP) ajouté à Claude Code. Ici : `profile-al-development`. |
| **Marketplace** | Le « catalogue » qui référence un ou plusieurs plugins. Le nôtre est décrit par `.claude-plugin/marketplace.json`. |
| **MCP (Model Context Protocol)** | Une interface standard qui permet à Claude d'interroger des **sources externes** (docs, code source, règles, outils) au lieu de se fier à sa mémoire. Un **serveur MCP** est l'un de ces fournisseurs. |
| **Skill** | Une commande `/…` du plugin (ex. `/plan`). Elle pilote une tâche ou fournit une référence. |
| **Agent (sous-agent)** | Un assistant spécialisé que le « manager » lance pour une partie du travail (architecte, développeur, relecteur, testeur). Il travaille en parallèle et rend un résultat. |
| **Lead-as-Manager** | Le modèle du plugin : la session principale **gère** et délègue aux agents, elle n'écrit pas le code elle-même. |
| **`.dev/`** | Le dossier où les agents écrivent leurs livrables (besoin, plan, revue, tests…). Garde la conversation propre et laisse une trace. |
| **`project-context.md`** | La mémoire partagée du projet (plages d'ID, préfixe, dépendances, conventions). Créée par `/init-context`. |
| **Porte d'approbation** | Un arrêt où le manager vous demande de valider avant de continuer (après le plan, après la revue…). |
| **Règle (`rules/`)** | Un garde-fou AL **toujours actif**, injecté automatiquement (nommage, architecture, principes). |
| **Hook** | Une action automatique déclenchée par un évènement. Ici : compilation automatique en fin de tour. |
| **LSP (serveur de langage)** | Un service qui comprend le langage AL (types, portées, références) et répond à des questions précises (« où est appelée cette procédure ? »). Plus fiable qu'une recherche texte. |
| **BCQuality** | Le corpus de **règles de qualité** AL (Microsoft + community + couche **custom** DI), interrogé via le serveur `bcquality-mcp`. |
| **Couche `custom`** | La couche du fork DI de BCQuality : les règles maison y **priment** sur celles de Microsoft. |
| **Base app** | L'application standard Business Central de Microsoft, que vos extensions viennent compléter. |
| **Symboles / `.alpackages`** | Les fichiers `.app` des dépendances (base app, etc.) nécessaires pour compiler et pour le LSP. Téléchargés via `/al-symbols`. |
| **XLIFF / `.g.xlf`** | Le format des fichiers de traduction AL. Le `.g.xlf` est généré par le compilateur ; `/translate` le synchronise vers une langue cible (ex. `fr-FR`). |
| **Affixe (préfixe / suffixe)** | Un marqueur sur les noms d'objets/champs pour éviter les collisions. En AL, les champs d'extension portent un **suffixe** (ex. `"Loyalty Tier ABC"`). |
| **DataClassification** | Propriété obligatoire sur chaque champ de table, qui catégorise la sensibilité des données (RGPD). |
| **SetLoadFields** | Optimisation : ne charger que les champs réellement utilisés lors d'une lecture de table. |
| **Test de mutation** | Technique qui modifie volontairement le code pour vérifier que les tests détectent le changement — mesure la **qualité** des tests (skill `/al-mutate`, `/verify-tests`). |
| **Work item (Azure DevOps)** | Une tâche / un élément de travail dans Azure DevOps (organisation `DynInter`), point de départ possible d'un développement. |

Un terme manque ? Demandez à l'équipe DI de l'ajouter ici.
</content>
