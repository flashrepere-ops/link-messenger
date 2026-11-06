/* =========================================
   BAC REUSSITE INTERNATIONAL
   POWER PILOT TECHNOLOGY
   ========================================= */

let selectedZone = "";
let currentLanguage = "fr";
let currentStudent = null;

const STORAGE_KEY = "bri_student";

/* =========================================
   BASE DES COURS
   PARCOURS PILOTE : TOGO - TERMINALE D
   ========================================= */

const courses = {

    "Mathématiques": {
        icon: "📐",
        chapters: [
            {
                title: "Étude des fonctions",
                content: `
                    <h3>Étude des fonctions</h3>
                    <p>Une fonction associe à chaque valeur de x
                    une unique valeur appelée image.</p>

                    <h4>1. Domaine de définition</h4>
                    <p>Le domaine de définition est l'ensemble
                    des valeurs de x pour lesquelles la fonction
                    existe.</p>

                    <h4>2. Dérivée</h4>
                    <p>La dérivée permet d'étudier les variations
                    d'une fonction.</p>

                    <h4>3. Sens de variation</h4>
                    <p>Si f'(x) est positive, la fonction est
                    croissante.</p>
                    <p>Si f'(x) est négative, la fonction est
                    décroissante.</p>
                `
            },
            {
                title: "Limites",
                content: `
                    <h3>Les limites</h3>
                    <p>La limite permet d'étudier le comportement
                    d'une fonction lorsque x se rapproche
                    d'une valeur ou tend vers l'infini.</p>

                    <h4>Limites usuelles</h4>
                    <p>lim x→+∞ (1/x) = 0</p>
                    <p>lim x→+∞ x = +∞</p>
                    <p>lim x→+∞ x² = +∞</p>

                    <h4>Formes indéterminées</h4>
                    <p>Les principales formes indéterminées sont :</p>
                    <p>∞ - ∞ ; 0/0 ; ∞/∞ ; 0 × ∞.</p>
                `
            },
            {
                title: "Dérivation",
                content: `
                    <h3>La dérivation</h3>

                    <p>La dérivée d'une fonction permet de
                    déterminer sa pente et ses variations.</p>

                    <h4>Formules importantes</h4>
                    <p>(xⁿ)' = n xⁿ⁻¹</p>
                    <p>(1/x)' = -1/x²</p>
                    <p>(√x)' = 1/(2√x)</p>
                    <p>(ln x)' = 1/x</p>
                    <p>(eˣ)' = eˣ</p>

                    <h4>Produit</h4>
                    <p>(uv)' = u'v + uv'</p>

                    <h4>Quotient</h4>
                    <p>(u/v)' = (u'v - uv')/v²</p>
                `
            },
            {
                title: "Logarithme népérien",
                content: `
                    <h3>Logarithme népérien</h3>

                    <p>La fonction logarithme népérien
                    est notée ln(x).</p>

                    <h4>Propriétés</h4>
                    <p>ln(1) = 0</p>
                    <p>ln(e) = 1</p>
                    <p>ln(ab) = ln(a) + ln(b)</p>
                    <p>ln(a/b) = ln(a) - ln(b)</p>
                    <p>ln(aⁿ) = n ln(a)</p>

                    <h4>Domaine</h4>
                    <p>La fonction ln(x) est définie
                    uniquement pour x > 0.</p>

                    <h4>Dérivée</h4>
                    <p>(ln x)' = 1/x</p>
                `
            }
        ]
    },

    "SVT": {
        icon: "🧬",
        chapters: [
            {
                title: "Génétique",
                content: `
                    <h3>La génétique</h3>

                    <p>La génétique est la science qui étudie
                    la transmission des caractères héréditaires.</p>

                    <h4>Notions essentielles</h4>
                    <p><strong>Gène :</strong> portion d'ADN
                    portant une information génétique.</p>

                    <p><strong>Allèle :</strong> version
                    d'un même gène.</p>

                    <p><strong>Génotype :</strong> ensemble
                    des allèles d'un individu.</p>

                    <p><strong>Phénotype :</strong> ensemble
                    des caractères observables.</p>

                    <p><strong>Homozygote :</strong> deux allèles
                    identiques.</p>

                    <p><strong>Hétérozygote :</strong> deux allèles
                    différents.</p>
                `
            },
            {
                title: "Reproduction humaine",
                content: `
                    <h3>La reproduction humaine</h3>

                    <p>La reproduction humaine est sexuée.
                    Elle fait intervenir deux types de gamètes :
                    le spermatozoïde et l'ovule.</p>

                    <h4>La fécondation</h4>
                    <p>La fécondation correspond à la fusion
                    des gamètes mâle et femelle.</p>

                    <h4>La cellule-œuf</h4>
                    <p>La cellule-œuf est la première cellule
                    du nouvel individu.</p>
                `
            },
            {
                title: "Évolution biologique",
                content: `
                    <h3>L'évolution biologique</h3>

                    <p>L'évolution biologique correspond aux
                    transformations des populations au cours
                    des générations.</p>

                    <h4>Facteurs de l'évolution</h4>
                    <p>- Mutations génétiques.</p>
                    <p>- Sélection naturelle.</p>
                    <p>- Dérive génétique.</p>
                    <p>- Flux de gènes.</p>
                `
            }
        ]
    },

    "Physique-Chimie": {
        icon: "⚗️",
        chapters: [
            {
                title: "Mécanique",
                content: `
                    <h3>La mécanique</h3>

                    <p>La mécanique étudie les mouvements
                    et les interactions des corps.</p>

                    <h4>Vitesse</h4>
                    <p>v = d/t</p>

                    <h4>Accélération</h4>
                    <p>a = Δv/Δt</p>

                    <h4>Deuxième loi de Newton</h4>
                    <p>ΣF = m × a</p>

                    <p>La somme des forces appliquées à un corps
                    est égale au produit de sa masse par
                    son accélération.</p>
                `
            },
            {
                title: "Électricité",
                content: `
                    <h3>L'électricité</h3>

                    <h4>Loi d'Ohm</h4>
                    <p>U = R × I</p>

                    <p>U : tension en volts.</p>
                    <p>R : résistance en ohms.</p>
                    <p>I : intensité en ampères.</p>

                    <h4>Puissance électrique</h4>
                    <p>P = U × I</p>

                    <h4>Énergie électrique</h4>
                    <p>E = P × t</p>
                `
            },
            {
                title: "Chimie organique",
                content: `
                    <h3>Chimie organique</h3>

                    <p>La chimie organique étudie principalement
                    les composés du carbone.</p>

                    <h4>Les alcanes</h4>
                    <p>Formule générale : CₙH₂ₙ₊₂</p>

                    <h4>Les alcènes</h4>
                    <p>Formule générale : CₙH₂ₙ</p>

                    <h4>Combustion complète</h4>
                    <p>Un composé contenant du carbone et de
                    l'hydrogène brûle en donnant du CO₂
                    et de l'eau.</p>
                `
            }
        ]
    },

    "Français": {
        icon: "📚",
        chapters: [
            {
                title: "La dissertation",
                content: `
                    <h3>La dissertation française</h3>

                    <p>La dissertation est un exercice
                    de réflexion organisée autour d'un sujet.</p>

                    <h4>Introduction</h4>
                    <p>Elle comporte généralement :</p>
                    <p>- L'amorce.</p>
                    <p>- La présentation du sujet.</p>
                    <p>- La problématique.</p>
                    <p>- L'annonce du plan.</p>

                    <h4>Développement</h4>
                    <p>Il présente les arguments et les exemples.</p>

                    <h4>Conclusion</h4>
                    <p>Elle fait le bilan de la réflexion
                    et répond à la problématique.</p>
                `
            },
            {
                title: "Le commentaire composé",
                content: `
                    <h3>Le commentaire composé</h3>

                    <p>Le commentaire composé consiste à analyser
                    un texte littéraire.</p>

                    <h4>Les étapes</h4>
                    <p>1. Lire attentivement le texte.</p>
                    <p>2. Identifier les thèmes importants.</p>
                    <p>3. Repérer les procédés littéraires.</p>
                    <p>4. Organiser les axes d'analyse.</p>
                    <p>5. Rédiger le commentaire.</p>
                `
            }
        ]
    },

    "Anglais": {
        icon: "🌍",
        chapters: [
            {
                title: "English Grammar",
                content: `
                    <h3>English Grammar</h3>

                    <h4>Present Simple</h4>
                    <p>I work. / She works.</p>

                    <h4>Past Simple</h4>
                    <p>I worked yesterday.</p>

                    <h4>Present Perfect</h4>
                    <p>I have finished my homework.</p>

                    <h4>Future</h4>
                    <p>I will study tomorrow.</p>
                `
            },
            {
                title: "Vocabulary",
                content: `
                    <h3>English Vocabulary</h3>

                    <p>Education = Éducation</p>
                    <p>Knowledge = Connaissance</p>
                    <p>Success = Réussite</p>
                    <p>Environment = Environnement</p>
                    <p>Development = Développement</p>
                    <p>Future = Avenir</p>
                    <p>Student = Élève</p>
                    <p>Teacher = Enseignant</p>
                `
            }
        ]
    },

    "Philosophie": {
        icon: "🧠",
        chapters: [
            {
                title: "La conscience",
                content: `
                    <h3>La conscience</h3>

                    <p>La conscience est la capacité qu'a
                    l'être humain de se rendre compte de
                    ses pensées et de ses actes.</p>

                    <h4>Problématique</h4>
                    <p>La conscience suffit-elle à définir
                    l'être humain ?</p>

                    <h4>Notions importantes</h4>
                    <p>- Conscience de soi.</p>
                    <p>- Conscience morale.</p>
                    <p>- Inconscient.</p>
                `
            },
            {
                title: "La liberté",
                content: `
                    <h3>La liberté</h3>

                    <p>La liberté désigne la capacité
                    d'agir et de choisir.</p>

                    <h4>Problématique</h4>
                    <p>L'homme est-il totalement libre ?</p>

                    <h4>Notions importantes</h4>
                    <p>- Liberté.</p>
                    <p>- Responsabilité.</p>
                    <p>- Déterminisme.</p>
                    <p>- Choix.</p>
                `
            }
        ]
    }

};


