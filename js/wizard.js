/* js/wizard.js — Parcours "New W&B Calculation". */
window.BBJ_WIZARD = (() => {
    let current = 0;
    let correctedDow = 48950;
    let correctedDoi = 39.72;
    let perfLimit = 0;
    let envelopeFilter = null;
    let blockFuelState = 0;
    let taxiFuelState = 200;
    let azfwState = 49772;
    let payloadState = 822;

    const wzState = {
        observers: 1, cabincrew: 2, extracc: 2,
        staff: 8, premium: 0, viplounge: 0, vipoffice: 0,
        perftow: 79015, perfldg: 66360, perfzwf: 62731,
        load: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0 },
        fwdhold: 150, afthold: 0, tripfuel: 8200
    };

    function domGet(id) {
        let el = document.getElementById(id);
        if (el) return el;
        for (const k in stepCache) {
            const root = stepCache[k];
            if (root && root.querySelector) {
                try { el = root.querySelector('#' + id); } catch (e) { el = null; }
                if (el) return el;
            }
        }
        return null;
    }

    function syncState() {
        const intMap = {
            'wz-observers': 'observers', 'wz-cabincrew': 'cabincrew', 'wz-extracc': 'extracc',
            'wz-staff': 'staff', 'wz-premium': 'premium', 'wz-viplounge': 'viplounge', 'wz-vipoffice': 'vipoffice',
            'wz-perf-tow': 'perftow', 'wz-perf-ldg': 'perfldg', 'wz-perf-zfw': 'perfzwf',
            'wz-fwdhold': 'fwdhold', 'wz-afthold': 'afthold', 'wz-tripfuel': 'tripfuel'
        };
        for (const id in intMap) {
            const el = domGet(id);
            if (el) wzState[intMap[id]] = parseInt(el.value, 10) || 0;
        }
        ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(function(z) {
            const el = domGet('wz-load-' + z.toLowerCase());
            if (el) wzState.load[z] = parseInt(el.value, 10) || 0;
        });
        const bf = domGet('wz-blockfuel');
        if (bf) blockFuelState = parseInt(bf.value, 10) || 0;
        const tx = domGet('wz-taxifuel');
        if (tx) taxiFuelState = parseInt(tx.value, 10) || 0;
        updateTelemetryStrip();
    }

    function updateTelemetryStrip() {
        const dowEl = document.getElementById('wz-strip-dow');
        const payEl = document.getElementById('wz-strip-payload');
        const zfwEl = document.getElementById('wz-strip-zfw');
        const fuelEl = document.getElementById('wz-strip-fuel');
        const towEl = document.getElementById('wz-strip-tow');
        if (dowEl) dowEl.textContent = (correctedDow || 48950).toLocaleString() + ' kg';
        if (payEl) payEl.textContent = (payloadState || 822).toLocaleString() + ' kg';
        if (zfwEl) zfwEl.textContent = (azfwState || 49772).toLocaleString() + ' kg';
        if (fuelEl) fuelEl.textContent = (blockFuelState || 18000).toLocaleString() + ' kg';
        const estTow = (azfwState || 49772) + (blockFuelState || 18000) - (taxiFuelState || 200);
        if (towEl) towEl.textContent = estTow.toLocaleString() + ' kg';
    }

    function pickerHTML(id) {
        return '<div class="airport-picker" id="' + id + '">'
            + '<div class="airport-trigger"><span class="airport-trigger-text">—</span><span class="airport-caret">▾</span></div>'
            + '<div class="airport-dropdown">'
            + '<div class="airport-search-wrap"><input type="text" class="airport-search" placeholder="Rechercher aéroport…"></div>'
            + '<div class="airport-list"></div>'
            + '</div></div>';
    }

    function renderFlightInfo() {
        return '<div class="wizard-section">'
            + '<h2 class="section-title">Flight Information</h2>'
            + '<div class="form-grid">'
            + '<div class="form-group"><label>Origin</label>' + pickerHTML('wz-origin-picker') + '</div>'
            + '<div class="form-group"><label>Destination</label>' + pickerHTML('wz-dest-picker') + '</div>'
            + '<div class="form-group"><label>Flight Number</label>'
            + '<div class="flight-field"><span class="flight-prefix">MRS</span>'
            + '<input type="text" id="wz-flight" value="0603" inputmode="numeric" pattern="[0-9]*" class="input-field">'
            + '</div></div>'
            + '<div class="form-group"><label>Date</label>'
            + '<input type="date" id="wz-date" value="2023-10-19" class="input-field"></div>'
            + '<div class="form-group"><label>Time (UTC)</label>'
            + '<input type="time" id="wz-time" value="10:30" class="input-field"></div>'
            + '<div class="form-group"><label>Prepared by</label>'
            + '<select id="wz-preparedby" class="input-field"></select></div>'
            + '<div class="form-group"><label>Captain</label>'
            + '<select id="wz-captain" class="input-field"></select></div>'
            + '</div></div>';
    }

    function initFlightInfo() {
        if (window.createAirportPicker) {
            createAirportPicker(document.getElementById('wz-origin-picker'), 'GMME');
            createAirportPicker(document.getElementById('wz-dest-picker'), 'GMME');
        }
        if (window.fillCrewSelect && window.CREW) {
            const all = window.CREW.list();
            const pilots = all.filter(function(m) {
                const r = (m.rank || m.fonction || '').toUpperCase();
                return r === 'CDB' || r === 'OPL';
            });
            const cdbs = all.filter(function(m) {
                return (m.rank || m.fonction || '').toUpperCase() === 'CDB';
            });
            fillCrewSelect(document.getElementById('wz-preparedby'), pilots, '— Préparé par —');
            fillCrewSelect(document.getElementById('wz-captain'), cdbs, '— Sélectionner CDB —');
        }
        const flightEl = document.getElementById('wz-flight');
        if (flightEl) {
            flightEl.addEventListener('input', function() {
                flightEl.value = flightEl.value.replace(/\D/g, '');
            });
        }
    }

    function selectField(id, label, max, def) {
        let opts = '';
        for (let i = 0; i <= max; i++) {
            opts += '<option value="' + i + '"' + (i === def ? ' selected' : '') + '>' + i + '</option>';
        }
        return '<div class="form-group"><label>' + label + '</label>'
            + '<select id="' + id + '" class="input-field">' + opts + '</select></div>';
    }

    /* ===== STEP 2: Cockpit & Crew Schematic ===== */
    function renderCockpitSVG() {
        const obs = wzState.observers || 0;
        const bcc = wzState.cabincrew !== undefined ? wzState.cabincrew : 2;
        const xcc = wzState.extracc || 0;
        const stf = wzState.staff || 0;
        return '<div class="efb-cockpit-schematic">'
            + '<div class="efb-cockpit-svg-wrap">'
            + '<svg viewBox="0 0 600 220" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:auto;">'
            + '<path d="M 60 110 C 65 65, 160 45, 300 45 C 440 45, 535 65, 540 110 C 535 155, 440 175, 300 175 C 160 175, 65 155, 60 110 Z" stroke="#334155" stroke-width="2.5" fill="#141A22"/>'
            + '<path d="M 85 96 L 120 86 L 140 99 L 100 106 Z" fill="#38BDF8" fill-opacity="0.3" stroke="#38BDF8" stroke-width="1.2"/>'
            + '<path d="M 85 124 L 120 134 L 140 121 L 100 114 Z" fill="#38BDF8" fill-opacity="0.3" stroke="#38BDF8" stroke-width="1.2"/>'
            + '<path d="M 125 85 L 175 83 L 180 97 L 144 98 Z" fill="#38BDF8" fill-opacity="0.2" stroke="#38BDF8" stroke-width="1"/>'
            + '<path d="M 125 135 L 175 137 L 180 123 L 144 122 Z" fill="#38BDF8" fill-opacity="0.2" stroke="#38BDF8" stroke-width="1"/>'
            // Pilot Captain (Left)
            + '<g id="cockpit-seat-capt">'
            + '<rect x="180" y="70" width="34" height="34" rx="6" fill="#1E293B" stroke="#00E5A3" stroke-width="2"/>'
            + '<circle cx="197" cy="87" r="9" fill="#00E5A3"/>'
            + '<text x="197" y="115" fill="#94A3B8" font-family="JetBrains Mono" font-size="9" font-weight="bold" text-anchor="middle">CAPT</text>'
            + '</g>'
            // Pilot First Officer (Right)
            + '<g id="cockpit-seat-fo">'
            + '<rect x="180" y="116" width="34" height="34" rx="6" fill="#1E293B" stroke="#00E5A3" stroke-width="2"/>'
            + '<circle cx="197" cy="133" r="9" fill="#00E5A3"/>'
            + '<text x="197" y="161" fill="#94A3B8" font-family="JetBrains Mono" font-size="9" font-weight="bold" text-anchor="middle">F/O</text>'
            + '</g>'
            // Center Pedestal
            + '<rect x="175" y="106" width="40" height="8" rx="2" fill="#334155" stroke="#475569"/>'
            // Jumpseat 1 (Observer 1)
            + '<g id="cockpit-seat-obs1" class="cockpit-observer-seat' + (obs >= 1 ? ' active-seat' : ' hidden-seat') + '">'
            + '<rect x="235" y="68" width="28" height="28" rx="5" fill="#1E293B" stroke="#38BDF8" stroke-width="1.8"/>'
            + '<circle cx="249" cy="82" r="7" fill="#38BDF8"/>'
            + '<text x="249" y="107" fill="#38BDF8" font-family="JetBrains Mono" font-size="8" font-weight="bold" text-anchor="middle">OBS 1</text>'
            + '</g>'
            // Jumpseat 2 (Observer 2)
            + '<g id="cockpit-seat-obs2" class="cockpit-observer-seat' + (obs >= 2 ? ' active-seat' : ' hidden-seat') + '">'
            + '<rect x="235" y="124" width="28" height="28" rx="5" fill="#1E293B" stroke="#38BDF8" stroke-width="1.8"/>'
            + '<circle cx="249" cy="138" r="7" fill="#38BDF8"/>'
            + '<text x="249" y="163" fill="#38BDF8" font-family="JetBrains Mono" font-size="8" font-weight="bold" text-anchor="middle">OBS 2</text>'
            + '</g>'
            // Cockpit Partition
            + '<line x1="285" y1="55" x2="285" y2="165" stroke="#64748B" stroke-width="2" stroke-dasharray="3 3"/>'
            // Cabin Crew Base Jumpseats (Follows Base Cabin Crew selection)
            + '<g id="cockpit-crew-base">'
            + '<g id="cockpit-seat-cc1" class="cockpit-cc-seat' + (bcc >= 1 ? ' active-seat' : ' hidden-seat') + '">'
            + '<rect x="296" y="68" width="26" height="26" rx="5" fill="#1E293B" stroke="#F59E0B" stroke-width="1.8"/>'
            + '<circle cx="309" cy="81" r="6" fill="#F59E0B"/>'
            + '<text x="309" y="104" fill="#F59E0B" font-family="JetBrains Mono" font-size="8" font-weight="bold" text-anchor="middle">CC 1</text>'
            + '</g>'
            + '<g id="cockpit-seat-cc2" class="cockpit-cc-seat' + (bcc >= 2 ? ' active-seat' : ' hidden-seat') + '">'
            + '<rect x="296" y="124" width="26" height="26" rx="5" fill="#1E293B" stroke="#F59E0B" stroke-width="1.8"/>'
            + '<circle cx="309" cy="137" r="6" fill="#F59E0B"/>'
            + '<text x="309" y="160" fill="#F59E0B" font-family="JetBrains Mono" font-size="8" font-weight="bold" text-anchor="middle">CC 2</text>'
            + '</g>'
            + '<g id="cockpit-seat-cc3" class="cockpit-cc-seat' + (bcc >= 3 ? ' active-seat' : ' hidden-seat') + '">'
            + '<rect x="328" y="68" width="26" height="26" rx="5" fill="#1E293B" stroke="#F59E0B" stroke-width="1.8"/>'
            + '<circle cx="341" cy="81" r="6" fill="#F59E0B"/>'
            + '<text x="341" y="104" fill="#F59E0B" font-family="JetBrains Mono" font-size="8" font-weight="bold" text-anchor="middle">CC 3</text>'
            + '</g>'
            + '<g id="cockpit-seat-cc4" class="cockpit-cc-seat' + (bcc >= 4 ? ' active-seat' : ' hidden-seat') + '">'
            + '<rect x="328" y="124" width="26" height="26" rx="5" fill="#1E293B" stroke="#F59E0B" stroke-width="1.8"/>'
            + '<circle cx="341" cy="137" r="6" fill="#F59E0B"/>'
            + '<text x="341" y="160" fill="#F59E0B" font-family="JetBrains Mono" font-size="8" font-weight="bold" text-anchor="middle">CC 4</text>'
            + '</g>'
            + '</g>'
            // Zone B Preview & Extra CC
            + '<g id="cockpit-zoneb-preview">'
            + '<rect x="365" y="60" width="155" height="100" rx="8" fill="#0F172A" stroke="#475569" stroke-width="1.2"/>'
            + '<text x="442" y="76" fill="#94A3B8" font-family="Chakra Petch" font-size="10" font-weight="bold" text-anchor="middle">ZONE B — STAFF &amp; EXTRA CC</text>'
            + '<text x="442" y="105" fill="#F59E0B" font-family="JetBrains Mono" font-size="11" font-weight="bold" text-anchor="middle" id="cockpit-extracc-tag">Extra CC in Zone B: ' + xcc + '</text>'
            + '<text x="442" y="125" fill="#38BDF8" font-family="JetBrains Mono" font-size="10" font-weight="bold" text-anchor="middle" id="cockpit-staff-tag">Staff: ' + stf + ' / ' + (16 - xcc) + ' max</text>'
            + '<text x="442" y="145" fill="#64748B" font-family="JetBrains Mono" font-size="9" text-anchor="middle">Capacité: 16 Sièges Max</text>'
            + '</g>'
            + '</svg></div></div>';
    }

    function renderConfig() {
        return '<div class="wizard-section">'
            + '<h2 class="section-title">Cockpit Crew &amp; Flight Deck Configuration</h2>'
            + renderCockpitSVG()
            + '<div class="form-grid">'
            + selectField('wz-observers', 'Observers (Jumpseats)', 2, wzState.observers !== undefined ? wzState.observers : 1)
            + selectField('wz-cabincrew', 'Base Cabin Crew', 4, wzState.cabincrew !== undefined ? wzState.cabincrew : 2)
            + selectField('wz-extracc', 'Extra CC in Zone B (Max 4)', 4, wzState.extracc !== undefined ? wzState.extracc : 2)
            + '</div>'
            + '<div class="form-grid" style="margin-top:16px;">'
            + '<div class="form-group"><label>Corrected DOW (kg)</label>'
            + '<input type="text" id="wz-corrected-dow" class="input-field readonly-field" readonly></div>'
            + '<div class="form-group"><label>Corrected DOI</label>'
            + '<input type="text" id="wz-corrected-doi" class="input-field readonly-field" readonly></div>'
            + '</div></div>';
    }

    function updateCorrected() {
        const dowEl = document.getElementById('wz-corrected-dow');
        const doiEl = document.getElementById('wz-corrected-doi');
        if (!dowEl || !doiEl || typeof BBJ_DATA === 'undefined') return;
        const observers = wizardNum('wz-observers');
        const cabincrew = wizardNum('wz-cabincrew');
        const extracc = wizardNum('wz-extracc');
        const w = BBJ_DATA.crew.observer.wt;
        const paxS = BBJ_DATA.paxIndex;
        const sIdx = function(n) { const e = paxS[Math.max(0, Math.min(n, 16))]; return e ? e.S : 0; };
        const dow = 48704 + observers * w + (cabincrew - 2) * w + extracc * w;
        const ccAdj = (2 - cabincrew) * (2.451 / 2);
        const obsIdx = [0, -1.336, -1.336 - 1.332];
        const doi = 42.72 + obsIdx[Math.max(0, Math.min(observers, 2))] + ccAdj;
        correctedDow = dow;
        correctedDoi = doi;
        azfwState = correctedDow + payloadState;
        dowEl.value = String(dow);
        doiEl.value = doi.toFixed(2);
        updateTelemetryStrip();
    }

    function updateCockpitObserversVisual() {
        const obs = wizardNum('wz-observers');
        const obs1 = document.getElementById('cockpit-seat-obs1');
        const obs2 = document.getElementById('cockpit-seat-obs2');
        if (obs1) {
            obs1.className.baseVal = 'cockpit-observer-seat ' + (obs >= 1 ? 'active-seat' : 'hidden-seat');
        }
        if (obs2) {
            obs2.className.baseVal = 'cockpit-observer-seat ' + (obs >= 2 ? 'active-seat' : 'hidden-seat');
        }
    }

    function updateCockpitCCVisual() {
        const bcc = wzState.cabincrew !== undefined ? wzState.cabincrew : 2;
        for (let i = 1; i <= 4; i++) {
            const el = document.getElementById('cockpit-seat-cc' + i);
            if (el) {
                el.className.baseVal = 'cockpit-cc-seat ' + (bcc >= i ? 'active-seat' : 'hidden-seat');
            }
        }
    }

    function updateStaffOptions(max) {
        const staffEl = domGet('wz-staff');
        const currentVal = Math.min(wzState.staff, max);
        wzState.staff = currentVal;
        if (staffEl) {
            let opts = '';
            for (let i = 0; i <= max; i++) {
                opts += '<option value="' + i + '"' + (i === currentVal ? ' selected' : '') + '>' + i + '</option>';
            }
            staffEl.innerHTML = opts;
            staffEl.value = String(currentVal);
        }
        const occEl = document.getElementById('wz-zoneb-occ-txt');
        if (occEl) {
            occEl.textContent = (wzState.staff + wzState.extracc) + ' / 16 max (Staff: ' + wzState.staff + ', Extra CC: ' + wzState.extracc + ')';
        }
        const staffTag = document.getElementById('cockpit-staff-tag');
        if (staffTag) {
            staffTag.textContent = 'Staff: ' + wzState.staff + ' / ' + max + ' max';
        }
        const xccBadge = document.getElementById('wz-zoneb-extracc-badge');
        if (xccBadge) {
            xccBadge.textContent = String(wzState.extracc);
        }
        const xccTag = document.getElementById('cockpit-extracc-tag');
        if (xccTag) {
            xccTag.textContent = 'Extra CC in Zone B: ' + wzState.extracc;
        }
        updateCabinLopaSeats();
    }

    function initConfig() {
        updateCorrected();
        updateCockpitObserversVisual();
        updateCockpitCCVisual();
        const obsEl = document.getElementById('wz-observers');
        if (obsEl) {
            obsEl.addEventListener('change', function() {
                wzState.observers = parseInt(this.value, 10) || 0;
                updateCockpitObserversVisual();
                updateCorrected();
            });
        }
        const ccEl = document.getElementById('wz-cabincrew');
        if (ccEl) {
            ccEl.addEventListener('change', function() {
                const val = parseInt(this.value, 10);
                wzState.cabincrew = isNaN(val) ? 2 : val;
                updateCockpitCCVisual();
                updateCorrected();
            });
        }
        const xccEl = document.getElementById('wz-extracc');
        if (xccEl) {
            xccEl.addEventListener('change', function() {
                const xcc = parseInt(this.value, 10) || 0;
                wzState.extracc = xcc;
                const maxStaff = Math.max(0, 16 - xcc);
                if (wzState.staff > maxStaff) wzState.staff = maxStaff;
                updateStaffOptions(maxStaff);
                updateCorrected();
                updatePayload();
            });
        }
    }

    /* ===== STEP 4: Cabin LOPA with Zone Boxes & 2 Cargo Holds ===== */
    function renderCabinLopaSVG() {
        return '<div class="efb-lopa-container">'
            + '<div class="efb-lopa-svg-wrap">'
            + '<svg viewBox="0 0 920 220" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:auto;">'
            // Outer Fuselage Outline
            + '<path d="M 45 110 C 50 60, 120 40, 220 40 L 780 40 C 850 40, 890 60, 905 110 C 890 160, 850 180, 780 180 L 220 180 C 120 180, 50 160, 45 110 Z" stroke="#475569" stroke-width="2.5" fill="#0C1017"/>'
            // Nose Cone & Cockpit
            + '<path d="M 50 110 C 52 80, 75 60, 105 55 L 105 165 C 75 160, 52 140, 50 110 Z" fill="#1E293B" stroke="#334155"/>'
            + '<text x="80" y="113" fill="#64748B" font-family="JetBrains Mono" font-size="9" text-anchor="middle">COCKPIT</text>'

            // Zone Station Dividers & Balance Arms (73, 181, 354, 465, 644, 828, 1006, 1242)
            // Scale: x = 105 + ((arm - 73) / (1242 - 73)) * 780
            // Arm 73 = 105, Arm 181 = 177, Arm 354 = 292, Arm 465 = 366, Arm 644 = 486, Arm 828 = 608, Arm 1006 = 727, Arm 1242 = 885
            + '<line x1="177" y1="40" x2="177" y2="180" stroke="#334155" stroke-width="1.5" stroke-dasharray="3 3"/>'
            + '<line x1="292" y1="40" x2="292" y2="180" stroke="#334155" stroke-width="1.5" stroke-dasharray="3 3"/>'
            + '<line x1="366" y1="40" x2="366" y2="180" stroke="#334155" stroke-width="1.5" stroke-dasharray="3 3"/>'
            + '<line x1="486" y1="40" x2="486" y2="180" stroke="#334155" stroke-width="1.5" stroke-dasharray="3 3"/>'
            + '<line x1="608" y1="40" x2="608" y2="180" stroke="#334155" stroke-width="1.5" stroke-dasharray="3 3"/>'
            + '<line x1="727" y1="40" x2="727" y2="180" stroke="#334155" stroke-width="1.5" stroke-dasharray="3 3"/>'
            + '<line x1="885" y1="40" x2="885" y2="180" stroke="#334155" stroke-width="1.5" stroke-dasharray="3 3"/>'

            // Zone A (105 to 177): Entrance Area
            + '<g id="svg-zone-a">'
            + '<rect x="110" y="50" width="24" height="24" rx="3" fill="#1E293B" stroke="#475569"/>'
            + '<text x="122" y="65" fill="#94A3B8" font-family="JetBrains Mono" font-size="8" text-anchor="middle">G1</text>'
            + '<rect x="140" y="50" width="24" height="24" rx="3" fill="#1E293B" stroke="#475569"/>'
            + '<text x="152" y="65" fill="#94A3B8" font-family="JetBrains Mono" font-size="8" text-anchor="middle">G1A</text>'
            + '<text x="141" y="113" fill="#64748B" font-family="Chakra Petch" font-size="9" text-anchor="middle">ENTRANCE</text>'
            + '</g>'

            // Zone B (177 to 292): Staff Seating Area (16 TTOL seats: 4 rows of 4 seats)
            + '<g id="svg-zone-b-seats">'
            + renderZoneBSeatsSVG()
            + '</g>'

            // Zone C (292 to 366): Galley Area
            + '<g id="svg-zone-c">'
            + '<rect x="298" y="50" width="24" height="28" rx="3" fill="#1E293B" stroke="#475569"/>'
            + '<text x="310" y="68" fill="#94A3B8" font-family="JetBrains Mono" font-size="8" text-anchor="middle">G2</text>'
            + '<rect x="334" y="50" width="24" height="28" rx="3" fill="#1E293B" stroke="#475569"/>'
            + '<text x="346" y="68" fill="#94A3B8" font-family="JetBrains Mono" font-size="8" text-anchor="middle">G4</text>'
            + '<rect x="298" y="142" width="24" height="28" rx="3" fill="#1E293B" stroke="#475569"/>'
            + '<text x="310" y="159" fill="#94A3B8" font-family="JetBrains Mono" font-size="8" text-anchor="middle">LAV</text>'
            + '<rect x="334" y="142" width="24" height="28" rx="3" fill="#1E293B" stroke="#475569"/>'
            + '<text x="346" y="159" fill="#94A3B8" font-family="JetBrains Mono" font-size="8" text-anchor="middle">G6</text>'
            + '<text x="329" y="113" fill="#64748B" font-family="Chakra Petch" font-size="9" text-anchor="middle">GALLEY</text>'
            + '</g>'

            // Zone D (366 to 486): Premium Class (12 TTOL seats: 3 rows of 4 seats)
            + '<g id="svg-zone-d-seats">'
            + renderZoneDSeatsSVG()
            + '</g>'

            // Zone E (486 to 608): Lounge (2 Sofas of 4 pax each + 1 right chair = 9 Pax)
            + '<g id="svg-zone-e-lounge">'
            + renderZoneESeatsSVG()
            + '</g>'

            // Zone F (608 to 727): Executive Office (2 seats on desk + 2 seats meeting = 4 Pax)
            + '<g id="svg-zone-f-office">'
            + renderZoneFSeatsSVG()
            + '</g>'

            // Zone G (727 to 885): Master Suite & Master Lavatory
            + '<g id="svg-zone-g-suite">'
            + '<rect x="740" y="55" width="70" height="110" rx="8" fill="#1E293B" stroke="#475569"/>'
            + '<text x="775" y="113" fill="#E2E8F0" font-family="Chakra Petch" font-size="10" font-weight="bold" text-anchor="middle">MASTER SUITE</text>'
            + '<rect x="825" y="65" width="48" height="90" rx="6" fill="#1E293B" stroke="#475569"/>'
            + '<text x="849" y="113" fill="#94A3B8" font-family="Chakra Petch" font-size="8" text-anchor="middle">BATHROOM</text>'
            + '</g>'

            // Balance Arm Ruler at Bottom (Arm 50 to 1250 in)
            + '<line x1="50" y1="195" x2="890" y2="195" stroke="#64748B" stroke-width="1.5"/>'
            + [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200].map(function(arm) {
                const x = Math.round(50 + ((arm - 50) / 1200) * 840);
                return '<line x1="' + x + '" y1="192" x2="' + x + '" y2="198" stroke="#64748B" stroke-width="1.2"/>'
                    + '<text x="' + x + '" y="210" fill="#64748B" font-family="JetBrains Mono" font-size="8" text-anchor="middle">' + arm + '</text>';
            }).join('')
            + '<text x="895" y="210" fill="#94A3B8" font-family="JetBrains Mono" font-size="8">[IN]</text>'
            + '</svg></div></div>';
    }

    function renderZoneBSeatsSVG() {
        // 16 seats in Zone B: 4 rows at x = 195, 222, 249, 276
        // 4 seats per row: y = 56, 76 (left aisle), 124, 144 (right aisle)
        const rows = [195, 222, 249, 276];
        const yPos = [56, 76, 124, 144];
        let html = '';
        let seatIndex = 0;
        const xcc = wzState.extracc || 0;
        const stf = wzState.staff || 0;

        for (let r = 0; r < rows.length; r++) {
            for (let c = 0; c < yPos.length; c++) {
                seatIndex++;
                let cls = 'empty';
                if (seatIndex <= xcc) {
                    cls = 'occupied-cc';
                } else if (seatIndex <= xcc + stf) {
                    cls = 'occupied-staff';
                }
                html += '<circle id="ttol-seat-b-' + seatIndex + '" class="ttol-seat ' + cls + '" cx="' + rows[r] + '" cy="' + yPos[c] + '" r="6.5" stroke-width="1.5"/>';
            }
        }
        return html;
    }

    function renderZoneDSeatsSVG() {
        // 12 seats in Zone D: 3 rows at x = 390, 425, 460
        // 4 seats per row: y = 56, 76, 124, 144
        const rows = [390, 425, 460];
        const yPos = [56, 76, 124, 144];
        let html = '';
        let seatIndex = 0;
        const prem = wzState.premium || 0;

        for (let r = 0; r < rows.length; r++) {
            for (let c = 0; c < yPos.length; c++) {
                seatIndex++;
                const cls = (seatIndex <= prem) ? 'occupied-pax' : 'empty';
                html += '<circle id="ttol-seat-d-' + seatIndex + '" class="ttol-seat ' + cls + '" cx="' + rows[r] + '" cy="' + yPos[c] + '" r="6.5" stroke-width="1.5"/>';
            }
        }
        return html;
    }

    function renderZoneESeatsSVG() {
        // 9 seats in Zone E (VIP Lounge): 4 on top sofa, 4 on bottom sofa, 1 on right
        const vl = wzState.viplounge || 0;
        let html = '';
        // Top Sofa (4 pax)
        html += '<rect x="496" y="48" width="96" height="34" rx="5" fill="#1E293B" stroke="#475569"/>';
        html += '<text x="544" y="60" fill="#94A3B8" font-family="Chakra Petch" font-size="7" font-weight="bold" text-anchor="middle">SOFA (4 PAX)</text>';
        const topX = [508, 532, 556, 580];
        for (let i = 0; i < 4; i++) {
            const idx = i + 1;
            const cls = (idx <= vl) ? 'occupied-pax' : 'empty';
            html += '<circle id="ttol-seat-e-' + idx + '" class="ttol-seat ' + cls + '" cx="' + topX[i] + '" cy="' + 71 + '" r="5.5" stroke-width="1.4"/>';
        }
        // Center Table
        html += '<rect x="515" y="96" width="58" height="26" rx="4" fill="#0F172A" stroke="#334155" stroke-dasharray="2 2"/>';
        html += '<text x="544" y="112" fill="#64748B" font-family="JetBrains Mono" font-size="7" text-anchor="middle">TABLE</text>';
        // Bottom Sofa (4 pax)
        html += '<rect x="496" y="136" width="96" height="34" rx="5" fill="#1E293B" stroke="#475569"/>';
        html += '<text x="544" y="165" fill="#94A3B8" font-family="Chakra Petch" font-size="7" font-weight="bold" text-anchor="middle">SOFA (4 PAX)</text>';
        for (let i = 0; i < 4; i++) {
            const idx = i + 5;
            const cls = (idx <= vl) ? 'occupied-pax' : 'empty';
            html += '<circle id="ttol-seat-e-' + idx + '" class="ttol-seat ' + cls + '" cx="' + topX[i] + '" cy="' + 147 + '" r="5.5" stroke-width="1.4"/>';
        }
        // Right Single Chair (1 pax)
        const cls9 = (9 <= vl) ? 'occupied-pax' : 'empty';
        html += '<rect x="588" y="95" width="22" height="28" rx="4" fill="#1E293B" stroke="#475569"/>';
        html += '<circle id="ttol-seat-e-9" class="ttol-seat ' + cls9 + '" cx="599" cy="109" r="6" stroke-width="1.5"/>';
        html += '<text x="599" y="130" fill="#94A3B8" font-family="JetBrains Mono" font-size="6" text-anchor="middle">1P</text>';
        return html;
    }

    function renderZoneFSeatsSVG() {
        // 4 seats in Zone F (Executive Office): 2 on office desk + 2 for meeting
        const vo = wzState.vipoffice || 0;
        let html = '';
        // Desk
        html += '<rect x="620" y="52" width="68" height="34" rx="4" fill="#1E293B" stroke="#475569"/>';
        html += '<text x="654" y="68" fill="#94A3B8" font-family="JetBrains Mono" font-size="8" font-weight="bold" text-anchor="middle">OFFICE</text>';
        // 2 Seats on Office Desk
        const cls1 = (1 <= vo) ? 'occupied-pax' : 'empty';
        const cls2 = (2 <= vo) ? 'occupied-pax' : 'empty';
        html += '<circle id="ttol-seat-f-1" class="ttol-seat ' + cls1 + '" cx="637" cy="98" r="6.5" stroke-width="1.5"/>';
        html += '<circle id="ttol-seat-f-2" class="ttol-seat ' + cls2 + '" cx="671" cy="98" r="6.5" stroke-width="1.5"/>';
        // 2 Seats for Guests/Meeting
        const cls3 = (3 <= vo) ? 'occupied-pax' : 'empty';
        const cls4 = (4 <= vo) ? 'occupied-pax' : 'empty';
        html += '<circle id="ttol-seat-f-3" class="ttol-seat ' + cls3 + '" cx="637" cy="136" r="6.5" stroke-width="1.5"/>';
        html += '<circle id="ttol-seat-f-4" class="ttol-seat ' + cls4 + '" cx="671" cy="136" r="6.5" stroke-width="1.5"/>';
        html += '<text x="654" y="156" fill="#64748B" font-family="JetBrains Mono" font-size="7" text-anchor="middle">4 SEATS MAX</text>';
        return html;
    }

    function updateCabinLopaSeats() {
        // Update Zone B seats
        const xcc = wzState.extracc || 0;
        const stf = wzState.staff || 0;
        for (let i = 1; i <= 16; i++) {
            const el = document.getElementById('ttol-seat-b-' + i);
            if (el) {
                if (i <= xcc) {
                    el.className.baseVal = 'ttol-seat occupied-cc';
                } else if (i <= xcc + stf) {
                    el.className.baseVal = 'ttol-seat occupied-staff';
                } else {
                    el.className.baseVal = 'ttol-seat empty';
                }
            }
        }

        // Update Zone D seats
        const prem = wzState.premium || 0;
        for (let i = 1; i <= 12; i++) {
            const el = document.getElementById('ttol-seat-d-' + i);
            if (el) {
                el.className.baseVal = (i <= prem) ? 'ttol-seat occupied-pax' : 'empty';
            }
        }

        // Update Zone E seats (VIP Lounge - 9 pax)
        const vLounge = wzState.viplounge || 0;
        for (let i = 1; i <= 9; i++) {
            const el = document.getElementById('ttol-seat-e-' + i);
            if (el) {
                el.className.baseVal = (i <= vLounge) ? 'ttol-seat occupied-pax' : 'ttol-seat empty';
            }
        }

        // Update Zone F seats (Executive Office - 4 pax)
        const vOffice = wzState.vipoffice || 0;
        for (let i = 1; i <= 4; i++) {
            const el = document.getElementById('ttol-seat-f-' + i);
            if (el) {
                el.className.baseVal = (i <= vOffice) ? 'ttol-seat occupied-pax' : 'ttol-seat empty';
            }
        }
    }

    function renderCargo() {
        const xcc = wzState.extracc || 0;
        const maxStaff = Math.max(0, 16 - xcc);
        const currentStaff = Math.min(wzState.staff || 0, maxStaff);

        return '<div class="wizard-section">'
            + '<h2 class="section-title">BBJ2 Cabin LOPA &amp; Zone Distribution</h2>'
            // 7 Zone Boxes on the Cabin Plan
            + '<div class="lopa-zone-box-grid">'
            // Zone A
            + '<div class="lopa-zone-box" id="box-zone-a">'
            + '<div class="lopa-box-header"><span class="lopa-box-title">ZONE A</span><span class="lopa-box-arm">73-181"</span></div>'
            + '<div class="lopa-box-arm">Entrance Area</div>'
            + '<div class="lopa-box-input-wrap"><label style="font-size:9px; color:var(--efb-muted);">Load (kg)</label>'
            + '<input type="text" id="wz-load-a" value="' + (wzState.load.A || 0) + '" inputmode="numeric" maxlength="3"></div>'
            + '<div class="lopa-zone-weight-box"><span class="lopa-weight-lbl">Poids Zone A</span><span class="lopa-weight-val" id="wz-box-wt-a">0 kg</span></div>'
            + '</div>'
            // Zone B (Staff)
            + '<div class="lopa-zone-box zone-b-highlight" id="box-zone-b">'
            + '<div class="lopa-box-header"><span class="lopa-box-title">ZONE B — STAFF</span><span class="lopa-box-arm">181-354"</span></div>'
            + '<div class="lopa-box-metric" id="wz-zoneb-occ-txt">' + (currentStaff + xcc) + ' / 16 max (Staff: ' + currentStaff + ', Extra CC: ' + xcc + ')</div>'
            + '<div style="display:flex; gap:4px; margin-top:3px;">'
            + '<div style="flex:1;"><label style="font-size:8px; color:var(--efb-muted);">Staff</label>'
            + '<select id="wz-staff" class="input-field" style="padding:2px 4px; font-size:11px; width:100%;">'
            + Array.from({length: maxStaff + 1}, (_, i) => '<option value="' + i + '"' + (i === currentStaff ? ' selected' : '') + '>' + i + '</option>').join('')
            + '</select></div>'
            + '<div style="flex:1;"><label style="font-size:8px; color:#F59E0B;">Extra CC</label>'
            + '<div id="wz-zoneb-extracc-badge" style="font-size:11px; font-family:\'JetBrains Mono\'; font-weight:700; color:#F59E0B; padding:3px 4px; background:rgba(245,158,11,0.15); border-radius:4px; text-align:center;">' + xcc + '</div>'
            + '</div></div>'
            + '<div class="lopa-box-input-wrap"><label style="font-size:9px; color:var(--efb-muted);">Load (kg)</label>'
            + '<input type="text" id="wz-load-b" value="' + (wzState.load.B || 0) + '" inputmode="numeric" maxlength="3"></div>'
            + '<div class="lopa-zone-weight-box"><span class="lopa-weight-lbl">Poids Zone B</span><span class="lopa-weight-val" id="wz-box-wt-b">0 kg</span></div>'
            + '</div>'
            // Zone C
            + '<div class="lopa-zone-box" id="box-zone-c">'
            + '<div class="lopa-box-header"><span class="lopa-box-title">ZONE C</span><span class="lopa-box-arm">354-465"</span></div>'
            + '<div class="lopa-box-arm">Galley Area</div>'
            + '<div class="lopa-box-input-wrap"><label style="font-size:9px; color:var(--efb-muted);">Load (kg)</label>'
            + '<input type="text" id="wz-load-c" value="' + (wzState.load.C || 0) + '" inputmode="numeric" maxlength="3"></div>'
            + '<div class="lopa-zone-weight-box"><span class="lopa-weight-lbl">Poids Zone C</span><span class="lopa-weight-val" id="wz-box-wt-c">0 kg</span></div>'
            + '</div>'
            // Zone D (Premium)
            + '<div class="lopa-zone-box" id="box-zone-d">'
            + '<div class="lopa-box-header"><span class="lopa-box-title">ZONE D — PREM</span><span class="lopa-box-arm">465-644"</span></div>'
            + '<div style="margin-top:2px;"><label style="font-size:8px; color:var(--efb-muted);">Pax (max 12)</label>'
            + '<select id="wz-premium" class="input-field" style="padding:2px 4px; font-size:11px; width:100%;">'
            + Array.from({length: 13}, (_, i) => '<option value="' + i + '"' + (i === (wzState.premium || 0) ? ' selected' : '') + '>' + i + '</option>').join('')
            + '</select></div>'
            + '<div class="lopa-box-input-wrap"><label style="font-size:9px; color:var(--efb-muted);">Load (kg)</label>'
            + '<input type="text" id="wz-load-d" value="' + (wzState.load.D || 0) + '" inputmode="numeric" maxlength="3"></div>'
            + '<div class="lopa-zone-weight-box"><span class="lopa-weight-lbl">Poids Zone D</span><span class="lopa-weight-val" id="wz-box-wt-d">0 kg</span></div>'
            + '</div>'
            // Zone E (Lounge)
            + '<div class="lopa-zone-box" id="box-zone-e">'
            + '<div class="lopa-box-header"><span class="lopa-box-title">ZONE E — LNG</span><span class="lopa-box-arm">644-828"</span></div>'
            + '<div style="margin-top:2px;"><label style="font-size:8px; color:var(--efb-muted);">VIP (max 9)</label>'
            + '<select id="wz-viplounge" class="input-field" style="padding:2px 4px; font-size:11px; width:100%;">'
            + Array.from({length: 10}, (_, i) => '<option value="' + i + '"' + (i === (wzState.viplounge || 0) ? ' selected' : '') + '>' + i + '</option>').join('')
            + '</select></div>'
            + '<div class="lopa-box-input-wrap"><label style="font-size:9px; color:var(--efb-muted);">Load (kg)</label>'
            + '<input type="text" id="wz-load-e" value="' + (wzState.load.E || 0) + '" inputmode="numeric" maxlength="3"></div>'
            + '<div class="lopa-zone-weight-box"><span class="lopa-weight-lbl">Poids Zone E</span><span class="lopa-weight-val" id="wz-box-wt-e">0 kg</span></div>'
            + '</div>'
            // Zone F (Office)
            + '<div class="lopa-zone-box" id="box-zone-f">'
            + '<div class="lopa-box-header"><span class="lopa-box-title">ZONE F — OFF</span><span class="lopa-box-arm">828-1006"</span></div>'
            + '<div style="margin-top:2px;"><label style="font-size:8px; color:var(--efb-muted);">VIP (max 4)</label>'
            + '<select id="wz-vipoffice" class="input-field" style="padding:2px 4px; font-size:11px; width:100%;">'
            + Array.from({length: 5}, (_, i) => '<option value="' + i + '"' + (i === (wzState.vipoffice || 0) ? ' selected' : '') + '>' + i + '</option>').join('')
            + '</select></div>'
            + '<div class="lopa-box-input-wrap"><label style="font-size:9px; color:var(--efb-muted);">Load (kg)</label>'
            + '<input type="text" id="wz-load-f" value="' + (wzState.load.F || 0) + '" inputmode="numeric" maxlength="3"></div>'
            + '<div class="lopa-zone-weight-box"><span class="lopa-weight-lbl">Poids Zone F</span><span class="lopa-weight-val" id="wz-box-wt-f">0 kg</span></div>'
            + '</div>'
            // Zone G (Suite)
            + '<div class="lopa-zone-box" id="box-zone-g">'
            + '<div class="lopa-box-header"><span class="lopa-box-title">ZONE G</span><span class="lopa-box-arm">1006-1242"</span></div>'
            + '<div class="lopa-box-arm">Master Suite</div>'
            + '<div class="lopa-box-input-wrap"><label style="font-size:9px; color:var(--efb-muted);">Load (kg)</label>'
            + '<input type="text" id="wz-load-g" value="' + (wzState.load.G || 0) + '" inputmode="numeric" maxlength="3"></div>'
            + '<div class="lopa-zone-weight-box"><span class="lopa-weight-lbl">Poids Zone G</span><span class="lopa-weight-val" id="wz-box-wt-g">0 kg</span></div>'
            + '</div>'
            + '</div>'

            // Visual LOPA Schematic
            + renderCabinLopaSVG()
            + '</div>'

            // 2 Separate Cargo Holds
            + '<div class="wizard-section" style="margin-top:16px;">'
            + '<h2 class="section-title">Cargo Compartments (2 Soutes Distinctes)</h2>'
            + '<div class="cargo-holds-dual-grid">'
            // Soute Avant (FWD)
            + '<div class="cargo-hold-card" id="card-hold-fwd">'
            + '<div class="cargo-hold-header">'
            + '<span class="cargo-hold-title">Soute Avant (FWD HOLD)</span>'
            + '<span class="cargo-hold-max">Max: 2,948 kg</span>'
            + '</div>'
            + '<div class="form-group" style="margin:0;">'
            + '<input type="text" id="wz-fwdhold" value="' + (wzState.fwdhold || 150) + '" inputmode="numeric" pattern="[0-9]*" maxlength="4" class="input-field" style="font-size:16px; font-weight:700;">'
            + '</div>'
            + '<div class="cargo-hold-bar">'
            + '<div class="cargo-hold-bar-fill" id="bar-fill-fwd" style="width:' + Math.min(100, Math.round(((wzState.fwdhold || 150) / 2948) * 100)) + '%;"></div>'
            + '</div>'
            + '<div style="display:flex; justify-content:space-between; font-size:11px; font-family:\'JetBrains Mono\'; color:var(--efb-muted);">'
            + '<span>Remplissage</span><span id="txt-fill-fwd" style="color:var(--efb-cyan); font-weight:700;">' + Math.round(((wzState.fwdhold || 150) / 2948) * 100) + '%</span>'
            + '</div>'
            + '</div>'

            // Soute Arrière (AFT)
            + '<div class="cargo-hold-card" id="card-hold-aft">'
            + '<div class="cargo-hold-header">'
            + '<span class="cargo-hold-title">Soute Arrière (AFT HOLD)</span>'
            + '<span class="cargo-hold-max">Max: 1,588 kg</span>'
            + '</div>'
            + '<div class="form-group" style="margin:0;">'
            + '<input type="text" id="wz-afthold" value="' + (wzState.afthold || 0) + '" inputmode="numeric" pattern="[0-9]*" maxlength="4" class="input-field" style="font-size:16px; font-weight:700;">'
            + '</div>'
            + '<div class="cargo-hold-bar">'
            + '<div class="cargo-hold-bar-fill" id="bar-fill-aft" style="width:' + Math.min(100, Math.round(((wzState.afthold || 0) / 1588) * 100)) + '%; background:linear-gradient(90deg, #F59E0B, #D97706);"></div>'
            + '</div>'
            + '<div style="display:flex; justify-content:space-between; font-size:11px; font-family:\'JetBrains Mono\'; color:var(--efb-muted);">'
            + '<span>Remplissage</span><span id="txt-fill-aft" style="color:#F59E0B; font-weight:700;">' + Math.round(((wzState.afthold || 0) / 1588) * 100) + '%</span>'
            + '</div>'
            + '</div>'
            + '</div>'
            + '</div>'

            // Summary Totals Payload & AZFW
            + '<div class="wizard-section" style="margin-top:16px;">'
            + '<div class="form-grid">'
            + '<div class="form-group"><label>TOTAL PAYLOAD (kg)</label>'
            + '<input type="text" id="wz-payload" class="input-field readonly-field" readonly style="font-size:16px; font-weight:700;"></div>'
            + '<div class="form-group"><label>ACTUAL ZERO FUEL WEIGHT - AZFW (kg)</label>'
            + '<input type="text" id="wz-azfw" class="input-field readonly-field" readonly style="font-size:16px; font-weight:700;"></div>'
            + '</div></div>';
    }

    function updatePayload() {
        syncState();
        const paxWt = (typeof BBJ_DATA !== 'undefined') ? BBJ_DATA.paxWeight : 83.9;
        const pax = wzState.staff + wzState.premium + wzState.viplounge + wzState.vipoffice;
        let loads = 0;
        ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(function(z) { loads += wzState.load[z]; });
        const cargo = wzState.fwdhold + wzState.afthold;
        const payload = Math.round(pax * paxWt) + loads + cargo;
        payloadState = payload;
        azfwState = correctedDow + payload;
        const el = document.getElementById('wz-payload');
        const az = document.getElementById('wz-azfw');
        if (el) el.value = String(payload);
        if (az) az.value = String(azfwState);

        // Update Zone Total Weights (Pax weight + Load in cabin)
        const wtA = wzState.load.A || 0;
        const wtB = Math.round(((wzState.staff || 0) + (wzState.extracc || 0)) * paxWt) + (wzState.load.B || 0);
        const wtC = wzState.load.C || 0;
        const wtD = Math.round((wzState.premium || 0) * paxWt) + (wzState.load.D || 0);
        const wtE = Math.round((wzState.viplounge || 0) * paxWt) + (wzState.load.E || 0);
        const wtF = Math.round((wzState.vipoffice || 0) * paxWt) + (wzState.load.F || 0);
        const wtG = wzState.load.G || 0;

        const setWt = function(id, val) {
            const d = document.getElementById(id);
            if (d) d.textContent = val.toLocaleString() + ' kg';
        };
        setWt('wz-box-wt-a', wtA);
        setWt('wz-box-wt-b', wtB);
        setWt('wz-box-wt-c', wtC);
        setWt('wz-box-wt-d', wtD);
        setWt('wz-box-wt-e', wtE);
        setWt('wz-box-wt-f', wtF);
        setWt('wz-box-wt-g', wtG);

        // Update Cargo Hold Visual Bars
        const fwdBar = document.getElementById('bar-fill-fwd');
        const fwdTxt = document.getElementById('txt-fill-fwd');
        if (fwdBar) {
            const pct = Math.min(100, Math.round((wzState.fwdhold / 2948) * 100));
            fwdBar.style.width = pct + '%';
            if (fwdTxt) fwdTxt.textContent = pct + '%';
        }
        const aftBar = document.getElementById('bar-fill-aft');
        const aftTxt = document.getElementById('txt-fill-aft');
        if (aftBar) {
            const pct = Math.min(100, Math.round((wzState.afthold / 1588) * 100));
            aftBar.style.width = pct + '%';
            if (aftTxt) aftTxt.textContent = pct + '%';
        }

        updateCabinLopaSeats();
        updateTelemetryStrip();
    }

    function initCargo() {
        ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(function(z) {
            bindNumeric('wz-load-' + z.toLowerCase(), 454);
        });
        bindNumeric('wz-fwdhold', 2948);
        bindNumeric('wz-afthold', 1588);
        updatePayload();

        const staffEl = document.getElementById('wz-staff');
        if (staffEl) {
            staffEl.addEventListener('change', function() {
                wzState.staff = parseInt(this.value, 10) || 0;
                const occEl = document.getElementById('wz-zoneb-occ-txt');
                if (occEl) {
                    occEl.textContent = (wzState.staff + wzState.extracc) + ' / 16 max (Staff: ' + wzState.staff + ', Extra CC: ' + wzState.extracc + ')';
                }
                updatePayload();
            });
        }

        ['wz-premium', 'wz-viplounge', 'wz-vipoffice'].forEach(function(id) {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', updatePayload);
        });

        ['wz-load-a', 'wz-load-b', 'wz-load-c', 'wz-load-d', 'wz-load-e', 'wz-load-f', 'wz-load-g', 'wz-fwdhold', 'wz-afthold'].forEach(function(id) {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', updatePayload);
        });
    }

    function numberField(id, label, value, max, maxLen, readonly) {
        const maxAttr = max ? ' max="' + max + '"' : '';
        return '<div class="form-group"><label>' + label + '</label>'
            + '<input type="text" id="' + id + '" value="' + value + '" inputmode="numeric" pattern="[0-9]*"'
            + ' maxlength="' + (maxLen || 5) + '" class="input-field' + (readonly ? ' readonly-field' : '') + '"'
            + maxAttr + (readonly ? ' readonly' : '') + '></div>';
    }

    function bindNumeric(id, max) {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '');
            if (max && parseInt(this.value, 10) > max) this.value = String(max);
        });
    }

    function decimalField(id, label, value, min, max, step) {
        return '<div class="form-group"><label>' + label + '</label>'
            + '<input type="text" id="' + id + '" value="' + value + '" inputmode="decimal" pattern="[0-9.,]*"'
            + ' class="input-field" data-min="' + min + '" data-max="' + max + '" data-step="' + (step || 4) + '"></div>';
    }

    function bindDecimal(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', function() {
            let v = this.value.replace(/[^0-9.,]/g, '');
            v = v.replace(',', '.');
            const step = parseInt(this.dataset.step, 10) || 4;
            const parts = v.split('.');
            if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
            if (parts[1] && parts[1].length > step) v = parts[0] + '.' + parts[1].slice(0, step);
            this.value = v;
            const num = parseFloat(v);
            if (!isNaN(num)) {
                const min = parseFloat(this.dataset.min);
                const max = parseFloat(this.dataset.max);
                if (v !== '' && min !== undefined && num < min) this.value = String(min);
                if (v !== '' && max !== undefined && num > max) this.value = String(max);
            }
        });
    }

    /* ===== STEP 3: EFB INSERT & Fuel Uplift Schematics ===== */
    function renderFuelTanksSVG() {
        return '<div class="efb-fuel-schematic">'
            + '<div style="width:100%; max-width:680px;">'
            + '<svg viewBox="0 0 800 270" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:auto;">'
            // Aircraft Silhouette
            + '<path d="M 400 30 C 410 30, 420 50, 420 90 L 420 110 L 680 180 L 680 200 L 420 185 L 420 220 L 460 245 L 460 255 L 400 250 L 340 255 L 340 245 L 380 220 L 380 185 L 120 200 L 120 180 L 380 110 L 380 90 C 380 50, 390 30, 400 30 Z" stroke="#334155" stroke-width="2" fill="#141A22"/>'
            // Left Wing Tank (Max 3,950 kg)
            + '<rect x="180" y="145" width="180" height="36" rx="6" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5"/>'
            + '<rect id="svg-tank-fill-left" x="180" y="145" width="0" height="36" rx="6" fill="url(#fuelGrad)" style="transition: width 0.3s ease;"/>'
            + '<text x="270" y="167" fill="#E2E8F0" font-family="JetBrains Mono" font-size="10" font-weight="bold" text-anchor="middle">LEFT WING</text>'
            // Right Wing Tank (Max 3,950 kg)
            + '<rect x="440" y="145" width="180" height="36" rx="6" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5"/>'
            + '<rect id="svg-tank-fill-right" x="440" y="145" width="0" height="36" rx="6" fill="url(#fuelGrad)" style="transition: width 0.3s ease;"/>'
            + '<text x="530" y="167" fill="#E2E8F0" font-family="JetBrains Mono" font-size="10" font-weight="bold" text-anchor="middle">RIGHT WING</text>'
            // Center Tank (Max 12,700 kg)
            + '<rect x="365" y="125" width="70" height="56" rx="6" fill="#0F172A" stroke="#38BDF8" stroke-width="1.8"/>'
            + '<rect id="svg-tank-fill-center" x="365" y="181" width="70" height="0" rx="6" fill="url(#fuelGradCenter)" style="transition: all 0.3s ease;"/>'
            + '<text x="400" y="156" fill="#E2E8F0" font-family="JetBrains Mono" font-size="10" font-weight="bold" text-anchor="middle">CENTER</text>'
            // Aft Auxiliary Tank (ACT / Soute Arrière - Max 7,985 kg)
            + '<rect x="375" y="195" width="50" height="38" rx="5" fill="#0F172A" stroke="#F59E0B" stroke-width="1.5"/>'
            + '<rect id="svg-tank-fill-aft" x="375" y="233" width="50" height="0" rx="5" fill="url(#fuelGradAft)" style="transition: all 0.3s ease;"/>'
            + '<text x="400" y="217" fill="#FCD34D" font-family="JetBrains Mono" font-size="8" font-weight="bold" text-anchor="middle">AFT AUX</text>'
            // Gradients
            + '<defs>'
            + '<linearGradient id="fuelGrad" x1="0%" y1="0%" x2="100%" y2="0%">'
            + '<stop offset="0%" stop-color="#0284C7" stop-opacity="0.8"/>'
            + '<stop offset="100%" stop-color="#38BDF8" stop-opacity="0.95"/>'
            + '</linearGradient>'
            + '<linearGradient id="fuelGradCenter" x1="0%" y1="100%" x2="0%" y2="0%">'
            + '<stop offset="0%" stop-color="#0284C7" stop-opacity="0.8"/>'
            + '<stop offset="100%" stop-color="#38BDF8" stop-opacity="0.95"/>'
            + '</linearGradient>'
            + '<linearGradient id="fuelGradAft" x1="0%" y1="100%" x2="0%" y2="0%">'
            + '<stop offset="0%" stop-color="#D97706" stop-opacity="0.8"/>'
            + '<stop offset="100%" stop-color="#F59E0B" stop-opacity="0.95"/>'
            + '</linearGradient>'
            + '</defs>'
            + '</svg></div>'
            // Readout Badges
            + '<div class="fuel-tank-readout-grid">'
            + '<div class="fuel-tank-badge" id="badge-tank-left">'
            + '<div class="fuel-tank-title">Left Wing Tank</div>'
            + '<div class="fuel-tank-val" id="val-tank-left">0 kg</div>'
            + '<div class="fuel-tank-cap">Max 3,950 kg</div>'
            + '</div>'
            + '<div class="fuel-tank-badge" id="badge-tank-center">'
            + '<div class="fuel-tank-title">Center Tank</div>'
            + '<div class="fuel-tank-val" id="val-tank-center">0 kg</div>'
            + '<div class="fuel-tank-cap">Max 12,700 kg</div>'
            + '</div>'
            + '<div class="fuel-tank-badge" id="badge-tank-right">'
            + '<div class="fuel-tank-title">Right Wing Tank</div>'
            + '<div class="fuel-tank-val" id="val-tank-right">0 kg</div>'
            + '<div class="fuel-tank-cap">Max 3,950 kg</div>'
            + '</div>'
            + '<div class="fuel-tank-badge" id="badge-tank-aft">'
            + '<div class="fuel-tank-title">Aft Aux (Soute)</div>'
            + '<div class="fuel-tank-val" id="val-tank-aft">0 kg</div>'
            + '<div class="fuel-tank-cap">Max 7,985 kg</div>'
            + '</div>'
            + '</div></div>';
    }

    function updateFuelTanksVisual(bf) {
        bf = parseFloat(bf) || 0;
        let left = 0, right = 0, center = 0, aft = 0;
        // Total wings capacity = 3,950 * 2 = 7,900 kg
        // Center tank = 12,700 kg
        // Wings + Center = 20,600 kg
        // Beyond 20,600 kg fills Aft Aux Tanks up to 7,985 kg (Total 28,585 kg)
        if (bf <= 7900) {
            left = Math.round(bf / 2);
            right = Math.round(bf / 2);
            center = 0;
            aft = 0;
        } else if (bf <= 20600) {
            left = 3950;
            right = 3950;
            center = bf - 7900;
            aft = 0;
        } else {
            left = 3950;
            right = 3950;
            center = 12700;
            aft = Math.min(7985, bf - 20600);
        }

        // Update SVG Tank Fills
        const fillLeft = document.getElementById('svg-tank-fill-left');
        const fillRight = document.getElementById('svg-tank-fill-right');
        const fillCenter = document.getElementById('svg-tank-fill-center');
        const fillAft = document.getElementById('svg-tank-fill-aft');

        if (fillLeft) {
            const w = Math.min(180, (left / 3950) * 180);
            fillLeft.setAttribute('width', w);
        }
        if (fillRight) {
            const w = Math.min(180, (right / 3950) * 180);
            fillRight.setAttribute('width', w);
        }
        if (fillCenter) {
            const h = Math.min(56, (center / 12700) * 56);
            fillCenter.setAttribute('height', h);
            fillCenter.setAttribute('y', 181 - h);
        }
        if (fillAft) {
            const h = Math.min(38, (aft / 7985) * 38);
            fillAft.setAttribute('height', h);
            fillAft.setAttribute('y', 233 - h);
        }

        // Update Text Badges
        const valLeft = document.getElementById('val-tank-left');
        const valRight = document.getElementById('val-tank-right');
        const valCenter = document.getElementById('val-tank-center');
        const valAft = document.getElementById('val-tank-aft');

        if (valLeft) valLeft.textContent = left.toLocaleString() + ' kg (' + Math.round((left / 3950) * 100) + '%)';
        if (valRight) valRight.textContent = right.toLocaleString() + ' kg (' + Math.round((right / 3950) * 100) + '%)';
        if (valCenter) valCenter.textContent = center.toLocaleString() + ' kg (' + Math.round((center / 12700) * 100) + '%)';
        if (valAft) valAft.textContent = aft.toLocaleString() + ' kg (' + Math.round((aft / 7985) * 100) + '%)';
    }

    function renderFuel() {
        return '<div class="wizard-section">'
            + '<div class="efb-insert-box">'
            + '<span class="efb-insert-badge">EFB OPT PERFORMANCE INSERT</span>'
            + '<h2 class="section-title" style="margin-top:4px;">Performance Limitations <span class="opt-tag" style="color:#38BDF8;">- OPT Certified Limits</span></h2>'
            + '<div class="form-grid">'
            + numberField('wz-perf-tow', 'Maximum T/O Performance Weight (kg)', wzState.perftow || 79015, 79015, 6)
            + numberField('wz-perf-ldg', 'Maximum Ldg Performance Weight (kg)', wzState.perfldg || 66360, 66360, 6)
            + numberField('wz-perf-zfw', 'Maximum ZFW Performance Weight (kg)', wzState.perfzwf || 62731, 62731, 6)
            + '</div></div>'
            + '</div>'
            + '<div class="wizard-section" style="margin-top:16px;">'
            + '<h2 class="section-title">Fuel Uplift &amp; Tanks Distribution (3,950 kg Ailes / 12,700 kg Central)</h2>'
            + renderFuelTanksSVG()
            + '<div class="form-grid" style="margin-top:14px;">'
            + numberField('wz-fuelbefore', 'Fuel Before (kg)', 0, 28585, 6)
            + numberField('wz-supplied', 'Supplied (L)', 0, 39785, 6)
            + decimalField('wz-density', 'Density (kg/L)', 0.8000, 0.7549, 0.8507, 4)
            + '</div></div>'
            + '<div class="wizard-section" style="margin-top:16px;">'
            + '<h2 class="section-title">Fuel Usage &amp; Block Fuel</h2>'
            + '<div class="form-grid">'
            + numberField('wz-blockfuel', 'Block Fuel (kg)', blockFuelState || 18000, 28585, 5, true)
            + numberField('wz-taxifuel', 'Taxi Fuel (kg)', taxiFuelState || 200, null, 5)
            + numberField('wz-tripfuel', 'Trip Fuel (kg)', wzState.tripfuel || 8200, null, 5)
            + '</div></div>'
            + '<div class="wizard-section" style="margin-top:16px;">'
            + '<h2 class="section-title">Computed Limitations</h2>'
            + '<div class="wz-perf-row">'
            + '<div class="form-group wz-lim-group" id="box-perf-calc-tow">'
            + '<div class="wz-lim-lbl-row"><label>Maximum T/O Weight (kg)</label><span class="wz-lim-badge" id="badge-perf-calc-tow" style="display:none;">LIMITING</span></div>'
            + '<input type="text" id="wz-perf-calc-tow" class="input-field readonly-field" readonly></div>'
            + '<div class="form-group wz-lim-group" id="box-perf-calc-ldg">'
            + '<div class="wz-lim-lbl-row"><label>Maximum LDG Weight+TRIP (kg)</label><span class="wz-lim-badge" id="badge-perf-calc-ldg" style="display:none;">LIMITING</span></div>'
            + '<input type="text" id="wz-perf-calc-ldg" class="input-field readonly-field" readonly></div>'
            + '<div class="form-group wz-lim-group" id="box-perf-calc-zfw">'
            + '<div class="wz-lim-lbl-row"><label>Maximum ZFW+T/O Fuel (kg)</label><span class="wz-lim-badge" id="badge-perf-calc-zfw" style="display:none;">LIMITING</span></div>'
            + '<input type="text" id="wz-perf-calc-zfw" class="input-field readonly-field" readonly></div>'
            + '</div></div>';
    }

    function perfNum(id) {
        const el = document.getElementById(id);
        if (!el) return 0;
        const v = String(el.value || '').replace(/,/g, '');
        return parseFloat(v) || 0;
    }

    function updatePerfCalc() {
        const towEl = document.getElementById('wz-perf-calc-tow');
        const ldgEl = document.getElementById('wz-perf-calc-ldg');
        const zfwEl = document.getElementById('wz-perf-calc-zfw');
        if (!towEl || !ldgEl || !zfwEl) return;
        const vTow = perfNum('wz-perf-tow');
        const vLdg = perfNum('wz-perf-ldg') + perfNum('wz-tripfuel');
        const vZfw = perfNum('wz-perf-zfw') + perfNum('wz-blockfuel') - perfNum('wz-taxifuel');
        towEl.value = Math.round(vTow).toLocaleString('en-US');
        ldgEl.value = Math.round(vLdg).toLocaleString('en-US');
        zfwEl.value = Math.round(vZfw).toLocaleString('en-US');

        const boxTow = document.getElementById('box-perf-calc-tow');
        const boxLdg = document.getElementById('box-perf-calc-ldg');
        const boxZfw = document.getElementById('box-perf-calc-zfw');
        const badgeTow = document.getElementById('badge-perf-calc-tow');
        const badgeLdg = document.getElementById('badge-perf-calc-ldg');
        const badgeZfw = document.getElementById('badge-perf-calc-zfw');

        const boxes = [
            { id: 'tow', val: vTow, el: towEl, box: boxTow, badge: badgeTow },
            { id: 'ldg', val: vLdg, el: ldgEl, box: boxLdg, badge: badgeLdg },
            { id: 'zfw', val: vZfw, el: zfwEl, box: boxZfw, badge: badgeZfw }
        ];

        let minItem = boxes[0];
        for (let i = 1; i < boxes.length; i++) {
            if (boxes[i].val < minItem.val) {
                minItem = boxes[i];
            }
        }
        perfLimit = minItem.val;

        boxes.forEach(function(item) {
            const isMin = (item === minItem);
            if (item.box) item.box.classList.toggle('is-limiting', isMin);
            if (item.el) item.el.classList.toggle('is-limiting', isMin);
            if (item.badge) item.badge.style.display = isMin ? 'inline-block' : 'none';
        });
    }

    function updateBlockFuel() {
        const el = document.getElementById('wz-blockfuel');
        if (!el) return;
        const before = parseFloat((document.getElementById('wz-fuelbefore') || {}).value) || 0;
        const supplied = parseFloat((document.getElementById('wz-supplied') || {}).value) || 0;
        const density = parseFloat((document.getElementById('wz-density') || {}).value) || 0;
        const bf = Math.round(before + supplied * density);
        el.value = bf > 28585 ? '28585' : String(bf);
        blockFuelState = parseInt(el.value, 10) || 0;
        updateFuelTanksVisual(blockFuelState);
        updatePerfCalc();
        updateTelemetryStrip();
    }

    function syncFuelState() {
        const bf = document.getElementById('wz-blockfuel');
        const tx = document.getElementById('wz-taxifuel');
        if (bf) blockFuelState = parseInt(bf.value, 10) || 0;
        if (tx) taxiFuelState = parseInt(tx.value, 10) || 0;
        updateFuelTanksVisual(blockFuelState);
        updateTelemetryStrip();
    }

    function initFuel() {
        bindNumeric('wz-perf-tow', 79015);
        bindNumeric('wz-perf-ldg', 66360);
        bindNumeric('wz-perf-zfw', 62731);
        bindNumeric('wz-fuelbefore', 28585);
        bindNumeric('wz-supplied', 39785);
        bindDecimal('wz-density');
        bindNumeric('wz-taxifuel');
        bindNumeric('wz-tripfuel');
        updateBlockFuel();
        updatePerfCalc();
        updateFuelTanksVisual(blockFuelState);
        ['wz-fuelbefore', 'wz-supplied', 'wz-density', 'wz-perf-tow', 'wz-perf-ldg', 'wz-perf-zfw', 'wz-taxifuel', 'wz-tripfuel', 'wz-blockfuel'].forEach(function(id) {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', function() { updateBlockFuel(); updatePerfCalc(); syncFuelState(); });
        });
    }

    function renderResume() {
        return '<div class="wz-resume-wrap">'
            + '<div class="awb-head">'
            + '<h2 class="section-title" style="margin:0;">Resume & Save</h2>'
            + '<button type="button" id="wz-print-btn" class="btn">🖨️ PRINT</button>'
            + '</div>'
            + '<div class="wizard-section">'
            + '<div class="form-grid">'
            + '<div class="form-group"><label>Charge Offerte (kg)</label>'
            + '<input type="text" id="wz-charge-offerte" class="input-field readonly-field" readonly></div>'
            + '<div class="form-group"><label>Maximum Fuel (kg)</label>'
            + '<input type="text" id="wz-maxfuel" class="input-field readonly-field" readonly></div>'
            + '</div></div>'
            + '<canvas id="wz-trim-canvas" class="wz-trim-canvas"></canvas>'
            + '<div class="wz-summary" id="wz-summary"></div>'
            + '<div id="wz-suggestions"></div>'
            + '<div id="wz-recap"></div>'
            + '<div id="wz-applied"></div>'
            + '</div>';
    }

    function wizardNum(id) {
        const el = document.getElementById(id);
        return el ? (parseInt(el.value, 10) || 0) : 0;
    }

