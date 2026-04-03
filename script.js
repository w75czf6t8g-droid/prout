let jeuLance = false;
let gameOver = false;
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
function nouvellePlateforme(exclure = []) {
    let tentatives = 0;
    let p;
    do {
        const largeur = Math.random() * 80 + 60;
        const x = Math.random() * (canvas.width - largeur - 20) + 10;
        const y = Math.random() * 200 + 100;
        p = {
            x, y, largeur,
            hauteur: 15,
            couleur: "#8B4513",
            vie: Math.random() * 5000 + 8000,
            tempsRestant: 0,
            opacite: 0, // Commence invisible pour apparition progressive
            apparition: true // En train d'apparaître
        };
        tentatives++;
        // Vérifie qu'elle ne chevauche pas les autres
        const chevauche = exclure.some(autre =>
            p.x < autre.x + autre.largeur + 20 &&
            p.x + p.largeur + 20 > autre.x &&
            p.y < autre.y + autre.hauteur + 20 &&
            p.y + p.hauteur + 20 > autre.y
        );
        if (!chevauche) break;
    } while (tentatives < 50);

    p.tempsRestant = p.vie;
    return p;
}

// Plateformes initiales
let plateformes = [];
for (let i = 0; i < 4; i++) {
    const p = nouvellePlateforme(plateformes);
    p.opacite = 1; // Plateformes initiales déjà visibles
    plateformes.push(p);
}

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
    if (gameOver) return;
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
    const DUREE_FONDU = 1000; // 1 seconde pour apparaître/disparaître

    plateformes.forEach((p, i) => {
        // Apparition progressive
        if (p.apparition) {
            p.opacite += delta / DUREE_FONDU;
            if (p.opacite >= 1) {
                p.opacite = 1;
                p.apparition = false;
            }
        } else {
            // Décompte uniquement quand totalement apparue
            p.tempsRestant -= delta;
        }

        // Variation de couleur sur les 5 dernières secondes
        if (!p.apparition && p.tempsRestant < 5000) {
            const progression = 1 - (p.tempsRestant / 5000);
            if (progression < 0.5) {
                const t = progression / 0.5;
                const r = Math.round(139 + (255 - 139) * t);
                const g = Math.round(69 + (102 - 69) * t);
                const b = Math.round(19 + (0 - 19) * t);
                p.couleur = `rgb(${r},${g},${b})`;
            } else {
                const t = (progression - 0.5) / 0.5;
                const r = 255;
                const g = Math.round(102 * (1 - t));
                const b = 0;
                p.couleur = `rgb(${r},${g},${b})`;
            }
        } else if (!p.apparition) {
            p.couleur = "#8B4513";
        }

        // Disparition progressive puis remplacement
        if (p.tempsRestant <= 0) {
            p.opacite -= delta / DUREE_FONDU;
            if (p.opacite <= 0) {
                // Remplacer sans chevaucher les autres
                const autresPlateformes = plateformes.filter((_, j) => j !== i);
                plateformes[i] = nouvellePlateforme(autresPlateformes);
            }
        }

        // Collision uniquement si bien visible
        if (p.opacite > 0.5 && collisionPlateforme(p)) {
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
                    gameOver = true;
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

    // Écran Game Over
    if (gameOver) {
        // Fond semi-transparent
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Texte GAME OVER
        ctx.fillStyle = "#FF0000";
        ctx.font = "bold 72px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 60);

        // Score final
        ctx.fillStyle = "white";
        ctx.font = "bold 24px Arial";
        ctx.fillText("Score : " + score, canvas.width / 2, canvas.height / 2 - 10);

        // Bouton Rejouer
        ctx.fillStyle = "#FF0000";
        ctx.beginPath();
        ctx.roundRect(canvas.width / 2 - 160, canvas.height / 2 + 20, 140, 50, 10);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.fillText("🔄 Rejouer", canvas.width / 2 - 90, canvas.height / 2 + 52);

        // Bouton Menu
        ctx.fillStyle = "#444444";
        ctx.beginPath();
        ctx.roundRect(canvas.width / 2 + 20, canvas.height / 2 + 20, 140, 50, 10);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.fillText("🏠 Menu", canvas.width / 2 + 90, canvas.height / 2 + 52);

        ctx.textAlign = "left";
    }
}

function boucleJeu(tempsActuel) {
    const delta = tempsActuel - dernierTemps;
    dernierTemps = tempsActuel;
    mettreAJour(delta);
    dessiner();
    requestAnimationFrame(boucleJeu);
}
canvas.addEventListener("click", (e) => {
    if (!gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Clic sur Rejouer
    if (mx >= cx - 160 && mx <= cx - 20 && my >= cy + 20 && my <= cy + 70) {
        gameOver = false;
        score = 0;
        viesRestantes = 3;
        joueur.x = 100;
        joueur.y = 300;
        joueur.velociteY = 0;
        ennemis.forEach(e => { e.visible = true; });
        ennemis[0].x = 200;
        ennemis[1].x = 400;
        ennemis[2].x = 560;
       plateformes = [];
        for (let i = 0; i < 4; i++) {
            const p = nouvellePlateforme(plateformes);
            p.opacite = 1;
            plateformes.push(p);
        }
    }

    // Clic sur Menu
    if (mx >= cx + 20 && mx <= cx + 160 && my >= cy + 20 && my <= cy + 70) {
        gameOver = false;
        score = 0;
        viesRestantes = 3;
        joueur.x = 100;
        joueur.y = 300;
        joueur.velociteY = 0;
        jeuLance = false;
        ennemis.forEach(e => { e.visible = true; });
        ennemis[0].x = 200;
        ennemis[1].x = 400;
        ennemis[2].x = 560;
       plateformes = [];
        for (let i = 0; i < 4; i++) {
            const p = nouvellePlateforme(plateformes);
            p.opacite = 1;
            plateformes.push(p);
        }
        afficherPage("menu");
    }
});

function lancerJeu() {
    if (jeuLance) return;
    jeuLance = true;
    score = 0;
    viesRestantes = 3;
    joueur.x = 100;
    joueur.y = 300;
    joueur.couleur = couleurs[indexCouleur].valeur;
    requestAnimationFrame(boucleJeu);
}

