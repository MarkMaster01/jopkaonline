/**
 * main.js - Hlavní řídicí modul s interaktivním TZZ panelem a podporou průjezdů
 */
import { AudioSystem } from './AudioSystem.js';
import { TrackGraph } from './TrackGraph.js';
import { JopRenderer } from './JopRenderer.js';
import { Timetable } from './Timetable.js';
import { MultiplayerManager } from './Multiplayer.js';

// Inicializace komponent
const canvas = document.getElementById('jopCanvas');
const audio = new AudioSystem();
let currentStationId = 'luzna';
const graph = new TrackGraph(currentStationId);
const timetable = new Timetable(currentStationId);
const renderer = new JopRenderer(canvas, graph);

// UI Elementy
const timeDisplay = document.getElementById('sim-time');
const speedDisplay = document.getElementById('speed-badge');
const timetableTbody = document.getElementById('timetable-body');
const statusLog = document.getElementById('status-log');
const soundBtn = document.getElementById('sound-toggle-btn');
const autoTrainBtn = document.getElementById('auto-train-btn');
const stationSelect = document.getElementById('station-select');
const stationTitle = document.getElementById('station-title');
const stationSubtitle = document.getElementById('station-subtitle');
const tzzBanner = document.getElementById('tzz-alert-banner');

let selectedStartSignal = null;
let lastTimestamp = performance.now();
let lastUiUpdate = 0;

function applyStationDimensions(stationId) {
    const stConfig = graph.stationConfig;
    if (stConfig) {
        canvas.width = stConfig.canvasWidth || 1250;
        canvas.height = stConfig.canvasHeight || 380;
        if (stationTitle) stationTitle.textContent = stConfig.name;
        if (stationSubtitle) stationSubtitle.textContent = stConfig.subtitle;
    }
}
applyStationDimensions(currentStationId);

// Multiplayer
const mp = new MultiplayerManager((message) => {
    handleRemoteAction(message);
});

mp.onStatusChange((msg, type) => {
    const mpStatus = document.getElementById('mp-status');
    if (mpStatus) {
        mpStatus.textContent = msg;
        mpStatus.className = `status-msg ${type}`;
    }
    logMessage(`[SÍŤ] ${msg}`);
});

function logMessage(msg) {
    if (!statusLog) return;
    const timeStr = timetable.getFormattedTime();
    statusLog.innerHTML = `<div><span class="time">[${timeStr}]</span> ${msg}</div>` + statusLog.innerHTML;
    const items = statusLog.querySelectorAll('div');
    if (items.length > 25) {
        items[items.length - 1].remove();
    }
}

function handleRemoteAction(msg) {
    if (!msg || !msg.type) return;

    if (msg.type === 'BUILD_ROUTE') {
        const { startSig, endTarget, isShunt } = msg.payload;
        const res = graph.buildRoute(startSig, endTarget, isShunt);
        if (res.success) {
            audio.playRouteBuilt();
            logMessage(`Druhý výpravčí postavil cestu ${startSig} ➔ ${endTarget}`);
        }
    } else if (msg.type === 'CANCEL_ROUTE') {
        graph.cancelRoute(msg.payload.signalId);
        logMessage(`Druhý výpravčí zrušil cestu od ${msg.payload.signalId}`);
    } else if (msg.type === 'START_TRAIN') {
        grantTrainEntry(msg.payload.trainId, false);
    } else if (msg.type === 'SPAWN_TRAIN') {
        timetable.spawnRandomTrain();
        logMessage(`Druhý výpravčí vložil nový vlak`);
    } else if (msg.type === 'SWITCH_STATION') {
        switchStation(msg.payload.stationId, false);
    }
}

function switchStation(newStationId, notifyPeer = true) {
    currentStationId = newStationId;
    selectedStartSignal = null;
    graph.loadStation(newStationId);
    timetable.loadStation(newStationId);
    renderer.setGraph(graph);
    applyStationDimensions(newStationId);
    logMessage(`Přepnuto na stanici: ${graph.stationConfig.name}`);

    if (stationSelect) stationSelect.value = newStationId;
    if (notifyPeer) {
        mp.sendAction('SWITCH_STATION', { stationId: newStationId });
    }
    renderTimetableTable();
}

/**
 * Udělení traťového souhlasu a vjezd vlaku
 */
function grantTrainEntry(trainId, broadcast = true) {
    const train = timetable.trains.find(t => t.id === trainId);
    if (!train || (train.state !== 'WAITING_CONSENT' && train.state !== 'PLANNED')) return;

    train.startApproach();
    audio.playApproach1();
    logMessage(`✓ Udělen souhlas k vjezdu vlaku ${train.id} ze stanice ${train.from}`);

    const dirKey = train.direction === 'RIGHT' ? 'WEST' : 'EAST';
    graph.grantConsent(dirKey);

    renderTimetableTable();
    updateTzzBanner();

    if (broadcast) {
        mp.sendAction('START_TRAIN', { trainId: train.id });
    }
}

