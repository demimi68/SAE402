// Initialisations
const c = document.querySelector("#Canva-jeu")
const ctx = c.getContext('2d');

let gameState = "menu"; // menu, playing, win, lose

const overlay = document.getElementById("overlay");
const menu = document.getElementById("menu");
const endScreen = document.getElementById("endScreen");
const endMessage = document.getElementById("endMessage");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

startBtn.addEventListener("click", () => {
    menu.style.display = "none";
    overlay.style.display = "none";
    joystick.style.display = "block";
    gameState = "playing";
    init();
});

restartBtn.addEventListener("click", () => {
    endScreen.style.display = "none";
    overlay.style.display = "none";
    joystick.style.display = "block";
    gameState = "playing";
    init();
});


let lastTime = 0;
let colonne = 17;
let ligne = 25;

let grid = []
let taille; // taille d'une case en pixels
let rayonVision = 50;

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

const hatImg = new Image();
hatImg.src = "img/chapeau.png";

// Positions sur ton image (vignettes de 48x48 pixels)
const SOURCE_HERBE = { x: 165, y: 25 };     // L'herbe pour les murs (Noir)

// JOUEUR (en pixels maintenant)
let player = {
    x: 0, // à init plus tard
    y: 0,
    dir: 0,
    frame: 0,
    speed: 2 // pixels par frame
};

// --- ENNEMIS ---
let enemies = [];

// CONTROLES
let keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");

let joystickActive = false;
let joystickX = 0;
let joystickY = 0;
let maxRadius = 50; // rayon max du stick

function updateJoystick(dx, dy) {
    let dist = Math.hypot(dx, dy);
    if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
    }

    // Utilise 50% (le centre) + le décalage dx/dy
    // On divise par le rayon pour que le mouvement soit proportionnel
    stick.style.left = `calc(50% + ${dx}px)`;
    stick.style.top = `calc(50% + ${dy}px)`;

    joystickX = dx / maxRadius;
    joystickY = dy / maxRadius;
}

// événements tactiles
joystick.addEventListener("touchstart", e => {
    e.preventDefault();
    joystickActive = true;
});

joystick.addEventListener("touchmove", e => {
    if (!joystickActive) return;
    let rect = joystick.getBoundingClientRect();
    let touch = e.touches[0];
    let dx = touch.clientX - (rect.left + rect.width / 2);
    let dy = touch.clientY - (rect.top + rect.height / 2);
    updateJoystick(dx, dy);
});

joystick.addEventListener("touchend", e => {
    joystickActive = false;
    updateJoystick(0, 0); // Recentrer le stick visuellement
    
    // IMPORTANT : Forcer l'arrêt du mouvement
    joystickX = 0;
    joystickY = 0;
});

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

let hatPos = { l: 0, c: 0 }; // Pour stocker la position du chapeau

