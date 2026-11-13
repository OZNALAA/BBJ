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
        return list.map(m => {
            const rank = m.rank || m.fonction || '';
            const posit = m.posit || m.grade || '';
            return {
                value: m.matricule || m.nom,
                code: m.matricule || '',
                label: (rank ? rank + ' ' : '') + m.nom,
                labelDetail: (rank ? rank + ' ' : '') + m.nom + (posit ? ' · POSIT: ' + posit : ''),
                member: m
            };
        });
    }

    function _crewMatch(it, q) {
        if (!q) return true;
        const words = q.toLowerCase().split(/\s+/);
        const s = (it.value + ' ' + it.code + ' ' + it.label + ' ' + (it.member.posit || it.member.grade || '') + ' ' + (it.member.cin || '')).toLowerCase();
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

    function _formatAirportLabel(code) {
        if (!code) return { code: '—', name: 'Choisir aéroport', hasVal: false };
        let name = code;
        if (window.AIRPORTS) {
            const ap = window.AIRPORTS.find(a => a.i === code || a.a === code);
            if (ap) {
                name = (ap.m || ap.n) ? ((ap.m || ap.n) + (ap.c ? ' (' + ap.c + ')' : '')) : ap.n;
            }
        }
        return { code: code, name: name, hasVal: true };
    }

    function _sectorRow(s, idx) {
        const origInfo = _formatAirportLabel(s.origin);
        const destInfo = _formatAirportLabel(s.dest);

        return '<tr>'
            + '<td class="fl-num"><span class="fl-sectornum">' + (idx + 1) + '</span></td>'
            + '<td><input type="text" class="input-field fl-inp" data-f="flight" value="' + _esc(s.flight) + '" placeholder="Vol"></td>'
            + '<td>'
            + '<div class="fl-airport-select-trigger" data-role="origin" data-value="' + _esc(s.origin || '') + '" title="Cliquer pour rechercher et sélectionner l\'aéroport d\'origine">'
            + '<span class="fl-airport-trigger-code">' + _esc(origInfo.hasVal ? origInfo.code : '🛫') + '</span>'
            + '<span class="fl-airport-trigger-text ' + (origInfo.hasVal ? 'has-val' : 'placeholder') + '">' + _esc(origInfo.hasVal ? origInfo.name : '— Origine —') + '</span>'
            + '<span class="fl-airport-trigger-caret">🔍</span>'
            + '</div>'
            + '</td>'
            + '<td><input type="date" class="input-field fl-inp" data-f="depDate" value="' + _esc(s.depDate) + '"></td>'
            + '<td><input type="time" class="input-field fl-inp" data-f="offBlock" value="' + _esc(s.offBlock) + '"></td>'
            + '<td>'
            + '<div class="fl-airport-select-trigger" data-role="dest" data-value="' + _esc(s.dest || '') + '" title="Cliquer pour rechercher et sélectionner l\'aéroport de destination">'
            + '<span class="fl-airport-trigger-code">' + _esc(destInfo.hasVal ? destInfo.code : '🛬') + '</span>'
            + '<span class="fl-airport-trigger-text ' + (destInfo.hasVal ? 'has-val' : 'placeholder') + '">' + _esc(destInfo.hasVal ? destInfo.name : '— Destination —') + '</span>'
            + '<span class="fl-airport-trigger-caret">🔍</span>'
            + '</div>'
            + '</td>'
            + '<td><input type="date" class="input-field fl-inp" data-f="arrDate" value="' + _esc(s.arrDate) + '"></td>'
            + '<td><input type="time" class="input-field fl-inp" data-f="onBlock" value="' + _esc(s.onBlock) + '"></td>'
            + '<td><input type="time" class="input-field fl-inp" data-f="night" value="' + _esc(s.night) + '"></td>'
            + '<td class="fl-del-col"><button type="button" class="btn btn-danger btn-sm fl-del">✕</button></td>'
            + '</tr>';
    }

    function _crewRow(c, idx) {
        let displayName = c.name || '';
        if (!displayName && c.emp && window.CREW) {
            const m = window.CREW.list().find(x => x.matricule === c.emp);
            if (m) displayName = (m.rank || m.fonction ? (m.rank || m.fonction) + ' ' : '') + m.nom;
        }
        const hasMember = !!displayName;
        const textLabel = hasMember ? displayName : '— Choisir un navigant —';

        return '<tr>'
            + '<td>'
            + '<div class="fl-crew-select-trigger" data-role="name" data-value="' + _esc(c.emp || c.name || '') + '" data-name="' + _esc(displayName) + '" title="Cliquer pour rechercher et sélectionner un membre d\'équipage">'
            + '<span class="fl-crew-trigger-icon">👤</span>'
            + '<span class="fl-crew-trigger-text ' + (hasMember ? 'has-val' : 'placeholder') + '">' + _esc(textLabel) + '</span>'
            + '<span class="fl-crew-trigger-caret">🔍</span>'
            + '</div>'
            + '</td>'
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
        const origTrigger = tr.querySelector('.fl-airport-select-trigger[data-role="origin"]');
        if (origTrigger) {
            origTrigger._getValue = function() { return this.dataset.value || ''; };
            origTrigger.addEventListener('click', function() {
                _openAirportPickerModal(tr, 'origin', 'Origine');
            });
        }

        const destTrigger = tr.querySelector('.fl-airport-select-trigger[data-role="dest"]');
        if (destTrigger) {
            destTrigger._getValue = function() { return this.dataset.value || ''; };
            destTrigger.addEventListener('click', function() {
                _openAirportPickerModal(tr, 'dest', 'Destination');
            });
        }

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

    let _activeCrewRow = null;
    let _crewPickerCurrentFilter = 'all';

    
    /* ---------------- Airport Picker Modal Popup (Universel & Flight Log) ---------------- */

    let _activeAirportRow = null;
    let _activeAirportRole = null; // 'origin' ou 'dest'
    let _activeAirportCallback = null;
    let _airportPickerCurrentFilter = 'all';

    function _initAirportPickerModal() {
        const modal = document.getElementById('fl-airport-picker-modal');
        if (!modal || modal._airportPickerInitDone) return;
        modal._airportPickerInitDone = true;

        const btnClose = document.getElementById('fl-apm-close');
        const searchInp = document.getElementById('fl-apm-search');
        const filterPills = document.querySelectorAll('.fl-apm-pill');

        function closeModal() {
            modal.classList.remove('show');
            _activeAirportRow = null;
            _activeAirportRole = null;
            _activeAirportCallback = null;
        }

        if (btnClose) btnClose.addEventListener('click', closeModal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
        });

        if (searchInp) {
            let debounce = null;
            searchInp.addEventListener('input', function() {
                clearTimeout(debounce);
                debounce = setTimeout(_renderAirportPickerList, 50);
            });
        }

        filterPills.forEach(pill => {
            pill.addEventListener('click', function() {
                filterPills.forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                _airportPickerCurrentFilter = this.dataset.filter || 'all';
                _renderAirportPickerList();
            });
        });
    }

    function _openAirportPickerModal(tr, role, roleLabel) {
        window.openAirportPickerModal({
            tr: tr,
            role: role,
            roleLabel: roleLabel || (role === 'origin' ? 'Origine' : 'Destination'),
            title: roleLabel || (role === 'origin' ? 'Origine' : 'Destination')
        });
    }

    window.openAirportPickerModal = function(options) {
        _initAirportPickerModal();
        const modal = document.getElementById('fl-airport-picker-modal');
        if (!modal) return;

        if (typeof options === 'function') {
            _activeAirportCallback = options;
            _activeAirportRow = null;
            _activeAirportRole = null;
        } else if (options && typeof options === 'object') {
            _activeAirportCallback = options.onSelect || null;
            _activeAirportRow = options.tr || null;
            _activeAirportRole = options.role || null;
        } else {
            _activeAirportCallback = null;
            _activeAirportRow = null;
            _activeAirportRole = null;
        }

        const titleEl = document.getElementById('fl-apm-title');
        if (titleEl) {
            const titleText = (options && (options.title || options.roleLabel)) || 'Sélection Aéroport';
            titleEl.textContent = 'Sélection Aéroport (' + titleText + ')';
        }

        const searchInp = document.getElementById('fl-apm-search');
        if (searchInp) searchInp.value = '';
        _airportPickerCurrentFilter = 'all';
        const pills = document.querySelectorAll('.fl-apm-pill');
        pills.forEach(p => p.classList.toggle('active', p.dataset.filter === 'all'));

        _renderAirportPickerList();
        modal.classList.add('show');
        setTimeout(function() {
            if (searchInp) searchInp.focus();
        }, 120);
    };

    function _renderAirportPickerList() {
        const listEl = document.getElementById('fl-apm-list');
        const emptyEl = document.getElementById('fl-apm-empty');
        const searchInp = document.getElementById('fl-apm-search');
        const modal = document.getElementById('fl-airport-picker-modal');
        if (!listEl) return;

        const rawQ = (searchInp ? searchInp.value : '').trim().toLowerCase();
        const filter = _airportPickerCurrentFilter || 'all';
        const airports = window.AIRPORTS || [];

        // Filtres par région / pays
        const EUROPE_COUNTRIES = ['FR', 'ES', 'PT', 'IT', 'GB', 'DE', 'BE', 'NL', 'CH', 'AT', 'TR', 'GR', 'PL', 'CZ', 'DK', 'SE', 'NO', 'FI', 'IE', 'RU'];
        const AFRICA_COUNTRIES = ['MA', 'SN', 'CI', 'ML', 'GN', 'TN', 'DZ', 'EG', 'MR', 'GA', 'CM', 'CD', 'CG', 'NE', 'BF', 'BJ', 'TG', 'NG', 'AO'];
        const MIDDLE_EAST_COUNTRIES = ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'IL'];

        const queryWords = rawQ.split(/\s+/).filter(Boolean);

        const filtered = airports.filter(ap => {
            const country = (ap.c || '').toUpperCase();
            if (filter === 'MA' && country !== 'MA') return false;
            if (filter === 'EU' && !EUROPE_COUNTRIES.includes(country)) return false;
            if (filter === 'AF' && (!AFRICA_COUNTRIES.includes(country) || country === 'MA')) return false;
            if (filter === 'ME' && !MIDDLE_EAST_COUNTRIES.includes(country)) return false;

            if (!queryWords.length) return true;

            const searchable = ((ap.i || '') + ' ' + (ap.a || '') + ' ' + (ap.n || '') + ' ' + (ap.m || '') + ' ' + (ap.c || '')).toLowerCase();
            return queryWords.every(w => searchable.includes(w));
        });

        // Limite pour fluidité iPad
        const displayed = filtered.slice(0, 100);

        listEl.innerHTML = '';
        if (!displayed.length) {
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }
        if (emptyEl) emptyEl.style.display = 'none';

        displayed.forEach(ap => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'fl-cpm-item';

            const icao = ap.i || '—';
            const iata = ap.a ? ap.a : '—';
            const city = ap.m || ap.n || '—';
            const country = ap.c ? ap.c : '';

            let badgeClass = 'fl-cpm-badge';
            if (country === 'MA') badgeClass += ' cdb'; // badge rouge pour Maroc
            else badgeClass += ' opl'; // badge bleu standard

            itemDiv.innerHTML = '<div class="fl-cpm-item-left">'
                + '<span class="' + badgeClass + '" style="font-weight:800; min-width:54px;">' + _esc(icao) + '</span>'
                + '<div class="fl-cpm-item-info">'
                + '<span class="fl-cpm-item-name">' + _esc(city) + (iata !== '—' ? ' <span style="font-size:11px; opacity:0.75; font-weight:600;">(' + _esc(iata) + ')</span>' : '') + '</span>'
                + '<span class="fl-cpm-item-sub">' + _esc(ap.n || '') + (country ? ' · ' + _esc(country) : '') + '</span>'
                + '</div>'
                + '</div>'
                + '<button type="button" class="btn btn-sm btn-accent fl-cpm-item-btn">Choisir ↵</button>';

            itemDiv.addEventListener('click', function() {
                const cb = _activeAirportCallback;
                const targetRow = _activeAirportRow;
                const role = _activeAirportRole;
                if (modal) modal.classList.remove('show');
                _activeAirportRow = null;
                _activeAirportRole = null;
                _activeAirportCallback = null;

                if (cb) {
                    try { cb(icao, ap); } catch (err) { console.error('Error in airport picker callback:', err); }
                }

                if (targetRow && role) {
                    const trigger = targetRow.querySelector('.fl-airport-select-trigger[data-role="' + role + '"]');
                    if (trigger) {
                        trigger.dataset.value = icao;
                        const codeSpan = trigger.querySelector('.fl-airport-trigger-code');
                        const textSpan = trigger.querySelector('.fl-airport-trigger-text');
                        if (codeSpan) codeSpan.textContent = icao;
                        if (textSpan) {
                            textSpan.textContent = city + (country ? ' (' + country + ')' : '');
                            textSpan.classList.remove('placeholder');
                            textSpan.classList.add('has-val');
                        }
                    }
                    _updateSectorNight(targetRow);
                    _refreshModalStatusAlert();
                }
            });

            listEl.appendChild(itemDiv);
        });
    }

    window.formatAirportLabel = _formatAirportLabel;

