# Une vie plus grande — Système visuel

Système de design de la créatrice **Andélique** pour ses contenus **Instagram** (carrousels 1080×1350) et **YouTube** (miniatures 1280×720, bannière 2560×1440). L'esthétique est **douce, féminine et littéraire** : livres, fleurs, nature, matcha, café, mer, campagne, miroir.

Point clé de la marque : **aucun nom de marque fixe**. Le label du haut de chaque slide porte la *thématique* du post (« La compassion », « Ralentir »…), jamais un logo ou un nom commercial. Il n'y a donc **pas de logo** dans ce système — le nom « une vie plus grande » est rendu en type (Parisienne + Anonymous Pro) là où une signature est utile.

## Source
- `uploads/design-system-une vie plus grande.png` — planche de référence du système visuel (palette, typographies, accords de titre, règles, formats de templates). Fournie par l'utilisatrice. Tout ce document en découle.
- Aucun codebase, Figma ou lien externe fourni. Aucune inférence hors de la planche.

## Fontes
Trois familles, **toutes disponibles sur Google Fonts** — aucune substitution nécessaire :
- **Playfair Display** — titres (serif éditoriale, normal & italique)
- **Anonymous Pro** — corps & labels (monospace, regular & bold)
- **Parisienne** — accent manuscrit (script, à doser)

Elles sont chargées depuis le CDN Google Fonts dans `tokens/fonts.css` (via `@import`). Le compilateur indexe les webfonts par règles `@font-face` ; comme le chargement passe par `@import`, il rapporte « 0 fonts », mais **le rendu est correct** pour tous les consommateurs. Pour un usage 100 % hors-ligne, remplacer l'`@import` par des `@font-face` locaux pointant vers des binaires copiés dans `assets/fonts/`.

---

## CONTENT FUNDAMENTALS — comment on écrit

- **Langue** : français, avec des titres parfois en anglais littéraire (ex. « Do you hold yourself the same way you hold those you love? »). Ton intime, poétique, jamais commercial.
- **Voix** : le **tu** (adresse directe et douce), et le **on** collectif (« On ne se répare pas », « On laisse poser »). Peu de « je ».
- **Tonalité** : introspective, apaisante, encourageante. Développement personnel féminin, sans injonction agressive. On invite, on ne prescrit pas.
- **Label du haut** : une thématique courte en **MAJUSCULES espacées** (`letter-spacing` large), centrée — « LA COMPASSION », « RALENTIR ». Jamais un nom de marque.
- **Casse** : les titres Playfair sont en casse de phrase (pas de capitales). Seuls les labels et certains mots-signature (« GRANDE ») sont en majuscules.
- **Accentuation** : dans les titres, les mots forts passent en **italique** (Playfair) — jamais en gras. Dans le corps (Anonymous Pro), on **surligne en gras 1 à 3 mots** maximum.
- **Longueur** : peu de texte par slide. Beaucoup de vide. « On laisse poser. »
- **Emoji** : **aucun**. Pas d'emoji, pas d'icônes décoratives.
- **Exemples de copie** : « La compassion commence en soi. » · « Reste douce avec celle que tu deviens. » · « Tu as le droit de ralentir sans te justifier. » · signature « une vie plus grande ».

---

## VISUAL FOUNDATIONS

