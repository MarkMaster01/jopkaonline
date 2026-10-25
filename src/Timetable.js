/**
 * Timetable.js - Grafikon vlakové dopravy (GVD) podle skutečného času simulace
 */
import { STATIONS } from './Stations.js';
import { Train } from './Train.js';

export class Timetable {
    constructor(stationId = 'luzna') {
        this.simTimeSec = 8 * 3600; // Počátek simulace 08:00:00
        this.timeScale = 1;
        this.autoEntry = false; // Automatický vjezd bez nutnosti manuálního souhlasu
        this.trainCounter = 100;
        this.trains = [];

        this.loadStation(stationId);
    }

    loadStation(stationId) {
        this.currentStationId = stationId;
        const station = STATIONS[stationId] || STATIONS['luzna'];
        // Vlaky začínají ve stavu PLANNED (podle času v GVD)
        this.trains = station.defaultSchedule.map(cfg => {
            const tr = new Train(cfg);
            tr.state = 'PLANNED'; // Ještě nenastal čas odjezdu ze sousední stanice
            return tr;
        });
    }

    spawnRandomTrain() {
        this.trainCounter += 5;
        const isBrod = this.currentStationId === 'brod';
        const isRight = Math.random() > 0.5;
        const categories = ['Os', 'R', 'Pn', 'Nex'];
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const num = Math.floor(1000 + Math.random() * 9000);

        const currentSec = this.simTimeSec;
        const arrSec = currentSec + 90; // za 1.5 minuty
        const depSec = arrSec + 240;

        const formatSec = (s) => {
            const h = Math.floor(s / 3600) % 24;
            const m = Math.floor((s % 3600) / 60);
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        };

        const targetTrack = isBrod 
            ? (['K1', 'K2', 'K3', 'K4', 'K5'][Math.floor(Math.random() * 5)])
            : (['K1', 'K2', 'K3'][Math.floor(Math.random() * 3)]);

        const newTrain = new Train({
            id: `${cat} ${num}`,
            category: cat,
            from: isRight ? 'Západ' : 'Východ',
            to: isRight ? 'Východ' : 'Západ',
            targetTrack: targetTrack,
            arrTime: formatSec(arrSec),
            depTime: formatSec(depSec),
            direction: isRight ? 'RIGHT' : 'LEFT',
            speed: 0.0035,
            maxSpeed: 85,
            dwellDuration: 14,
            state: 'PLANNED'
        });

        this.trains.push(newTrain);
        return newTrain;
    }

    /**
     * Aktualizace simulačního času a řízení příchodu vlaků podle GVD
     */
    updateTime(deltaSec, trackGraph, audioSystem = null) {
        this.simTimeSec += deltaSec * this.timeScale;

        const currentHourMin = this.getFormattedHourMin();

        // Procházíme plánované vlaky
        this.trains.forEach(train => {
            if (train.state === 'PLANNED') {
                // Převod času arrTime na sekundy
                const [arrH, arrM] = train.arrTime.split(':').map(Number);
                const trainArrSec = arrH * 3600 + arrM * 60;

                // Vlak žádá o vjezd 60 sekund před plánovaným příjezdem
                if (this.simTimeSec >= trainArrSec - 60) {
                    train.state = 'WAITING_CONSENT';

                    const dirKey = train.direction === 'RIGHT' ? 'WEST' : 'EAST';
                    if (trackGraph.tzz[dirKey]) {
                        trackGraph.tzz[dirKey].requestPending = true;
                        trackGraph.tzz[dirKey].pendingTrainId = train.id;
                    }

                    if (this.autoEntry) {
                        // V automatickém režimu okamžitě udělíme souhlas v čase vlaku!
                        train.startApproach();
                        trackGraph.grantConsent(dirKey);
                        if (audioSystem) audioSystem.playApproach1();
                    } else {
                        // V manuálním režimu zazvoní žádost o traťový souhlas
                        if (audioSystem) audioSystem.playApproach1();
                    }
                }
            }
        });
    }

    getFormattedHourMin() {
        const totalSec = Math.floor(this.simTimeSec);
        const h = Math.floor(totalSec / 3600) % 24;
        const m = Math.floor((totalSec % 3600) / 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    getFormattedTime() {
        const totalSec = Math.floor(this.simTimeSec);
        const h = Math.floor(totalSec / 3600) % 24;
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
}
