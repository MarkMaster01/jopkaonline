/**
 * Vykreslování JOP pultu na Canvas
 */
export class JopRenderer {
    constructor(canvas, trackGraph) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.graph = trackGraph;

        this.colors = {
            background: '#05070a',
            trackFree: '#4a5568',
            trackOccupied: '#e53e3e',
            switchJoint: '#ecc94b',
            text: '#e2e8f0',
            grid: '#1a202c',
            selected: '#eab308'
        };
    }

    render(trains = []) {
        const { width, height } = this.canvas;
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, width, height);

        this.drawGrid();
        this.drawSections();
        this.drawSwitches();
        this.drawSignals();

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

            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2 - 12;
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = '12px Consolas';
            this.ctx.fillText(sec.id, midX - 8, midY);
        });
    }

    drawSwitches() {
        Object.values(this.graph.switches).forEach(sw => {
            const targetPoint = (sw.position === 'STRAIGHT') ? sw.straightTarget : sw.divergingTarget;

            this.ctx.beginPath();
            this.ctx.moveTo(sw.joint.x, sw.joint.y);
            this.ctx.lineTo(targetPoint.x, targetPoint.y);
            this.ctx.lineWidth = 6;
            this.ctx.strokeStyle = this.colors.switchJoint;
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.arc(sw.joint.x, sw.joint.y, 7, 0, Math.PI * 2);
            this.ctx.fillStyle = sw.locked ? '#ed8936' : this.colors.switchJoint;
            this.ctx.fill();

            // Zobrazení názvu a stavu zámku výhybky
            this.ctx.fillStyle = sw.locked ? '#ed8936' : this.colors.text;
            this.ctx.font = 'bold 13px Consolas';
            const lockStatus = sw.locked ? ' 🔒' : '';
            this.ctx.fillText(`${sw.id} [${sw.position === 'STRAIGHT' ? '+' : '-'}]${lockStatus}`, sw.joint.x - 20, sw.joint.y + 25);
        });
    }

    drawTrain(train) {
        if (!train || !train.position) return;

        const { x, y } = train.position;

        this.ctx.fillStyle = '#f56565';
        this.ctx.strokeStyle = '#feb2b2';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(x - 15, y - 8, 30, 16);
        this.ctx.strokeRect(x - 15, y - 8, 30, 16);

        this.ctx.beginPath();
        this.ctx.arc(x + 12, y, 3, 0, Math.PI * 2);
        this.ctx.fillStyle = '#faf089';
        this.ctx.fill();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 11px Consolas';
        this.ctx.fillText(train.id, x - 12, y - 12);
    }

    drawSignals() {
        Object.values(this.graph.signals).forEach(sig => {
            const { x, y } = sig.position;
            const color = (sig.aspect === 'RED') ? '#e53e3e' : '#48bb78';
            const isSelected = (this.graph.selectedSignalId === sig.id);

            // Zvýrazňovací kruh pro vybrané návěstidlo
            if (isSelected) {
                this.ctx.beginPath();
                this.ctx.arc(x, y, 14, 0, Math.PI * 2);
                this.ctx.strokeStyle = this.colors.selected;
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            }

            // Stožár
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + 25);
            this.ctx.lineTo(x, y);
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = this.colors.text;
            this.ctx.stroke();

            // Svítilna
            this.ctx.beginPath();
            this.ctx.arc(x, y, 7, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.fill();
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.stroke();

            // Označení
            this.ctx.fillStyle = isSelected ? this.colors.selected : this.colors.text;
            this.ctx.font = 'bold 12px Consolas';
            this.ctx.fillText(sig.id, x - 4, y - 10);
        });
    }
}