function init() {
    c.height = window.innerHeight;
    c.width = window.innerWidth;

    grid = generateLaby(colonne, ligne)

    taille = Math.min(c.width / colonne, c.height / ligne);

    // --- TROUVER LA CASE DE CHEMIN LA PLUS PROCHE DU BAS-DROITE ---
    let trouve = false;
    for (let l = ligne - 1; l >= 0 && !trouve; l--) {
        for (let col = colonne - 1; col >= 0 && !trouve; col--) {
            if (grid[l][col] === 0) {
                hatPos.l = l;
                hatPos.c = col;
                trouve = true;
            }
        }
    }

    // spawn sûr joueur
    player.x = 1 * taille;
    player.y = 1 * taille;

    // spawn ennemis
    enemies = [];
    let available = [];

    // créer la liste des cases libres (0 = chemin)
    for (let l = 0; l < ligne; l++) {
        for (let c = 0; c < colonne; c++) {
            if (grid[l][c] === 0 && !(l === 1 && c === 1) && !(l === hatPos.l && c === hatPos.c)) {
                available.push({ l, c });
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
            speed: 1,
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
        let col = Math.floor(p[0] / taille);
        let lig = Math.floor(p[1] / taille);

        if (!grid[lig] || grid[lig][col] === 1) {
            return false;
        }
    }

    return true;
}

function collisionRect(a, b) {
    return (
        a.x < b.x + taille &&
        a.x + taille > b.x &&
        a.y < b.y + taille &&
        a.y + taille > b.y
    );
}

// UPDATE
function update(delta) {
    if (gameState !== "playing") return; // ⬅️ On ne bouge rien si overlay visible

    let moving = false;

    // coordonnées futures
    let nx = player.x;
    let ny = player.y;

    // clavier
    if (keys["ArrowLeft"]) { nx -= player.speed * delta; player.dir = 1; moving = true; }
    if (keys["ArrowRight"]) { nx += player.speed * delta; player.dir = 2; moving = true; }
    if (keys["ArrowUp"]) { ny -= player.speed * delta; player.dir = 3; moving = true; }
    if (keys["ArrowDown"]) { ny += player.speed * delta; player.dir = 0; moving = true; }

    // joystick
    if (joystickActive || Math.abs(joystickX) > 0.1 || Math.abs(joystickY) > 0.1) {
        nx = player.x + joystickX * player.speed * delta;
        ny = player.y + joystickY * delta;

        if (Math.abs(joystickX) > Math.abs(joystickY)) {
            player.dir = joystickX > 0 ? 2 : 1;
        } else {
            player.dir = joystickY > 0 ? 0 : 3;
        }

        moving = true;
    }

    // collisions
    if (peutBouger(nx, player.y)) player.x = nx;
    if (peutBouger(player.x, ny)) player.y = ny;

    // animation
    if (moving) {
        player.frame += 0.15;
        if (player.frame >= 4) player.frame = 0;
    } else {
        player.frame = 0;
    }

    // collision ennemis
    for (let e of enemies) {
        if (collisionRect(player, e)) {
            gameState = "lose";
            overlay.style.display = "flex";
            endScreen.style.display = "block";
            endMessage.textContent = "Vous avez perdu !";
            joystick.style.display = "none";
            return;
        }
    }

    // collision chapeau
    let hat = { x: hatPos.c * taille, y: hatPos.l * taille };
    if (collisionRect(player, hat)) {
        gameState = "win";
        overlay.style.display = "flex";
        endScreen.style.display = "block";
        endMessage.textContent = "Vous avez gagné !";
        joystick.style.display = "none";
        return;
    }
}

// --- UPDATE ENNEMIS ---
function updateEnemies(delta) {
    if (gameState !== "playing") return; // ⬅️ On ne bouge pas les ennemis si overlay visible
    for (let e of enemies) {
        // 1️⃣ Déterminer les directions réellement possibles
        let possibles = [];
        if (peutBouger(e.x, e.y - e.speed * delta)) possibles.push(3); // Haut
        if (peutBouger(e.x, e.y + e.speed * delta)) possibles.push(0); // Bas
        if (peutBouger(e.x - e.speed * delta, e.y)) possibles.push(1); // Gauche
        if (peutBouger(e.x + e.speed * delta, e.y)) possibles.push(2); // Droite

        // 2️⃣ Détection face au mur (avec delta)
        let nextX = e.x;
        let nextY = e.y;
        if (e.dir === 1) nextX -= e.speed * delta;
        if (e.dir === 2) nextX += e.speed * delta;
        if (e.dir === 3) nextY -= e.speed * delta;
        if (e.dir === 0) nextY += e.speed * delta;
        let faceAuMur = !peutBouger(nextX, nextY);

        // 3️⃣ Vérifie si sur une case (intersection)
        let surUneCase = (Math.abs(e.x % taille) < e.speed && Math.abs(e.y % taille) < e.speed);

        // 4️⃣ Changement de direction
        if (faceAuMur || (surUneCase && possibles.length > 2)) {
            let nouvellesOptions = possibles;

            // Éviter le demi-tour
            if (possibles.length > 1) {
                let inverse = { 0: 3, 3: 0, 1: 2, 2: 1 }[e.dir];
                nouvellesOptions = possibles.filter(d => d !== inverse);
            }

            if (nouvellesOptions.length > 0) {
                e.dir = nouvellesOptions[Math.floor(Math.random() * nouvellesOptions.length)];

                // Recalage magnétique
                if (surUneCase) {
                    e.x = Math.round(e.x / taille) * taille;
                    e.y = Math.round(e.y / taille) * taille;
                }
            }
        }

        // 5️⃣ Application du mouvement
        if (peutBouger(nextX, nextY)) {
            e.x = nextX;
            e.y = nextY;
        } else if (possibles.length > 0) {
            // Si bloqué, change de direction immédiatement
            e.dir = possibles[Math.floor(Math.random() * possibles.length)];
        }

        // 6️⃣ Animation
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

    // --- DESSIN DU CHAPEAU SUR LE CHEMIN ---
    if (hatImg.complete) {
        ctx.drawImage(
            hatImg,
            hatPos.c * taille,
            hatPos.l * taille,
            taille,
            taille
        );
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

    // --- 3. AJOUT DU MODE NOIR (À insérer ici) ---
    // On ne l'affiche que si on est en train de jouer
    if (gameState === "playing") {
        ctx.save();
        
        // Calcul du centre du joueur (puisqu'il bouge en pixels ici)
        let xLumiere = player.x + taille / 2;
        let yLumiere = player.y + taille / 2;

        // On dessine le noir
        ctx.fillStyle = "black";
        
        // Technique du "rect inverse" pour percer le trou
        ctx.beginPath();
        ctx.rect(0, 0, c.width, c.height);
        ctx.arc(xLumiere, yLumiere, rayonVision, 0, Math.PI * 2, true);
        ctx.fill();

        ctx.restore();
    }
}

function boucle(timestamp) {
    let delta = (timestamp - lastTime) / 16.666;
    lastTime = timestamp;

    update(delta);
    updateEnemies(delta);
    afficher(); // ⬅️ Toujours afficher, même si overlay visible

    requestAnimationFrame(boucle);
}

init();
requestAnimationFrame(boucle);