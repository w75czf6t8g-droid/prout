let jeuLance = false;
let gameOver = false;
let delaiProchainRemplacement = 0;
let tempsDepuisDernierRemplacement = 0;
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
    invincible: false
};

const sol = {
    x: 0,
    y: 360,
    largeur: 800,
    hauteur: 40,
    couleur: "#228B22"
};

function nouvellePlateforme(exclure = []) {
    let tentatives = 0;
    let p;
    do {
        const largeur = Math.random() * 80 + 60;
        const x = Math.random() * (canvas.width - largeur - 20) + 10;
        const y = Math.random() * 180 + 80;
        p = {
            x, y, largeur,
            hauteur: 15,
            couleur: "#8B4513",
            vie: Math.random() * 5000 + 10000,
            tempsRestant: 0,
            opacite: 0,
            apparition: true
        };
        tentatives++;
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

let plateformes = [];
for (let i = 0; i < 4; i++) {
    const p = nouvellePlateforme(plateformes);
    p.opacite = 1;
    p.apparition = false;
    plateformes.push(p);
}

// Créer un ennemi
function nouvelEnnemi() {
    return {
        x: Math.random() * 700 + 50,
        y: 330,
        rayon: 18,
        vitesse: 1.5 + Math.random(),
        direction: Math.random() > 0.5 ? 1 : -1,
        visible: true,
        angle: 0, // pour animation rotation
        nbPointes: 6
    };
}

let ennemis = [nouvelEnnemi(), nouvelEnnemi(), nouvelEnnemi()];

const touches = {};
document.addEventListener("keydown", e => touches[e.key] = true);
document.addEventListener("keyup", e => touches[e.key] = false);

let dernierTemps = performance.now();

function collision(a, b) {
    return (
        a.x < b.x + b.largeur &&
        a.x + a.largeur > b.x &&
        a.y < b.y + b.hauteur &&
        a.y + a.hauteur > b.y
    );
}

function collisionCercle(joueur, ennemi) {
    const cx = ennemi.x;
    const cy = ennemi.y;
    const px = joueur.x + joueur.largeur / 2;
    const py = joueur.y + joueur.hauteur / 2;
    const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
    return dist < ennemi.rayon + Math.min(joueur.largeur, joueur.hauteur) / 2 - 5;
}

function collisionPlateforme(p) {
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
    // La lave ne monte jamais au dessus de y=260 pour garder de l'espace jouable
    const min = 300;
    const max = 420;
    return Math.random() * (max - min) + min;
}

function mettreAJour(delta) {
    if (gameOver) return;

    // Activer la lave à 10000 points
    if (score >= 10000 && !laveActive) {
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
        // Mouvement progressif vers la cible
        if (laveY < laveCible) laveY = Math.min(laveY + laveVitesse * delta * 0.05, laveCible);
        if (laveY > laveCible) laveY = Math.max(laveY - laveVitesse * delta * 0.05, laveCible);
    }

    // Augmenter les créatures tous les 5000 points
    const palier = Math.floor(score / 5000);
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
                e.y = 330;
                e.reapparitionTimer = 0;
            }
        }
    });

    joueur.velociteY += 0.5;
    joueur.y += joueur.velociteY;
    joueur.auSol = false;

    if (joueur.y + joueur.hauteur >= sol.y) {
        joueur.y = sol.y - joueur.hauteur;
        joueur.velociteY = 0;
        joueur.auSol = true;
    }

    // Collision avec la lave
    if (laveActive && joueur.y + joueur.hauteur >= laveY && !joueur.invincible) {
        viesRestantes--;
        joueur.invincible = true;
        joueur.velociteY = -12;
        setTimeout(() => joueur.invincible = false, 2000);
        if (viesRestantes <= 0) { gameOver = true; return; }
    }

    const DUREE_FONDU = 1000;
    tempsDepuisDernierRemplacement += delta;

    plateformes.forEach((p, i) => {
        if (p.apparition) {
            p.opacite += delta / DUREE_FONDU;
            if (p.opacite >= 1) { p.opacite = 1; p.apparition = false; }
        }

        if (p.tempsRestant <= 0) {
            p.opacite -= delta / DUREE_FONDU;
            if (p.opacite <= 0) {
                const autres = plateformes.filter((_, j) => j !== i);
                plateformes[i] = nouvellePlateforme(autres);
                tempsDepuisDernierRemplacement = 0;
                delaiProchainRemplacement = Math.random() * 5000 + 10000;
            }
            return;
        }

        if (
            tempsDepuisDernierRemplacement >= delaiProchainRemplacement &&
            delaiProchainRemplacement > 0 &&
            !plateformes.some(p => p.tempsRestant <= 0)
        ) {
            const disponibles = plateformes
                .map((p, i) => ({ p, i }))
                .filter(({ p }) => !p.apparition && p.tempsRestant > 0);
            if (disponibles.length > 0) {
                const choix = disponibles[Math.floor(Math.random() * disponibles.length)];
                plateformes[choix.i].tempsRestant = 0;
            }
        }

        if (!p.apparition && p.tempsRestant < 5000 && p.tempsRestant > 0) {
            const progression = 1 - (p.tempsRestant / 5000);
            if (progression < 0.5) {
                const t = progression / 0.5;
                const r = Math.round(139 + (255 - 139) * t);
                const g = Math.round(69 + (102 - 69) * t);
                const b = Math.round(19 + (0 - 19) * t);
                p.couleur = `rgb(${r},${g},${b})`;
            } else {
                const t = (progression - 0.5) / 0.5;
                p.couleur = `rgb(255,${Math.round(102 * (1 - t))},0)`;
            }
        } else if (!p.apparition) {
            p.couleur = "#8B4513";
        }

        if (p.opacite > 0.5 && collisionPlateforme(p)) {
            joueur.y = p.y - joueur.hauteur;
            joueur.velociteY = 0;
            joueur.auSol = true;
        }
    });

    if (touches["ArrowLeft"]) joueur.x -= joueur.vitesse;
    if (touches["ArrowRight"]) joueur.x += joueur.vitesse;
    if (touches["ArrowUp"] && joueur.auSol) joueur.velociteY = -12;
    if (joueur.x < 0) joueur.x = 0;
    if (joueur.x + joueur.largeur > canvas.width) joueur.x = canvas.width - joueur.largeur;

    ennemis.forEach(ennemi => {
        if (!ennemi.visible) return;

        // Animation rotation
        ennemi.angle += delta * 0.002;

        ennemi.x += ennemi.vitesse * ennemi.direction;
        if (ennemi.x - ennemi.rayon <= 0 || ennemi.x + ennemi.rayon >= canvas.width) {
            ennemi.direction *= -1;
        }

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

// Dessiner un ennemi cercle avec pointes
function dessinerEnnemi(ennemi) {
    const { x, y, rayon, angle, nbPointes } = ennemi;
    const rayonPointe = rayon * 1.6;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Ombre
    ctx.shadowColor = "#ff000088";
    ctx.shadowBlur = 10;

    // Corps
    ctx.beginPath();
    for (let i = 0; i < nbPointes * 2; i++) {
        const r = i % 2 === 0 ? rayonPointe : rayon * 0.75;
        const a = (i * Math.PI) / nbPointes;
        i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
                : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
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

    // Yeux
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

    // Vagues de lave
    ctx.fillStyle = "#FF4500";
    ctx.beginPath();
    ctx.moveTo(0, laveY);
    for (let x = 0; x <= canvas.width; x += 20) {
        const ondulation = Math.sin(x * 0.05 + Date.now() * 0.003) * 6;
        ctx.lineTo(x, laveY + ondulation);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Lueur
    ctx.fillStyle = "#FF6600aa";
    ctx.beginPath();
    ctx.moveTo(0, laveY - 10);
    for (let x = 0; x <= canvas.width; x += 20) {
        const ondulation = Math.sin(x * 0.05 + Date.now() * 0.003 + 1) * 8;
        ctx.lineTo(x, laveY - 10 + ondulation);
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
        ctx.globalAlpha = p.opacite;
        ctx.fillStyle = p.couleur;
        ctx.fillRect(p.x, p.y, p.largeur, p.hauteur);
        ctx.globalAlpha = 1;
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
    ctx.fillText("Vies : " + "❤️".repeat(viesRestantes), 650, 30);

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
        lancerJeu();
    }
    if (mx >= cx + 20 && mx <= cx + 160 && my >= cy + 20 && my <= cy + 70) {
        lancerJeu();
        cancelAnimationFrame(animationId);
        afficherPage("menu");
    }
});

function lancerJeu() {
    if (animationId) cancelAnimationFrame(animationId);
    animationId = null;
    score = 0;
    viesRestantes = 3;
    gameOver = false;
    palierCreatures = 0;
    laveActive = false;
    laveY = 420;
    laveCible = 420;
    tempsChangementLave = 0;
    joueur.x = 100;
    joueur.y = 300;
    joueur.velociteY = 0;
    joueur.invincible = false;
    joueur.couleur = couleurs[indexCouleur].valeur;
    ennemis = [nouvelEnnemi(), nouvelEnnemi(), nouvelEnnemi()];
    plateformes = [];
    for (let i = 0; i < 4; i++) {
        const p = nouvellePlateforme(plateformes);
        p.opacite = 1;
        p.apparition = false;
        plateformes.push(p);
    }
    delaiProchainRemplacement = Math.random() * 5000 + 10000;
    tempsDepuisDernierRemplacement = 0;
    dernierTemps = performance.now();
    animationId = requestAnimationFrame(boucleJeu);
}
