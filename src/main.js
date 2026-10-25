/**
 * main.js - Hlavní řídicí logika simulátoru Staničář JOP
 */
import { AudioSystem } from './AudioSystem.js';
import { TrackGraph } from './TrackGraph.js';
import { JopRenderer } from './JopRenderer.js';
import { Timetable } from './Timetable.js';
import { MultiplayerManager } from './Multiplayer.js';

// Inicializace komponent
const canvas = document.getElementById('jopCanvas');
const audio = new AudioSystem();
const graph = new TrackGraph();
const timetable = new Timetable();
const renderer = new JopRenderer(canvas, graph);

// UI Elementy
const timeDisplay = document.getElementById('sim-time');
const speedDisplay = document.getElementById('speed-badge');
const timetableTbody = document.getElementById('timetable-body');
const statusLog = document.getElementById('status-log');
const soundBtn = document.getElementById('sound-toggle-btn');
const mpStatus = document.getElementById('mp-status');

let selectedStartSignal = null;
let hoveredElement = null;
let lastTimestamp = performance.now();

// Multiplayer synchronizace
const mp = new MultiplayerManager((message) => {
    handleRemoteAction(message);
});

mp.onStatusChange((msg, type) => {
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
    // Omezit historii na 15 zpráv
    const items = statusLog.querySelectorAll('div');
    if (items.length > 15) {
        items[items.length - 1].remove();
    }
}

/**
 * Zpracování akcí přijatých od spoluhráče po síti
 */
function handleRemoteAction(msg) {
    if (!msg || !msg.type) return;

    if (msg.type === 'BUILD_ROUTE') {
        const { startSig, endTarget, isShunt } = msg.payload;
        const res = graph.buildRoute(startSig, endTarget, isShunt);
        if (res.success) {
            audio.playRouteBuilt();
            logMessage(`Druhý výpravčí postavil cestu ${startSig} -> ${endTarget}`);
        }
    } else if (msg.type === 'CANCEL_ROUTE') {
        graph.cancelRoute(msg.payload.signalId);
        logMessage(`Druhý výpravčí zrušil cestu od ${msg.payload.signalId}`);
    } else if (msg.type === 'START_TRAIN') {
        const tr = timetable.trains.find(t => t.id === msg.payload.trainId);
        if (tr) {
            tr.startApproach();
            logMessage(`Druhý výpravčí udělil souhlas k vjezdu vlaku ${tr.id}`);
        }
    } else if (msg.type === 'SPAWN_TRAIN') {
        timetable.spawnRandomTrain();
        logMessage(`Druhý výpravčí přidal nový vlak`);
    }
}

/**
 * Hlavní herní smyčka
 */
function gameLoop(currentTimestamp) {
    const deltaMs = currentTimestamp - lastTimestamp;
    lastTimestamp = currentTimestamp;
    const deltaSec = Math.min(deltaMs / 1000, 0.1);

    // 1. Aktualizace času simulace
    if (timetable.timeScale > 0) {
        timetable.updateTime(deltaSec);
    }
    if (timeDisplay) {
        timeDisplay.textContent = timetable.getFormattedTime();
    }

    // 2. Aktualizace vlaků
    timetable.trains.forEach(train => {
        train.update(graph, deltaSec * timetable.timeScale, audio);
    });

    // 3. Kontrola uvolnění přejezdu PZZ
    const t1Occupied = graph.sections.T1.occupied || graph.sections.T1_EXT.occupied;
    const t1Locked = graph.sections.T1.locked;
    if (!t1Occupied && !t1Locked && graph.crossings.PZZ1.state === 'CLOSED') {
        graph.crossings.PZZ1.state = 'OPEN';
    }

    // 4. Vykreslení
    renderer.render(timetable.trains, selectedStartSignal, hoveredElement);

    // 5. Aktualizace informačního panelu
    updateTimetableUI();

    requestAnimationFrame(gameLoop);
}

/**
 * Aktualizace tabulky vlaků (GVD)
 */
function updateTimetableUI() {
    if (!timetableTbody) return;

    let html = '';
    timetable.trains.forEach(train => {
        let stateIcon = '';
        let stateClass = '';

        if (train.state === 'WAITING_CONSENT') {
            stateIcon = '? (Čeká na souhlas)';
            stateClass = 'state-waiting';
        } else if (train.state === 'APPROACHING') {
            stateIcon = '! (Vjíždí na trať)';
            stateClass = 'state-approaching';
        } else if (train.state === 'MOVING') {
            stateIcon = '* (V pohybu)';
            stateClass = 'state-moving';
        } else if (train.state === 'STOPPED') {
            stateIcon = `Stojí (${Math.ceil(train.dwellRemaining)}s)`;
            stateClass = 'state-stopped';
        } else if (train.state === 'DEPARTED') {
            stateIcon = 'Odjel';
            stateClass = 'state-departed';
        }

        const canGrant = train.state === 'WAITING_CONSENT';

        html += `
            <tr class="${stateClass}" data-train-id="${train.id}">
                <td><strong>${train.id}</strong></td>
                <td>${train.category}</td>
                <td>${train.from} ➔ ${train.to}</td>
                <td>${train.arrTime} / ${train.depTime}</td>
                <td><span class="track-tag">${train.targetTrack.replace('K', 'Kolej ')}</span></td>
                <td>
                    <span class="state-label">${stateIcon}</span>
                    ${canGrant ? `<button class="btn-action-small" data-grant-id="${train.id}">Udělit souhlas</button>` : ''}
                </td>
            </tr>
        `;
    });

    timetableTbody.innerHTML = html;

    // Obsluha kliknutí na tlačítka souhlasu
    timetableTbody.querySelectorAll('[data-grant-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const trainId = btn.getAttribute('data-grant-id');
            grantTrainEntry(trainId);
        });
    });
}

