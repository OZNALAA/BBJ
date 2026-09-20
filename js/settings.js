function cellText(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (typeof v === 'number') {
        if (Number.isInteger(v)) return v.toLocaleString('en-US');
        return v.toLocaleString('en-US', { maximumFractionDigits: 6 });
    }
    return String(v);
}

function colLetter(n) {
    let s = '';
    while (n > 0) {
        n--;
        s = String.fromCharCode(65 + (n % 26)) + s;
        n = Math.floor(n / 26);
    }
    return s;
}

function renderSettingsTable(key) {
    const src = BBJ_RAW[key];
    if (!src) return;
    const grid = src.grid;
    const cols = grid.maxCol;
    const rows = grid.rows;

    const tabs = document.getElementById('settings-tabs');
    if (tabs.dataset.active !== key) {
        tabs.querySelectorAll('.settings-tab').forEach(t => t.classList.toggle('active', t.dataset.sheet === key));
        tabs.dataset.active = key;
    }

    const thead = document.querySelector('#settings-table thead');
    const tbody = document.querySelector('#settings-table tbody');
    let html = '<tr>';
    for (let c = 1; c <= cols; c++) html += '<th>' + colLetter(c) + '</th>';
    html += '</tr>';
    thead.innerHTML = html;

    let renderedCount = 0;
    const CHUNK = 80;

    function renderChunk() {
        let chunkHtml = '';
        const limit = Math.min(renderedCount + CHUNK, rows.length);
        for (let i = renderedCount; i < limit; i++) {
            const row = rows[i];
            chunkHtml += '<tr>';
            for (let c = 0; c < cols; c++) chunkHtml += '<td>' + cellText(row[c]) + '</td>';
            chunkHtml += '</tr>';
        }
        renderedCount = limit;
        if (renderedCount <= CHUNK) {
            tbody.innerHTML = chunkHtml;
        } else {
            tbody.insertAdjacentHTML('beforeend', chunkHtml);
        }

        const meta = document.querySelector('.settings-meta');
        if (meta) {
            meta.innerHTML = src.name + ' — ' + renderedCount + ' / ' + rows.length + ' lignes'
                + (renderedCount < rows.length ? ' <button type="button" class="btn btn-sm btn-accent load-more-btn" style="margin-left:8px;">Charger plus</button>' : '');
            const moreBtn = meta.querySelector('.load-more-btn');
            if (moreBtn) moreBtn.addEventListener('click', renderChunk);
        }
    }

    renderChunk();
}

function initSettingsTabs() {
    const tabs = document.getElementById('settings-tabs');
    const keys = Object.keys(BBJ_RAW);
    let html = '';
    keys.forEach((k) => {
        const src = BBJ_RAW[k];
        const name = (src && src.name) ? src.name : k;
        html += '<button class="settings-tab" data-sheet="' + k + '">' + name + '</button>';
    });
    html += '<span class="settings-meta"></span>';
    tabs.innerHTML = html;
    tabs.dataset.active = '';

    const wrap = document.querySelector('.settings-table-wrap');
    if (wrap) wrap.style.display = 'none';

    tabs.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            renderSettingsTable(this.dataset.sheet);
            if (wrap) wrap.style.display = '';
        });
    });
}

document.addEventListener('DOMContentLoaded', initSettingsTabs);

/* ===== AIRCRAFT WEIGHT AND BALANCE (table éditable) ===== */
var AWB_KEY = 'bbj_awb';
var AWB_DEFAULT = { rev: 'FWB001-2022', date: '2022-04-15', dow: 48704, doi: 42.72 };

function awbEscape(s) {
    return String(s).replace(/[&<>"']/g, function(c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function awbLoad() {
    try {
        var s = JSON.parse(localStorage.getItem(AWB_KEY));
        if (s && s.rev) {
            var d = {};
            for (var k in AWB_DEFAULT) d[k] = AWB_DEFAULT[k];
            for (var k2 in s) if (AWB_DEFAULT[k2] !== undefined) d[k2] = s[k2];
            return d;
        }
    } catch (e) {}
    return Object.assign({}, AWB_DEFAULT);
}

function awbPersist(d) {
    localStorage.setItem(AWB_KEY, JSON.stringify(d));
}

function awbFormatFr(iso) {
    if (!iso) return '';
    var p = String(iso).split('-');
    return (p.length === 3) ? p[2] + '/' + p[1] + '/' + p[0] : String(iso);
}

function awbApply(d) {
    document.getElementById('awb-rev').textContent = d.rev;
    document.getElementById('awb-date').textContent = awbFormatFr(d.date);
    document.getElementById('awb-dow').textContent = String(d.dow);
    document.getElementById('awb-doi').textContent = String(d.doi).replace('.', ',');
}

function awbStartEdit(d) {
        if (!confirm('Modifier les données du tableau AIRCRAFT WEIGHT AND BALANCE ?')) return;
        document.getElementById('awb-rev').innerHTML = '<input type="text" id="awb-i-rev" class="input-field" value="' + awbEscape(d.rev) + '">';
    document.getElementById('awb-date').innerHTML = '<input type="date" id="awb-i-date" class="input-field" value="' + awbEscape(d.date) + '">';
    document.getElementById('awb-dow').innerHTML = '<input type="text" id="awb-i-dow" class="input-field" inputmode="numeric" value="' + d.dow + '">';
    document.getElementById('awb-doi').innerHTML = '<input type="text" id="awb-i-doi" class="input-field" inputmode="decimal" value="' + String(d.doi).replace('.', ',') + '">';

    document.getElementById('awb-i-dow').addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
    });
    document.getElementById('awb-i-doi').addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9,]/g, '');
    });

    var btn = document.getElementById('awb-edit-btn');
    btn.textContent = 'Save';
    document.getElementById('awb-cancel-btn').style.display = '';
}

