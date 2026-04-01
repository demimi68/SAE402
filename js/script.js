// Initialisations
const c = document.querySelector("#Canva-jeu")
const ctx = c.getContext('2d');

let colonne = 17;
let ligne = 23;

let grid = []

// Fonction pour générer le labyrinthe 
function generateLaby(col, lig) {
    let laby = []

    for (let l = 0; l < lig; l++) {
        laby[l] = [];

        for (let c = 0; c < col; c++) {
            laby[l][c] = 1;
        }
    }

    // Permet de creuser le blanc donc faire les chemins
    function creuser(l, c, laby, lig, col) {
        laby[l][c] = 0

        let directions = [
            [0, 2],
            [0, -2],
            [2, 0],
            [-2, 0]
        ]

        directions.sort(() => Math.random() - 0.5);

        for (let d of directions) {
            let nl = l + d[0]
            let nc = c + d[1]

            if (nl > 0 && nl < lig - 1 && nc > 0 && nc < col - 1) {
                if (laby[nl][nc] === 1) {
                    laby[l + d[0] / 2][c + d[1] / 2] = 0;
                    creuser(nl, nc, laby, lig, col)
                }
            }
        }
    }
    creuser(1, 1, laby, lig, col)

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