function grantTrainEntry(trainId) {
    const train = timetable.trains.find(t => t.id === trainId);
    if (!train || train.state !== 'WAITING_CONSENT') return;

    train.startApproach();
    audio.playApproach1();
    logMessage(`Udělen souhlas k vjezdu vlaku ${train.id} ze stanice ${train.from}`);

    if (train.direction === 'RIGHT') {
        graph.grantConsent('WEST');
    } else {
        graph.grantConsent('EAST');
    }

    // Odeslat do sítě
    mp.sendAction('START_TRAIN', { trainId: train.id });
}

/**
 * Obsluha kliknutí na plátno (Canvas)
 */
canvas.addEventListener('click', (e) => {
    audio.init();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 1. Kliknutí na návěstidlo
    for (const sig of Object.values(graph.signals)) {
        const dist = Math.hypot(mouseX - sig.position.x, mouseY - sig.position.y);
        if (dist < 18) {
            audio.playRelayClick();
            if (selectedStartSignal === sig.id) {
                // Odznačit
                selectedStartSignal = null;
                logMessage(`Zrušen výběr návěstidla ${sig.id}`);
            } else {
                selectedStartSignal = sig.id;
                logMessage(`Vybráno návěstidlo ${sig.id} (začátek cesty). Klikněte na cílovou kolej.`);
            }
            return;
        }
    }

    // 2. Pokud máme vybrané výchozí návěstidlo, zkusíme postavit cestu ke koleji nebo trati
    if (selectedStartSignal) {
        // Hledáme klik na některou ze staničních kolejí (K1, K2, K3) nebo trať (T1, T2)
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

    // 3. Kliknutí na výhybku (přestavení výhybky v klidu)
    for (const sw of Object.values(graph.switches)) {
        const dist = Math.hypot(mouseX - sw.joint.x, mouseY - sw.joint.y);
        if (dist < 20) {
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

    // 4. Kliknutí na TZZ šipky (Traťový souhlas)
    for (const [key, tzz] of Object.entries(graph.tzz)) {
        const dist = Math.hypot(mouseX - tzz.arrowPos.x, mouseY - tzz.arrowPos.y);
        if (dist < 30) {
            audio.playRelayClick();
            if (tzz.direction === 'OUT_OF_STATION') {
                tzz.direction = 'NONE';
                logMessage(`Traťový souhlas ${tzz.name} zrušen.`);
            } else {
                tzz.direction = 'OUT_OF_STATION';
                logMessage(`Traťový souhlas ${tzz.name} udělen pro odjezd ze stanice.`);
            }
            return;
        }
    }
});

// Pravé tlačítko myši - Zrušení volby nebo zrušení cesty (RC)
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

    // Klik na návěstidlo pravým = zrušení postavené cesty (RC)
    for (const sig of Object.values(graph.signals)) {
        const dist = Math.hypot(mouseX - sig.position.x, mouseY - sig.position.y);
        if (dist < 18) {
            const ok = graph.cancelRoute(sig.id);
            if (ok) {
                audio.playRelayClick();
                logMessage(`Rušení cesty (RC): Cesta od návěstidla ${sig.id} zrušena.`);
                mp.sendAction('CANCEL_ROUTE', { signalId: sig.id });
            } else {
                // Přivolávací návěst (PN)
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
        const minX = Math.min(p1.x, p2.x) - 15;
        const maxX = Math.max(p1.x, p2.x) + 15;
        const minY = Math.min(p1.y, p2.y) - 15;
        const maxY = Math.max(p1.y, p2.y) + 15;

        if (mx >= minX && mx <= maxX && my >= minY && my <= maxY) {
            return sec;
        }
    }
    return null;
}

/**
 * Klávesové zkratky podle návodu Staničáře
 */
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    if (e.key === 'v' || e.key === 'V') {
        const tr = timetable.spawnRandomTrain();
        audio.playApproach1();
        logMessage(`Vložen náhodný nákladní vlak: ${tr.id} do GVD.`);
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
        logMessage('Výběr zrušen.');
    }
});

// UI Tlačítka
document.getElementById('btn-speed-pause').addEventListener('click', () => {
    timetable.timeScale = 0;
    speedDisplay.textContent = 'PAUZA';
});
document.getElementById('btn-speed-1x').addEventListener('click', () => {
    timetable.timeScale = 1;
    speedDisplay.textContent = '1x';
});
document.getElementById('btn-speed-2x').addEventListener('click', () => {
    timetable.timeScale = 2;
    speedDisplay.textContent = '2x';
});
document.getElementById('btn-speed-5x').addEventListener('click', () => {
    timetable.timeScale = 5;
    speedDisplay.textContent = '5x';
});
document.getElementById('btn-spawn-train').addEventListener('click', () => {
    const tr = timetable.spawnRandomTrain();
    audio.playApproach1();
    logMessage(`Vložen náhodný nákladní vlak: ${tr.id}.`);
    mp.sendAction('SPAWN_TRAIN', {});
});
soundBtn.addEventListener('click', () => {
    const on = audio.toggle();
    soundBtn.textContent = on ? '🔊 Zvuk: ZAP' : '🔇 Zvuk: VYP';
});

// Ovládání Multiplayeru
document.getElementById('btn-host-game').addEventListener('click', () => {
    mp.hostGame();
});

document.getElementById('btn-join-game').addEventListener('click', () => {
    const code = document.getElementById('join-room-code').value;
    mp.joinGame(code);
});

// Start herní smyčky
logMessage('Vítejte v simulátoru JOP Staničář!');
logMessage('Pro stavění vlakové cesty klikněte na vjezdové/odjezdové návěstidlo a poté na kolej.');
requestAnimationFrame(gameLoop);
