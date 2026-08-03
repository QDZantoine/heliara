# Heliara

Site vitrine et portfolio du studio Heliara, avec son back-office de contenu.

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · MariaDB · stockage compatible S3.

---

## Démarrer

Prérequis : **Node.js 22**, **pnpm 10**, et **Docker** pour la base et le stockage local.

```bash
pnpm install
cp .env.example .env      # puis compléter les valeurs marquées « à remplacer »
pnpm db:up                # MariaDB + stockage objet, en conteneurs
pnpm db:migrate           # schéma, procédures, privilèges
pnpm db:seed              # contenu de départ, depuis le dépôt
pnpm admin:create         # premier compte du back-office
pnpm dev:both             # site sur :3000, administration sur :3001
```

`.env` n'est pas versionné. `.env.example` liste toutes les variables attendues et décrit
la forme de chacune ; aucune valeur réelle n'y figure.

---

## Commandes

| Commande         | Ce qu'elle fait                                             |
| ---------------- | ----------------------------------------------------------- |
| `pnpm dev:both`  | les deux processus, journaux préfixés                       |
| `pnpm dev`       | le site public seul                                         |
| `pnpm lint`      | eslint                                                      |
| `pnpm typecheck` | `tsc --noEmit`                                              |
| `pnpm test`      | vitest - unitaires, DOM, et intégration base                |
| `pnpm build`     | build de production                                         |
| `pnpm format`    | prettier                                                    |
| `pnpm og`        | vérifie les cartes de partage d'un site en marche           |

Base et contenu :

| Commande                | Ce qu'elle fait                                                  |
| ----------------------- | ---------------------------------------------------------------- |
| `pnpm db:up` / `db:down`| démarre / arrête les conteneurs, volumes conservés                |
| `pnpm db:migrate`       | rejoue schéma, procédures **et** privilèges                      |
| `pnpm db:seed`          | amorce le contenu depuis le dépôt, idempotent                    |
| `pnpm db:export`        | exporte le contenu réel : données + fichiers déposés             |
| `pnpm db:import`        | rejoue un export ailleurs, en vérifiant ses comptes              |
| `pnpm db:reset`         | **détruit les volumes** et repart de zéro                        |

Avant de committer : `pnpm lint && pnpm typecheck && pnpm build`.

---

## Comment c'est construit

**Deux processus, un seul build.** Le même artefact sert le site public et
l'administration ; ils ne diffèrent que par la variable `HELIARA_ROLE`. Sur le déploiement
public, tout ce qui commence par `/admin` répond 404.

**La base est accédée exclusivement par procédures stockées.** Aucune requête SQL n'est
écrite côté application. Les deux comptes applicatifs n'ont aucun droit de table : le
compte du site public ne peut exécuter qu'une quinzaine de procédures de lecture, nommées
une par une. C'est ce qui borne les dégâts d'une injection réussie, et c'est vérifié par un
test d'intégration.

**Le contenu vient de la base, avec repli sur le dépôt.** Six collections sont
administrables - réalisations, articles, expertises, références clientes, équipe,
témoignages. Si la base ne répond pas, le site sert la version figée de `lib/content/`
plutôt que des pages vides.

**Les fichiers ne traversent jamais l'application.** Un dépôt d'image passe par une URL
présignée : le navigateur envoie l'octet directement au stockage objet.

---

## Structure

```text
app/                routes App Router ; app/admin pour le back-office
components/         layout, primitives, sections, blocs de page, visuels, admin
lib/                accès base, schémas de validation, contenu de repli, SEO
db/init/            schéma et procédures, joués dans l'ordre des numéros
docs/               déploiement, plan du back-office, brief de rédaction
tests/              unitaires, DOM, intégration base
```

---

## Documentation

| Fichier                     | Pour qui                                                   |
| --------------------------- | ---------------------------------------------------------- |
| `CLAUDE.md`                 | conventions du projet, pièges, décisions actées            |
| `docs/deploiement.md`       | **l'équipe d'infrastructure** : services, variables, ordre |
| `docs/plan-admin.md`        | avancement et décisions du back-office                     |
| `docs/brief-realisation.md` | rédiger une fiche de réalisation                           |
| `.claude/skills/`           | guides chargés à la demande : back-office, SEO, animations  |

---

## Accessibilité et performance

Niveau AA visé : contrastes vérifiés à la mesure, focus visible, cibles tactiles de 44 px,
un seul `h1` par page, et `prefers-reduced-motion` qui neutralise tout mouvement. Le
contenu reste lisible sans JavaScript, à l'exception du formulaire de contact - qui affiche
alors une adresse e-mail et un téléphone.

---

Code privé, tous droits réservés. **Heliara est une marque d'Hexceos SARL**, qui édite le
site et détient le code - voir les mentions légales du site pour l'identification complète
de l'éditeur.