- **Couleurs** : palette de 8 teintes douces et désaturées, extraites de photos (voir `tokens/colors.css`). Fonds nature/profonds — Sauge `#899273`, Vert forêt `#2A3315`, Bleu ciel `#608999`, Bleu-gris `#738699`. Douceur/neutres — Taupe chaud `#9A907C`, Sable `#A19194`, Crème `#F0ECE2`, Rose chair `#E5D2C8`. **Max 1–2 fonds unis par carrousel.** L'encre de texte sombre est le vert forêt ; sur fond foncé/photo, texte crème ou blanc.
- **Typographie** : Playfair Display (titres, accents en italique), Anonymous Pro (corps 32 px, interligne large ~1.7, surlignage gras), Parisienne (signature manuscrite discrète, couvertures uniquement). Deux « accords de titre » qu'on alterne : **Accord A** (Playfair + sous-titre mono) et **Accord B** (Parisienne + « GRANDE » en mono gras, réservé aux couvertures).
- **Espacement** : très généreux. Marge de sécurité de **96 px** sur le canvas 1080×1350. Le vide est un élément de design.
- **Fonds** : aplats de couleur unie tirés de la palette, **ou** photos douces. Pas de dégradés décoratifs, pas de motifs, pas de textures. Un léger dégradé de protection (voile) est utilisé **uniquement** sur les photos pour la lisibilité.
- **Photos** : douces, naturelles, **désaturées** (`saturate ~0.72`, contraste légèrement réduit). Toujours + un **léger voile foncé** (vert forêt ~28 %) et texte **blanc** par-dessus.
- **Animation** : contenu statique (posts imprimés/exportés). Aucune animation dans les livrables. En prototype, s'en tenir à des fondus lents et discrets si nécessaire — jamais de rebond.
- **États survol/pression** : non applicables aux livrables sociaux. En prototype, préférer une légère baisse d'opacité au survol ; pas de rétrécissement brusque.
- **Bordures** : quasi absentes. Esthétique éditoriale, carrée. Les slides n'ont pas de bordure.
- **Ombres** : aucune ombre portée dans les slides. Les cartes du *système visuel* (specimens) peuvent porter un très léger arrondi (10 px) mais les slides finales sont à angles vifs (`radius 0`).
- **Coins** : `--radius-0: 0` pour les slides ; `--radius-carte: 10px` réservé aux cartes de documentation.
- **Transparence & flou** : pas de flou. Transparence uniquement pour le voile photo et l'atténuation du texte secondaire.
- **Barre de progression** (carrousels) : fine (6 px), **continue et non segmentée**, ancrée en bas de slide.
- **Vibe imagerie** : chaude et calme, tons terreux et végétaux, lumière douce, légèrement passée.

---

## ICONOGRAPHY

Le système est **délibérément sans iconographie**. Pas de jeu d'icônes, pas d'icon-font, pas de SVG décoratifs, **pas d'emoji**, pas de caractères unicode utilisés comme icônes. Le seul « ornement » est typographique : la signature manuscrite Parisienne et la barre de progression du carrousel. Si un pictogramme devient nécessaire (rare), utiliser un trait fin et discret, dans l'encre vert forêt, jamais coloré — mais par défaut, **s'en passer**. Aucun logo n'existe pour cette marque (voir en-tête).

`assets/` ne contient donc pas d'icônes : seulement `image-slot.js` (placeholder d'image glisser-déposer pour les slides photo et miniatures).

---

## Index — manifeste du dossier

**Racine**
- `styles.css` — point d'entrée global (liste d'`@import` uniquement)
- `thumbnail.html` — vignette du système
- `readme.md` — ce document · `SKILL.md` — enveloppe Agent Skill

**`tokens/`** — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`

**`components/core/`** — primitives React réutilisables :
- **TopLabel** — label thématique centré (majuscules espacées)
- **DisplayTitle** — titre Playfair, accents en italique
- **BodyText** — corps Anonymous Pro, surlignage en gras
- **ScriptAccent** — signature manuscrite Parisienne
- **ProgressBar** — barre de progression continue du carrousel
- **Slide** — cadre de slide (fond uni + marges)
- **PhotoFrame** — cadre photo désaturé + voile + texte blanc

**`guidelines/`** — cartes specimens (onglet Design System) : palette (nature, douceur, en usage), type (Playfair, Anonymous Pro, Parisienne, accords), espacement (échelle, respiration), marque (règles, photos).

**`ui_kits/`** — templates / recréations de surfaces :
- `carousel/` — Couverture, Slide de contenu, Slide de clôture, Citation sur photo, Citation fond uni (Instagram 1080×1350)
- `youtube/` — Miniature (1280×720), Bannière de chaîne (2560×1440)

**`templates/carousel/`** — `Carousel.dc.html` : gabarit de carrousel réutilisable (couverture + contenu + clôture) composé des primitives ci-dessus.

### Intentional additions
Aucun logo (la marque n'en a pas). Les primitives (`TopLabel`, `DisplayTitle`, `Slide`, etc.) ne sont pas listées telles quelles dans la planche source ; ce sont les atomes qui reconstituent fidèlement les règles et accords qu'elle définit — nécessaires pour rendre le système utilisable en code.
