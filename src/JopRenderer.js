/**
 * JopRenderer.js - Vykreslování JOP kolejiště s prominentním panelem traťového souhlasu a čistými výhybkami
 */

export class JopRenderer {
    constructor(canvas, trackGraph) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.graph = trackGraph;

        this.colors = {
            bg: '#000000',
            grid: '#0f172a',
            trackFree: '#475569',
            trackRouteVC: '#00e676',       // Zářivě zelený závěr vlakové cesty
            trackRoutePC: '#ffffff',       // Bílý závěr posunové cesty
            trackOccupied: '#ff1744',      // Červené obsazení
            switchJoint: '#cbd5e1',
            text: '#f8fafc',
            textDim: '#64748b',
            signalRed: '#ff1744',
            signalGreen: '#00e676',
            signalYellow: '#ffd600',
            signalWhite: '#ffffff',
            trainTagBg: '#facc15',
            trainTagText: '#000000',
            selectionBorder: '#00e676',
            platform: '#1e293b'
        };

        this.blinkState = false;
        this.blinkTimer = 0;
    }

    setGraph(trackGraph) {
        this.graph = trackGraph;
    }

    render(trains = [], selectedSignal = null) {
        this.blinkTimer += 1;
        if (this.blinkTimer >= 22) {
            this.blinkState = !this.blinkState;
            this.blinkTimer = 0;
        }

        const { width, height } = this.canvas;
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, width, height);

        // 1. Rastr
        this.drawGrid();

        // 2. Nástupiště
        this.drawPlatforms();

        // 3. Kolejové úseky (se zářivě zeleným závěrem přímo od návěstidla)
        this.drawSections();

        // 4. Výhybky (čisté JOP indikátory na kloubech)
        this.drawSwitches();

        // 5. Přejezdy (PZZ)
        this.drawCrossings();

        // 6. Prominentní panely traťového souhlasu (TZZ)
        this.drawTzz();

        // 7. Návěstidla s vysoce čitelnými štítky
        this.drawSignals(selectedSignal);

        // 8. Vlaky (JOP štítky přímo v kolejích)
        this.drawTrains(trains);

        // 9. Živák v rohu
        this.drawZivak();

        // 10. Indikace výběru pro stavění cesty
        if (selectedSignal) {
            this.drawSelectionHint(selectedSignal);
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 0.5;
        const step = 20;

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

    drawPlatforms() {
        const platforms = this.graph.stationConfig?.platforms || [];
        platforms.forEach(p => {
            this.ctx.fillStyle = this.colors.platform;
            this.ctx.fillRect(p.x, p.y, p.w, p.h);
            this.ctx.fillStyle = this.colors.textDim;
            this.ctx.font = '10px Consolas, monospace';
            this.ctx.fillText(p.label, p.textX, p.textY);
        });
    }

    drawSections() {
        Object.values(this.graph.sections).forEach(sec => {
            const [p1, p2] = sec.points;

            // Zkontrolujeme, zda na tomto úseku začíná aktivní návěstidlo se zelenou cestou
            const startSignalOnSection = Object.values(this.graph.signals).find(
                sig => sig.section === sec.id && sig.aspect !== 'RED'
            );

            if (sec.locked && startSignalOnSection) {
                const sigX = startSignalOnSection.position.x;
                const dir = startSignalOnSection.direction;

                this.ctx.lineWidth = 4.5;
                this.ctx.lineCap = 'round';

                if (dir === 'RIGHT') {
                    // Část před návěstidlem (šedá / obsazená)
                    this.ctx.strokeStyle = sec.occupied ? this.colors.trackOccupied : this.colors.trackFree;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(sigX, p1.y);
                    this.ctx.stroke();

                    // Část OD návěstidla dopředu (ZÁŘIVĚ ZELENÁ!)
                    this.ctx.strokeStyle = this.colors.trackRouteVC;
                    this.ctx.beginPath();
                    this.ctx.moveTo(sigX, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                } else {
                    // Směr LEFT
                    this.ctx.strokeStyle = this.colors.trackRouteVC;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(sigX, p1.y);
                    this.ctx.stroke();

                    this.ctx.strokeStyle = sec.occupied ? this.colors.trackOccupied : this.colors.trackFree;
                    this.ctx.beginPath();
                    this.ctx.moveTo(sigX, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            } else {
                let strokeColor = this.colors.trackFree;
                if (sec.occupied) {
                    strokeColor = this.colors.trackOccupied;
                } else if (sec.locked) {
                    strokeColor = sec.routeType === 'SHUNT' ? this.colors.trackRoutePC : this.colors.trackRouteVC;
                }

                this.ctx.beginPath();
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
                this.ctx.lineWidth = 4.5;
                this.ctx.lineCap = 'round';
                this.ctx.strokeStyle = strokeColor;
                this.ctx.stroke();
            }

            this.drawBounds(p1, p2);

            // Popisek staničních kolejí K1..K5
            if (sec.id.startsWith('K') && sec.id.length === 2) {
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;

                this.ctx.fillStyle = '#020617';
                this.ctx.fillRect(midX - 12, midY - 8, 24, 16);
                this.ctx.strokeStyle = sec.locked ? this.colors.trackRouteVC : '#334155';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(midX - 12, midY - 8, 24, 16);

                this.ctx.fillStyle = sec.locked ? this.colors.trackRouteVC : '#94a3b8';
                this.ctx.font = 'bold 11px Consolas, monospace';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(sec.id.replace('K', ''), midX, midY);
                this.ctx.textAlign = 'start';
            }
        });
    }

    drawBounds(p1, p2) {
        this.ctx.strokeStyle = '#334155';
        this.ctx.lineWidth = 1.5;
        [p1, p2].forEach(p => {
            this.ctx.beginPath();
            this.ctx.moveTo(p.x, p.y - 3);
            this.ctx.lineTo(p.x, p.y + 3);
            this.ctx.stroke();
        });
    }

    drawSwitches() {
        Object.values(this.graph.switches).forEach(sw => {
            const isPlus = sw.position === 'PLUS';
            const { x, y } = sw.joint;

            // Kloub výhybky
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4.5, 0, Math.PI * 2);
            this.ctx.fillStyle = sw.locked ? this.colors.trackRouteVC : (isPlus ? '#cbd5e1' : '#facc15');
            this.ctx.fill();

            // Přehledný JOP štítek s číslem a polohou
            const label = `${sw.id}[${isPlus ? '+' : '-'}]`;
            this.ctx.font = 'bold 10px Consolas, monospace';
            const tw = this.ctx.measureText(label).width + 6;
            const offsetY = y > 200 ? 15 : -16;

            this.ctx.fillStyle = '#050811';
            this.ctx.fillRect(x - tw / 2, y + offsetY - 6, tw, 13);
            this.ctx.strokeStyle = sw.locked ? this.colors.trackRouteVC : '#334155';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x - tw / 2, y + offsetY - 6, tw, 13);

            this.ctx.fillStyle = sw.locked ? this.colors.trackRouteVC : (isPlus ? '#94a3b8' : '#facc15');
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(label, x, y + offsetY);
            this.ctx.textAlign = 'start';
        });
    }

    drawCrossings() {
        Object.values(this.graph.crossings).forEach(cross => {
            const { x, y, state } = cross;
            this.ctx.save();
            this.ctx.translate(x, y);

            this.ctx.fillStyle = '#1e293b';
            this.ctx.fillRect(-6, -20, 12, 40);

            let crossColor = '#ffffff';
            if (state === 'CLOSED') {
                crossColor = '#ff1744';
            } else if (state === 'WARNING') {
                crossColor = this.blinkState ? '#ff1744' : '#ffffff';
            }

            this.ctx.strokeStyle = crossColor;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(-7, -12);
            this.ctx.lineTo(7, -12);
            this.ctx.moveTo(0, -18);
            this.ctx.lineTo(0, -6);
            this.ctx.stroke();

            this.ctx.restore();
        });
    }

    /**
     * Prominentní panel traťového souhlasu (TZZ) přímo v kolejišti
     */
    drawTzz() {
        for (const [key, t] of Object.entries(this.graph.tzz)) {
            const { x, y } = t.arrowPos;
            const isRequesting = t.requestPending;

            // Rámeček panelu TZZ
            const boxW = 160;
            const boxH = 40;

            if (isRequesting) {
                // Výrazné blikající žluté tlačítko žádosti!
                this.ctx.fillStyle = this.blinkState ? '#facc15' : '#854d0e';
                this.ctx.fillRect(x - 10, y - 10, boxW, boxH);
                this.ctx.strokeStyle = '#fef08a';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x - 10, y - 10, boxW, boxH);

                this.ctx.fillStyle = '#000000';
                this.ctx.font = 'bold 10px Consolas, monospace';
                this.ctx.fillText('⚠ ŽÁDOST O SOUHLAS!', x - 4, y + 4);
                this.ctx.font = 'bold 9px Consolas, monospace';
                this.ctx.fillText(`KLIKNI ZDE PRO VJEZD`, x - 4, y + 18);
            } else {
                // Klidový nebo udělený stav
                this.ctx.fillStyle = '#0b1120';
                this.ctx.fillRect(x - 8, y - 8, boxW, boxH);
                this.ctx.strokeStyle = t.direction !== 'NONE' ? this.colors.signalGreen : '#334155';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x - 8, y - 8, boxW, boxH);

                this.ctx.fillStyle = '#94a3b8';
                this.ctx.font = 'bold 10px Consolas, monospace';
                this.ctx.fillText(t.name, x - 2, y + 6);

                if (t.direction === 'INTO_STATION') {
                    this.ctx.fillStyle = this.colors.signalGreen;
                    this.ctx.fillText('► Souhlas k vjezdu', x - 2, y + 20);
                } else if (t.direction === 'OUT_OF_STATION') {
                    this.ctx.fillStyle = this.colors.signalGreen;
                    this.ctx.fillText('◄ Odjezd povolen', x - 2, y + 20);
                } else {
                    this.ctx.fillStyle = '#64748b';
                    this.ctx.fillText('◄► Bez souhlasu', x - 2, y + 20);
                }
            }
        }
    }

    drawSignals(selectedSignal) {
        Object.values(this.graph.signals).forEach(sig => {
            const { x, y } = sig.position;
            const isSelected = selectedSignal === sig.id;

            let sigColor = this.colors.signalRed;
            if (sig.aspect === 'GREEN') sigColor = this.colors.signalGreen;
            if (sig.aspect === 'YELLOW') sigColor = this.colors.signalYellow;
            if (sig.aspect === 'WHITE') sigColor = this.colors.signalWhite;
            if (sig.aspect === 'CALL_ON') {
                sigColor = this.blinkState ? this.colors.signalWhite : this.colors.signalRed;
            }

            if (isSelected) {
                this.ctx.strokeStyle = this.blinkState ? this.colors.selectionBorder : '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x - 14, y - 14, 28, 28);
            }

            // Trojúhelníkové návěstidlo
            this.ctx.fillStyle = sigColor;
            this.ctx.beginPath();
            if (sig.direction === 'RIGHT') {
                this.ctx.moveTo(x - 7, y - 7);
                this.ctx.lineTo(x + 7, y);
                this.ctx.lineTo(x - 7, y + 7);
            } else {
                this.ctx.moveTo(x + 7, y - 7);
                this.ctx.lineTo(x - 7, y);
                this.ctx.lineTo(x + 7, y + 7);
            }
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // Kontrastní štítek označení návěstidla
            const label = sig.id;
            this.ctx.font = 'bold 11px Consolas, monospace';
            const tw = this.ctx.measureText(label).width + 8;
            const labelY = y < 200 ? y - 16 : y + 20;

            this.ctx.beginPath();
            this.ctx.moveTo(x, y + (y < 200 ? -7 : 7));
            this.ctx.lineTo(x, labelY + (y < 200 ? 6 : -6));
            this.ctx.strokeStyle = '#475569';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            this.ctx.fillStyle = '#050811';
            this.ctx.fillRect(x - tw / 2, labelY - 7, tw, 15);
            this.ctx.strokeStyle = sig.aspect !== 'RED' ? this.colors.signalGreen : '#38bdf8';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x - tw / 2, labelY - 7, tw, 15);

            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(label, x, labelY);
            this.ctx.textAlign = 'start';
        });
    }

    drawTrains(trains) {
        trains.forEach(train => {
            if (train.state === 'WAITING_CONSENT' || train.state === 'PLANNED' || train.state === 'DEPARTED') return;

            const { x, y } = train.position;
            if (!x || !y) return;

            const tagText = train.id;
            this.ctx.font = 'bold 11px Consolas, monospace';
            const textWidth = this.ctx.measureText(tagText).width + 8;
            const tagHeight = 16;

            // Žlutý JOP štítek vlaku
            this.ctx.fillStyle = this.colors.trainTagBg;
            this.ctx.fillRect(x - textWidth / 2, y - tagHeight / 2 - 1, textWidth, tagHeight);

            this.ctx.strokeStyle = train.state === 'STOPPED' ? '#e11d48' : '#000000';
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeRect(x - textWidth / 2, y - tagHeight / 2 - 1, textWidth, tagHeight);

            this.ctx.fillStyle = this.colors.trainTagText;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(tagText, x, y);

            if (train.state === 'MOVING') {
                this.ctx.fillStyle = '#facc15';
                this.ctx.font = '9px Consolas, monospace';
                const arrow = train.direction === 'RIGHT' ? '►' : '◄';
                this.ctx.fillText(`${arrow} ${Math.round(train.currentSpeedKmH)} km/h`, x, y - 14);
            } else if (train.state === 'STOPPED') {
                this.ctx.fillStyle = '#f87171';
                this.ctx.font = '9px Consolas, monospace';
                this.ctx.fillText(`Stojí (${Math.ceil(train.dwellRemaining)}s)`, x, y - 14);
            }

            this.ctx.textAlign = 'start';
        });
    }

    drawZivak() {
        const x = this.canvas.width - 32;
        const y = 14;
        const size = 16;

        const isHorizontal = Math.floor(Date.now() / 500) % 2 === 0;

        this.ctx.save();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - 1, y - 1, size + 2, size + 2);

        const colors = ['#ef4444', '#22c55e', '#3b82f6'];
        const stripSize = size / 3;

        for (let i = 0; i < 3; i++) {
            this.ctx.fillStyle = colors[i];
            if (isHorizontal) {
                this.ctx.fillRect(x, y + i * stripSize, size, stripSize);
            } else {
                this.ctx.fillRect(x + i * stripSize, y, stripSize, size);
            }
        }
        this.ctx.restore();
    }

    drawSelectionHint(selectedSignalId) {
        this.ctx.fillStyle = '#00e676';
        this.ctx.font = 'bold 12px Consolas, monospace';
        this.ctx.fillText(`[VOLBA CESTY] Návěstidlo ${selectedSignalId} vybráno ➔ Klikněte na cílovou kolej (K1..K5) nebo trať`, 30, 25);
    }
}
