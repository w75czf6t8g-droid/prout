let jeuLance = false;
let gameOver = false;
let animationId = null;
let palierCreatures = 0;
let laveActive = false;
let laveY = 420;
let laveCible = 420;
let laveVitesse = 0.5;
let tempsChangementLave = 0;
let delaiChangementLave = 0;

const canvas = document.getElementById("jeu");
const ctx = canvas.getContext("2d");

let score = 0;
let viesRestantes = 3;

const joueur = {
    x: 100,
    y: 300,
    largeur: 40,
    hauteur: 40,
    vitesse: 5,
    velociteY: 0,
    auSol: false,
    couleur: "#FF0000",
    invincible: false,
    traversePlateforme: false
};

const sol = {
    x: 0,
    y: 360,
    largeur: 800,
    hauteur: 40,
    couleur: "#228B22"
};

function creerPlateformes() {
    const largeur = 90;
    const hauteur = 12;
    const colonnes = [140, 370, 590];
    const lignes = [260, 140];
    const result = [];
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
            result.push({
                x: colonnes[col],
                y: lignes[row],
                largeur, hauteur,
                couleur: "#8B4513",
                opacite: 1,
                apparition: false
            });
        }
    }
    return result;
}

let plateformes = creerPlateformes();

function nouvelEnnemi() {
    return {
        x: Math.random() * 700 + 50,
        y: Math.random() * 250 + 50,
        rayon: 18,
        vitesse: 2 + Math.random(),
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        visible: true,
        angle: 0,
        nbPointes: 6,
        reapparitionTimer: 0
    };
}

let ennemis = [nouvelEnnemi(), nouvelEnnemi(), nouvelEnnemi()];

const touches = {};
document.addEventListener("keydown", e => touches[e.key] = true);
document.addEventListener("keyup", e => touches[e.key] = false);

let dernierTemps = performance.now();

function collisionCercle(joueur, ennemi) {
    const cx = ennemi.x;
    const cy = ennemi.y;
    const px = joueur.x + joueur.largeur / 2;
    const py = joueur.y + joueur.hauteur / 2;
    const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
    return dist < ennemi.rayon + Math.min(joueur.largeur, joueur.hauteur) / 2 - 5;
}

function collisionPlateforme(p) {
    if (joueur.traversePlateforme) return false;
    return (
        p.opacite > 0.3 &&
        joueur.x < p.x + p.largeur &&
        joueur.x + joueur.largeur > p.x &&
        joueur.y + joueur.hauteur >= p.y &&
        joueur.y + joueur.hauteur <= p.y + p.hauteur + 10 &&
        joueur.velociteY >= 0
    );
}

function nouvelleCibleLave() {
    const min = 155;
    const max = 380;
    return Math.random() * (max - min) + min;
}

