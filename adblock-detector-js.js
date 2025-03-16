/**
 * Détecteur avancé de bloqueurs de publicités
 * Pour YouLikeHits
 */

// Configuration
const config = {
    // Délai en ms avant de vérifier les bloqueurs (laisse le temps aux pubs de charger)
    checkDelay: 1000,
    
    // URL de redirection si le bloqueur n'est pas désactivé
    redirectUrl: null, // Mettre à null pour ne pas rediriger
    
    // Cookie de suivi pour savoir si l'utilisateur a été déjà averti
    cookieName: 'adblock_warning',
    cookieDuration: 1, // en jours
    
    // ID du modal d'alerte
    modalId: 'adblockModal',
    
    // Données à envoyer au serveur pour bloquer les points
    apiEndpoint: 'https://www.youlikehits.com/blockpoints.php', // À adapter selon votre configuration
    
    // Classes et identifiants à surveiller
    adClasses: ['adsbox', 'ad-element', 'ad-unit', 'ad-zone'],
    baitsIds: ['ad-test-1', 'ad-test-2', 'ad-iframe'],
};

// Variables globales
let adBlockDetected = false;
let pagePoints = 0; // Points gagnés sur la page

/**
 * Fonctions utilitaires
 */

// Créer un cookie
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Lire un cookie
function getCookie(name) {
    const cname = name + "=";
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(cname) === 0) {
            return cookie.substring(cname.length, cookie.length);
        }
    }
    return "";
}

// Méthodes de détection de bloqueurs de publicités
const detectionMethods = {
    // Détection par la visibilité des éléments de publicité
    checkAdElements: function() {
        // Créer un élément de test
        const testAd = document.createElement('div');
        testAd.innerHTML = '&nbsp;';
        testAd.className = 'adsbox ad-element';
        testAd.style.position = 'absolute';
        testAd.style.top = '-1000px';
        testAd.style.height = '1px';
        testAd.style.width = '1px';
        document.body.appendChild(testAd);
        
        // Vérifier si l'élément est masqué par un bloqueur de pubs
        const isBlocked = testAd.offsetHeight === 0 || 
                         testAd.clientHeight === 0 || 
                         window.getComputedStyle(testAd).display === 'none' ||
                         window.getComputedStyle(testAd).visibility === 'hidden';
        
        document.body.removeChild(testAd);
        return isBlocked;
    },
    
    // Détection par les iframes publicitaires
    checkAdFrames: function() {
        // Créer une iframe de test
        const iframe = document.createElement('iframe');
        iframe.id = 'ad-iframe-test';
        iframe.style.height = '1px';
        iframe.style.width = '1px';
        iframe.style.position = 'absolute';
        iframe.style.top = '-1000px';
        iframe.src = 'about:blank';
        document.body.appendChild(iframe);
        
        // Essayer d'accéder à des noms de domaines publicitaires courants
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const testDiv = iframeDoc.createElement('div');
            testDiv.innerHTML = '&nbsp;';
            testDiv.className = 'adsbox';
            iframeDoc.body.appendChild(testDiv);
            
            const isBlocked = testDiv.offsetHeight === 0 || testDiv.clientHeight === 0;
            document.body.removeChild(iframe);
            return isBlocked;
        } catch (e) {
            // Si on ne peut pas accéder à l'iframe, c'est probablement bloqué
            document.body.removeChild(iframe);
            return true;
        }
    },
    
    // Détection par les scripts baités
    checkBaitScripts: function() {
        let detected = false;
        
        for (const id of config.baitsIds) {
            const element = document.getElementById(id);
            if (element && (element.offsetHeight === 0 || 
                           element.clientHeight === 0 || 
                           window.getComputedStyle(element).display === 'none' ||
                           window.getComputedStyle(element).visibility === 'hidden')) {
                detected = true;
                break;
            }
        }
        
        return detected;
    },
    
    // Vérifier si des noms spécifiques existent dans la fenêtre globale
    checkGlobalNames: function() {
        // Noms utilisés par les bloqueurs ou par les pubs
        const adNames = [
            'googletag', 
            'googleTagServicesGpt', 
            '__AB__', 
            'google_ad', 
            'googletag.pubads'
        ];
        
        let missingCount = 0;
        
        for (const name of adNames) {
            // On vérifie si on peut accéder à ces noms
            try {
                const parts = name.split('.');
                let obj = window;
                
                for (const part of parts) {
                    if (obj === undefined || obj[part] === undefined) {
                        missingCount++;
                        break;
                    }
                    obj = obj[part];
                }
            } catch (e) {
                missingCount++;
            }
        }
        
        // Si la plupart sont manquants, probable qu'un bloqueur est en place
        return missingCount > (adNames.length * 0.7);
    }
};

