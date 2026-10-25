/**
 * Vykreslování JOP pultu na Canvas
 */
export class JopRenderer {
    constructor(canvas, trackGraph) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.graph = trackGraph;

        // JOP Barevná paleta
        this.colors = {
            background: '#05070a',
            trackFree: '#4a5568',       // Volný úsek (šedá)
            trackOccupied: '#e53e3e',   // Obsazený úsek (červená)
            switchJoint: '#ecc94b',     // Tělo výhybky (žlutá)
            text: '#e2e8f0',            // Popisky
            grid: '#1a202c'
        };
    }

    /**
     * Hlavní vykreslovací smyčka
     */
    render(trains = []) {
        const { width, height } = this.canvas;
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, width, height);

        this.drawGrid();
        this.drawSections();
        this.drawSwitches();

        // Vykreslení všech aktivních vlaků
        trains.forEach(t => this.drawTrain(t));
    }

    drawGrid() {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        const step = 40;

        for (let x = 0; x < this.canvas.width; x += step) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += step) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawSections() {
        Object.values(this.graph.sections).forEach(sec => {
            const [p1, p2] = sec.points;
            
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.lineWidth = 6;
            this.ctx.strokeStyle = sec.occupied ? this.colors.trackOccupied : this.colors.trackFree;
            this.ctx.stroke();

            // Název úseku
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2 - 12;
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = '12px Consolas';
            this.ctx.fillText(sec.id, midX - 8, midY);
        });
    }

    drawSwitches() {
        Object.values(this.graph.switches).forEach(sw => {
            // Vykreslení jazyka výhybky podle polohy
            const targetPoint = (sw.position === 'STRAIGHT') ? sw.straightTarget : sw.divergingTarget;

            this.ctx.beginPath();
            this.ctx.moveTo(sw.joint.x, sw.joint.y);
            this.ctx.lineTo(targetPoint.x, targetPoint.y);
            this.ctx.lineWidth = 6;
            this.ctx.strokeStyle = this.colors.switchJoint;
            this.ctx.stroke();

            // Vykreslení kloubu výhybky (kroužek)
            this.ctx.beginPath();
            this.ctx.arc(sw.joint.x, sw.joint.y, 7, 0, Math.PI * 2);
            this.ctx.fillStyle = this.colors.switchJoint;
            this.ctx.fill();

            // Popisek výhybky
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = 'bold 13px Consolas';
            this.ctx.fillText(`${sw.id} [${sw.position === 'STRAIGHT' ? '+' : '-'}]`, sw.joint.x - 20, sw.joint.y + 25);
        });
    }

/**
     * Vykreslení vlakové soupravy
     */
    drawTrain(train) {
        if (!train || !train.position) return;

        const { x, y } = train.position;

        // Tělo vlaku (Červený obdélník)
        this.ctx.fillStyle = '#f56565';
        this.ctx.strokeStyle = '#feb2b2';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(x - 15, y - 8, 30, 16);
        this.ctx.strokeRect(x - 15, y - 8, 30, 16);

        // Čelní světlo (Žlutý kroužek vpravo)
        this.ctx.beginPath();
        this.ctx.arc(x + 12, y, 3, 0, Math.PI * 2);
        this.ctx.fillStyle = '#faf089';
        this.ctx.fill();

        // Číslo/ID Vlaku nad blokem
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 11px Consolas';
        this.ctx.fillText(train.id, x - 12, y - 12);
    }
}
