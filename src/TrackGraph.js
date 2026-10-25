/**
 * TrackGraph.js - Správa modelu kolejiště a zabezpečovacího zařízení
 * Plná podpora stavění průjezdů (přímý vjezd i odjezd ze stejné koleje), traťového souhlasu a rušení cest.
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

        this.activeRoutes = [];
        this.queue = [];
        this.queueMode = 'VZ';
    }

    /**
     * Pokusí se postavit vlakovou cestu ze startSignal na endTarget.
     * Podporuje vjezdy, odjezdy i plnohodnotné průjezdy stanicí.
     */
    buildRoute(startSignalId, endTargetId, isShunt = false) {
        const sig = this.signals[startSignalId];
        if (!sig) return { success: false, reason: 'Návěstidlo neexistuje' };

        // Nalezení cesty v katalogu
        const routeDef = this.routeCatalog.find(
            r => r.startSignal === startSignalId && (r.endTarget === endTargetId || r.id === endTargetId)
        );

        if (!routeDef) {
            return { success: false, reason: 'Mezi těmito prvky není definována žádná vlaková cesta.' };
        }

        // 1. Kontrola, zda návěstidlo již nemá postavenou cestu
        if (sig.aspect !== 'RED') {
            return { success: false, reason: 'Na tomto návěstidle již svítí volnoznak.' };
        }

        const isDepartureSignal = startSignalId.startsWith('S') || (startSignalId.startsWith('L') && startSignalId.length === 2);

        // 2. Kontrola kolizí a volnosti jednotlivých úseků cesty
        for (const secId of routeDef.sections) {
            const sec = this.sections[secId];
            if (!sec) continue;

            // Pokud stavíme odjezd ze staniční koleje (např. S1 z K1),
            // staniční kolej K1 může být obsazena čekajícím vlakem i uzamčena vjezdovou cestou (průjezd)
            const isOriginTrack = isDepartureSignal && (secId === sig.section);

            if (!isOriginTrack) {
                // Kontrola uzamčení jinou protichůdnou cestou
                if (sec.locked) {
                    // Povolíme průjezd, pokud je cílová kolej uzamčena návaznou odjezdovou cestou ve stejném směru
                    const isThroughRoute = (secId === routeDef.endTarget && this.activeRoutes.some(r => r.def.direction === routeDef.direction));
                    if (!isThroughRoute) {
                        return { success: false, reason: `Úsek ${sec.name} je již uzamčen v jiné jízdní cestě!` };
                    }
                }
                // Kontrola obsazenosti úseku
                if (sec.occupied) {
                    return { success: false, reason: `Úsek ${sec.name} je obsazen!` };
                }
            }
        }

        // 3. Kontrola traťového souhlasu při odjezdu na širou trať
        if (routeDef.endTarget === 'T2' || routeDef.endTarget === 'T1_EAST' || routeDef.endTarget === 'T2_EAST') {
            if (this.tzz.EAST && this.tzz.EAST.direction !== 'OUT_OF_STATION') {
                return { success: false, reason: 'Chybí traťový souhlas pro odjezd směr Východ! (Klikněte na TZZ Východ)' };
            }
        }
        if (routeDef.endTarget === 'T1' || routeDef.endTarget === 'T2_WEST') {
            if (this.tzz.WEST && this.tzz.WEST.direction !== 'OUT_OF_STATION') {
                return { success: false, reason: 'Chybí traťový souhlas pro odjezd směr Západ! (Klikněte na TZZ Západ)' };
            }
        }
        if (routeDef.endTarget === 'T_SOUTH') {
            if (this.tzz.SOUTH && this.tzz.SOUTH.direction !== 'OUT_OF_STATION') {
                return { success: false, reason: 'Chybí traťový souhlas pro odjezd směr Jih!' };
            }
        }

        // 4. Automatické přestavení a uzamčení výhybek do požadované polohy
        for (const [swId, targetPos] of Object.entries(routeDef.switches)) {
            const sw = this.switches[swId];
            if (sw) {
                sw.position = targetPos;
                sw.locked = true;
            }
        }

        // 5. Závěr vlakové cesty (zelené rozsvícení úseků od návěstidla)
        const routeType = isShunt ? 'SHUNT' : 'TRAIN';
        routeDef.sections.forEach(secId => {
            const sec = this.sections[secId];
            if (sec) {
                sec.locked = true;
                sec.routeType = routeType;
            }
        });

        // 6. Rozsvícení znaku na návěstidle
        sig.aspect = isShunt ? 'WHITE' : routeDef.aspect;

        // 7. Automatické uzavření přejezdu na zhlaví/trati
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
     * Rušení postavené cesty (volba RC)
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

    toggleSwitch(switchId) {
        const sw = this.switches[switchId];
        if (!sw) return false;
        if (sw.locked) return false;

        sw.position = (sw.position === 'PLUS') ? 'MINUS' : 'PLUS';
        return true;
    }

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
        t.pendingTrainId = null;
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
