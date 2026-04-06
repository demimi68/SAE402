// Initialisations
const c = document.querySelector("#Canva-jeu")
const ctx = c.getContext('2d');

let colonne = 17;
let ligne = 23;

let grid = []
let taille; // taille d'une case en pixels

// --- Sprite du joueur ---
const playerImg = new Image();
playerImg.src = "img/perso.png";

let SPRITE_W, SPRITE_H;
playerImg.onload = () => {
    SPRITE_W = playerImg.width / 4;
    SPRITE_H = playerImg.height / 4;
};

// --- Sprite ennemi ---
const enemyImg = new Image();
enemyImg.src = "img/mechant.png";

let E_SPRITE_W, E_SPRITE_H;
enemyImg.onload = () => {
    E_SPRITE_W = 60; 
    E_SPRITE_H = 60;
};

// --- Sprite de décor ---
const decorImg = new Image();
decorImg.src = "img/decor.jpg";

// Positions sur ton image (vignettes de 48x48 pixels)
const SOURCE_HERBE = { x: 165, y: 25 };     // L'herbe pour les murs (Noir)

// JOUEUR (en pixels maintenant)
let player = {
    x: 0, // à init plus tard
    y: 0,
    dir: 0,
    frame: 0,
    speed: 4 // pixels par frame
};

// --- ENNEMIS ---
let enemies = [];

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

// --- POSITION ALEATOIRE SAFE ---
function getRandomPosition() {
    let x, y;

    do {
        let col = Math.floor(Math.random() * colonne);
        let lig = Math.floor(Math.random() * ligne);

        x = col * taille;
        y = lig * taille;

    } while (!peutBouger(x, y));

    return { x, y };
}

function init() {
    c.height = window.innerHeight;
    c.width = window.innerWidth;

    grid = generateLaby(colonne, ligne)

    taille = Math.min(c.width / colonne, c.height / ligne);

    // spawn sûr joueur
    player.x = 1 * taille;
    player.y = 1 * taille;

    // spawn ennemis
    enemies = [];
    let available = [];

    // créer la liste des cases libres (0 = chemin)
    for (let l = 0; l < ligne; l++) {
        for (let c = 0; c < colonne; c++) {
            if (grid[l][c] === 0 && !(l === 1 && c === 1)) { // pas sur le joueur
                available.push({l, c});
            }
        }
    }

    // tirer aléatoirement des cases sans répétition
    let nbEnemies = 3;
    for (let i = 0; i < nbEnemies; i++) {
        let index = Math.floor(Math.random() * available.length);
        let cell = available.splice(index, 1)[0]; // retire la case de la liste
        enemies.push({
            x: cell.c * taille,
            y: cell.l * taille,
            dir: 0,
            frame: 0,
            speed: 2,
            moveTimer: 0
        });
    }
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

// --- UPDATE ENNEMIS ---
function updateEnemies() {
    for (let e of enemies) {
        // 1. Déterminer les directions réellement possibles
        let possibles = [];
        // On teste avec une petite marge pour être sûr qu'ils ne frôlent pas les murs
        if (peutBouger(e.x, e.y - e.speed)) possibles.push(3); // Haut
        if (peutBouger(e.x, e.y + e.speed)) possibles.push(0); // Bas
        if (peutBouger(e.x - e.speed, e.y)) possibles.push(1); // Gauche
        if (peutBouger(e.x + e.speed, e.y)) possibles.push(2); // Droite

        // 2. Décision de changement de direction
        let faceAuMur = !peutBouger(
            e.dir === 1 ? e.x - e.speed : (e.dir === 2 ? e.x + e.speed : e.x),
            e.dir === 3 ? e.y - e.speed : (e.dir === 0 ? e.y + e.speed : e.y)
        );

        // On change de direction si on tape un mur OU si on est pile sur une case (intersection)
        let surUneCase = (Math.abs(e.x % taille) < e.speed && Math.abs(e.y % taille) < e.speed);

        if (faceAuMur || (surUneCase && possibles.length > 2)) {
            let nouvellesOptions = possibles;
            
            // Éviter le demi-tour si possible pour forcer l'exploration
            if (possibles.length > 1) {
                let inverse = {0:3, 3:0, 1:2, 2:1}[e.dir];
                nouvellesOptions = possibles.filter(d => d !== inverse);
            }

            if (nouvellesOptions.length > 0) {
                e.dir = nouvellesOptions[Math.floor(Math.random() * nouvellesOptions.length)];
                
                // Recalage magnétique : on aligne l'ennemi parfaitement sur la case
                // pour éviter qu'il ne "glisse" hors du chemin petit à petit
                if (surUneCase) {
                    e.x = Math.round(e.x / taille) * taille;
                    e.y = Math.round(e.y / taille) * taille;
                }
            }
        }

        // 3. Application du mouvement (uniquement si possible)
        let nextX = e.x;
        let nextY = e.y;
        if (e.dir === 1) nextX -= e.speed;
        if (e.dir === 2) nextX += e.speed;
        if (e.dir === 3) nextY -= e.speed;
        if (e.dir === 0) nextY += e.speed;

        if (peutBouger(nextX, nextY)) {
            e.x = nextX;
            e.y = nextY;
        } else {
            // Sécurité ultime : si bloqué, on cherche une direction au pif immédiatement
            e.dir = possibles[Math.floor(Math.random() * possibles.length)];
        }

        // Animation
        e.frame += 0.1;
        if (e.frame >= 4) e.frame = 0;
    }
}


// Fonction pour afficher labyrinthe
function afficher() {
    ctx.clearRect(0, 0, c.width, c.height)

    // Labyrinthe
    // Dans la fonction afficher() :
for (let l = 0; l < ligne; l++) {
    for (let c = 0; c < colonne; c++) {
        
        if (grid[l][c] === 1) {
            // --- C'EST UN MUR : On dessine l'herbe ---
            if (decorImg.complete) {
                ctx.drawImage(
                    decorImg,
                    SOURCE_HERBE.x, SOURCE_HERBE.y, 48, 48, 
                    c * taille, l * taille, 
                    taille, taille
                );
            } else {
                ctx.fillStyle = "#000"; // Noir si l'image n'est pas chargée
                ctx.fillRect(c * taille, l * taille, taille, taille);
            }
        } else {
            // --- C'EST LE CHEMIN : On dessine un rectangle beige clair ---
            ctx.fillStyle = "#F5F5DC";
            ctx.fillRect(c * taille, l * taille, taille, taille);
        }
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

    // ennemis
    for (let e of enemies) {
        if (E_SPRITE_W) {
            ctx.drawImage(
                enemyImg,
                Math.floor(e.frame) * E_SPRITE_W,
                e.dir * E_SPRITE_H,
                E_SPRITE_W, E_SPRITE_H,
                e.x, e.y,
                taille, taille
            );
        }
    }
}

function boucle() {
    update();
    updateEnemies();
    afficher()
    requestAnimationFrame(boucle)
}

init()
boucle()