function mettreAJour(delta) {
    if (gameOver) return;

    // Activer la lave à 2500 points
    if (score >= 2500 && !laveActive) {
        laveActive = true;
        laveY = 420;
        laveCible = nouvelleCibleLave();
        delaiChangementLave = Math.random() * 3000 + 2000;
    }

    // Mise à jour lave
    if (laveActive) {
        tempsChangementLave += delta;
        if (tempsChangementLave >= delaiChangementLave) {
            laveCible = nouvelleCibleLave();
            tempsChangementLave = 0;
            delaiChangementLave = Math.random() * 3000 + 2000;
        }
        if (laveY < laveCible) laveY = Math.min(laveY + laveVitesse * delta * 0.05, laveCible);
        if (laveY > laveCible) laveY = Math.max(laveY - laveVitesse * delta * 0.05, laveCible);
    }

    // Augmenter les créatures tous les 1000 points
    const palier = Math.floor(score / 1000);
    if (palier > palierCreatures) {
        palierCreatures = palier;
        ennemis.push(nouvelEnnemi());
    }

    // Réapparition des ennemis tués
    ennemis.forEach(e => {
        if (!e.visible) {
            e.reapparitionTimer = (e.reapparitionTimer || 0) + delta;
            if (e.reapparitionTimer > 3000) {
                e.visible = true;
                e.x = Math.random() * 700 + 50;
                e.y = Math.random() * 250 + 50;
                e.vx = (Math.random() - 0.5) * 6;
                e.vy = (Math.random() - 0.5) * 6;
                e.reapparitionTimer = 0;
            }
        }
    });

    // Gravité
    joueur.velociteY += 0.5;
    joueur.y += joueur.velociteY;
    joueur.auSol = false;

    // Sol
    if (joueur.y + joueur.hauteur >= sol.y && !joueur.traversePlateforme) {
        joueur.y = sol.y - joueur.hauteur;
        joueur.velociteY = 0;
        joueur.auSol = true;
    }

    // Plafond
    if (joueur.y < 0) {
        joueur.y = 0;
        joueur.velociteY = 0;
    }

    // Collision lave
    if (laveActive && joueur.y + joueur.hauteur >= laveY && !joueur.invincible) {
        viesRestantes--;
        joueur.invincible = true;
        joueur.velociteY = -12;
        setTimeout(() => joueur.invincible = false, 2000);
        if (viesRestantes <= 0) { gameOver = true; return; }
    }

    // Collision plateformes
    plateformes.forEach(p => {
        if (collisionPlateforme(p)) {
            joueur.y = p.y - joueur.hauteur;
            joueur.velociteY = 0;
            joueur.auSol = true;
        }
    });

    // Déplacement joueur
    const vitesseFrame = joueur.vitesse * (delta / 16);
    if (touches["ArrowLeft"]) joueur.x -= vitesseFrame;
    if (touches["ArrowRight"]) joueur.x += vitesseFrame;
    if (touches["ArrowUp"] && joueur.auSol) joueur.velociteY = -15;
    if (touches["ArrowDown"]) {
        joueur.traversePlateforme = true;
        joueur.auSol = false;
        joueur.velociteY = 5;
    } else {
        joueur.traversePlateforme = false;
    }

    if (joueur.x < 0) joueur.x = 0;
    if (joueur.x + joueur.largeur > canvas.width) joueur.x = canvas.width - joueur.largeur;

    // Ennemis
    ennemis.forEach(ennemi => {
        if (!ennemi.visible) return;

        ennemi.angle += delta * 0.002;
        ennemi.x += ennemi.vx * (delta / 16);
        ennemi.y += ennemi.vy * (delta / 16);

        if (ennemi.x - ennemi.rayon <= 0) { ennemi.x = ennemi.rayon; ennemi.vx = Math.abs(ennemi.vx); }
        if (ennemi.x + ennemi.rayon >= canvas.width) { ennemi.x = canvas.width - ennemi.rayon; ennemi.vx = -Math.abs(ennemi.vx); }
        if (ennemi.y - ennemi.rayon <= 0) { ennemi.y = ennemi.rayon; ennemi.vy = Math.abs(ennemi.vy); }
        if (ennemi.y + ennemi.rayon >= sol.y) { ennemi.y = sol.y - ennemi.rayon; ennemi.vy = -Math.abs(ennemi.vy); }
        if (laveActive && ennemi.y + ennemi.rayon >= laveY) { ennemi.y = laveY - ennemi.rayon; ennemi.vy = -Math.abs(ennemi.vy) - 1; }

        if (collisionCercle(joueur, ennemi) && !joueur.invincible) {
            if (joueur.velociteY > 0 && joueur.y + joueur.hauteur < ennemi.y - ennemi.rayon + 15) {
                score += 100;
                ennemi.visible = false;
                ennemi.reapparitionTimer = 0;
                joueur.velociteY = -10;
            } else {
                viesRestantes--;
                joueur.invincible = true;
                setTimeout(() => joueur.invincible = false, 2000);
                if (viesRestantes <= 0) { gameOver = true; }
            }
        }
    });

    score++;
}

