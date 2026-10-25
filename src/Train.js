/**
 * Train.js - Vlaková souprava s precizní zabezpečovací logikou podle ČD / JOP
 */

export class Train {
    constructor(config) {
        this.id = config.id;
        this.category = config.category || 'Os';
        this.from = config.from || 'Západ';
        this.to = config.to || 'Východ';
        this.targetTrack = config.targetTrack || 'K1';
        this.arrTime = config.arrTime || '08:04';
        this.depTime = config.depTime || '08:08';
        this.lengthM = config.lengthM || 180;
        this.weightT = config.weightT || 260;
        this.maxSpeed = config.maxSpeed || 90;

        this.direction = config.direction || 'RIGHT'; // 'RIGHT' nebo 'LEFT'
        this.state = config.state || 'WAITING_CONSENT';

        // Výchozí traťový úsek
        this.currentSection = config.currentSection || (this.direction === 'RIGHT' ? 'T1_EXT' : 'T2_EXT');
        this.progress = this.direction === 'RIGHT' ? 0.0 : 1.0;
        this.speed = config.speed || 0.0035;
        this.currentSpeedKmH = 0;

        this.dwellDuration = config.dwellDuration || 14;
        this.dwellRemaining = this.dwellDuration;
        this.position = { x: 0, y: 0 };

        // Sada projetých návěstidel (aby se vlak po shození návěstidla do Stůj sám nezastavil!)
        this.passedSignals = new Set();
    }

    startApproach() {
        if (this.state === 'WAITING_CONSENT') {
            this.state = 'APPROACHING';
        }
    }

    update(trackGraph, deltaSec = 0.016, audioSystem = null) {
        if (this.state === 'WAITING_CONSENT' || this.state === 'DEPARTED') {
            this.currentSpeedKmH = 0;
            return;
        }

        // 1. Zastavení ve stanici u perónu (odbavení cestujících)
        if (this.state === 'STOPPED') {
            this.currentSpeedKmH = 0;
            this.dwellRemaining -= deltaSec;

            // Kontrola odjezdového návěstidla
            const depSig = this.findDepartureSignal(trackGraph);

            // Může odjet, pokud uplynul pobyt (nebo u tranzitu) a odjezdové návěstidlo svítí na Volno
            if (this.dwellRemaining <= 0 && depSig && depSig.aspect !== 'RED') {
                this.state = 'MOVING';
                if (audioSystem) audioSystem.playApproach2();
            } else {
                return;
            }
        }

        this.currentSpeedKmH = this.maxSpeed;

        // 2. Kontrola návěstidel na aktuálním úseku
        const relevantSignal = Object.values(trackGraph.signals).find(sig => {
            return sig.section === this.currentSection && sig.direction === this.direction;
        });

        if (relevantSignal && !this.passedSignals.has(relevantSignal.id)) {
            const stopProg = relevantSignal.stopProgress ?? (this.direction === 'RIGHT' ? 0.75 : 0.25);

            // Pokud návěstidlo zakazuje jízdu (Stůj / RED)
            if (relevantSignal.aspect === 'RED') {
                const approachingStop = this.direction === 'RIGHT'
                    ? (this.progress >= stopProg - 0.02)
                    : (this.progress <= stopProg + 0.02);

                if (approachingStop) {
                    // Zastavit PŘED návěstidlem!
                    this.progress = stopProg;
                    this.currentSpeedKmH = 0;
                    this.calculateCoordinates(trackGraph);
                    return;
                }
            } else {
                // Návěstidlo dovoluje jízdu (GREEN, YELLOW, CALL_ON)
                const passingPoint = this.direction === 'RIGHT'
                    ? (this.progress >= stopProg)
                    : (this.progress <= stopProg);

                if (passingPoint) {
                    // Vlak právě míjí návěstidlo -> shazujeme návěstidlo do polohy Stůj!
                    relevantSignal.aspect = 'RED';
                    this.passedSignals.add(relevantSignal.id);
                    if (audioSystem) audioSystem.playRelayClick();
                }
            }
        }

        // 3. Posun podél úseku
        const step = this.direction === 'RIGHT' ? this.speed : -this.speed;
        this.progress += step;

        // Přechod na další úsek
        if (this.direction === 'RIGHT' && this.progress >= 1.0) {
            this.moveToNextSection(trackGraph, audioSystem);
        } else if (this.direction === 'LEFT' && this.progress <= 0.0) {
            this.moveToNextSection(trackGraph, audioSystem);
        }

        this.calculateCoordinates(trackGraph);
    }

