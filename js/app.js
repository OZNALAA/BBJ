function formatNum(n) {
    return n.toLocaleString('en-US');
}

function recalcAll() {
    const inputs = {
        vip: document.getElementById('inp-vip').value,
        pilots: document.getElementById('inp-pilots').value,
        observers: document.getElementById('inp-observers').value,
        cabincrew: document.getElementById('inp-cabincrew').value,
        staff: document.getElementById('inp-staff').value,
        extracc: document.getElementById('inp-extracc').value,
        premium: document.getElementById('inp-premium').value,
        vipLounge: document.getElementById('inp-viplounge').value,
        vipOffice: document.getElementById('inp-vipoffice').value,
        vipSuite: document.getElementById('inp-vipsuite').value,
        blockFuel: document.getElementById('inp-blockfuel').value,
        taxiFuel: document.getElementById('inp-taxifuel').value,
        tripFuel: document.getElementById('inp-tripfuel').value,
        fwdHold: document.getElementById('inp-fwdhold').value,
        aftHold: document.getElementById('inp-aftfold').value,
        zoneBOtherLoad: document.getElementById('inp-zonebother').value,
        water: document.getElementById('inp-water').value,
        fwdGalley: document.getElementById('inp-fwdgalley').value,
        midGalley: document.getElementById('inp-midgalley').value
    };

    const r = calculate(inputs);

    document.getElementById('res-dow').textContent = formatNum(r.dow);
    document.getElementById('res-doi').textContent = r.doi.toFixed(2);

    document.getElementById('res-paxbag').textContent = formatNum(r.paxBagWt);
    document.getElementById('res-paxidx').textContent = r.paxIdx.toFixed(2);

    document.getElementById('res-cargo').textContent = formatNum(r.cargoWt);
    document.getElementById('res-cargoidx').textContent = r.cargoIdx.toFixed(2);

    document.getElementById('res-zfw').textContent = formatNum(r.zfw);
    document.getElementById('res-zfwidx').textContent = r.zfwIdx.toFixed(2);
    document.getElementById('res-mzfw').textContent = formatNum(r.mzfw);

    document.getElementById('res-tofuel').textContent = formatNum(r.toFuel);
    document.getElementById('res-tofuelidx').textContent = r.toFuelIdx.toFixed(2);

    document.getElementById('res-tow').textContent = formatNum(r.tow);
    document.getElementById('res-towidx').textContent = r.towIdx.toFixed(2);
    document.getElementById('res-mtow').textContent = formatNum(r.mtow);
    document.getElementById('res-towmac').textContent = r.towMac != null ? r.towMac.toFixed(2) : '—';

    document.getElementById('res-tripfuel').textContent = formatNum(r.tripFuel);

    document.getElementById('res-law').textContent = formatNum(r.law);
    document.getElementById('res-lawidx').textContent = r.lawIdx.toFixed(2);
    document.getElementById('res-mlw').textContent = formatNum(r.mlw);

    const checkZfw = document.getElementById('check-mzf');
    const checkTow = document.getElementById('check-mtow');
    const checkLaw = document.getElementById('check-mlw');
    const checkRamp = document.getElementById('check-mrw');
    const checkFuel = document.getElementById('check-fuel');
    const checkFwdHold = document.getElementById('check-fwdhold');
    const checkAftHold = document.getElementById('check-afthold');

    updateCheck(checkZfw, r.checks.zfw, `ZFW ${formatNum(r.zfw)} vs MZFW ${formatNum(r.mzfw)}`);
    updateCheck(checkTow, r.checks.tow, `TOW ${formatNum(r.tow)} vs MTOW ${formatNum(r.mtow)} (MAC: ${r.towMac ? r.towMac.toFixed(2) + '%' : '—'})`);
    updateCheck(checkLaw, r.checks.law, `LAW ${formatNum(r.law)} vs MLW ${formatNum(r.mlw)}`);
    updateCheck(checkRamp, r.checks.ramp, `Ramp ${formatNum(r.rampWt)} vs MRW ${formatNum(r.mrw)}`);
    let fuelLabel = `Block Fuel ${formatNum(r.blockFuel)} vs Max ${formatNum(r.maxFuel)}`;
    if (r.checks.fuelError) fuelLabel += ` [${r.checks.fuelError}]`;
    updateCheck(checkFuel, r.checks.fuel, fuelLabel);
    updateCheck(checkFwdHold, r.checks.fwdCargo, `FWD Hold ${formatNum(r.fwdHold)} <= 2,948`);
    updateCheck(checkAftHold, r.checks.aftCargo, `AFT Hold ${formatNum(r.aftHold)} <= 1,588`);

    const ulEl = document.getElementById('res-underload');
    ulEl.textContent = formatNum(r.underload);
    ulEl.className = 'underload-value' + (r.underload < 0 ? ' negative' : '');

    document.getElementById('res-underload-lmc').textContent = formatNum(r.underloadAfterLMC);

    if (window.drawTrimSheet) drawTrimSheet(r);
}

