const champNbAnneaux = document.getElementById("nb-anneaux");
const boutonDemarrer = document.getElementById("btn-demarrer");
const boutonDemo = document.getElementById("btn-demo");
const boutonReset = document.getElementById("btn-reset");
const boutonTheme = document.getElementById("btn-theme");
const statutDemo = document.getElementById("statut-demo");
const affichageNbCoups = document.getElementById("nb-coups");
const messageVictoire = document.getElementById("message-victoire");
const affichageScore = document.getElementById("score");

if (
  !champNbAnneaux ||
  !boutonDemarrer ||
  !boutonDemo ||
  !boutonReset ||
  !boutonTheme ||
  !statutDemo ||
  !affichageNbCoups ||
  !messageVictoire ||
  !affichageScore
) {
  throw new Error("Un élément de commande ou le statut de la démonstration est introuvable.");
}

let etat = [[], [], []];
let nombreCoups = 0;
let tourSelectionnee = null;
let tourInvalide = null;
let minuterieRetourVisuel = null;
let demoEnCours = false;
let controleurDemo = null;
let generationDemo = 0;
let animationDemo = null;
let minuterieDemo = null;
let noeudsTours = [];
const noeudsAnneaux = new Map();
let indicesTours = new WeakMap();
let anneauxRendus = new WeakMap();
const delaiDemo = 300;
const cleTheme = "hanoi-theme";

/**
 * Applique le thème choisi et met à jour le libellé accessible du bouton.
 * @param {"light" | "dark"} theme Thème à appliquer.
 * @returns {void}
 */
function appliquerTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const themeSuivant = theme === "dark" ? "light" : "dark";
  boutonTheme.textContent = `Mode ${themeSuivant === "dark" ? "sombre" : "clair"}`;
  boutonTheme.setAttribute(
    "aria-label",
    `Activer le mode ${themeSuivant === "dark" ? "sombre" : "clair"}`,
  );
}

const themeEnregistre = localStorage.getItem(cleTheme);
appliquerTheme(themeEnregistre === "dark" ? "dark" : "light");

/**
 * Bascule le thème et mémorise le choix dans le stockage local.
 * @returns {void}
 */
function basculerTheme() {
  const nouveauTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(cleTheme, nouveauTheme);
  appliquerTheme(nouveauTheme);
}

boutonTheme.addEventListener("click", basculerTheme);

/**
 * Affiche dans la page le nombre de coups joués.
 * @returns {void}
 */
function mettreAJourCompteur() {
  affichageNbCoups.textContent = String(nombreCoups);
}

/**
 * Vérifie si tous les anneaux sont empilés dans le bon ordre sur la troisième tour.
 * @returns {boolean} Vrai si la partie est gagnée.
 */
function partieGagnee() {
  const nombreAnneaux = etat.reduce((total, pile) => total + pile.length, 0);
  const pileDestination = etat[2];

  return (
    nombreAnneaux > 0 &&
    pileDestination.length === nombreAnneaux &&
    pileDestination.every((taille, index) => index === 0 || pileDestination[index - 1] > taille)
  );
}

/**
 * Affiche les félicitations et le score lorsque la partie est gagnée.
 * @returns {void}
 */
function verifierVictoire() {
  if (partieGagnee()) {
    const nombreAnneaux = etat[2].length;
    const coupsMinimum = resoudre(nombreAnneaux, 0, 2, 1).length;
    const scorePourcent = ((coupsMinimum / nombreCoups) * 100).toLocaleString("fr-FR", {
      maximumFractionDigits: 2,
    });

    messageVictoire.textContent = `Félicitations ! Vous avez résolu les Tours de Hanoï en ${nombreCoups} coups !`;
    affichageScore.textContent = `Score : ${scorePourcent} % (${coupsMinimum} coups minimum / ${nombreCoups} joués)`;
  } else {
    messageVictoire.textContent = "";
    affichageScore.textContent = "";
  }
}

/**
 * Récupère le plateau ou le recrée si le DOM ne contient pas un élément valide.
 * @returns {HTMLDivElement} Élément du plateau prêt à recevoir les tours.
 */