    findDepartureSignal(trackGraph) {
        return Object.values(trackGraph.signals).find(sig => {
            return sig.section === this.currentSection && sig.direction === this.direction;
        });
    }

    moveToNextSection(trackGraph, audioSystem) {
        const prevSecId = this.currentSection;
        const prevSec = trackGraph.sections[prevSecId];

        if (prevSec) {
            prevSec.occupied = false;
            prevSec.locked = false;
            prevSec.routeType = null;
        }

        const nextSecId = this.resolveNextSection(prevSecId, trackGraph);

        if (!nextSecId || nextSecId === 'END_OF_TRACK' || !trackGraph.sections[nextSecId]) {
            this.state = 'DEPARTED';
            this.currentSpeedKmH = 0;
            return;
        }

        this.currentSection = nextSecId;
        this.progress = this.direction === 'RIGHT' ? 0.0 : 1.0;

        const nextSec = trackGraph.sections[this.currentSection];
        if (nextSec) {
            nextSec.occupied = true;
        }

        // Příjezd na staniční kolej
        if (this.currentSection.startsWith('K') && this.state !== 'STOPPED' && this.dwellRemaining > 0) {
            // Kontrola, zda máme předem postavený průjezd (odjezdové návěstidlo už svítí na Volno)
            const depSig = this.findDepartureSignal(trackGraph);
            if (this.category === 'Nex' || this.category === 'Pn') {
                // Nákladní tranzitní vlak při postaveném průjezdu nezastavuje
                if (depSig && depSig.aspect !== 'RED') {
                    this.state = 'MOVING';
                    return;
                }
            }
            this.state = 'STOPPED';
            this.currentSpeedKmH = 0;
            if (audioSystem) audioSystem.playRelayClick();
        } else {
            this.state = 'MOVING';
        }
    }

    resolveNextSection(cur, graph) {
        if (graph.currentStationId === 'brod') {
            return this.resolveNextSectionBrod(cur, graph);
        } else {
            return this.resolveNextSectionLuzna(cur, graph);
        }
    }

    resolveNextSectionLuzna(cur, graph) {
        const sw = graph.switches;
        if (this.direction === 'RIGHT') {
            switch (cur) {
                case 'T1_EXT': return 'T1';
                case 'T1': return sw.W1.position === 'PLUS' ? 'SEC_W1_W2' : 'SEC_W1_K3';
                case 'SEC_W1_W2': return sw.W2.position === 'PLUS' ? 'K1' : 'SEC_W2_K2';
                case 'SEC_W1_K3': return 'K3';
                case 'SEC_W2_K2': return 'K2';
                case 'K1': return 'SEC_W3_W4';
                case 'K2': return 'SEC_K2_W3';
                case 'K3': return 'SEC_K3_W4';
                case 'SEC_K2_W3': return 'SEC_W3_W4';
                case 'SEC_K3_W4': return 'T2';
                case 'SEC_W3_W4': return 'T2';
                case 'T2': return 'T2_EXT';
                case 'T2_EXT': return 'END_OF_TRACK';
                default: return 'END_OF_TRACK';
            }
        } else {
            switch (cur) {
                case 'T2_EXT': return 'T2';
                case 'T2': return sw.W4.position === 'PLUS' ? 'SEC_W3_W4' : 'SEC_K3_W4';
                case 'SEC_W3_W4': return sw.W3.position === 'PLUS' ? 'K1' : 'SEC_K2_W3';
                case 'SEC_K3_W4': return 'K3';
                case 'SEC_K2_W3': return 'K2';
                case 'K1': return 'SEC_W1_W2';
                case 'K2': return 'SEC_W2_K2';
                case 'K3': return 'SEC_W1_K3';
                case 'SEC_W1_W2': return 'T1';
                case 'SEC_W2_K2': return 'SEC_W1_W2';
                case 'SEC_W1_K3': return 'T1';
                case 'T1': return 'T1_EXT';
                case 'T1_EXT': return 'END_OF_TRACK';
                default: return 'END_OF_TRACK';
            }
        }
    }

