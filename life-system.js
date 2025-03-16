/**
 * Système de vies pour Mino.io
 * Fonctionnalités:
 * - Gain de vie en cliquant sur une publicité
 * - Utilisation de vie pour continuer après un game over
 * - Récupération d'une vie toutes les 5 minutes
 */

// Variables globales pour le système de vies
let lives = 0;
const MAX_LIVES = 3; // Nombre maximum de vies stockables
const LIFE_RECOVERY_TIME = 5 * 60 * 1000; // 5 minutes en millisecondes
let nextLifeTime = 0; // Timestamp pour la prochaine vie automatique
let lifeTimerInterval; // Pour gérer le timer

// Éléments DOM à créer
let livesDisplay; // Affichage des vies en haut de l'écran
let continueModal; // Modal pour continuer avec une vie

// Initialiser le système de vies
function initLifeSystem() {
    // Charger les vies sauvegardées
    loadLives();
    
    // Créer l'affichage des vies
    createLivesDisplay();
    
    // Créer la modal de continuation
    createContinueModal();
    
    // Initialiser le timer de récupération de vie
    initLifeTimer();
    
    // Ajouter les écouteurs d'événements pour les publicités
    setupAdListeners();
    
    // Modifier la fonction gameOver pour intégrer le système de vies
    const originalGameOver = window.gameOver;
    window.gameOver = function() {
        if (lives > 0) {
            // Si le joueur a des vies, afficher la modal
            showContinueModal();
        } else {
            // Sinon, procéder au game over normal
            originalGameOver();
        }
    };
}

// Charger les vies sauvegardées
function loadLives() {
    const savedLives = localStorage.getItem('minioLives');
    if (savedLives !== null) {
        lives = parseInt(savedLives);
    }
    
    const savedNextLifeTime = localStorage.getItem('minioNextLifeTime');
    if (savedNextLifeTime !== null) {
        nextLifeTime = parseInt(savedNextLifeTime);
        
        // Si le temps est dépassé pendant que le jeu était fermé, donner les vies accumulées
        const currentTime = Date.now();
        if (nextLifeTime <= currentTime) {
            const timeElapsed = currentTime - nextLifeTime + LIFE_RECOVERY_TIME;
            const livesToAdd = Math.floor(timeElapsed / LIFE_RECOVERY_TIME);
            
            if (livesToAdd > 0) {
                addLives(Math.min(livesToAdd, MAX_LIVES - lives));
                nextLifeTime = currentTime + LIFE_RECOVERY_TIME;
                saveLives();
            }
        }
    } else {
        nextLifeTime = Date.now() + LIFE_RECOVERY_TIME;
        saveLives();
    }
}

// Sauvegarder les vies
function saveLives() {
    localStorage.setItem('minioLives', lives.toString());
    localStorage.setItem('minioNextLifeTime', nextLifeTime.toString());
}

// Créer l'affichage des vies
function createLivesDisplay() {
    livesDisplay = document.createElement('div');
    livesDisplay.id = 'lives-display';
    livesDisplay.style.position = 'absolute';
    livesDisplay.style.top = '10px';
    livesDisplay.style.right = '10px';
    livesDisplay.style.display = 'flex';
    livesDisplay.style.alignItems = 'center';
    livesDisplay.style.zIndex = '15';
    
    updateLivesDisplay();
    
    const gameContainer = document.getElementById('game-container');
    gameContainer.appendChild(livesDisplay);
}

// Mettre à jour l'affichage des vies
function updateLivesDisplay() {
    if (!livesDisplay) return;
    
    livesDisplay.innerHTML = '';
    
    // Afficher les vies sous forme de cœurs
    for (let i = 0; i < lives; i++) {
        const heart = document.createElement('div');
        heart.className = 'life-heart';
        heart.innerHTML = '❤️';
        heart.style.fontSize = '24px';
        heart.style.marginLeft = '2px';
        livesDisplay.appendChild(heart);
    }
    
    // Afficher un compteur si on est en dessous du max
    if (lives < MAX_LIVES) {
        const timerDisplay = document.createElement('div');
        timerDisplay.id = 'life-timer';
        timerDisplay.style.marginLeft = '5px';
        timerDisplay.style.fontSize = '14px';
        timerDisplay.style.color = 'white';
        timerDisplay.style.textShadow = '1px 1px 2px black';
        livesDisplay.appendChild(timerDisplay);
    }
}