function obtenirPlateau() {
  let plateau = document.getElementById("plateau");

  if (plateau && plateau.tagName !== "DIV") {
    plateau.remove();
    plateau = null;
  }

  if (!plateau) {
    plateau = document.createElement("div");
    plateau.id = "plateau";
    const conteneur = document.querySelector("main") || document.body;
    conteneur.append(plateau);
  }

  plateau.classList.add("plateau");
  plateau.setAttribute("aria-label", "Plateau des Tours de Hanoï");

  return plateau;
}

/**
 * Récupère les trois tours du plateau ou les recrée si sa structure est incorrecte.
 * @param {HTMLDivElement} plateau Élément contenant les tours.
 * @returns {HTMLDivElement[]} Les trois éléments représentant les tours.
 */
function obtenirTours(plateau) {
  const toursExistantes = Array.from(plateau.children);
  const structureValide =
    toursExistantes.length === etat.length &&
    toursExistantes.every((tour) => tour.tagName === "DIV" && tour.classList.contains("tour"));

  if (structureValide) {
    noeudsTours = toursExistantes;
  } else {
    noeudsTours = etat.map(() => document.createElement("div"));
    plateau.replaceChildren(...noeudsTours);
  }

  return noeudsTours;
}

/**
 * Reconstruit l’affichage du plateau à partir de l’état JavaScript.
 * @returns {void}
 */
function rendre() {
  const plateau = obtenirPlateau();
  const tours = obtenirTours(plateau);
  indicesTours = new WeakMap();
  anneauxRendus = new WeakMap();

  tours.forEach((tour, indexTour) => {
       tour.className = "tour";
       tour.setAttribute("aria-label", `Tour ${indexTour + 1}`);
       indicesTours.set(tour, indexTour);

       const anneaux = etat[indexTour].map((taille, indexAnneau) => {
           let anneau = noeudsAnneaux.get(taille);

           if (!anneau) {
             anneau = document.createElement("div");
             noeudsAnneaux.set(taille, anneau);
           }

           const estSommet = indexAnneau === etat[indexTour].length - 1;
           anneau.className = "anneau";
           anneau.setAttribute("aria-label", `Anneau de taille ${taille}`);
           anneau.style.width = `${28 + taille * 8}%`;
           anneau.style.backgroundColor = `hsl(${210 + taille * 12} 65% 52%)`;

           if (estSommet) {
             anneau.classList.add("selectionnable");

             if (tourSelectionnee === indexTour) {
               anneau.classList.add("selectionne");
             }
           }

           anneauxRendus.set(anneau, { indexTour, taille });
           return anneau;
       });

    const contenuInchange =
       tour.children.length === anneaux.length &&
       anneaux.every((anneau, index) => tour.children[index] === anneau);

      if (!contenuInchange) {
        tour.replaceChildren(...anneaux);
      }

      if (tourInvalide === indexTour) {
        tour.classList.add("coup-invalide");
      }
  });
}

/**
 * Vérifie si le sommet d’une tour peut être déposé sur une autre tour.
 * @param {number} de Indice de la tour de départ.
 * @param {number} vers Indice de la tour d’arrivée.
 * @returns {boolean} Vrai si le déplacement respecte les règles du jeu.
 */
function deplacementValide(de, vers) {
  if (
    !Number.isInteger(de) ||
    !Number.isInteger(vers) ||
    de < 0 ||
    vers < 0 ||
    de >= etat.length ||
    vers >= etat.length ||
    de === vers ||
    !Array.isArray(etat[de]) ||
    !Array.isArray(etat[vers])
  ) {
    return false;
  }

  const pileDepart = etat[de];
  const pileArrivee = etat[vers];

  if (pileDepart.length === 0) {
    return false;
  }

  if (pileArrivee.length === 0) {
    return true;
  }

  return pileDepart[pileDepart.length - 1] < pileArrivee[pileArrivee.length - 1];
}

/**
 * Calcule récursivement la liste minimale des coups pour déplacer les anneaux.
 * @param {number} n Nombre d’anneaux à déplacer.
 * @param {number} de Indice de la tour de départ.
 * @param {number} vers Indice de la tour d’arrivée.
 * @param {number} via Indice de la tour intermédiaire.
 * @returns {number[][]} Liste ordonnée de couples [de, vers].
 * @throws {RangeError} Si le nombre d’anneaux ou les indices des tours sont invalides.
 */
