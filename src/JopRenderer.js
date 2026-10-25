/**
 * JopRenderer.js - Autentické vykreslování Jednotného obslužného pracoviště (JOP) Staničář
 */

export class JopRenderer {
    constructor(canvas, trackGraph) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.graph = trackGraph;

        // Autentická JOP barevná paleta ČD / AŽD
        this.colors = {
            bg: '#000000',
            grid: '#111822',
            trackFree: '#546e7a',          // Volný úsek (ocelově šedá)
            trackRouteVC: '#00e676',       // Závěr vlakové cesty (zářivě zelená)
            trackRoutePC: '#ffffff',       // Závěr posunové cesty (bílá)
            trackOccupied: '#ff1744',      // Obsazený úsek (výrazná červená)
            switchPlus: '#00e676',
            switchMinus: '#ffea00',
            switchJoint: '#cfd8dc',
            text: '#eceff1',
            textDim: '#78909c',
            signalRed: '#ff1744',
            signalGreen: '#00e676',
            signalYellow: '#ffd600',
            signalWhite: '#ffffff',
            signalBlue: '#2979ff',         // Modrá pro seřaďovací návěstidla
            trainTagBg: '#ffd600',         // Žlutý štítek vlaku v JOP
            trainTagText: '#000000',
            selectionBorder: '#00e676',
            platform: '#263238'
        };

