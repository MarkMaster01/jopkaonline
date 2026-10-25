/**
 * TrackGraph.js - Kompletní model stanice JOP Staničář
 * Zahrnuje úseky, výhybky, návěstidla, traťové souhlasy, přejezdy a logiku stavění jízdních cest.
 */

export class TrackGraph {
    constructor() {
        this.reset();
    }

    reset() {
        // Měřítko / souřadnice JOP mřížky (rastr)
        // Kolejové úseky (Sections)
        this.sections = {
            // Západní trať (vjezd/odjezd)
            'T1_EXT': { id: 'T1_EXT', name: 'Trať Západ (vzdálená)', occupied: false, locked: false, routeType: null, points: [{x: 50, y: 220}, {x: 180, y: 220}] },
            'T1':     { id: 'T1',     name: 'Trať 1 (Západ)',          occupied: false, locked: false, routeType: null, points: [{x: 180, y: 220}, {x: 300, y: 220}] },

            // Západní zhlaví
            'SEC_W1': { id: 'SEC_W1', name: 'Zhlaví W1',              occupied: false, locked: false, routeType: null, points: [{x: 300, y: 220}, {x: 380, y: 220}] },
            'SEC_W2': { id: 'SEC_W2', name: 'Zhlaví W2',              occupied: false, locked: false, routeType: null, points: [{x: 380, y: 220}, {x: 460, y: 220}] },
            'SEC_W1_DIV': { id: 'SEC_W1_DIV', name: 'Spojka W1-K3',   occupied: false, locked: false, routeType: null, points: [{x: 340, y: 220}, {x: 440, y: 300}] },
            'SEC_W2_DIV': { id: 'SEC_W2_DIV', name: 'Spojka W2-K2',   occupied: false, locked: false, routeType: null, points: [{x: 410, y: 220}, {x: 470, y: 140}] },

            // Staniční koleje
            'K2':     { id: 'K2',     name: 'Kolej 2 (horní)',         occupied: false, locked: false, routeType: null, points: [{x: 470, y: 140}, {x: 770, y: 140}], lengthM: 420, platform: true },
            'K1':     { id: 'K1',     name: 'Kolej 1 (hlavní)',        occupied: false, locked: false, routeType: null, points: [{x: 460, y: 220}, {x: 780, y: 220}], lengthM: 550, platform: true },
            'K3':     { id: 'K3',     name: 'Kolej 3 (dolní)',         occupied: false, locked: false, routeType: null, points: [{x: 440, y: 300}, {x: 760, y: 300}], lengthM: 380, platform: false },

            // Východní zhlaví
            'SEC_W3_DIV': { id: 'SEC_W3_DIV', name: 'Spojka K2-W3',   occupied: false, locked: false, routeType: null, points: [{x: 770, y: 140}, {x: 830, y: 220}] },
            'SEC_W4_DIV': { id: 'SEC_W4_DIV', name: 'Spojka K3-W4',   occupied: false, locked: false, routeType: null, points: [{x: 760, y: 300}, {x: 860, y: 220}] },
            'SEC_W3': { id: 'SEC_W3', name: 'Zhlaví W3',              occupied: false, locked: false, routeType: null, points: [{x: 780, y: 220}, {x: 860, y: 220}] },
            'SEC_W4': { id: 'SEC_W4', name: 'Zhlaví W4',              occupied: false, locked: false, routeType: null, points: [{x: 860, y: 220}, {x: 930, y: 220}] },

            // Východní trať (vjezd/odjezd)
            'T2':     { id: 'T2',     name: 'Trať 2 (Východ)',         occupied: false, locked: false, routeType: null, points: [{x: 930, y: 220}, {x: 1060, y: 220}] },
            'T2_EXT': { id: 'T2_EXT', name: 'Trať Východ (vzdálená)',  occupied: false, locked: false, routeType: null, points: [{x: 1060, y: 220}, {x: 1200, y: 220}] }
        };

        // Výhybky (Switches)
        this.switches = {
            'W1': {
                id: 'W1',
                name: 'Výhybka 1',
                position: 'PLUS', // PLUS = rovně (přímý směr na W2), MINUS = odbočka na K3
                locked: false,
                joint: { x: 330, y: 220 },
                plusTarget: { x: 380, y: 220 },
                minusTarget: { x: 375, y: 250 }
            },
            'W2': {
                id: 'W2',
                name: 'Výhybka 2',
                position: 'PLUS', // PLUS = rovně na K1, MINUS = odbočka na K2
                locked: false,
                joint: { x: 405, y: 220 },
                plusTarget: { x: 450, y: 220 },
                minusTarget: { x: 440, y: 180 }
            },
            'W3': {
                id: 'W3',
                name: 'Výhybka 3',
                position: 'PLUS', // PLUS = K1 rovně na W4, MINUS = K2 spojka do W4
                locked: false,
                joint: { x: 835, y: 220 },
                plusTarget: { x: 790, y: 220 },
                minusTarget: { x: 800, y: 180 }
            },
            'W4': {
                id: 'W4',
                name: 'Výhybka 4',
                position: 'PLUS', // PLUS = z W3 na T2, MINUS = z K3 na T2
                locked: false,
                joint: { x: 895, y: 220 },
                plusTarget: { x: 855, y: 220 },
                minusTarget: { x: 830, y: 250 }
            }
        };

        // Přejezdy (PZZ)
        this.crossings = {
            'PZZ1': {
                id: 'PZZ1',
                name: 'Přejezd km 14.2',
                x: 240,
                y: 220,
                state: 'OPEN', // 'OPEN', 'WARNING', 'CLOSED'
                manual: false
            }
        };

        // Návěstidla (Signals)
        // type: 'MAIN' (hlavní - trojúhelník), 'SHUNT' (seřaďovací - šipka)
        // direction: 'RIGHT' (ve směru zleva doprava), 'LEFT' (zprava doleva)
        this.signals = {
            // Vjezdová návěstidla
            '1L': {
                id: '1L',
                name: 'Vjezdové 1L (od Západu)',
                type: 'MAIN',
                direction: 'RIGHT',
                aspect: 'RED', // RED, GREEN, YELLOW, CALL_ON (PN)
                section: 'T1',
                stopProgress: 0.90,
                position: { x: 285, y: 200 }
            },
            '1S': {
                id: '1S',
                name: 'Vjezdové 1S (od Východu)',
                type: 'MAIN',
                direction: 'LEFT',
                aspect: 'RED',
                section: 'T2',
                stopProgress: 0.10,
                position: { x: 945, y: 240 }
            },

            // Odjezdová návěstidla směr Východ (doprava)
            'S2': {
                id: 'S2',
                name: 'Odjezdové S2 (Kolej 2)',
                type: 'MAIN',
                direction: 'RIGHT',
                aspect: 'RED',
                section: 'K2',
                stopProgress: 0.90,
                position: { x: 755, y: 120 }
            },
            'S1': {
                id: 'S1',
                name: 'Odjezdové S1 (Kolej 1)',
                type: 'MAIN',
                direction: 'RIGHT',
                aspect: 'RED',
                section: 'K1',
                stopProgress: 0.90,
                position: { x: 765, y: 200 }
            },
            'S3': {
                id: 'S3',
                name: 'Odjezdové S3 (Kolej 3)',
                type: 'MAIN',
                direction: 'RIGHT',
                aspect: 'RED',
                section: 'K3',
                stopProgress: 0.90,
                position: { x: 745, y: 280 }
            },

            // Odjezdová návěstidla směr Západ (doleva)
            'L2': {
                id: 'L2',
                name: 'Odjezdové L2 (Kolej 2)',
                type: 'MAIN',
                direction: 'LEFT',
                aspect: 'RED',
                section: 'K2',
                stopProgress: 0.10,
                position: { x: 485, y: 160 }
            },
            'L1': {
                id: 'L1',
                name: 'Odjezdové L1 (Kolej 1)',
                type: 'MAIN',
                direction: 'LEFT',
                aspect: 'RED',
                section: 'K1',
                stopProgress: 0.10,
                position: { x: 475, y: 240 }
            },
            'L3': {
                id: 'L3',
                name: 'Odjezdové L3 (Kolej 3)',
                type: 'MAIN',
                direction: 'LEFT',
                aspect: 'RED',
                section: 'K3',
                stopProgress: 0.10,
                position: { x: 455, y: 320 }
            }
        };

        // Traťová zabezpečovací zařízení (TZZ) - Traťový souhlas
        this.tzz = {
            'WEST': {
                name: 'Trať Západ -> Lužná',
                direction: 'NONE', // 'NONE', 'INTO_STATION', 'OUT_OF_STATION'
                requestPending: false,
                arrowPos: { x: 110, y: 180 }
            },
            'EAST': {
                name: 'Trať Východ -> Brod',
                direction: 'NONE',
                requestPending: false,
                arrowPos: { x: 1120, y: 180 }
            }
        };

        // Aktivní postavené cesty
        this.activeRoutes = [];

        // Zásobník povelů (JOP Queue)
        this.queue = [];
        this.queueMode = 'VZ'; // 'VZ' (vydávání povelů) nebo 'PV' (přednostní volba)

        // Definice možných vlakových cest (Katalog cest)
        this.routeCatalog = [
            // Vjezdy ze Západu (1L)
            {
                id: 'R_1L_K1',
                startSignal: '1L',
                endTarget: 'K1',
                direction: 'RIGHT',
                switches: { 'W1': 'PLUS', 'W2': 'PLUS' },
                sections: ['SEC_W1', 'SEC_W2', 'K1'],
                aspect: 'GREEN' // 1. kolej rovně = volno
            },
            {
                id: 'R_1L_K2',
                startSignal: '1L',
                endTarget: 'K2',
                direction: 'RIGHT',
                switches: { 'W1': 'PLUS', 'W2': 'MINUS' },
                sections: ['SEC_W1', 'SEC_W2', 'SEC_W2_DIV', 'K2'],
                aspect: 'YELLOW' // do odbočky 40 km/h
            },
            {
                id: 'R_1L_K3',
                startSignal: '1L',
                endTarget: 'K3',
                direction: 'RIGHT',
                switches: { 'W1': 'MINUS' },
                sections: ['SEC_W1', 'SEC_W1_DIV', 'K3'],
                aspect: 'YELLOW' // do odbočky 40 km/h
            },

            // Odjezdy na Východ (S1, S2, S3 -> T2)
            {
                id: 'R_S1_T2',
                startSignal: 'S1',
                endTarget: 'T2',
                direction: 'RIGHT',
                switches: { 'W3': 'PLUS', 'W4': 'PLUS' },
                sections: ['SEC_W3', 'SEC_W4', 'T2'],
                aspect: 'GREEN'
            },
            {
                id: 'R_S2_T2',
                startSignal: 'S2',
                endTarget: 'T2',
                direction: 'RIGHT',
                switches: { 'W3': 'MINUS', 'W4': 'PLUS' },
                sections: ['SEC_W3_DIV', 'SEC_W4', 'T2'],
                aspect: 'YELLOW'
            },
            {
                id: 'R_S3_T2',
                startSignal: 'S3',
                endTarget: 'T2',
                direction: 'RIGHT',
                switches: { 'W4': 'MINUS' },
                sections: ['SEC_W4_DIV', 'T2'],
                aspect: 'YELLOW'
            },

            // Vjezdy z Východu (1S)
            {
                id: 'R_1S_K1',
                startSignal: '1S',
                endTarget: 'K1',
                direction: 'LEFT',
                switches: { 'W4': 'PLUS', 'W3': 'PLUS' },
                sections: ['SEC_W4', 'SEC_W3', 'K1'],
                aspect: 'GREEN'
            },
            {
                id: 'R_1S_K2',
                startSignal: '1S',
                endTarget: 'K2',
                direction: 'LEFT',
                switches: { 'W4': 'PLUS', 'W3': 'MINUS' },
                sections: ['SEC_W4', 'SEC_W3_DIV', 'K2'],
                aspect: 'YELLOW'
            },
            {
                id: 'R_1S_K3',
                startSignal: '1S',
                endTarget: 'K3',
                direction: 'LEFT',
                switches: { 'W4': 'MINUS' },
                sections: ['SEC_W4_DIV', 'K3'],
                aspect: 'YELLOW'
            },

            // Odjezdy na Západ (L1, L2, L3 -> T1)
            {
                id: 'R_L1_T1',
                startSignal: 'L1',
                endTarget: 'T1',
                direction: 'LEFT',
                switches: { 'W2': 'PLUS', 'W1': 'PLUS' },
                sections: ['SEC_W2', 'SEC_W1', 'T1'],
                aspect: 'GREEN'
            },
            {
                id: 'R_L2_T1',
                startSignal: 'L2',
                endTarget: 'T1',
                direction: 'LEFT',
                switches: { 'W2': 'MINUS', 'W1': 'PLUS' },
                sections: ['SEC_W2_DIV', 'SEC_W1', 'T1'],
                aspect: 'YELLOW'
            },
            {
                id: 'R_L3_T1',
                startSignal: 'L3',
                endTarget: 'T1',
                direction: 'LEFT',
                switches: { 'W1': 'MINUS' },
                sections: ['SEC_W1_DIV', 'SEC_W1', 'T1'],
                aspect: 'YELLOW'
            }
        ];
    }