function resoudre(n, de, vers, via) {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError("Le nombre d’anneaux à résoudre doit être un entier positif ou nul.");
  }

  if (
    ![de, vers, via].every(Number.isInteger) ||
    new Set([de, vers, via]).size !== 3
  ) {
    throw new RangeError("Les tours de départ, d’arrivée et intermédiaire doivent être distinctes.");
  }

  if (n === 0) {
    return [];
  }

  return [
    ...resoudre(n - 1, de, via, vers),
    [de, vers],
    ...resoudre(n - 1, via, vers, de),
  ];
}

/**
 * Annule le retour visuel temporaire d’un déplacement invalide.
 * @returns {void}
 */
function effacerRetourVisuel() {
  window.clearTimeout(minuterieRetourVisuel);
  minuterieRetourVisuel = null;
  tourInvalide = null;
}

/**
 * Signale visuellement une tentative de déplacement invalide.
 * @param {number} indexTour Indice de la tour où le dépôt est refusé.
 * @returns {void}
 */
function afficherCoupInvalide(indexTour) {
  effacerRetourVisuel();
  tourInvalide = indexTour;
  rendre();

  minuterieRetourVisuel = window.setTimeout(() => {
       tourInvalide = null;
       minuterieRetourVisuel = null;
       rendre();
  }, 900);
}

/**
 * Anime un anneau qui monte, glisse au-dessus des tours et redescend.
 * @param {HTMLDivElement} anneau Élément animé.
 * @param {DOMRect} positionInitiale Position de l’anneau avant le déplacement.
 * @param {DOMRect} tourDepart Position de la tour de départ.
 * @param {DOMRect} tourArrivee Position de la tour d’arrivée.
 * @returns {Animation | null} Animation créée, ou null si le mouvement est réduit ou indisponible.
 */
function animerDeplacement(anneau, positionInitiale, tourDepart, tourArrivee) {
  const positionFinale = anneau.getBoundingClientRect();
  const deplacementX = positionInitiale.left - positionFinale.left;
  const deplacementY = positionInitiale.top - positionFinale.top;
  const hauteurVol = Math.min(tourDepart.top, tourArrivee.top) - positionFinale.height - 12;
  const deplacementYAuDessusDesTours = hauteurVol - positionFinale.top;

  if (
    (deplacementX === 0 && deplacementY === 0) ||
    typeof anneau.animate !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return null;
  }

  return anneau.animate(
    [
      {
        offset: 0,
        transform: `translate(${deplacementX}px, ${deplacementY}px)`,
        easing: "cubic-bezier(0.2, 0.75, 0.3, 1)",
      },
      {
        offset: 0.22,
        transform: `translate(${deplacementX}px, ${deplacementYAuDessusDesTours}px)`,
        easing: "linear",
      },
      {
        offset: 0.78,
        transform: `translate(0, ${deplacementYAuDessusDesTours}px)`,
        easing: "cubic-bezier(0.2, 0.75, 0.3, 1)",
      },
      { offset: 1, transform: "translate(0, 0)" },
    ],
    {
      duration: 750,
    },
  );
}

/**
 * Attend un délai ou interrompt l’attente si le signal est annulé.
 * @param {number} ms Durée de l’attente en millisecondes.
 * @param {AbortSignal} signal Signal d’interruption de la démonstration.
 * @returns {Promise<void>} Promesse résolue à l’expiration du délai de `ms` millisecondes.
 * Rejetée avec une erreur `AbortError` si `signal` est annulé avant l’expiration.
 */
function attendreDelai(ms, signal) {
  return new Promise((resolve, reject) => {
    const terminer = () => {
      signal.removeEventListener("abort", annuler);
      minuterieDemo = null;
      resolve();
    };
    const annuler = () => {
      window.clearTimeout(minuterieDemo);
      minuterieDemo = null;
      signal.removeEventListener("abort", annuler);
      const erreur = new Error("La démonstration a été interrompue.");
      erreur.name = "AbortError";
      reject(erreur);
    };

    if (signal.aborted) {
      annuler();
      return;
    }

    minuterieDemo = window.setTimeout(terminer, ms);
    signal.addEventListener("abort", annuler, { once: true });
  });
}