window.getFlightData = getFlightData;
window.saveFlight = saveFlight;

function printPanel(panelId) {
    const area = document.getElementById('print-area');
    const target = document.getElementById('panel-' + panelId);
    if (!area || !target) { window.print(); return; }
    area.innerHTML = target.outerHTML;
    area.querySelectorAll('.btn').forEach(b => b.remove());
    window.print();
    area.innerHTML = '';
}

function updateCheck(el, ok, text) {
    const icon = el.querySelector('.check-icon');
    const label = el.querySelector('span:last-child');
    label.textContent = text;
    if (ok) {
        el.className = 'check-item ok';
        icon.textContent = '✓';
    } else {
        el.className = 'check-item danger';
        icon.textContent = '✗';
    }
}

// Initialisation de l'index de recherche rapide en mémoire
function ensureAirportIndex() {
    if (!window.AIRPORTS || window._airportsIndexed) return;
    for (let i = 0; i < window.AIRPORTS.length; i++) {
        const ap = window.AIRPORTS[i];
        ap._s = ((ap.i || '') + ' ' + (ap.a || '') + ' ' + (ap.n || '') + ' ' + (ap.m || '') + ' ' + (ap.c || '')).toLowerCase();
    }
    window._airportsIndexed = true;
}

function airportMatches(ap, q) {
    if (!q) return true;
    const words = q.toLowerCase().split(/\s+/);
    const s = ap._s || ((ap.i || '') + ' ' + (ap.a || '') + ' ' + (ap.n || '') + ' ' + (ap.m || '')).toLowerCase();
    return words.every(w => s.includes(w));
}

function createAirportPicker(pickerEl, selectedIcao, opts) {
    ensureAirportIndex();
    const triggerText = pickerEl.querySelector('.airport-trigger-text');
    const trigger = pickerEl.querySelector('.airport-trigger');
    const search = pickerEl.querySelector('.airport-search');
    const list = pickerEl.querySelector('.airport-list');
    let selected = selectedIcao;
    let debounceTimer = null;
    opts = opts || {};

    pickerEl._getIcao = function() { return selected; };
    pickerEl._getValue = function() { return selected; };

    function itemText(ap) {
        return ap.i + ' \u00b7 ' + ap.n + (ap.m ? ' \u2014 ' + ap.m : '');
    }

    function render() {
        const q = search.value.trim();
        const matches = (window.AIRPORTS || []).filter(ap => airportMatches(ap, q)).slice(0, 80);
        let html = '';
        for (const ap of matches) {
            html += '<div class="airport-item' + (ap.i === selected ? ' selected' : '') + '" data-icao="' + ap.i + '">'
                + '<span class="airport-item-code">' + ap.i + '</span>'
                + '<span class="airport-item-name">' + ap.n + (ap.m ? ' — ' + ap.m : '') + '</span>'
                + '</div>';
        }
        if (!matches.length) html = '<div class="airport-empty">Aucun aéroport trouvé</div>';
        list.innerHTML = html;
    }

    // Délégation d'événement click
    list.addEventListener('click', function(e) {
        const item = e.target.closest('.airport-item');
        if (item && item.dataset.icao) {
            select(item.dataset.icao);
        }
    });

    function select(icao) {
        selected = icao;
        const ap = (window.AIRPORTS || []).find(x => x.i === icao);
        triggerText.textContent = ap ? itemText(ap) : icao;
        close();
        render();
        recalcAll();
        if (opts.onSelect) opts.onSelect(icao, ap);
    }

    function open() {
        pickerEl.classList.add('open');
        search.value = '';
        render();
        search.focus();
    }

    function close() {
        pickerEl.classList.remove('open');
    }

    function toggle() {
        pickerEl.classList.contains('open') ? close() : open();
    }

    trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        toggle();
    });

    search.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(render, 100);
    });

    search.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const first = list.querySelector('.airport-item');
            if (first) select(first.dataset.icao);
        } else if (e.key === 'Escape') {
            close();
        }
    });

    list.addEventListener('mousedown', function(e) { e.preventDefault(); });

    document.addEventListener('click', function(e) {
        if (!pickerEl.contains(e.target)) close();
    });

    select(selectedIcao);
}

