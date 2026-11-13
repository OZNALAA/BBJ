/* js/auth.js — Authentification sécurisée (API server.py + fallback local) */
(function() {
    const SESSION_KEY = 'bbj_session';
    const TOKEN_KEY = 'bbj_token';

    let currentUser = null;

    function updateSettingsVisibility(u) {
        const isAdmin = !!(u && u.role && String(u.role).toLowerCase() === 'admin');
        const settingsNav = document.getElementById('nav-item-settings') || document.querySelector('.nav-item[data-panel="settings"]');
        if (settingsNav) {
            settingsNav.style.display = isAdmin ? '' : 'none';
        }
        const settingsPanel = document.getElementById('panel-settings');
        if (!isAdmin && settingsPanel && settingsPanel.classList.contains('active')) {
            settingsPanel.classList.remove('active');
            const defNav = document.querySelector('.nav-item[data-panel="newcalc"]');
            const defPanel = document.getElementById('panel-newcalc');
            if (defNav) defNav.classList.add('active');
            if (defPanel) defPanel.classList.add('active');
        }
    }

    function setSidebarUser(u) {
        const el = document.getElementById('sidebar-user');
        if (el) {
            el.textContent = u ? ('Connecté : ' + u.nom + (u.role ? ' (' + u.role + ')' : '')) : '';
        }
        const mob = document.getElementById('mobile-user');
        if (mob) {
            mob.textContent = u ? (u.nom ? u.nom.split(' ')[0] : 'Connecté') : '';
        }
        updateSettingsVisibility(u);
    }

    function showLogin() {
        if (window.BBJSecurity && typeof window.BBJSecurity.isFleetAuthorized === 'function' && !window.BBJSecurity.isFleetAuthorized()) {
            return;
        }
        const screen = document.getElementById('login-screen');
        if (!screen) return;
        screen.style.display = 'flex';
        const p = document.getElementById('login-pass'); if (p) p.value = '';
        const err = document.getElementById('login-error'); if (err) err.textContent = '';
        setTimeout(function() {
            const u = document.getElementById('login-user'); if (u) u.focus();
        }, 50);
    }

    function hideLogin() {
        const screen = document.getElementById('login-screen');
        if (screen) screen.style.display = 'none';
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav && activeNav.dataset.panel === 'newcalc' && typeof window.showWbDisclaimerModal === 'function') {
            window.showWbDisclaimerModal();
        }
    }

    function attempt() {
        const loginEl = document.getElementById('login-user');
        const passEl = document.getElementById('login-pass');
        const errEl = document.getElementById('login-error');
        const login = (loginEl ? loginEl.value : '').trim();
        const pass = passEl ? passEl.value : '';

        if (!login || !pass) {
            if (errEl) errEl.textContent = 'Veuillez saisir votre identifiant et mot de passe.';
            return;
        }

        if (errEl) errEl.textContent = 'Connexion en cours...';

        // Requête sécurisée vers le serveur
        fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: login, password: pass })
        })
        .then(res => res.json())
        .then(res => {
            if (res.ok && res.token && res.user) {
                localStorage.setItem(TOKEN_KEY, res.token);
                localStorage.setItem(SESSION_KEY, JSON.stringify(res.user));
                currentUser = res.user;
                setSidebarUser(currentUser);
                hideLogin();
                if (errEl) errEl.textContent = '';
            } else {
                if (errEl) errEl.textContent = res.error || 'Login ou mot de passe incorrect.';
            }
        })
        .catch(() => {
            // Mode hors-ligne / GitHub Pages (statique)
            try {
                // 1) Identifiants officiels de base
                const DEFAULT_AUTH_USERS = [
    {
        "login": "admin",
        "aliases": [],
        "nom": "Administrateur",
        "role": "Admin",
        "password_hash": "0aa5cd05f1b0212719d56e305629f16e$31c239fc366b08d6a31a5d8ff1cd636bd31fd94e303362a5cac7231f715e690c"
    },
    {
        "login": "9402",
        "aliases": [
            "assellalou"
        ],
        "nom": "ASSELLALOU AHMED",
        "role": "User",
        "password_hash": "d8c0e2115654cda954687b3401e3dc0a$dea8bca644ef71a1cd1ee03072dec789e32873a0c6dfcda9c552a0ba8f380382"
    },
    {
        "login": "9410",
        "aliases": [],
        "nom": "EL ATIAOUI ABDELMAJID",
        "role": "User",
        "password_hash": "82b9a630e709a97b5c17d9094a1c547e$d455c659ac31e0ea4159af7631a09255f18e8c50d40d49ca5b83611c6873ea67"
    },
    {
        "login": "9997",
        "aliases": [],
        "nom": "LEAMARI ZAKARIA",
        "role": "User",
        "password_hash": "9d7d18b4ef9d67b741f58189a31dfb83$2d89d24d3234c822eee61626cd2c8ddb945c0c93a69431257c348064105ebb71"
    },
    {
        "login": "12326",
        "aliases": [
            "zguendi"
        ],
        "nom": "ZGUENDI KARIM",
        "role": "User",
        "password_hash": "40d2ebce0455740cb95e70f460e73b42$f0eaec36de7c8e5743c543505eab56f8dab6a09a2ef7398e47f1b628d889fe5d"
    },
    {
        "login": "12323",
        "aliases": [],
        "nom": "FIKRI BOUCHAIB",
        "role": "User",
        "password_hash": "05bd8815c259281e4b8caad8f4ade180$85a1286f4e70b60292a09f1ece9e26cdbd9b1fe94ebd4b3e93034b078ca6544c"
    },
    {
        "login": "12314",
        "aliases": [],
        "nom": "BIDAD MOHAMED REDA",
        "role": "User",
        "password_hash": "67469724697dabe4e75958135aebed79$1eefc449cc28606d252c6b8f18a95749990cf32257a6471175e88fadff5c9df5"
    },
    {
        "login": "12315",
        "aliases": [],
        "nom": "BOUGZOUL OMAR",
        "role": "User",
        "password_hash": "9d182c822abb12045f4797705d1790ab$21abec2b9d9b26ed0a6001ce9e679883be7cc4908d24e98532c5e0bfe7055995"
    },
    {
        "login": "12583",
        "aliases": [
            "ouzzine"
        ],
        "nom": "OUZZINE ALAA EDDINE",
        "role": "Admin",
        "password_hash": "f2116be075e1d12e75189f5b6fb2217c$adf53737d069547dbf05eb970f44fb63b746f80beab5b7cc6493564bbf306aed"
    },
    {
        "login": "45555",
        "aliases": [],
        "nom": "TAMIM AMINE",
        "role": "User",
        "password_hash": "9afa58659b426be6dcf2ecdf2bfe5e69$35e7befb1b1eed15f4926fab7bcde6cb247d4daca93b33ea8ed725d9d35939d2"
    },
    {
        "login": "22269",
        "aliases": [],
        "nom": "DAIF ADIL",
        "role": "User",
        "password_hash": "04a18cf953516dea8b2e3d3b744ace90$236b5cb9a7263f439d99399cd723f8958d9e5aa440c8495560a9cb7339c5a1b3"
    },
    {
        "login": "22271",
        "aliases": [],
        "nom": "CHANA ALI",
        "role": "User",
        "password_hash": "5cea439a106baa7d72d7356eecc382f6$585cb31f6509bd03e5aa037beca55da09a314e78ee88123e8db0d308535fbce9"
    },
    {
        "login": "22280",
        "aliases": [],
        "nom": "RAQAQ YOUSSEF",
        "role": "User",
        "password_hash": "ac0a9018e6dc53fe665b2eee1b9627a9$48390c9b1f621deab13036586aebb182aa2589027316ae839b2edb5e253ef48c"
    },
    {
        "login": "45627",
        "aliases": [],
        "nom": "AMRANI EL MAHDI",
        "role": "User",
        "password_hash": "da1dbacd81714613d4853cd53ad3269a$a277195ff0725c7c93dea90be08076c485cb63eacfe4f32625dd5674ece79734"
    },
    {
        "login": "44527",
        "aliases": [],
        "nom": "TAZI THAMI",
        "role": "User",
        "password_hash": "9b369c94b2851be2ea1d06d02eba3e6b$9bd27f6a9a4f0bb01205c7faac2cbb83cf1f302ff8da046c963e4d85e1fe41e9"
    },
    {
        "login": "ouzzine",
        "aliases": [],
        "nom": "OUZZINE ALAA-EDDINE",
        "role": "Admin",
        "password_hash": "08dd3d7c7cbf22a53e91f48300bd6f1b$aab3e98e39fb43e2ff5f8774ea248d6a88ba66fd84115b968af9d1aaad07494a"
    },
    {
        "login": "zguendi",
        "aliases": [],
        "nom": "ZGUENDI KARIM",
        "role": "User",
        "password_hash": "90c4b0ea80b5aa1f2affa214956222b9$2b6bf0a0f10f2f31442a79a7fbe2d642ddbaa1955f131491a775aa345202d2d8"
    },
    {
        "login": "assellalou",
        "aliases": [],
        "nom": "ASSELLALOU AHMED",
        "role": "User",
        "password_hash": "cb7882dfe66b5a4d70e9de79697f0fb6$f82304798e07dc342009c923e124390617bc73d3bb5ac784fd682814ffe6eee8"
    },
    {
        "login": "44657",
        "aliases": [],
        "nom": "ALAOUI ISMAIL",
        "role": "User",
        "password_hash": "b02cd2c581d26172f886f24da972046c$f1784215e366dd9de7035c6e912ffc49ab3e19cc585d6f0b6170467ad30e3972"
    },
    {
        "login": "12568",
        "aliases": [],
        "nom": "ESSATTE HOUSSAM",
        "role": "User",
        "password_hash": "37e7e02d3724414f5dcbe9bba65e1d2f$fe81b510851eaf1cb0c71fe189bdcaf5db569e8ce92391d722020b4f4c6dc2f7"
    },
    {
        "login": "44499",
        "aliases": [
            "bousbina"
        ],
        "nom": "BOUSBINA GHALI",
        "role": "User",
        "password_hash": "64b7e40274fa85341f86503150a94ea7$198dc0fb82f1d95d6202edfc0a14b00608774ed7a94502d05acaa71ffe7acef1"
    }
];

                let matchedUser = null;
                const defUser = DEFAULT_AUTH_USERS.find(x => x.login === login.toLowerCase() || (x.aliases && x.aliases.includes(login.toLowerCase())));
                if (defUser) {
                    const ok = (window.BBJSecurity && defUser.password_hash) ?
                        window.BBJSecurity.verifyPassword(pass, defUser.password_hash) :
                        (defUser.pass && defUser.pass.includes(pass));
                    if (ok) matchedUser = defUser;
                }

                if (!matchedUser) {
                    const localUsers = JSON.parse(localStorage.getItem("bbj_users")) || [];
                    const found = localUsers.find(u => u.login && u.login.toLowerCase() === login.toLowerCase());
                    if (found) {
                        const ok = (window.BBJSecurity && found.password_hash) ?
                            window.BBJSecurity.verifyPassword(pass, found.password_hash) :
                            (found.password === pass);
                        if (ok) matchedUser = found;
                    }
                }

                if (matchedUser) {
                    // Si l'utilisateur est authentifié avec succès, autoriser automatiquement l'appareil pour ne plus redemander le PIN
                    if (window.BBJSecurity && typeof window.BBJSecurity.authorizeFleet === 'function') {
                        try { localStorage.setItem('bbj_fleet_authorized', 'RAM_BBJ_AUTHORIZED_CN_RRN_2026'); } catch (e) {}
                    }
                    currentUser = { login: matchedUser.login, nom: matchedUser.nom || matchedUser.login, role: matchedUser.role || "User" };
                    localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
                    setSidebarUser(currentUser);
                    hideLogin();
                    if (errEl) errEl.textContent = "";
                    return;
                }
            } catch (e) {}

            if (errEl) errEl.textContent = 'Login ou mot de passe incorrect.';
        });
    }

    function logout() {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'X-Session-Token': token }
            }).catch(() => {});
        }
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(TOKEN_KEY);
        currentUser = null;
        setSidebarUser(null);
        showLogin();
    }

    function requireLogin() {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            fetch('/api/auth/me', {
                headers: { 'X-Session-Token': token }
            })
            .then(res => res.json())
            .then(res => {
                if (res.ok && res.authenticated && res.user) {
                    currentUser = res.user;
                    localStorage.setItem(SESSION_KEY, JSON.stringify(res.user));
                    setSidebarUser(currentUser);
                    hideLogin();
                } else {
                    // Session expirée
                    showLogin();
                }
            })
            .catch(() => {
                // Hors-ligne: se baser sur la session locale existante
                try {
                    const s = JSON.parse(localStorage.getItem(SESSION_KEY));
                    if (s) {
                        currentUser = s;
                        setSidebarUser(s);
                        hideLogin();
                        return;
                    }
                } catch(e) {}
                showLogin();
            });
        } else {
            showLogin();
        }
    }

    function init() {
        requireLogin();
        const btn = document.getElementById('login-btn');
        if (btn) btn.addEventListener('click', attempt);
        ['login-user', 'login-pass'].forEach(function(id) {
            const el = document.getElementById(id);
            if (el) el.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') attempt();
            });
        });
        const out = document.getElementById('btn-logout');
        if (out) out.addEventListener('click', logout);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.AUTH = {
        requireLogin: requireLogin,
        logout: logout,
        currentUser: function() { return currentUser; },
        isAdmin: function() {
            return !!(currentUser && currentUser.role && String(currentUser.role).toLowerCase() === 'admin');
        },
        updateSettingsVisibility: function() {
            updateSettingsVisibility(currentUser);
        }
    };
})();