/**
 * Attend la fin d’une animation tout en permettant son annulation.
 * @param {Animation} animation Animation du déplacement à attendre.
 * @param {AbortSignal} signal Signal d’interruption de la démonstration.
 * @returns {Promise<void>} Promesse résolue à la fin de l’animation, ou rejetée si elle est annulée.
 */
async function attendreAnimation(animation, signal) {
  animationDemo = animation;
  const annuler = () => animation.cancel();
  signal.addEventListener("abort", annuler, { once: true });

  try {
    await animation.finished;
  } finally {
    signal.removeEventListener("abort", annuler);
    if (animationDemo === animation) {
      animationDemo = null;
    }
  }
}

/**
 * Exécute les coups calculés, met à jour l’état et attend chaque animation.
 * @param {number[][]} coups Liste des couples [de, vers] à rejouer.
 * @param {AbortSignal} signal Signal permettant d’interrompre le rejeu.
 * @returns {Promise<void>} Promesse résolue après le rejeu de tous les coups ou si `signal` est déjà annulé entre deux coups.
 * Rejetée si un coup est illégal ou si l’annulation interrompt une attente.
 * @throws {Error} Si la liste contient un déplacement illégal.
 */
async function rejouerCoups(coups, signal) {
  for (const [de, vers] of coups) {
    if (signal.aborted) {
      return;
    }

    if (!deplacementValide(de, vers)) {
      throw new Error(`Le coup ${de + 1} → ${vers + 1} est invalide.`);
    }

    const taille = etat[de][etat[de].length - 1];
    const anneau = noeudsAnneaux.get(taille);
    const positionInitiale = anneau.getBoundingClientRect();
    const positionTourDepart = noeudsTours[de].getBoundingClientRect();
    const positionTourArrivee = noeudsTours[vers].getBoundingClientRect();

    etat[vers].push(etat[de].pop());
    nombreCoups += 1;
    mettreAJourCompteur();
    rendre();
    verifierVictoire();
    const animation = animerDeplacement(
      anneau,
      positionInitiale,
      positionTourDepart,
      positionTourArrivee,
    );

    if (animation) {
      await attendreAnimation(animation, signal);
    } else {
      await attendreDelai(delaiDemo, signal);
    }
  }
}

/**
 * Annule toute démo en cours et vide l’état et les affichages de la partie.
 * @returns {void}
 */
function reinitialiserJeu() {
  generationDemo += 1;
  if (controleurDemo) {
    controleurDemo.abort();
    controleurDemo = null;
  }
  if (animationDemo) {
    animationDemo.cancel();
    animationDemo = null;
  }
  window.clearTimeout(minuterieDemo);
  minuterieDemo = null;

  demoEnCours = false;
  champNbAnneaux.disabled = false;
  boutonDemarrer.disabled = false;
  boutonDemo.disabled = false;
  obtenirPlateau().inert = false;
  noeudsAnneaux.forEach((anneau) => {
       if (typeof anneau.getAnimations === "function") {
         anneau.getAnimations().forEach((animation) => animation.cancel());
       }
  });

  etat = [[], [], []];
  nombreCoups = 0;
  tourSelectionnee = null;
  messageVictoire.textContent = "";
  affichageScore.textContent = "";
  statutDemo.textContent = "";
  mettreAJourCompteur();
  effacerRetourVisuel();
  rendre();
}

boutonReset.addEventListener("click", reinitialiserJeu);

/**
 * Traite la sélection d’un anneau et les déplacements manuels sur le plateau.
 * @param {MouseEvent} evenement Événement de clic sur le document.
 * @returns {void}
 */