/**
 * Aktualizace výstražného banneru traťového souhlasu nad plátnem
 */
function updateTzzBanner() {
    if (!tzzBanner) return;

    // Najdeme, zda některý TZZ žádá o souhlas
    let pendingTzz = null;
    for (const [key, t] of Object.entries(graph.tzz)) {
        if (t.requestPending && t.pendingTrainId) {
            pendingTzz = t;
            break;
        }
    }

    if (pendingTzz) {
        tzzBanner.style.display = 'flex';
        tzzBanner.innerHTML = `
            <span>⚠️ <strong>ŽÁDOST ZE SOUSEDNÍ STANICE:</strong> Vlak <strong>${pendingTzz.pendingTrainId}</strong> čeká na udělení traťového souhlasu!</span>
            <button class="btn-action-small" style="font-size: 11px; padding: 4px 12px; background: #22c55e;" data-tzz-grant="${pendingTzz.pendingTrainId}">👉 UDĚLIT SOUHLAS K VJEZDU</button>
        `;
        tzzBanner.querySelector('[data-tzz-grant]')?.addEventListener('click', () => {
            grantTrainEntry(pendingTzz.pendingTrainId);
        });
    } else {
        tzzBanner.style.display = 'none';
    }
}

// Delegovaný klik na tabulku GVD
if (timetableTbody) {
    timetableTbody.addEventListener('click', (e) => {
        audio.init();
        const btn = e.target.closest('[data-grant-id]');
        if (btn) {
            const trainId = btn.getAttribute('data-grant-id');
            grantTrainEntry(trainId);
            return;
        }

        const row = e.target.closest('tr[data-train-id]');
        if (row) {
            const trainId = row.getAttribute('data-train-id');
            const train = timetable.trains.find(t => t.id === trainId);
            if (train && (train.state === 'WAITING_CONSENT' || train.state === 'PLANNED')) {
                grantTrainEntry(trainId);
            }
        }
    });
}

function renderTimetableTable() {
    if (!timetableTbody) return;

    let html = '';
    timetable.trains.forEach(train => {
        let stateIcon = '';
        let stateClass = '';

        if (train.state === 'PLANNED') {
            stateIcon = `Plánován (${train.arrTime})`;
            stateClass = 'state-planned';
        } else if (train.state === 'WAITING_CONSENT') {
            stateIcon = '? (Čeká na souhlas v sousední stanici)';
            stateClass = 'state-waiting';
        } else if (train.state === 'APPROACHING') {
            stateIcon = '! (Vjíždí na trať)';
            stateClass = 'state-approaching';
        } else if (train.state === 'MOVING') {
            stateIcon = '* (V pohybu po stanici)';
            stateClass = 'state-moving';
        } else if (train.state === 'STOPPED') {
            stateIcon = `Stojí u perónu (${Math.ceil(train.dwellRemaining)}s)`;
            stateClass = 'state-stopped';
        } else if (train.state === 'DEPARTED') {
            stateIcon = 'Odjel';
            stateClass = 'state-departed';
        }

        const canGrant = train.state === 'WAITING_CONSENT' || train.state === 'PLANNED';

        html += `
            <tr class="${stateClass}" data-train-id="${train.id}" style="cursor: ${canGrant ? 'pointer' : 'default'}">
                <td><strong>${train.id}</strong></td>
                <td>${train.category}</td>
                <td>${train.from} ➔ ${train.to}</td>
                <td>${train.arrTime} / ${train.depTime}</td>
                <td><span class="track-tag">${train.targetTrack.replace('K', 'Kolej ')}</span></td>
                <td>
                    <span class="state-label">${stateIcon}</span>
                    ${train.state === 'WAITING_CONSENT' ? `<button class="btn-action-small" data-grant-id="${train.id}">Udělit souhlas</button>` : ''}
                </td>
            </tr>
        `;
    });

    timetableTbody.innerHTML = html;
}

/**
 * Herní smyčka
 */