function dessinerEnnemi(ennemi) {
    const { x, y, rayon, angle, nbPointes } = ennemi;
    const rayonPointe = rayon * 1.6;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.shadowColor = "#ff000088";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let i = 0; i < nbPointes * 2; i++) {
        const r = i % 2 === 0 ? rayonPointe : rayon * 0.75;
        const a = (i * Math.PI) / nbPointes;
        i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, rayonPointe);
    gradient.addColorStop(0, "#ff6600");
    gradient.addColorStop(1, "#800000");
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "#ffaa00";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "white";
    ctx.beginPath(); ctx.arc(-6, -4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, -4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "black";
    ctx.beginPath(); ctx.arc(-6, -3, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, -3, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function dessinerLave() {
    if (!laveActive) return;
    ctx.fillStyle = "#FF4500";
    ctx.beginPath();
    ctx.moveTo(0, laveY);
    for (let x = 0; x <= canvas.width; x += 20) {
        ctx.lineTo(x, laveY + Math.sin(x * 0.05 + Date.now() * 0.003) * 6);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#FF6600aa";
    ctx.beginPath();
    ctx.moveTo(0, laveY - 10);
    for (let x = 0; x <= canvas.width; x += 20) {
        ctx.lineTo(x, laveY - 10 + Math.sin(x * 0.05 + Date.now() * 0.003 + 1) * 8);
    }
    ctx.lineTo(canvas.width, laveY);
    ctx.lineTo(0, laveY);
    ctx.closePath();
    ctx.fill();
}

function dessiner() {
    ctx.fillStyle = couleurFondActuelle();
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = sol.couleur;
    ctx.fillRect(sol.x, sol.y, sol.largeur, sol.hauteur);

    plateformes.forEach(p => {
        ctx.fillStyle = p.couleur;
        ctx.fillRect(p.x, p.y, p.largeur, p.hauteur);
    });

    dessinerLave();

    ennemis.forEach(e => { if (e.visible) dessinerEnnemi(e); });

    if (!joueur.invincible || Math.floor(Date.now() / 200) % 2 === 0) {
        ctx.fillStyle = joueur.couleur;
        ctx.fillRect(joueur.x, joueur.y, joueur.largeur, joueur.hauteur);
    }

    ctx.fillStyle = "black";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Score : " + score, 10, 30);
    if (hardcore) {
        ctx.fillStyle = "#FF0000";
        ctx.fillText("HARDCORE", 620, 30);
    } else {
        ctx.fillStyle = "black";
        ctx.fillText("Vies : " + "❤️".repeat(viesRestantes), 650, 30);
    }
    if (laveActive) {
        ctx.fillStyle = "#FF4500";
        ctx.font = "bold 14px Arial";
        ctx.fillText("🌋 LAVE !", 10, 55);
    }

    if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#FF0000";
        ctx.font = "bold 72px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 60);
        ctx.fillStyle = "white";
        ctx.font = "bold 24px Arial";
        ctx.fillText("Score : " + score, canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillStyle = "#FF0000";
        ctx.beginPath();
        ctx.roundRect(canvas.width / 2 - 160, canvas.height / 2 + 20, 140, 50, 10);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.fillText("🔄 Rejouer", canvas.width / 2 - 90, canvas.height / 2 + 52);
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
    animationId = requestAnimationFrame(boucleJeu);
}

canvas.addEventListener("click", (e) => {
    if (!gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (mx >= cx - 160 && mx <= cx - 20 && my >= cy + 20 && my <= cy + 70) {
        lancerJeu(hardcore);
    }

    if (mx >= cx + 20 && mx <= cx + 160 && my >= cy + 20 && my <= cy + 70) {
        if (animationId) cancelAnimationFrame(animationId);
        animationId = null;
        gameOver = false;
        jeuLance = false;
        afficherPage("menu");
    }
});

let hardcore = false;
function lancerJeu(modeHardcore = false) {
    hardcore = modeHardcore;
    if (animationId) cancelAnimationFrame(animationId);
    animationId = null;
    score = 0;
    viesRestantes = modeHardcore ? 1 : 3;
    gameOver = false;
    palierCreatures = 0;
    laveActive = false;
    laveY = 420;
    laveCible = 420;
    tempsChangementLave = 0;
    joueur.x = 100;
    joueur.y = 300;
    joueur.velociteY = 0;
    joueur.invincible = true;
    joueur.traversePlateforme = false;
    setTimeout(() => joueur.invincible = false, 3000);
    joueur.couleur = couleurs[indexCouleur].valeur;
    ennemis = [nouvelEnnemi(), nouvelEnnemi(), nouvelEnnemi()];
    plateformes = creerPlateformes();
    dernierTemps = performance.now();
    animationId = requestAnimationFrame(boucleJeu);
}
