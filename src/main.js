import { TrackGraph } from './TrackGraph.js';
import { JopRenderer } from './JopRenderer.js';

// 1. Inicializace logiky a rendereru
const canvas = document.getElementById('jopCanvas');
const graph = new TrackGraph();
const renderer = new JopRenderer(canvas, graph);

// 2. První vykreslení
renderer.render();

// 3. Detekce kliknutí na pult
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // A) Kontrola kliknutí na výhybku W1
    Object.values(graph.switches).forEach(sw => {
        const dist = Math.hypot(mouseX - sw.joint.x, mouseY - sw.joint.y);
        if (dist < 25) { // Tolerabilní rádius kliku 25px
            graph.toggleSwitch(sw.id);
        }
    });

    // B) Kontrola kliknutí na kolejové úseky (pro testování obsazení)
    Object.values(graph.sections).forEach(sec => {
        const [p1, p2] = sec.points;
        // Jednoduchá detekce kliknutí v blízkosti úseku
        const minX = Math.min(p1.x, p2.x) - 10;
        const maxX = Math.max(p1.x, p2.x) + 10;
        const minY = Math.min(p1.y, p2.y) - 15;
        const maxY = Math.max(p1.y, p2.y) + 15;

        if (mouseX >= minX && mouseX <= maxX && mouseY >= minY && mouseY <= maxY) {
            graph.toggleOccupancy(sec.id);
        }
    });

    // Překreslení pultu po změně stavu
    renderer.render();
});