function wizardInputs() {
        return {
            correctedDow: correctedDow,
            correctedDoi: correctedDoi,
            vip: 'YES',
            pilots: 2,
            observers: 0,
            cabincrew: 0,
            extracc: wzState.extracc,
            staff: wzState.staff,
            premium: wzState.premium,
            vipLounge: wzState.viplounge,
            vipOffice: wzState.vipoffice,
            vipSuite: 0,
            blockFuel: blockFuelState,
            taxiFuel: taxiFuelState,
            tripFuel: wzState.tripfuel,
            fwdHold: wzState.fwdhold,
            aftHold: wzState.afthold,
            water: 120,
            fwdGalley: 0,
            midGalley: 0,
            zoneBOtherLoad: 0,
            zoneLoad: {
                A: wzState.load.A,
                B: wzState.load.B,
                C: wzState.load.C,
                D: wzState.load.D,
                E: wzState.load.E,
                F: wzState.load.F,
                G: wzState.load.G
            }
        };
    }

    function pointInPoly(x, y, pts) {
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const xi = pts[i][0], yi = pts[i][1];
            const xj = pts[j][0], yj = pts[j][1];
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
        }
        return inside;
    }

    function phaseInside(envId, idx, wtKg, r) {
        if (typeof BBJ_DATA === 'undefined' || !BBJ_DATA.envelopes) return true;
        const env = BBJ_DATA.envelopes.find(function(e) { return e.id === envId; });
        if (!env || !env.points || !env.points.length) return true;
        const y = wtKg / 1000;
        if (!pointInPoly(idx, y, env.points)) return false;
        if (env.forbidden && env.forbidden.length) {
            for (const fz of env.forbidden) {
                const active = !fz.when || fz.when(r, r.blockFuel);
                if (active && pointInPoly(idx, y, fz.points)) return false;
            }
        }
        return true;
    }

    /* ===== Moteur de propositions ===== */
    const appliedLog = [];
    let lastSuggestions = [];

    function tryCalculate(mut) {
        const inputs = wizardInputs();
        if (mut) mut(inputs);
        return window.calculate(inputs);
    }

    function phaseOk(envId, rr) {
        if (envId === 'zfw') return phaseInside('zfw', rr.zfwIdx, rr.zfw, rr);
        if (envId === 'tow') return phaseInside('tow', rr.towIdx, rr.tow, rr);
        return phaseInside('ldw', rr.lawIdx, rr.law, rr);
    }

    function searchFuelProposal(envId) {
        let best = null;
        const deltas = [];
        for (let d = 100; d <= 5000; d += 100) { deltas.push(d, -d); }
        for (const d of deltas) {
            const nb = blockFuelState + d;
            if (nb < 0 || nb > 28585) continue;
            const rr = tryCalculate(function(inp) { inp.blockFuel = nb; });
            const lim = currentPerfLimit(nb, taxiFuelState, wzState.tripfuel);
            if (rr.tow > lim || rr.law > 66360 || rr.rampWt > 79242) continue;
            if (!phaseOk(envId, rr)) continue;
            if (!best || Math.abs(d) < Math.abs(best.d)) best = { d: d, nb: nb };
            if (best && Math.abs(best.d) <= 100) break;
        }
        if (!best) return null;
        return {
            kind: 'fuel', phaseLabel: envId.toUpperCase(), delta: best.d, newBlock: best.nb,
            label: (best.d > 0 ? 'Ajouter ' : 'Réduire ') + Math.abs(best.d) + ' kg de fuel (Block → ' + best.nb.toLocaleString('en-US') + ' kg)'
        };
    }

    function searchZoneProposal(envId) {
        const keys = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        let best = null;
        for (const from of keys) {
            if (wzState.load[from] <= 0) continue;
            for (const to of keys) {
                if (to === from) continue;
                const maxMove = Math.min(wzState.load[from], 454 - wzState.load[to]);
                for (let x = 10; x <= maxMove; x += 10) {
                    const xx = x;
                    const rr = tryCalculate(function(inp) {
                        inp.zoneLoad[from] = wzState.load[from] - xx;
                        inp.zoneLoad[to] = Math.min(454, wzState.load[to] + xx);
                    });
                    if (!phaseOk(envId, rr)) continue;
                    if (!best || x < best.x) { best = { from: from, to: to, x: x }; break; }
                }
                if (best && best.x <= 10) break;
            }
            if (best && best.x <= 10) break;
        }
        if (!best) return null;
        return {
            kind: 'zone', phaseLabel: envId.toUpperCase(), from: best.from, to: best.to, x: best.x,
            label: 'Transférer ' + best.x + ' kg de charge : Zone ' + best.from + ' → Zone ' + best.to
        };
    }

    function searchPaxShiftProposal(envId) {
        let best = null;
        const maxN = Math.min(wzState.staff, 12 - wzState.premium);
        for (let n = 1; n <= maxN; n++) {
            const nn = n;
            const rr = tryCalculate(function(inp) {
                inp.staff = wzState.staff - nn;
                inp.premium = wzState.premium + nn;
            });
            if (!phaseOk(envId, rr)) continue;
            best = { n: n };
            break;
        }
        if (!best) return null;
        return {
            kind: 'paxshift', phaseLabel: envId.toUpperCase(), n: best.n,
            label: 'Décaler ' + best.n + ' pax : Zone B → Zone D'
        };
    }

    function searchPaxProposal(envId, extraCheck) {
        const zones = [['staff', 'Staff (Zone B)'], ['premium', 'Premium PAX (Zone D)'], ['viplounge', 'VIP Lounge (Zone E)'], ['vipoffice', 'VIP Office (Zone F)']];
        let best = null;
        for (const zk of zones) {
            const key = zk[0];
            const cnt = wzState[key];
            for (let n = 1; n <= cnt; n++) {
                const nn = n;
                const rr = tryCalculate(function(inp) { inp[key] = cnt - nn; });
                if (extraCheck && !extraCheck(rr)) continue;
                if (!phaseOk(envId, rr)) continue;
                if (!best || n < best.n) { best = { key: key, n: n, label: zk[1] }; break; }
            }
            if (best && best.n === 1) break;
        }
        if (!best) return null;
        return {
            kind: 'pax', phaseLabel: envId.toUpperCase(), key: best.key, n: best.n,
            label: 'Retirer ' + best.n + ' pax — ' + best.label
        };
    }

    function searchCargoProposal(extraCheck) {
        const holds = [['fwdhold', 'FWD Hold'], ['afthold', 'AFT Hold']];
        let best = null;
        for (const hk of holds) {
            const key = hk[0];
            const cur = wzState[key];
            for (let x = 50; x <= cur; x += 50) {
                const xx = x;
                const rr = tryCalculate(function(inp) { inp[key] = cur - xx; });
                if (extraCheck && !extraCheck(rr)) continue;
                if (!phaseOk('tow', rr) || !phaseOk('ldw', rr) || !phaseOk('zfw', rr)) continue;
                if (!best || x < best.x) { best = { key: key, x: x, label: hk[1] }; break; }
            }
            if (best && best.x <= 50) break;
        }
        if (!best) return null;
        return {
            kind: 'cargo', phaseLabel: 'TOW', key: best.key, x: best.x,
            label: 'Retirer ' + best.x + ' kg du ' + best.label
        };
    }

    function buildSuggestions(r) {
        const out = [];
        const phases = [
            { envId: 'zfw', key: 'zfw', title: 'ZFW hors limite', idx: r.zfwIdx, wt: r.zfw },
            { envId: 'tow', key: 'tow', title: 'TOW hors limite', idx: r.towIdx, wt: r.tow },
            { envId: 'ldw', key: 'law', title: 'LAW hors limite', idx: r.lawIdx, wt: r.law }
        ];
        for (const ph of phases) {
            if (phaseInside(ph.envId, ph.idx, ph.wt, r)) continue;
            const props = [];
            if (ph.key !== 'zfw') {
                const f = searchFuelProposal(ph.envId);
                if (f) props.push(f);
            }
            const z = searchZoneProposal(ph.envId);
            if (z) props.push(z);
            const ps = searchPaxShiftProposal(ph.envId);
            if (ps) props.push(ps);
            if (props.length) out.push({ key: ph.key, title: ph.title, props: props.slice(0, 3) });
        }
        const lim = wizardPerfLimit();
        if (r.tow > lim) {
            const props = [];
            const wCheck = function(rr) {
                const l2 = currentPerfLimit(rr.blockFuel, taxiFuelState, wzState.tripfuel);
                return rr.tow <= l2 && rr.tow <= 79015;
            };
            for (let d = 100; d <= 5000; d += 100) {
                const nb = blockFuelState - d;
                if (nb < 0) break;
                const rr = tryCalculate(function(inp) { inp.blockFuel = nb; });
                if (!wCheck(rr)) continue;
                if (!phaseOk('tow', rr) || !phaseOk('ldw', rr)) continue;
                props.push({ kind: 'fuel', phaseLabel: 'TOW', delta: -d, newBlock: nb, label: 'Réduire le fuel de ' + d + ' kg (Block → ' + nb.toLocaleString('en-US') + ' kg)' });
                break;
            }
            const p = searchPaxProposal('tow', wCheck);
            if (p) props.push(p);
            const c = searchCargoProposal(wCheck);
            if (c) props.push(c);
            if (props.length) out.push({ key: 'toww', title: 'TOW dépasse la limitation du jour (' + lim.toLocaleString('en-US') + ' kg)', props: props.slice(0, 3) });
        }
        return out;
    }

    function applyProposal(p) {
        if (!confirm('Appliquer cette correction ?\n\n' + p.label)) return;
        if (p.kind === 'fuel') {
            const root = stepCache[2];
            const bfEl = root ? root.querySelector('#wz-fuelbefore') : null;
            const densEl = root ? root.querySelector('#wz-density') : null;
            const supEl = root ? root.querySelector('#wz-supplied') : null;
            const blockEl = root ? root.querySelector('#wz-blockfuel') : null;
            const before = bfEl ? (parseFloat(bfEl.value) || 0) : 0;
            const dens = densEl ? (parseFloat(densEl.value) || 0) : 0;
            let newBlock = p.newBlock;
            if (supEl && dens > 0) {
                const newSupplied = Math.round((p.newBlock - before) / dens);
                supEl.value = String(Math.max(0, Math.min(39785, newSupplied)));
                newBlock = Math.min(28585, Math.round(before + Math.max(0, Math.min(39785, newSupplied)) * dens));
            } else if (bfEl) {
                bfEl.value = String(Math.max(0, Math.min(28585, p.newBlock)));
                if (supEl) supEl.value = '0';
            }
            if (blockEl) blockEl.value = String(newBlock);
            blockFuelState = newBlock;
        } else if (p.kind === 'zone') {
            const root = stepCache[3];
            const nvFrom = Math.max(0, wzState.load[p.from] - p.x);
            const nvTo = Math.min(454, wzState.load[p.to] + p.x);
            wzState.load[p.from] = nvFrom;
            wzState.load[p.to] = nvTo;
            const fromEl = root ? root.querySelector('#wz-load-' + p.from.toLowerCase()) : null;
            const toEl = root ? root.querySelector('#wz-load-' + p.to.toLowerCase()) : null;
            if (fromEl) fromEl.value = String(nvFrom);
            if (toEl) toEl.value = String(nvTo);
            updatePayload();
        } else if (p.kind === 'paxshift') {
            const root = stepCache[3];
            const nvStaff = Math.max(0, wzState.staff - p.n);
            const nvPremium = Math.min(12, wzState.premium + p.n);
            wzState.staff = nvStaff;
            wzState.premium = nvPremium;
            const sEl = root ? root.querySelector('#wz-staff') : null;
            const pEl = root ? root.querySelector('#wz-premium') : null;
            if (sEl) sEl.value = String(nvStaff);
            if (pEl) pEl.value = String(nvPremium);
            updatePayload();
        } else if (p.kind === 'pax') {
            const root = stepCache[3];
            const idMap = { staff: 'wz-staff', premium: 'wz-premium', viplounge: 'wz-viplounge', vipoffice: 'wz-vipoffice' };
            const nv = Math.max(0, wzState[p.key] - p.n);
            wzState[p.key] = nv;
            const el = root ? root.querySelector('#' + idMap[p.key]) : null;
            if (el) el.value = String(nv);
            updatePayload();
        } else if (p.kind === 'cargo') {
            const root = stepCache[3];
            const nv = Math.max(0, wzState[p.key] - p.x);
            wzState[p.key] = nv;
            const el = root ? root.querySelector('#' + (p.key === 'fwdhold' ? 'wz-fwdhold' : 'wz-afthold')) : null;
            if (el) el.value = String(nv);
            updatePayload();
        }
        appliedLog.push({ time: new Date().toLocaleTimeString(), label: p.label, phase: p.phaseLabel });
        drawWizardChart();
    }

    function printWizReport() {
        const area = document.getElementById('print-area');
        if (!area || typeof window.calculate !== 'function') return;
        const r = window.calculate(wizardInputs());

        // Graphe re-rendu en format portrait (plus haut)
        const canvas = document.getElementById('wz-trim-canvas');
        let imgData = '';
        if (canvas && typeof window.drawCanvas === 'function') {
            let envs = (typeof BBJ_DATA !== 'undefined' && BBJ_DATA.envelopes) ? BBJ_DATA.envelopes.slice() : [];
            if (envelopeFilter) envs = envs.filter(function(e) { return e.id === envelopeFilter; });
            const phaseMap = { zfw: ['zf'], tow: ['tow'], ldw: ['law'] };
            const phases = envelopeFilter ? (phaseMap[envelopeFilter] || null) : null;
            const prevW = canvas.style.width, prevH = canvas.style.height;
            canvas.style.width = '760px';
            canvas.style.height = '1000px';
            window.drawCanvas(canvas, r, { background: false, envelopes: envs, phases: phases, macLines: (typeof BBJ_DATA !== 'undefined' && BBJ_DATA.macLines) ? BBJ_DATA.macLines : [] });
            imgData = canvas.toDataURL('image/png');
            canvas.style.width = prevW;
            canvas.style.height = prevH;
            window.drawCanvas(canvas, r, { background: false, envelopes: envs, phases: phases, macLines: (typeof BBJ_DATA !== 'undefined' && BBJ_DATA.macLines) ? BBJ_DATA.macLines : [] });
        }

        const root = stepCache[0];
        const numEl = root ? root.querySelector('#wz-flight') : null;
        const origP = root ? root.querySelector('#wz-origin-picker') : null;
        const destP = root ? root.querySelector('#wz-dest-picker') : null;
        const dateEl = root ? root.querySelector('#wz-date') : null;
        const timeEl = root ? root.querySelector('#wz-time') : null;
        const prepEl = root ? root.querySelector('#wz-preparedby') : null;
        const capEl = root ? root.querySelector('#wz-captain') : null;
        const orig = (origP && origP._getIcao) ? origP._getIcao() : '';
        const dest = (destP && destP._getIcao) ? destP._getIcao() : '';
        const route = orig + ' → ' + dest;
        const num = 'MRS' + String((numEl && numEl.value) || '').replace(/\D/g, '');
        const fdate = dateEl ? dateEl.value : '';
        const ftime = timeEl ? timeEl.value : '';
        const crewL = (window.CREW ? window.CREW.list() : []);
        function crewName(mr) {
            const m = crewL.find(function(x) { return x.matricule === mr; });
            return m ? (m.rank || m.fonction || '') + ' ' + m.nom : '';
        }
        const prepName = prepEl ? crewName(prepEl.value) : '';
        const capName = capEl ? crewName(capEl.value) : '';
        const lim = wizardPerfLimit();
        function rowP(label, wt, idx, ok, alt, macVal) {
            return '<tr><td><b>' + label + '</b></td><td>' + wt.toLocaleString('en-US') + ' kg</td><td>' + idx + '</td><td>MAC' + label + ' ' + fmtMac(macVal) + '</td><td>' + (alt ? 'DÉPASSE LIMITATION' : (ok ? 'OK' : 'HORS LIMITE')) + '</td></tr>';
        }
        const macZp = macForPoint(r.zfwIdx, r.zfw);
        const macTp = macForPoint(r.towIdx, r.tow);
        const macLp = macForPoint(r.lawIdx, r.law);
        let html = '<div style="overflow:hidden; margin-bottom:10px;">'
            + '<div style="float:right; width:170px;"><img src="logo BBJ.jpeg" class="wz-print-logo" style="width:170px; display:block;" alt="BBJ"></div>'
            + '<h1 style="margin:0;">NEW LOAD & BALANCE SHEET BBJ2</h1>'
            + '<div class="header-sub">CN-MVI | BBJ2 | S/N: 37545</div>'
            + '</div>';
        html += '<table class="data-table" style="width:100%; margin:10px 0 14px;"><tbody>'
            + '<tr><td><b>Origin</b></td><td>' + (orig || '—') + '</td><td><b>Destination</b></td><td>' + (dest || '—') + '</td></tr>'
            + '<tr><td><b>Flight N°</b></td><td>' + (num || '—') + '</td><td><b>Date</b></td><td>' + (fdate || '—') + '</td></tr>'
            + '<tr><td><b>Time (UTC)</b></td><td>' + (ftime || '—') + '</td><td><b>Prepared by</b></td><td>' + (prepName || '—') + '</td></tr>'
            + '<tr><td><b>Captain</b></td><td>' + (capName || '—') + '</td><td><b>Limitation du jour</b></td><td>' + lim.toLocaleString('en-US') + ' kg</td></tr>'
            + '</tbody></table>';
        html += '<table class="data-table" style="width:100%;"><thead><tr><th>Phase</th><th>Poids</th><th>Index</th><th>MAC</th><th>Statut</th></tr></thead><tbody>'
            + rowP('ZFW', r.zfw, r.zfwIdx, phaseInside('zfw', r.zfwIdx, r.zfw, r), false, macZp)
            + rowP('TOW', r.tow, r.towIdx, phaseInside('tow', r.towIdx, r.tow, r), r.tow > lim, macTp)
            + rowP('LAW', r.law, r.lawIdx, phaseInside('ldw', r.lawIdx, r.law, r), false, macLp)
            + '</tbody></table>';
        if (imgData) html += '<img src="' + imgData + '" class="wz-print-graph" style="width:100%;border:1px solid #000;">';
        const recapEl = document.getElementById('wz-recap');
        if (recapEl && recapEl.innerHTML) {
            html += '<div class="wz-print-recap">' + recapEl.innerHTML + '</div>';
        }
        if (appliedLog.length) {
            html += '<div><h2 style="font-size:14px;margin:12px 0 6px;">Corrections insérées</h2>'
                + '<table class="data-table" style="width:100%;"><thead><tr><th>#</th><th>Action</th><th>Phase ciblée</th><th>Heure</th></tr></thead><tbody>';
            appliedLog.forEach(function(a, i) {
                html += '<tr><td>' + (i + 1) + '</td><td>' + a.label + '</td><td>' + a.phase + '</td><td>' + a.time + '</td></tr>';
            });
            html += '</tbody></table></div>';
        }
        area.classList.add('wz-print');
        area.innerHTML = html;

        let pageStyle = document.getElementById('wz-page-style');
        if (!pageStyle) {
            pageStyle = document.createElement('style');
            pageStyle.id = 'wz-page-style';
            pageStyle.textContent = '@page { size: A4 portrait; margin: 10mm; }';
            document.head.appendChild(pageStyle);
        }
        window.print();
        window.addEventListener('afterprint', function cleanup() {
            window.removeEventListener('afterprint', cleanup);
            area.classList.remove('wz-print');
            const st = document.getElementById('wz-page-style');
            if (st) st.remove();
            area.innerHTML = '';
        });
    }

