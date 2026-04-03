const canvas = document.getElementById("jeu");
const ctx = canvas.getContext("2d");

// Score
let score = 0;
let viesRestantes = 3;

// Le joueur
const joueur = {
    x: 100,
    y: 300,
    largeur: 40,
    hauteur: 40,
    vitesse: 5,
    velociteY: 0,
    auSol: false,
    couleur: "#FF0000",
    invincible: false
};

// Le sol
const sol = {
    x: 0,
    y: 360,
    largeur: 800,
    hauteur: 40,
    couleur: "#228B22"
};

// Les plateformes
const plateformes = [
    { x: 150, y: 280, largeur: 120, hauteur: 15, couleur: "#8B4513" },
    { x: 350, y: 220, largeur: 120, hauteur: 15, couleur: "#8B4513" },
    { x: 550, y: 160, largeur: 120, hauteur: 15, couleur: "#8B4513" },
    { x: 300, y: 310, largeur: 100, hauteur: 15, couleur: "#8B4513" },
];

// Les ennemis
const ennemis = [
    { x: 200, y: 330, largeur: 35, hauteur: 35, vitesse: 2, direction: 1, couleur: "#800080" },
    { x: 400, y: 185, largeur: 35, hauteur: 35, vitesse: 1.5, direction: 1, couleur: "#800080" },
    { x: 560, y: 125, largeur: 35, hauteur: 35, vitesse: 2, direction: 1, couleur: "#800080" },
];

// Touches
const touches = {};
document.addEventListener("keydown", e => touches[e.key] = true);
document.addEventListener("keyup", e => touches[e.key] = false);

// Collision générique
function collision(a, b) {
    return (
        a.x < b.x + b.largeur &&
        a.x + a.largeur > b.x &&
        a.y < b.y + b.hauteur &&
        a.y + a.hauteur > b.y
    );
}

// Collision plateforme (par le dessus)
function collisionPlateforme(p) {
    return (
        joueur.x < p.x + p.largeur &&
        joueur.x + joueur.largeur > p.x &&
        joueur.y + joueur.hauteur >= p.y &&
        joueur.y + joueur.hauteur <= p.y + p.hauteur + 10 &&
        joueur.velociteY >= 0
    );
}

function mettreAJour() {
    // Gravité
    joueur.velociteY += 0.5;
    joueur.y += joueur.velociteY;
    joueur.auSol = false;

    // Collision sol
    if (joueur.y + joueur.hauteur >= sol.y) {
        joueur.y = sol.y - joueur.hauteur;
        joueur.velociteY = 0;
        joueur.auSol = true;
    }

    // Collision plateformes
    plateformes.forEach(p => {
        if (collisionPlateforme(p)) {
            joueur.y = p.y - joueur.hauteur;
            joueur.velociteY = 0;
            joueur.auSol = true;
        }
    });

    // Déplacement
    if (touches["ArrowLeft"]) joueur.x -= joueur.vitesse;
    if (touches["ArrowRight"]) joueur.x += joueur.vitesse;
    if (touches["ArrowUp"] && joueur.auSol) joueur.velociteY = -12;

    // Bords
    if (joueur.x < 0) joueur.x = 0;
    if (joueur.x + joueur.largeur > canvas.width) joueur.x = canvas.width - joueur.largeur;

    // Ennemis
    ennemis.forEach(ennemi => {
        // Mouvement
        ennemi.x += ennemi.vitesse * ennemi.direction;
        if (ennemi.x <= 0 || ennemi.x + ennemi.largeur >= canvas.width) {
            ennemi.direction *= -1;
        }

        // Contact avec le joueur
        if (collision(joueur, ennemi) && !joueur.invincible) {
            // Sauter sur l'ennemi par le dessus
            if (joueur.velociteY > 0 && joueur.y + joueur.hauteur < ennemi.y + 20) {
                score += 100;
                ennemi.x = -200; // Faire disparaître l'ennemi
                joueur.velociteY = -10;
            } else {
                // Touché par l'ennemi
                viesRestantes--;
                joueur.invincible = true;
                joueur.x = 100;
                joueur.y = 300;
                setTimeout(() => joueur.invincible = false, 2000);

                if (viesRestantes <= 0) {
                    alert("Game Over ! Score final : " + score);
                    score = 0;
                    viesRestantes = 3;
                    joueur.x = 100;
                    joueur.y = 300;
                    ennemis[0].x = 200;
                    ennemis[1].x = 400;
                    ennemis[2].x = 560;
                }
            }
        }
    });

    // Score automatique
    score++;
}

function dessiner() {
    // Ciel
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sol
    ctx.fillStyle = sol.couleur;
    ctx.fillRect(sol.x, sol.y, sol.largeur, sol.hauteur);

    // Plateformes
    plateformes.forEach(p => {
        ctx.fillStyle = p.couleur;
        ctx.fillRect(p.x, p.y, p.largeur, p.hauteur);
    });

    // Ennemis
    ennemis.forEach(ennemi => {
        ctx.fillStyle = ennemi.couleur;
        ctx.fillRect(ennemi.x, ennemi.y, ennemi.largeur, ennemi.hauteur);
        // Yeux de l'ennemi
        ctx.fillStyle = "white";
        ctx.fillRect(ennemi.x + 5, ennemi.y + 8, 10, 10);
        ctx.fillRect(ennemi.x + 20, ennemi.y + 8, 10, 10);
        ctx.fillStyle = "black";
        ctx.fillRect(ennemi.x + 8, ennemi.y + 11, 5, 5);
        ctx.fillRect(ennemi.x + 23, ennemi.y + 11, 5, 5);
    });

    // Joueur (clignote si invincible)
    if (!joueur.invincible || Math.floor(Date.now() / 200) % 2 === 0) {
        ctx.fillStyle = joueur.couleur;
        ctx.fillRect(joueur.x, joueur.y, joueur.largeur, joueur.hauteur);
    }

    // HUD - Score et vies
    ctx.fillStyle = "black";
    ctx.font = "bold 20px Arial";
    ctx.fillText("Score : " + score, 10, 30);
    ctx.fillText("Vies : " + "❤️".repeat(viesRestantes), 650, 30);
}

function boucleJeu() {
    mettreAJour();
    dessiner();
    requestAnimationFrame(boucleJeu);
}

boucleJeu();