/* =========================================
   SELECTION DE LA ZONE
   ========================================= */

function selectZone(zone, button) {

    selectedZone = zone;

    document.querySelectorAll(".zone").forEach(item => {
        item.classList.remove("active");
    });

    if (button) {
        button.classList.add("active");
    }

    currentLanguage = zone === "en" ? "en" : "fr";
}

window.selectZone = selectZone;


/* =========================================
   CHANGEMENT DE LANGUE
   ========================================= */

function changeLanguage(language) {

    currentLanguage = language;

    selectedZone = language === "en" ? "en" : "fr";
}

window.changeLanguage = changeLanguage;


/* =========================================
   DEMARRAGE DE L'APPLICATION
   ========================================= */

function startApp() {

    const country = document.getElementById("country").value;
    const level = document.getElementById("level").value;
    const series = document.getElementById("series").value;

    const message = document.getElementById("message");

    if (!selectedZone) {
        message.textContent = "Choisis d'abord ton espace.";
        return;
    }

    if (!country || !level || !series) {
        message.textContent = "Complète toutes les informations.";
        return;
    }

    currentStudent = {
        zone: selectedZone,
        language: currentLanguage,
        country: country,
        level: level,
        series: series
    };

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(currentStudent)
    );

    openDashboard();
}

window.startApp = startApp;


