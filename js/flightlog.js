/* js/flightlog.js — FLIGHT LOG AND PAY CLAIM REPORT
   Liste de rapports ; clic sur une ligne → popup avec données complètes.
   Persistance physique en dur + bouton ＋ pour ajout direct en base Crew. */

window.FLIGHTLOG = (() => {
    const KEY = 'bbj_flightlog_records';
    const API_URL = '/api/data?file=flightlog';

    const SAMPLE_RECORD = {
        id: 1726820000000,
        savedAt: new Date().toISOString(),
        month: 'Septembre',
        sectors: [
            { flight: 'VDS', origin: 'GMMN', depDate: '2025-09-01', offBlock: '10:30', dest: 'GMME', arrDate: '2025-09-01', onBlock: '11:15', night: '00:00' },
            { flight: 'VDS', origin: 'GMME', depDate: '2025-09-04', offBlock: '18:00', dest: 'GMMN', arrDate: '2025-09-04', onBlock: '18:45', night: '00:30' }
        ],
        crew: [
            { name: 'ASSELLALOU AHMED', emp: '9202', posit: 'ARA', sectors: '1,2' }
        ]
    };

    let records = null;
    let editingId = null;

    function _load() {
        if (records) return records;
        try {
            const saved = JSON.parse(localStorage.getItem(KEY));
            if (Array.isArray(saved) && saved.length) { records = saved; return records; }
        } catch (e) {}
        records = [SAMPLE_RECORD];
        _persist();
        return records;
    }

    function _loadServer() {
        fetch(API_URL)
            .then(r => r.json())
            .then(res => {
                if (res && res.ok && Array.isArray(res.data) && res.data.length) {
                    records = res.data;
                    localStorage.setItem(KEY, JSON.stringify(records));
                    renderList();
                }
            })
            .catch(() => {});
    }

    function _persist() {
        try { localStorage.setItem(KEY, JSON.stringify(records)); } catch (e) {}
        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-Token': localStorage.getItem('bbj_token') || ''
            },
            body: JSON.stringify({ data: records })
        }).catch(() => {});
    }

    function _esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function _toast(msg, ok) {
        const el = document.getElementById('toast');
        if (!el) return;
        el.textContent = msg;
        el.className = 'toast show' + (ok === false ? ' error' : '');
        clearTimeout(el._t);
        el._t = setTimeout(function() { el.className = 'toast'; }, 2500);
    }

    /* ---------------- Picker générique avec Debounce et Event Delegation ---------------- */

    function _attachPicker(pickerEl, itemsFn, matches, itemText, opts) {
        const triggerText = pickerEl.querySelector('.airport-trigger-text');
        const trigger = pickerEl.querySelector('.airport-trigger');
        const search = pickerEl.querySelector('.airport-search');
        const list = pickerEl.querySelector('.airport-list');
        let selectedVal = opts.initial;
        let debounceTimer = null;

        pickerEl._getValue = function() { return selectedVal; };
        pickerEl._select = select;
        pickerEl._getSearchText = function() { return search ? search.value.trim() : ''; };

        function render() {
            const q = search.value.trim();
            const allItems = itemsFn();
            const items = allItems.filter(x => matches(x, q)).slice(0, 80);
            let html = '';
            for (const it of items) {
                const v = it.value;
                html += '<div class="airport-item' + (v === selectedVal ? ' selected' : '') + '" data-value="' + _esc(v) + '">'
                    + '<span class="airport-item-code">' + _esc(it.code) + '</span>'
                    + '<span class="airport-item-name">' + _esc(it.label) + '</span>'
                    + '</div>';
            }
            if (!items.length) html = '<div class="airport-empty">Aucun résultat</div>';
            list.innerHTML = html;
        }

        // Délégation d'événement click
        list.addEventListener('click', function(e) {
            const itemEl = e.target.closest('.airport-item');
            if (itemEl && itemEl.dataset.value) {
                select(itemEl.dataset.value);
            }
        });

        function select(v) {
            selectedVal = v;
            const it = itemsFn().find(x => x.value === v);
            triggerText.textContent = it ? (it.labelDetail || it.label) : v;
            close();
            render();
            if (opts.onSelect) opts.onSelect(v, it);
        }

        function open() {
            pickerEl.classList.add('open');
            search.value = '';
            render();
            search.focus();
        }
        function close() { pickerEl.classList.remove('open'); }

        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            pickerEl.classList.contains('open') ? close() : open();
        });

        search.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(render, 100);
        });

        search.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const first = list.querySelector('.airport-item');
                if (first) select(first.dataset.value);
            } else if (e.key === 'Escape') close();
        });

        list.addEventListener('mousedown', function(e) { e.preventDefault(); });
        document.addEventListener('click', function(e) {
            if (!pickerEl.contains(e.target)) close();
        });

        if (selectedVal) {
            const it = itemsFn().find(x => x.value === selectedVal);
            if (it) triggerText.textContent = it.labelDetail || it.label;
        }
    }

    function _airportItems() {
        if (!window.AIRPORTS) return [];
        return window.AIRPORTS.map(ap => ({
            value: ap.i,
            code: ap.i,
            label: ap.n + (ap.m ? ' — ' + ap.m : ''),
            labelDetail: ap.i + ' · ' + ap.n + (ap.m ? ' — ' + ap.m : '')
        }));
    }

    function _airportMatch(ap, q) {
        if (!q) return true;
        const words = q.toLowerCase().split(/\s+/);
        const s = (ap.value + ' ' + ap.label).toLowerCase();
        return words.every(w => s.includes(w));
    }

    function _crewItems() {
        const list = window.CREW ? window.CREW.list() : [];
        return list.map(m => ({
            value: m.matricule || m.nom,
            code: m.matricule || '',
            label: (m.fonction ? m.fonction + ' ' : '') + m.nom,
            labelDetail: (m.fonction ? m.fonction + ' ' : '') + m.nom + (m.grade ? ' — ' + m.grade : ''),
            member: m
        }));
    }

    function _crewMatch(it, q) {
        if (!q) return true;
        const words = q.toLowerCase().split(/\s+/);
        const s = (it.value + ' ' + it.code + ' ' + it.label + ' ' + (it.member.grade || '')).toLowerCase();
        return words.every(w => s.includes(w));
    }

    /* ---------------- Règle & Visuel des Vols Non Complétés ---------------- */

    function _checkReportCompleteness(r) {
        const crewList = (r && r.crew && Array.isArray(r.crew)) ? r.crew.filter(c => (c.name && c.name.trim()) || (c.emp && c.emp.trim())) : [];
        const sectors = (r && r.sectors && Array.isArray(r.sectors)) ? r.sectors : [];

        // Règle : vol non complété quand moins de 2 CREW ou on block time est vide
        const isCrewIncomplete = crewList.length < 2;
        const isOnBlockIncomplete = !sectors.length || sectors.some(s => !s.onBlock || !String(s.onBlock).trim());

        const isIncomplete = isCrewIncomplete || isOnBlockIncomplete;
        const reasons = [];
        if (isCrewIncomplete) {
            reasons.push(crewList.length === 0 ? '0 Crew' : '1 seul Crew');
        }
        if (isOnBlockIncomplete) {
            reasons.push('On-Block vide');
        }

        return {
            isIncomplete: isIncomplete,
            badgeHtml: isIncomplete
                ? '<span class="status-badge status-warning" title="' + _esc(reasons.join(' • ')) + '">⚠️ Incomplet (' + _esc(reasons.join(', ')) + ')</span>'
                : '<span class="status-badge status-ok" title="Vol complet (≥ 2 Crew et heure On-Block renseignée)">✓ Complet</span>',
            reasons: reasons,
            rowClass: isIncomplete ? 'flight-incomplete' : 'flight-complete'
        };
    }

    /* ---------------- Rendu liste des rapports ---------------- */

    function renderList() {
        const recs = _load().slice().reverse();
        const tbody = document.getElementById('fl-records-tbody');
        const emptyEl = document.getElementById('fl-records-empty');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!recs.length) { if (emptyEl) emptyEl.style.display = ''; return; }
        if (emptyEl) emptyEl.style.display = 'none';
        for (const r of recs) {
            const tr = document.createElement('tr');
            const status = _checkReportCompleteness(r);
            if (status.rowClass) tr.className = status.rowClass;
            const when = r.savedAt ? new Date(r.savedAt).toLocaleString('fr-FR') : '';
            tr.innerHTML = '<td><strong>' + _esc(r.month) + '</strong></td>'
                + '<td>' + (r.sectors ? r.sectors.length : 0) + '</td>'
                + '<td>' + (r.crew ? r.crew.length : 0) + '</td>'
                + '<td>' + status.badgeHtml + '</td>'
                + '<td>' + _esc(when) + '</td>'
                + '<td><span class="history-toggle">✎ Ouvrir</span> <button type="button" class="btn btn-danger btn-sm fl-del" title="Supprimer">✕</button></td>';
            tr.addEventListener('click', function(e) {
                if (e.target.closest('.fl-del')) return;
                openPopup(r.id);
            });
            tr.querySelector('.fl-del').addEventListener('click', function(e) {
                e.stopPropagation();
                records = records.filter(x => x.id !== r.id);
                _persist();
                renderList();
            });
            tbody.appendChild(tr);
        }
    }

    /* ---------------- Popup (édition) ---------------- */

    function _sectorRow(s, idx) {
        return '<tr>'
            + '<td class="fl-num"><span class="fl-sectornum">' + (idx + 1) + '</span></td>'
            + '<td><input type="text" class="input-field fl-inp" data-f="flight" value="' + _esc(s.flight) + '"></td>'
            + '<td><div class="airport-picker fl-dp" data-role="origin"><div class="airport-trigger"><span class="airport-trigger-text">—</span><span class="airport-caret">▾</span></div><div class="airport-dropdown"><div class="airport-search-wrap"><input type="text" class="airport-search" placeholder="Rechercher aéroport…"></div><div class="airport-list"></div></div></div></td>'
            + '<td><input type="date" class="input-field fl-inp" data-f="depDate" value="' + _esc(s.depDate) + '"></td>'
            + '<td><input type="time" class="input-field fl-inp" data-f="offBlock" value="' + _esc(s.offBlock) + '"></td>'
            + '<td><div class="airport-picker fl-dp" data-role="dest"><div class="airport-trigger"><span class="airport-trigger-text">—</span><span class="airport-caret">▾</span></div><div class="airport-dropdown"><div class="airport-search-wrap"><input type="text" class="airport-search" placeholder="Rechercher aéroport…"></div><div class="airport-list"></div></div></div></td>'
            + '<td><input type="date" class="input-field fl-inp" data-f="arrDate" value="' + _esc(s.arrDate) + '"></td>'
            + '<td><input type="time" class="input-field fl-inp" data-f="onBlock" value="' + _esc(s.onBlock) + '"></td>'
            + '<td><input type="time" class="input-field fl-inp" data-f="night" value="' + _esc(s.night) + '"></td>'
            + '<td class="fl-del-col"><button type="button" class="btn btn-danger btn-sm fl-del">✕</button></td>'
            + '</tr>';
    }

    function _crewRow(c, idx) {
        return '<tr>'
            + '<td><div class="fl-name-cell"><div class="airport-picker fl-cp" data-role="name"><div class="airport-trigger"><span class="airport-trigger-text">—</span><span class="airport-caret">▾</span></div><div class="airport-dropdown"><div class="airport-search-wrap"><input type="text" class="airport-search" placeholder="Rechercher ou taper un nom…"></div><div class="airport-list"></div></div></div>'
            + '<button type="button" class="btn btn-sm fl-add-member" title="Ajouter ce navigant à la base Crew">＋</button></div></td>'
            + '<td><input type="text" inputmode="numeric" class="input-field fl-inp fl-code" data-f="emp" value="' + _esc(c.emp) + '" placeholder="Matricule"></td>'
            + '<td><input type="text" class="input-field fl-inp fl-code" data-f="posit" value="' + _esc(c.posit) + '" placeholder="Grade/Pos"></td>'
            + '<td><input type="text" class="input-field fl-inp" data-f="sectors" value="' + _esc(c.sectors) + '" placeholder="1,2..."></td>'
            + '<td class="fl-del-col"><button type="button" class="btn btn-danger btn-sm fl-del">✕</button></td>'
            + '</tr>';
    }

    function _openModal() {
        document.getElementById('fl-modal').classList.add('show');
    }
    function _closeModal() {
        document.getElementById('fl-modal').classList.remove('show');
        editingId = null;
    }

    /* ---------------- Calcul de la Nuit Aéronautique (Sunset / Sunrise / Civil Twilight) ---------------- */

    function _getAeroTwilight(year, month, day, lat, lon) {
        const rad = Math.PI / 180, deg = 180 / Math.PI;
        const N1 = Math.floor(275 * month / 9), N2 = Math.floor((month + 9) / 12);
        const N3 = (1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3));
        const N = N1 - (N2 * N3) + day - 30;
        const lngHour = lon / 15;
        const zenith = 96; // Crépuscule civil / nuit aéronautique officielle (soleil à 6° sous l'horizon)

        function getUT(isSunset) {
            const t = N + ((isSunset ? 18 : 6) - lngHour) / 24;
            const M = (0.9856 * t) - 3.289;
            let L = M + (1.916 * Math.sin(M * rad)) + (0.020 * Math.sin(2 * M * rad)) + 282.634;
            L = (L % 360 + 360) % 360;
            let RA = deg * Math.atan(0.91764 * Math.tan(L * rad));
            RA = (RA % 360 + 360) % 360;
            const Lq = Math.floor(L / 90) * 90, RAq = Math.floor(RA / 90) * 90;
            RA = (RA + (Lq - RAq)) / 15;
            const sinDec = 0.39782 * Math.sin(L * rad);
            const cosDec = Math.cos(Math.asin(sinDec));
            const cosH = (Math.cos(zenith * rad) - (sinDec * Math.sin(lat * rad))) / (cosDec * Math.cos(lat * rad));
            if (cosH > 1 || cosH < -1) return null;
            let H = isSunset ? deg * Math.acos(cosH) : 360 - deg * Math.acos(cosH);
            H = H / 15;
            const T = H + RA - (0.06571 * t) - 6.622;
            let UT = (T - lngHour) % 24;
            if (UT < 0) UT += 24;
            return UT;
        }

        const sunriseUT = getUT(false);
        const sunsetUT = getUT(true);
        if (sunriseUT == null || sunsetUT == null) return null;
        return { sunriseUT, sunsetUT };
    }

    function _calculateNightTime(depDateStr, offBlockStr, arrDateStr, onBlockStr, originIcao, destIcao) {
        if (!depDateStr || !offBlockStr || !onBlockStr) return null;
        const origin = (window.AIRPORTS || []).find(a => a.i === originIcao);
        const dest = (window.AIRPORTS || []).find(a => a.i === destIcao);
        if (!origin || !dest || origin.lat == null || dest.lat == null) return null;

        const depDateParts = depDateStr.split('-').map(Number);
        const offParts = offBlockStr.split(':').map(Number);
        if (depDateParts.length < 3 || offParts.length < 2) return null;

        const [depY, depM, depD] = depDateParts;
        const [depH, depMin] = offParts;

        let arrDateParts = (arrDateStr || depDateStr).split('-').map(Number);
        const onParts = onBlockStr.split(':').map(Number);
        if (arrDateParts.length < 3 || onParts.length < 2) return null;

        const [arrY, arrM, arrD] = arrDateParts;
        const [arrH, arrMin] = onParts;

        const depDateObj = new Date(Date.UTC(depY, depM - 1, depD, depH, depMin));
        let arrDateObj = new Date(Date.UTC(arrY, arrM - 1, arrD, arrH, arrMin));
        if (arrDateObj <= depDateObj) {
            arrDateObj = new Date(arrDateObj.getTime() + 24 * 3600 * 1000);
        }

        const flightDurationMin = Math.round((arrDateObj - depDateObj) / 60000);
        if (flightDurationMin <= 0) return '00:00';

        const twDep = _getAeroTwilight(depY, depM, depD, origin.lat, origin.lon);
        const twArr = _getAeroTwilight(depY, depM, depD, dest.lat, dest.lon);
        if (!twDep || !twArr) return null;

        const depDawn = new Date(Date.UTC(depY, depM - 1, depD, Math.floor(twDep.sunriseUT), Math.round((twDep.sunriseUT % 1) * 60)));
        const depDusk = new Date(Date.UTC(depY, depM - 1, depD, Math.floor(twDep.sunsetUT), Math.round((twDep.sunsetUT % 1) * 60)));

        const arrDawn = new Date(Date.UTC(depY, depM - 1, depD, Math.floor(twArr.sunriseUT), Math.round((twArr.sunriseUT % 1) * 60)));
        const arrDusk = new Date(Date.UTC(depY, depM - 1, depD, Math.floor(twArr.sunsetUT), Math.round((twArr.sunsetUT % 1) * 60)));

        // Départ de nuit ? (Avant l'aube ou après le crépuscule)
        const isDepNight = (depDateObj < depDawn) || (depDateObj >= depDusk);

        if (isDepNight) {
            // Règle confirmée : si vol de nuit -> aube ou vol tout de nuit => 100% de nuit
            const hh = String(Math.floor(flightDurationMin / 60)).padStart(2, '0');
            const mm = String(flightDurationMin % 60).padStart(2, '0');
            return hh + ':' + mm;
        }

        // Départ de jour : nuit la plus proche entre départ et arrivée (dusk le plus précoce)
        const closestDusk = (arrDusk < depDusk) ? arrDusk : depDusk;

        if (arrDateObj > closestDusk) {
            const nightStart = depDateObj > closestDusk ? depDateObj : closestDusk;
            let nightMin = Math.round((arrDateObj - nightStart) / 60000);
            if (nightMin > flightDurationMin) nightMin = flightDurationMin;
            if (nightMin < 0) nightMin = 0;
            const hh = String(Math.floor(nightMin / 60)).padStart(2, '0');
            const mm = String(nightMin % 60).padStart(2, '0');
            return hh + ':' + mm;
        }

        return '00:00';
    }

    function _updateSectorNight(tr) {
        const depDateInp = tr.querySelector('[data-f="depDate"]');
        const offBlockInp = tr.querySelector('[data-f="offBlock"]');
        const arrDateInp = tr.querySelector('[data-f="arrDate"]');
        const onBlockInp = tr.querySelector('[data-f="onBlock"]');
        const nightInp = tr.querySelector('[data-f="night"]');
        const origPicker = tr.querySelector('[data-role="origin"]');
        const destPicker = tr.querySelector('[data-role="dest"]');

        if (!depDateInp || !offBlockInp || !onBlockInp || !nightInp) return;

        // Pré-remplir arrDate avec depDate si vide
        if (depDateInp.value && arrDateInp && !arrDateInp.value) {
            arrDateInp.value = depDateInp.value;
        }

        const origIcao = origPicker && origPicker._getValue ? origPicker._getValue() : '';
        const destIcao = destPicker && destPicker._getValue ? destPicker._getValue() : '';

        const calc = _calculateNightTime(
            depDateInp.value,
            offBlockInp.value,
            arrDateInp ? arrDateInp.value : '',
            onBlockInp.value,
            origIcao,
            destIcao
        );

        if (calc != null) {
            nightInp.value = calc;
            nightInp.title = 'Calculé automatiquement selon nuit aéronautique UTC (reste modifiable)';
        }
    }

    function _initSectorRow(tr, s) {
        const orig = tr.querySelector('[data-role="origin"]');
        _attachPicker(orig, _airportItems, _airportMatch, null, {
            initial: s.origin,
            onSelect: function() { _updateSectorNight(tr); }
        });
        const dest = tr.querySelector('[data-role="dest"]');
        _attachPicker(dest, _airportItems, _airportMatch, null, {
            initial: s.dest,
            onSelect: function() { _updateSectorNight(tr); }
        });

        // Détection de tout changement d'horaires ou dates pour calcul instantané
        tr.querySelectorAll('[data-f="depDate"], [data-f="offBlock"], [data-f="arrDate"], [data-f="onBlock"]').forEach(inp => {
            inp.addEventListener('input', function() { _updateSectorNight(tr); });
            inp.addEventListener('change', function() { _updateSectorNight(tr); });
        });

        tr.querySelector('.fl-del').addEventListener('click', function() {
            tr.parentNode.removeChild(tr);
            _renumber();
            _refreshModalStatusAlert();
        });

        // Calcul initial si les informations sont disponibles
        if ((!s.night || s.night === '00:00') && s.depDate && s.offBlock && s.onBlock && s.origin && s.dest) {
            _updateSectorNight(tr);
        }
    }

    /* ---------------- Popup Modal Ajout Rapide Membre Crew (Settings Crew Database) ---------------- */

    const CREW_GRADES_MAP = {
        'CDB': ['AAA', 'ARA'],
        'OPL': ['DDA'],
        'CC': ['MRA', 'MMA'],
        'PNC': ['NNA'],
        'Observateur': ['_'],
        'Mécanicien': ['_'],
        'Autre': ['_']
    };

    let _crewAddContext = null;

    function _initCrewAddModal() {
        const modal = document.getElementById('fl-crew-modal');
        if (!modal || modal._initialized) return;
        modal._initialized = true;

        const fSelect = document.getElementById('fl-cm-fonction');
        const gSelect = document.getElementById('fl-cm-grade');
        const btnSave = document.getElementById('fl-cm-save');
        const btnCancel = document.getElementById('fl-cm-cancel');
        const btnClose = document.getElementById('fl-cm-close');
        const errEl = document.getElementById('fl-cm-error');

        function updateGrades() {
            if (!fSelect || !gSelect) return;
            const grades = CREW_GRADES_MAP[fSelect.value] || ['_'];
            gSelect.innerHTML = grades.map(g => `<option value="${g}">${g}</option>`).join('');
        }

        if (fSelect) {
            fSelect.addEventListener('change', updateGrades);
        }

        function close() {
            modal.classList.remove('show');
            _crewAddContext = null;
        }

        if (btnCancel) btnCancel.addEventListener('click', close);
        if (btnClose) btnClose.addEventListener('click', close);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) close();
        });

        if (btnSave) {
            btnSave.addEventListener('click', function() {
                const nomEl = document.getElementById('fl-cm-nom');
                const empEl = document.getElementById('fl-cm-matricule');
                const nom = (nomEl ? nomEl.value : '').trim();
                const matricule = (empEl ? empEl.value : '').trim().replace(/[^0-9]/g, '');
                const fonction = fSelect ? fSelect.value : 'CDB';
                const grade = gSelect ? gSelect.value : 'AAA';

                if (!nom) {
                    if (errEl) { errEl.textContent = 'Veuillez saisir le nom & prénom du navigant.'; errEl.style.display = 'block'; }
                    if (nomEl) nomEl.focus();
                    return;
                }
                if (!matricule) {
                    if (errEl) { errEl.textContent = 'Veuillez renseigner un matricule valide (chiffres).'; errEl.style.display = 'block'; }
                    if (empEl) empEl.focus();
                    return;
                }

                if (window.CREW && window.CREW.add) {
                    const newMember = window.CREW.add(nom, matricule, fonction, grade, grade);
                    if (newMember && _crewAddContext) {
                        const ctx = _crewAddContext;
                        if (ctx.picker && ctx.picker._select) {
                            ctx.picker._select(newMember.matricule || newMember.nom);
                        }
                        if (ctx.empInp) ctx.empInp.value = newMember.matricule;
                        if (ctx.positInp) ctx.positInp.value = newMember.grade || newMember.posit || fonction;
                        _toast(`« ${newMember.nom} » (${fonction} ${grade}) enregistré dans la base Crew et assigné !`);
                        if (typeof ctx.onSuccess === 'function') ctx.onSuccess(newMember);
                    }
                }
                close();
            });
        }
    }

    function _openCrewAddModal(context) {
        _initCrewAddModal();
        const modal = document.getElementById('fl-crew-modal');
        if (!modal) return;

        _crewAddContext = context || {};

        const nomEl = document.getElementById('fl-cm-nom');
        const empEl = document.getElementById('fl-cm-matricule');
        const fSelect = document.getElementById('fl-cm-fonction');
        const gSelect = document.getElementById('fl-cm-grade');
        const errEl = document.getElementById('fl-cm-error');

        if (nomEl) nomEl.value = context.initialNom || '';
        if (empEl) empEl.value = (context.empInp ? context.empInp.value.trim() : '') || '';
        if (fSelect) fSelect.value = 'CDB';
        if (gSelect) {
            const grades = CREW_GRADES_MAP['CDB'] || ['_'];
            gSelect.innerHTML = grades.map(g => `<option value="${g}">${g}</option>`).join('');
        }
        if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }

        modal.classList.add('show');
        setTimeout(function() {
            if (nomEl && !nomEl.value) nomEl.focus();
            else if (empEl && !empEl.value) empEl.focus();
        }, 100);
    }

    function _initCrewRow(tr, c) {
        const picker = tr.querySelector('[data-role="name"]');
        const empInp = tr.querySelector('[data-f="emp"]');
        const positInp = tr.querySelector('[data-f="posit"]');
        const addBtn = tr.querySelector('.fl-add-member');

        _attachPicker(picker, _crewItems, _crewMatch, null, {
            initial: c.emp || c.name || '',
            onSelect: function(v, it) {
                if (it && it.member) {
                    empInp.value = it.member.matricule || '';
                    positInp.value = it.member.grade || it.member.fonction || '';
                }
                _refreshModalStatusAlert();
            }
        });

        tr.querySelectorAll('.fl-inp').forEach(inp => {
            inp.addEventListener('input', _refreshModalStatusAlert);
            inp.addEventListener('change', _refreshModalStatusAlert);
        });

        // Câblage du bouton ＋ : Ouverture du popup modal Settings Crew Database
        if (addBtn) {
            addBtn.addEventListener('click', function() {
                const searchInp = picker.querySelector('.airport-search');
                const triggerSpan = picker.querySelector('.airport-trigger-text');
                let typedName = (searchInp && searchInp.value.trim()) || '';
                if (!typedName && triggerSpan && triggerSpan.textContent !== '—') {
                    typedName = triggerSpan.textContent.trim();
                }

                _openCrewAddModal({
                    initialNom: typedName,
                    empInp: empInp,
                    positInp: positInp,
                    picker: picker,
                    onSuccess: function(newMember) {
                        _refreshModalStatusAlert();
                    }
                });
            });
        }

        tr.querySelector('.fl-del').addEventListener('click', function() {
            tr.parentNode.removeChild(tr);
            _refreshModalStatusAlert();
        });
    }

    function _renumber() {
        const tb = document.getElementById('fl-sectors-tbody');
        tb.querySelectorAll('.fl-sectornum').forEach((el, i) => { el.textContent = i + 1; });
    }

    function _refreshModalStatusAlert() {
        const alertEl = document.getElementById('fl-status-alert');
        if (!alertEl) return;
        const currentData = collect();
        const status = _checkReportCompleteness(currentData);
        if (status.isIncomplete) {
            alertEl.style.display = 'flex';
            alertEl.innerHTML = '<span>⚠️ <strong>Vol non complété</strong> : '
                + _esc(status.reasons.join(' et '))
                + ' (au moins 2 membres d\'équipage et l\'heure On-Block d\'arrivée sont requis pour compléter ce rapport).</span>';
        } else {
            alertEl.style.display = 'none';
        }
    }

    function openPopup(id) {
        const rec = _load().find(x => x.id === id);
        if (!rec) return;
        editingId = id;
        document.getElementById('fl-modal-title').textContent = 'Modifier le rapport — ' + rec.month;
        document.getElementById('fl-month').value = rec.month;

        const tb1 = document.getElementById('fl-sectors-tbody');
        tb1.innerHTML = '';
        rec.sectors.forEach((s, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = _sectorRow(s, i);
            tb1.appendChild(tr);
            _initSectorRow(tr, s);
        });

        const tb2 = document.getElementById('fl-crew-tbody');
        tb2.innerHTML = '';
        rec.crew.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = _crewRow(c);
            tb2.appendChild(tr);
            _initCrewRow(tr, c);
        });

        _refreshModalStatusAlert();
        _openModal();
    }

    function openNew() {
        editingId = null;
        document.getElementById('fl-modal-title').textContent = 'Nouveau rapport';
        document.getElementById('fl-month').value = '';
        const tb1 = document.getElementById('fl-sectors-tbody');
        tb1.innerHTML = '';
        const tr1 = document.createElement('tr');
        tr1.innerHTML = _sectorRow({ flight: '', origin: '', depDate: '', offBlock: '', dest: '', arrDate: '', onBlock: '', night: '' }, 0);
        tb1.appendChild(tr1);
        _initSectorRow(tr1, { origin: '', dest: '' });

        const tb2 = document.getElementById('fl-crew-tbody');
        tb2.innerHTML = '';
        const trCrew = document.createElement('tr');
        trCrew.innerHTML = _crewRow({ name: '', emp: '', posit: '', sectors: '' });
        tb2.appendChild(trCrew);
        _initCrewRow(trCrew, { emp: '', posit: '' });

        _refreshModalStatusAlert();
        _openModal();
    }

    function collect() {
        const month = document.getElementById('fl-month').value;
        const tb1 = document.getElementById('fl-sectors-tbody');
        const sectors = Array.from(tb1.querySelectorAll('tr')).map(tr => {
            const s = { flight: '', origin: '', depDate: '', offBlock: '', dest: '', arrDate: '', onBlock: '', night: '' };
            tr.querySelectorAll('.fl-inp').forEach(inp => { s[inp.dataset.f] = inp.value; });
            s.origin = tr.querySelector('[data-role="origin"]')._getValue() || '';
            s.dest = tr.querySelector('[data-role="dest"]')._getValue() || '';
            return s;
        });
        const tb2 = document.getElementById('fl-crew-tbody');
        const crew = Array.from(tb2.querySelectorAll('tr')).map(tr => {
            const c = { name: '', emp: '', posit: '', sectors: '' };
            tr.querySelectorAll('.fl-inp').forEach(inp => { c[inp.dataset.f] = inp.value; });
            const picker = tr.querySelector('[data-role="name"]');
            const v = picker._getValue();
            if (v && !c.name) {
                const m = _crewItems().find(x => x.value === v);
                c.name = m ? m.member.nom : v;
            }
            return c;
        });
        return { month, sectors, crew };
    }

    function save() {
        const data = collect();
        if (editingId == null) {
            const rec = {
                id: Date.now(),
                savedAt: new Date().toISOString(),
                month: data.month || '—',
                sectors: data.sectors,
                crew: data.crew
            };
            records.push(rec);
        } else {
            const rec = records.find(x => x.id === editingId);
            if (rec) {
                rec.month = data.month || '—';
                rec.sectors = data.sectors;
                rec.crew = data.crew;
            }
        }
        _persist();
        renderList();
        editingId = null;
        _closeModal();
        _toast('Rapport enregistré avec succès !');
    }

    function printCurrent() {
        const form = document.getElementById('fl-form');
        const pickerVals = [];
        form.querySelectorAll('[data-role]').forEach(p => {
            let v = p._getValue ? p._getValue() : '';
            if (p.classList.contains('fl-cp') && v && window.CREW) {
                const m = window.CREW.list().find(x => (x.matricule || x.nom) === v);
                v = m ? m.nom : v;
            }
            pickerVals.push(v);
        });
        const clone = form.cloneNode(true);
        clone.querySelectorAll('.fl-del').forEach(b => b.style.display = 'none');
        clone.querySelectorAll('.fl-add-member').forEach(b => b.style.display = 'none');
        clone.querySelectorAll('input').forEach(inp => {
            const span = document.createElement('span');
            span.className = 'print-cell';
            span.textContent = inp.value;
            inp.replaceWith(span);
        });
        clone.querySelectorAll('[data-role]').forEach((p, i) => {
            const span = document.createElement('span');
            span.className = 'print-cell';
            span.textContent = (pickerVals[i] !== undefined && pickerVals[i] !== '') ? pickerVals[i] : '—';
            p.replaceWith(span);
        });
        clone.querySelectorAll('button').forEach(b => b.style.display = 'none');
        const area = document.getElementById('print-area');
        area.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.id = 'fl-print-fix';
        wrap.appendChild(clone);
        area.appendChild(wrap);
        const prevTitle = document.title;
        document.title = 'BBJ Flight Log Report';
        window.print();
        document.title = prevTitle;
        area.innerHTML = '';
    }

    let _initialized = false;
    function init() {
        if (_initialized) return;
        _initialized = true;

        renderList();
        _loadServer();

        const btnNew = document.getElementById('fl-new');
        if (btnNew) btnNew.addEventListener('click', openNew);

        const btnClose = document.getElementById('fl-modal-close');
        if (btnClose) btnClose.addEventListener('click', _closeModal);

        const btnCancel = document.getElementById('fl-cancel');
        if (btnCancel) btnCancel.addEventListener('click', _closeModal);

        const btnSave = document.getElementById('fl-save');
        if (btnSave) btnSave.addEventListener('click', save);

        const btnPrint = document.getElementById('fl-print');
        if (btnPrint) btnPrint.addEventListener('click', printCurrent);

        const modal = document.getElementById('fl-modal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) _closeModal();
            });
        }

        const btnAddSector = document.getElementById('fl-add-sector');
        if (btnAddSector) {
            btnAddSector.addEventListener('click', function() {
                const tb1 = document.getElementById('fl-sectors-tbody');
                if (!tb1) return;
                const tr = document.createElement('tr');
                tr.innerHTML = _sectorRow({ flight: '', origin: '', depDate: '', offBlock: '', dest: '', arrDate: '', onBlock: '', night: '' }, tb1.children.length);
                tb1.appendChild(tr);
                _initSectorRow(tr, { origin: '', dest: '' });
            });
        }

        const btnAddCrew = document.getElementById('fl-add-crew');
        if (btnAddCrew) {
            btnAddCrew.addEventListener('click', function() {
                const tb2 = document.getElementById('fl-crew-tbody');
                if (!tb2) return;
                const tr = document.createElement('tr');
                tr.innerHTML = _crewRow({ name: '', emp: '', posit: '', sectors: '' });
                tb2.appendChild(tr);
                _initCrewRow(tr, { emp: '', posit: '' });
            });
        }

        _initCrewAddModal();
    }

    function createFromWizard(wz) {
        if (!records) _load();

        const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        let monthStr = '—';
        if (wz && wz.date) {
            const parts = wz.date.split('-').map(Number);
            if (parts.length === 3 && parts[1] >= 1 && parts[1] <= 12) {
                monthStr = MONTHS_FR[parts[1] - 1] + ' ' + parts[0];
            }
        }

        const sector = {
            flight: (wz && wz.flightNumber) || 'MRS',
            origin: (wz && wz.origin) || '',
            depDate: (wz && wz.date) || '',
            offBlock: (wz && wz.time) || '',
            dest: (wz && wz.dest) || '',
            arrDate: (wz && wz.date) || '',
            onBlock: '',
            night: '00:00'
        };

        const crewList = [];
        if (wz && (wz.captainName || wz.captainMatricule)) {
            crewList.push({
                name: wz.captainName || '',
                emp: wz.captainMatricule || '',
                posit: wz.captainPosit || 'CDB',
                sectors: '1'
            });
        }
        if (wz && (wz.preparedByName || wz.preparedByMatricule)) {
            if (!wz.captainMatricule || wz.preparedByMatricule !== wz.captainMatricule) {
                crewList.push({
                    name: wz.preparedByName || '',
                    emp: wz.preparedByMatricule || '',
                    posit: wz.preparedByPosit || 'OPL',
                    sectors: '1'
                });
            }
        }

        const recId = Date.now();
        const newRecord = {
            id: recId,
            savedAt: new Date().toISOString(),
            month: monthStr,
            sectors: [sector],
            crew: crewList
        };

        records.push(newRecord);
        _persist();
        renderList();
        return recId;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { init, openPopup, openNew, save, get: _load, printCurrent, createFromWizard };
})();