// Initialiser le timer de récupération de vie
function initLifeTimer() {
    clearInterval(lifeTimerInterval);
    
    // Mettre à jour le compteur chaque seconde
    lifeTimerInterval = setInterval(() => {
        if (lives >= MAX_LIVES) {
            document.getElementById('life-timer')?.remove();
            return;
        }
        
        const currentTime = Date.now();
        const timeRemaining = Math.max(0, nextLifeTime - currentTime);
        
        // Si le temps est écoulé, donner une vie et réinitialiser le timer
        if (timeRemaining <= 0) {
            addLives(1);
            nextLifeTime = currentTime + LIFE_RECOVERY_TIME;
            saveLives();
        }
        
        // Mettre à jour l'affichage du timer
        const timerDisplay = document.getElementById('life-timer');
        if (timerDisplay) {
            const minutes = Math.floor(timeRemaining / 60000);
            const seconds = Math.floor((timeRemaining % 60000) / 1000);
            timerDisplay.textContent = `+1 ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// Ajouter des vies
function addLives(amount) {
    lives = Math.min(lives + amount, MAX_LIVES);
    updateLivesDisplay();
    
    // Animation de gain de vie
    showLifeGainAnimation();
}

// Créer la modal de continuation
function createContinueModal() {
    continueModal = document.createElement('div');
    continueModal.id = 'continue-modal';
    continueModal.style.position = 'absolute';
    continueModal.style.width = '100%';
    continueModal.style.height = '100%';
    continueModal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    continueModal.style.display = 'none';
    continueModal.style.justifyContent = 'center';
    continueModal.style.alignItems = 'center';
    continueModal.style.zIndex = '30';
    continueModal.style.flexDirection = 'column';
    
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#4abcfa';
    modalContent.style.padding = '30px';
    modalContent.style.borderRadius = '10px';
    modalContent.style.textAlign = 'center';
    modalContent.style.border = '4px solid #000';
    modalContent.style.boxShadow = '0 10px 0 #003366, 0 15px 35px rgba(0,0,0,0.4)';
    modalContent.style.display = 'flex';
    modalContent.style.flexDirection = 'column';
    modalContent.style.alignItems = 'center';
    modalContent.style.maxWidth = '400px';
    
    const title = document.createElement('h2');
    title.textContent = 'Utiliser une vie?';
    title.style.color = '#ffde59';
    title.style.marginBottom = '20px';
    title.style.textShadow = '2px 2px 0 #000';
    title.style.fontSize = '28px';
    
    const message = document.createElement('p');
    message.textContent = 'Vous avez une vie disponible. Voulez-vous continuer votre partie?';
    message.style.color = '#fff';
    message.style.marginBottom = '20px';
    message.style.textShadow = '1px 1px 0 #000';
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '20px';
    
    const yesButton = document.createElement('button');
    yesButton.textContent = 'Oui';
    yesButton.style.backgroundColor = '#f39c12';
    yesButton.style.border = '3px solid #000';
    yesButton.style.color = 'white';
    yesButton.style.padding = '12px 24px';
    yesButton.style.borderRadius = '5px';
    yesButton.style.fontWeight = 'bold';
    yesButton.style.cursor = 'pointer';
    yesButton.style.fontSize = '18px';
    yesButton.style.boxShadow = '0 5px 0 #c87f0a';
    yesButton.style.textShadow = '1px 1px 0 #000';
    
    const noButton = document.createElement('button');
    noButton.textContent = 'Non';
    noButton.style.backgroundColor = '#e74c3c';
    noButton.style.border = '3px solid #000';
    noButton.style.color = 'white';
    noButton.style.padding = '12px 24px';
    noButton.style.borderRadius = '5px';
    noButton.style.fontWeight = 'bold';
    noButton.style.cursor = 'pointer';
    noButton.style.fontSize = '18px';
    noButton.style.boxShadow = '0 5px 0 #c0392b';
    noButton.style.textShadow = '1px 1px 0 #000';
    
    yesButton.addEventListener('click', () => {
        useLife();
        hideContinueModal();
    });
    
    noButton.addEventListener('click', () => {
        hideContinueModal();
        window.gameOver();
    });
    
    buttonsContainer.appendChild(yesButton);
    buttonsContainer.appendChild(noButton);
    
    modalContent.appendChild(title);
    modalContent.appendChild(message);
    modalContent.appendChild(buttonsContainer);
    continueModal.appendChild(modalContent);
    
    const gameContainer = document.getElementById('game-container');
    gameContainer.appendChild(continueModal);
}

// Montrer la modal de continuation
function showContinueModal() {
    continueModal.style.display = 'flex';
    
    // Animation d'apparition
    const modalContent = continueModal.querySelector('div');
    modalContent.style.animation = 'bounceIn 0.5s';
    
    // Définir le style de l'animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes bounceIn {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.1); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// Cacher la modal de continuation
function hideContinueModal() {
    continueModal.style.display = 'none';
}

// Utiliser une vie pour continuer
function useLife() {
    if (lives <= 0) return false;
    
    lives--;
    saveLives();
    updateLivesDisplay();
    
    // Réinitialiser l'état du jeu pour continuer
    isGameOver = false;
    
    return true;
}

// Configuration des écouteurs d'événements pour les publicités
function setupAdListeners() {
    // Sélectionner tous les conteneurs de publicités
    const adContainers = document.querySelectorAll('.ad-container');
    
    adContainers.forEach(container => {
        container.addEventListener('click', () => {
            // Vérifier si le joueur peut gagner une vie (pas au max)
            if (lives < MAX_LIVES) {
                addLives(1);
                saveLives();
                
                // Afficher un message de confirmation
                showAdRewardMessage();
            }
        });
    });
}

// Afficher un message de récompense pour la publicité
function showAdRewardMessage() {
    const message = document.createElement('div');
    message.className = 'ad-reward-message';
    message.textContent = '+1 Vie!';
    message.style.position = 'fixed';
    message.style.top = '50%';
    message.style.left = '50%';
    message.style.transform = 'translate(-50%, -50%)';
    message.style.backgroundColor = '#00a651';
    message.style.color = 'white';
    message.style.padding = '15px 30px';
    message.style.borderRadius = '50px';
    message.style.fontSize = '24px';
    message.style.fontWeight = 'bold';
    message.style.zIndex = '100';
    message.style.opacity = '0';
    message.style.textShadow = '1px 1px 0 #000';
    message.style.border = '3px solid #000';
    message.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    message.style.animation = 'adRewardAnimation 2s forwards';
    
    document.body.appendChild(message);
    
    // Ajouter l'animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes adRewardAnimation {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            10% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
            20% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Supprimer le message après l'animation
    setTimeout(() => {
        message.remove();
    }, 2000);
}

// Animation de gain de vie
function showLifeGainAnimation() {
    // Créer un cœur animé qui monte vers l'indicateur de vies
    const heart = document.createElement('div');
    heart.textContent = '❤️';
    heart.style.position = 'fixed';
    heart.style.fontSize = '36px';
    heart.style.zIndex = '100';
    heart.style.top = '50%';
    heart.style.left = '50%';