function macForPoint(idx, wtKg) {
        if (typeof BBJ_DATA === 'undefined' || !BBJ_DATA.macLines || !BBJ_DATA.macLines.length) return null;
        const y = wtKg / 1000;
        const rows = [];
        for (const ml of BBJ_DATA.macLines) {
            const p1 = ml.points[0], p2 = ml.points[1];
            if (p1[1] === p2[1]) continue;
            const x = p1[0] + (y - p1[1]) * (p2[0] - p1[0]) / (p2[1] - p1[1]);
            rows.push({ pct: ml.pct, x: x });
        }
        rows.sort(function(a, b) { return a.x - b.x; });
        const clean = [];
        for (const rw of rows) {
            if (!clean.length || clean[clean.length - 1].x !== rw.x) clean.push(rw);
        }
        if (clean.length < 2) return clean.length ? clean[0].pct : null;
        if (idx <= clean[0].x) {
            const a = clean[0], b = clean[1];
            return a.pct + (idx - a.x) * (b.pct - a.pct) / (b.x - a.x);
        }
        if (idx >= clean[clean.length - 1].x) {
            const a = clean[clean.length - 2], b = clean[clean.length - 1];
            return a.pct + (idx - a.x) * (b.pct - a.pct) / (b.x - a.x);
        }
        for (let i = 0; i < clean.length - 1; i++) {
            const a = clean[i], b = clean[i + 1];
            if (idx >= a.x && idx <= b.x) {
                return a.pct + (idx - a.x) * (b.pct - a.pct) / (b.x - a.x);
            }
        }
        return null;
    }

    function fmtMac(m) { return (m == null) ? '—' : ((Math.round(m * 10) / 10) + '%'); }

    function drawWizardChart() {
        const canvas = document.getElementById('wz-trim-canvas');
        if (!canvas || typeof window.calculate !== 'function' || typeof window.drawCanvas !== 'function') return;
        const co = document.getElementById('wz-charge-offerte');
        const mf = document.getElementById('wz-maxfuel');
        if (co) co.value = String(wizardPerfLimit() - correctedDow - blockFuelState - taxiFuelState);
        if (mf) mf.value = String(wizardPerfLimit() - azfwState);
        const r = window.calculate(wizardInputs());
        let envs = (typeof BBJ_DATA !== 'undefined' && BBJ_DATA.envelopes) ? BBJ_DATA.envelopes.slice() : [];
        if (envelopeFilter) envs = envs.filter(function(e) { return e.id === envelopeFilter; });
        const macLines = (typeof BBJ_DATA !== 'undefined' && BBJ_DATA.macLines) ? BBJ_DATA.macLines : [];
        const phaseMap = { zfw: ['zf'], tow: ['tow'], ldw: ['law'] };
        const phases = envelopeFilter ? (phaseMap[envelopeFilter] || null) : null;
        window.drawCanvas(canvas, r, { background: false, envelopes: envs, phases: phases, macLines: macLines });
        const sum = document.getElementById('wz-summary');
        if (sum) {
            const ENV_COLORS = { zfw: '#d97706', tow: '#92400e', ldw: '#0891b2' };
            function toggleSpan(envId, label, wt, idx, alert, out, macVal) {
                const active = envelopeFilter === envId;
                const red = alert || out;
                let style = '';
                if (active && !red) style = ' style="border-color:' + ENV_COLORS[envId] + '; background:#fff; font-weight:600;"';
                const cls = 'wz-sum-toggle' + (active ? ' active' : '') + (red ? ' wz-sum-alert' : '');
                const idxHtml = out ? '<span class="idx-alert">' + idx + ' HORS LIMITE</span>' : String(idx);
                return '<span class="' + cls + '" data-env="' + envId + '"' + style + '>'
                    + '<b>' + label + '</b> ' + wt.toLocaleString('en-US') + ' kg / idx ' + idxHtml
                    + ' — <span class="wz-mac">MAC' + label + ' ' + fmtMac(macVal) + '</span>'
                    + (alert ? ' — <b>\u26a0 D\u00c9PASSE LA LIMITATION DU JOUR</b>' : '')
                    + '</span>';
            }
            const lim = wizardPerfLimit();
            const macZ = macForPoint(r.zfwIdx, r.zfw);
            const macT = macForPoint(r.towIdx, r.tow);
            const macL = macForPoint(r.lawIdx, r.law);
            const zfwIn = phaseInside('zfw', r.zfwIdx, r.zfw, r);
            const towIn = phaseInside('tow', r.towIdx, r.tow, r);
            const lawIn = phaseInside('ldw', r.lawIdx, r.law, r);
            sum.innerHTML = '<div class="wz-sum-row">'
                + toggleSpan('zfw', 'ZFW', r.zfw, r.zfwIdx, false, !zfwIn, macZ)
                + toggleSpan('tow', 'TOW', r.tow, r.towIdx, r.tow > lim, !towIn, macT)
                + toggleSpan('ldw', 'LAW', r.law, r.lawIdx, false, !lawIn, macL)
                + '<span class="perf-limit-badge">\u26a0 Limitation du jour (Perf) : <b>' + lim.toLocaleString('en-US') + ' kg</b></span>'
                + '</div>';
            sum.querySelectorAll('.wz-sum-toggle').forEach(function(sp) {
                sp.addEventListener('click', function() {
                    const id = this.dataset.env;
                    envelopeFilter = (envelopeFilter === id) ? null : id;
                    drawWizardChart();
                });
            });
        }
        const suggEl = document.getElementById('wz-suggestions');
        if (suggEl) {
            const suggs = buildSuggestions(r);
            lastSuggestions = suggs;
            let sh = '';
            suggs.forEach(function(s) {
                sh += '<div class="wz-sugg-block"><div class="wz-sugg-title">' + s.title + ' — propositions :</div>';
                s.props.forEach(function(p, i) {
                    sh += '<button type="button" class="wz-prop" data-skey="' + s.key + '" data-pidx="' + i + '">→ ' + p.label + '</button>';
                });
                sh += '</div>';
            });
            suggEl.innerHTML = sh;
            suggEl.querySelectorAll('.wz-prop').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    const skey = this.dataset.skey;
                    const pidx = parseInt(this.dataset.pidx, 10);
                    const s = lastSuggestions.find(function(x) { return x.key === skey; });
                    if (s && s.props[pidx]) applyProposal(s.props[pidx]);
                });
            });
        }
        const recapEl = document.getElementById('wz-recap');
        if (recapEl) {
            function fmtIdx(v) { return (v > 0 ? '+' : '') + (Math.round(v * 100) / 100); }
            const px = function(n, z) { return (typeof getPaxIndex === 'function') ? getPaxIndex(n, z) : 0; };
            const lidx = function(z) { return (typeof getGalleyIndexInterp === 'function') ? getGalleyIndexInterp(wzState.load[z], z) : 0; };
            const zonePaxIdx = { B: px(wzState.staff + wzState.extracc, 'S'), D: px(wzState.premium, 'P'), E: px(wzState.viplounge, 'L'), F: px(wzState.vipoffice, 'O'), G: 0 };
            const zonePaxCnt = { B: wzState.staff, D: wzState.premium, E: wzState.viplounge, F: wzState.vipoffice, G: 0 };
            let totalPaxIdx = 0, totalLoad = 0, totalLoadIdx = 0;
            ['B', 'D', 'E', 'F', 'G'].forEach(function(z) { totalPaxIdx += zonePaxIdx[z]; });
            ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(function(z) { totalLoad += wzState.load[z]; totalLoadIdx += lidx(z); });
            const fwdIdx = (typeof vlookupTrue !== 'undefined') ? vlookupTrue(BBJ_DATA.cargoIndex.FWD, 'wt', wzState.fwdhold).idx : 0;
            const aftIdx = (typeof vlookupTrue !== 'undefined') ? vlookupTrue(BBJ_DATA.cargoIndex.AFT, 'wt', wzState.afthold).idx : 0;
            let rh = '<div class="wizard-section" style="margin-top:16px;">'
                + '<h2 class="section-title">Récapitulatif PAX & Load par zone</h2>'
                + '<div class="table-scroll"><table class="data-table wz-recap-table"><thead><tr>'
                + '<th>Zone</th><th>PAX</th><th>Index PAX</th><th>Load (kg)</th><th>Index Load</th></tr></thead><tbody>';
            ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(function(z) {
                const paxCell = (z === 'B')
                    ? (zonePaxCnt.B + (wzState.extracc ? ' +' + wzState.extracc + ' CC' : ''))
                    : (z === 'A' || z === 'C' ? '—' : String(zonePaxCnt[z]));
                const idxCell = (z === 'A' || z === 'C') ? '—' : fmtIdx(zonePaxIdx[z] || 0);
                const ccNote = (z === 'B') ? '<span class="wz-note">S(' + (wzState.staff + wzState.extracc) + ')</span>' : '';
                rh += '<tr><td><b>Zone ' + z + '</b></td><td>' + paxCell + '</td><td>' + idxCell + (ccNote ? ' ' + ccNote : '') + '</td>'
                    + '<td>' + wzState.load[z] + '</td><td>' + fmtIdx(lidx(z)) + '</td></tr>';
            });
            const totalPaxCount = wzState.staff + wzState.premium + wzState.viplounge + wzState.vipoffice;
            rh += '<tr><td><b>FWD HOLD</b></td><td>—</td><td>—</td><td>' + wzState.fwdhold + '</td><td>' + fmtIdx(fwdIdx) + '</td></tr>'
                + '<tr><td><b>AFT HOLD</b></td><td>—</td><td>—</td><td>' + wzState.afthold + '</td><td>' + fmtIdx(aftIdx) + '</td></tr>'
                + '<tr class="wz-recap-total"><td><b>TOTAL</b></td><td><b>' + totalPaxCount + '</b></td><td><b>' + fmtIdx(totalPaxIdx) + '</b></td>'
                + '<td><b>' + (totalLoad + wzState.fwdhold + wzState.afthold) + '</b></td><td><b>' + fmtIdx(totalLoadIdx + fwdIdx + aftIdx) + '</b></td></tr>';
            rh += '</tbody></table></div>'
                + '<div class="wz-note" style="margin-top:6px;">Index total avant DOI : DOI ' + correctedDoi + ' ' + fmtIdx(totalPaxIdx) + ' ' + fmtIdx(totalLoadIdx + fwdIdx + aftIdx) + ' = <b>' + r.zfwIdx + '</b></div>'
                + '</div>';
            recapEl.innerHTML = rh;
        }
        const appEl = document.getElementById('wz-applied');
        if (appEl) {
            if (appliedLog.length) {
                let ah = '<div class="wizard-section" style="margin-top:16px;">'
                    + '<h2 class="section-title">Corrections insérées</h2>'
                    + '<table class="data-table wz-applied-table"><thead><tr><th>#</th><th>Action</th><th>Phase ciblée</th><th>Heure</th></tr></thead><tbody>';
                appliedLog.forEach(function(a, i) {
                    ah += '<tr><td>' + (i + 1) + '</td><td>' + a.label + '</td><td>' + a.phase + '</td><td>' + a.time + '</td></tr>';
                });
                ah += '</tbody></table></div>';
                appEl.innerHTML = ah;
            } else {
                appEl.innerHTML = '';
            }
        }
    }

    function initResume() {
        drawWizardChart();
        const pbtn = document.getElementById('wz-print-btn');
        if (pbtn && !pbtn._bound) {
            pbtn._bound = true;
            pbtn.addEventListener('click', printWizReport);
        }
    }

    function currentPerfLimit(block, taxi, trip) {
        return Math.min(wzState.perftow, wzState.perfldg + trip, wzState.perfzwf + block - taxi);
    }

    function wizardPerfLimit() {
        return currentPerfLimit(blockFuelState, taxiFuelState, wzState.tripfuel);
    }

    const stepCache = {};
    const STEPS = [
        { name: 'Flight Info', render: renderFlightInfo, init: initFlightInfo },
        { name: 'Configuration', render: renderConfig, init: initConfig },
        { name: 'Performance Limitations & Fuel', render: renderFuel, init: initFuel },
        { name: 'Staff, Pax, Load & Cargo', render: renderCargo, init: initCargo },
        { name: 'Resume & Save', render: renderResume, init: initResume, refresh: drawWizardChart }
    ];

    function renderSteps() {
        const el = document.getElementById('wizard-steps');
        if (!el) return;
        let html = '';
        STEPS.forEach((s, i) => {
            const cls = 'wizard-step' + (i === current ? ' active' : (i < current ? ' done' : ''));
            html += '<div class="wizard-step ' + cls + '"><span class="ws-num">Étape ' + (i + 1) + '/' + STEPS.length + '</span>' + s.name + '</div>';
        });
        el.innerHTML = html;
    }

    function renderContent() {
        const el = document.getElementById('wizard-content');
        if (!el) return;
        const step = STEPS[current];
        if (!step) return;
        if (!stepCache[current]) {
            const div = document.createElement('div');
            div.className = 'wz-step';
            if (step.render) {
                div.innerHTML = step.render();
            } else {
                div.innerHTML = '<div class="wizard-placeholder"><strong>Étape ' + (current + 1) + ' : ' + step.name + '</strong><br><br>À configurer.</div>';
            }
            stepCache[current] = div;
        }
        while (el.firstChild) el.removeChild(el.firstChild);
        el.appendChild(stepCache[current]);
        if (!stepCache[current]._inited) {
            stepCache[current]._inited = true;
            if (step.init) {
                try { step.init(); } catch (e) { if (window.console) console.error('wizard init "' + step.name + '"', e); }
            }
        }
        if (step.refresh) {
            try { step.refresh(); } catch (e) { if (window.console) console.error('wizard refresh "' + step.name + '"', e); }
        }
    }

    function update() {
        renderSteps();
        renderContent();
        const prev = document.getElementById('wizard-prev');
        const next = document.getElementById('wizard-next');
        if (prev) prev.disabled = current === 0;
        if (next) next.textContent = current === STEPS.length - 1 ? 'Save & Close' : 'Suivant →';
    }

    function go(i) {
        current = Math.max(0, Math.min(STEPS.length - 1, i));
        update();
    }

