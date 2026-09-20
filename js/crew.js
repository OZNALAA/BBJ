(function() {
    const STORAGE_KEY = 'bbj_crew';
    const API_URL = '/api/data?file=crew';

    const FONCTION_MAP = {
        'Pilote': 'CDB',
        'Copilote': 'OPL',
        'Cheffe de cabine': 'CC',
        'Mécanicien navigant': 'Mécanicien'
    };
    const GRADES_BY_FONCTION = {
        'CDB': ['AAA', 'ARA'],
        'OPL': ['DDA'],
        'CC': ['MRA', 'MMA'],
        'PNC': ['NNA'],
        'Observateur': ['_'],
        'Mécanicien': ['_'],
        'Autre': ['_']
    };

    const DEFAULT_CREW = [
        { nom: "OUZZINE ALAA-EDDINE", matricule: "12583", fonction: "CDB", grade: "AAA", posit: "AAA" },
        { nom: "ASSELLALOU AHMED", matricule: "9202", fonction: "CDB", grade: "ARA", posit: "ARA" },
        { nom: "ABDOUN", matricule: "10452", fonction: "OPL", grade: "DDA", posit: "DDA" },
        { nom: "EL ATIAOUI", matricule: "11234", fonction: "CDB", grade: "AAA", posit: "AAA" },
        { nom: "ZGUENDI KARIM", matricule: "13420", fonction: "OPL", grade: "DDA", posit: "DDA" }
    ];

    let crew = [];
    let editingIndex = -1;

    function resolveFonctionGrade(fInput, gInput, positInput) {
        let p = String(positInput || '').trim().toUpperCase();
        let f = String(fInput || '').trim();
        let g = String(gInput || '').trim().toUpperCase();

        if (p) {
            if (p === 'ARA' || p === 'AAA') { f = 'CDB'; g = p; }
            else if (p === 'DDA') { f = 'OPL'; g = 'DDA'; }
            else if (p === 'MRA' || p === 'MMA') { f = 'CC'; g = p; }
            else if (p === 'NNA') { f = 'PNC'; g = 'NNA'; }
            else if (p === 'CDB') { f = 'CDB'; g = g || 'AAA'; }
            else if (p === 'OPL') { f = 'OPL'; g = 'DDA'; }
            else if (p === 'CC') { f = 'CC'; g = 'MRA'; }
            else if (p === 'PNC') { f = 'PNC'; g = 'NNA'; }
            else { f = f || p; g = g || p; }
        }

        const cleanF = FONCTION_MAP[f] || f || 'CDB';
        const grades = GRADES_BY_FONCTION[cleanF] || ['_'];
        const cleanG = (g && grades.indexOf(g) >= 0) ? g : (g || grades[0]);
        const finalPosit = p || cleanG || cleanF;

        return { fonction: cleanF, grade: cleanG, posit: finalPosit };
    }

    function sanitizeMember(m) {
        const res = resolveFonctionGrade(m.fonction, m.grade, m.posit);
        return {
            nom: String(m.nom || '').trim(),
            matricule: String(m.matricule || '').trim(),
            fonction: res.fonction,
            grade: res.grade,
            posit: res.posit
        };
    }

    function loadLocal() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (Array.isArray(saved) && saved.length) {
                crew = saved.map(sanitizeMember);
                return;
            }
        } catch (e) {}
        crew = DEFAULT_CREW.map(sanitizeMember);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(crew));
    }

    function loadServer(callback) {
        fetch(API_URL)
            .then(res => {
                if (!res.ok) throw new Error('API server non disponible');
                return res.json();
            })
            .then(res => {
                if (res && res.ok && Array.isArray(res.data) && res.data.length) {
                    crew = res.data.map(sanitizeMember);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(crew));
                    render();
                    if (typeof populateCrewFields === 'function') populateCrewFields();
                } else {
                    loadStaticJsonOrLocal(callback);
                    return;
                }
                if (callback) callback();
            })
            .catch(() => {
                // Serveur injoignable (ex: GitHub Pages ou hors-ligne): fallback sur data/crew.json
                loadStaticJsonOrLocal(callback);
            });
    }

    function loadStaticJsonOrLocal(callback) {
        fetch('data/crew.json')
            .then(r => {
                if (!r.ok) throw new Error('data/crew.json non trouvé');
                return r.json();
            })
            .then(data => {
                if (Array.isArray(data) && data.length) {
                    const localSaved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
                    crew = (localSaved.length ? localSaved : data).map(sanitizeMember);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(crew));
                    render();
                    if (typeof populateCrewFields === 'function') populateCrewFields();
                } else {
                    loadLocal();
                    render();
                }
                if (callback) callback();
            })
            .catch(() => {
                loadLocal();
                render();
                if (callback) callback();
            });
    }

    function persist() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(crew));
        // Enregistrement physique en dur sur disque
        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-Token': localStorage.getItem('bbj_token') || ''
            },
            body: JSON.stringify({ data: crew })
        }).catch(err => {
            console.warn("Écriture serveur hors-ligne, données conservées en cache local:", err);
        });

        if (typeof populateCrewFields === 'function') populateCrewFields();
    }

    function updateGradeOptions(preserve) {
        const fEl = document.getElementById('crew-fonction');
        if (!fEl) return;
        const f = fEl.value;
        const gradeEl = document.getElementById('crew-grade');
        if (!gradeEl) return;
        const grades = GRADES_BY_FONCTION[f] || ['_'];
        const prev = gradeEl.value;
        let html = '';
        grades.forEach(function(g) {
            html += '<option value="' + g + '">' + g + '</option>';
        });
        gradeEl.innerHTML = html;
        if (preserve && grades.indexOf(prev) >= 0) gradeEl.value = prev;
    }

    function render() {
        const tbody = document.getElementById('crew-tbody');
        const empty = document.getElementById('crew-empty');
        if (!tbody) return;
        let html = '';
        crew.forEach(function(m, i) {
            html += '<tr>'
                + '<td>' + escapeHtml(m.nom) + '</td>'
                + '<td>' + escapeHtml(m.matricule) + '</td>'
                + '<td>' + escapeHtml(m.fonction) + '</td>'
                + '<td>' + escapeHtml(m.grade) + '</td>'
                + '<td class="crew-actions">'
                + '<button type="button" class="btn btn-small" data-edit="' + i + '">Modifier</button> '
                + '<button type="button" class="btn btn-small btn-danger" data-del="' + i + '">Supprimer</button>'
                + '</td>'
                + '</tr>';
        });
        tbody.innerHTML = html;
        if (empty) empty.style.display = crew.length ? 'none' : 'block';

        tbody.querySelectorAll('[data-edit]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                startEdit(parseInt(this.dataset.edit, 10));
            });
        });
        tbody.querySelectorAll('[data-del]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                removeMember(parseInt(this.dataset.del, 10));
            });
        });
    }

    function startEdit(i) {
        if (!confirm('Modifier « ' + crew[i].nom + ' » (' + crew[i].matricule + ') ?')) return;
        editingIndex = i;
        const m = crew[i];
        document.getElementById('crew-nom').value = m.nom;
        document.getElementById('crew-matricule').value = m.matricule;
        document.getElementById('crew-fonction').value = m.fonction;
        updateGradeOptions(false);
        document.getElementById('crew-grade').value = m.grade;
        document.getElementById('crew-save').textContent = 'Mettre à jour';
        document.getElementById('crew-cancel').style.display = '';
        document.getElementById('crew-nom').focus();
    }

    function resetForm() {
        editingIndex = -1;
        const n = document.getElementById('crew-nom'); if (n) n.value = '';
        const m = document.getElementById('crew-matricule'); if (m) m.value = '';
        const f = document.getElementById('crew-fonction'); if (f) f.value = 'CDB';
        updateGradeOptions(false);
        const s = document.getElementById('crew-save'); if (s) s.textContent = 'Ajouter';
        const c = document.getElementById('crew-cancel'); if (c) c.style.display = 'none';
    }

    function save() {
        const nom = document.getElementById('crew-nom').value.trim();
        const matricule = document.getElementById('crew-matricule').value.trim().replace(/[^0-9]/g, '');
        const fonction = document.getElementById('crew-fonction').value;
        const grade = document.getElementById('crew-grade').value;

        if (!nom || !matricule) {
            alert('Renseigne au moins un nom et un matricule.');
            return;
        }

        const duplicate = crew.some(function(m, i) { return i !== editingIndex && m.matricule === matricule; });
        if (duplicate) {
            alert('Un membre avec ce matricule existe déjà.');
            return;
        }

        const record = sanitizeMember({ nom: nom, matricule: matricule, fonction: fonction, grade: grade });
        if (editingIndex >= 0) {
            crew[editingIndex] = record;
        } else {
            crew.push(record);
        }
        persist();
        render();
        resetForm();
    }

    function removeMember(i) {
        const m = crew[i];
        if (!confirm('Supprimer « ' + m.nom + ' » (' + m.matricule + ') de la base crew ?')) return;
        crew.splice(i, 1);
        if (editingIndex === i) resetForm();
        else if (editingIndex > i) editingIndex--;
        persist();
        render();
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function addMemberDirect(nom, matricule, fonction, grade, posit) {
        nom = String(nom || '').trim();
        matricule = String(matricule || '').trim().replace(/[^0-9]/g, '');
        if (!nom) return null;
        if (!matricule) matricule = String(Date.now()).slice(-5); // Matricule auto si non fourni

        const record = sanitizeMember({ nom: nom, matricule: matricule, fonction: fonction, grade: grade, posit: posit });
        const existingIdx = crew.findIndex(m => m.matricule === matricule || (m.nom.toLowerCase() === nom.toLowerCase() && nom.length > 2));

        if (existingIdx >= 0) {
            crew[existingIdx] = record;
        } else {
            crew.push(record);
        }
        persist();
        render();
        return record;
    }

    function init() {
        loadLocal();
        render();
        loadServer();

        const fEl = document.getElementById('crew-fonction');
        if (fEl) {
            fEl.addEventListener('change', function() { updateGradeOptions(true); });
            updateGradeOptions(false);
        }
        const sEl = document.getElementById('crew-save');
        if (sEl) sEl.addEventListener('click', save);
        const cEl = document.getElementById('crew-cancel');
        if (cEl) cEl.addEventListener('click', resetForm);

        window.CREW = {
            list: function() { return crew.slice(); },
            reload: function() { loadServer(); },
            add: addMemberDirect
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();