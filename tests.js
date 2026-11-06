const listeResultats = document.getElementById("resultats-tests");
let nombreTestsReussis = 0;
let nombreTestsEchoues = 0;

function verifier(description, condition) {
  const resultat = document.createElement("li");
  resultat.textContent = `${condition ? "RÉUSSI" : "ÉCHEC"} — ${description}`;
  listeResultats.append(resultat);

  if (condition) {
    nombreTestsReussis += 1;
    console.log(`RÉUSSI — ${description}`);
  } else {
    nombreTestsEchoues += 1;
    console.error(`ÉCHEC — ${description}`);
  }
}

for (let nombreAnneaux = 0; nombreAnneaux <= 8; nombreAnneaux += 1) {
  try {
    const coups = resoudre(nombreAnneaux, 0, 2, 1);
    const nombreMinimalAttendu = 2 ** nombreAnneaux - 1;
    let piles = [
      Array.from({ length: nombreAnneaux }, (_, index) => nombreAnneaux - index),
      [],
      [],
    ];
    let tousLesCoupsSontLegaux = true;

    for (const coup of coups) {
      if (!Array.isArray(coup) || coup.length !== 2) {
        tousLesCoupsSontLegaux = false;
        break;
      }

      const [de, vers] = coup;
      const depart = piles[de];
      const arrivee = piles[vers];

      if (
        !Number.isInteger(de) ||
        !Number.isInteger(vers) ||
        de < 0 ||
        vers < 0 ||
        de >= piles.length ||
        vers >= piles.length ||
        de === vers ||
        depart.length === 0 ||
        (arrivee.length > 0 && depart[depart.length - 1] > arrivee[arrivee.length - 1])
      ) {
        tousLesCoupsSontLegaux = false;
        break;
      }

      arrivee.push(depart.pop());
    }

    const positionFinaleCorrecte =
      piles[0].length === 0 &&
      piles[1].length === 0 &&
      piles[2].length === nombreAnneaux &&
      piles[2].every(
        (taille, index) => taille === nombreAnneaux - index,
      );

    verifier(
      `resoudre(${nombreAnneaux}, 0, 2, 1) produit ${nombreMinimalAttendu} coups`,
      coups.length === nombreMinimalAttendu,
    );
    verifier(
      `les coups de resoudre(${nombreAnneaux}, 0, 2, 1) sont tous légaux`,
      tousLesCoupsSontLegaux,
    );
    verifier(
      `resoudre(${nombreAnneaux}, 0, 2, 1) place tous les anneaux sur la tour 3`,
      positionFinaleCorrecte,
    );
  } catch (erreur) {
    verifier(
      `resoudre(${nombreAnneaux}, 0, 2, 1) s’exécute sans erreur (${erreur.message})`,
      false,
    );
  }
}

document.getElementById("nb-anneaux").value = "2";
document.getElementById("btn-demarrer").click();

verifier("deplacementValide accepte un anneau sur une tour vide", deplacementValide(0, 1));
verifier("deplacementValide refuse un déplacement depuis une tour vide", !deplacementValide(1, 0));
verifier("deplacementValide refuse un déplacement vers la même tour", !deplacementValide(0, 0));
verifier("deplacementValide refuse un indice de tour hors limites", !deplacementValide(0, 3));

document.querySelector("#plateau .tour .anneau.selectionnable").click();
document.querySelectorAll("#plateau .tour")[2].click();
verifier("deplacementValide refuse de poser un grand anneau sur un petit", !deplacementValide(0, 2));
verifier("deplacementValide accepte le dépôt du grand anneau sur une tour vide", deplacementValide(0, 1));

document.querySelector("#plateau .tour .anneau.selectionnable").click();
document.querySelectorAll("#plateau .tour")[2].click();
verifier(
  "le jeu ne compte pas un déplacement interdit",
  document.getElementById("nb-coups").textContent === "1",
);

const resume = `Bilan : ${nombreTestsReussis} réussis, ${nombreTestsEchoues} échoués.`;
const bilan = document.createElement("li");
bilan.textContent = resume;
bilan.className = nombreTestsEchoues === 0 ? "test-reussi" : "test-echoue";
listeResultats.append(bilan);
console.log(resume);
