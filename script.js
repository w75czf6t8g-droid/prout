const canvas = document.getElementById("jeu");
const ctx = canvas.getContext("2d");

// Le joueur
const joueur = {
    x: 100,
    y: 300,
    largeur: 40,
    hauteur: 40,
    vitesse: 5,
    velociteY: 0,
    auSol: false,
    couleur: "#FF0000"
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

// Touches appuyées
const touches = {};
document.addEventListener("keydown", e => touches[e.key] = true);
document.addEventListener("keyup", e => touches[e.key] = false);

// Vérifier collision avec une plateforme
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

    // Collision avec le sol
    if (joueur.y + joueur.hauteur >= sol.y) {
        joueur.y = sol.y - joueur.hauteur;
        joueur.velociteY = 0;
        joueur.auSol = true;
    }

    // Collision avec les plateformes
    plateformes.forEach(p => {
        if (collisionPlateforme(p)) {
            joueur.y = p.y - joueur.hauteur;
            joueur.velociteY = 0;
            joueur.auSol = true;
        }
    });

    // Déplacement gauche/droite
    if (touches["ArrowLeft"]) joueur.x -= joueur.vitesse;
    if (touches["ArrowRight"]) joueur.x += joueur.vitesse;

    // Saut
    if (touches["ArrowUp"] && joueur.auSol) {
        joueur.velociteY = -12;
    }

    // Empêcher de sortir de l'écran
    if (joueur.x < 0) joueur.x = 0;
    if (joueur.x + joueur.largeur > canvas.width) joueur.x = canvas.width - joueur.largeur;
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

    // Joueur
    ctx.fillStyle = joueur.couleur;
    ctx.fillRect(joueur.x, joueur.y, joueur.largeur, joueur.hauteur);
}

function boucleJeu() {
    mettreAJour();
    dessiner();
    requestAnimationFrame(boucleJeu);
}

boucleJeu();
