import { TrackGraph } from './TrackGraph.js';
import { JopRenderer } from './JopRenderer.js';
import { Train } from './Train.js';

const canvas = document.getElementById('jopCanvas');
const graph = new TrackGraph();
const renderer = new JopRenderer(canvas, graph);

const train1 = new Train('R451', 0.004);
const trains = [train1];

function gameLoop() {
    trains.forEach(train => {
        train.update(graph);
    });

    Object.keys(graph.sections).forEach(secId => {
        graph.sections[secId].occupied = trains.some(train => train.currentSegment === secId);
    });

    renderer.render(trains);
    requestAnimationFrame(gameLoop);
}

gameLoop();

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // 1. Kliknutí na návěstidlo L (Vybrání STARTU cesty)
    let clickedSignal = false;
    Object.values(graph.signals).forEach(sig => {
        const dist = Math.hypot(mouseX - sig.position.x, mouseY - sig.position.y);
        if (dist < 20) {
            graph.selectSignal(sig.id);
            clickedSignal = true;
        }
    });

    if (clickedSignal) return;

    // 2. Kliknutí na cílovou kolej (Pokud je navěstidlo již vybrané -> Postavení cesty)
    if (graph.selectedSignalId) {
        Object.values(graph.sections).forEach(sec => {
            const [p1, p2] = sec.points;
            const minX = Math.min(p1.x, p2.x) - 10;
            const maxX = Math.max(p1.x, p2.x) + 10;
            const minY = Math.min(p1.y, p2.y) - 15;
            const maxY = Math.max(p1.y, p2.y) + 15;

            if (mouseX >= minX && mouseX <= maxX && mouseY >= minY && mouseY <= maxY) {
                graph.setRoute(graph.selectedSignalId, sec.id);
            }
        });
        return;
    }

    // 3. Přímé kliknutí na výhybku W1 (Ruční přehození - jen pokud není zamčená)
    Object.values(graph.switches).forEach(sw => {
        const dist = Math.hypot(mouseX - sw.joint.x, mouseY - sw.joint.y);
        if (dist < 25) {
            graph.toggleSwitch(sw.id);
        }
    });
});
