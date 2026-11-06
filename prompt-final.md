# Exercice 7 — Prompt unique pour générer le jeu complet

## Prompt final : 

Tu es un développeur web front-end expérimenté.

Contexte

Je construis un jeu des Tours de Hanoï pour un projet pédagogique. Il doit fonctionner en ouvrant directement `index.html` dans un navigateur moderne. Le projet est constitué exclusivement de trois fichiers : `index.html`, `style.css` et `script.js`. L’interface et les messages sont en français.

Objectif

Génère le jeu complet, de la page minimale au jeu jouable avec les fonctionnalités ci-dessous.

Fonctionnalités demandées

1. Interface et démarrage
   - Affiche un champ numérique `#nb-anneaux`, avec `min="1"`, `max="8"` et `value="3"`, ainsi que les boutons « Démarrer », « Démo automatique », « Reset » et un bouton de bascule entre thème clair et sombre.
   - Affiche un plateau `#plateau` contenant trois tours de classe `.tour`.
   - Au clic sur « Démarrer », crée le nombre d’anneaux demandé sur la première tour, avec le plus grand à la base et des largeurs décroissantes vers le sommet. Un nouveau clic démarre une nouvelle partie et remet à zéro le compteur, le score et les messages.
   - Valide la saisie : seules les valeurs entières de 1 à 8 sont acceptées ; une valeur vide ou hors limites ne doit pas démarrer la partie.

2. État et rendu
   - Conserve l’état du jeu dans une structure JavaScript contenant trois piles de tailles d’anneaux. L’état JavaScript est la source de vérité ; le DOM ne doit pas servir à déduire la position ou la taille des anneaux.
   - Implémente `rendre()` pour reconstruire ou mettre à jour l’affichage à partir de l’état, même si le contenu initial du plateau dans le DOM est absent ou incorrect.
   - Ne code pas les anneaux individuellement en dur dans le HTML : ils sont générés en fonction du nombre choisi.

3. Déplacements manuels
   - Seul l’anneau au sommet d’une tour peut être sélectionné. Signale la sélection par une surbrillance agréable et une légère élévation.
   - Au clic suivant sur une autre tour, déplace l’anneau sélectionné si le coup est légal. Un anneau plus grand ne peut jamais être posé sur un anneau plus petit ; ce coup est refusé avec un retour visuel et sans modifier l’état. Le déplacement vers une tour vide est autorisé.
   - Un clic sur la tour de départ annule la sélection.
   - Implémente `deplacementValide(de, vers)` pour vérifier les règles à partir de l’état, sans accéder au DOM ni le modifier.

4. Animations
   - Lors d’un déplacement, anime une trajectoire en trois phases : l’anneau se soulève au-dessus des tours, glisse horizontalement, puis redescend à sa place sur la tour d’arrivée.
   - Utilise l’API Web Animations `element.animate()` et `transform` pour cette trajectoire. Respecte `prefers-reduced-motion`.
   - Réutilise la même animation pour les déplacements manuels et la démo.

5. Compteur, victoire et score
   - Affiche un compteur de coups, initialisé à zéro. Incrémente-le uniquement après un déplacement légal, en jeu manuel comme pendant la démo.
   - Détecte la victoire quand tous les anneaux de la partie sont empilés sur la troisième tour, du plus grand à la base au plus petit au sommet. Affiche un message de félicitations.
   - À la victoire, affiche un score en pourcentage calculé par `nombreMinimumDeCoups / nombreCoupsJoues * 100`. Le minimum doit être obtenu avec `resoudre(n, 0, 2, 1).length` et correspond à `2  n - 1`. Affiche clairement le score et le nombre de coups minimum et joués.
   - Efface le message de victoire et le score si la partie recommence ou si l’état n’est plus gagnant.

6. Démonstration automatique
   - Implémente `resoudre(n, de, vers, via)` comme fonction récursive pure : elle renvoie une liste de couples `[de, vers]` et ne modifie ni l’état du jeu ni le DOM.
   - Implémente séparément une fonction qui rejoue cette liste coup par coup, met à jour l’état et le rendu, incrémente le compteur, et attend chaque animation ou un délai entre les coups.
   - Le bouton « Démo automatique » démarre toujours depuis une nouvelle partie et termine avec tous les anneaux sur la troisième tour.
   - Vérifie que `resoudre(3, 0, 2, 1).length` vaut `7` et que `resoudre(5, 0, 2, 1).length` vaut `31`.
   - Pendant la démo, désactive le champ numérique et les boutons « Démarrer » et « Démo automatique », et empêche les interactions sur le plateau. Laisse toutefois le bouton « Reset » actif afin que l’utilisateur puisse interrompre la démo.

7. Réinitialisation
   - Le bouton « Reset » vide les trois tours et remet le compteur à zéro ; il efface la sélection, le score, le message de victoire et le statut de démo.
   - Reset doit aussi interrompre une démo en cours, annuler ses animations et délais, empêcher l’exécution des coups restants et réactiver les commandes. Une nouvelle démo doit pouvoir être lancée après Reset.

8. Thème clair et sombre
   - Le bouton de thème bascule toute la page entre un thème clair et un thème sombre lisibles.
   - Conserve le choix dans `localStorage` et restaure-le au chargement de la page. Reset ne doit pas modifier le thème choisi.
   - Mets à jour le libellé et le nom accessible du bouton selon l’action proposée.

Contraintes techniques et architecture

- Utilise uniquement HTML, CSS et JavaScript natifs : aucun framework, aucune bibliothèque, aucun module ES.
- Sépare strictement le HTML, le CSS et le JavaScript dans les trois fichiers demandés. Le HTML charge `style.css` et `script.js`.
- Sépare l’état du jeu de son affichage : les règles et les déplacements opèrent sur les piles JavaScript ; `rendre()` affiche l’état.
- Sépare `resoudre()` du rejouer animé : `resoudre()` calcule les coups sans effet de bord ; une autre fonction les exécute et gère le rendu, les délais et les animations.
- Garde des identifiants stables : `plateau`, `nb-anneaux`, `btn-demarrer`, `btn-demo` et `btn-reset`.
- Préserve le fonctionnement lorsque le DOM initial du plateau est incomplet ou incorrect ; ne prends pas le DOM pour source de vérité.
- Utilise des noms explicites, une interface accessible (labels, retours annoncés et contrôles clavier usuels) et du code lisible.
- N’ajoute pas de dépendances, de fichiers supplémentaires, de logique serveur ni de fonctionnalités sans rapport.

Format de réponse attendu

Fournis uniquement le contenu complet et directement exécutable de ces trois fichiers, dans cet ordre :

1. `index.html`
2. `style.css`
3. `script.js`

Présente chaque fichier dans son propre bloc de code, précédé de son nom. N’ajoute ni explication ni texte en dehors des trois blocs.
