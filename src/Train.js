/**
 * main.js - Řízení simulátoru JOP IV dle normy SŽDC ZTP 5/2000
 */
import { AudioSystem } from './AudioSystem.js';
import { TrackGraph } from './TrackGraph.js';
import { JopRenderer } from './JopRenderer.js';
import { Timetable } from './Timetable.js';
import { MultiplayerManager } from './Multiplayer.js';

const canvas = document.getElementById('jopCanvas');
const audio = new AudioSystem();
let currentStationId = 'luzna';
const graph = new TrackGraph(currentStationId);
const timetable = new Timetable(currentStationId);
const renderer = new JopRenderer(canvas, graph);

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
        const res = graph.pushRouteToBuffer(startSig, endTarget, isShunt);
        if (res.success) {
            audio.playRouteBuilt();
            logMessage(`Druhý výpravčí vložil cestu ${startSig} ➔ ${endTarget} do zásobníku.`);
        }
    } else if (msg.type === 'CANCEL_ROUTE') {
        graph.cancelRoute(msg.payload.signalId);
        logMessage(`Druhý výpravčí zrušil cestu od ${msg.payload.signalId}`);
    } else if (msg.type === 'START_TRAIN') {
        grantTrainEntry(msg.payload.trainId, false);
    }
}

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

function updateTzzBanner() {
    if (!tzzBanner) return;

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
            <tr class="${stateClass}" data-train-id="${train.id}">
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

function gameLoop(currentTimestamp) {
    const deltaMs = currentTimestamp - lastTimestamp;
    lastTimestamp = currentTimestamp;
    const deltaSec = Math.min(deltaMs / 1000, 0.1);

    if (timetable.timeScale > 0) {
        timetable.updateTime(deltaSec, graph, audio);
    }
    if (timeDisplay) {
        timeDisplay.textContent = timetable.getFormattedTime();
    }

    timetable.trains.forEach(train => {
        train.update(graph, deltaSec * timetable.timeScale, audio);
    });

    graph.processBuffer(); // Průběžné zpracování zásobníku povelů
    renderer.render(timetable.trains, selectedStartSignal);

    if (currentTimestamp - lastUiUpdate > 400) {
        renderTimetableTable();
        updateTzzBanner();
        lastUiUpdate = currentTimestamp;
    }

    requestAnimationFrame(gameLoop);
}

// Obsluha kliknutí na Canvas
canvas.addEventListener('click', (e) => {
    audio.init();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 1. Kliknutí na návěstidlo
    for (const sig of Object.values(graph.signals)) {
        const dist = Math.hypot(mouseX - sig.position.x, mouseY - sig.position.y);
        if (dist < 22) {
            audio.playRelayClick();
            if (selectedStartSignal === sig.id) {
                selectedStartSignal = null;
                logMessage(`Zrušen výběr návěstidla ${sig.id}`);
            } else {
                selectedStartSignal = sig.id;
                logMessage(`Vybráno návěstidlo ${sig.id} (Začátek cesty). Nyní klikněte na cílovou kolej.`);
            }
            return;
        }
    }

    // 2. Kliknutí na cílovou kolej při vybraném návěstidle (Vložení do zásobníku)
    if (selectedStartSignal) {
        const targetSection = findClickedSection(mouseX, mouseY);
        if (targetSection) {
            const res = graph.pushRouteToBuffer(selectedStartSignal, targetSection.id, false);
            if (res.success) {
                audio.playRouteBuilt();
                logMessage(`✓ Vlaková cesta ${selectedStartSignal} ➔ ${targetSection.name} vložena do Zásobníku povelů.`);
                mp.sendAction('BUILD_ROUTE', {
                    startSig: selectedStartSignal,
                    endTarget: targetSection.id,
                    isShunt: false
                });
            } else {
                logMessage(`⚠ Cestu nelze vložit do zásobníku: ${res.reason}`);
            }
            selectedStartSignal = null;
            return;
        }
    }

    // 3. Ruční přehození výhybky v klidu
    for (const sw of Object.values(graph.switches)) {
        const dist = Math.hypot(mouseX - sw.joint.x, mouseY - sw.joint.y);
        if (dist < 22) {
            if (sw.locked) {
                logMessage(`⚠ Výhybka ${sw.id} je uzamčena v jízdní cestě!`);
            } else {
                graph.toggleSwitch(sw.id);
                audio.playRelayClick();
                logMessage(`Výhybka ${sw.id} přestavena na [${sw.position === 'PLUS' ? '+' : '-'}]`);
            }
            return;
        }
    }
});

// Pravé tlačítko (RC - Rušení Cesty / PN - Přivolávací Návěst) (§ 2.9)
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
                logMessage(`Rušení cesty (RC): Cesta od ${sig.id} zrušena.`);
                mp.sendAction('CANCEL_ROUTE', { signalId: sig.id });
            } else {
                graph.setCallOn(sig.id);
                audio.playApproach1();
                logMessage(`Přivolávací návěst (PN) rozsvícena na návěstidle ${sig.id}! (§ 2.9.2)`);
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

renderTimetableTable();
updateTzzBanner();
logMessage('Simulátor JOP Staničář inicializován dle ZTP 5/2000 (JOP IV).');
requestAnimationFrame(gameLoop);
