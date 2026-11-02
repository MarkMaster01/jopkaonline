/**
 * Timetable.js - Správa jízdního řádu a pohybu vlaků
 */
export class Train {
    constructor(data) {
        this.id = data.id;
        this.category = data.category || 'Os';
        this.from = data.from;
        this.to = data.to;
        this.arrTime = data.arrTime;
        this.depTime = data.depTime;
        this.targetTrack = data.targetTrack;
        this.direction = data.direction || 'RIGHT';
        
        this.state = 'PLANNED'; // PLANNED, WAITING_CONSENT, APPROACHING, MOVING, STOPPED, DEPARTED
        this.currentSection = null;
        this.progress = 0;
        this.speed = 0.15;
        this.dwellRemaining = 30;
    }

    startApproach() {
        this.state = 'APPROACHING';
        this.currentSection = this.direction === 'RIGHT' ? 'T1' : 'T2';
        this.progress = 0;
    }

    update(graph, deltaSec) {
        if (this.state === 'APPROACHING') {
            const lineSec = graph.sections[this.currentSection];
            if (lineSec) lineSec.occupied = true;

            this.progress += deltaSec * this.speed;
            if (this.progress >= 1) {
                this.progress = 1;
                
                // Čekání u vjezdového návěstidla
                const entrySignalId = this.direction === 'RIGHT' ? '1L' : '1S';
                const sig = graph.signals[entrySignalId];

                // Při rozsvícení jakéhokoliv znaku kromě ČERVENÉ (Volno, PN atd.) vlak vjede
                if (sig && sig.aspect !== 'RED') {
                    this.state = 'MOVING';
                    this.progress = 0;
                    
                    // Zhasnutí návěstidla na STŮJ po průjezdu čela (§ 2.2.8 JOP IV)
                    sig.aspect = 'RED';

                    // Uvolnění traťového úseku T1 / T2
                    if (lineSec) lineSec.occupied = false;
                    
                    // Vjezd na první úsek zhlaví
                    this.currentSection = this.direction === 'RIGHT' ? '1L_IN' : '1S_IN';
                    if (graph.sections[this.currentSection]) {
                        graph.sections[this.currentSection].occupied = true;
                    }
                }
            }
        } else if (this.state === 'MOVING') {
            this.progress += deltaSec * 0.25;
            if (this.progress >= 1) {
                if (graph.sections[this.currentSection]) {
                    graph.sections[this.currentSection].occupied = false;
                    graph.sections[this.currentSection].locked = false;
                }

                this.currentSection = this.targetTrack;
                if (graph.sections[this.targetTrack]) {
                    graph.sections[this.targetTrack].occupied = true;
                }
                this.state = 'STOPPED';
                this.dwellRemaining = 20;
            }
        } else if (this.state === 'STOPPED') {
            this.dwellRemaining -= deltaSec;
            if (this.dwellRemaining <= 0) {
                const exitSigId = (this.targetTrack === 'K1') ? 'L1' : (this.targetTrack === 'K2' ? 'L2' : 'L3');
                const sig = graph.signals[exitSigId];

                if (sig && sig.aspect !== 'RED') {
                    sig.aspect = 'RED';
                    if (graph.sections[this.targetTrack]) {
                        graph.sections[this.targetTrack].occupied = false;
                        graph.sections[this.targetTrack].locked = false;
                    }
                    this.state = 'DEPARTED';
                }
            }
        }
    }
}

export class Timetable {
    constructor(stationId = 'luzna') {
        this.stationId = stationId;
        this.timeScale = 1;
        this.simSeconds = 8 * 3600;
        this.autoTrain = false;
        this.trains = [];

        this.initDefaultTrains();
    }

    initDefaultTrains() {
        this.trains = [
            new Train({ id: 'Os 7702', category: 'Os', from: 'Rakovník', to: 'Kladno', arrTime: '08:05', depTime: '08:07', targetTrack: 'K2', direction: 'RIGHT' }),
            new Train({ id: 'R 1205', category: 'R', from: 'Praha', to: 'Rakovník', arrTime: '08:18', depTime: '08:20', targetTrack: 'K1', direction: 'LEFT' }),
            new Train({ id: 'Os 7704', category: 'Os', from: 'Rakovník', to: 'Kladno', arrTime: '08:32', depTime: '08:34', targetTrack: 'K3', direction: 'RIGHT' })
        ];
    }

    getFormattedTime() {
        const h = Math.floor(this.simSeconds / 3600) % 24;
        const m = Math.floor((this.simSeconds % 3600) / 60);
        const s = Math.floor(this.simSeconds % 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    updateTime(deltaSec, graph) {
        this.simSeconds += deltaSec;

        this.trains.forEach(train => {
            if (train.state === 'PLANNED') {
                const [h, m] = train.arrTime.split(':').map(Number);
                const trainArrSec = h * 3600 + m * 60;

                if (this.simSeconds >= trainArrSec) {
                    train.state = 'WAITING_CONSENT';
                    const dirKey = train.direction === 'RIGHT' ? 'WEST' : 'EAST';
                    if (graph.tzz[dirKey]) {
                        graph.tzz[dirKey].requestPending = true;
                        graph.tzz[dirKey].pendingTrainId = train.id;
                    }
                }
            }

            // Automatický vjezd ze sousední stanice pouze pokud je trať ZCELA VOLNÁ
            if (this.autoTrain && train.state === 'WAITING_CONSENT') {
                const dirKey = train.direction === 'RIGHT' ? 'WEST' : 'EAST';
                if (graph.isLineFree(dirKey)) {
                    train.startApproach();
                    graph.grantConsent(dirKey);
                }
            }
        });
    }
}
