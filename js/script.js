// Initialisations
const c = document.querySelector("#Canva-jeu")
const ctx = c.getContext('2d');

let colonne = 17;
let ligne = 23;

let grid = []

// --- Génération labyrinthe multi-chemins ---
function generateLaby(col, lig) {
    // Création du tableau du labyrinthe
    let laby = [];

    // Remplir toute la grille avec des murs (1 = mur)
    for (let l = 0; l < lig; l++) {
        laby[l] = [];
        for (let c = 0; c < col; c++) laby[l][c] = 1;
    }

    // Fonction pour creuser des chemins
    function creuser(l, c) {
        // On transforme la case actuelle en chemin (0 = vide)
        laby[l][c] = 0;

         // Liste des directions possibles (2 cases pour éviter les chemins collés)
        let directions = [
            [0, 2], [0, -2], [2, 0], [-2, 0]
        ];

        // Mélanger les directions pour rendre le labyrinthe aléatoire
        directions.sort(() => Math.random() - 0.5);

        // Parcourir chaque direction
        for (let d of directions) {
            let nl = l + d[0];
            let nc = c + d[1];

            // Calcul de la prochaine case
            if (nl > 0 && nl < lig - 1 && nc > 0 && nc < col - 1) {
                // Si la case est encore un mur
                if (laby[nl][nc] === 1) {
                    // Casser le mur entre la case actuelle et la suivante
                    laby[l + d[0]/2][c + d[1]/2] = 0;
                    creuser(nl, nc);
                }
            }
        }
    }
    // Point de départ du labyrinthe
    creuser(1, 1);

    // Ajouter des chemins supplémentaires
    let chance = 0.2;
    
    // Parcourir toutes les cases internes
    for (let l = 1; l < lig-1; l++) {
        for (let c = 1; c < col-1; c++) {
            // Si c'est un mur
            if (laby[l][c] === 1) {
                let voisins = 0;

                // Compter le nombre de chemins autour
                if (laby[l+1][c] === 0) voisins++;
                if (laby[l-1][c] === 0) voisins++;
                if (laby[l][c+1] === 0) voisins++;
                if (laby[l][c-1] === 0) voisins++;

                // Si au moins 2 chemins autour → possibilité d'ouvrir
                if (voisins >= 2 && Math.random() < chance) laby[l][c] = 0;
            }
        }
    }

    return laby;
}

// Fonction pour initialisation
function init() {
    c.height = window.innerHeight;
    c.width = window.innerWidth;

    grid = generateLaby(colonne, ligne)

}

// Fonction pour afficher labyrinthe
function afficher() {
    ctx.clearRect(0, 0, c.width, c.height)

    let taille = Math.min(
        c.width / colonne,
        c.height / ligne
    );

    for (let l = 0; l < ligne; l++) {
        for (let c = 0; c < colonne; c++) {
            if (grid[l][c] === 1) {
                ctx.fillStyle = "#000000"
            }
            else {
                ctx.fillStyle = "#eee"
            }

            ctx.fillRect(c * taille, l * taille, taille, taille)
        }
    }
}

function boucle() {
    afficher()
    requestAnimationFrame(boucle)
}

init()
boucle()