function awbStopEdit() {
    var btn = document.getElementById('awb-edit-btn');
    btn.textContent = 'Edit';
    document.getElementById('awb-cancel-btn').style.display = 'none';
}

function awbSaveEdit() {
    var d = awbLoad();
    d.rev = document.getElementById('awb-i-rev').value.trim();
    d.date = document.getElementById('awb-i-date').value;
    var dow = parseInt(document.getElementById('awb-i-dow').value, 10);
    if (isNaN(dow)) dow = 0;
    var doiTxt = document.getElementById('awb-i-doi').value.replace(',', '.');
    var doi = parseFloat(doiTxt);
    if (isNaN(doi)) doi = 0;
    d.dow = dow;
    d.doi = doi;

    if (!d.rev) { alert('Rev est requis.'); return; }
    if (!d.date) { alert('Date requise.'); return; }

    awbPersist(d);
    awbApply(d);
    awbStopEdit();
}

function initAwb() {
    var d = awbLoad();
    awbApply(d);
    document.getElementById('awb-edit-btn').addEventListener('click', function() {
        if (this.textContent === 'Save') awbSaveEdit();
        else awbStartEdit(awbLoad());
    });
    document.getElementById('awb-cancel-btn').addEventListener('click', function() {
        awbApply(awbLoad());
        awbStopEdit();
    });
}

function initBackupListeners() {
    const exportBtn = document.getElementById('btn-backup-export');
    const importTrigger = document.getElementById('btn-backup-import-trigger');
    const fileInput = document.getElementById('inp-backup-file');

    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const data = {
                exportDate: new Date().toISOString(),
                app: "BBJ Load & Balance",
                crew: (window.CREW ? window.CREW.list() : []) || [],
                users: (window.USERS ? window.USERS.list() : []) || [],
                flights: (window.FLIGHTS ? window.FLIGHTS.list() : []) || [],
                flightlog: (window.FLIGHTLOG ? window.FLIGHTLOG.get() : []) || [],
                awb: awbLoad()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const now = new Date().toISOString().slice(0, 10);
            a.href = url;
            a.download = `BBJ_Backup_${now}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    if (importTrigger && fileInput) {
        importTrigger.addEventListener('click', function() {
            fileInput.click();
        });

        fileInput.addEventListener('change', function(e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const parsed = JSON.parse(evt.target.result);
                    if (!confirm('Voulez-vous importer cette sauvegarde ? Les données actuelles seront complétées.')) return;

                    if (Array.isArray(parsed.crew)) {
                        localStorage.setItem('bbj_crew', JSON.stringify(parsed.crew));
                        fetch('/api/data?file=crew', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-Session-Token': localStorage.getItem('bbj_token') || '' },
                            body: JSON.stringify({ data: parsed.crew })
                        }).catch(() => {});
                    }
                    if (Array.isArray(parsed.flights)) {
                        localStorage.setItem('bbj_flights', JSON.stringify(parsed.flights));
                        fetch('/api/data?file=flights', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-Session-Token': localStorage.getItem('bbj_token') || '' },
                            body: JSON.stringify({ data: parsed.flights })
                        }).catch(() => {});
                    }
                    if (Array.isArray(parsed.flightlog)) {
                        localStorage.setItem('bbj_flightlog_records', JSON.stringify(parsed.flightlog));
                        fetch('/api/data?file=flightlog', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-Session-Token': localStorage.getItem('bbj_token') || '' },
                            body: JSON.stringify({ data: parsed.flightlog })
                        }).catch(() => {});
                    }
                    if (parsed.awb) {
                        awbPersist(parsed.awb);
                        awbApply(parsed.awb);
                    }

                    alert('Sauvegarde importée avec succès ! La page va se recharger.');
                    window.location.reload();
                } catch (err) {
                    alert('Erreur lors de la lecture du fichier JSON: ' + err.message);
                }
            };
            reader.readAsText(file);
            fileInput.value = '';
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initAwb();
    initBackupListeners();
});