/**
 * AdBlocker Detective - Détection avancée des bloqueurs de publicités
 * Script conçu pour détecter les bloqueurs de publicités et les contourner
 */

class AdBlockerDetective {
    constructor(options = {}) {
        this.options = {
            debug: options.debug || false,
            onDetected: options.onDetected || this.defaultOnDetected,
            onNotDetected: options.onNotDetected || this.defaultOnNotDetected,
            checkInterval: options.checkInterval || 1000,
            maxChecks: options.maxChecks || 5,
            redirectUrl: options.redirectUrl || null,
            blockPageContent: options.blockPageContent || false
        };
        
        this.detectionMethods = [
            this.baitMethod.bind(this),
            this.classNameMethod.bind(this),
            this.scriptInjectionTest.bind(this),
            this.googleAdTest.bind(this),
            this.fakeAdDivTest.bind(this),
            this.styleSheetTest.bind(this)
        ];
        
        this.isDetected = false;
        this.checkCount = 0;
        this.intervalId = null;
    }
    
    // Méthode principale pour démarrer la détection
    init() {
        this.log("Initialisation de la détection des bloqueurs de publicités...");
        
        // Vérification immédiate
        this.checkForAdBlocker();
        
        // Vérifications périodiques
        this.intervalId = setInterval(() => {
            this.checkCount++;
            this.checkForAdBlocker();
            
            if (this.checkCount >= this.options.maxChecks) {
                clearInterval(this.intervalId);
                this.log("Arrêt des vérifications programmées après " + this.checkCount + " tentatives");
            }
        }, this.options.checkInterval);
        
        // Écouter les erreurs pouvant indiquer un bloquer de publicités
        window.addEventListener('error', this.errorListener.bind(this), true);
        
        return this;
    }
    
    // Vérification complète utilisant toutes les méthodes
    checkForAdBlocker() {
        if (this.isDetected) return;
        
        this.log("Exécution de la vérification #" + (this.checkCount + 1));
        
        for (let method of this.detectionMethods) {
            if (method()) {
                this.handleDetection("Méthode: " + method.name);
                return true;
            }
        }
        
        this.log("Aucun bloqueur détecté lors de cette vérification");
        if (this.checkCount >= this.options.maxChecks - 1) {
            this.options.onNotDetected();
        }
        
        return false;
    }
    
    // MÉTHODE 1: Créer un élément publicitaire "appât" et vérifier s'il est masqué
    baitMethod() {
        const bait = document.createElement('div');
        bait.setAttribute('class', 'ad_unit ad-unit ad-zone ad-space adsbox');
        bait.setAttribute('style', 'width: 1px; height: 1px; position: absolute; left: -10000px; top: -1000px;');
        bait.innerHTML = '&nbsp;';
        document.body.appendChild(bait);
        
        // Laisser le DOM se mettre à jour
        const detected = bait.offsetHeight === 0 || bait.offsetParent === null;
        
        // Nettoyer
        if (bait.parentNode) {
            bait.parentNode.removeChild(bait);
        }
        
        this.log("Méthode Bait: " + (detected ? "Bloqueur détecté" : "Aucun bloqueur détecté"));
        return detected;
    }
    
    // MÉTHODE 2: Vérifier si des classes communes utilisées par les bloqueurs existent
    classNameMethod() {
        const classes = [
            'BlockAdblock',
            'FuckAdBlock', 
            'aadb',
            'AdblockDetector',
            'adb_activated'
        ];
        
        for (let className of classes) {
            if (document.getElementsByClassName(className).length > 0) {
                this.log("Méthode Class: Bloqueur détecté via la classe " + className);
                return true;
            }
        }
        
        this.log("Méthode Class: Aucun bloqueur détecté");
        return false;
    }
    
    // MÉTHODE 3: Tester l'injection de script publicitaire
    scriptInjectionTest() {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        script.id = 'test-ad-script';
        script.setAttribute('data-ad-client', 'ca-pub-1234567890123456');
        
        // Détecter les problèmes de chargement
        script.onerror = () => {
            if (document.getElementById('test-ad-script')) {
                document.body.removeChild(document.getElementById('test-ad-script'));
            }
            this.handleDetection("Méthode Script: Erreur de chargement du script publicitaire");
        };
        
        script.onload = () => {
            if (document.getElementById('test-ad-script')) {
                document.body.removeChild(document.getElementById('test-ad-script'));
            }
        };
        
        document.body.appendChild(script);
        
        // Vérification alternative basée sur la présence d'objets
        if (typeof window.adsbygoogle === 'undefined') {
            this.log("Méthode Script: Objet adsbygoogle manquant");
            return true;
        }
        
        this.log("Méthode Script: Test effectué");
        return false;
    }
    
