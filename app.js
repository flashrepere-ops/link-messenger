// ==========================================
// BAC RÉUSSITE INTERNATIONAL
// POWER PILOT TECHNOLOGY
// ESPACE ÉDUCATIF
// ==========================================

let selectedZone = "";
let currentLanguage = "fr";
let currentStudent = null;


// ==========================================
// BASE DE DONNÉES DES COURS
// PREMIER PARCOURS : TOGO - TERMINALE D
// ==========================================

const courses = {

    "Mathématiques": {
        icon: "📐",
        chapters: [
            {
                title: "Les fonctions numériques",
                lesson: `
                    <h3>Introduction</h3>
                    <p>
                        Une fonction numérique est une relation
                        qui associe à chaque nombre x de son
                        ensemble de définition un unique nombre
                        appelé image de x.
                    </p>

                    <h3>Notation</h3>
                    <p>
                        On note généralement une fonction :
                        f : x → f(x).
                    </p>

                    <h3>Exemple</h3>
                    <p>
                        Soit f(x) = 2x + 3.
                    </p>
                    <p>
                        Pour x = 2 :
                    </p>
                    <p>
                        f(2) = 2 × 2 + 3 = 7.
                    </p>
                `
            },

            {
                title: "Les limites",
                lesson: `
                    <h3>Définition</h3>
                    <p>
                        La limite permet d'étudier le comportement
                        d'une fonction lorsque la variable
                        se rapproche d'une valeur donnée
                        ou devient très grande.
                    </p>

                    <h3>Exemple</h3>
                    <p>
                        Lorsque x tend vers +∞,
                        la fonction f(x) = x + 2
                        tend vers +∞.
                    </p>
                `
            },

            {
                title: "La dérivation",
                lesson: `
                    <h3>Définition</h3>
                    <p>
                        La dérivée d'une fonction permet
                        d'étudier les variations de cette fonction.
                    </p>

                    <h3>Formule fondamentale</h3>
                    <p>
                        Si f(x) = x², alors :
                    </p>
                    <p>
                        f'(x) = 2x.
                    </p>
                `
            },

            {
                title: "Les logarithmes",
                lesson: `
                    <h3>Le logarithme népérien</h3>
                    <p>
                        Le logarithme népérien est une fonction
                        définie sur l'ensemble des réels
                        strictement positifs.
                    </p>

                    <h3>Formule</h3>
                    <p>
                        La dérivée de ln(x) est :
                    </p>
                    <p>
                        (ln x)' = 1/x, pour x > 0.
                    </p>
                `
            }
        ]
    },


    "Sciences de la Vie et de la Terre": {
        icon: "🧬",
        chapters: [
            {
                title: "La génétique",
                lesson: `
                    <h3>Introduction</h3>
                    <p>
                        La génétique est la science qui étudie
                        la transmission des caractères
                        héréditaires.
                    </p>

                    <h3>Notions importantes</h3>
                    <p>
                        - Gène
                        <br>
                        - Allèle
                        <br>
                        - Chromosome
                        <br>
                        - Génotype
                        <br>
                        - Phénotype
                    </p>
                `
            },

            {
                title: "La reproduction humaine",
                lesson: `
                    <h3>Introduction</h3>
                    <p>
                        La reproduction humaine est un processus
                        biologique qui permet la formation
                        d'un nouvel individu.
                    </p>

                    <h3>Les gamètes</h3>
                    <p>
                        Les gamètes humains sont :
                        le spermatozoïde et l'ovule.
                    </p>
                `
            },

            {
                title: "L'évolution biologique",
                lesson: `
                    <h3>Définition</h3>
                    <p>
                        L'évolution biologique correspond
                        aux changements des caractéristiques
                        héréditaires des populations au cours
                        des générations.
                    </p>
                `
            }
        ]
    },


    "Physique-Chimie": {
        icon: "⚗️",
        chapters: [
            {
                title: "La mécanique",
                lesson: `
                    <h3>Introduction</h3>
                    <p>
                        La mécanique étudie les mouvements
                        et les interactions entre les corps.
                    </p>

                    <h3>Quelques grandeurs</h3>
                    <p>
                        - Position
                        <br>
                        - Vitesse
                        <br>
                        - Accélération
                        <br>
                        - Force
                    </p>
                `
            },

            {
                title: "L'électricité",
                lesson: `
                    <h3>Introduction</h3>
                    <p>
                        L'électricité étudie les phénomènes
                        liés aux charges électriques.
                    </p>

                    <h3>Loi d'Ohm</h3>
                    <p>
                        U = R × I
                    </p>
                    <p>
                        U représente la tension,
                        R la résistance et I l'intensité.
                    </p>
                `
            },

            {
                title: "La chimie organique",
                lesson: `
                    <h3>Définition</h3>
                    <p>
                        La chimie organique étudie principalement
                        les composés du carbone.
                    </p>

                    <h3>Exemples</h3>
                    <p>
                        Les alcanes, les alcènes et les alcools
                        sont des familles de composés organiques.
                    </p>
                `
            }
        ]
    },


    "Français": {
        icon: "📖",
        chapters: [
            {
                title: "La dissertation",
                lesson: `
                    <h3>Définition</h3>
                    <p>
                        La dissertation est un exercice
                        qui consiste à développer une réflexion
                        organisée autour d'un sujet.
                    </p>

                    <h3>Les grandes parties</h3>
                    <p>
                        1. Introduction
                        <br>
                        2. Développement
                        <br>
                        3. Conclusion
                    </p>
                `
            },

            {
                title: "Le commentaire composé",
                lesson: `
                    <h3>Définition</h3>
                    <p>
                        Le commentaire composé consiste
                        à analyser un texte littéraire
                        en organisant les observations
                        autour de différents axes.
                    </p>
                `
            }
        ]
    },


    "Anglais": {
        icon: "🌍",
        chapters: [
            {
                title: "English Grammar",
                lesson: `
                    <h3>Introduction</h3>
                    <p>
                        Grammar helps us construct correct
                        sentences in English.
                    </p>

                    <h3>Example</h3>
                    <p>
                        Present simple:
                        <br>
                        I study English every day.
                    </p>
                `
            },

            {
                title: "Vocabulary",
                lesson: `
                    <h3>Useful vocabulary</h3>
                    <p>
                        Education = Éducation
                        <br>
                        Knowledge = Connaissance
                        <br>
                        Success = Réussite
                        <br>
                        Future = Avenir
                    </p>
                `
            }
        ]
    },


    "Philosophie": {
        icon: "🧠",
        chapters: [
            {
                title: "La conscience",
                lesson: `
                    <h3>Définition</h3>
                    <p>
                        La conscience est la capacité
                        qu'a l'être humain de se rendre compte
                        de son existence et de ses pensées.
                    </p>
                `
            },

            {
                title: "La liberté",
                lesson: `
                    <h3>Introduction</h3>
                    <p>
                        La liberté désigne généralement
                        la capacité d'agir et de choisir
                        sans contrainte excessive.
                    </p>
                `
            }
        ]
    }

};


