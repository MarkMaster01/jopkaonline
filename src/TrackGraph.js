/**
 * TrackGraph.js - Zabezpečovací logika dle SŽDC ZTP 5/2000 JOP IV
 */
import { STATIONS } from './Stations.js';

export class TrackGraph {
    constructor(stationId = 'luzna') {
        this.loadStation(stationId);
    }

    loadStation(stationId) {
        this.currentStationId = stationId;
        const station = STATIONS[stationId] || STATIONS['luzna'];

        this.stationConfig = station;
        this.sections = JSON.parse(JSON.stringify(station.sections));
        this.switches = JSON.parse(JSON.stringify(station.switches));
        this.crossings = JSON.parse(JSON.stringify(station.crossings));
        this.signals = JSON.parse(JSON.stringify(station.signals));
        this.tzz = JSON.parse(JSON.stringify(station.tzz));
        this.routeCatalog = JSON.parse(JSON.stringify(station.routeCatalog));

        // Zásobník povelů (§ 2.1.7 & § 2.12)
        this.commandBuffer = []; // Fronta přikazů v zásobníku
        this.bufferMode = 'VZ';   // 'VZ' (Vydávání ze zásobníku), 'PV' (Přednostní), 'EZ' (Editace)
        this.activeRoutes = [];
        this.pendingDocCommand = null; // Čekající povinně dokumentovaný úkon (§ 2.1.6)
    }

    /**
     * Vložení cesty do Zásobníku povelů (§ 2.12)
     */
    pushRouteToBuffer(startSignalId, endTargetId, isShunt = false) {
        const routeDef = this.routeCatalog.find(
            r => r.startSignal === startSignalId && (r.endTarget === endTargetId || r.id === endTargetId)
        );

        if (!routeDef) {
            return { success: false, reason: 'Nenalezena odpovídající korigovaná vlaková ani posunová cesta.' };
        }

        const cmd = {
            id: 'CMD_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            routeDef: routeDef,
            isShunt: isShunt,
            status: 'WAITING'
        };

        if (this.bufferMode === 'PV') {
            this.commandBuffer.unshift(cmd); // Přednostní zařazení dopředu
        } else {
            this.commandBuffer.push(cmd);
        }

        this.processBuffer();
        return { success: true, command: cmd };
    }

    /**
     * Zpracování čela zásobníku povelů (§ 2.12.1)
     */
    processBuffer() {
        if (this.commandBuffer.length === 0) return;

        const currentCmd = this.commandBuffer[0];
        if (currentCmd.status === 'PROCESSING') return;

        const routeDef = currentCmd.routeDef;
        const sig = this.signals[routeDef.startSignal];

        if (!sig || sig.aspect !== 'RED') {
            currentCmd.status = 'BLOCKED_SIGNAL';
            return;
        }

        // Kontrola blokujících podmínek
        for (const secId of routeDef.sections) {
            const sec = this.sections[secId];
            if (!sec) continue;

            const isDepartureSignal = routeDef.startSignal.startsWith('S') || (routeDef.startSignal.startsWith('L') && routeDef.startSignal.length === 2);
            const isOriginTrack = isDepartureSignal && (secId === sig.section);

            if (!isOriginTrack) {
                if (sec.locked || sec.occupied) {
                    currentCmd.status = 'BLOCKED_TRACK';
                    return;
                }
            }
        }

        // Přestavení a uzamčení výhybek (§ 2.2.4)
        for (const [swId, targetPos] of Object.entries(routeDef.switches)) {
            const sw = this.switches[swId];
            if (sw) {
                if (sw.locked) {
                    currentCmd.status = 'BLOCKED_SWITCH';
                    return;
                }
                sw.position = targetPos;
                sw.locked = true;
            }
        }

        // Závěr cesty (zelený pro vlak, bílý pro posun) (§ 3.1.4 & § 3.1.5)
        const routeType = currentCmd.isShunt ? 'SHUNT' : 'TRAIN';
        routeDef.sections.forEach(secId => {
            const sec = this.sections[secId];
            if (sec) {
                sec.locked = true;
                sec.routeType = routeType;
            }
        });

        // Rozsvícení odpojené návěsti
        sig.aspect = currentCmd.isShunt ? 'WHITE' : routeDef.aspect;

        // Uzavření PZZ
        for (const cross of Object.values(this.crossings)) {
            if (routeDef.sections.includes('T1') || routeDef.startSignal === '1L') {
                cross.state = 'CLOSED';
            }
        }

        currentCmd.status = 'EXECUTED';
        this.activeRoutes.push({
            id: routeDef.id,
            def: routeDef,
            isShunt: currentCmd.isShunt
        });

        // Odstranění vykonaného příkazu z čela
        this.commandBuffer.shift();
    }

    /**
     * Rušení cesty (RC) (§ 2.2.6 & § 2.2.7)
     */
    cancelRoute(signalId) {
        const sig = this.signals[signalId];
        if (!sig) return false;

        const routeIdx = this.activeRoutes.findIndex(r => r.def.startSignal === signalId);
        if (routeIdx === -1) {
            sig.aspect = 'RED';
            return false;
        }

        const activeRoute = this.activeRoutes[routeIdx];
        sig.aspect = 'RED';

        // Uvolnění závěrů
        activeRoute.def.sections.forEach(secId => {
            const sec = this.sections[secId];
            if (sec && !sec.occupied) {
                sec.locked = false;
                sec.routeType = null;
            }
        });

        for (const swId of Object.keys(activeRoute.def.switches)) {
            const sw = this.switches[swId];
            if (sw) sw.locked = false;
        }

        this.activeRoutes.splice(routeIdx, 1);
        this.processBuffer();
        return true;
    }

    /**
     * Přestavení výhybky v klidu (§ 2.2.4)
     */
    toggleSwitch(switchId) {
        const sw = this.switches[switchId];
        if (!sw || sw.locked) return false;

        sw.position = (sw.position === 'PLUS') ? 'MINUS' : 'PLUS';
        return true;
    }

    /**
     * Přivolávací návěst (PN) - Povinně dokumentovaný úkon (§ 2.1.6 & § 2.9.2)
     */
    setCallOn(signalId) {
        const sig = this.signals[signalId];
        if (!sig) return false;

        sig.aspect = 'CALL_ON';
        sig.callOnTimer = 120; // 120 sekund svícení PN
        return true;
    }

    grantConsent(directionName) {
        const t = this.tzz[directionName];
        if (!t) return false;
        t.direction = 'INTO_STATION';
        t.requestPending = false;
        t.pendingTrainId = null;
        return true;
    }
}
