# 02 — Démarrage rapide

Ce guide explique **comment le plugin pense**, pour que vous sachiez quoi attendre. Lisez-le une
fois ; ensuite, passez aux [Cas d'usage](03-Cas-usage.md).

---

## L'idée centrale : un manager + une équipe d'agents

Quand vous parlez à Claude Code avec ce plugin, la session principale agit comme un
**manager d'ingénierie**. Elle **n'écrit pas le code elle-même** : elle délègue à des **agents
spécialisés** lancés en parallèle, puis synthétise leur travail pour vous.

```
Vous décrivez un besoin
        │
   Le manager classe la complexité, puis lance la bonne étape
        │
   /plan      → 2-3 architectes proposent des designs concurrents → le manager tranche
        │ (vous approuvez)
   /develop   → N développeurs codent en parallèle → 4 relecteurs (sécurité, expert AL, perf, tests)
        │ (vous approuvez)
   /test      → 4 testeurs en parallèle → /verify-tests (vérification adverse)
        │
   /translate → traduction FR (fin de cycle)
```

À chaque étape importante, le manager **s'arrête et vous demande votre accord** (« porte
d'approbation »). Vous gardez le contrôle.

---

## Le dossier `.dev/` : la mémoire du travail

Les agents **écrivent dans des fichiers**, pas seulement dans le chat. Chaque tâche a son dossier :

```
.dev/
├── project-context.md            ← mémoire partagée du projet (créée par /init-context)
└── <nom-de-la-tâche>/
    ├── 01-requirements.md         ← le besoin
    ├── 02-solution-plan.md        ← le plan (avec les règles BCQuality appliquées)
    ├── 03-code-review.md          ← la revue de code
    ├── 05-test-plan.md            ← les tests
    ├── 06-test-verification.md    ← la vérification adverse des tests
    └── 07-translation.md          ← le résumé de traduction
```

Avantage : la conversation reste lisible, et vous avez une **trace complète** de chaque décision.

> 💡 **À faire une fois par projet :** lancez `/init-context`. Cela crée `project-context.md`
> (plages d'ID d'objets, préfixe, dépendances, conventions) et **accélère tous les workflows de
> 40 à 60 %**.

---

## Le routage par complexité

Le manager adapte l'effort à la taille de la tâche. Vous pouvez le laisser choisir, ou forcer une
commande.

| Complexité | Exemple | Ce qui est lancé |
|------------|---------|------------------|
| **TRIVIAL** | 1 fichier, correction évidente | `/fix` |
| **SIMPLE** | 2-3 fichiers, pattern connu | `/fix` ou `/plan` → `/develop` |
| **MEDIUM** | 4-8 fichiers, décisions de design | `/plan` → `/develop` |
| **COMPLEX** | 9+ fichiers, nouvelle architecture | `/interview` → `/plan` → `/develop` → `/test` |

---

## Les garde-fous automatiques

Sans rien demander, le plugin applique en permanence :

- des **règles AL** de fond (architecture, nommage, principes d'ingénierie) — voir le dossier `rules/` ;
- les **règles de qualité BCQuality** (officielles Microsoft + standards DI) consultées et **citées**
  à chaque design, génération de code et revue ;
- une **compilation automatique** en fin de tour (hook) pour détecter les erreurs tout de suite ;
- la **navigation sémantique** du code via le serveur de langage AL (plus fiable qu'une recherche texte).

---

## Vos premières commandes

- `/init-context` — à lancer une fois par projet.
- `/plan "décris ton besoin"` — concevoir une solution.
- `/develop` — implémenter le plan approuvé.
- `/fix "décris le bug"` — correction rapide.
- `/compile` — compiler.

La liste complète : [04 - Référence des skills](04-Reference-skills.md).
Des recettes concrètes : [03 - Cas d'usage](03-Cas-usage.md).
</content>
