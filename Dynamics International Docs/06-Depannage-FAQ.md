# 06 — Dépannage / FAQ

Les problèmes les plus fréquents et comment les régler. Cherchez votre symptôme.

---

## Les commandes `/plan`, `/develop`… n'apparaissent pas

1. Vérifiez que le marketplace est ajouté : `claude plugin marketplace list` doit montrer
   `di-claude-configs` (voir [Installation §3](01-Installation.md)).
2. Vérifiez que le plugin est activé (`/plugin`, ou `"profile-al-development@di-configs": true`
   dans le `.claude/settings.json` du projet).
3. Si vous utilisez le clone local (méthode B), vérifiez que `path` pointe vers le dossier
   contenant `.claude-plugin/marketplace.json`.
4. **Relancez la session** Claude Code (les skills/agents ne se rechargent pas à chaud).
5. Lancez `/config` pour voir les plugins chargés.

---

## Un serveur MCP ne fonctionne pas

- **Node.js manquant** : les serveurs en `npx` (al-mcp-server, bc-source-mcp, bcquality-mcp,
  nab-al-tools) nécessitent Node 20+. Vérifiez `node --version`.
- **« Executable not found »** pour `bc-code-intelligence-mcp` ou `alcops` : ces deux-là doivent être
  installés globalement (`npm install -g …`, voir [Installation §5](01-Installation.md)).
- Lancez `/config` pour voir l'état des serveurs MCP.
- Premier lancement d'un serveur `npx` : il télécharge le package, soyez patient.

---

## `launchlspserver` introuvable / le LSP AL ne démarre pas

Votre outil `al` est trop ancien. Mettez-le à jour :

```powershell
dotnet tool update --global Microsoft.Dynamics.BusinessCentral.Development.Tools
al --help        # doit maintenant lister « launchlspserver »
```

La commande existe à partir de **BC 2026 wave 1**. Au premier démarrage, le LSP charge les symboles
et peut être **lent** (c'est pourquoi `.lsp.json` prévoit un `startupTimeout` de 5 min).

---

## La compilation échoue : symboles manquants

Téléchargez les packages de symboles des dépendances :

- via le plugin : `/al-symbols` ;
- ou dans VS Code : commande `AL: Download Symbols`.

`al-compile` et le LSP AL en ont besoin pour fonctionner pleinement.

---

## `al-compile` : commande introuvable

L'outil n'est pas sur le `PATH`. Réinstallez depuis le dépôt et relancez le script d'installation
(`install.ps1` sous Windows), puis ouvrez un **nouveau** terminal. Voir
[Installation §6](01-Installation.md).

---

## `/translate` : « pas de fichier .g.xlf »

Le compilateur ne génère le fichier de traduction que si c'est activé dans `app.json`. Ajoutez la
fonctionnalité de fichier de traduction (`"features": ["TranslationFile"]` / génération des
captions), recompilez (`/compile`), puis relancez `/translate`.

---

## Démarrer depuis Azure DevOps : « je n'accède pas à la tâche »

Le serveur MCP Azure DevOps doit être configuré (organisation `DynInter`), en général dans vos
réglages **utilisateur** Claude Code (`~/.claude/…`), pas dans le plugin. Vérifiez avec `/config`,
et assurez-vous d'être authentifié auprès d'Azure DevOps.

---

## Les règles « custom » DI de BCQuality ne s'appliquent pas

Le serveur clone la **branche par défaut** du fork `DynamicsInternational/BCQuality`. Si vos règles
maison sont restées **en local non poussées** ou sur une autre branche, elles ne sont pas vues.
Poussez-les sur la branche par défaut, puis le serveur les prendra (avec priorité sur Microsoft).

---

## Réinitialiser le travail d'une tâche

Le travail vit dans `.dev/<tâche>/`. Pour repartir de zéro sur une tâche, supprimez son dossier
(gardez `.dev/project-context.md`, qui est partagé).

---

## Autre question ?

- Comprendre un terme → [07 - Glossaire](07-Glossaire.md).
- Réinstaller → [01 - Installation](01-Installation.md).
</content>
