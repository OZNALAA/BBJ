/* ==========================================================================
   BBJ EFB - Security & Cryptographic Vault (AES-256 & PBKDF2)
   Chiffrement transparent des données locales et authentification sécurisée
   Portail d'autorisation Flotte (Code PIN)
   ========================================================================== */

(function() {
    'use strict';

    // Clé maîtresse pour le chiffrement AES-256 local
    const VAULT_MASTER_KEY = 'BBJ_RAM_CN-RRN_AES256_OFFICIAL_EFB_VAULT_2026';
    const SENSITIVE_STORAGE_KEYS = [
        'bbj_saved_flights',
        'bbj_flightlog_records',
        'bbj_crew_database',
        'bbj_users',
        'bbj_fleet_authorized'
    ];

    // Hachage cryptographique du PIN Flotte "RAM_OUZZINE" (PBKDF2 SHA-256 100k itérations)
    const FLEET_PIN_HASH = '096991403d48cd48c17563c0432c13e3$d55794daed977ea534a26bb214b9fdb451f593c28208655148a016cb1a90572b';
    const FLEET_STORAGE_KEY = 'bbj_fleet_authorized';
    const FLEET_TOKEN = 'RAM_BBJ_AUTHORIZED_CN_RRN_2026';

    function isCryptoReady() {
        return typeof CryptoJS !== 'undefined' && CryptoJS.AES;
    }

    // Chiffrement AES-256 OpenSSL standard
    function encrypt(plainText, customKey) {
        if (!plainText || typeof plainText !== 'string') return plainText;
        if (!isCryptoReady()) return plainText;
        try {
            const key = customKey || VAULT_MASTER_KEY;
            return CryptoJS.AES.encrypt(plainText, key).toString();
        } catch (e) {
            console.error('[BBJSecurity] Encryption error:', e);
            return plainText;
        }
    }

    // Déchiffrement AES-256
    function decrypt(cipherText, customKey) {
        if (!cipherText || typeof cipherText !== 'string') return cipherText;
        // Si le texte ne ressemble pas à un bloc OpenSSL Salted (commence par U2FsdGVkX1)
        if (!cipherText.startsWith('U2FsdGVkX1')) return cipherText;
        if (!isCryptoReady()) return cipherText;
        try {
            const key = customKey || VAULT_MASTER_KEY;
            const bytes = CryptoJS.AES.decrypt(cipherText, key);
            const original = bytes.toString(CryptoJS.enc.Utf8);
            return original || cipherText;
        } catch (e) {
            console.warn('[BBJSecurity] Decryption warning:', e);
            return cipherText;
        }
    }

    // Hachage PBKDF2 HMAC-SHA256 (100 000 itérations)
    function hashPassword(password, salt) {
        if (!isCryptoReady()) return password;
        if (!salt) {
            salt = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
        }
        const derived = CryptoJS.PBKDF2(password, salt, {
            keySize: 256 / 32,
            iterations: 100000,
            hasher: CryptoJS.algo.SHA256
        });
        return salt + '$' + derived.toString(CryptoJS.enc.Hex);
    }

    // Vérification de mot de passe par hachage PBKDF2
    function verifyPassword(password, storedHash) {
        if (!password || !storedHash || !isCryptoReady()) return false;
        try {
            const parts = storedHash.split('$');
            if (parts.length !== 2) return false;
            const salt = parts[0];
            const expectedHash = parts[1];
            const derived = CryptoJS.PBKDF2(password, salt, {
                keySize: 256 / 32,
                iterations: 100000,
                hasher: CryptoJS.algo.SHA256
            });
            return derived.toString(CryptoJS.enc.Hex) === expectedHash;
        } catch (e) {
            return false;
        }
    }

    // Vérification de l'autorisation flotte (appareil déjà validé)
    function isFleetAuthorized() {
        try {
            // Vérification directe et via déchiffrement pour résister à tous les contextes
            const direct = window.localStorage ? window.localStorage.getItem(FLEET_STORAGE_KEY) : null;
            if (direct === FLEET_TOKEN) return true;
            if (direct && direct.startsWith('U2FsdGVkX1')) {
                const dec = decrypt(direct);
                if (dec === FLEET_TOKEN) return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    // Tentative de déverrouillage de la flotte
    function authorizeFleet(enteredPin) {
        if (!enteredPin) return false;
        const trimmed = String(enteredPin).trim();
        if (verifyPassword(trimmed, FLEET_PIN_HASH)) {
            try {
                if (window.localStorage) {
                    window.localStorage.setItem(FLEET_STORAGE_KEY, FLEET_TOKEN);
                }
            } catch (e) {}
            return true;
        }
        return false;
    }

    // Initialisation du portail PIN à l'écran
    function initFleetGate() {
        const gate = document.getElementById('fleet-gate-screen');
        if (!gate) return;

        if (isFleetAuthorized()) {
            gate.style.display = 'none';
            return;
        }

        // Verrouillage immédiat
        gate.style.display = 'flex';
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.style.display = 'none';

        const pinInput = document.getElementById('fleet-pin-input');
        const unlockBtn = document.getElementById('btn-fleet-unlock');
        const errEl = document.getElementById('fleet-pin-error');

        function tryUnlock() {
            const pin = pinInput ? pinInput.value : '';
            if (!pin) {
                if (errEl) {
                    errEl.textContent = 'Veuillez saisir le code PIN Flotte.';
                    errEl.style.display = 'block';
                }
                return;
            }

            if (authorizeFleet(pin)) {
                if (errEl) errEl.style.display = 'none';
                gate.style.opacity = '0';
                gate.style.transition = 'opacity 0.3s ease';
                setTimeout(function() {
                    gate.style.display = 'none';
                    if (window.AUTH && typeof window.AUTH.requireLogin === 'function') {
                        window.AUTH.requireLogin();
                    }
                }, 300);
            } else {
                if (errEl) {
                    errEl.textContent = 'Code PIN incorrect. Accès Flotte refusé.';
                    errEl.style.display = 'block';
                }
                if (pinInput) {
                    pinInput.value = '';
                    pinInput.focus();
                }
            }
        }

        if (unlockBtn) unlockBtn.addEventListener('click', tryUnlock);
        if (pinInput) {
            pinInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') tryUnlock();
            });
            setTimeout(function() { pinInput.focus(); }, 150);
        }
    }

    // Crochet (hook) transparent sur localStorage
    function installStorageEncryption() {
        if (!window.localStorage) return;

        const originalGetItem = localStorage.getItem.bind(localStorage);
        const originalSetItem = localStorage.setItem.bind(localStorage);

        // Migration silencieuse des données déjà existantes non chiffrées sur la tablette
        SENSITIVE_STORAGE_KEYS.forEach(function(key) {
            try {
                const existing = originalGetItem(key);
                if (existing && !existing.startsWith('U2FsdGVkX1')) {
                    const encrypted = encrypt(existing);
                    originalSetItem(key, encrypted);
                }
            } catch (e) {}
        });

        // Remplacement de setItem pour chiffrer automatiquement
        localStorage.setItem = function(key, value) {
            if (SENSITIVE_STORAGE_KEYS.includes(key) && typeof value === 'string') {
                const encVal = encrypt(value);
                return originalSetItem(key, encVal);
            }
            return originalSetItem(key, value);
        };

        // Remplacement de getItem pour déchiffrer automatiquement
        localStorage.getItem = function(key) {
            const rawVal = originalGetItem(key);
            if (SENSITIVE_STORAGE_KEYS.includes(key) && rawVal) {
                return decrypt(rawVal);
            }
            return rawVal;
        };
    }

    // Initialisation immédiate du chiffrement
    installStorageEncryption();

    // Montage du portail PIN au chargement du DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFleetGate);
    } else {
        initFleetGate();
    }

    // Export global
    window.BBJSecurity = {
        encrypt: encrypt,
        decrypt: decrypt,
        hashPassword: hashPassword,
        verifyPassword: verifyPassword,
        isFleetAuthorized: isFleetAuthorized,
        authorizeFleet: authorizeFleet,
        isEncrypted: function(str) { return typeof str === 'string' && str.startsWith('U2FsdGVkX1'); }
    };
})();