function _initCrewPickerModal() {
        const modal = document.getElementById('fl-crew-picker-modal');
        if (!modal || modal._pickerInitDone) return;
        modal._pickerInitDone = true;

        const btnClose = document.getElementById('fl-cpm-close');
        const searchInp = document.getElementById('fl-cpm-search');
        const btnAdd = document.getElementById('fl-cpm-btn-add');
        const btnEmptyAdd = document.getElementById('fl-cpm-empty-add');
        const filterPills = document.querySelectorAll('.fl-cpm-pill');

        function closeModal() {
            modal.classList.remove('show');
            _activeCrewRow = null;
        }

        if (btnClose) btnClose.addEventListener('click', closeModal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
        });

        if (searchInp) {
            searchInp.addEventListener('input', function() {
                _renderCrewPickerList();
            });
        }

        filterPills.forEach(pill => {
            pill.addEventListener('click', function() {
                filterPills.forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                _crewPickerCurrentFilter = this.dataset.filter || 'all';
                _renderCrewPickerList();
            });
        });

        function openAddFromPicker() {
            const typed = (searchInp ? searchInp.value : '').trim();
            const targetRow = _activeCrewRow;
            closeModal();

            if (targetRow) {
                const trigger = targetRow.querySelector('.fl-crew-select-trigger');
                const empInp = targetRow.querySelector('[data-f="emp"]');
                const positInp = targetRow.querySelector('[data-f="posit"]');
                _openCrewAddModal({
                    initialNom: typed,
                    empInp: empInp,
                    positInp: positInp,
                    onSuccess: function(newMember) {
                        if (trigger) {
                            trigger.dataset.value = newMember.matricule || newMember.nom;
                            trigger.dataset.name = newMember.nom;
                            const textSpan = trigger.querySelector('.fl-crew-trigger-text');
                            if (textSpan) {
                                textSpan.textContent = (newMember.rank ? newMember.rank + ' ' : '') + newMember.nom;
                                textSpan.className = 'fl-crew-trigger-text has-val';
                            }
                        }
                        if (empInp) empInp.value = newMember.matricule || '';
                        if (positInp) positInp.value = newMember.grade || newMember.posit || newMember.fonction || '';
                        _refreshModalStatusAlert();
                    }
                });
            } else {
                _openCrewAddModal({ initialNom: typed });
            }
        }

        if (btnAdd) btnAdd.addEventListener('click', openAddFromPicker);
        if (btnEmptyAdd) btnEmptyAdd.addEventListener('click', openAddFromPicker);
    }

    function _renderCrewPickerList() {
        const listEl = document.getElementById('fl-cpm-list');
        const emptyEl = document.getElementById('fl-cpm-empty');
        const searchInp = document.getElementById('fl-cpm-search');
        if (!listEl) return;

        const q = (searchInp ? searchInp.value : '').trim().toLowerCase();
        const filter = _crewPickerCurrentFilter || 'all';
        const allItems = _crewItems();

        const filtered = allItems.filter(it => {
            const m = it.member;
            if (filter !== 'all') {
                const f = (m.fonction || m.rank || '').toUpperCase();
                if (filter === 'CDB' && !f.includes('CDB') && !f.includes('COMMANDANT')) return false;
                if (filter === 'OPL' && !f.includes('OPL') && !f.includes('COPILOTE')) return false;
                if (filter === 'CC' && !f.includes('CC') && !f.includes('CHEF')) return false;
                if (filter === 'PNC' && !f.includes('PNC') && !f.includes('HOTESSE') && !f.includes('STEWARD')) return false;
            }
            if (!q) return true;
            return _crewMatch(it, q);
        });

        listEl.innerHTML = '';
        if (!filtered.length) {
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }
        if (emptyEl) emptyEl.style.display = 'none';

        filtered.forEach(it => {
            const m = it.member;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'fl-cpm-item';

            const fRaw = (m.fonction || m.rank || 'CREW').toUpperCase();
            let badgeCls = 'fl-cpm-badge';
            if (fRaw.includes('CDB')) badgeCls += ' cdb';
            else if (fRaw.includes('OPL')) badgeCls += ' opl';
            else if (fRaw.includes('CC')) badgeCls += ' cc';
            else if (fRaw.includes('PNC')) badgeCls += ' pnc';

            const roleBadge = m.fonction || m.rank || 'CREW';
            const gradeText = m.grade || m.posit || '—';
            const matText = m.matricule ? '#' + m.matricule : '—';

            itemDiv.innerHTML = '<div class="fl-cpm-item-left">'
                + '<span class="' + badgeCls + '">' + _esc(roleBadge) + '</span>'
                + '<div class="fl-cpm-item-info">'
                + '<span class="fl-cpm-item-name">' + _esc(m.nom) + '</span>'
                + '<span class="fl-cpm-item-sub">Matricule: ' + _esc(matText) + ' · Grade/Pos: ' + _esc(gradeText) + '</span>'
                + '</div>'
                + '</div>'
                + '<button type="button" class="btn btn-sm btn-accent fl-cpm-item-btn">Sélectionner</button>';

            itemDiv.addEventListener('click', function() {
                _selectCrewMemberForActiveRow(m);
            });

            listEl.appendChild(itemDiv);
        });
    }

    function _selectCrewMemberForActiveRow(m) {
        if (!_activeCrewRow) return;
        const trigger = _activeCrewRow.querySelector('.fl-crew-select-trigger');
        const empInp = _activeCrewRow.querySelector('[data-f="emp"]');
        const positInp = _activeCrewRow.querySelector('[data-f="posit"]');

        if (trigger) {
            trigger.dataset.value = m.matricule || m.nom;
            trigger.dataset.name = m.nom;
            const textSpan = trigger.querySelector('.fl-crew-trigger-text');
            if (textSpan) {
                textSpan.textContent = (m.rank || m.fonction ? (m.rank || m.fonction) + ' ' : '') + m.nom;
                textSpan.className = 'fl-crew-trigger-text has-val';
            }
        }
        if (empInp) empInp.value = m.matricule || '';
        if (positInp) positInp.value = m.grade || m.posit || m.fonction || '';

        const modal = document.getElementById('fl-crew-picker-modal');
        if (modal) modal.classList.remove('show');
        _activeCrewRow = null;

        _refreshModalStatusAlert();
    }

    function _openCrewPickerModal(tr) {
        _initCrewPickerModal();
        _activeCrewRow = tr;
        const modal = document.getElementById('fl-crew-picker-modal');
        if (!modal) return;

        const searchInp = document.getElementById('fl-cpm-search');
        if (searchInp) searchInp.value = '';
        _crewPickerCurrentFilter = 'all';
        const pills = document.querySelectorAll('.fl-cpm-pill');
        pills.forEach(p => p.classList.toggle('active', p.dataset.filter === 'all'));

        _renderCrewPickerList();
        modal.classList.add('show');
        setTimeout(function() {
            if (searchInp) searchInp.focus();
        }, 120);
    }

    function _initCrewRow(tr, c) {
        const trigger = tr.querySelector('.fl-crew-select-trigger');
        const empInp = tr.querySelector('[data-f="emp"]');
        const positInp = tr.querySelector('[data-f="posit"]');

        if (trigger) {
            trigger._getValue = function() {
                return this.dataset.value || '';
            };

            trigger.addEventListener('click', function() {
                _openCrewPickerModal(tr);
            });
        }

        tr.querySelectorAll('.fl-inp').forEach(inp => {
            inp.addEventListener('input', _refreshModalStatusAlert);
            inp.addEventListener('change', _refreshModalStatusAlert);
        });

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
            const origEl = tr.querySelector('[data-role="origin"]');
            s.origin = origEl ? (origEl._getValue ? origEl._getValue() : (origEl.dataset.value || '')) : '';
            const destEl = tr.querySelector('[data-role="dest"]');
            s.dest = destEl ? (destEl._getValue ? destEl._getValue() : (destEl.dataset.value || '')) : '';
            return s;
        });
        const tb2 = document.getElementById('fl-crew-tbody');
        const crew = Array.from(tb2.querySelectorAll('tr')).map(tr => {
            const c = { name: '', emp: '', posit: '', sectors: '' };
            tr.querySelectorAll('.fl-inp').forEach(inp => { c[inp.dataset.f] = inp.value; });
            const picker = tr.querySelector('[data-role="name"]');
            const v = picker ? (picker._getValue ? picker._getValue() : (picker.dataset.value || '')) : '';
            if (v && !c.name) {
                const m = _crewItems().find(x => x.value === v || x.code === v);
                c.name = m ? m.member.nom : ((picker && picker.dataset.name) ? picker.dataset.name : v);
            }
            if (!c.name && picker && picker.dataset.name) {
                c.name = picker.dataset.name;
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

    function _calcFlightTime(off, on) {
        if (!off || !on) return '—';
        const p1 = String(off).split(':').map(Number);
        const p2 = String(on).split(':').map(Number);
        if (p1.length < 2 || p2.length < 2 || isNaN(p1[0]) || isNaN(p1[1]) || isNaN(p2[0]) || isNaN(p2[1])) return '—';
        let diff = (p2[0] * 60 + p2[1]) - (p1[0] * 60 + p1[1]);
        if (diff < 0) diff += 24 * 60;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }

    function _downloadFile(content, fileName, mimeType) {
        const blob = (content instanceof Blob) ? content : new Blob([content], { type: mimeType });
        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blob, fileName);
            return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            if (a.parentNode) a.parentNode.removeChild(a);
            URL.revokeObjectURL(url);
        }, 1500);
    }

    function exportToExcel(recordsList, titleSuffix) {
        if (!recordsList || !recordsList.length) {
            alert('Aucun rapport à exporter.');
            return;
        }

        // --- 1. Mode Natif XLSX (SheetJS) : Fichier .xlsx officiel reconnu immédiatement par Excel ---
        if (typeof XLSX !== 'undefined') {
            try {
                const wb = XLSX.utils.book_new();

                // 1. Feuille Résumé
                const rows1 = [
                    ['# ID', 'Mois', 'Date sauvegarde', 'Nb Secteurs', 'Équipage', 'Statut']
                ];
                recordsList.forEach(rec => {
                    const status = _checkReportCompleteness(rec);
                    const statusText = status.isIncomplete ? ('Incomplet (' + status.reasons.join(', ') + ')') : 'Complété';
                    const crewNames = (rec.crew || []).map(c => (c.name || '—') + ' (' + (c.posit || '—') + ')').join('; ');
                    const savedDate = rec.savedAt ? new Date(rec.savedAt).toLocaleDateString('fr-FR') : '—';
                    rows1.push([
                        rec.id,
                        rec.month || '—',
                        savedDate,
                        (rec.sectors || []).length,
                        crewNames || '—',
                        statusText
                    ]);
                });
                const ws1 = XLSX.utils.aoa_to_sheet(rows1);
                ws1['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 40 }, { wch: 20 }];
                XLSX.utils.book_append_sheet(wb, ws1, '1. Résumé Vols');

                // 2. Feuille Secteurs
                const rows2 = [
                    ['Mois', 'Secteur #', 'Vol', 'Origine', 'Date Dép.', 'Off-Block', 'Destination', 'Date Arr.', 'On-Block', 'Temps Vol', 'Nuit']
                ];
                recordsList.forEach(rec => {
                    (rec.sectors || []).forEach((s, idx) => {
                        rows2.push([
                            rec.month || '—',
                            idx + 1,
                            s.flight || '—',
                            s.origin || '—',
                            s.depDate || '—',
                            s.offBlock || '—',
                            s.dest || '—',
                            s.arrDate || '—',
                            s.onBlock || '—',
                            _calcFlightTime(s.offBlock, s.onBlock),
                            s.night || '00:00'
                        ]);
                    });
                });
                const ws2 = XLSX.utils.aoa_to_sheet(rows2);
                ws2['!cols'] = [{ wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 10 }];
                XLSX.utils.book_append_sheet(wb, ws2, '2. Détail Secteurs');

                // 3. Feuille Équipage
                const rows3 = [
                    ['Mois', 'Nom & Prénom', 'Matricule', 'Fonction', 'Secteurs Assignés']
                ];
                recordsList.forEach(rec => {
                    (rec.crew || []).forEach(c => {
                        rows3.push([
                            rec.month || '—',
                            c.name || '—',
                            c.emp || '—',
                            c.posit || '—',
                            c.sectors || '—'
                        ]);
                    });
                });
                const ws3 = XLSX.utils.aoa_to_sheet(rows3);
                ws3['!cols'] = [{ wch: 16 }, { wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 20 }];
                XLSX.utils.book_append_sheet(wb, ws3, '3. Équipage & Primes');

                const fileName = 'FlightLog_BBJ_' + (titleSuffix || 'Reports') + '_' + new Date().toISOString().slice(0, 10) + '.xlsx';

                try {
                    XLSX.writeFile(wb, fileName);
                } catch (e) {
                    const u8 = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                    _downloadFile(u8, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                }
                _toast('Export Excel (.xlsx) téléchargé avec succès !');
                return;
            } catch (err) {
                console.warn('Erreur génération XLSX natif, bascule vers CSV :', err);
            }
        }

        // --- 2. Mode Fallback : CSV UTF-8 officiel avec BOM (compatibilité universelle Excel) ---
        let csv = "\uFEFF";
        csv += "ROYAL AIR MAROC - BBJ2 CN-MVI - FLIGHT LOG REPORT\r\n\r\n";
        csv += "1. RESUME DES RAPPORTS DE VOL\r\n";
        csv += "# ID;Mois;Date sauvegarde;Nb Secteurs;Equipage;Statut\r\n";
        recordsList.forEach(rec => {
            const status = _checkReportCompleteness(rec);
            const statusText = status.isIncomplete ? ("Incomplet (" + status.reasons.join(", ") + ")") : "Complété";
            const crewNames = (rec.crew || []).map(c => (c.name || "—") + " (" + (c.posit || "—") + ")").join(" | ");
            const savedDate = rec.savedAt ? new Date(rec.savedAt).toLocaleDateString("fr-FR") : "—";
            csv += [
                rec.id,
                JSON.stringify(rec.month || "—"),
                savedDate,
                (rec.sectors || []).length,
                JSON.stringify(crewNames),
                JSON.stringify(statusText)
            ].join(";") + "\r\n";
        });

        csv += "\r\n2. DETAIL DES SECTEURS DE VOL\r\n";
        csv += "Mois;Secteur #;Vol;Origine;Date Dep.;Off-Block;Destination;Date Arr.;On-Block;Temps Vol;Nuit\r\n";
        recordsList.forEach(rec => {
            (rec.sectors || []).forEach((s, idx) => {
                csv += [
                    JSON.stringify(rec.month || "—"),
                    idx + 1,
                    JSON.stringify(s.flight || "—"),
                    s.origin || "—",
                    s.depDate || "—",
                    s.offBlock || "—",
                    s.dest || "—",
                    s.arrDate || "—",
                    s.onBlock || "—",
                    _calcFlightTime(s.offBlock, s.onBlock),
                    s.night || "00:00"
                ].join(";") + "\r\n";
            });
        });

        csv += "\r\n3. MEMBRES EQUIPAGE & PRIMES\r\n";
        csv += "Mois;Nom & Prenom;Matricule;Fonction;Secteurs Assignes\r\n";
        recordsList.forEach(rec => {
            (rec.crew || []).forEach(c => {
                csv += [
                    JSON.stringify(rec.month || "—"),
                    JSON.stringify(c.name || "—"),
                    c.emp || "—",
                    c.posit || "—",
                    JSON.stringify(c.sectors || "—")
                ].join(";") + "\r\n";
            });
        });

        const csvFileName = 'FlightLog_BBJ_' + (titleSuffix || 'Reports') + '_' + new Date().toISOString().slice(0, 10) + '.csv';
        _downloadFile(csv, csvFileName, 'text/csv;charset=utf-8');
        _toast('Export Excel (.csv) téléchargé avec succès !');
    }

    function exportAllToExcel() {
        const list = _load();
        exportToExcel(list, 'Tous_les_Rapports');
    }

    function exportCurrentToExcel() {
        const cur = collect();
        exportToExcel([cur], (cur.month || 'Rapport').replace(/[^a-zA-Z0-9_-]/g, '_'));
    }

    function printCurrent() {
        const curData = collect();
        const area = document.getElementById('print-area');
        if (!area) return;

        let html = '<div id="fl-print-fix" style="font-family:Arial,sans-serif; color:#000;">'
            + '<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2.5px solid #A51025; padding-bottom:8px; margin-bottom:14px;">'
            + '<div>'
            + '<h1 style="color:#A51025; margin:0; font-size:18px; font-weight:bold;">ROYAL AIR MAROC — BBJ2 CN-MVI</h1>'
            + '<div style="font-size:12px; color:#444; margin-top:3px;">FLIGHT LOG AND PAY CLAIM REPORT — MOIS : <strong>' + _esc(curData.month || '—') + '</strong></div>'
            + '</div>'
            + '<img src="img/flightlog_logo.png" style="height:48px;" alt="Logo">'
            + '</div>';

        // Table Secteurs
        html += '<h3 style="font-size:13px; font-weight:bold; margin:12px 0 6px 0; color:#1E293B;">1. SECTEURS DE VOL</h3>'
            + '<table class="data-table" style="width:100%; border-collapse:collapse; margin-bottom:14px;">'
            + '<thead><tr>'
            + '<th>#</th><th>Vol</th><th>Origine</th><th>Date Dép.</th><th>Off-Block</th><th>Destination</th><th>Date Arr.</th><th>On-Block</th><th>Temps Vol</th><th>Nuit</th>'
            + '</tr></thead><tbody>';

        (curData.sectors || []).forEach((s, idx) => {
            html += '<tr>'
                + '<td style="text-align:center;"><b>' + (idx + 1) + '</b></td>'
                + '<td style="text-align:center;"><b>' + _esc(s.flight || '—') + '</b></td>'
                + '<td style="text-align:center;">' + _esc(s.origin || '—') + '</td>'
                + '<td style="text-align:center;">' + _esc(s.depDate || '—') + '</td>'
                + '<td style="text-align:center;"><b>' + _esc(s.offBlock || '—') + '</b></td>'
                + '<td style="text-align:center;">' + _esc(s.dest || '—') + '</td>'
                + '<td style="text-align:center;">' + _esc(s.arrDate || '—') + '</td>'
                + '<td style="text-align:center;"><b>' + _esc(s.onBlock || '—') + '</b></td>'
                + '<td style="text-align:center;">' + _calcFlightTime(s.offBlock, s.onBlock) + '</td>'
                + '<td style="text-align:center;">' + _esc(s.night || '00:00') + '</td>'
                + '</tr>';
        });
        html += '</tbody></table>';

        // Table Équipage
        html += '<h3 style="font-size:13px; font-weight:bold; margin:12px 0 6px 0; color:#1E293B;">2. MEMBRES D\'ÉQUIPAGE ET PRIMES</h3>'
            + '<table class="data-table" style="width:100%; border-collapse:collapse; margin-bottom:14px;">'
            + '<thead><tr>'
            + '<th>#</th><th>Nom & Prénom</th><th>Matricule</th><th>Fonction / Position</th><th>Secteurs Assignés</th>'
            + '</tr></thead><tbody>';

        (curData.crew || []).forEach((c, idx) => {
            html += '<tr>'
                + '<td style="text-align:center;">' + (idx + 1) + '</td>'
                + '<td><b>' + _esc(c.name || '—') + '</b></td>'
                + '<td style="text-align:center;">' + _esc(c.emp || '—') + '</td>'
                + '<td style="text-align:center;">' + _esc(c.posit || '—') + '</td>'
                + '<td style="text-align:center;">' + _esc(c.sectors || '—') + '</td>'
                + '</tr>';
        });
        html += '</tbody></table>';

        // Pied de page légal et signature
        html += '<div style="margin-top:20px; display:flex; justify-content:space-between; font-size:11px; color:#555; border-top:1px solid #CCC; padding-top:8px;">'
            + '<div>Document certifié EFB — BBJ Load & Balance / Flight Log</div>'
            + '<div>Date: ' + new Date().toLocaleDateString('fr-FR') + ' | Signature Commandant de Bord: _____________________</div>'
            + '</div>';

        html += '</div>';

        area.className = 'fl-print';
        area.innerHTML = html;

        const prevTitle = document.title;
        document.title = 'FlightLog_' + (curData.month || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');

        // iOS Safari & WebKit rendering delay
        setTimeout(function() {
            window.print();
            setTimeout(function() {
                document.title = prevTitle;
            }, 1000);
        }, 180);
    }

    let _initialized = false;
    function init() {
        if (_initialized) return;
        _initialized = true;

        renderList();
        _loadServer();

        const btnNew = document.getElementById('fl-new');
        if (btnNew) btnNew.addEventListener('click', openNew);

        const btnExportExcel = document.getElementById('fl-export-excel');
        if (btnExportExcel) btnExportExcel.addEventListener('click', exportAllToExcel);

        const btnExportExcelCurrent = document.getElementById('fl-export-excel-current');
        if (btnExportExcelCurrent) btnExportExcelCurrent.addEventListener('click', exportCurrentToExcel);

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

        _initAirportPickerModal();
        _initCrewPickerModal();
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

    return { init, openPopup, openNew, save, get: _load, printCurrent, exportAllToExcel, exportCurrentToExcel, createFromWizard };
})();