/**
 * TrackGraph.js - Správa modelu kolejiště a zabezpečovacího zařízení s podporou více stanic
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
        // Hluboké kopie pro nezávislý stav simulace
        this.sections = JSON.parse(JSON.stringify(station.sections));
        this.switches = JSON.parse(JSON.stringify(station.switches));
        this.crossings = JSON.parse(JSON.stringify(station.crossings));
        this.signals = JSON.parse(JSON.stringify(station.signals));
        this.tzz = JSON.parse(JSON.stringify(station.tzz));
        this.routeCatalog = JSON.parse(JSON.stringify(station.routeCatalog));

        this.activeRoutes = [];
        this.queue = [];
        this.queueMode = 'VZ';
    }

    /**
     * Pokusí se postavit vlakovou cestu ze startSignal na endTarget
     */
    buildRoute(startSignalId, endTargetId, isShunt = false) {
        const sig = this.signals[startSignalId];
        if (!sig) return { success: false, reason: 'Návěstidlo neexistuje' };

        // Nalezení cesty v katalogu
        const routeDef = this.routeCatalog.find(
            r => r.startSignal === startSignalId && (r.endTarget === endTargetId || r.id === endTargetId)
        );

        if (!routeDef) {
            return { success: false, reason: 'Mezi těmito prvky není definována vlaková cesta.' };
        }

        // 1. Kontrola, zda návěstidlo již nemá postavenou cestu
        if (sig.aspect !== 'RED') {
            return { success: false, reason: 'Návěstidlo již má postavenou cestu.' };
        }

        // 2. Kontrola kolizí a volnosti úseků
        for (const secId of routeDef.sections) {
            const sec = this.sections[secId];
            if (!sec) continue;

            if (sec.locked) {
                return { success: false, reason: `Úsek ${sec.name} je již uzamčen v jiné cestě!` };
            }
            if (sec.occupied) {
                return { success: false, reason: `Úsek ${sec.name} je obsazen vlakem!` };
            }
        }

        // 3. Kontrola traťového souhlasu při odjezdu na trať
        if (routeDef.endTarget === 'T2' || routeDef.endTarget === 'T_EAST') {
            if (this.tzz.EAST && this.tzz.EAST.direction !== 'OUT_OF_STATION') {
                return { success: false, reason: 'Chybí traťový souhlas pro odjezd směr Východ!' };
            }
        }
        if (routeDef.endTarget === 'T1' || routeDef.endTarget === 'T2_WEST') {
            if (this.tzz.WEST && this.tzz.WEST.direction !== 'OUT_OF_STATION') {
                return { success: false, reason: 'Chybí traťový souhlas pro odjezd směr Západ!' };
            }
        }

        // 4. Přestavení výhybek do požadované polohy a uzamčení
        for (const [swId, targetPos] of Object.entries(routeDef.switches)) {
            const sw = this.switches[swId];
            if (sw) {
                sw.position = targetPos;
                sw.locked = true;
            }
        }

        // 5. Uzamčení úseků do zeleného závěru VC
        const routeType = isShunt ? 'SHUNT' : 'TRAIN';
        routeDef.sections.forEach(secId => {
            const sec = this.sections[secId];
            if (sec) {
                sec.locked = true;
                sec.routeType = routeType;
            }
        });

        // 6. Rozsvícení volnoznaku na návěstidle
        sig.aspect = isShunt ? 'WHITE' : routeDef.aspect;

        // 7. Uzavření přejezdů na trase
        for (const cross of Object.values(this.crossings)) {
            if (routeDef.sections.includes('T1') || routeDef.startSignal === '1L') {
                cross.state = 'CLOSED';
            }
        }

        const activeRoute = {
            id: routeDef.id,
            def: routeDef,
            isShunt: isShunt,
            passed: false
        };
        this.activeRoutes.push(activeRoute);

        return { success: true, route: activeRoute };
    }

    /**
     * Zrušení postavené cesty (volba RC)
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

        // Uvolnění úseků
        activeRoute.def.sections.forEach(secId => {
            const sec = this.sections[secId];
            if (sec && !sec.occupied) {
                sec.locked = false;
                sec.routeType = null;
            }
        });

        // Odemknutí výhybek
        for (const swId of Object.keys(activeRoute.def.switches)) {
            const sw = this.switches[swId];
            if (sw) sw.locked = false;
        }

        this.activeRoutes.splice(routeIdx, 1);
        return true;
    }

    /**
     * Ruční přehození výhybky v klidovém stavu
     */
    toggleSwitch(switchId) {
        const sw = this.switches[switchId];
        if (!sw) return false;
        if (sw.locked) return false;

        sw.position = (sw.position === 'PLUS') ? 'MINUS' : 'PLUS';
        return true;
    }

    /**
     * Přivolávací návěst (PN)
     */
    setCallOn(signalId) {
        const sig = this.signals[signalId];
        if (!sig) return false;
        sig.aspect = 'CALL_ON';
        return true;
    }

    grantConsent(directionName) {
        const t = this.tzz[directionName];
        if (!t) return false;
        t.direction = 'INTO_STATION';
        t.requestPending = false;
        return true;
    }

    requestConsent(directionName) {
        const t = this.tzz[directionName];
        if (!t) return false;
        t.direction = 'OUT_OF_STATION';
        t.requestPending = false;
        return true;
    }
}
