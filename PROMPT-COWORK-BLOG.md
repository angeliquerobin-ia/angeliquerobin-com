# Prompt pour publier un article de blog

À donner à un cowork ayant accès (1) au dossier du repo `angeliquerobin-com` et (2) au dossier des photos de couverture.

---

Tu vas publier un nouvel article sur le blog du site angeliquerobin.com (dossier fourni). Le blog existe déjà avec 3 articles de référence : `blog-cadeau-mal-emballe.html`, `blog-eveil-entrepreneuriat.html`, `blog-10-jours.html`, plus la page d'index `blog.html`. **Lis ces 4 fichiers en entier avant de commencer** : ce sont tes gabarits, reproduis exactement leur structure HTML, leurs classes CSS et leur style d'écriture (tutoiement, ton intime, pas d'emoji).

Angélique va te fournir le texte brut du nouvel article, avec :
- un titre et éventuellement un sous-titre
- parfois des notes entre crochets du type `[lien vers Lotus]` ou `[lien vers coaching de vie]` à l'endroit où elle veut un lien interne

## Étapes à suivre

**1. Choisir la catégorie**
Catégories existantes : Relations, Entrepreneuriat, Transition de vie. Choisis la plus pertinente selon le sujet de l'article. Si aucune ne convient vraiment, tu peux en proposer une nouvelle — dans ce cas ajoute aussi un bouton de filtre correspondant dans `blog.html` (section `.blog-filters`), et demande confirmation à Angélique avant de continuer si le choix n'est pas évident.

**2. Créer le nom de fichier**
Un slug court en minuscules à partir du titre, format `blog-<slug>.html` (ex. `blog-peur-du-jugement.html`).

**3. Structurer le texte pour le SEO**
Découpe le corps de l'article en 3 à 5 sections avec des titres `<h2>` (classe déjà stylée dans le CSS des articles existants — ne pas la redéfinir, juste utiliser `<h2>` dans `.article-body`). Les H2 doivent être courts, refléter le contenu de la section, jamais génériques ("Introduction", "Conclusion").

**4. Poser les liens internes**
Remplace chaque note `[lien vers X]` par un vrai lien `<a href="...">texte</a>` sur les mots pertinents du paragraphe (jamais "clique ici"). Table de correspondance :
- Lotus → `lotus.html`
- Coaching de vie → `coaching-de-vie.html`
- Coaching d'impact → `coaching-impact.html`
- Podcast / Chroniques Cosmiques → `podcast.html`
- Qui suis-je → `qui-suis-je.html`
- Contact → `contact.html`
- Un autre article de blog → `blog-<slug-de-cet-article>.html`

Si Angélique n'a pas laissé assez de notes de liens (moins de 2 dans le texte), ajoute toi-même 1 ou 2 liens naturels vers une page du site pertinente au sujet, sans forcer.

Ajoute aussi, juste avant la section "À lire aussi" en fin d'article, un petit encart `.article-cta` (voir gabarit `blog-cadeau-mal-emballe.html` ou `blog-eveil-entrepreneuriat.html`) qui renvoie vers une offre pertinente (Lotus, coaching d'impact, contact...) — **sauf si le sujet est personnel/sensible** (deuil, épreuve intime), auquel cas ne mets pas d'encart commercial, comme dans `blog-10-jours.html`.

**5. Calculer le temps de lecture**
Compte les mots du corps de l'article (texte visible, hors balises), divise par 200, arrondis à l'entier le plus proche (minimum 1). Ajoute-le dans la ligne kicker en haut de l'article, après la date : `Catégorie · date · X min de lecture` (voir gabarit exact dans les articles existants).

**6. Ajouter la photo de couverture**
Dans le dossier d'images fourni, trouve la photo destinée à cet article (Angélique te dira laquelle, ou le nom de fichier sera explicite). Copie-la dans `assets/blog-<slug>.<extension d'origine>` (garde jpg/png/webp tel quel, ne convertis pas). Pas besoin de recadrer : les cards utilisent `object-fit: cover` sur un cadre 4:3, n'importe quelle taille d'image convient (idéalement 1000px de large minimum).

**7. Créer la page article**
Nouveau fichier `blog-<slug>.html`, copié depuis un des 3 gabarits en remplaçant : title/meta/canonical/JSON-LD, la nav (déjà identique partout, ne pas y toucher sauf le lien "Blog" actif), le hero (kicker+H1+sous-titre+temps de lecture), le corps avec H2 et liens, l'encart CTA si pertinent, et la section "À lire aussi" (lien vers les 2 articles les plus récents, différents de celui-ci).

**8. Ajouter la card sur `blog.html`**
Nouvelle `<a class="blog-card" href="blog-<slug>.html" data-category="...">` avec l'image, le tag de catégorie, le titre, un extrait (1-2 phrases tirées de l'accroche), la date, et le CTA "Lire l'article →". Insère-la en premier dans la grille (les articles les plus récents en premier).

**9. Mettre à jour les autres articles**
Dans les 2 articles les plus récents précédents, mets à jour leur section "À lire aussi" pour inclure ce nouvel article si pertinent (remplace le plus ancien des deux liens existants).

**10. Mettre à jour `sitemap.xml`**
Ajoute une entrée pour `blog-<slug>.html` (copie le format des entrées blog existantes, `changefreq: yearly`, `priority: 0.5`).

**11. Vérifier avant publication**
Lance un serveur local (`python3 -m http.server` dans le dossier du repo), ouvre `blog.html` et le nouvel article dans un navigateur, vérifie qu'il n'y a pas d'erreur console, que l'image s'affiche, que les liens internes fonctionnent, que le filtre de catégorie inclut bien le nouvel article.

**12. Publier**
`git add` des fichiers modifiés/créés (n'ajoute jamais de fichier de config local type `.claude/`), commit avec un message clair en français, puis `git push origin main`. Le déploiement (Coolify) se déclenche automatiquement au push — pas d'étape manuelle supplémentaire.

**13. Notifier Angélique**
Une fois publié, résume-lui en quelques lignes : titre de l'article, catégorie assignée, temps de lecture calculé, liens internes posés (et vers quoi), et confirmation que c'est en ligne.

## Règles à respecter
- Ne jamais copier le style de couleurs d'un exemple externe qu'elle pourrait montrer — la charte du site (taupe, marron, crème, Playfair/Anonymous Pro, jamais de Parisienne) est fixée, ne pas en dévier.
- Ne jamais inventer de contenu dans l'article : ne reformule pas son texte, structure-le seulement.
- Si une information manque pour avancer (catégorie ambiguë, photo introuvable, note de lien peu claire), demande avant de deviner.