function gameLoop(currentTimestamp) {
    const deltaMs = currentTimestamp - lastTimestamp;
    lastTimestamp = currentTimestamp;
    const deltaSec = Math.min(deltaMs / 1000, 0.1);

    // Aktualizace simulačního času a příchodu vlaků
    if (timetable.timeScale > 0) {
        timetable.updateTime(deltaSec, graph, audio);
    }
    if (timeDisplay) {
        timeDisplay.textContent = timetable.getFormattedTime();
    }

    // Aktualizace pozic vlaků
    timetable.trains.forEach(train => {
        train.update(graph, deltaSec * timetable.timeScale, audio);
    });

    // Kontrola přejezdů
    for (const cross of Object.values(graph.crossings)) {
        const sec1 = graph.sections['T1'];
        if (sec1 && !sec1.occupied && !sec1.locked && cross.state === 'CLOSED') {
            cross.state = 'OPEN';
        }
    }

    // Vykreslení
    renderer.render(timetable.trains, selectedStartSignal);

    // UI aktualizace
    if (currentTimestamp - lastUiUpdate > 400) {
        renderTimetableTable();
        updateTzzBanner();
        lastUiUpdate = currentTimestamp;
    }

    requestAnimationFrame(gameLoop);
}

/**
 * Obsluha kliknutí na Canvas
 */
canvas.addEventListener('click', (e) => {
    audio.init();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 1. Kliknutí na TZZ panel (Traťový souhlas)
    for (const [key, tzz] of Object.entries(graph.tzz)) {
        const { x, y } = tzz.arrowPos;
        // Oblast tlačítka TZZ na canvasu
        if (mouseX >= x - 10 && mouseX <= x + 160 && mouseY >= y - 10 && mouseY <= y + 40) {
            audio.playRelayClick();
            if (tzz.requestPending && tzz.pendingTrainId) {
                // Udělení souhlasu přímo z kliknutí na blikající TZZ panel!
                grantTrainEntry(tzz.pendingTrainId);
            } else if (tzz.direction === 'OUT_OF_STATION') {
                tzz.direction = 'NONE';
                logMessage(`Odjezdový traťový souhlas ${tzz.name} zrušen.`);
            } else {
                tzz.direction = 'OUT_OF_STATION';
                logMessage(`Traťový souhlas ${tzz.name} udělen pro odjezd ze stanice.`);
            }
            return;
        }
    }

    // 2. Kliknutí na návěstidlo
    for (const sig of Object.values(graph.signals)) {
        const dist = Math.hypot(mouseX - sig.position.x, mouseY - sig.position.y);
        if (dist < 22) {
            audio.playRelayClick();
            if (selectedStartSignal === sig.id) {
                selectedStartSignal = null;
                logMessage(`Zrušen výběr návěstidla ${sig.id}`);
            } else {
                selectedStartSignal = sig.id;
                logMessage(`Vybráno návěstidlo ${sig.id} (začátek cesty). Nyní klikněte na cílovou kolej (K1..K5) nebo trať.`);
            }
            return;
        }
    }

    // 3. Kliknutí na cílovou kolej při vybraném návěstidle (Stavění cesty / průjezdu)
    if (selectedStartSignal) {
        const targetSection = findClickedSection(mouseX, mouseY);
        if (targetSection) {
            const res = graph.buildRoute(selectedStartSignal, targetSection.id, false);
            if (res.success) {
                audio.playRouteBuilt();
                logMessage(`✓ Vlaková cesta postavena: ${selectedStartSignal} ➔ ${targetSection.name}`);
                mp.sendAction('BUILD_ROUTE', {
                    startSig: selectedStartSignal,
                    endTarget: targetSection.id,
                    isShunt: false
                });
            } else {
                logMessage(`⚠ Cestu nelze postavit: ${res.reason}`);
            }
            selectedStartSignal = null;
            return;
        }
    }

    // 4. Kliknutí na výhybku v klidu
    for (const sw of Object.values(graph.switches)) {
        const dist = Math.hypot(mouseX - sw.joint.x, mouseY - sw.joint.y);
        if (dist < 22) {
            if (sw.locked) {
                logMessage(`⚠ Výhybka ${sw.id} je uzamčena vlakovou cestou!`);
            } else {
                graph.toggleSwitch(sw.id);
                audio.playRelayClick();
                logMessage(`Výhybka ${sw.id} přestavena do polohy [${sw.position === 'PLUS' ? '+' : '-'}]`);
            }
            return;
        }
    }
});

// Pravé tlačítko - rušení cesty (RC) nebo přivolávací návěst (PN)
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    audio.init();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (selectedStartSignal) {
        selectedStartSignal = null;
        logMessage('Výběr návěstidla zrušen.');
        return;
    }

    for (const sig of Object.values(graph.signals)) {
        const dist = Math.hypot(mouseX - sig.position.x, mouseY - sig.position.y);
        if (dist < 22) {
            const ok = graph.cancelRoute(sig.id);
            if (ok) {
                audio.playRelayClick();
                logMessage(`Rušení cesty (RC): Cesta od návěstidla ${sig.id} zrušena.`);
                mp.sendAction('CANCEL_ROUTE', { signalId: sig.id });
            } else {
                graph.setCallOn(sig.id);
                audio.playApproach1();
                logMessage(`Přivolávací návěst (PN) rozsvícena na návěstidle ${sig.id}!`);
            }
            return;
        }
    }
});

