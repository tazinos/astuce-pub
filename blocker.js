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
                if (!this.isDetected) {
                    this.options.onNotDetected();
                }
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
        
        // On exige au moins 2 méthodes positives pour confirmer la détection
        let positiveDetections = 0;
        
        for (let method of this.detectionMethods) {
            if (method()) {
                positiveDetections++;
                this.log("Détection positive via: " + method.name);
            }
        }
        
        // Seulement considérer comme détecté si au moins 2 méthodes sont positives
        if (positiveDetections >= 2) {
            this.handleDetection("Multiple méthodes: " + positiveDetections + " détections positives");
            return true;
        }
        
        this.log("Aucun bloqueur détecté lors de cette vérification");
        
        return false;
    }
    
    // MÉTHODE 1: Créer un élément publicitaire "appât" et vérifier s'il est masqué
    baitMethod() {
        const bait = document.createElement('div');
        bait.setAttribute('class', 'ad_unit ad-unit ad-zone ad-space adsbox');
        bait.setAttribute('id', 'ad-test-bait');
        bait.setAttribute('style', 'width: 1px; height: 1px; position: absolute; left: -10000px; top: -1000px; background-color: #ffffff;');
        bait.innerHTML = '&nbsp;';
        document.body.appendChild(bait);
        
        // Laisser le DOM se mettre à jour
        const detected = bait.offsetHeight === 0 || bait.offsetWidth === 0 || bait.offsetParent === null;
        const computedStyle = window.getComputedStyle(bait);
        const invisibleBait = computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0';
        
        // Nettoyer
        if (bait.parentNode) {
            bait.parentNode.removeChild(bait);
        }
        
        this.log("Méthode Bait: " + (detected || invisibleBait ? "Bloqueur détecté" : "Aucun bloqueur détecté"));
        return detected || invisibleBait;
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
        // Nous vérifions seulement si des scripts précédemment bloqués existent
        // pour éviter les faux positifs lors du chargement asynchrone
        const scriptIds = ['test-ad-script', 'carbon-ad-script', 'adsbygoogle-script'];
        
        for (let id of scriptIds) {
            const scriptElement = document.getElementById(id);
            if (scriptElement && scriptElement.hasAttribute('data-adblock-blocked')) {
                this.log("Méthode Script: Script publicitaire précédemment bloqué");
                return true;
            }
        }
        
        // Créer un nouveau script de test mais ne pas baser la détection sur son chargement
        if (!document.getElementById('adsbygoogle-script')) {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
            script.id = 'adsbygoogle-script';
            script.setAttribute('data-ad-client', 'ca-pub-1234567890123456');
            
            script.onerror = () => {
                script.setAttribute('data-adblock-blocked', 'true');
                this.log("Méthode Script: Erreur de chargement du script publicitaire");
            };
            
            document.body.appendChild(script);
        }
        
        this.log("Méthode Script: Aucun script publicitaire bloqué détecté");
        return false;
    }
    
    // MÉTHODE 4: Test Google Ads
    googleAdTest() {
        // Ne pas vérifier window.google.ads car ça peut causer des faux positifs
        // Nous utiliserons uniquement le test d'élément visuel
        
        // Créer un élément AdSense test
        const adElement = document.createElement('ins');
        adElement.className = 'adsbygoogle';
        adElement.style.display = 'block';
        adElement.style.width = '300px';
        adElement.style.height = '250px';
        adElement.setAttribute('data-ad-client', 'ca-pub-1234567890123456');
        adElement.setAttribute('data-ad-slot', '1234567890');
        
        document.body.appendChild(adElement);
        
        // Vérifier si l'élément est masqué par un bloqueur
        const style = window.getComputedStyle(adElement);
        const blocked = style.display === 'none' || style.height === '0px' || style.visibility === 'hidden' || adElement.offsetHeight === 0;
        
        // Nettoyer
        if (adElement.parentNode) {
            adElement.parentNode.removeChild(adElement);
        }
        
        this.log("Méthode Google: " + (blocked ? "Élément AdSense masqué ou caché" : "Aucun bloqueur détecté"));
        return blocked;
    }
    
    // MÉTHODE 5: Test avec faux div publicitaires
    fakeAdDivTest() {
        const adNames = [
            'ad', 'ads', 'adsense', 'doubleclick', 
            'ad-sidebar', 'ad-zone', 'banner-ads', 
            'sponsor', 'advert', 'adsbox',
            'ad-banner', 'ad-container', 'advert-container'
        ];
        
        let detectedCount = 0;
        
        for (let name of adNames) {
            const div = document.createElement('div');
            div.id = name;
            div.className = 'ads ad adsbox doubleclick ad-placement carbon-ads';
            div.style.height = '10px';
            div.style.width = '10px';
            div.style.position = 'absolute';
            div.style.top = '-999px';
            div.style.left = '-999px';
            div.innerHTML = '&nbsp;';
            
            document.body.appendChild(div);
            
            // Vérifier si le div est masqué
            const divStyle = window.getComputedStyle(div);
            if (divStyle.display === 'none' || divStyle.height === '0px' || div.offsetHeight === 0 || divStyle.visibility === 'hidden' || divStyle.opacity === '0') {
                this.log("Méthode FakeDiv: Bloqueur détecté avec l'ID " + name);
                detectedCount++;
            }
            
            // Nettoyer
            document.body.removeChild(div);
        }
        
        // Au moins 3 divs doivent être bloqués pour considérer comme positif
        // Ceci réduit les faux positifs
        const detected = detectedCount >= 3;
        this.log("Méthode FakeDiv: " + (detected ? "Bloqueur détecté (" + detectedCount + " divs bloqués)" : "Aucun bloqueur détecté"));
        return detected;
    }
    
    // MÉTHODE 6: Test des feuilles de style
    styleSheetTest() {
        // Certains bloqueurs de publicités injectent des feuilles de style
        const styleSheets = document.styleSheets;
        let detectedRules = 0;
        
        for (let i = 0; i < styleSheets.length; i++) {
            const sheet = styleSheets[i];
            
            try {
                // Vérifier si la feuille de style contient des règles anti-pub
                const rules = sheet.cssRules || sheet.rules;
                
                if (!rules) continue;
                
                for (let j = 0; j < rules.length; j++) {
                    const rule = rules[j];
                    const ruleText = rule.cssText || '';
                    
                    if ((ruleText.includes('#ad') || ruleText.includes('.ad') || 
                        ruleText.includes('banner') || ruleText.includes('sponsor') || 
                        ruleText.includes('adsby') || ruleText.includes('adsbox')) && 
                        (ruleText.includes('display: none') || ruleText.includes('visibility: hidden') || 
                         ruleText.includes('opacity: 0') || ruleText.includes('height: 0'))) {
                        this.log("Méthode StyleSheet: Règle CSS de bloqueur détectée: " + ruleText);
                        detectedRules++;
                    }
                }
            } catch (e) {
                // Les règles CORS peuvent déclencher des erreurs
                continue;
            }
        }
        
        // Au moins 2 règles CSS suspectes pour considérer comme positif
        const detected = detectedRules >= 2;
        this.log("Méthode StyleSheet: " + (detected ? "Bloqueur détecté (" + detectedRules + " règles)" : "Aucun bloqueur détecté"));
        return detected;
    }
    
    // Écouteur d'erreurs global
    errorListener(event) {
        // Détecter les erreurs spécifiques liées aux bloqueurs
        if (event.target && (
            (event.target.src && (event.target.src.includes('ads') || 
                                 event.target.src.includes('adsby') || 
                                 event.target.src.includes('doubleclick') || 
                                 event.target.src.includes('pagead'))) ||
            (event.target.src && event.target.src.includes('analytics')) ||
            (event.message && (event.message.includes('adsbygoogle') || 
                              event.message.includes('analytics') || 
                              event.message.includes('ad') || 
                              event.message.includes('sponsor')))
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

// Exportation pour utilisation comme module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdBlockerDetective;
} else {
    window.AdBlockerDetective = AdBlockerDetective;
}
