/* js/trim.js — Graphique TRIM SHEET (Index vs Gross Weight) */
(function() {
    const PHASES = [
        { key: 'zf',  label: 'ZFW', color: '#dc2626' },
        { key: 'tow', label: 'TOW', color: '#2563eb' },
        { key: 'law', label: 'LAW', color: '#16a34a' }
    ];

    const IMG_SRC = 'trim graph.jpeg';
    const img = new Image();
    img.src = IMG_SRC;

    function ctx2d(canvas) {        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const w = Math.max(rect.width, 10);
        const h = Math.max(rect.height, 10);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        return { ctx, w, h };
    }

    function hexToRgba(hex, alpha) {
        const h = String(hex).replace('#', '');
        const n = parseInt(h.length === 3 ? h.split('').map(function(c) { return c + c; }).join('') : h, 16);
        return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
    }

    function drawCanvas(canvas, r, opts) {
        opts = opts || {};
        const useBg = opts.background !== false;
        const { ctx, w, h } = ctx2d(canvas);

        const padL = 52, padR = 14, padT = 34, padB = 26;
        const pw = w - padL - padR;
        const ph = h - padT - padB;

        const xMin = 0, xMax = 100, yMin = 36, yMax = 82;

        function X(v) { return padL + ((v - xMin) / (xMax - xMin)) * pw; }
        function Y(v) { return padT + ph - ((v - yMin) / (yMax - yMin)) * ph; }

        const isLight = document.body.classList.contains('efb-light-mode') || (canvas && canvas.closest && canvas.closest('.efb-light-mode'));
        const titleColor = isLight ? '#0F172A' : '#F1F5F9';
        const axisColor = isLight ? '#334155' : '#CBD5E1';
        const tickColor = isLight ? '#64748B' : '#94A3B8';
        const borderColor = isLight ? '#CBD5E1' : '#334155';
        const gridColor = isLight ? '#E2E8F0' : '#243040';

        // Title
        ctx.fillStyle = titleColor;
        ctx.font = 'bold 13px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TRIM SHEET', padL + pw / 2, 14);

        // Background image (borders = axes limits)
        if (useBg && img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(padL, padT, pw, ph);
            ctx.clip();
            ctx.drawImage(img, padL, padT, pw, ph);
            ctx.restore();
        } else {
            // Fallback grid while image loads
            ctx.font = '10px Arial, sans-serif';
            ctx.lineWidth = 1;
            for (let v = xMin; v <= xMax; v += 10) {
                const x = X(v);
                ctx.strokeStyle = gridColor;
                ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + ph); ctx.stroke();
            }
            for (let v = yMin; v <= yMax; v += 5) {
                const y = Y(v);
                ctx.strokeStyle = gridColor;
                ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + pw, y); ctx.stroke();
            }
        }

        // Tick labels
        ctx.font = '10px Arial, sans-serif';
        ctx.fillStyle = tickColor;
        ctx.lineWidth = 1;
        ctx.textAlign = 'center';
        for (let v = xMin; v <= xMax; v += 10) {
            ctx.fillText(String(v), X(v), padT + ph + 14);
        }
        ctx.textAlign = 'right';
        for (let v = yMin; v <= yMax; v += 5) {
            ctx.fillText(String(v), padL - 6, Y(v));
        }

        // Border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(padL, padT, pw, ph);

        // Axis titles
        ctx.font = 'bold 11px Arial, sans-serif';
        ctx.fillStyle = axisColor;
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(16, padT + ph / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('GROSS WT/1000 (kg)', 0, 0);
        ctx.restore();
        ctx.fillText('INDEX', padL + pw / 2, h - 6);

        // Lignes %MAC (arrière-plan)
        const macLines = (opts.macLines && opts.macLines.length) ? opts.macLines : null;
        if (macLines) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(padL, padT, pw, ph);
            ctx.clip();
            for (const ml of macLines) {
                if (!ml.points || ml.points.length < 2) continue;
                ctx.beginPath();
                ml.points.forEach(function(pt, i) {
                    const x = X(pt[0]), y = Y(pt[1]);
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                });
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 2.5;
                ctx.setLineDash([10, 6]);
                ctx.stroke();
                ctx.setLineDash([]);
                if (ml.label !== false) {
                    const isOdd = (ml.pct % 2 !== 0);
                    const t = isOdd ? 0.74 : 0.48; // Impairs au centre en haut, pairs au centre
                    const p0 = ml.points[0];
                    const p1 = ml.points[1];
                    const midX = p0[0] + t * (p1[0] - p0[0]);
                    const midY = p0[1] + t * (p1[1] - p0[1]);
                    const px = X(midX);
                    const py = Y(midY);

                    const txt = ml.pct + '%';
                    ctx.font = 'bold 9px Arial, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    const tw = ctx.measureText(txt).width;
                    const padX = 2.5;
                    const padY = 5;

                    const canvasBg = isLight ? '#ffffff' : '#141A22';
                    ctx.fillStyle = canvasBg;
                    ctx.fillRect(px - tw / 2 - padX, py - padY, tw + padX * 2, padY * 2);

                    ctx.fillStyle = isLight ? '#334155' : '#cbd5e1';
                    ctx.fillText(txt, px, py);
                }
            }
            ctx.restore();
        }

        // Envelopes (limites)
        const envelopes = (opts.envelopes && opts.envelopes.length) ? opts.envelopes : null;
        const fuelKg = (opts.fuelKg != null) ? opts.fuelKg : (r ? r.blockFuel : 0);
        function condActive(item) {
            if (!item || !item.when) return true;
            try { return !!item.when(r, fuelKg); } catch (e) { return true; }
        }
        if (envelopes) {
            for (const env of envelopes) {
                if (!env.points || !env.points.length) continue;
                ctx.beginPath();
                env.points.forEach(function(pt, i) {
                    const x = X(pt[0]), y = Y(pt[1]);
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                });
                ctx.closePath();
                ctx.fillStyle = hexToRgba(env.color, 0.06);
                if (!env.dashed) ctx.fill('nonzero');
                ctx.strokeStyle = env.color;
                ctx.lineWidth = 1.5;
                ctx.setLineDash(env.dashed ? [6, 4] : []);
                ctx.stroke();
                ctx.setLineDash([]);
                if (env.cutouts && env.cutouts.length) {
                    env.cutouts.forEach(function(cut) {
                        if (!condActive(cut)) return;
                        const line = (cut && cut.points) ? cut.points : cut;
                        const lcolor = (cut && cut.color) ? cut.color : env.color;
                        ctx.beginPath();
                        line.forEach(function(pt, i) {
                            const x = X(pt[0]), y = Y(pt[1]);
                            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                        });
                        ctx.strokeStyle = lcolor;
                        ctx.lineWidth = 1.5;
                        ctx.setLineDash([]);
                        ctx.stroke();
                    });
                }
                const forbiddenZones = (env.forbidden && env.forbidden.length) ? env.forbidden : [];
                forbiddenZones.forEach(function(fz) {
                    if (!fz.points || !fz.points.length) return;
                    if (!condActive(fz)) return;
                    ctx.beginPath();
                    fz.points.forEach(function(pt, i) {
                        const x = X(pt[0]), y = Y(pt[1]);
                        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    });
                    ctx.closePath();
                    ctx.fillStyle = hexToRgba(fz.color, 0.12);
                    ctx.fill('nonzero');
                    ctx.strokeStyle = fz.color;
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([6, 4]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    let cx = 0, cy = 0;
                    fz.points.forEach(function(pt) { cx += pt[0]; cy += pt[1]; });
                    cx /= fz.points.length; cy /= fz.points.length;
                    const lines = String(fz.note || '').split('\n');
                    ctx.fillStyle = fz.color;
                    ctx.font = 'bold 11px Arial, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    lines.forEach(function(ln, i) {
                        ctx.fillText(ln, X(cx), Y(cy) + (i - (lines.length - 1) / 2) * 14);
                    });
                });
            }
        }

        // Phase lines
        const phaseFilter = (opts.phases && opts.phases.length) ? opts.phases : null;
        for (const p of PHASES) {
            if (phaseFilter && phaseFilter.indexOf(p.key) === -1) continue;
            const wt = p.key === 'zf' ? r.zfw : (p.key === 'tow' ? r.tow : r.law);
            const idx = p.key === 'zf' ? r.zfwIdx : (p.key === 'tow' ? r.towIdx : r.lawIdx);
            if (wt == null || idx == null) continue;
            const w2 = wt / 1000;
            const y = Y(w2), x = X(idx);

            // Crosshair horizontal & vertical
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1.4;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.moveTo(padL, y); ctx.lineTo(padL + pw, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, padT); ctx.lineTo(x, padT + ph);
            ctx.stroke();
            ctx.setLineDash([]);

            // Ligne oblique de lecture % MAC passant par le point (parallèle aux lignes de MAC)
            if (typeof BBJ_DATA !== 'undefined' && BBJ_DATA.macLines) {
                const lines = BBJ_DATA.macLines;
                const dists = lines.map(function(ml) {
                    const p1 = ml.points[0], p2 = ml.points[1];
                    const dxx = p2[0] - p1[0], dyy = p2[1] - p1[1];
                    return { pct: ml.pct, ml: ml, d: (dyy * (idx - p1[0]) - dxx * (w2 - p1[1])) / Math.hypot(dxx, dyy) };
                });
                let dirX = 0, dirY = 1;
                for (let i = 0; i < dists.length - 1; i++) {
                    if (dists[i].d >= 0 && dists[i + 1].d <= 0) {
                        const dA = dists[i].d, dB = -dists[i + 1].d;
                        const t = (dA + dB > 1e-6) ? (dA / (dA + dB)) : 0;
                        const mlA = dists[i].ml, mlB = dists[i + 1].ml;
                        const dxA = mlA.points[1][0] - mlA.points[0][0], dyA = mlA.points[1][1] - mlA.points[0][1];
                        const dxB = mlB.points[1][0] - mlB.points[0][0], dyB = mlB.points[1][1] - mlB.points[0][1];
                        dirX = (1 - t) * dxA + t * dxB;
                        dirY = (1 - t) * dyA + t * dyB;
                        break;
                    }
                }
                if (Math.abs(dirY) > 1e-6) {
                    const yTop = 80;
                    const xTop = idx + (yTop - w2) * (dirX / dirY);
                    const yBot = 36;
                    const xBot = idx + (yBot - w2) * (dirX / dirY);
                    ctx.save();
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 1.8;
                    ctx.setLineDash([2, 3]);
                    ctx.beginPath();
                    ctx.moveTo(X(xBot), Y(yBot));
                    ctx.lineTo(X(xTop), Y(yTop));
                    ctx.stroke();
                    ctx.restore();
                }
            }

            // Marqueur du point (intersection)
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Legend
        ctx.font = '11px Arial, sans-serif';
        ctx.textAlign = 'left';
        let lx = padL + 8;
        const ly = padT - 9;
        const legendItems = PHASES.filter(function(p) { return !phaseFilter || phaseFilter.indexOf(p.key) !== -1; }).map(function(p) { return { label: p.label, color: p.color, dashed: true }; });
        if (envelopes) {
            envelopes.forEach(function(env) { legendItems.push({ label: env.label, color: env.color, dashed: !!env.dashed }); });
        }
        for (const it of legendItems) {
            ctx.strokeStyle = it.color;
            ctx.lineWidth = 1.6;
            ctx.setLineDash(it.dashed ? [5, 4] : []);
            ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 18, ly); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#374151';
            ctx.fillText(it.label, lx + 23, ly);
            lx += 23 + ctx.measureText(it.label).width + 16;
        }
    }

    function _currentResults() {
        if (window.getFlightData) {
            try { return window.getFlightData().results; } catch (e) {}
        }
        return null;
    }

    function drawTrimSheet(r) {
        if (r) {
            const c1 = document.getElementById('trim-canvas');
            if (c1) drawCanvas(c1, r);
        }
        const modal = document.getElementById('trim-modal');
        if (modal && modal.classList.contains('show')) {
            const big = document.getElementById('trim-canvas-lg');
            const bigR = r || _currentResults();
            if (big && bigR) drawCanvas(big, bigR);
        }
    }

    img.addEventListener('load', function() {
        const r = _currentResults();
        if (r) drawTrimSheet(r);
    });

    document.addEventListener('DOMContentLoaded', function() {
        const small = document.getElementById('trim-canvas');
        const modal = document.getElementById('trim-modal');
        if (!small || !modal) return;
        small.style.cursor = 'pointer';
        small.title = 'Cliquer pour agrandir';
        small.addEventListener('click', function() {
            modal.classList.add('show');
            setTimeout(function() {
                const big = document.getElementById('trim-canvas-lg');
                const r = _currentResults();
                if (big && r) drawCanvas(big, r);
            }, 60);
        });
        const close = document.getElementById('trim-modal-close');
        if (close) close.addEventListener('click', function() { modal.classList.remove('show'); });
        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.classList.remove('show');
        });
    });

    window.drawTrimSheet = drawTrimSheet;
    window.drawCanvas = drawCanvas;
})();