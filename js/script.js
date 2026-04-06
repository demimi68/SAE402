// Initialisations
const c = document.querySelector("#Canva-jeu")
const ctx = c.getContext('2d');

let colonne = 17;
let ligne = 23;

let grid = []
let taille; // taille d'une case en pixels

// --- SPRITE ---
const playerImg = new Image();
playerImg.src = "img/perso.png";

let SPRITE_W, SPRITE_H;
playerImg.onload = () => {
    SPRITE_W = playerImg.width / 4;
    SPRITE_H = playerImg.height / 4;
};

// JOUEUR (en pixels maintenant)
let player = {
    x: 0, // à init plus tard
    y: 0,
    dir: 0,
    frame: 0,
    speed: 4 // pixels par frame
};

// CONTROLES
let keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

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
                    laby[l + d[0] / 2][c + d[1] / 2] = 0;
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
    for (let l = 1; l < lig - 1; l++) {
        for (let c = 1; c < col - 1; c++) {
            // Si c'est un mur
            if (laby[l][c] === 1) {
                let voisins = 0;

                // Compter le nombre de chemins autour
                if (laby[l + 1][c] === 0) voisins++;
                if (laby[l - 1][c] === 0) voisins++;
                if (laby[l][c + 1] === 0) voisins++;
                if (laby[l][c - 1] === 0) voisins++;

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

    taille = Math.min(c.width/colonne, c.height/ligne);

    // spawn sûr (en pixels)
    player.x = 1 * taille;
    player.y = 1 * taille;
}

// COLLISION
function peutBouger(x, y) {
    let marge = 2; // pixels

    let points = [
        [x + marge, y + marge],
        [x + taille - marge, y + marge],
        [x + marge, y + taille - marge],
        [x + taille - marge, y + taille - marge]
    ];

    for (let p of points) {
        let col = Math.floor(p[0]/taille);
        let lig = Math.floor(p[1]/taille);

        if (!grid[lig] || grid[lig][col] === 1) {
            return false;
        }
    }

    return true;
}

// UPDATE
function update() {
    let moving = false;

    let nx = player.x;
    let ny = player.y;

    if (keys["ArrowLeft"]) { nx -= player.speed; player.dir = 1; moving = true; }
    if (keys["ArrowRight"]) { nx += player.speed; player.dir = 2; moving = true; }
    if (keys["ArrowUp"]) { ny -= player.speed; player.dir = 3; moving = true; }
    if (keys["ArrowDown"]) { ny += player.speed; player.dir = 0; moving = true; }

    // vérifier collisions
    if (peutBouger(nx, player.y)) player.x = nx;
    if (peutBouger(player.x, ny)) player.y = ny;

    // animation
    if (moving) {
        player.frame += 0.15;
        if (player.frame >= 4) player.frame = 0;
    } else {
        player.frame = 0;
    }
}

// Fonction pour afficher labyrinthe
function afficher() {
    ctx.clearRect(0, 0, c.width, c.height)

    // Labyrinthe
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

    // JOUEUR
    if (SPRITE_W && SPRITE_H) {
        let frameX = Math.floor(player.frame) * SPRITE_W;
        let frameY = player.dir * SPRITE_H;

        ctx.drawImage(
            playerImg,
            frameX, frameY, SPRITE_W, SPRITE_H,
            player.x, player.y,
            taille,
            taille
        );
    }
}

function boucle() {
    update();
    afficher()
    requestAnimationFrame(boucle)
}

init()
boucle()