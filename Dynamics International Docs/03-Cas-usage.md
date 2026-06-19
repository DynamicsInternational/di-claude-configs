# 03 — Cas d'usage (recettes pas-à-pas)

Des scénarios concrets, du plus simple au plus complet. Toutes les commandes se tapent **dans
Claude Code** (lancé avec `claude` à la racine de votre projet AL).

> 💡 Astuce : dans Claude Code, le préfixe `!` exécute une commande système (ex. `! git status`),
> et `/` lance une commande du plugin (ex. `/plan`).

---

## Cas 1 — Corriger un bug rapidement

```
/fix "La validation de l'e-mail client échoue pour les adresses avec un +"
```

Le manager classe le correctif (3 niveaux), délègue à un agent, recompile, puis vous montre :
fichiers modifiés, ce qui a été corrigé, statut de compilation. Pas de longue planification.

---

## Cas 2 — Développer à partir d'une tâche Azure DevOps

**Prérequis :** le serveur MCP Azure DevOps doit être configuré (organisation `DynInter`). Il est
généralement déjà présent dans vos réglages utilisateur Claude Code. Sinon, voir
[Dépannage](06-Depannage-FAQ.md).

### Étapes

1. Lancez Claude Code dans le projet, puis demandez en langage naturel :

   ```
   Récupère la tâche Azure DevOps #1234 et démarre le développement.
   ```

   Le manager lit la tâche via le MCP DevOps (titre, description, critères d'acceptation).

2. Selon la clarté de la tâche, il enchaîne :
   - tâche claire → `/plan` (conception) ;
   - tâche floue/complexe → `/interview` (questions de cadrage) puis `/plan`.

3. Vous **approuvez** le plan (`.dev/<tâche>/02-solution-plan.md`).
4. `/develop` implémente + fait relire le code, `/test` crée les tests, `/translate` localise.
5. À la fin, récupérez le numéro de tâche pour vos commits / le lien DevOps.

### Variante explicite

Si vous préférez piloter étape par étape :

```
/plan "Implémenter la tâche DevOps #1234 : <colle ici le titre + la description>"
```

---

## Cas 3 — Développer à partir d'une spécification dans un fichier Word

Claude Code ne lit pas le format `.docx` directement. Deux méthodes simples :

### Méthode recommandée — convertir en PDF

1. Dans Word : **Fichier → Enregistrer sous → PDF**. Placez le PDF dans le projet, par exemple
   `docs/spec-fonctionnelle.pdf`.
2. Dans Claude Code :

   ```
   Lis docs/spec-fonctionnelle.pdf puis lance /plan à partir de cette spécification.
   ```

   (Claude Code sait lire les PDF.)

### Méthode alternative — copier-coller

Si la spec est courte, lancez `/interview` et collez le contenu quand l'agent pose ses questions,
ou directement :

```
/plan "Voici la spécification : <collez le texte de la spec Word>"
```

### Ensuite

Comme pour les autres cas : approbation du plan → `/develop` → `/test` → `/translate`.

---

## Cas 4 — Cycle de développement complet (fonctionnalité neuve)

Pour une fonctionnalité importante (nouvelle architecture, plusieurs objets) :

```
/interview "Nouvelle gestion des limites de crédit par groupe de clients"
   → questions de cadrage, écrit 01-requirements.md
/plan
   → 2-3 architectes débattent, le manager écrit 02-solution-plan.md  (vous approuvez)
/develop
   → développeurs en parallèle + 4 relecteurs, écrit 03-code-review.md  (vous approuvez)
/test
   → 4 testeurs + vérification adverse (/verify-tests)
/translate
   → traduction FR des libellés (07-translation.md)
/document
   → documentation technique de la fonctionnalité
```

Tous les livrables sont dans `.dev/<tâche>/` et **citent les règles BCQuality appliquées**.

---

## Cas 5 — Juste planifier (sans coder)

```
/plan "Tableau de bord d'analyse des ventes"
```

Vous obtenez `02-solution-plan.md` à valider/partager. Vous implémenterez plus tard avec `/develop`.

---

## Cas 6 — Compiler, publier, tester manuellement

```
/compile        # compile avec les analyseurs
/run-tests      # tests rapides (al-runner) — pas besoin d'instance BC
/publish        # déploie le .app sur un serveur BC (nécessite .bcconfig.json)
```

---

## Et après ?

- La signification de chaque commande : [04 - Référence des skills](04-Reference-skills.md).
- Un problème ? [06 - Dépannage / FAQ](06-Depannage-FAQ.md).
</content>