function findClickedSection(mx, my) {
    for (const sec of Object.values(graph.sections)) {
        const [p1, p2] = sec.points;
        const minX = Math.min(p1.x, p2.x) - 18;
        const maxX = Math.max(p1.x, p2.x) + 18;
        const minY = Math.min(p1.y, p2.y) - 18;
        const maxY = Math.max(p1.y, p2.y) + 18;

        if (mx >= minX && mx <= maxX && my >= minY && my <= maxY) {
            return sec;
        }
    }
    return null;
}

// Přepínač stanic
if (stationSelect) {
    stationSelect.addEventListener('change', (e) => {
        switchStation(e.target.value, true);
    });
}

// Tlačítko automatického vjezdu
if (autoTrainBtn) {
    autoTrainBtn.addEventListener('click', () => {
        timetable.autoEntry = !timetable.autoEntry;
        autoTrainBtn.textContent = timetable.autoEntry ? '🚦 Auto vjezd: ZAP' : '🚦 Auto vjezd: VYP';
        autoTrainBtn.classList.toggle('active', timetable.autoEntry);
        logMessage(`Automatický vjezd vlaků přepnut na: ${timetable.autoEntry ? 'ZAPNUTO (podle jízdního řádu)' : 'VYPNUTO (vyžadován traťový souhlas)'}`);
    });
}

// Klávesové zkratky
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    if (e.key === 'v' || e.key === 'V') {
        const tr = timetable.spawnRandomTrain();
        audio.playApproach1();
        logMessage(`Do GVD byl přidán nový vlak: ${tr.id}.`);
        renderTimetableTable();
        mp.sendAction('SPAWN_TRAIN', {});
    } else if (e.key === 'p' || e.key === 'P' || e.code === 'Space') {
        timetable.timeScale = timetable.timeScale === 0 ? 1 : 0;
        speedDisplay.textContent = timetable.timeScale === 0 ? 'PAUZA' : `${timetable.timeScale}x`;
        logMessage(`Simulace ${timetable.timeScale === 0 ? 'pozastavena' : 'spuštěna'}.`);
    } else if (e.key === '1') {
        timetable.timeScale = 1;
        speedDisplay.textContent = '1x';
    } else if (e.key === '2') {
        timetable.timeScale = 2;
        speedDisplay.textContent = '2x';
    } else if (e.key === '5') {
        timetable.timeScale = 5;
        speedDisplay.textContent = '5x';
    } else if (e.key === 'Escape') {
        selectedStartSignal = null;
        closeAllModals();
        logMessage('Výběr zrušen.');
    }
});

// Ovládání rychlosti
document.getElementById('btn-speed-pause')?.addEventListener('click', () => {
    timetable.timeScale = 0;
    speedDisplay.textContent = 'PAUZA';
});
document.getElementById('btn-speed-1x')?.addEventListener('click', () => {
    timetable.timeScale = 1;
    speedDisplay.textContent = '1x';
});
document.getElementById('btn-speed-2x')?.addEventListener('click', () => {
    timetable.timeScale = 2;
    speedDisplay.textContent = '2x';
});
document.getElementById('btn-speed-5x')?.addEventListener('click', () => {
    timetable.timeScale = 5;
    speedDisplay.textContent = '5x';
});
document.getElementById('btn-spawn-train')?.addEventListener('click', () => {
    const tr = timetable.spawnRandomTrain();
    audio.playApproach1();
    logMessage(`Vložen nový vlak: ${tr.id}.`);
    renderTimetableTable();
    mp.sendAction('SPAWN_TRAIN', {});
});
soundBtn?.addEventListener('click', () => {
    const on = audio.toggle();
    soundBtn.textContent = on ? '🔊 Zvuk: ZAP' : '🔇 Zvuk: VYP';
});

// Modální okna
function openModal(modalId) {
    document.getElementById(modalId)?.classList.add('active');
}
function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

document.getElementById('btn-open-help')?.addEventListener('click', () => openModal('modal-help'));
document.getElementById('btn-open-mp')?.addEventListener('click', () => openModal('modal-mp'));
document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
});
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeAllModals();
    });
});

document.getElementById('btn-host-game')?.addEventListener('click', () => {
    mp.hostGame();
});
document.getElementById('btn-join-game')?.addEventListener('click', () => {
    const code = document.getElementById('join-room-code')?.value;
    mp.joinGame(code);
});

// Start simulace
renderTimetableTable();
updateTzzBanner();
logMessage('Simulátor JOP Staničář připraven.');
logMessage('Pro vjezd vlaku klikněte na vjezdové návěstidlo (1L) a cílovou kolej (K1..K5).');
requestAnimationFrame(gameLoop);