/**
 * Fonctions principales
 */

// Fonction pour détecter les bloqueurs de pub
function detectAdBlocker() {
    let detectionCount = 0;
    let totalChecks = 0;
    
    // Vérifier les éléments HTML
    if (detectionMethods.checkAdElements()) {
        detectionCount++;
    }
    totalChecks++;
    
    // Vérifier les iframes
    if (detectionMethods.checkAdFrames()) {
        detectionCount++;
    }
    totalChecks++;
    
    // Vérifier les scripts bait
    if (detectionMethods.checkBaitScripts()) {
        detectionCount++;
    }
    totalChecks++;
    
    // Vérifier les noms globaux
    if (detectionMethods.checkGlobalNames()) {
        detectionCount++;
    }
    totalChecks++;
    
    // Calculer le pourcentage de détections positives
    const detectionRate = (detectionCount / totalChecks) * 100;
    
    // Si plus de 50% des tests sont positifs, considérer qu'un bloqueur est activé
    adBlockDetected = detectionRate >= 50;
    
    console.log("Détection de bloqueur de publicités terminée:");
    console.log(`Taux de détection: ${detectionRate}%`);
    console.log(`Bloqueur détecté: ${adBlockDetected}`);
    
    // Si un bloqueur est détecté, exécuter les actions nécessaires
    if (adBlockDetected) {
        handleAdBlockDetected();
    }
}

// Gérer un bloqueur de pub détecté
function handleAdBlockDetected() {
    // Enregistrer dans un cookie que l'utilisateur utilise un bloqueur
    setCookie(config.cookieName, 'true', config.cookieDuration);
    
    // 1. Afficher le modal d'avertissement
    showModal();
    
    // 2. Bloquer la distribution de points
    blockPointsDistribution();
    
    // 3. Bloquer les fonctionnalités du site
    blockSiteFunctionality();
    
    // 4. Envoyer les données au serveur pour tracking
    reportToServer();
}