function validateTime() {
    const el = document.getElementById('inp-time');
    const err = document.getElementById('inp-time-err');
    const v = el.value;
    let ok = true;
    let msg = '';
    if (/^\d{2}:\d{2}$/.test(v)) {
        const hh = parseInt(v.slice(0, 2), 10);
        const mm = parseInt(v.slice(3, 5), 10);
        if (hh > 23) { ok = false; msg = 'HEURE INVALIDE : plus de 24 h (max 23).'; }
        if (mm > 59) { ok = false; msg = (msg ? msg + ' ' : '') + 'MINUTES INVALIDES : plus de 60 min (max 59).'; }
    } else {
        ok = false;
        msg = 'Format attendu : HH:MM (4 chiffres).';
    }
    if (err) {
        err.textContent = msg;
        err.style.display = ok ? 'none' : 'block';
    }
    el.classList.toggle('input-error', !ok);
    return ok;
}

function toast(msg, ok) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show' + ((ok === false) ? ' error' : '');
    clearTimeout(el._t);
    el._t = setTimeout(function() { el.className = 'toast'; }, 2500);
}

function getFlightData() {
    const time = getFlightTime();
    const prepared = document.getElementById('inp-preparedby').value;
    const captain = document.getElementById('inp-captain').value;
    const crew = window.CREW ? window.CREW.list() : [];

    function crewName(mr) {
        const m = crew.find(x => x.matricule === mr);
        return m ? m.nom : '';
    }

    const orig = document.getElementById('origin-picker');
    const destEl = document.getElementById('dest-picker');
    const r = calculate({
        vip: document.getElementById('inp-vip').value,
        pilots: document.getElementById('inp-pilots').value,
        observers: document.getElementById('inp-observers').value,
        cabincrew: document.getElementById('inp-cabincrew').value,
        staff: document.getElementById('inp-staff').value,
        extracc: document.getElementById('inp-extracc').value,
        premium: document.getElementById('inp-premium').value,
        vipLounge: document.getElementById('inp-viplounge').value,
        vipOffice: document.getElementById('inp-vipoffice').value,
        vipSuite: document.getElementById('inp-vipsuite').value,
        blockFuel: document.getElementById('inp-blockfuel').value,
        taxiFuel: document.getElementById('inp-taxifuel').value,
        tripFuel: document.getElementById('inp-tripfuel').value,
        fwdHold: document.getElementById('inp-fwdhold').value,
        aftHold: document.getElementById('inp-aftfold').value,
        zoneBOtherLoad: document.getElementById('inp-zonebother').value,
        water: document.getElementById('inp-water').value,
        fwdGalley: document.getElementById('inp-fwdgalley').value,
        midGalley: document.getElementById('inp-midgalley').value
    });

    return {
        flight: {
            number: 'MRS' + document.getElementById('inp-flight').value.replace(/\D/g, ''),
            date: document.getElementById('inp-date').value,
            time: time.text,
            origin: orig._getIcao(),
            dest: destEl._getIcao(),
            preparedBy: prepared,
            preparedByName: crewName(prepared),
            captain: captain,
            captainName: crewName(captain)
        },
        config: {
            vip: +document.getElementById('inp-vip').value,
            pilots: +document.getElementById('inp-pilots').value,
            observers: +document.getElementById('inp-observers').value,
            cabincrew: +document.getElementById('inp-cabincrew').value,
            staff: +document.getElementById('inp-staff').value,
            extracc: +document.getElementById('inp-extracc').value,
            premium: +document.getElementById('inp-premium').value,
            vipLounge: +document.getElementById('inp-viplounge').value,
            vipOffice: +document.getElementById('inp-vipoffice').value,
            vipSuite: +document.getElementById('inp-vipsuite').value
        },
        fuel: {
            block: +document.getElementById('inp-blockfuel').value,
            taxi: +document.getElementById('inp-taxifuel').value,
            trip: +document.getElementById('inp-tripfuel').value
        },
        load: {
            fwd: +document.getElementById('inp-fwdhold').value,
            aft: +document.getElementById('inp-aftfold').value,
            zoneBOther: +document.getElementById('inp-zonebother').value,
            water: +document.getElementById('inp-water').value,
            fwdGalley: +document.getElementById('inp-fwdgalley').value,
            midGalley: +document.getElementById('inp-midgalley').value
        },
        results: {
            dow: r.dow, doi: r.doi,
            paxBagWt: r.paxBagWt, paxIdx: r.paxIdx,
            cargoWt: r.cargoWt, cargoIdx: r.cargoIdx,
            zfw: r.zfw, zfwIdx: r.zfwIdx, mzfw: r.mzfw,
            toFuel: r.toFuel, toFuelIdx: r.toFuelIdx,
            tow: r.tow, towIdx: r.towIdx, mtow: r.mtow,
            tripFuel: r.tripFuel,
            law: r.law, lawIdx: r.lawIdx, mlw: r.mlw,
            rampWt: r.rampWt, underload: r.underload, underloadAfterLMC: r.underloadAfterLMC,
            checks: r.checks
        }
    };
}

