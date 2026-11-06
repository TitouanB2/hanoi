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

boutonTheme.addEventListener("click", () => {
  const nouveauTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(cleTheme, nouveauTheme);
  appliquerTheme(nouveauTheme);
});

function mettreAJourCompteur() {
  affichageNbCoups.textContent = String(nombreCoups);
}

function partieGagnee() {
  const nombreAnneaux = etat.reduce((total, pile) => total + pile.length, 0);
  const pileDestination = etat[2];

  return (
    nombreAnneaux > 0 &&
    pileDestination.length === nombreAnneaux &&
    pileDestination.every((taille, index) => index === 0 || pileDestination[index - 1] > taille)
  );
}

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

function effacerRetourVisuel() {
  window.clearTimeout(minuterieRetourVisuel);
  minuterieRetourVisuel = null;
  tourInvalide = null;
}

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

document.addEventListener("click", (evenement) => {
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
});

boutonDemo.addEventListener("click", async () => {
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
});

boutonDemarrer.addEventListener("click", () => {
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
});

rendre();
