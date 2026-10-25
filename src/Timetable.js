/**
 * Timetable.js - Grafikon vlakové dopravy s podporou více stanic a volitelného automatického vjezdu
 */
import { STATIONS } from './Stations.js';
import { Train } from './Train.js';

export class Timetable {
    constructor(stationId = 'luzna') {
        this.simTimeSec = 8 * 3600; // 08:00:00
        this.timeScale = 1;
        this.autoEntry = false; // Nastavení: automatický vjezd bez nutnosti manuálního souhlasu
        this.trainCounter = 100;
        this.trains = [];

        this.loadStation(stationId);
    }

    loadStation(stationId) {
        this.currentStationId = stationId;
        const station = STATIONS[stationId] || STATIONS['luzna'];
        this.trains = station.defaultSchedule.map(cfg => new Train(cfg));
    }

    /**
     * Vloží nový náhodný vlak do GVD
     */
    spawnRandomTrain() {
        this.trainCounter += 5;
        const isBrod = this.currentStationId === 'brod';
        const isRight = Math.random() > 0.5;
        const categories = ['Os', 'R', 'Pn', 'Nex'];
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const num = Math.floor(1000 + Math.random() * 9000);

        const currentMin = Math.floor(this.simTimeSec / 60);
        const arrM = currentMin + 1;
        const depM = arrM + 4;

        const formatT = (m) => {
            const h = Math.floor(m / 60) % 24;
            const mins = m % 60;
            return `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
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
            arrTime: formatT(arrM),
            depTime: formatT(depM),
            direction: isRight ? 'RIGHT' : 'LEFT',
            speed: 0.0035,
            maxSpeed: 85,
            dwellDuration: 12,
            state: this.autoEntry ? 'APPROACHING' : 'WAITING_CONSENT'
        });

        this.trains.push(newTrain);
        return newTrain;
    }

    updateTime(deltaSec) {
        this.simTimeSec += deltaSec * this.timeScale;

        // Pokud je zapnutý automatický vjezd vlaků, kontrolujeme, zda nastal čas příjezdu
        if (this.autoEntry) {
            const currentFormatted = this.getFormattedHourMin();
            this.trains.forEach(t => {
                if (t.state === 'WAITING_CONSENT' && t.arrTime <= currentFormatted) {
                    t.startApproach();
                }
            });
        }
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