    resolveNextSectionBrod(cur, graph) {
        const sw = graph.switches;
        if (this.direction === 'RIGHT') {
            switch (cur) {
                case 'T1_EXT': return 'T1';
                case 'T2_EXT': return 'T2_WEST';
                case 'T1':
                    // Vjezd z 1. traťové koleje: přes W1 do spojky nebo na K1
                    return sw.W1.position === 'PLUS' ? 'SEC_BW1' : 'SEC_BW1_W2';
                case 'T2_WEST':
                    // Vjezd z 2. traťové koleje: přes W3 na K2 nebo K4
                    return sw.W3.position === 'PLUS' ? 'SEC_BW3' : 'SEC_BW3_K4';
                case 'SEC_BW1_W2':
                    // Spojka ze spodní trati na K3 / K5
                    return sw.W2.position === 'PLUS' ? 'SEC_BW2_K3' : 'SEC_BW2_K5';
                case 'SEC_BW1': return 'K1';
                case 'SEC_BW3': return 'K2';
                case 'SEC_BW3_K4': return 'K4';
                case 'SEC_BW2_K3': return 'K3';
                case 'SEC_BW2_K5': return 'K5';

                // Výjezdy na východní zhlaví
                case 'K4': return 'SEC_EW1_K4';
                case 'K2': return 'SEC_EW1';
                case 'K1': return 'SEC_EW2';
                case 'K3': return 'SEC_EW3_K3';
                case 'K5': return 'SEC_EW3_K5';

                case 'SEC_EW1_K4': return 'T2_EAST';
                case 'SEC_EW1': return sw.W7.position === 'PLUS' ? 'T2_EAST' : 'SEC_EW2';
                case 'SEC_EW2': return sw.W8.position === 'PLUS' ? 'T1_EAST' : 'SEC_SOUTH';
                case 'SEC_EW3_K3': return 'SEC_EW2';
                case 'SEC_EW3_K5': return 'SEC_SOUTH';

                case 'SEC_SOUTH': return 'T_SOUTH';
                case 'T1_EAST': return 'T1_EAST_EXT';
                case 'T2_EAST': return 'T2_EAST_EXT';
                case 'T_SOUTH': return 'END_OF_TRACK';
                case 'T1_EAST_EXT': return 'END_OF_TRACK';
                case 'T2_EAST_EXT': return 'END_OF_TRACK';
                default: return 'END_OF_TRACK';
            }
        } else {
            // Směr LEFT (z Východu do Brodu)
            switch (cur) {
                case 'T1_EAST_EXT': return 'T1_EAST';
                case 'T2_EAST_EXT': return 'T2_EAST';
                case 'T1_EAST':
                    return sw.W8.position === 'PLUS' ? 'SEC_EW2' : 'SEC_EW3_K3';
                case 'T2_EAST':
                    return sw.W6.position === 'PLUS' ? 'SEC_EW1' : 'SEC_EW1_K4';
                case 'SEC_EW1_K4': return 'K4';
                case 'SEC_EW1': return 'K2';
                case 'SEC_EW2': return sw.W7.position === 'PLUS' ? 'K1' : 'K3';
                case 'SEC_EW3_K3': return 'K3';

                // Výjezdy na západ
                case 'K1': return 'SEC_BW1';
                case 'K2': return 'SEC_BW3';
                case 'K3': return 'SEC_BW2_K3';
                case 'K4': return 'SEC_BW3_K4';
                case 'K5': return 'SEC_BW2_K5';

                case 'SEC_BW1': return 'T1';
                case 'SEC_BW3': return 'T2_WEST';
                case 'SEC_BW3_K4': return 'T2_WEST';
                case 'SEC_BW2_K3': return 'T1';
                case 'SEC_BW2_K5': return 'T1';

                case 'T1': return 'T1_EXT';
                case 'T2_WEST': return 'T2_EXT';
                case 'T1_EXT': return 'END_OF_TRACK';
                case 'T2_EXT': return 'END_OF_TRACK';
                default: return 'END_OF_TRACK';
            }
        }
    }

    calculateCoordinates(trackGraph) {
        const sec = trackGraph.sections[this.currentSection];
        if (!sec || !sec.points) return;

        const [p1, p2] = sec.points;
        const clampedProg = Math.max(0, Math.min(1, this.progress));

        this.position = {
            x: p1.x + (p2.x - p1.x) * clampedProg,
            y: p1.y + (p2.y - p1.y) * clampedProg
        };
    }
}
