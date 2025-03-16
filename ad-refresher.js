/**
 * Script de rafraîchissement automatique des publicités Adsterra
 * À inclure soit directement dans votre HTML, soit comme fichier séparé
 */

// Configuration
const AD_REFRESH_INTERVAL = 10000; // 10 secondes entre chaque rafraîchissement
const AD_CONTAINER_IDS = [
    'ad-banner-top',
    'ad-skyscraper-left',
    'ad-skyscraper-right', 
    'ad-rectangle-left',
    'ad-rectangle-right',
    'ad-banner-bottom'
];
const STAGGER_DELAY = 300; // Délai entre le rafraîchissement de chaque publicité

// Fonction principale de rafraîchissement des publicités
function initAdRefresher() {
    console.log('Système de rafraîchissement des publicités initialisé');
    
    // Stocker le contenu HTML original des publicités lors du premier chargement
    AD_CONTAINER_IDS.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            // Utiliser un attribut data pour stocker le HTML original
            container.dataset.originalHtml = container.innerHTML;
        }
    });
    
    // Démarrer le rafraîchissement automatique
    setInterval(refreshAllAds, AD_REFRESH_INTERVAL);
}

// Rafraîchir toutes les publicités avec un délai entre chacune
function refreshAllAds() {
    console.log('Rafraîchissement des publicités...');
    
    // Animation subtile de transition
    AD_CONTAINER_IDS.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.style.transition = 'opacity 0.3s ease';
            container.style.opacity = '0.3';
        }
    });
    
    // Rafraîchir chaque publicité avec un délai pour éviter la surcharge
    AD_CONTAINER_IDS.forEach((id, index) => {
        setTimeout(() => {
            refreshSingleAd(id);
        }, index * STAGGER_DELAY);
    });
}

// Rafraîchir une publicité individuelle
function refreshSingleAd(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    try {
        // Récupérer le HTML original stocké dans l'attribut data
        const originalHtml = container.dataset.originalHtml;
        
        if (originalHtml) {
            // Vider le conteneur
            container.innerHTML = '';
            
            // Petit délai avant de recréer la publicité
            setTimeout(() => {
                // Recréer le contenu
                container.innerHTML = originalHtml;
                
                // Restaurer l'opacité
                container.style.opacity = '1';
                
                console.log(`Publicité ${containerId} rafraîchie avec succès`);
            }, 100);
        }
    } catch (error) {
        console.error(`Erreur lors du rafraîchissement de ${containerId}:`, error);
    }
}

// Démarrer le système de rafraîchissement au chargement de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdRefresher);
} else {
    initAdRefresher();
}