function saveWizardFlight() {
        if (!window.FLIGHTS || typeof window.calculate !== 'function') {
            alert('Enregistrement indisponible.');
            return;
        }
        const root = stepCache[0] || document;
        const cfgRoot = stepCache[1] || document;
        const numEl = root.querySelector('#wz-flight');
        const dateEl = root.querySelector('#wz-date');
        const timeEl = root.querySelector('#wz-time');
        const prepEl = root.querySelector('#wz-preparedby');
        const capEl = root.querySelector('#wz-captain');
        const origP = root.querySelector('#wz-origin-picker');
        const destP = root.querySelector('#wz-dest-picker');
        const obsEl = cfgRoot.querySelector('#wz-observers');
        const ccEl = cfgRoot.querySelector('#wz-cabincrew');
        const xccEl = cfgRoot.querySelector('#wz-extracc');
        const crew = window.CREW ? window.CREW.list() : [];
        function crewName(mr) {
            const m = crew.find(function(x) { return x.matricule === mr; });
            return m ? m.nom : '';
        }
        const r = window.calculate(wizardInputs());
        const record = {
            source: 'wizard',
            flight: {
                number: 'MRS' + String((numEl && numEl.value) || '').replace(/\D/g, ''),
                date: dateEl ? dateEl.value : '',
                time: timeEl ? timeEl.value : '',
                origin: (origP && origP._getIcao) ? origP._getIcao() : '',
                dest: (destP && destP._getIcao) ? destP._getIcao() : '',
                preparedBy: prepEl ? prepEl.value : '',
                preparedByName: crewName(prepEl ? prepEl.value : ''),
                captain: capEl ? capEl.value : '',
                captainName: crewName(capEl ? capEl.value : '')
            },
            config: {
                vip: 1,
                pilots: 2,
                observers: obsEl ? +obsEl.value : 0,
                cabincrew: ccEl ? +ccEl.value : 0,
                extracc: xccEl ? +xccEl.value : 0,
                staff: wzState.staff,
                premium: wzState.premium,
                vipLounge: wzState.viplounge,
                vipOffice: wzState.vipoffice,
                vipSuite: 0,
                correctedDow: correctedDow,
                correctedDoi: correctedDoi
            },
            fuel: { block: blockFuelState, taxi: taxiFuelState, trip: wzState.tripfuel },
            load: {
                fwd: wzState.fwdhold,
                aft: wzState.afthold,
                zoneBOther: 0,
                water: 120,
                fwdGalley: 0,
                midGalley: 0,
                zoneLoad: {
                    A: wzState.load.A, B: wzState.load.B, C: wzState.load.C,
                    D: wzState.load.D, E: wzState.load.E, F: wzState.load.F, G: wzState.load.G
                },
                payload: payloadState,
                azfw: azfwState
            },
            results: {
                dow: r.dow, doi: r.doi,
                paxBagWt: r.paxBagWt, paxIdx: r.paxIdx,
                cargoWt: r.cargoWt, cargoIdx: r.cargoIdx,
                zoneWt: r.zoneWt, zoneIdx: r.zoneIdx,
                zfw: r.zfw, zfwIdx: r.zfwIdx, mzfw: r.mzfw,
                toFuel: r.toFuel, toFuelIdx: r.toFuelIdx,
                tow: r.tow, towIdx: r.towIdx, mtow: r.mtow,
                tripFuel: r.tripFuel,
                law: r.law, lawIdx: r.lawIdx, mlw: r.mlw,
                rampWt: r.rampWt, underload: r.underload, underloadAfterLMC: r.underloadAfterLMC,
                checks: r.checks,
                perfLimit: wizardPerfLimit()
            }
        };
        window.FLIGHTS.add(record);
        window.FLIGHTS.render();
        window.FLIGHTS.renderHistory();

        // Enregistrement automatique en Flight Log dans tous les cas
        let flRecordId = null;
        if (window.FLIGHTLOG && typeof window.FLIGHTLOG.createFromWizard === 'function') {
            const capMember = crew.find(function(x) { return x.matricule === (capEl ? capEl.value : ''); });
            const prepMember = crew.find(function(x) { return x.matricule === (prepEl ? prepEl.value : ''); });
            flRecordId = window.FLIGHTLOG.createFromWizard({
                flightNumber: record.flight.number,
                date: record.flight.date,
                time: record.flight.time,
                origin: record.flight.origin,
                dest: record.flight.dest,
                captainMatricule: capEl ? capEl.value : '',
                captainName: capMember ? capMember.nom : '',
                captainPosit: (capMember && (capMember.posit || capMember.grade)) || 'CDB',
                preparedByMatricule: prepEl ? prepEl.value : '',
                preparedByName: prepMember ? prepMember.nom : '',
                preparedByPosit: (prepMember && (prepMember.posit || prepMember.grade || prepMember.fonction)) || 'OPL'
            });
        }

        // Afficher le popup de confirmation (Ouvrir Flight Log ou Rester ici)
        const modal = document.getElementById('wz-confirm-modal');
        const btnStay = document.getElementById('btn-wz-stay');
        const btnOpenFl = document.getElementById('btn-wz-open-fl');

        if (modal) {
            modal.classList.add('show');

            btnStay.onclick = function() {
                modal.classList.remove('show');
                go(0);
                if (typeof toast === 'function') {
                    toast('Vol et rapport Flight Log enregistrés avec succès !');
                }
            };

            btnOpenFl.onclick = function() {
                modal.classList.remove('show');
                go(0);

                // Basculer l'onglet vers Flight Log
                document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
                document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
                const flNav = document.querySelector('.nav-item[data-panel="flightlog"]');
                if (flNav) flNav.classList.add('active');
                const flPanel = document.getElementById('panel-flightlog');
                if (flPanel) flPanel.classList.add('active');

                // Ouvrir immédiatement le rapport pré-rempli
                if (window.FLIGHTLOG && flRecordId) {
                    window.FLIGHTLOG.openPopup(flRecordId);
                }
            };
        } else {
            go(0);
            if (typeof toast === 'function') {
                toast('Vol enregistré (wizard) — ' + record.flight.number + ' ' + (record.flight.origin || '') + '→' + (record.flight.dest || ''));
            }
        }
    }

    function init() {
        update();
        updateTelemetryStrip();

        // Clocks (UTC Date & UTC Time)
        function updateWzClocks() {
            const now = new Date();
            const zh = String(now.getUTCHours()).padStart(2, '0');
            const zm = String(now.getUTCMinutes()).padStart(2, '0');
            const zEl = document.getElementById('wz-clock-zulu');
            if (zEl) zEl.textContent = zh + ':' + zm + ' UTC';

            const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            const d = String(now.getUTCDate()).padStart(2, '0');
            const m = months[now.getUTCMonth()];
            const y = now.getUTCFullYear();
            const dEl = document.getElementById('wz-clock-date');
            if (dEl) dEl.textContent = d + '-' + m + '-' + y;
        }
        setInterval(updateWzClocks, 1000);
        updateWzClocks();

        // Theme Toggle (Jour / Nuit Cockpit — Global & Persistent across entire app)
        const themeBtn = document.getElementById('wz-theme-toggle');
        const newcalcPanel = document.getElementById('panel-newcalc');
        const themeIcon = document.getElementById('wz-theme-icon');
        const themeLabel = document.getElementById('wz-theme-label');

        function applyCockpitTheme(isLight) {
            document.body.classList.toggle('efb-light-mode', isLight);
            document.body.classList.toggle('cockpit-night-mode', !isLight);
            if (newcalcPanel) newcalcPanel.classList.toggle('efb-light-mode', isLight);
            if (themeIcon) themeIcon.textContent = isLight ? '☀️' : '🌙';
            if (themeLabel) themeLabel.textContent = isLight ? 'JOUR' : 'NUIT';

            const gBtn = document.getElementById('global-theme-toggle');
            if (gBtn) {
                const gIcon = gBtn.querySelector('.theme-icon');
                const gText = gBtn.querySelector('.theme-text');
                if (gIcon) gIcon.textContent = isLight ? '☀️' : '🌙';
                if (gText) gText.textContent = isLight ? 'Mode Jour' : 'Mode Nuit';
            }
            const mBtn = document.getElementById('mobile-theme-toggle');
            if (mBtn) {
                mBtn.textContent = isLight ? '☀️' : '🌙';
                mBtn.title = isLight ? 'Passer en Mode Nuit' : 'Passer en Mode Jour';
            }

            try { localStorage.setItem('bbj_cockpit_theme', isLight ? 'light' : 'night'); } catch(e) {}
            if (typeof drawWizardChart === 'function') {
                setTimeout(drawWizardChart, 40);
            }
            if (typeof drawCanvas === 'function') {
                setTimeout(drawCanvas, 40);
            }
        }
        window.applyCockpitTheme = applyCockpitTheme;

        // Default to Night Mode or restore user preference
        let savedCockpitTheme = 'night';
        try { savedCockpitTheme = localStorage.getItem('bbj_cockpit_theme') || 'night'; } catch(e) {}
        applyCockpitTheme(savedCockpitTheme === 'light');

        function handleThemeToggle() {
            const isCurrentlyLight = document.body.classList.contains('efb-light-mode');
            applyCockpitTheme(!isCurrentlyLight);
        }

        if (themeBtn) themeBtn.addEventListener('click', handleThemeToggle);
        const globalThemeBtn = document.getElementById('global-theme-toggle');
        if (globalThemeBtn) globalThemeBtn.addEventListener('click', handleThemeToggle);
        const mobileThemeBtn = document.getElementById('mobile-theme-toggle');
        if (mobileThemeBtn) mobileThemeBtn.addEventListener('click', handleThemeToggle);

        const prev = document.getElementById('wizard-prev');
        const next = document.getElementById('wizard-next');
        if (prev) prev.addEventListener('click', function() { go(current - 1); });
        if (next) next.addEventListener('click', function() {
            if (current === STEPS.length - 1) {
                saveWizardFlight();
                return;
            }
            go(current + 1);
        });
        window.addEventListener('resize', function() {
            if (current === STEPS.length - 1) drawWizardChart();
        });
        const content = document.getElementById('wizard-content');
        if (content) {
            content.addEventListener('input', syncState);
            content.addEventListener('change', syncState);
        }
    }

    return { init, go, get current() { return current; } };
})();

document.addEventListener('DOMContentLoaded', function() {
    window.BBJ_WIZARD.init();
});