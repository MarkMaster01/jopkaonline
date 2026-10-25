/**
 * Logika pohybu vlaku po grafe kolejí
 */
export class Train {
    constructor(id, speed = 0.003) {
        this.id = id;
        this.speed = speed;
        this.currentSegment = 'S1';
        this.progress = 0.0;
        this.position = { x: 0, y: 0 };
    }

    update(trackGraph) {
        const signal = Object.values(trackGraph.signals).find(
            sig => sig.segment === this.currentSegment
        );

        if (signal && signal.aspect === 'RED') {
            const stopProgress = signal.stopProgress ?? 1;

            if (this.progress < stopProgress && (this.progress + this.speed) >= stopProgress) {
                this.progress = stopProgress;
                this.position = this.calculateCoordinates(trackGraph);
                return;
            }

            if (this.progress >= stopProgress) {
                this.position = this.calculateCoordinates(trackGraph);
                return;
            }
        }

        this.progress += this.speed;

        if (this.progress >= 1.0) {
            const prevSegment = this.currentSegment;
            this.progress = 0.0;
            this.currentSegment = this.getNextSegment(trackGraph);

            // Automatika ZabZař: Po vjezdu vlaku na výhybku zhasne zelená (shodí na Červenou)
            if (prevSegment === 'S1' && this.currentSegment === 'W1') {
                if (trackGraph.signals['L']) {
                    trackGraph.signals['L'].aspect = 'RED';
                }
            }

            // Odemknutí výhybky po projití zhlaví
            if (prevSegment === 'W1') {
                if (trackGraph.switches['W1']) {
                    trackGraph.switches['W1'].locked = false;
                }
            }
        }

        this.position = this.calculateCoordinates(trackGraph);
    }

    getNextSegment(graph) {
        const sw = graph.switches['W1'];

        switch (this.currentSegment) {
            case 'S1':
                return 'W1';
            case 'W1':
                return sw.position === 'STRAIGHT' ? 'S2' : 'S3';
            case 'S2':
            case 'S3':
                return 'S1';
            default:
                return 'S1';
        }
    }

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

        return {
            x: p1.x + (p2.x - p1.x) * this.progress,
            y: p1.y + (p2.y - p1.y) * this.progress
        };
    }
}
