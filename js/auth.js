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
                // 1) Vérification dans la base d'utilisateurs locale
                const users = JSON.parse(localStorage.getItem('bbj_users')) || [];
                const matched = users.find(u => u.login && u.login.toLowerCase() === login.toLowerCase() && (u.password === pass || !u.password));
                if (matched) {
                    currentUser = { login: matched.login, nom: matched.nom || matched.login, role: matched.role || 'User' };
                    localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
                    setSidebarUser(currentUser);
                    hideLogin();
                    if (errEl) errEl.textContent = '';
                    return;
                }
                // 2) Session active précédente
                const s = JSON.parse(localStorage.getItem(SESSION_KEY));
                if (s && s.login.toLowerCase() === login.toLowerCase()) {
                    currentUser = s;
                    setSidebarUser(s);
                    hideLogin();
                    if (errEl) errEl.textContent = '';
                    return;
                }
            } catch (e) {}

            // 3) Identifiants par défaut hors-ligne pour premier lancement autonome sur iPad / Android
            if (login.toLowerCase() === 'admin' && (pass === 'admin' || pass === '1234')) {
                currentUser = { login: 'admin', nom: 'Administrateur', role: 'Admin' };
                localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
                setSidebarUser(currentUser);
                hideLogin();
                if (errEl) errEl.textContent = '';
                return;
            }
            if (login.toLowerCase() === 'ouzzine' && (pass === 'ouzzine' || pass === '1234')) {
                currentUser = { login: 'ouzzine', nom: 'OUZZINE ALAA-EDDINE', role: 'Admin' };
                localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
                setSidebarUser(currentUser);
                hideLogin();
                if (errEl) errEl.textContent = '';
                return;
            }

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
