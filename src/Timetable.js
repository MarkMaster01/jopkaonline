/**
 * Timetable.js - Grafikon vlakové dopravy (GVD) a plánovač provozu pro Staničář
 */
import { Train } from './Train.js';

export class Timetable {
    constructor() {
        this.trains = [];
        this.simTimeSec = 8 * 3600; // Počáteční čas simulace 08:00:00
        this.timeScale = 1;         // 1x, 2x, 5x, 0 = pauza
        this.trainCounter = 100;

        this.initDefaultSchedule();
    }

    initDefaultSchedule() {
        const schedule = [
            {
                id: 'Os 4812',
                category: 'Os',
                from: 'Lužná',
                to: 'Brod',
                targetTrack: 'K1',
                arrTime: '08:03',
                depTime: '08:06',
                direction: 'RIGHT',
                speed: 0.0035,
                maxSpeed: 80,
                dwellDuration: 12,
                state: 'WAITING_CONSENT'
            },
            {
                id: 'R 671',
                category: 'R',
                from: 'Brod',
                to: 'Lužná',
                targetTrack: 'K2',
                arrTime: '08:05',
                depTime: '08:09',
                direction: 'LEFT',
                speed: 0.0045,
                maxSpeed: 100,
                dwellDuration: 15,
                state: 'WAITING_CONSENT'
            },
            {
                id: 'Pn 52140',
                category: 'Pn',
                from: 'Lužná',
                to: 'Brod',
                targetTrack: 'K3',
                arrTime: '08:12',
                depTime: '08:16',
                direction: 'RIGHT',
                speed: 0.003,
                maxSpeed: 70,
                dwellDuration: 10,
                state: 'WAITING_CONSENT'
            },
            {
                id: 'Sp 1745',
                category: 'Sp',
                from: 'Brod',
                to: 'Lužná',
                targetTrack: 'K1',
                arrTime: '08:18',
                depTime: '08:22',
                direction: 'LEFT',
                speed: 0.004,
                maxSpeed: 95,
                dwellDuration: 14,
                state: 'WAITING_CONSENT'
            }
        ];

        this.trains = schedule.map(cfg => new Train(cfg));
    }

    /**
     * Vloží nový náhodný nákladní nebo spěšný vlak (Klávesa 'V')
     */
    spawnRandomTrain() {
        this.trainCounter += 5;
        const isRight = Math.random() > 0.5;
        const category = Math.random() > 0.4 ? 'Pn' : 'Nex';
        const num = Math.floor(40000 + Math.random() * 20000);

        const currentMin = Math.floor(this.simTimeSec / 60);
        const arrM = currentMin + 2;
        const depM = arrM + 4;

        const formatT = (m) => {
            const h = Math.floor(m / 60) % 24;
            const mins = m % 60;
            return `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        };

        const newTrain = new Train({
            id: `${category} ${num}`,
            category: category,
            from: isRight ? 'Lužná' : 'Brod',
            to: isRight ? 'Brod' : 'Lužná',
            targetTrack: Math.random() > 0.5 ? 'K2' : 'K3',
            arrTime: formatT(arrM),
            depTime: formatT(depM),
            direction: isRight ? 'RIGHT' : 'LEFT',
            speed: 0.003,
            maxSpeed: 75,
            dwellDuration: 8,
            state: 'WAITING_CONSENT'
        });

        this.trains.push(newTrain);
        return newTrain;
    }

    /**
     * Aktualizace simulačního času
     */
    updateTime(deltaSec) {
        this.simTimeSec += deltaSec * this.timeScale;
    }

    getFormattedTime() {
        const totalSec = Math.floor(this.simTimeSec);
        const h = Math.floor(totalSec / 3600) % 24;
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
}
