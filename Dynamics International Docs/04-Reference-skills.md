# 04 — Référence des skills

Les **skills** sont les commandes `/…` du plugin. En voici les 19, regroupées par usage.
Tapez `/` dans Claude Code pour les voir, ou invoquez-les directement.

> Une **skill** = une capacité que le manager peut lancer (voir [Glossaire](07-Glossaire.md)).

---

## Skills de workflow (le cœur du cycle)

| Commande | À quoi ça sert | Quand l'utiliser |
|----------|----------------|------------------|
| `/init-context` | Crée la mémoire projet (`project-context.md`) | **Une fois** par projet, avant tout |
| `/interview` | Cadrage approfondi par questions | Besoin flou ou complexe |
| `/plan` | Conception concurrente (2-3 architectes) | Avant de coder une fonctionnalité MEDIUM/COMPLEX |
| `/develop` | Implémentation en parallèle + revue 4 spécialistes | Après un plan approuvé |
| `/fix` | Correction rapide (3 niveaux) | Bug ou petit changement |
| `/test` | Suite de tests (4 testeurs en parallèle) | Après l'implémentation |
| `/verify-tests` | Vérification **adverse** des tests (mutations) | Prouver que les tests ont de la valeur |
| `/document` | Documentation technique de la fonctionnalité | En fin de cycle |
| `/translate` | Traduction XLIFF (FR par défaut) | **Fin de cycle**, lancé par `/develop` |

---

## Skills de build et de test

| Commande | À quoi ça sert | Instance BC requise ? |
|----------|----------------|------------------------|
| `/compile` | Compile le projet (`al-compile`) + analyseurs | Non |
| `/run-tests` | Exécute les tests (`al-runner` rapide / `bc-test` intégration) | Selon le mode |
| `/publish` | Déploie le `.app` sur un serveur BC (`bc-publish`) | Oui |
| `/local-bc` | Gère une instance BC locale de dev/test | — |
| `/al-symbols` | Télécharge les packages de symboles (`.app`) des dépendances | Non |
| `/al-mutate` | Test de mutation : mesure la qualité des tests | Non |

---

## Skills de connaissance et de référence

| Commande / skill | À quoi ça sert |
|------------------|----------------|
| `/bc-source` | Consulter le code source de la base app BC (toutes versions/localisations) |
| `/bcquality-citation` | Ancrer le travail dans les règles de qualité BCQuality et les **citer** |
| `build-tools` *(référence)* | Aide-mémoire du pipeline de build (chargé automatiquement) |
| `review-checklists` *(référence)* | Listes de contrôle qualité (plans, code, tests) |

---

## Enchaînements typiques

- **Petit bug** : `/fix`
- **Petite évolution** : `/plan` → `/develop`
- **Fonctionnalité moyenne** : `/plan` → `/develop` → `/test`
- **Fonctionnalité majeure** : `/interview` → `/plan` → `/develop` → `/test` → `/document`
- La **traduction** (`/translate`) et la **compilation** se déclenchent automatiquement en fin de
  `/develop`.

Voir les recettes détaillées dans [03 - Cas d'usage](03-Cas-usage.md).
</content>
