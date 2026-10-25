/**
 * Logika zabezpečovacího zařízení a grafu kolejiště
 */
export class TrackGraph {
    constructor() {
        this.selectedSignalId = null; // Vybrané návěstidlo jako START cesty

        // Kolejové úseky (Sections)
        this.sections = {
            'S1': { id: 'S1', name: 'Traťový úsek Vjezd', occupied: false, points: [{x: 100, y: 200}, {x: 300, y: 200}] },
            'S2': { id: 'S2', name: 'Staniční kolej 1 (Přímá)', occupied: false, points: [{x: 450, y: 200}, {x: 750, y: 200}] },
            'S3': { id: 'S3', name: 'Staniční kolej 2 (Odbočka)', occupied: false, points: [{x: 450, y: 300}, {x: 750, y: 300}] }
        };

        // Návěstidla (Signals)
        this.signals = {
            'L': {
                id: 'L',
                name: 'Vjezdové návěstidlo L',
                aspect: 'RED',            // 'RED' nebo 'GREEN'
                segment: 'S1',
                stopProgress: 0.85,
                position: { x: 270, y: 175 }
            }
        };

        // Výhybky (Switches)
        this.switches = {
            'W1': {
                id: 'W1',
                name: 'Výhybka 1',
                position: 'STRAIGHT',     // 'STRAIGHT' nebo 'DIVERGING'
                locked: false,            // Zamčeno vlakovou cestou
                entrySection: 'S1',
                straightSection: 'S2',
                divergingSection: 'S3',
                joint: { x: 300, y: 200 },
                straightTarget: { x: 450, y: 200 },
                divergingTarget: { x: 450, y: 300 }
            }
        };
    }

    /**
     * Vybere nebo zruší výběr návěstidla (START)
     */
    selectSignal(signalId) {
        if (this.selectedSignalId === signalId) {
            this.selectedSignalId = null;
        } else {
            this.selectedSignalId = signalId;
        }
    }

    /**
     * Postaví vlakovou cestu z návěstidla na cílovou kolej
     */
    setRoute(signalId, targetSectionId) {
        const sig = this.signals[signalId];
        const sw = this.switches['W1'];
        if (!sig || !sw) return false;

        if (targetSectionId === 'S2') {
            sw.position = 'STRAIGHT';
            sw.locked = true;
            sig.aspect = 'GREEN';
            this.selectedSignalId = null;
            return true;
        } else if (targetSectionId === 'S3') {
            sw.position = 'DIVERGING';
            sw.locked = true;
            sig.aspect = 'GREEN';
            this.selectedSignalId = null;
            return true;
        }

        return false;
    }

    /**
     * Přehodí polohu výhybky (pouze pokud není zamčená)
     */
    toggleSwitch(switchId) {
        const sw = this.switches[switchId];
        if (!sw) return false;
        if (sw.locked) {
            console.warn(`Výhybka ${switchId} je zamčená vlakovou cestou!`);
            return false;
        }

        sw.position = (sw.position === 'STRAIGHT') ? 'DIVERGING' : 'STRAIGHT';
        return true;
    }

    toggleOccupancy(sectionId) {
        const sec = this.sections[sectionId];
        if (sec) {
            sec.occupied = !sec.occupied;
        }
    }
}