// ==========================================
// SÉLECTION DE L'ESPACE
// ==========================================

window.selectZone = function (zone, button) {

    selectedZone = zone;

    document.querySelectorAll(".zone").forEach(function (element) {
        element.classList.remove("active");
    });

    button.classList.add("active");

    document.getElementById("message").textContent =
        zone === "fr"
        ? "Espace francophone sélectionné."
        : "English-speaking area selected.";
};


// ==========================================
// CHANGEMENT DE LANGUE
// ==========================================

window.changeLanguage = function () {

    const title = document.querySelector(".hero h1");
    const description = document.querySelector(".description");
    const sectionTitle = document.querySelector(".section-title");
    const startButton = document.querySelector(".start");

    if (currentLanguage === "fr") {

        currentLanguage = "en";

        document.documentElement.lang = "en";

        title.textContent =
            "Build your future with BAC RÉUSSITE INTERNATIONAL";

        description.textContent =
            "An educational platform to learn, improve and succeed in your exams.";

        sectionTitle.textContent =
            "Let's prepare for your success";

        startButton.textContent = "GET STARTED";

    } else {

        currentLanguage = "fr";

        document.documentElement.lang = "fr";

        title.textContent =
            "Réussis ton avenir avec BAC RÉUSSITE INTERNATIONAL";

        description.textContent =
            "Une plateforme éducative pour apprendre, progresser et réussir tes examens.";

        sectionTitle.textContent =
            "Préparons ta réussite";

        startButton.textContent = "COMMENCER";
    }
};