// Afficher le modal d'avertissement
function showModal() {
    // Créer le modal s'il n'existe pas déjà
    let modal = document.getElementById(config.modalId);
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = config.modalId;
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        modal.style.zIndex = '9999';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        
        const content = document.createElement('div');
        content.style.backgroundColor = '#202040';
        content.style.padding = '30px';
        content.style.borderRadius = '10px';
        content.style.color = 'white';
        content.style.maxWidth = '600px';
        content.style.textAlign = 'center';
        
        content.innerHTML = `
            <h2 style="color: #ff5252; margin-bottom: 20px; font-size: 24px;">⚠️ Bloqueur de publicités détecté</h2>
            <p style="margin-bottom: 15px; line-height: 1.5;">Nous avons détecté que vous utilisez un bloqueur de publicités sur YouLikeHits.</p>
            <div style="background: rgba(255, 82, 82, 0.1); border-left: 4px solid #ff5252; padding: 15px; text-align: left; margin: 20px 0;">
                <p><strong>Important :</strong> L'utilisation d'un bloqueur de publicités sur notre plateforme est strictement interdite. Vous ne pourrez pas recevoir de points tant que votre bloqueur est actif.</p>
            </div>
            <p style="margin-bottom: 20px;">Pour continuer à utiliser YouLikeHits et recevoir des points, veuillez désactiver votre bloqueur de publicités puis rafraîchir la page.</p>
            <div style="margin-top: 30px;">
                <button id="refreshPageBtn" style="background: linear-gradient(90deg, #64B5F6, #2196F3); border: none; color: white; padding: 10px 20px; border-radius: 5px; font-weight: bold; cursor: pointer;">Rafraîchir la page</button>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Ajouter l'événement au bouton
        document.getElementById('refreshPageBtn').addEventListener('click', function() {
            location.reload();
        });
    } else {
        modal.style.display = 'flex';
    }
}

// Bloquer la distribution de points
function blockPointsDistribution() {
    // Intercepter les fonctions d'ajout de points
    if (window.addPoints) {
        const originalAddPoints = window.addPoints;
        window.addPoints = function(...args) {
            console.log("Tentative d'ajout de points bloquée à cause du bloqueur de publicités");
            return 0;
        };
    }
    
    // Parcourir tous les éléments qui pourraient ajouter des points
    const pointButtons = document.querySelectorAll('[onclick*="points"], [onclick*="credit"], [onclick*="reward"]');
    
    pointButtons.forEach(button => {
        const originalOnClick = button.getAttribute('onclick');
        button.setAttribute('original-onclick', originalOnClick);
        button.setAttribute('onclick', 'alert("Désactivez votre bloqueur de publicités pour recevoir des points"); return false;');
    });
    
    // Bloquer les requêtes AJAX qui pourraient ajouter des points
    if (window.XMLHttpRequest) {
        const originalXHR = window.XMLHttpRequest;
        
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalOpen = xhr.open;
            
            xhr.open = function(...args) {
                const url = args[1];
                if (url && (url.includes('points') || url.includes('credit') || url.includes('reward'))) {
                    console.log("Requête de points bloquée à cause du bloqueur de publicités:", url);
                    return false;
                }
                
                return originalOpen.apply(this, args);
            };
            
            return xhr;
        };
    }
}

// Bloquer les fonctionnalités du site
function blockSiteFunctionality() {
    // Bloquer le scroll
    document.body.style.overflow = 'hidden';
    
    // Mettre une couche d'opacité sur le contenu principal
    const contentElements = document.querySelectorAll('main, .content, #content, article');
    contentElements.forEach(element => {
        element.style.opacity = '0.3';
        element.style.pointerEvents = 'none';
    });
    
    // Désactiver tous les liens et boutons
    const clickableElements = document.querySelectorAll('a, button, [role="button"], [type="button"], [type="submit"]');
    clickableElements.forEach(element => {
        if (element.id !== 'refreshPageBtn') {
            element.setAttribute('data-original-href', element.getAttribute('href'));
            element.setAttribute('href', 'javascript:void(0)');
            element.style.pointerEvents = 'none';
        }
    });
}

// Envoyer les données au serveur pour tracking
function reportToServer() {
    try {
        const data = {
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            adblockDetected: true
        };
        
        // Envoyer via fetch ou via une image pixel
        if (window.fetch) {
            fetch(config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                credentials: 'include'
            }).catch(e => console.error('Erreur lors du signalement au serveur:', e));
        } else {
            // Méthode alternative avec une image pixel
            const pixel = new Image();
            pixel.src = config.apiEndpoint + '?data=' + encodeURIComponent(JSON.stringify(data)) + '&t=' + new Date().getTime();
        }
    } catch (e) {
        console.error('Erreur lors du signalement au serveur:', e);
    }
}
/**
 * Initialisation et exécution
 */

// Suivre les points gagnés sur la page
function trackPagePoints() {
    // Fonction pour intercepter l'ajout de points
    const originalAddPoints = window.addPoints || function() {};
    window.addPoints = function(points, ...args) {
        // Si aucun bloqueur n'est détecté, on permet l'ajout de points
        if (!adBlockDetected) {
            pagePoints += parseInt(points || 0);
            return originalAddPoints.apply(this, [points, ...args]);
        } else {
            console.log("Points bloqués:", points);
            return 0;
        }
    };
}

// Fonction d'initialisation principale
function initAdBlockDetector() {
    // Créer des appâts de détection
    createBaitElements();
    
    // Vérifier si l'utilisateur a déjà été averti
    const warned = getCookie(config.cookieName);
    
    // Si l'utilisateur a été averti et n'a pas désactivé son bloqueur
    if (warned === 'true') {
        // Revérifier immédiatement
        detectAdBlocker();
    } else {
        // Sinon attendre le délai configuré
        setTimeout(detectAdBlocker, config.checkDelay);
    }
    
    // Mettre en place le suivi des points
    trackPagePoints();
}

// Créer des éléments "appâts" pour la détection
function createBaitElements() {
    // Créer plusieurs appâts avec différentes classes et IDs
    for (const id of config.baitsIds) {
        const bait = document.createElement('div');
        bait.id = id;
        bait.style.height = '1px';
        bait.style.width = '1px';
        bait.style.position = 'absolute';
        bait.style.top = '-1000px';
        bait.innerHTML = '&nbsp;';
        document.body.appendChild(bait);
    }
    
    // Ajouter des appâts avec les classes spécifiques
    for (const className of config.adClasses) {
        const bait = document.createElement('div');
        bait.className = className;
        bait.style.height = '1px';
        bait.style.width = '1px';
        bait.style.position = 'absolute';
        bait.style.top = '-1000px';
        bait.innerHTML = '&nbsp;';
        document.body.appendChild(bait);
    }
}

// Restaurer les fonctionnalités du site
function restoreSiteFunctionality() {
    // Restaurer le scroll
    document.body.style.overflow = '';
    
    // Restaurer l'opacité du contenu principal
    const contentElements = document.querySelectorAll('main, .content, #content, article');
    contentElements.forEach(element => {
        element.style.opacity = '';
        element.style.pointerEvents = '';
    });
    
    // Réactiver tous les liens et boutons
    const clickableElements = document.querySelectorAll('a, button, [role="button"], [type="button"], [type="submit"]');
    clickableElements.forEach(element => {
        const originalHref = element.getAttribute('data-original-href');
        if (originalHref) {
            element.setAttribute('href', originalHref);
            element.removeAttribute('data-original-href');
        }
        element.style.pointerEvents = '';
    });
}

// Fonction pour vérifier périodiquement si le bloqueur a été désactivé
function checkAdBlockRemoval() {
    setInterval(() => {
        // Si un bloqueur était détecté, refaire la vérification
        if (adBlockDetected) {
            adBlockDetected = false;
            detectAdBlocker();
            
            // Si le bloqueur a été désactivé
            if (!adBlockDetected) {
                // Cacher le modal
                const modal = document.getElementById(config.modalId);
                if (modal) {
                    modal.style.display = 'none';
                }
                
                // Restaurer les fonctionnalités du site
                restoreSiteFunctionality();
                
                // Supprimer le cookie de tracking
                setCookie(config.cookieName, 'false', config.cookieDuration);
                
                // Afficher un message de remerciement
                showThankYouMessage();
            }
        }
    }, 5000); // Vérifier toutes les 5 secondes
}

// Afficher un message de remerciement
function showThankYouMessage() {
    const message = document.createElement('div');
    message.style.position = 'fixed';
    message.style.bottom = '20px';
    message.style.right = '20px';
    message.style.backgroundColor = '#4CAF50';
    message.style.color = 'white';
    message.style.padding = '15px';
    message.style.borderRadius = '5px';
    message.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    message.style.zIndex = '9998';
    message.innerHTML = 'Merci d\'avoir désactivé votre bloqueur de publicités!';
    
    document.body.appendChild(message);
    
    // Faire disparaître le message après 5 secondes
    setTimeout(() => {
        message.style.opacity = '0';
        message.style.transition = 'opacity 1s';
        setTimeout(() => {
            document.body.removeChild(message);
        }, 1000);
    }, 5000);
}

// Initialiser le détecteur au chargement de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdBlockDetector);
} else {
    initAdBlockDetector();
}

// Démarrer la vérification périodique
checkAdBlockRemoval();

// Exporter l'API publique
window.adBlockDetector = {
    check: detectAdBlocker,
    isDetected: () => adBlockDetected,
    getPagePoints: () => pagePoints,
    reset: () => {
        adBlockDetected = false;
        restoreSiteFunctionality();
        const modal = document.getElementById(config.modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
};