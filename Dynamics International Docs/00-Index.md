# Documentation — Plugin AL Development (Dynamics International)

Bienvenue. Cette documentation explique comment **installer** et **utiliser** le plugin Claude Code
`profile-al-development` pour le développement Business Central / AL chez Dynamics International.

> 🎯 **Pour qui ?** Ces guides s'adressent à toute personne de l'équipe, **même sans expérience**
> de Claude Code, des serveurs MCP ou des agents IA. Les termes techniques sont expliqués dans le
> [Glossaire](07-Glossaire.md).

## Par où commencer ?

1. **Première installation** → [01 - Installation](01-Installation.md)
2. **Comprendre comment ça marche** → [02 - Démarrage rapide](02-Demarrage-rapide.md)
3. **Lancer un vrai développement** → [03 - Cas d'usage](03-Cas-usage.md)

## Tous les documents

| # | Document | Contenu |
|---|----------|---------|
| 01 | [Installation](01-Installation.md) | Prérequis, installation de Claude Code, du plugin, des serveurs MCP et des outils CLI |
| 02 | [Démarrage rapide](02-Demarrage-rapide.md) | Le modèle « manager + agents », le dossier `.dev/`, les portes d'approbation, le routage par complexité |
| 03 | [Cas d'usage](03-Cas-usage.md) | Recettes pas-à-pas : démarrer depuis une tâche Azure DevOps, depuis une spec Word, quick fix, cycle complet |
| 04 | [Référence des skills](04-Reference-skills.md) | Les 19 commandes `/…` : à quoi elles servent et quand les utiliser |
| 05 | [MCP et outils](05-MCP-et-outils.md) | Ce que fait chaque serveur MCP et le serveur de langage AL, en langage simple |
| 06 | [Dépannage / FAQ](06-Depannage-FAQ.md) | Les pannes courantes et comment les régler |
| 07 | [Glossaire](07-Glossaire.md) | Définitions : MCP, skill, agent, `.dev/`, XLIFF, affixe… |

## En une phrase

Le plugin transforme Claude Code en **équipe de développement AL** : vous décrivez un besoin, et
le « manager » (la session principale) délègue le travail à des agents spécialisés (architectes,
développeurs, relecteurs, testeurs), tout en s'appuyant sur la documentation Microsoft, le code
source de Business Central et les règles de qualité — puis livre du code compilé, testé, traduit
et documenté.
</content>
