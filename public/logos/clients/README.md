# Logos clients

Un fichier par référence, nommé d'après le slug utilisé dans
`lib/content/clients.ts`.

## Ce qu'il faut

- **SVG de préférence** : net à toutes les tailles, plus léger, et il se
  désature proprement. À défaut, un PNG à fond **transparent** d'au moins
  240 px de haut.
- **Fond transparent obligatoire.** Le bandeau pose les logos sur la surface de
  la page : un logo livré sur fond blanc y dessinerait un rectangle.
- Pas de marge interne excessive. Le bandeau borne la hauteur à 32-36 px ; un
  logo entouré de 30 % de vide y paraîtra deux fois plus petit que ses voisins.

## Ce qui est attendu

| Fichier               | Référence      | Site                   |
| --------------------- | -------------- | ---------------------- |
| `be-skilled-lab.svg`  | Be Skilled Lab | https://be-skilledlab.fr |
| `yoginette.svg`       | Yoginette      | https://yoginette.fr   |
| `dk-clim.svg`         | DK Clim        | https://dk-clim.fr     |
| `bsl-portage.svg`     | BSL Portage    | https://bslportage.fr  |
| `south-clean.svg`     | South Clean    | https://southclean.fr  |
| `luundi.svg`          | Luundi         | https://luundi.fr      |
| `rabbit-web.svg`      | Rabbit Web     | https://rabbitweb.fr   |

## Avant d'en ajouter un

**L'accord du client pour être cité**, par écrit. Un logo est une marque, et
l'afficher sous « Ils nous font confiance » est une affirmation commerciale
opposable. L'accord se demande une fois et se garde.

Puis décommenter l'entrée correspondante dans `lib/content/clients.ts`. Le
bandeau apparaît dès la première entrée, en rangée fixe, et bascule tout seul
en défilement à partir de quatre.