function traiterClicPlateau(evenement) {
  if (demoEnCours) {
    return;
  }

  if (!(evenement.target instanceof Element)) {
    return;
  }

  const tour = evenement.target.closest(".tour");
  const plateau = document.getElementById("plateau");

  if (!tour || !plateau || tour.parentElement !== plateau) {
    return;
  }

  const indexTour = indicesTours.get(tour);

  if (indexTour === undefined) {
    return;
  }

  if (tourSelectionnee !== null) {
    if (indexTour === tourSelectionnee) {
      tourSelectionnee = null;
      effacerRetourVisuel();
      rendre();
      return;
    }

    if (!deplacementValide(tourSelectionnee, indexTour)) {
      afficherCoupInvalide(indexTour);
      return;
    }

    const taille = etat[tourSelectionnee][etat[tourSelectionnee].length - 1];
    const anneau = noeudsAnneaux.get(taille);
    const positionInitiale = anneau.getBoundingClientRect();
    const positionTourDepart = noeudsTours[tourSelectionnee].getBoundingClientRect();
    const positionTourArrivee = noeudsTours[indexTour].getBoundingClientRect();

    etat[indexTour].push(etat[tourSelectionnee].pop());
    nombreCoups += 1;
    mettreAJourCompteur();
    tourSelectionnee = null;
    effacerRetourVisuel();
    rendre();
    verifierVictoire();
    animerDeplacement(anneau, positionInitiale, positionTourDepart, positionTourArrivee);
    return;
  }

  const anneau = evenement.target.closest(".anneau");
  const detailsAnneau = anneau && anneauxRendus.get(anneau);

  if (
    detailsAnneau &&
    detailsAnneau.indexTour === indexTour &&
    etat[indexTour][etat[indexTour].length - 1] === detailsAnneau.taille
  ) {
    tourSelectionnee = indexTour;
    rendre();
  }
}

document.addEventListener("click", traiterClicPlateau);

/**
 * Démarre la démonstration automatique et réactive l’interface à la fin.
 * @returns {Promise<void>} Promesse terminée lorsque la démonstration s’arrête.
 */
async function demarrerDemo() {
  if (demoEnCours || !champNbAnneaux.reportValidity()) {
    return;
  }

  const nombreAnneaux = Number(champNbAnneaux.value);
  const sessionDemo = ++generationDemo;
  const nouveauControleur = new AbortController();
  controleurDemo = nouveauControleur;
  demoEnCours = true;
  nombreCoups = 0;
  mettreAJourCompteur();
  messageVictoire.textContent = "";
  affichageScore.textContent = "";
  champNbAnneaux.disabled = true;
  boutonDemarrer.disabled = true;
  boutonDemo.disabled = true;
  obtenirPlateau().inert = true;
  statutDemo.textContent = "Démonstration en cours…";
  tourSelectionnee = null;
  effacerRetourVisuel();
  etat = [
    Array.from({ length: nombreAnneaux }, (_, index) => nombreAnneaux - index),
    [],
    [],
  ];
  rendre();

  try {
    const coups = resoudre(nombreAnneaux, 0, 2, 1);
    await rejouerCoups(coups, nouveauControleur.signal);

    if (nouveauControleur.signal.aborted) {
      return;
    }

    if (etat[0].length !== 0 || etat[1].length !== 0 || etat[2].length !== nombreAnneaux) {
      throw new Error("La démonstration n’a pas placé tous les anneaux sur la troisième tour.");
    }

    statutDemo.textContent = `Démonstration terminée en ${coups.length} coups.`;
  } catch (erreur) {
    if (!nouveauControleur.signal.aborted) {
      statutDemo.textContent = `Erreur pendant la démonstration : ${erreur.message}`;
    }
  } finally {
    if (sessionDemo === generationDemo) {
      demoEnCours = false;
      controleurDemo = null;
      champNbAnneaux.disabled = false;
      boutonDemarrer.disabled = false;
      boutonDemo.disabled = false;
      obtenirPlateau().inert = false;
      rendre();
    }
  }
}

/**
 * Démarre ou redémarre une partie après validation du nombre d’anneaux.
 * @returns {void}
 */
function demarrerPartie() {
  if (demoEnCours || !champNbAnneaux.reportValidity()) {
    return;
  }

  const nombreAnneaux = Number(champNbAnneaux.value);
  nombreCoups = 0;
  mettreAJourCompteur();
  messageVictoire.textContent = "";
  affichageScore.textContent = "";
  statutDemo.textContent = "";
  etat = [
    Array.from({ length: nombreAnneaux }, (_, index) => nombreAnneaux - index),
    [],
    [],
  ];
  tourSelectionnee = null;
  effacerRetourVisuel();
  statutDemo.textContent = "";
  rendre();
}

/**
 * Associe les commandes de démarrage et de démonstration à leurs gestionnaires.
 * @returns {void}
 */
function initialiserCommandes() {
  boutonDemo.addEventListener("click", demarrerDemo);
  boutonDemarrer.addEventListener("click", demarrerPartie);
}

initialiserCommandes();
rendre();
