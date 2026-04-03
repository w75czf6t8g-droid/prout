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

// Générer une plateforme aléatoire
function nouvellePlateforme() {
    const largeur = Math.random() * 80 + 60; // Entre 60 et 140
    const x = Math.random() * (canvas.width - largeur - 20) + 10;
    const y = Math.random() * 200 + 100; // Entre 100 et 300
    return {
        x, y, largeur,
        hauteur: 15,
        couleur: "#8B4513",
        vie: Math.random() * 3000 + 2000, // Durée entre 2 et 5 secondes
        tempsRestant: 0,
        encassage: false,
        opacite: 1
    };
}

// Plateformes initiales
let plateformes = [
    nouvellePlateforme(),
    nouvellePlateforme(),
    nouvellePlateforme(),
    nouvellePlateforme(),
];
plateformes.forEach(p => p.tempsRestant = p.vie);

// Les ennemis
const ennemis = [
    { x: 200, y: 330, largeur: 35, hauteur: 35, vitesse: 2, direction: 1, couleur: "#800080", visible: true },
    { x: 400, y: 185, largeur: 35, hauteur: 35, vitesse: 1.5, direction: 1, couleur: "#800080", visible: true },
    { x: 560, y: 125, largeur: 35, hauteur: 35, vitesse: 2, direction: 1, couleur: "#800080", visible: true },
];

// Touches
const touches = {};
document.addEventListener("keydown", e => touches[e.key] = true);
document.addEventListener("keyup", e => touches[e.key] = false);

let dernierTemps = performance.now();

// Collision générique
function collision(a, b) {
    return (
        a.x < b.x + b.largeur &&
        a.x + a.largeur > b.x &&
        a.y < b.y + b.hauteur &&
        a.y + a.hauteur > b.y
    );
}

// Collision plateforme par le dessus
function collisionPlateforme(p) {
    return (
        p.opacite > 0.3 && // Pas de collision si la plateforme est presque cassée
        joueur.x < p.x + p.largeur &&
        joueur.x + joueur.largeur > p.x &&
        joueur.y + joueur.hauteur >= p.y &&
        joueur.y + joueur.hauteur <= p.y + p.hauteur + 10 &&
        joueur.velociteY >= 0
    );
}

function mettreAJour(delta) {
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

    // Mise à jour des plateformes
    plateformes.forEach((p, i) => {
        p.tempsRestant -= delta;

        // Phase de casse (clignottement)
        if (p.tempsRestant < 1000) {
            p.opacite = 0.3 + 0.7 * (p.tempsRestant / 1000);
            p.couleur = "#FF6600"; // Devient orange avant de casser
        }

        // Remplacer la plateforme cassée
        if (p.tempsRestant <= 0) {
            plateformes[i] = nouvellePlateforme();
            plateformes[i].tempsRestant = plateformes[i].vie;
        }

        // Collision avec joueur
        if (collisionPlateforme(p)) {
            joueur.y = p.y - joueur.hauteur;
            joueur.velociteY = 0;
            joueur.auSol = true;
        }
    });

    // Déplacement joueur
    if (touches["ArrowLeft"]) joueur.x -= joueur.vitesse;
    if (touches["ArrowRight"]) joueur.x += joueur.vitesse;
    if (touches["ArrowUp"] && joueur.auSol) joueur.velociteY = -12;

    // Bords
    if (joueur.x < 0) joueur.x = 0;
    if (joueur.x + joueur.largeur > canvas.width) joueur.x = canvas.width - joueur.largeur;

    // Ennemis
    ennemis.forEach(ennemi => {
        if (!ennemi.visible) return;
        ennemi.x += ennemi.vitesse * ennemi.direction;
        if (ennemi.x <= 0 || ennemi.x + ennemi.largeur >= canvas.width) {
            ennemi.direction *= -1;
        }

        if (collision(joueur, ennemi) && !joueur.invincible) {
            if (joueur.velociteY > 0 && joueur.y + joueur.hauteur < ennemi.y + 20) {
                score += 100;
                ennemi.visible = false;
                joueur.velociteY = -10;
            } else {
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
                    ennemis.forEach(e => e.visible = true);
                    ennemis[0].x = 200;
                    ennemis[1].x = 400;
                    ennemis[2].x = 560;
                }
            }
        }
    });

    score++;
}

function dessiner() {
    // Ciel
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sol
    ctx.fillStyle = sol.couleur;
    ctx.fillRect(sol.x, sol.y, sol.largeur, sol.hauteur);

    // Plateformes avec opacité
    plateformes.forEach(p => {
        ctx.globalAlpha = p.opacite;
        ctx.fillStyle = p.couleur;
        ctx.fillRect(p.x, p.y, p.largeur, p.hauteur);

        // Fissures si plateforme presque cassée
        if (p.tempsRestant < 1000) {
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p.x + p.largeur * 0.3, p.y);
            ctx.lineTo(p.x + p.largeur * 0.5, p.y + p.hauteur);
            ctx.moveTo(p.x + p.largeur * 0.6, p.y);
            ctx.lineTo(p.x + p.largeur * 0.8, p.y + p.hauteur);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    });

    // Ennemis
    ennemis.forEach(ennemi => {
        if (!ennemi.visible) return;
        ctx.fillStyle = ennemi.couleur;
        ctx.fillRect(ennemi.x, ennemi.y, ennemi.largeur, ennemi.hauteur);
        ctx.fillStyle = "white";
        ctx.fillRect(ennemi.x + 5, ennemi.y + 8, 10, 10);
        ctx.fillRect(ennemi.x + 20, ennemi.y + 8, 10, 10);
        ctx.fillStyle = "black";
        ctx.fillRect(ennemi.x + 8, ennemi.y + 11, 5, 5);
        ctx.fillRect(ennemi.x + 23, ennemi.y + 11, 5, 5);
    });

    // Joueur
    if (!joueur.invincible || Math.floor(Date.now() / 200) % 2 === 0) {
        ctx.fillStyle = joueur.couleur;
        ctx.fillRect(joueur.x, joueur.y, joueur.largeur, joueur.hauteur);
    }

    // HUD
    ctx.fillStyle = "black";
    ctx.font = "bold 20px Arial";
    ctx.fillText("Score : " + score, 10, 30);
    ctx.fillText("Vies : " + "❤️".repeat(viesRestantes), 650, 30);
}

function boucleJeu(tempsActuel) {
    const delta = tempsActuel - dernierTemps;
    dernierTemps = tempsActuel;
    mettreAJour(delta);
    dessiner();
    requestAnimationFrame(boucleJeu);
}

requestAnimationFrame(boucleJeu);

