/**
 * Train.js - Třída reprezentující vlakovou soupravu v simulátoru JOP Staničář
 */

export class Train {
    constructor(config) {
        this.id = config.id;                         // např. "Os 4812"
        this.category = config.category || 'Os';     // 'Os', 'R', 'Sp', 'Pn', 'Lv'
        this.from = config.from || 'Lužná';
        this.to = config.to || 'Brod';
        this.targetTrack = config.targetTrack || 'K1'; // Doporučená staniční kolej
        this.arrTime = config.arrTime || '08:15';
        this.depTime = config.depTime || '08:20';
        this.lengthM = config.lengthM || 180;
        this.weightT = config.weightT || 260;
        this.maxSpeed = config.maxSpeed || 90;

        // Směr jízdy: 'RIGHT' (Západ -> Východ) nebo 'LEFT' (Východ -> Západ)
        this.direction = config.direction || 'RIGHT';

        // Stavy vlaku:
        // 'WAITING_CONSENT' - čeká v sousední stanici na udělení souhlasu ('?')
        // 'APPROACHING'     - souhlas udělen, jede po širé trati k vjezdu ('!')
        // 'MOVING'          - v pohybu po stanici ('*')
        // 'STOPPED'         - stojí ve stanici, výstup/nástup (' ')
        // 'DEPARTED'        - odjel ze stanice
        this.state = config.state || 'WAITING_CONSENT';

        // Aktuální pozice v grafu
        this.currentSection = this.direction === 'RIGHT' ? 'T1_EXT' : 'T2_EXT';
        this.progress = 0.0; // 0.0 až 1.0 na daném úseku
        this.speed = 0.0035; // standardní rychlost posunu
        this.currentSpeedKmH = 0;

        // Trasa po úsecích (dynamicky naplánovaná vlakovou cestou)
        this.plannedRouteSections = [];
        this.dwellDuration = config.dwellDuration || 15; // sekundy pobytu ve stanici
        this.dwellRemaining = this.dwellDuration;

        this.position = { x: 0, y: 0 };
    }

    /**
     * Spustí jízdu po udělení souhlasu
     */
    startApproach() {
        if (this.state === 'WAITING_CONSENT') {
            this.state = 'APPROACHING';
        }
    }

    /**
     * Aktualizace vlaku v každém snímku simulace
     */
    update(trackGraph, deltaSec = 0.016, audioSystem = null) {
        if (this.state === 'WAITING_CONSENT' || this.state === 'DEPARTED') {
            this.currentSpeedKmH = 0;
            return;
        }

        // Pokud vlak stojí ve stanici u perónu, odpočítáváme pobyt
        if (this.state === 'STOPPED') {
            this.currentSpeedKmH = 0;
            this.dwellRemaining -= deltaSec;

            // Kontrola, zda máme postavenou odjezdovou cestu ze stanice
            const depSigId = this.direction === 'RIGHT' 
                ? (this.currentSection === 'K1' ? 'S1' : this.currentSection === 'K2' ? 'S2' : 'S3')
                : (this.currentSection === 'K1' ? 'L1' : this.currentSection === 'K2' ? 'L2' : 'L3');

            const depSig = trackGraph.signals[depSigId];

            if (this.dwellRemaining <= 0 && depSig && depSig.aspect !== 'RED') {
                // Můžeme odjet!
                this.state = 'MOVING';
                if (audioSystem) audioSystem.playApproach2();
            } else {
                return;
            }
        }

        // Vlak je v pohybu (APPROACHING nebo MOVING)
        this.currentSpeedKmH = this.maxSpeed;

        // Kontrola návěstidla na aktuálním úseku
        const relevantSignal = Object.values(trackGraph.signals).find(sig => {
            return sig.section === this.currentSection && sig.direction === this.direction;
        });

        if (relevantSignal) {
            const atStopPoint = this.direction === 'RIGHT' 
                ? this.progress >= relevantSignal.stopProgress - 0.02
                : this.progress <= relevantSignal.stopProgress + 0.02;

            if (relevantSignal.aspect === 'RED' && atStopPoint) {
                // Červená! Zastavujeme přesně před návěstidlem
                this.progress = relevantSignal.stopProgress;
                this.currentSpeedKmH = 0;
                this.calculateCoordinates(trackGraph);
                return;
            }

            // Pokud návěstidlo dovoluje jízdu a vlak právě míjí návěstidlo:
            if (relevantSignal.aspect !== 'RED') {
                const justPassed = this.direction === 'RIGHT'
                    ? (this.progress < relevantSignal.stopProgress && (this.progress + this.speed >= relevantSignal.stopProgress))
                    : (this.progress > relevantSignal.stopProgress && (this.progress - this.speed <= relevantSignal.stopProgress));

                if (justPassed) {
                    // Shazujeme návěstidlo do Stůj!
                    relevantSignal.aspect = 'RED';
                    if (audioSystem) audioSystem.playRelayClick();
                }
            }
        }

        // Posun po úseku
        const step = this.direction === 'RIGHT' ? this.speed : -this.speed;
        this.progress += step;

        // Kontrola přechodu na další úsek
        if (this.direction === 'RIGHT' && this.progress >= 1.0) {
            this.moveToNextSection(trackGraph, audioSystem);
        } else if (this.direction === 'LEFT' && this.progress <= 0.0) {
            this.moveToNextSection(trackGraph, audioSystem);
        }

        this.calculateCoordinates(trackGraph);
    }

