/**
 * Train.js - Třída vlakové soupravy s podporou vícekolejných stanic
 */

export class Train {
    constructor(config) {
        this.id = config.id;
        this.category = config.category || 'Os';
        this.from = config.from || 'Západ';
        this.to = config.to || 'Východ';
        this.targetTrack = config.targetTrack || 'K1';
        this.arrTime = config.arrTime || '08:05';
        this.depTime = config.depTime || '08:10';
        this.lengthM = config.lengthM || 180;
        this.weightT = config.weightT || 260;
        this.maxSpeed = config.maxSpeed || 90;

        this.direction = config.direction || 'RIGHT'; // 'RIGHT' nebo 'LEFT'
        this.state = config.state || 'WAITING_CONSENT';

        // Počáteční úsek podle směru jízdy
        if (config.currentSection) {
            this.currentSection = config.currentSection;
        } else {
            this.currentSection = this.direction === 'RIGHT' ? 'T1_EXT' : 'T2_EXT';
        }

        this.progress = this.direction === 'RIGHT' ? 0.0 : 1.0;
        this.speed = config.speed || 0.0035;
        this.currentSpeedKmH = 0;

        this.dwellDuration = config.dwellDuration || 14;
        this.dwellRemaining = this.dwellDuration;
        this.position = { x: 0, y: 0 };
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

        // Vlak stojí u nástupiště
        if (this.state === 'STOPPED') {
            this.currentSpeedKmH = 0;
            this.dwellRemaining -= deltaSec;

            // Zjistíme odjezdové návěstidlo pro tento směr a kolej
            const depSig = this.findDepartureSignal(trackGraph);

            if (this.dwellRemaining <= 0 && depSig && depSig.aspect !== 'RED') {
                this.state = 'MOVING';
                if (audioSystem) audioSystem.playApproach2();
            } else {
                return;
            }
        }

        this.currentSpeedKmH = this.maxSpeed;

        // Kontrola návěstidla na aktuálním úseku
        const relevantSignal = Object.values(trackGraph.signals).find(sig => {
            return sig.section === this.currentSection && sig.direction === this.direction;
        });

        if (relevantSignal) {
            const atStop = this.direction === 'RIGHT'
                ? this.progress >= relevantSignal.stopProgress - 0.02
                : this.progress <= relevantSignal.stopProgress + 0.02;

            if (relevantSignal.aspect === 'RED' && atStop) {
                // Zastavení před návěstidlem
                this.progress = relevantSignal.stopProgress;
                this.currentSpeedKmH = 0;
                this.calculateCoordinates(trackGraph);
                return;
            }

            // Průjezd kolem návěstidla s volnoznakem
            if (relevantSignal.aspect !== 'RED') {
                const justPassed = this.direction === 'RIGHT'
                    ? (this.progress < relevantSignal.stopProgress && (this.progress + this.speed >= relevantSignal.stopProgress))
                    : (this.progress > relevantSignal.stopProgress && (this.progress - this.speed <= relevantSignal.stopProgress));

                if (justPassed) {
                    // Shazujeme návěstidlo do polohy Stůj
                    relevantSignal.aspect = 'RED';
                    if (audioSystem) audioSystem.playRelayClick();
                }
            }
        }

        // Posun po úseku
        const step = this.direction === 'RIGHT' ? this.speed : -this.speed;
        this.progress += step;

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
            return;
        }

        this.currentSection = nextSecId;
        this.progress = this.direction === 'RIGHT' ? 0.0 : 1.0;

        const nextSec = trackGraph.sections[this.currentSection];
        if (nextSec) {
            nextSec.occupied = true;
        }

        // Kontrola zastavení ve stanici u perónu
        if (this.currentSection.startsWith('K') && this.state !== 'STOPPED' && this.dwellRemaining > 0) {
            this.state = 'STOPPED';
            this.currentSpeedKmH = 0;
            if (audioSystem) audioSystem.playRelayClick();
        } else {
            this.state = 'MOVING';
        }
    }

    resolveNextSection(cur, graph) {
        const stationId = graph.currentStationId;

        if (stationId === 'brod') {
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
                case 'T1': return sw.W1.position === 'PLUS' ? 'SEC_BW1' : 'SEC_BW1_K3';
                case 'T2_WEST': return sw.W2.position === 'PLUS' ? 'SEC_BW2' : 'SEC_BW2_K4';
                case 'SEC_BW1': return 'K1';
                case 'SEC_BW1_K3': return sw.W3.position === 'PLUS' ? 'K3' : 'SEC_BW1_K5';
                case 'SEC_BW1_K5': return 'K5';
                case 'SEC_BW2': return 'K2';
                case 'SEC_BW2_K4': return 'K4';
                case 'K1': return 'SEC_BW6';
                case 'K2': return 'SEC_BW5';
                case 'K3': return 'SEC_BW6_K3';
                case 'K4': return 'SEC_BW5_K4';
                case 'K5': return 'SEC_BW7_K5';
                case 'SEC_BW5_K4': return 'SEC_BW5';
                case 'SEC_BW5': return 'T_EAST';
                case 'SEC_BW6_K3': return 'SEC_BW6';
                case 'SEC_BW7_K5': return 'SEC_BW6';
                case 'SEC_BW6': return sw.W7.position === 'PLUS' ? 'T_EAST' : 'TRAIN_SOUTH';
                case 'TRAIN_SOUTH': return 'END_OF_TRACK';
                case 'T_EAST': return 'T_EAST_EXT';
                case 'T_EAST_EXT': return 'END_OF_TRACK';
                default: return 'END_OF_TRACK';
            }
        } else {
            switch (cur) {
                case 'T_EAST_EXT': return 'T_EAST';
                case 'T_EAST': return sw.W6.position === 'PLUS' ? 'SEC_BW6' : 'SEC_BW6_K3';
                case 'SEC_BW6': return 'K1';
                case 'SEC_BW6_K3': return 'K3';
                case 'K1': return 'SEC_BW1';
                case 'K2': return 'SEC_BW2';
                case 'K3': return 'SEC_BW1_K3';
                case 'K4': return 'SEC_BW2_K4';
                case 'K5': return 'SEC_BW1_K5';
                case 'SEC_BW1': return 'T1';
                case 'SEC_BW2': return 'T2_WEST';
                case 'SEC_BW1_K3': return 'T1';
                case 'SEC_BW2_K4': return 'T2_WEST';
                case 'SEC_BW1_K5': return 'T1';
                case 'T1': return 'T1_EXT';
                case 'T1_EXT': return 'END_OF_TRACK';
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
