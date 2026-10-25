/**
 * Logika pohybu vlaku po grafe kolejí
 */
export class Train {
    constructor(id, speed = 0.003) {
        this.id = id;
        this.speed = speed;          // Rychlost posunu (0.003 = cca 5 sekund na úsek)
        this.currentSegment = 'S1';  // 'S1', 'W1', 'S2', nebo 'S3'
        this.progress = 0.0;         // Postup po daném segmentu (0.0 až 1.0)
        this.position = { x: 0, y: 0 }; // Vypočítaná X, Y pozice pro vykreslení
    }

    /**
     * Aktualizace pozice vlaku v čase
     */
    update(trackGraph) {
        this.progress += this.speed;

        // Pokud vlak dojel na konec aktuálního segmentu, přeřadíme ho na další
        if (this.progress >= 1.0) {
            this.progress = 0.0;
            this.currentSegment = this.getNextSegment(trackGraph);
        }

        // Výpočet aktuálních souřadnic X, Y podle geometrie segmentu
        this.position = this.calculateCoordinates(trackGraph);
    }

    /**
     * Logika průjezdu výhybkou W1 a návazností
     */
    getNextSegment(graph) {
        const sw = graph.switches['W1'];

        switch (this.currentSegment) {
            case 'S1':
                // Z S1 jede vlak vždy do výhybky W1
                return 'W1';

            case 'W1':
                // Z výhybky jede podle její polohy na S2 (přímá) nebo S3 (odbočka)
                return sw.position === 'STRAIGHT' ? 'S2' : 'S3';

            case 'S2':
            case 'S3':
                // Na konci stanice se smyčka vrátí zpět na začátek S1
                return 'S1';

            default:
                return 'S1';
        }
    }

    /**
     * Výpočet přesných X, Y souřadnic na základě lineární interpolace (LERP)
     */
    calculateCoordinates(graph) {
        let p1, p2;

        if (this.currentSegment === 'W1') {
            const sw = graph.switches['W1'];
            p1 = sw.joint;
            p2 = (sw.position === 'STRAIGHT') ? sw.straightTarget : sw.divergingTarget;
        } else {
            const sec = graph.sections[this.currentSegment];
            p1 = sec.points[0];
            p2 = sec.points[1];
        }

        // Lineární interpolace mezi p1 a p2
        return {
            x: p1.x + (p2.x - p1.x) * this.progress,
            y: p1.y + (p2.y - p1.y) * this.progress
        };
    }
}