function saveFlight() {
    const data = getFlightData();
    if (!window.FLIGHTS) { toast('Base indisponible', false); return; }
    window.FLIGHTS.add(data);
    window.FLIGHTS.render();
    window.FLIGHTS.renderHistory();
    toast('Vol enregistré — ' + data.flight.number + ' ' + (data.flight.origin || '') + '→' + (data.flight.dest || ''));
}

function getFlightTime() {
    const el = document.getElementById('inp-time');
    validateTime();
    const m = /^(\d{2}):(\d{2})$/.exec(el.value);
    if (!m) return { valid: false, hh: null, mm: null, text: el.value };
    return { valid: true, hh: parseInt(m[1], 10), mm: parseInt(m[2], 10), text: el.value };
}

function fillCrewSelect(el, members, emptyText) {
    let html = '<option value="">' + (emptyText || '— Aucun —') + '</option>';
    for (const m of members) {
        html += '<option value="' + m.matricule + '">' + m.fonction + ' ' + m.nom + '</option>';
    }
    el.innerHTML = html;
}

function populateCrewFields() {
    if (!window.CREW) return;
    const all = window.CREW.list();
    fillCrewSelect(document.getElementById('inp-preparedby'), all, '— Préparé par —');
    const cdbs = all.filter(m => m.fonction === 'CDB');
    fillCrewSelect(document.getElementById('inp-captain'), cdbs, '— Sélectionner CDB —');
}

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('img-modal');
    const modalImg = document.getElementById('img-modal-photo');
    const closeBtn = document.getElementById('img-modal-close');

    document.querySelectorAll('.header-img').forEach(img => {
        img.addEventListener('click', function() {
            modalImg.src = img.src;
            modal.classList.add('show');
        });
    });

    closeBtn.addEventListener('click', function() {
        modal.classList.remove('show');
    });

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('btn-sidebar-toggle');
    const sidebarCloseBtn = document.getElementById('btn-sidebar-close');

    function closeMobileSidebar() {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
    }

    function toggleMobileSidebar() {
        if (sidebar) {
            sidebar.classList.toggle('open');
            if (overlay) overlay.classList.toggle('show', sidebar.classList.contains('open'));
        }
    }

    if (toggleBtn) toggleBtn.addEventListener('click', toggleMobileSidebar);
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeMobileSidebar);
    if (overlay) overlay.addEventListener('click', closeMobileSidebar);

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            if (this.dataset.panel === 'settings') {
                const isAdmin = window.AUTH && window.AUTH.isAdmin ? window.AUTH.isAdmin() : false;
                if (!isAdmin) {
                    return;
                }
            }
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

            this.classList.add('active');
            const panelId = 'panel-' + this.dataset.panel;
            const pEl = document.getElementById(panelId);
            if (pEl) pEl.classList.add('active');
            if (this.dataset.panel === 'wb') {
                populateCrewFields();
                recalcAll();
            }
            closeMobileSidebar();
        });
    });

    createAirportPicker(document.getElementById('origin-picker'), 'GMME');
    createAirportPicker(document.getElementById('dest-picker'), 'GMME');

    document.getElementById('btn-save-flight').addEventListener('click', saveFlight);

    const btnGotoCrew = document.getElementById('btn-goto-crewcontact');
    if (btnGotoCrew) {
        btnGotoCrew.addEventListener('click', function() {
            const navCrew = document.querySelector('.nav-item[data-panel="crewcontact"]');
            if (navCrew) navCrew.click();
        });
    }

    populateCrewFields();
    recalcAll();
    window.FLIGHTS && window.FLIGHTS.renderHistory();
    window.FLIGHTLOG && window.FLIGHTLOG.init();

    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(recalcAll, 150);
    });
});