/* =========================================
   OUVERTURE DU TABLEAU DE BORD
   ========================================= */

function openDashboard() {

    const setup = document.getElementById("setupScreen");
    const dashboard = document.getElementById("dashboardScreen");

    setup.hidden = true;
    dashboard.hidden = false;

    document.getElementById("dashboardGreeting").textContent =
        "Bienvenue dans BAC RÉUSSITE INTERNATIONAL";

    document.getElementById("dashboardProfile").textContent =
        currentStudent.country + " • " +
        currentStudent.level + " • Série " +
        currentStudent.series;

}


/* =========================================
   NAVIGATION DU TABLEAU DE BORD
   ========================================= */

document.addEventListener("click", function(event) {

    const card = event.target.closest(".dashboard-card");

    if (!card) return;

    const section = card.dataset.section;

    if (section === "courses") {
        showCourses();
    } else {
        showDashboardMessage(section);
    }

});


/* =========================================
   AFFICHAGE DES MATIERES
   ========================================= */

function showCourses() {

    const info = document.querySelector(".dashboard-info");

    let html = `
        <button class="back-button" onclick="openDashboard()">
            ← Retour au tableau de bord
        </button>

        <h2>📚 MES COURS</h2>

        <p>
            Découvre les matières disponibles
            dans notre parcours pédagogique pilote.
        </p>

        <div class="dashboard