    // MÉTHODE 4: Test Google Ads
    googleAdTest() {
        // Vérifier si Google Ads est bloqué
        if (window.google && typeof window.google.ads === 'undefined') {
            this.log("Méthode Google: Objet google.ads manquant");
            return true;
        }
        
        // Vérifier si un placeholder d'annonce existe et est masqué
        const adElements = document.querySelectorAll('.adsbygoogle');
        for (let el of adElements) {
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.height === '0px' || style.visibility === 'hidden') {
                this.log("Méthode Google: Élément AdSense masqué ou caché");
                return true;
            }
        }
        
        this.log("Méthode Google: Aucun bloqueur détecté");
        return false;
    }
    
    // MÉTHODE 5: Test avec faux div publicitaires
    fakeAdDivTest() {
        const adNames = [
            'ad', 'ads', 'adsense', 'doubleclick', 
            'ad-sidebar', 'ad-zone', 'banner-ads', 
            'sponsor', 'advert', 'adsbox'
        ];
        
        let detected = false;
        
        for (let name of adNames) {
            const div = document.createElement('div');
            div.id = name;
            div.style.height = '10px';
            div.style.width = '10px';
            div.style.position = 'absolute';
            div.style.top = '-999px';
            div.style.left = '-999px';
            
            document.body.appendChild(div);
            
            // Vérifier si le div est masqué
            const divStyle = window.getComputedStyle(div);
            if (divStyle.display === 'none' || divStyle.height === '0px' || div.offsetHeight === 0) {
                this.log("Méthode FakeDiv: Bloqueur détecté avec l'ID " + name);
                detected = true;
            }
            
            // Nettoyer
            document.body.removeChild(div);
            
            if (detected) return true;
        }
        
        this.log("Méthode FakeDiv: Aucun bloqueur détecté");
        return false;
    }
    
    // MÉTHODE 6: Test des feuilles de style
    styleSheetTest() {
        // Certains bloqueurs de publicités injectent des feuilles de style
        const styleSheets = document.styleSheets;
        
        for (let i = 0; i < styleSheets.length; i++) {
            const sheet = styleSheets[i];
            
            try {
                // Vérifier si la feuille de style contient des règles anti-pub
                const rules = sheet.cssRules || sheet.rules;
                
                if (!rules) continue;
                
                for (let j = 0; j < rules.length; j++) {
                    const rule = rules[j];
                    const ruleText = rule.cssText || '';
                    
                    if (ruleText.includes('#ad') || ruleText.includes('.ad') || 
                        ruleText.includes('banner') && (ruleText.includes('display: none') || ruleText.includes('visibility: hidden'))) {
                        this.log("Méthode StyleSheet: Règle CSS de bloqueur détectée");
                        return true;
                    }
                }
            } catch (e) {
                // Les règles CORS peuvent déclencher des erreurs
                continue;
            }
        }
        
        this.log("Méthode StyleSheet: Aucun bloqueur détecté");
        return false;
    }
    
    // Écouteur d'erreurs global
    errorListener(event) {
        // Détecter les erreurs spécifiques liées aux bloqueurs
        if (event.target && (
            (event.target.src && event.target.src.includes('ads')) ||
            (event.target.src && event.target.src.includes('analytics')) ||
            (event.message && (event.message.includes('adsbygoogle') || event.message.includes('analytics')))
        )) {
            this.handleDetection("Méthode ErrorListener: Erreur détectée sur ressource publicitaire");
            return true;
        }
        return false;
    }
    
    // Gérer la détection d'un bloqueur
    handleDetection(method) {
        if (this.isDetected) return true;
        
        this.isDetected = true;
        this.log("DÉTECTION POSITIVE: " + method);
        
        clearInterval(this.intervalId);
        this.options.onDetected(method);
        
        return true;
    }
    
    // Action par défaut quand un bloqueur est détecté
    defaultOnDetected(method) {
        console.warn("AdBlockerDetective: Bloqueur de publicités détecté! (" + method + ")");
        
        // Créer un élément d'avertissement si non existant
        if (!document.getElementById('adblock-warning')) {
            const warning = document.createElement('div');
            warning.id = 'adblock-warning';
            warning.style.position = 'fixed';
            warning.style.top = '0';
            warning.style.left = '0';
            warning.style.width = '100%';
            warning.style.backgroundColor = '#ff0000';
            warning.style.color = '#ffffff';
            warning.style.padding = '15px';
            warning.style.textAlign = 'center';
            warning.style.zIndex = '9999';
            warning.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
            warning.style.fontWeight = 'bold';
            warning.innerHTML = `
                <h3 style="margin:0;padding:0;font-size:18px">⚠️ Bloqueur de publicités détecté!</h3>
                <p style="margin:10px 0 0;padding:0">Veuillez désactiver votre bloqueur de publicités pour continuer.</p>
            `;
            
            document.body.insertBefore(warning, document.body.firstChild);
        }
        
        // Option: bloquer le contenu de la page
        if (this.options.blockPageContent) {
            // Ajouter un overlay sur toute la page
            const overlay = document.createElement('div');
            overlay.id = 'adblock-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
            overlay.style.zIndex = '9998';
            
            document.body.appendChild(overlay);
            
            // Ajouter un dialogue
            const dialog = document.createElement('div');
            dialog.id = 'adblock-dialog';
            dialog.style.position = 'fixed';
            dialog.style.top = '50%';
            dialog.style.left = '50%';
            dialog.style.transform = 'translate(-50%, -50%)';
            dialog.style.backgroundColor = '#ffffff';
            dialog.style.padding = '30px';
            dialog.style.borderRadius = '10px';
            dialog.style.zIndex = '9999';
            dialog.style.maxWidth = '500px';
            dialog.style.width = '80%';
            dialog.style.textAlign = 'center';
            dialog.style.boxShadow = '0 5px 20px rgba(0,0,0,0.3)';
            
            dialog.innerHTML = `
                <h2 style="color:#ff0000;margin-top:0">Accès bloqué</h2>
                <p>Nous avons détecté que vous utilisez un bloqueur de publicités.</p>
                <p>Ce site est financé par la publicité. Pour continuer à naviguer, veuillez désactiver votre bloqueur puis rafraîchir la page.</p>
                <button id="refresh-page" style="background:#ff0000;color:#fff;border:none;padding:10px 20px;margin-top:20px;border-radius:5px;cursor:pointer;font-weight:bold">Rafraîchir la page</button>
            `;
            
            document.body.appendChild(dialog);
            
            // Ajouter un écouteur pour rafraîchir la page
            document.getElementById('refresh-page').addEventListener('click', function() {
                window.location.reload();
            });
        }
        
        // Option: rediriger l'utilisateur
        if (this.options.redirectUrl) {
            setTimeout(() => {
                window.location.href = this.options.redirectUrl;
            }, 3000);
        }
    }
    
    // Action par défaut quand aucun bloqueur n'est détecté
    defaultOnNotDetected() {
        console.log("AdBlockerDetective: Aucun bloqueur de publicités détecté.");
    }
    
    // Utilitaire de journalisation
    log(message) {
        if (this.options.debug) {
            console.log("AdBlockerDetective: " + message);
        }
    }
    
    // Méthodes supplémentaires pour les utilisations avancées
    
    // Arrêter la détection
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        window.removeEventListener('error', this.errorListener);
        this.log("Détection arrêtée");
    }
    
    // Réinitialiser l'état de détection
    reset() {
        this.stop();
        this.isDetected = false;
        this.checkCount = 0;
        this.log("État réinitialisé");
    }
    
    // Supprimer les avertissements
    removeWarnings() {
        const elements = [
            'adblock-warning',
            'adblock-overlay',
            'adblock-dialog'
        ];
        
        for (let id of elements) {
            const element = document.getElementById(id);
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }
        
        this.log("Avertissements supprimés");
    }
    
    // Mettre à jour les options
    updateOptions(newOptions) {
        this.options = {...this.options, ...newOptions};
        this.log("Options mises à jour");
        return this;
    }
}

// Exemple d'utilisation
// const detector = new AdBlockerDetective({
//     debug: true,
//     blockPageContent: true,
//     onDetected: function(method) {
//         console.log("Bloqueur détecté via: " + method);
//         // Actions personnalisées ici
//     }
// }).init();

// Exportation pour utilisation comme module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdBlockerDetective;
} else {
    window.AdBlockerDetective = AdBlockerDetective;
}