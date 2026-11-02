/**
 * main.js - Řízení simulátoru JOP IV (Opravená logika vjezdu vlaků)
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
const timetableTbody = document.getElementById('timetable-body');
const statusLog = document.getElementById('status-log');
const tzzBanner = document.getElementById('tzz-alert-banner');

let selectedStartSignal = null;
let lastTimestamp = performance.now();
let lastUiUpdate = 0;

function applyStationDimensions() {
    const stConfig = graph.stationConfig;
    if (stConfig) {
        canvas.width = stConfig.canvasWidth || 1250;
        canvas.height = stConfig.canvasHeight || 380;
    }
}
applyStationDimensions();

const mp = new MultiplayerManager((message) => {
    handleRemoteAction(message);
});

function logMessage(msg) {
    if (!statusLog) return;
    const timeStr = timetable.getFormattedTime();
    statusLog.innerHTML = `<div><span class="time">[${timeStr}]</span> ${msg}</div>` + statusLog.innerHTML;
}

function handleRemoteAction(msg) {
    if (!msg || !msg.type) return;
    if (msg.type === 'BUILD_ROUTE') {
        graph.pushRouteToBuffer(msg.payload.startSig, msg.payload.endTarget, msg.payload.isShunt);
    } else if (msg.type === 'CANCEL_ROUTE') {
        graph.cancelRoute(msg.payload.signalId);
    } else if (msg.type === 'START_TRAIN') {
        grantTrainEntry(msg.payload.trainId, false);
    }
}

/**
 * Udělení souhlasu s vjezdem vlaku (S kontrolou volnosti traťového úseku)
 */
function grantTrainEntry(trainId, broadcast = true) {
    const train = timetable.trains.find(t => t.id === trainId);
    if (!train || (train.state !== 'WAITING_CONSENT' && train.state !== 'PLANNED')) return;

    const dirKey = train.direction === 'RIGHT' ? 'WEST' : 'EAST';

    // Kontrola, zda je traťový úsek opravdu volný
    if (!graph.isLineFree(dirKey)) {
        logMessage(`⚠ Nelze vpustit vlak ${train.id}! Traťový úsek je stále obsazen předchozím vlakem.`);
        return;
    }

    train.startApproach();
    audio.playApproach1();
    logMessage(`✓ Udělen souhlas k vjezdu vlaku ${train.id} ze stanice ${train.from}`);

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
            <span>⚠️ <strong>ŽÁDOST ZE SOUSEDNÍ STANICE:</strong> Vlak <strong>${pendingTzz.pendingTrainId}</strong> čeká na vjezd!</span>
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
        let stateIcon = train.state;
        if (train.state === 'PLANNED') stateIcon = `Plánován (${train.arrTime})`;
        else if (train.state === 'WAITING_CONSENT') stateIcon = 'Čeká na souhlas';
        else if (train.state === 'APPROACHING') stateIcon = 'Vjíždí na trať';
        else if (train.state === 'MOVING') stateIcon = 'V pohybu po stanici';
        else if (train.state === 'STOPPED') stateIcon = `Stojí (${Math.ceil(train.dwellRemaining)}s)`;
        else if (train.state === 'DEPARTED') stateIcon = 'Odjel';

        html += `
            <tr data-train-id="${train.id}">
                <td><strong>${train.id}</strong></td>
                <td>${train.category}</td>
                <td>${train.from} ➔ ${train.to}</td>
                <td>${train.arrTime} / ${train.depTime}</td>
                <td><span class="track-tag">${train.targetTrack.replace('K', 'Kolej ')}</span></td>
                <td>
                    <span>${stateIcon}</span>
                    ${train.state === 'WAITING_CONSENT' ? `<button class="btn-action-small" data-grant-id="${train.id}">Udělit souhlas</button>` : ''}
                </td>
            </tr>
        `;
    });

    timetableTbody.innerHTML = html;

    timetableTbody.querySelectorAll('[data-grant-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-grant-id');
            grantTrainEntry(id);
        });
    });
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

    graph.processBuffer();
    renderer.render(timetable.trains, selectedStartSignal);

    if (currentTimestamp - lastUiUpdate > 400) {
        renderTimetableTable();
        updateTzzBanner();
        lastUiUpdate = currentTimestamp;
    }

    requestAnimationFrame(gameLoop);
}

// Ovládání na plátně (Canvas)
canvas.addEventListener('click', (e) => {
    audio.init();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Volba návěstidla
    for (const sig of Object.values(graph.signals)) {
        const dist = Math.hypot(mouseX - sig.position.x, mouseY - sig.position.y);
        if (dist < 22) {
            audio.playRelayClick();
            if (selectedStartSignal === sig.id) {
                selectedStartSignal = null;
                logMessage(`Zrušen výběr návěstidla ${sig.id}`);
            } else {
                selectedStartSignal = sig.id;
                logMessage(`Vybráno návěstidlo ${sig.id}. Klikněte na cílovou kolej.`);
            }
            return;
        }
    }

    // Volba cílové koleje pro stavění cesty
    if (selectedStartSignal) {
        const targetSection = findClickedSection(mouseX, mouseY);
        if (targetSection) {
            const res = graph.pushRouteToBuffer(selectedStartSignal, targetSection.id, false);
            if (res.success) {
                audio.playRouteBuilt();
                logMessage(`✓ Vlaková cesta ${selectedStartSignal} ➔ ${targetSection.id} vložena do zásobníku.`);
            } else {
                logMessage(`⚠ Cestu nelze postavit: ${res.reason}`);
            }
            selectedStartSignal = null;
            return;
        }
    }

    // Ruční přestavení výhybek
    for (const sw of Object.values(graph.switches)) {
        const dist = Math.hypot(mouseX - sw.joint.x, mouseY - sw.joint.y);
        if (dist < 22) {
            if (!sw.locked) {
                graph.toggleSwitch(sw.id);
                audio.playRelayClick();
            }
            return;
        }
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (const sig of Object.values(graph.signals)) {
        const dist = Math.hypot(mouseX - sig.position.x, mouseY - sig.position.y);
        if (dist < 22) {
            const ok = graph.cancelRoute(sig.id);
            if (!ok) {
                graph.setCallOn(sig.id);
                logMessage(`Přivolávací návěst (PN) rozsvícena na ${sig.id}`);
            }
            return;
        }
    }
});

function findClickedSection(mx, my) {
    for (const sec of Object.values(graph.sections)) {
        const [p1, p2] = sec.points;
        const minX = Math.min(p1.x, p2.x) - 20;
        const maxX = Math.max(p1.x, p2.x) + 20;
        const minY = Math.min(p1.y, p2.y) - 20;
        const maxY = Math.max(p1.y, p2.y) + 20;

        if (mx >= minX && mx <= maxX && my >= minY && my <= maxY) {
            return sec;
        }
    }
    return null;
}

renderTimetableTable();
updateTzzBanner();
requestAnimationFrame(gameLoop);
