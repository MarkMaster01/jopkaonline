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
        this.routeCatalog = JSON.parse(JSON.stringify(station.routeCatalog || station.routes || []));

        this.commandBuffer = [];
        this.bufferMode = 'VZ';
        this.activeRoutes = [];
        this.pendingDocCommand = null;
    }

    /**
     * Kontrola, zda je traťový úsek volný pro vjezd dalšího vlaku
     */
    isLineFree(directionKey) {
        const lineSectionId = directionKey === 'WEST' ? 'T1' : 'T2';
        const sec = this.sections[lineSectionId];
        return sec ? !sec.occupied : true;
    }

    pushRouteToBuffer(startSignalId, endTargetId, isShunt = false) {
        // Vyhledání cesty v katalogu podle ID, endTarget nebo targetTrack
        const routeDef = this.routeCatalog.find(
            r => r.startSignal === startSignalId && 
                (r.endTarget === endTargetId || r.id === endTargetId || r.targetTrack === endTargetId)
        );

        if (!routeDef) {
            return { success: false, reason: `Nenalezena cesta z ${startSignalId} na ${endTargetId}.` };
        }

        const cmd = {
            id: 'CMD_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            routeDef: routeDef,
            isShunt: isShunt,
            status: 'WAITING'
        };

        if (this.bufferMode === 'PV') {
            this.commandBuffer.unshift(cmd);
        } else {
            this.commandBuffer.push(cmd);
        }

        this.processBuffer();
        return { success: true, command: cmd };
    }

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

        // Kontrola úseků UVNITŘ stavěné cesty
        for (const secId of routeDef.sections) {
            // Ignorujeme úsek před návěstidlem, na kterém vlak stál před vjezdovým návěstidlem
            if (secId === sig.section && sig.id.length <= 2 && !sig.id.startsWith('S')) {
                continue;
            }

            const sec = this.sections[secId];
            if (!sec) continue;

            if (sec.locked || sec.occupied) {
                currentCmd.status = 'BLOCKED_TRACK';
                return;
            }
        }

        // Kontrola a uzamčení výhybek
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

        // Závěr cesty
        const routeType = currentCmd.isShunt ? 'SHUNT' : 'TRAIN';
        routeDef.sections.forEach(secId => {
            const sec = this.sections[secId];
            if (sec) {
                sec.locked = true;
                sec.routeType = routeType;
            }
        });

        // Rozsvícení návěstidla (VOLNO / BÍLÁ)
        sig.aspect = currentCmd.isShunt ? 'WHITE' : (routeDef.aspect || 'GREEN');

        // Uzavření přejezdů
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

        this.commandBuffer.shift();
    }

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

    toggleSwitch(switchId) {
        const sw = this.switches[switchId];
        if (!sw || sw.locked) return false;
        sw.position = (sw.position === 'PLUS') ? 'MINUS' : 'PLUS';
        return true;
    }

    setCallOn(signalId) {
        const sig = this.signals[signalId];
        if (!sig) return false;
        sig.aspect = 'CALL_ON';
        sig.callOnTimer = 120;
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