    /**
     * Přechod mezi úseky
     */
    moveToNextSection(trackGraph, audioSystem) {
        const prevSecId = this.currentSection;
        const prevSec = trackGraph.sections[prevSecId];

        // Uvolnění předchozího úseku
        if (prevSec) {
            prevSec.occupied = false;
            prevSec.locked = false;
            prevSec.routeType = null;
        }

        const nextSecId = this.resolveNextSection(prevSecId, trackGraph);

        if (!nextSecId || nextSecId === 'END_OF_TRACK') {
            this.state = 'DEPARTED';
            return;
        }

        this.currentSection = nextSecId;
        this.progress = this.direction === 'RIGHT' ? 0.0 : 1.0;

        const nextSec = trackGraph.sections[this.currentSection];
        if (nextSec) {
            nextSec.occupied = true;
        }

        // Pokud jsme přijeli na staniční kolej s perónem (K1, K2), zastavíme
        if ((this.currentSection === 'K1' || this.currentSection === 'K2' || this.currentSection === 'K3') && this.state !== 'STOPPED' && this.dwellRemaining > 0) {
            this.state = 'STOPPED';
            this.currentSpeedKmH = 0;
            if (audioSystem) audioSystem.playRelayClick();
        } else {
            this.state = 'MOVING';
        }
    }

    /**
     * Určení dalšího úseku podle polohy výhybek a směru
     */
    resolveNextSection(currentSecId, trackGraph) {
        if (this.direction === 'RIGHT') {
            switch (currentSecId) {
                case 'T1_EXT':
                    return 'T1';
                case 'T1':
                    // Z T1 vjíždíme na západní zhlaví podle W1
                    return trackGraph.switches.W1.position === 'PLUS' ? 'SEC_W1' : 'SEC_W1_DIV';
                case 'SEC_W1':
                    // Rovně z W1 na W2
                    return trackGraph.switches.W2.position === 'PLUS' ? 'SEC_W2' : 'SEC_W2_DIV';
                case 'SEC_W1_DIV':
                    return 'K3';
                case 'SEC_W2':
                    return 'K1';
                case 'SEC_W2_DIV':
                    return 'K2';

                // Výjezdy ze staničních kolejí na východní zhlaví
                case 'K1':
                    return 'SEC_W3';
                case 'K2':
                    return 'SEC_W3_DIV';
                case 'K3':
                    return 'SEC_W4_DIV';

                case 'SEC_W3':
                    return 'SEC_W4';
                case 'SEC_W3_DIV':
                    return 'SEC_W4';
                case 'SEC_W4_DIV':
                    return 'T2';
                case 'SEC_W4':
                    return 'T2';
                case 'T2':
                    return 'T2_EXT';
                case 'T2_EXT':
                    return 'END_OF_TRACK';
                default:
                    return 'END_OF_TRACK';
            }
        } else {
            // Směr LEFT (Východ -> Západ)
            switch (currentSecId) {
                case 'T2_EXT':
                    return 'T2';
                case 'T2':
                    return trackGraph.switches.W4.position === 'PLUS' ? 'SEC_W4' : 'SEC_W4_DIV';
                case 'SEC_W4_DIV':
                    return 'K3';
                case 'SEC_W4':
                    return trackGraph.switches.W3.position === 'PLUS' ? 'SEC_W3' : 'SEC_W3_DIV';
                case 'SEC_W3':
                    return 'K1';
                case 'SEC_W3_DIV':
                    return 'K2';

                // Výjezdy ze stanice na západní zhlaví
                case 'K1':
                    return 'SEC_W2';
                case 'K2':
                    return 'SEC_W2_DIV';
                case 'K3':
                    return 'SEC_W1_DIV';

                case 'SEC_W2':
                    return 'SEC_W1';
                case 'SEC_W2_DIV':
                    return 'SEC_W1';
                case 'SEC_W1_DIV':
                    return 'T1';
                case 'SEC_W1':
                    return 'T1';
                case 'T1':
                    return 'T1_EXT';
                case 'T1_EXT':
                    return 'END_OF_TRACK';
                default:
                    return 'END_OF_TRACK';
            }
        }
    }

    /**
     * Přepočet X, Y pro vykreslení
     */
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