// ==========================================
// DÉMARRAGE DE L'APPLICATION
// ==========================================

window.startApp = function () {

    const country = document.getElementById("country").value;
    const level = document.getElementById("level").value;
    const series = document.getElementById("series").value;

    const message = document.getElementById("message");

    if (!selectedZone) {

        message.textContent =
            "Veuillez choisir votre espace éducatif.";

        return;
    }

    if (!country || !level || !series) {

        message.textContent =
            "Veuillez remplir tous les champs.";

        return;
    }

    const student = {
        zone: selectedZone,
        country: country,
        level: level,
        series: series,
        date: new Date().toISOString()
    };

    try {

        localStorage.setItem(
            "bri_student",
            JSON.stringify(student)
        );

        currentStudent = student;

        openDashboard(student);

    } catch (error) {

        message.textContent =
            "Impossible d'enregistrer le profil.";

        console.error(error);
    }
};


// ==========================================
// OUVERTURE DU TABLEAU DE BORD
// ==========================================

function openDashboard(student) {

    document.getElementById("setupScreen").hidden = true;

    document.getElementById("dashboardScreen").hidden = false;

    document.getElementById("dashboardGreeting").textContent =
        "Bienvenue !";

    document.getElementById("dashboardProfile").textContent =
        student.country + " | " +
        student.level + " | Série " +
        student.series;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==========================================
// GESTION DES CARTES
// ==========================================

document.querySelectorAll(".dashboard-card").forEach(function (card) {

    card.addEventListener("click", function () {

        const section = card.dataset.section;

        if (section === "courses") {
            showCourses();
        } else {
            showDashboardMessage(section);
        }

    });

});


// ==========================================
// AFFICHAGE DES MATIÈRES
// ==========================================

function showCourses() {

    const info = document.querySelector(".dashboard-info");

    if (!currentStudent) {

        const saved = localStorage.getItem("bri_student");

        if (saved) {
            try {
                currentStudent = JSON.parse(saved);
            } catch (error) {
                console.error(error);
            }
        }
    }

    if (!currentStudent) {

        info.innerHTML = `
            <h2>MES COURS</h2>
            <p>Veuillez d'abord créer votre profil.</p>
        `;

        return;
    }

    const isPilotCourse =
        currentStudent.country === "Togo" &&
        currentStudent.level === "Terminale" &&
        currentStudent.series === "D";

    if (!isPilotCourse) {

        info.innerHTML = `
            <h2>MES COURS</h2>

            <p>
                Nous préparons actuellement les cours
                correspondant à ton pays, ton niveau
                et ta série.
            </p>

            <p>
                Ton profil :
                ${currentStudent.country} |
                ${currentStudent.level} |
                Série ${currentStudent.series}
            </p>

            <button id="backDashboard" class="start">
                RETOUR
            </button>
        `;

        addBackButton();

        return;
    }

    let html = `
        <h2>📚 MES COURS</h2>

        <p>
            Bienvenue dans ton espace pédagogique.
        </p>

        <p>
            Togo | Terminale D
        </p>

        <div class="dashboard-grid">
    `;

    Object.keys(courses).forEach(function (subject) {

        html += `
            <button
                class="dashboard-card"
                data-subject="${subject}">

                <span class="card-icon">
                    ${courses[subject].icon}
                </span>

                <h3>${subject}</h3>

                <p>
                    ${courses[subject].chapters.length}
                    chapitres disponibles
                </p>

            </button>
        `;

    });

    html += `
        </div>

        <button id="backDashboard" class="start">
            RETOUR AU TABLEAU DE BORD
        </button>
    `;

    info.innerHTML = html;

    document.querySelectorAll("[data-subject]").forEach(function (button) {

        button.addEventListener("click", function () {

            showChapters(button.dataset.subject);

        });

    });

    addBackButton();

    info.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ==========================================
// AFFICHAGE DES CHAPITRES
// ==========================================

function showChapters(subject) {

    const info = document.querySelector(".dashboard-info");

    const data = courses[subject];

    if (!data) return;

    let html = `
        <h2>${data.icon} ${subject}</h2>

        <p>
            Choisis un chapitre pour consulter sa leçon.
        </p>

        <div class="dashboard-grid">
    `;

    data.chapters.forEach(function (chapter, index) {

        html += `
            <button
                class="dashboard-card"
                data-chapter="${index}">

                <span class="card-icon">📘</span>

                <h3>${chapter.title}</h3>

                <p>Consulter la leçon</p>

            </button>
        `;

    });

    html += `
        </div>

        <button id="backSubjects" class="start">
            RETOUR AUX MATIÈRES
        </button>
    `;

    info.innerHTML = html;

    document.querySelectorAll("[data-chapter]").forEach(function (button) {

        button.addEventListener("click", function () {

            showLesson(subject, Number(button.dataset.chapter));

        });

    });

    document.getElementById("backSubjects").addEventListener(
        "click",
        showCourses
    );

    info.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ==========================================
// AFFICHAGE D'UNE LEÇON
// ==========================================

function showLesson(subject, chapterIndex) {

    const info = document.querySelector(".dashboard-info");

    const chapter = courses[subject].chapters[chapterIndex];

    if (!chapter) return;

    info.innerHTML = `
        <h2>${subject}</h2>

        <h3>${chapter.title}</h3>

        <div class="lesson-content">
            ${chapter.lesson}
        </div>

        <button id="backChapters" class="start">
            RETOUR AUX CHAPITRES
        </button>
    `;

    document.getElementById("backChapters").addEventListener(
        "click",
        function () {
            showChapters(subject);
        }
    );

    info.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ==========================================
// AUTRES RUBRIQUES
// ==========================================

function showDashboardMessage(section) {

    const info = document.querySelector(".dashboard-info");

    const contents = {

        exercises: {
            title: "✍️ MES EXERCICES",
            text: "Les exercices avec corrections détaillées seront développés dans cette rubrique."
        },

        exams: {
            title: "🎓 PRÉPARATION AUX EXAMENS",
            text: "Retrouve progressivement les ressources de préparation aux examens."
        },

        ai: {
            title: "🤖 BAC IA",
            text: "Ton assistant pédagogique intelligent sera connecté dans une prochaine étape."
        },

        calendar: {
            title: "📅 CALENDRIER DES EXAMENS",
            text: "Les calendriers officiels vérifiés seront présentés dans cette rubrique."
        },

        progress: {
            title: "📊 MA PROGRESSION",
            text: "Cette rubrique accueillera le suivi de tes apprentissages."
        },

        profile: {
            title: "👤 MON PROFIL",
            text: "Tes informations scolaires sont enregistrées sur cet appareil."
        },

        settings: {
            title: "⚙️ PARAMÈTRES",
            text: "Les réglages de ton application seront disponibles ici."
        }

    };

    const content = contents[section];

    if (!content) return;

    info.innerHTML = `
        <h2>${content.title}</h2>

        <p>${content.text}</p>

        <button id="backDashboard" class="start">
            RETOUR AU TABLEAU DE BORD
        </button>
    `;

    addBackButton();

    info.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


// ==========================================
// BOUTON DE RETOUR
// ==========================================

function addBackButton() {

    const button = document.getElementById("backDashboard");

    if (!button) return;

    button.addEventListener("click", function () {

        const info = document.querySelector(".dashboard-info");

        info.innerHTML = `
            <h2>POWER PILOT TECHNOLOGY</h2>

            <p>
                L'éducation sans frontières.
                Construisons ensemble la réussite de demain.
            </p>
        `;

        info.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    });
}


// ==========================================
// RÉCUPÉRATION DU PROFIL
// ==========================================

window.addEventListener("DOMContentLoaded", function () {

    const savedStudent = localStorage.getItem("bri_student");

    if (savedStudent) {

        try {

            currentStudent = JSON.parse(savedStudent);

            console.log(
                "Profil BRI retrouvé :",
                currentStudent
            );

        } catch (error) {

            console.error(
                "Erreur de lecture du profil :",
                error
            );

        }
    }

});


// ==========================================
// FIN DU PROGRAMME
// ==========================================