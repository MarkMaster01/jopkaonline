/**
 * Logika zabezpečovacího zařízení a grafu kolejiště
 */
export class TrackGraph {
    constructor() {
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
                aspect: 'RED',            // 'RED' (Stůj) nebo 'GREEN' (Volno)
                segment: 'S1',             // Úsek, na kterém návěstidlo leží
                stopProgress: 0.85,        // Pozice na úseku (85 %), kde vlak zastaví
                position: { x: 270, y: 175 } // Souřadnice ikonky na Canvasu
            }
        };
    }

        // Výhybky (Switches)
        this.switches = {
            'W1': {
                id: 'W1',
                name: 'Výhybka 1',
                position: 'STRAIGHT', // 'STRAIGHT' (přímý směr) nebo 'DIVERGING' (odbočka)
                locked: false,
                entrySection: 'S1',
                straightSection: 'S2',
                divergingSection: 'S3',
                // Kloub výhybky a body odbočení pro UI
                joint: { x: 300, y: 200 },
                straightTarget: { x: 450, y: 200 },
                divergingTarget: { x: 450, y: 300 }
            }
        };
    }

/**
     * Přepíná návěst mezi Stůj (RED) a Volno (GREEN)
     */
    toggleSignal(signalId) {
        const sig = this.signals[signalId];
        if (sig) {
            sig.aspect = (sig.aspect === 'RED') ? 'GREEN' : 'RED';
        }
    }

    // ... stávající metody toggleSwitch a toggleOccupancy ...


    /**
     * Přehodí polohu výhybky, pokud není zamčená vlakovou cestou
     */
    toggleSwitch(switchId) {
        const sw = this.switches[switchId];
        if (!sw) return false;
        if (sw.locked) {
            console.warn(`Výhybka ${switchId} je zamčená!`);
            return false;
        }

        sw.position = (sw.position === 'STRAIGHT') ? 'DIVERGING' : 'STRAIGHT';
        return true;
    }

    /**
     * Přepne obsazenost úseku vlakem (pro testování)
     */
    toggleOccupancy(sectionId) {
        const sec = this.sections[sectionId];
        if (sec) {
            sec.occupied = !sec.occupied;
        }
    }

