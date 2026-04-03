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

// Touches appuyées
const touches = {};
document.addEventListener("keydown", e => touches[e.key] = true);
document.addEventListener("keyup", e => touches[e.key] = false);

function mettreAJour() {
    // Gravité
    joueur.velociteY += 0.5;
    joueur.y += joueur.velociteY;

    // Collision avec le sol
    if (joueur.y + joueur.hauteur >= sol.y) {
        joueur.y = sol.y - joueur.hauteur;
        joueur.velociteY = 0;
        joueur.auSol = true;
    } else {
        joueur.auSol = false;
    }

    // Déplacement gauche/droite
    if (touches["ArrowLeft"]) joueur.x -= joueur.vitesse;
    if (touches["ArrowRight"]) joueur.x += joueur.vitesse;

    // Saut
    if (touches["ArrowUp"] && joueur.auSol) {
        joueur.velociteY = -12;
    }
}

function dessiner() {
    // Effacer l'écran
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner le sol
    ctx.fillStyle = sol.couleur;
    ctx.fillRect(sol.x, sol.y, sol.largeur, sol.hauteur);

    // Dessiner le joueur
    ctx.fillStyle = joueur.couleur;
    ctx.fillRect(joueur.x, joueur.y, joueur.largeur, joueur.hauteur);
}

function boucleJeu() {
    mettreAJour();
    dessiner();
    requestAnimationFrame(boucleJeu);
}

boucleJeu();