    /**
     * Pokusí se postavit vlakovou cestu ze startSignal na endTarget (kolej nebo trať)
     * Vrací objekt { success: boolean, reason?: string, route?: object }
     */
    buildRoute(startSignalId, endTargetId, isShunt = false) {
        const sig = this.signals[startSignalId];
        if (!sig) return { success: false, reason: 'Návěstidlo neexistuje' };

        // Hledáme cestu v katalogu
        const routeDef = this.routeCatalog.find(
            r => r.startSignal === startSignalId && (r.endTarget === endTargetId || r.id === endTargetId)
        );

        if (!routeDef) {
            return { success: false, reason: 'Mezi těmito prvky neexistuje definovaná jízdní cesta.' };
        }

        // 1. Kontrola, zda návěstidlo už nemá postavenou cestu
        if (sig.aspect !== 'RED') {
            return { success: false, reason: 'Návěstidlo již má postavenou cestu.' };
        }

        // 2. Kontrola kolizí a obsazenosti úseků
        for (const secId of routeDef.sections) {
            const sec = this.sections[secId];
            if (!sec) continue;

            if (sec.locked) {
                return { success: false, reason: `Úsek ${sec.name} je již uzamčen v jiné jízdní cestě!` };
            }
            if (sec.occupied) {
                return { success: false, reason: `Úsek ${sec.name} je obsazen!` };
            }
        }

        // 3. Kontrola traťového souhlasu při odjezdu na trať
        if (routeDef.endTarget === 'T2') {
            if (this.tzz.EAST.direction !== 'OUT_OF_STATION') {
                return { success: false, reason: 'Chybí traťový souhlas pro odjezd směr Východ!' };
            }
        }
        if (routeDef.endTarget === 'T1') {
            if (this.tzz.WEST.direction !== 'OUT_OF_STATION') {
                return { success: false, reason: 'Chybí traťový souhlas pro odjezd směr Západ!' };
            }
        }

        // 4. Přestavení výhybek do požadované polohy a jejich uzamčení
        for (const [swId, targetPos] of Object.entries(routeDef.switches)) {
            const sw = this.switches[swId];
            if (sw) {
                sw.position = targetPos;
                sw.locked = true;
            }
        }

        // 5. Uzamčení úseků do závěru (zelený závěr VC)
        const routeType = isShunt ? 'SHUNT' : 'TRAIN';
        routeDef.sections.forEach(secId => {
            const sec = this.sections[secId];
            if (sec) {
                sec.locked = true;
                sec.routeType = routeType;
            }
        });

        // 6. Nastavení návěstidla na volnoznak
        sig.aspect = isShunt ? 'WHITE' : routeDef.aspect;

        // 7. Automatické uzavření přejezdu, pokud je na trase
        if (routeDef.sections.includes('T1') || routeDef.startSignal === '1L') {
            this.crossings.PZZ1.state = 'CLOSED';
        }

        // Záznam aktivní cesty
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
     * Zrušení postavené cesty (volba RC v JOP)
     */
    cancelRoute(signalId) {
        const sig = this.signals[signalId];
        if (!sig) return false;

        const routeIdx = this.activeRoutes.findIndex(r => r.def.startSignal === signalId);
        if (routeIdx === -1) {
            // Návěstidlo nemá postavenou cestu
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
     * Ruční přehození výhybky (pokud není zamčená)
     */
    toggleSwitch(switchId) {
        const sw = this.switches[switchId];
        if (!sw) return false;
        if (sw.locked) return false;

        sw.position = (sw.position === 'PLUS') ? 'MINUS' : 'PLUS';
        return true;
    }

    /**
     * Přivolávací návěst (PN) - blikající bílé světlo pro vjezd na obsazenou kolej
     */
    setCallOn(signalId) {
        const sig = this.signals[signalId];
        if (!sig) return false;
        sig.aspect = 'CALL_ON';
        return true;
    }

    /**
     * Zpracování traťového souhlasu
     */
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
