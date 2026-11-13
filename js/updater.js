/* ==========================================================================
   BBJ EFB - Automatic Background Update Checker System
   Vérification transparente de version.json sur GitHub / PWA
   Préserve 100% des données locales (W&B, Flight Log, Base Crew, Saisies)
   ========================================================================== */

(function() {
    const CURRENT_VERSION = '5.0';
    const CURRENT_BUILD = 2026111301;
    let _latestRemoteData = null;

    function _getRemoteVersionUrl() {
        return 'version.json?t=' + Date.now();
    }

    function check(manual) {
        fetch(_getRemoteVersionUrl(), {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
        })
        .then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(function(data) {
            if (!data || !data.version) return;
            _latestRemoteData = data;

            const isNewer = (data.build && data.build > CURRENT_BUILD) || (data.version !== CURRENT_VERSION);

            if (isNewer) {
                // Vérifier si l'utilisateur a ignoré cette version pendant cette session
                const dismissed = sessionStorage.getItem('bbj_dismissed_update');
                if (!manual && dismissed === String(data.build)) {
                    return;
                }
                showUpdateModal(data);
            } else if (manual) {
                _toast('Vous utilisez déjà la toute dernière version de l\'EFB (' + CURRENT_VERSION + ').');
            }
        })
        .catch(function(err) {
            if (manual) {
                _toast('Impossible de vérifier les mises à jour (mode hors-ligne).');
            }
        });
    }

    function showUpdateModal(data) {
        const modal = document.getElementById('update-modal');
        if (!modal) return;

        const vEl = document.getElementById('update-modal-version');
        const dEl = document.getElementById('update-modal-date');
        const bEl = document.getElementById('update-modal-build');
        const nEl = document.getElementById('update-modal-notes');

        if (vEl) vEl.textContent = 'Version ' + data.version;
        if (dEl) dEl.textContent = 'Mise à jour officielle disponible sur GitHub' + (data.releaseDate ? ' (' + data.releaseDate + ')' : '');
        if (bEl) bEl.textContent = data.build ? 'Build ' + data.build : '';
        if (nEl) nEl.textContent = data.notes || 'Améliorations de performance, affichage adapté et nouvelles fonctionnalités EFB.';

        modal.classList.add('show');
    }

    function applyUpdate() {
        const btn = document.getElementById('btn-update-now');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span>⏳ Téléchargement en cours…</span>';
        }

        // 1. Purge des caches de fichiers applicatifs (SW Cache) SANS toucher au localStorage
        if ('caches' in window) {
            caches.keys().then(function(names) {
                return Promise.all(names.map(function(name) {
                    return caches.delete(name);
                }));
            }).catch(function() {});
        }

        // 2. Notification au Service Worker pour forcer l'activation
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ action: 'clearCache' });
        }

        // 3. Rechargement avec paramètre anti-cache pour forcer le téléchargement frais depuis GitHub
        setTimeout(function() {
            const buildTag = (_latestRemoteData && _latestRemoteData.build) ? _latestRemoteData.build : Date.now();
            const cleanUrl = window.location.pathname.replace(/\/index\.html$/i, '') + '/';
            window.location.href = cleanUrl + '?v=' + buildTag + '&t=' + Date.now();
        }, 500);
    }

    function dismissUpdate() {
        const modal = document.getElementById('update-modal');
        if (modal) modal.classList.remove('show');
        if (_latestRemoteData && _latestRemoteData.build) {
            sessionStorage.setItem('bbj_dismissed_update', String(_latestRemoteData.build));
        }
    }

    function _toast(msg) {
        let t = document.getElementById('app-update-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'app-update-toast';
            t.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#0F172A; color:#F8FAFC; border:1px solid #38BDF8; padding:12px 18px; border-radius:8px; font-size:12.5px; z-index:999999; box-shadow:0 4px 16px rgba(0,0,0,0.4); display:flex; align-items:center; gap:8px; font-family:sans-serif; transition:opacity 0.3s ease;';
            document.body.appendChild(t);
        }
        t.innerHTML = '<span>ℹ️</span><span>' + msg + '</span>';
        t.style.display = 'flex';
        t.style.opacity = '1';
        setTimeout(function() {
            t.style.opacity = '0';
            setTimeout(function() { t.style.display = 'none'; }, 300);
        }, 4000);
    }

    function init() {
        const btnNow = document.getElementById('btn-update-now');
        const btnLater = document.getElementById('btn-update-later');
        if (btnNow) btnNow.addEventListener('click', applyUpdate);
        if (btnLater) btnLater.addEventListener('click', dismissUpdate);

        // Permettre de cliquer sur le badge de version dans le volet pour vérifier manuellement les mises à jour
        const versionEl = document.querySelector('.sidebar-app-info .app-version');
        if (versionEl) {
            versionEl.style.cursor = 'pointer';
            versionEl.title = 'Cliquer pour vérifier les mises à jour sur GitHub';
            versionEl.addEventListener('click', function() {
                _toast('Vérification des mises à jour sur GitHub…');
                check(true);
            });
        }

        // Vérification automatique après 2.5 secondes
        setTimeout(function() {
            check(false);
        }, 2500);

        // Vérification automatique au retour sur l'application (iPad déverrouillé ou onglet réactivé)
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                check(false);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.APP_UPDATE = {
        check: check,
        apply: applyUpdate,
        version: CURRENT_VERSION,
        build: CURRENT_BUILD
    };
})();
