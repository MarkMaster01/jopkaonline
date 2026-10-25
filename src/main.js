import { TrackGraph } from './TrackGraph.js';
import { JopRenderer } from './JopRenderer.js';
import { Train } from './Train.js';

const canvas = document.getElementById('jopCanvas');
const graph = new TrackGraph();
const renderer = new JopRenderer(canvas, graph);

// Vytvoříme vlak R451
const train1 = new Train('R451', 0.004);
const trains = [train1];

/**
 * Plynulá herní smyčka (60 FPS)
 */
function gameLoop() {
    // 1. Aktualizace pozic všech vlaků
    trains.forEach(train => {
        train.update(graph);

        // Automatické přepínání obsazenosti úseku podle pozice vlaku
        Object.keys(graph.sections).forEach(secId => {
            graph.sections[secId].occupied = (train.currentSegment === secId);
        });
    });

    // 2. Vykreslení aktuálního stavu
    renderer.render(trains);

    // 3. Požadavek na další snímek
    requestAnimationFrame(gameLoop);
}

// Spuštění smyčky
gameLoop();

// Obsluha kliknutí na výhybku zůstává zachována
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    Object.values(graph.switches).forEach(sw => {
        const dist = Math.hypot(mouseX - sw.joint.x, mouseY - sw.joint.y);
        if (dist < 25) {
            graph.toggleSwitch(sw.id);
        }
    });
});
