/* js/users.js — Gestion sécurisée des utilisateurs (Settings > USERS) */
(function() {
    const STORAGE_KEY = 'bbj_users';
    const API_URL = '/api/data?file=users';

    const DEFAULT_USERS = [
    {
        "nom": "Administrateur",
        "login": "admin",
        "role": "Admin",
        "password_hash": "0aa5cd05f1b0212719d56e305629f16e$31c239fc366b08d6a31a5d8ff1cd636bd31fd94e303362a5cac7231f715e690c"
    },
    {
        "nom": "ASSELLALOU AHMED",
        "login": "9402",
        "role": "User",
        "password_hash": "d8c0e2115654cda954687b3401e3dc0a$dea8bca644ef71a1cd1ee03072dec789e32873a0c6dfcda9c552a0ba8f380382"
    },
    {
        "nom": "EL ATIAOUI ABDELMAJID",
        "login": "9410",
        "role": "User",
        "password_hash": "82b9a630e709a97b5c17d9094a1c547e$d455c659ac31e0ea4159af7631a09255f18e8c50d40d49ca5b83611c6873ea67"
    },
    {
        "nom": "LEAMARI ZAKARIA",
        "login": "9997",
        "role": "User",
        "password_hash": "9d7d18b4ef9d67b741f58189a31dfb83$2d89d24d3234c822eee61626cd2c8ddb945c0c93a69431257c348064105ebb71"
    },
    {
        "nom": "ZGUENDI KARIM",
        "login": "12326",
        "role": "User",
        "password_hash": "40d2ebce0455740cb95e70f460e73b42$f0eaec36de7c8e5743c543505eab56f8dab6a09a2ef7398e47f1b628d889fe5d"
    },
    {
        "nom": "FIKRI BOUCHAIB",
        "login": "12323",
        "role": "User",
        "password_hash": "05bd8815c259281e4b8caad8f4ade180$85a1286f4e70b60292a09f1ece9e26cdbd9b1fe94ebd4b3e93034b078ca6544c"
    },
    {
        "nom": "BIDAD MOHAMED REDA",
        "login": "12314",
        "role": "User",
        "password_hash": "67469724697dabe4e75958135aebed79$1eefc449cc28606d252c6b8f18a95749990cf32257a6471175e88fadff5c9df5"
    },
    {
        "nom": "BOUGZOUL OMAR",
        "login": "12315",
        "role": "User",
        "password_hash": "9d182c822abb12045f4797705d1790ab$21abec2b9d9b26ed0a6001ce9e679883be7cc4908d24e98532c5e0bfe7055995"
    },
    {
        "nom": "OUZZINE ALAA EDDINE",
        "login": "12583",
        "role": "Admin",
        "password_hash": "f2116be075e1d12e75189f5b6fb2217c$adf53737d069547dbf05eb970f44fb63b746f80beab5b7cc6493564bbf306aed"
    },
    {
        "nom": "TAMIM AMINE",
        "login": "45555",
        "role": "User",
        "password_hash": "9afa58659b426be6dcf2ecdf2bfe5e69$35e7befb1b1eed15f4926fab7bcde6cb247d4daca93b33ea8ed725d9d35939d2"
    },
    {
        "nom": "DAIF ADIL",
        "login": "22269",
        "role": "User",
        "password_hash": "04a18cf953516dea8b2e3d3b744ace90$236b5cb9a7263f439d99399cd723f8958d9e5aa440c8495560a9cb7339c5a1b3"
    },
    {
        "nom": "CHANA ALI",
        "login": "22271",
        "role": "User",
        "password_hash": "5cea439a106baa7d72d7356eecc382f6$585cb31f6509bd03e5aa037beca55da09a314e78ee88123e8db0d308535fbce9"
    },
    {
        "nom": "RAQAQ YOUSSEF",
        "login": "22280",
        "role": "User",
        "password_hash": "ac0a9018e6dc53fe665b2eee1b9627a9$48390c9b1f621deab13036586aebb182aa2589027316ae839b2edb5e253ef48c"
    },
    {
        "nom": "AMRANI EL MAHDI",
        "login": "45627",
        "role": "User",
        "password_hash": "da1dbacd81714613d4853cd53ad3269a$a277195ff0725c7c93dea90be08076c485cb63eacfe4f32625dd5674ece79734"
    },
    {
        "nom": "TAZI THAMI",
        "login": "44527",
        "role": "User",
        "password_hash": "9b369c94b2851be2ea1d06d02eba3e6b$9bd27f6a9a4f0bb01205c7faac2cbb83cf1f302ff8da046c963e4d85e1fe41e9"
    },
    {
        "nom": "OUZZINE ALAA-EDDINE",
        "login": "ouzzine",
        "role": "Admin",
        "password_hash": "08dd3d7c7cbf22a53e91f48300bd6f1b$aab3e98e39fb43e2ff5f8774ea248d6a88ba66fd84115b968af9d1aaad07494a"
    },
    {
        "nom": "ZGUENDI KARIM",
        "login": "zguendi",
        "role": "User",
        "password_hash": "90c4b0ea80b5aa1f2affa214956222b9$2b6bf0a0f10f2f31442a79a7fbe2d642ddbaa1955f131491a775aa345202d2d8"
    },
    {
        "nom": "ASSELLALOU AHMED",
        "login": "assellalou",
        "role": "User",
        "password_hash": "cb7882dfe66b5a4d70e9de79697f0fb6$f82304798e07dc342009c923e124390617bc73d3bb5ac784fd682814ffe6eee8"
    },
    {
        "nom": "ALAOUI ISMAIL",
        "login": "44657",
        "role": "User",
        "password_hash": "b02cd2c581d26172f886f24da972046c$f1784215e366dd9de7035c6e912ffc49ab3e19cc585d6f0b6170467ad30e3972"
    },
    {
        "nom": "ESSATTE HOUSSAM",
        "login": "12568",
        "role": "User",
        "password_hash": "37e7e02d3724414f5dcbe9bba65e1d2f$fe81b510851eaf1cb0c71fe189bdcaf5db569e8ce92391d722020b4f4c6dc2f7"
    },
    {
        "nom": "BOUSBINA GHALI",
        "login": "44499",
        "role": "User",
        "password_hash": "64b7e40274fa85341f86503150a94ea7$198dc0fb82f1d95d6202edfc0a14b00608774ed7a94502d05acaa71ffe7acef1"
    }
];

    let users = [];
    let editingIndex = -1;

    function loadServer(callback) {
        const token = localStorage.getItem('bbj_token');
        fetch(API_URL, {
            headers: { 'X-Session-Token': token || '' }
        })
        .then(res => {
            if (!res.ok) throw new Error('API non disponible');
            return res.json();
        })
        .then(res => {
            if (res && res.ok && Array.isArray(res.data) && res.data.length) {
                users = res.data;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
                render();
            } else {
                loadStaticJsonOrLocal(callback);
                return;
            }
            if (callback) callback();
        })
        .catch(() => {
            loadStaticJsonOrLocal(callback);
        });
    }

    function loadStaticJsonOrLocal(callback) {
        fetch('data/users.json')
            .then(r => {
                if (!r.ok) throw new Error('data/users.json non trouvé');
                return r.json();
            })
            .then(data => {
                let userList = null;
                if (data && data.encrypted && data.vault && window.BBJSecurity) {
                    try { userList = JSON.parse(window.BBJSecurity.decrypt(data.vault)); } catch(e) {}
                } else if (Array.isArray(data)) {
                    userList = data;
                }
                if (Array.isArray(userList) && userList.length) {
                    data = userList;
                    const localSaved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
                    const merged = data.slice();
                    localSaved.forEach(u => {
                        if (!merged.some(m => m.login && u.login && m.login.toLowerCase() === u.login.toLowerCase())) {
                            merged.push(u);
                        }
                    });
                    users = merged;
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
                    render();
                } else {
                    loadLocal();
                }
                if (callback) callback();
            })
            .catch(() => {
                loadLocal();
                if (callback) callback();
            });
    }

    function loadLocal() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (Array.isArray(saved) && saved.length) {
                const merged = DEFAULT_USERS.slice();
                saved.forEach(u => {
                    if (!merged.some(m => m.login && u.login && m.login.toLowerCase() === u.login.toLowerCase())) {
                        merged.push(u);
                    }
                });
                users = merged;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
                render();
                return;
            }
        } catch (e) {}
        users = DEFAULT_USERS.slice();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        render();
    }

    function persist() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        const token = localStorage.getItem('bbj_token');

        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-Token': token || ''
            },
            body: JSON.stringify({ data: users })
        })
        .then(res => res.json())
        .then(res => {
            if (!res.ok) {
                alert("Attention: " + (res.error || "Impossible d'enregistrer sur le serveur."));
            } else {
                // Recharger la liste sécurisée
                loadServer();
            }
        })
        .catch(err => {
            console.warn("Écriture serveur impossible (mode hors-ligne):", err);
        });
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function render() {
        const tbody = document.getElementById('user-tbody');
        const empty = document.getElementById('user-empty');
        if (!tbody) return;
        let html = '';
        users.forEach(function(u, i) {
            const role = u.role === 'Admin' ? 'Admin' : 'User';
            html += '<tr>'
                + '<td>' + escapeHtml(u.nom) + '</td>'
                + '<td>' + escapeHtml(u.login) + '</td>'
                + '<td class="user-pass-cell">••••••••</td>'
                + '<td>' + role + '</td>'
                + '<td class="crew-actions">'
                + '<button type="button" class="btn btn-small" data-edit="' + i + '">Modifier</button> '
                + '<button type="button" class="btn btn-small btn-danger" data-del="' + i + '">Supprimer</button>'
                + '</td>'
                + '</tr>';
        });
        tbody.innerHTML = html;
        if (empty) empty.style.display = users.length ? 'none' : 'block';

        tbody.querySelectorAll('[data-edit]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                startEdit(parseInt(this.dataset.edit, 10));
            });
        });
        tbody.querySelectorAll('[data-del]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                removeUser(parseInt(this.dataset.del, 10));
            });
        });
    }

    function startEdit(i) {
        const u = users[i];
        if (!confirm('Modifier l’utilisateur « ' + u.nom + ' » (' + u.login + ') ?')) return;
        editingIndex = i;
        document.getElementById('user-nom').value = u.nom;
        document.getElementById('user-login').value = u.login;
        document.getElementById('user-pass').value = '';
        document.getElementById('user-pass').placeholder = 'Laisser vide pour ne pas changer';
        document.getElementById('user-role').value = u.role === 'Admin' ? 'Admin' : 'User';
        document.getElementById('user-save').textContent = 'Mettre à jour';
        document.getElementById('user-cancel').style.display = '';
        document.getElementById('user-nom').focus();
    }

    function resetForm() {
        editingIndex = -1;
        document.getElementById('user-nom').value = '';
        document.getElementById('user-login').value = '';
        document.getElementById('user-pass').value = '';
        document.getElementById('user-pass').placeholder = 'Mot de passe';
        document.getElementById('user-role').value = 'User';
        document.getElementById('user-save').textContent = 'Ajouter';
        document.getElementById('user-cancel').style.display = 'none';
    }

    function save() {
        const nom = document.getElementById('user-nom').value.trim();
        const login = document.getElementById('user-login').value.trim();
        const password = document.getElementById('user-pass').value;

        if (!nom || !login) {
            alert('Renseigne le nom et le login.');
            return;
        }

        if (editingIndex < 0 && !password) {
            alert('Renseigne un mot de passe pour le nouvel utilisateur.');
            return;
        }

        const duplicate = users.some(function(u, i) { return i !== editingIndex && u.login.toLowerCase() === login.toLowerCase(); });
        if (duplicate) {
            alert('Un utilisateur avec ce login existe déjà.');
            return;
        }

        const record = {
            nom: nom,
            login: login,
            role: document.getElementById('user-role').value === 'Admin' ? 'Admin' : 'User'
        };
        if (password) {
            record.password_hash = (window.BBJSecurity && window.BBJSecurity.hashPassword) ?
                window.BBJSecurity.hashPassword(password) : password;
        }

        if (editingIndex >= 0) {
            users[editingIndex] = Object.assign({}, users[editingIndex], record);
        } else {
            users.push(record);
        }
        persist();
        render();
        resetForm();
    }

    function removeUser(i) {
        const u = users[i];
        if (!confirm('Supprimer « ' + u.nom + ' » (' + u.login + ') de la base users ?')) return;
        users.splice(i, 1);
        if (editingIndex === i) resetForm();
        else if (editingIndex > i) editingIndex--;
        persist();
        render();
    }

    function init() {
        loadServer();
        const saveBtn = document.getElementById('user-save');
        if (saveBtn) saveBtn.addEventListener('click', save);
        const cancelBtn = document.getElementById('user-cancel');
        if (cancelBtn) cancelBtn.addEventListener('click', resetForm);
        window.USERS = {
            list: function() { return users.slice(); },
            reload: function() { loadServer(); }
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
