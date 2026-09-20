/* js/flights.js — Enregistrement des vols avec persistance physique sur disque et affichage historique */

window.FLIGHTS = (() => {
    const KEY = 'bbj_flights';
    const API_URL = '/api/data?file=flights';
    let flightsCache = null;

    function _load() {
        if (flightsCache) return flightsCache;
        try {
            flightsCache = JSON.parse(localStorage.getItem(KEY)) || [];
            return flightsCache;
        } catch {
            flightsCache = [];
            return flightsCache;
        }
    }

    function _loadServer() {
        fetch(API_URL)
            .then(res => res.json())
            .then(res => {
                if (res && res.ok && Array.isArray(res.data)) {
                    flightsCache = res.data;
                    localStorage.setItem(KEY, JSON.stringify(flightsCache));
                    renderHistory();
                    render();
                }
            })
            .catch(() => {});
    }

    function _save(list) {
        flightsCache = list;
        localStorage.setItem(KEY, JSON.stringify(list));
        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-Token': localStorage.getItem('bbj_token') || ''
            },
            body: JSON.stringify({ data: list })
        }).catch(err => {
            console.warn("Écriture serveur hors-ligne (vols conservés en cache local):", err);
        });
    }

    function list() { return _load(); }

    function add(record) {
        const flights = _load().slice();
        record.id = Date.now();
        record.savedAt = new Date().toISOString();
        flights.push(record);
        _save(flights);
        renderHistory();
        render();
        return record.id;
    }

    function remove(id) {
        const updated = _load().filter(f => f.id !== id);
        _save(updated);
        renderHistory();
        render();
    }

    function _num(v, suffix) {
        if (v === null || v === undefined) return '—';
        return Number(v).toLocaleString('en-US') + (suffix || '');
    }

    function _detailRows(f) {
        const res = f.results || {};
        const rows = [
            ['N° Vol', f.flight?.number || '—'],
            ['Date', f.flight?.date || '—'],
            ['Heure (UTC)', f.flight?.time || '—'],
            ['Origin', f.flight?.origin || '—'],
            ['Destination', f.flight?.dest || '—'],
            ['Préparé par', f.flight?.preparedByName || '—'],
            ['Captain', f.flight?.captainName || '—'],
            ['VIP', _num(f.config?.vip)],
            ['Pilots', _num(f.config?.pilots)],
            ['Observateurs', _num(f.config?.observers)],
            ['Cabin Crew', _num(f.config?.cabincrew)],
            ['Staff (Zone B)', _num(f.config?.staff)],
            ['Extra CC (Zone B)', _num(f.config?.extracc)],
            ['Premium PAX (Zone D)', _num(f.config?.premium)],
            ['VIP Lounge (Zone E)', _num(f.config?.vipLounge)],
            ['VIP Office (Zone F)', _num(f.config?.vipOffice)],
            ['VIP Suite (Zone G)', _num(f.config?.vipSuite)],
            ['Block Fuel', _num(f.fuel?.block, ' kg')],
            ['Taxi Fuel', _num(f.fuel?.taxi, ' kg')],
            ['Trip Fuel', _num(f.fuel?.trip, ' kg')],
            ['FWD Hold', _num(f.load?.fwd, ' kg')],
            ['AFT Hold', _num(f.load?.aft, ' kg')],
            ['Other Load Zone B', _num(f.load?.zoneBOther, ' kg')],
            ['Water', _num(f.load?.water, ' US Gal')],
            ['FWD Galley', _num(f.load?.fwdGalley, ' kg')],
            ['Mid Galley', _num(f.load?.midGalley, ' kg')],
            ['DOW', _num(res.dow, ' kg')],
            ['DOI', _num(res.doi)],
            ['PAX + Bagag', _num(res.paxBagWt, ' kg')],
            ['PAX Index', _num(res.paxIdx)],
            ['Cargo', _num(res.cargoWt, ' kg')],
            ['Cargo Index', _num(res.cargoIdx)],
            ['ZFW', _num(res.zfw, ' kg')],
            ['ZFW Index', _num(res.zfwIdx)],
            ['MZFW', _num(res.mzfw, ' kg')],
            ['Take Off Fuel', _num(res.toFuel, ' kg')],
            ['TOF Index', _num(res.toFuelIdx)],
            ['TOW', _num(res.tow, ' kg')],
            ['TOW Index', _num(res.towIdx)],
            ['MTOW', _num(res.mtow, ' kg')],
            ['LAW', _num(res.law, ' kg')],
            ['LAW Index', _num(res.lawIdx)],
            ['MLW', _num(res.mlw, ' kg')],
            ['Ramp WT', _num(res.rampWt, ' kg')],
            ['Underload', _num(res.underload, ' kg')],
            ['Underload (after LMC)', _num(res.underloadAfterLMC, ' kg')]
        ];
        const checks = res.checks || {};
        const checkLabels = {
            zfw: 'ZFW vs MZFW',
            tow: 'TOW vs MTOW',
            law: 'LAW vs MLW',
            ramp: 'Ramp WT vs MRW',
            fuel: 'Block Fuel vs Max Tank',
            fwdCargo: 'FWD Hold <= 2,948 kg',
            aftCargo: 'AFT Hold <= 1,588 kg'
        };
        let checksRow = [];
        for (const k of Object.keys(checkLabels)) {
            if (k in checks) {
                checksRow.push(checkLabels[k] + ' : ' + (checks[k] ? 'OK' : 'PAS OK'));
            }
        }
        if (checksRow.length) rows.push(['Vérifications', checksRow.join('  |  ')]);
        return rows;
    }

    function _esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function renderHistory() {
        const flights = _load().slice().reverse();
        const tbody = document.getElementById('history-tbody');
        const emptyEl = document.getElementById('history-empty');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!flights.length) { if (emptyEl) emptyEl.style.display = ''; return; }
        if (emptyEl) emptyEl.style.display = 'none';

        for (const f of flights) {
            const res = f.results || {};
            const tr = document.createElement('tr');
            tr.className = 'history-row';
            tr.innerHTML =
                '<td><strong>' + _esc(f.flight?.number || '—') + '</strong></td>' +
                '<td>' + _esc(f.flight?.date || '—') + '</td>' +
                '<td>' + _esc(f.flight?.time || '—') + '</td>' +
                '<td>' + _esc((f.flight?.origin || '—') + ' → ' + (f.flight?.dest || '—')) + '</td>' +
                '<td>' + _esc(f.flight?.captainName || '—') + '</td>' +
                '<td>' + _num(res.zfw, ' kg') + '</td>' +
                '<td>' + _num(res.tow, ' kg') + '</td>' +
                '<td>' + _num(res.law, ' kg') + '</td>' +
                '<td><span class="history-toggle">▸ Détails</span></td>';

            const detail = document.createElement('tr');
            detail.className = 'history-detail';
            detail.style.display = 'none';
            const detailTd = document.createElement('td');
            detailTd.colSpan = 9;
            let html = '<div class="history-detail-grid">';
            for (const [k, v] of _detailRows(f)) {
                html += '<div class="hist-item"><span class="hist-label">' + _esc(k) + '</span><span class="hist-value">' + _esc(v) + '</span></div>';
            }
            html += '</div>';
            detailTd.innerHTML = html;
            detail.appendChild(detailTd);

            tr.addEventListener('click', function() {
                const show = detail.style.display === 'none';
                detail.style.display = show ? '' : 'none';
                tr.querySelector('.history-toggle').textContent = show ? '▾ Masquer' : '▸ Détails';
                tr.classList.toggle('open', show);
            });

            tbody.appendChild(tr);
            tbody.appendChild(detail);
        }
    }

    function render() {
        const flights = _load().slice().reverse();
        const tbody  = document.getElementById('flightlog-tbody');
        const emptyEl = document.getElementById('flightlog-empty');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!flights.length) { if (emptyEl) emptyEl.style.display = ''; return; }
        if (emptyEl) emptyEl.style.display = 'none';

        for (const f of flights) {
            const tr = document.createElement('tr');
            const nb = f.results || {};
            tr.innerHTML =
                '<td><strong>' + (f.flight?.number || '—') + '</strong></td>' +
                '<td>' + (f.flight?.date || '—') + '</td>' +
                '<td>' + (f.flight?.time || '—') + '</td>' +
                '<td>' + (f.flight?.origin || '—') + '</td>' +
                '<td>' + (f.flight?.dest || '—') + '</td>' +
                '<td>' + (f.flight?.captainName || '—') + '</td>' +
                '<td>' + (nb.zfw   != null ? Number(nb.zfw).toLocaleString('en-US')   + ' kg' : '—') + '</td>' +
                '<td>' + (nb.tow   != null ? Number(nb.tow).toLocaleString('en-US')   + ' kg' : '—') + '</td>' +
                '<td>' + (nb.law   != null ? Number(nb.law).toLocaleString('en-US')   + ' kg' : '—') + '</td>' +
                '<td><button class="btn btn-danger btn-sm" onclick="window.FLIGHTS.remove(' + f.id + ');">✕</button></td>';
            tbody.appendChild(tr);
        }
    }

    _load();
    _loadServer();

    return { list, add, remove, render, renderHistory };
})();