        this.animTimer = 0;
        this.blinkState = false;
        this.blinkTimer = 0;
    }

    /**
     * Hlavní vykreslovací cyklus
     */
    render(trains = [], selectedSignal = null, hoveredElement = null) {
        this.animTimer += 0.02;
        this.blinkTimer += 1;
        if (this.blinkTimer >= 25) {
            this.blinkState = !this.blinkState;
            this.blinkTimer = 0;
        }

        const { width, height } = this.canvas;
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, width, height);

        // 1. JOP Rastr
        this.drawGrid();

        // 2. Peróny / Nástupiště
        this.drawPlatforms();

        // 3. Kolejové úseky
        this.drawSections();

        // 4. Přejezdy
        this.drawCrossings();

        // 5. Výhybky
        this.drawSwitches();

        // 6. Traťové souhlasy (TZZ)
        this.drawTzz();

        // 7. Návěstidla (Trojúhelníky a šipky)
        this.drawSignals(selectedSignal);

        // 8. Vlaky (Pohybující se JOP štítky s číslem vlaku)
        this.drawTrains(trains);

        // 9. Živák (rotující RGB kontrolní indikátor)
        this.drawZivak();

        // 10. Indikace výběru nebo nápověda
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
        // Nástupiště 2 (mezi K2 a K1)
        this.ctx.fillStyle = this.colors.platform;
        this.ctx.fillRect(490, 160, 260, 8);
        this.ctx.fillStyle = this.colors.textDim;
        this.ctx.font = '10px Consolas, monospace';
        this.ctx.fillText('Nástupiště 2', 590, 155);

        // Nástupiště 1 (u K1)
        this.ctx.fillStyle = this.colors.platform;
        this.ctx.fillRect(490, 240, 260, 8);
        this.ctx.fillText('Nástupiště 1', 590, 255);
    }

    drawSections() {
        Object.values(this.graph.sections).forEach(sec => {
            const [p1, p2] = sec.points;

            let strokeColor = this.colors.trackFree;
            if (sec.occupied) {
                strokeColor = this.colors.trackOccupied;
            } else if (sec.locked) {
                strokeColor = sec.routeType === 'SHUNT' ? this.colors.trackRoutePC : this.colors.trackRouteVC;
            }

            // Kolejová linie
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.lineWidth = 4.5;
            this.ctx.lineCap = 'round';
            this.ctx.strokeStyle = strokeColor;
            this.ctx.stroke();

            // Izolovaný styk / dělicí značka na koncích úseku
            this.drawSectionBounds(p1, p2);

            // Popisek staničních kolejí
            if (sec.id.startsWith('K')) {
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;

                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(midX - 12, midY - 7, 24, 14);
                this.ctx.strokeStyle = strokeColor;
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(midX - 12, midY - 7, 24, 14);

                this.ctx.fillStyle = strokeColor;
                this.ctx.font = 'bold 10px Consolas, monospace';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(sec.id.replace('K', ''), midX, midY);
                this.ctx.textAlign = 'start';
            }
        });
    }

    drawSectionBounds(p1, p2) {
        this.ctx.strokeStyle = '#263238';
        this.ctx.lineWidth = 1.5;
        // Malé kolmé rysky na koncích
        [p1, p2].forEach(p => {
            this.ctx.beginPath();
            this.ctx.moveTo(p.x, p.y - 4);
            this.ctx.lineTo(p.x, p.y + 4);
            this.ctx.stroke();
        });
    }

    drawSwitches() {
        Object.values(this.graph.switches).forEach(sw => {
            const isPlus = sw.position === 'PLUS';
            const target = isPlus ? sw.plusTarget : sw.minusTarget;

            // Barva jazyka výhybky
            let col = sw.locked ? this.colors.trackRouteVC : (isPlus ? '#cfd8dc' : '#ffd600');

            this.ctx.beginPath();
            this.ctx.moveTo(sw.joint.x, sw.joint.y);
            this.ctx.lineTo(target.x, target.y);
            this.ctx.lineWidth = 3.5;
            this.ctx.strokeStyle = col;
            this.ctx.stroke();

            // Kloub výhybky
            this.ctx.beginPath();
            this.ctx.arc(sw.joint.x, sw.joint.y, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = col;
            this.ctx.fill();

            // Text s číslem a polohou výhybky
            this.ctx.fillStyle = this.colors.textDim;
            this.ctx.font = '10px Consolas, monospace';
            const offsetY = sw.joint.y > 220 ? 15 : -12;
            this.ctx.fillText(`${sw.id}[${isPlus ? '+' : '-'}]`, sw.joint.x - 14, sw.joint.y + offsetY);
        });
    }

    drawCrossings() {
        Object.values(this.graph.crossings).forEach(cross => {
            const { x, y, state } = cross;
            this.ctx.save();
            this.ctx.translate(x, y);

            // Silniční pruh křižující kolej
            this.ctx.fillStyle = '#37474f';
            this.ctx.fillRect(-6, -20, 12, 40);

            // Výstražník JOP
            let crossColor = '#ffffff';
            if (state === 'CLOSED') {
                crossColor = '#ff1744';
            } else if (state === 'WARNING') {
                crossColor = this.blinkState ? '#ff1744' : '#ffffff';
            }

            this.ctx.strokeStyle = crossColor;
            this.ctx.lineWidth = 2;
            // Kříž PZZ
            this.ctx.beginPath();
            this.ctx.moveTo(-8, -12);
            this.ctx.lineTo(8, -12);
            this.ctx.moveTo(0, -18);
            this.ctx.lineTo(0, -6);
            this.ctx.stroke();

            this.ctx.restore();
        });
    }

    drawTzz() {
        // Západní TZZ
        const west = this.graph.tzz.WEST;
        this.ctx.fillStyle = west.requestPending && this.blinkState ? '#ffd600' : '#78909c';
        this.ctx.font = 'bold 11px Consolas, monospace';
        this.ctx.fillText('◄► TZZ Západ', west.arrowPos.x, west.arrowPos.y);

        if (west.direction === 'INTO_STATION') {
            this.ctx.fillStyle = this.colors.signalGreen;
            this.ctx.fillText('► Souhlas uděl.', west.arrowPos.x, west.arrowPos.y + 14);
        } else if (west.direction === 'OUT_OF_STATION') {
            this.ctx.fillStyle = this.colors.signalGreen;
            this.ctx.fillText('◄ Odjezd povolen', west.arrowPos.x, west.arrowPos.y + 14);
        }

        // Východní TZZ
        const east = this.graph.tzz.EAST;
        this.ctx.fillStyle = east.requestPending && this.blinkState ? '#ffd600' : '#78909c';
        this.ctx.fillText('◄► TZZ Východ', east.arrowPos.x - 40, east.arrowPos.y);

        if (east.direction === 'INTO_STATION') {
            this.ctx.fillStyle = this.colors.signalGreen;
            this.ctx.fillText('◄ Souhlas uděl.', east.arrowPos.x - 40, east.arrowPos.y + 14);
        } else if (east.direction === 'OUT_OF_STATION') {
            this.ctx.fillStyle = this.colors.signalGreen;
            this.ctx.fillText('► Odjezd povolen', east.arrowPos.x - 40, east.arrowPos.y + 14);
        }
    }

    drawSignals(selectedSignal) {
        Object.values(this.graph.signals).forEach(sig => {
            const { x, y } = sig.position;
            const isSelected = selectedSignal === sig.id;

            // Barva signálu podle aspektu
            let sigColor = this.colors.signalRed;
            if (sig.aspect === 'GREEN') sigColor = this.colors.signalGreen;
            if (sig.aspect === 'YELLOW') sigColor = this.colors.signalYellow;
            if (sig.aspect === 'WHITE') sigColor = this.colors.signalWhite;
            if (sig.aspect === 'CALL_ON') {
                sigColor = this.blinkState ? this.colors.signalWhite : this.colors.signalRed;
            }

            // Rámeček výběru (zelený rámeček při stavění VC)
            if (isSelected) {
                this.ctx.strokeStyle = this.blinkState ? this.colors.selectionBorder : '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x - 14, y - 14, 28, 28);
            }

            // Vykreslení těla trojúhelníkového návěstidla JOP
            this.ctx.fillStyle = sigColor;
            this.ctx.beginPath();
            if (sig.direction === 'RIGHT') {
                // Šipka/trojúhelník doprava ►
                this.ctx.moveTo(x - 6, y - 7);
                this.ctx.lineTo(x + 7, y);
                this.ctx.lineTo(x - 6, y + 7);
            } else {
                // Šipka/trojúhelník doleva ◄
                this.ctx.moveTo(x + 6, y - 7);
                this.ctx.lineTo(x - 7, y);
                this.ctx.lineTo(x + 6, y + 7);
            }
            this.ctx.closePath();
            this.ctx.fill();

            // Obrys
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // Popisek označení návěstidla (např. 1L, S1, L2)
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = 'bold 11px Consolas, monospace';
            const labelY = y < 200 ? y - 10 : y + 18;
            this.ctx.fillText(sig.id, x - 8, labelY);
        });
    }

    drawTrains(trains) {
        trains.forEach(train => {
            if (train.state === 'WAITING_CONSENT' || train.state === 'DEPARTED') return;

            const { x, y } = train.position;
            if (!x || !y) return;

            // V reálném JOP: Žlutý rámeček přímo na koleji s černým textem čísla vlaku
            const tagText = train.id;
            this.ctx.font = 'bold 11px Consolas, monospace';
            const textWidth = this.ctx.measureText(tagText).width + 8;
            const tagHeight = 16;

            // Pozadí štítku vlaku
            this.ctx.fillStyle = this.colors.trainTagBg;
            this.ctx.fillRect(x - textWidth / 2, y - tagHeight / 2 - 1, textWidth, tagHeight);

            // Červený obrys, pokud vlak stojí, nebo tenký černý při jízdě
            this.ctx.strokeStyle = train.state === 'STOPPED' ? '#d50000' : '#000000';
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeRect(x - textWidth / 2, y - tagHeight / 2 - 1, textWidth, tagHeight);

            // Text čísla vlaku
            this.ctx.fillStyle = this.colors.trainTagText;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(tagText, x, y);

            // Zobrazení směrové šipky a rychlosti
            if (train.state === 'MOVING') {
                this.ctx.fillStyle = '#ffd600';
                this.ctx.font = '9px Consolas, monospace';
                const arrow = train.direction === 'RIGHT' ? '►' : '◄';
                this.ctx.fillText(`${arrow} ${Math.round(train.currentSpeedKmH)} km/h`, x, y - 14);
            } else if (train.state === 'STOPPED') {
                this.ctx.fillStyle = '#ff8a80';
                this.ctx.font = '9px Consolas, monospace';
                this.ctx.fillText(`Stojí (${Math.ceil(train.dwellRemaining)}s)`, x, y - 14);
            }

            this.ctx.textAlign = 'start';
        });
    }

    drawZivak() {
        // Živák: tříbarevný rotující čtvereček v pravém horním rohu (26. kapitola manuálu)
        const x = this.canvas.width - 35;
        const y = 15;
        const size = 18;

        const isHorizontal = Math.floor(Date.now() / 500) % 2 === 0;

        this.ctx.save();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - 1, y - 1, size + 2, size + 2);

        const colors = ['#f44336', '#4caf50', '#2196f3']; // RGB
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
        this.ctx.fillText(`[STAVĚNÍ CESTY] Vybráno návěstidlo ${selectedSignalId} -> Klikněte na cílovou kolej (K1, K2, K3) nebo trať`, 30, 25);
    }
}
