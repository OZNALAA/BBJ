/* js/users.js — Gestion sécurisée des utilisateurs (Settings > USERS) */
(function() {
    const STORAGE_KEY = 'bbj_users';
    const API_URL = '/api/data?file=users';

    let users = [];
    let editingIndex = -1;

    function loadServer(callback) {
        const token = localStorage.getItem('bbj_token');
        fetch(API_URL, {
            headers: { 'X-Session-Token': token || '' }
        })
        .then(res => res.json())
        .then(res => {
            if (res && res.ok && Array.isArray(res.data)) {
                users = res.data;
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
            users = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (e) {
            users = [];
        }
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
            record.password = password; // Sera haché côté serveur
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
