/**
 * Stations.js - Definice stanic pro simulátor JOP Staničář
 * Obsahuje stanici 1 (Lužná - střední) a stanici 2 (Brod - velká uzlová stanice s odbočnou tratí a 5 kolejemi)
 */

export const STATIONS = {
    'luzna': {
        id: 'luzna',
        name: 'Stanice Lužná nad Vltavou',
        subtitle: 'Střední stanice se 3 dopravními kolejemi a přejezdem',
        canvasWidth: 1250,
        canvasHeight: 380,
        platforms: [
            { x: 490, y: 160, w: 260, h: 8, label: 'Nástupiště 2 (kolej 2)', textX: 590, textY: 155 },
            { x: 490, y: 240, w: 260, h: 8, label: 'Nástupiště 1 (kolej 1)', textX: 590, textY: 255 }
        ],
        sections: {
            'T1_EXT':     { id: 'T1_EXT',     name: 'Trať Západ (vzdálená)', occupied: false, locked: false, routeType: null, points: [{x: 40, y: 220}, {x: 170, y: 220}] },
            'T1':         { id: 'T1',         name: 'Trať 1 (Západ)',          occupied: false, locked: false, routeType: null, points: [{x: 170, y: 220}, {x: 320, y: 220}] },
            'SEC_W1_W2':  { id: 'SEC_W1_W2',  name: 'Úsek W1-W2',              occupied: false, locked: false, routeType: null, points: [{x: 320, y: 220}, {x: 420, y: 220}] },
            'SEC_W1_K3':  { id: 'SEC_W1_K3',  name: 'Odbočka W1-K3',           occupied: false, locked: false, routeType: null, points: [{x: 320, y: 220}, {x: 440, y: 300}] },
            'SEC_W2_K2':  { id: 'SEC_W2_K2',  name: 'Odbočka W2-K2',           occupied: false, locked: false, routeType: null, points: [{x: 420, y: 220}, {x: 480, y: 140}] },
            'K2':         { id: 'K2',         name: 'Kolej 2',                 occupied: false, locked: false, routeType: null, points: [{x: 480, y: 140}, {x: 770, y: 140}], lengthM: 420, platform: true },
            'K1':         { id: 'K1',         name: 'Kolej 1 (hlavní)',        occupied: false, locked: false, routeType: null, points: [{x: 420, y: 220}, {x: 780, y: 220}], lengthM: 550, platform: true },
            'K3':         { id: 'K3',         name: 'Kolej 3',                 occupied: false, locked: false, routeType: null, points: [{x: 440, y: 300}, {x: 750, y: 300}], lengthM: 380, platform: false },
            'SEC_K2_W3':  { id: 'SEC_K2_W3',  name: 'Odbočka K2-W3',           occupied: false, locked: false, routeType: null, points: [{x: 770, y: 140}, {x: 830, y: 220}] },
            'SEC_K3_W4':  { id: 'SEC_K3_W4',  name: 'Odbočka K3-W4',           occupied: false, locked: false, routeType: null, points: [{x: 750, y: 300}, {x: 910, y: 220}] },
            'SEC_W3_W4':  { id: 'SEC_W3_W4',  name: 'Úsek W3-W4',              occupied: false, locked: false, routeType: null, points: [{x: 780, y: 220}, {x: 910, y: 220}] },
            'T2':         { id: 'T2',         name: 'Trať 2 (Východ)',         occupied: false, locked: false, routeType: null, points: [{x: 910, y: 220}, {x: 1060, y: 220}] },
            'T2_EXT':     { id: 'T2_EXT',     name: 'Trať Východ (vzdálená)',  occupied: false, locked: false, routeType: null, points: [{x: 1060, y: 220}, {x: 1200, y: 220}] }
        },
        switches: {
            'W1': { id: 'W1', name: 'Výhybka 1', position: 'PLUS', locked: false, joint: { x: 320, y: 220 }, plusTarget: { x: 420, y: 220 }, minusTarget: { x: 440, y: 300 } },
            'W2': { id: 'W2', name: 'Výhybka 2', position: 'PLUS', locked: false, joint: { x: 420, y: 220 }, plusTarget: { x: 480, y: 220 }, minusTarget: { x: 480, y: 140 } },
            'W3': { id: 'W3', name: 'Výhybka 3', position: 'PLUS', locked: false, joint: { x: 830, y: 220 }, plusTarget: { x: 780, y: 220 }, minusTarget: { x: 770, y: 140 } },
            'W4': { id: 'W4', name: 'Výhybka 4', position: 'PLUS', locked: false, joint: { x: 910, y: 220 }, plusTarget: { x: 830, y: 220 }, minusTarget: { x: 750, y: 300 } }
        },
        crossings: {
            'PZZ1': { id: 'PZZ1', name: 'Přejezd km 14.2', x: 230, y: 220, state: 'OPEN', manual: false }
        },
        signals: {
            '1L': { id: '1L', name: 'Vjezdové 1L', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'T1', stopProgress: 0.90, position: { x: 285, y: 200 } },
            '1S': { id: '1S', name: 'Vjezdové 1S', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'T2', stopProgress: 0.10, position: { x: 945, y: 240 } },
            'S2': { id: 'S2', name: 'Odjezdové S2', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'K2', stopProgress: 0.90, position: { x: 755, y: 120 } },
            'S1': { id: 'S1', name: 'Odjezdové S1', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'K1', stopProgress: 0.90, position: { x: 765, y: 200 } },
            'S3': { id: 'S3', name: 'Odjezdové S3', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'K3', stopProgress: 0.90, position: { x: 735, y: 280 } },
            'L2': { id: 'L2', name: 'Odjezdové L2', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'K2', stopProgress: 0.10, position: { x: 495, y: 160 } },
            'L1': { id: 'L1', name: 'Odjezdové L1', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'K1', stopProgress: 0.10, position: { x: 435, y: 240 } },
            'L3': { id: 'L3', name: 'Odjezdové L3', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'K3', stopProgress: 0.10, position: { x: 455, y: 320 } }
        },
        tzz: {
            'WEST': { name: 'Trať Západ -> Lužná', direction: 'INTO_STATION', requestPending: false, arrowPos: { x: 100, y: 175 } },
            'EAST': { name: 'Trať Východ -> Brod',  direction: 'NONE',         requestPending: false, arrowPos: { x: 1110, y: 175 } }
        },
        routeCatalog: [
            // Vjezdy ze Západu (1L)
            { id: 'R_1L_K1', startSignal: '1L', endTarget: 'K1', direction: 'RIGHT', switches: { 'W1': 'PLUS', 'W2': 'PLUS' }, sections: ['T1', 'SEC_W1_W2', 'K1'], aspect: 'GREEN' },
            { id: 'R_1L_K2', startSignal: '1L', endTarget: 'K2', direction: 'RIGHT', switches: { 'W1': 'PLUS', 'W2': 'MINUS' }, sections: ['T1', 'SEC_W1_W2', 'SEC_W2_K2', 'K2'], aspect: 'YELLOW' },
            { id: 'R_1L_K3', startSignal: '1L', endTarget: 'K3', direction: 'RIGHT', switches: { 'W1': 'MINUS' }, sections: ['T1', 'SEC_W1_K3', 'K3'], aspect: 'YELLOW' },
            // Odjezdy na Východ
            { id: 'R_S1_T2', startSignal: 'S1', endTarget: 'T2', direction: 'RIGHT', switches: { 'W3': 'PLUS', 'W4': 'PLUS' }, sections: ['K1', 'SEC_W3_W4', 'T2'], aspect: 'GREEN' },
            { id: 'R_S2_T2', startSignal: 'S2', endTarget: 'T2', direction: 'RIGHT', switches: { 'W3': 'MINUS', 'W4': 'PLUS' }, sections: ['K2', 'SEC_K2_W3', 'SEC_W3_W4', 'T2'], aspect: 'YELLOW' },
            { id: 'R_S3_T2', startSignal: 'S3', endTarget: 'T2', direction: 'RIGHT', switches: { 'W4': 'MINUS' }, sections: ['K3', 'SEC_K3_W4', 'T2'], aspect: 'YELLOW' },
            // Vjezdy z Východu (1S)
            { id: 'R_1S_K1', startSignal: '1S', endTarget: 'K1', direction: 'LEFT', switches: { 'W4': 'PLUS', 'W3': 'PLUS' }, sections: ['T2', 'SEC_W3_W4', 'K1'], aspect: 'GREEN' },
            { id: 'R_1S_K2', startSignal: '1S', endTarget: 'K2', direction: 'LEFT', switches: { 'W4': 'PLUS', 'W3': 'MINUS' }, sections: ['T2', 'SEC_W3_W4', 'SEC_K2_W3', 'K2'], aspect: 'YELLOW' },
            { id: 'R_1S_K3', startSignal: '1S', endTarget: 'K3', direction: 'LEFT', switches: { 'W4': 'MINUS' }, sections: ['T2', 'SEC_K3_W4', 'K3'], aspect: 'YELLOW' },
            // Odjezdy na Západ
            { id: 'R_L1_T1', startSignal: 'L1', endTarget: 'T1', direction: 'LEFT', switches: { 'W2': 'PLUS', 'W1': 'PLUS' }, sections: ['K1', 'SEC_W1_W2', 'T1'], aspect: 'GREEN' },
            { id: 'R_L2_T1', startSignal: 'L2', endTarget: 'T1', direction: 'LEFT', switches: { 'W2': 'MINUS', 'W1': 'PLUS' }, sections: ['K2', 'SEC_W2_K2', 'SEC_W1_W2', 'T1'], aspect: 'YELLOW' },
            { id: 'R_L3_T1', startSignal: 'L3', endTarget: 'T1', direction: 'LEFT', switches: { 'W1': 'MINUS' }, sections: ['K3', 'SEC_W1_K3', 'T1'], aspect: 'YELLOW' }
        ],
        defaultSchedule: [
            { id: 'Os 4812', category: 'Os', from: 'Západ', to: 'Východ', targetTrack: 'K1', arrTime: '08:03', depTime: '08:06', direction: 'RIGHT', speed: 0.0035, maxSpeed: 80, dwellDuration: 12, state: 'WAITING_CONSENT' },
            { id: 'R 671',   category: 'R',  from: 'Východ', to: 'Západ', targetTrack: 'K2', arrTime: '08:05', depTime: '08:09', direction: 'LEFT',  speed: 0.0045, maxSpeed: 100, dwellDuration: 15, state: 'WAITING_CONSENT' },
            { id: 'Pn 52140',category: 'Pn', from: 'Západ', to: 'Východ', targetTrack: 'K3', arrTime: '08:12', depTime: '08:16', direction: 'RIGHT', speed: 0.003, maxSpeed: 70, dwellDuration: 10, state: 'WAITING_CONSENT' },
            { id: 'Sp 1745', category: 'Sp', from: 'Východ', to: 'Západ', targetTrack: 'K1', arrTime: '08:18', depTime: '08:22', direction: 'LEFT',  speed: 0.004, maxSpeed: 95, dwellDuration: 14, state: 'WAITING_CONSENT' }
        ]
    },

    // Velká stanice Brod nad Sázavou (5 kolejí, 3 směry)
    'brod': {
        id: 'brod',
        name: 'Uzlová stanice Brod nad Sázavou',
        subtitle: 'Velká uzlová stanice s 5 dopravními kolejemi a odbočnou tratí',
        canvasWidth: 1400,
        canvasHeight: 460,
        platforms: [
            { x: 530, y: 120, w: 320, h: 8, label: 'Nástupiště 3 (kolej 4)', textX: 680, textY: 115 },
            { x: 530, y: 190, w: 320, h: 8, label: 'Nástupiště 2 (kolej 2)', textX: 680, textY: 185 },
            { x: 530, y: 260, w: 320, h: 8, label: 'Nástupiště 1 (kolej 1)', textX: 680, textY: 275 }
        ],
        sections: {
            // Dvoukolejná trať Západ (1. a 2. traťová kolej)
            'T1_EXT':     { id: 'T1_EXT',     name: '1. Trať Západ (vzdálená)', occupied: false, locked: false, routeType: null, points: [{x: 40, y: 240}, {x: 180, y: 240}] },
            'T1':         { id: 'T1',         name: '1. Trať Západ',          occupied: false, locked: false, routeType: null, points: [{x: 180, y: 240}, {x: 320, y: 240}] },
            'T2_WEST':    { id: 'T2_WEST',    name: '2. Trať Západ',          occupied: false, locked: false, routeType: null, points: [{x: 180, y: 170}, {x: 320, y: 170}] },

            // Západní zhlaví (výhybky W1, W2, W3, W4)
            'SEC_BW1':    { id: 'SEC_BW1',    name: 'Zhlaví W1',              occupied: false, locked: false, routeType: null, points: [{x: 320, y: 240}, {x: 410, y: 240}] },
            'SEC_BW1_K3': { id: 'SEC_BW1_K3', name: 'Zhlaví W1-K3',           occupied: false, locked: false, routeType: null, points: [{x: 320, y: 240}, {x: 440, y: 310}] },
            'SEC_BW1_K5': { id: 'SEC_BW1_K5', name: 'Zhlaví W1-K5',           occupied: false, locked: false, routeType: null, points: [{x: 440, y: 310}, {x: 510, y: 380}] },
            'SEC_BW2':    { id: 'SEC_BW2',    name: 'Zhlaví W2',              occupied: false, locked: false, routeType: null, points: [{x: 320, y: 170}, {x: 430, y: 170}] },
            'SEC_BW2_K4': { id: 'SEC_BW2_K4', name: 'Zhlaví W2-K4',           occupied: false, locked: false, routeType: null, points: [{x: 320, y: 170}, {x: 460, y: 100}] },

            // 5 staničních kolejí
            'K4':         { id: 'K4',         name: 'Kolej 4 (předjízdná)',   occupied: false, locked: false, routeType: null, points: [{x: 460, y: 100}, {x: 880, y: 100}], lengthM: 520, platform: true },
            'K2':         { id: 'K2',         name: 'Kolej 2 (hlavní sudá)',  occupied: false, locked: false, routeType: null, points: [{x: 430, y: 170}, {x: 890, y: 170}], lengthM: 650, platform: true },
            'K1':         { id: 'K1',         name: 'Kolej 1 (hlavní lichá)', occupied: false, locked: false, routeType: null, points: [{x: 410, y: 240}, {x: 900, y: 240}], lengthM: 670, platform: true },
            'K3':         { id: 'K3',         name: 'Kolej 3 (dopravní)',     occupied: false, locked: false, routeType: null, points: [{x: 440, y: 310}, {x: 870, y: 310}], lengthM: 480, platform: false },
            'K5':         { id: 'K5',         name: 'Kolej 5 (nákladní)',     occupied: false, locked: false, routeType: null, points: [{x: 510, y: 380}, {x: 840, y: 380}], lengthM: 410, platform: false },

            // Východní zhlaví (W5, W6, W7, W8)
            'SEC_BW5_K4': { id: 'SEC_BW5_K4', name: 'Odbočka K4-W5',          occupied: false, locked: false, routeType: null, points: [{x: 880, y: 100}, {x: 960, y: 170}] },
            'SEC_BW5':    { id: 'SEC_BW5',    name: 'Zhlaví W5',              occupied: false, locked: false, routeType: null, points: [{x: 890, y: 170}, {x: 960, y: 170}] },
            'SEC_BW6':    { id: 'SEC_BW6',    name: 'Zhlaví W6',              occupied: false, locked: false, routeType: null, points: [{x: 900, y: 240}, {x: 980, y: 240}] },
            'SEC_BW6_K3': { id: 'SEC_BW6_K3', name: 'Odbočka K3-W6',          occupied: false, locked: false, routeType: null, points: [{x: 870, y: 310}, {x: 980, y: 240}] },
            'SEC_BW7_K5': { id: 'SEC_BW7_K5', name: 'Odbočka K5-W7',          occupied: false, locked: false, routeType: null, points: [{x: 840, y: 380}, {x: 980, y: 240}] },

            // Odbočná lokálka (směr Jih / Skalka)
            'TRAIN_SOUTH':{ id: 'TRAIN_SOUTH',name: 'Trať Jih (Lokálka)',     occupied: false, locked: false, routeType: null, points: [{x: 980, y: 240}, {x: 1060, y: 340}] },

            // Hlavní trať Východ
            'T_EAST':     { id: 'T_EAST',     name: 'Trať Východ',            occupied: false, locked: false, routeType: null, points: [{x: 980, y: 240}, {x: 1140, y: 240}] },
            'T_EAST_EXT': { id: 'T_EAST_EXT', name: 'Trať Východ (vzdálená)', occupied: false, locked: false, routeType: null, points: [{x: 1140, y: 240}, {x: 1350, y: 240}] }
        },
        switches: {
            'W1': { id: 'W1', name: 'Výhybka 1', position: 'PLUS', locked: false, joint: { x: 320, y: 240 }, plusTarget: { x: 410, y: 240 }, minusTarget: { x: 440, y: 310 } },
            'W2': { id: 'W2', name: 'Výhybka 2', position: 'PLUS', locked: false, joint: { x: 320, y: 170 }, plusTarget: { x: 430, y: 170 }, minusTarget: { x: 460, y: 100 } },
            'W3': { id: 'W3', name: 'Výhybka 3', position: 'PLUS', locked: false, joint: { x: 440, y: 310 }, plusTarget: { x: 870, y: 310 }, minusTarget: { x: 510, y: 380 } },
            'W5': { id: 'W5', name: 'Výhybka 5', position: 'PLUS', locked: false, joint: { x: 960, y: 170 }, plusTarget: { x: 890, y: 170 }, minusTarget: { x: 880, y: 100 } },
            'W6': { id: 'W6', name: 'Výhybka 6', position: 'PLUS', locked: false, joint: { x: 980, y: 240 }, plusTarget: { x: 900, y: 240 }, minusTarget: { x: 870, y: 310 } },
            'W7': { id: 'W7', name: 'Výhybka 7', position: 'PLUS', locked: false, joint: { x: 1020, y: 240 }, plusTarget: { x: 1140, y: 240 }, minusTarget: { x: 1060, y: 340 } }
        },
        crossings: {
            'PZZ_B1': { id: 'PZZ_B1', name: 'Přejezd km 52.8', x: 230, y: 240, state: 'OPEN', manual: false }
        },
        signals: {
            '1L': { id: '1L', name: 'Vjezdové 1L', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'T1', stopProgress: 0.90, position: { x: 285, y: 220 } },
            '2L': { id: '2L', name: 'Vjezdové 2L', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'T2_WEST', stopProgress: 0.90, position: { x: 285, y: 150 } },
            '1S': { id: '1S', name: 'Vjezdové 1S', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'T_EAST', stopProgress: 0.10, position: { x: 1040, y: 260 } },
            'S4': { id: 'S4', name: 'Odjezdové S4', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'K4', stopProgress: 0.90, position: { x: 860, y: 80 } },
            'S2': { id: 'S2', name: 'Odjezdové S2', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'K2', stopProgress: 0.90, position: { x: 870, y: 150 } },
            'S1': { id: 'S1', name: 'Odjezdové S1', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'K1', stopProgress: 0.90, position: { x: 880, y: 220 } },
            'S3': { id: 'S3', name: 'Odjezdové S3', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'K3', stopProgress: 0.90, position: { x: 850, y: 290 } },
            'L4': { id: 'L4', name: 'Odjezdové L4', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'K4', stopProgress: 0.10, position: { x: 480, y: 120 } },
            'L2': { id: 'L2', name: 'Odjezdové L2', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'K2', stopProgress: 0.10, position: { x: 450, y: 190 } },
            'L1': { id: 'L1', name: 'Odjezdové L1', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'K1', stopProgress: 0.10, position: { x: 430, y: 260 } },
            'L3': { id: 'L3', name: 'Odjezdové L3', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'K3', stopProgress: 0.10, position: { x: 460, y: 330 } }
        },
        tzz: {
            'WEST': { name: 'Trať Západ -> Praha', direction: 'INTO_STATION', requestPending: false, arrowPos: { x: 100, y: 130 } },
            'EAST': { name: 'Trať Východ -> Brno', direction: 'NONE',         requestPending: false, arrowPos: { x: 1240, y: 195 } }
        },
        routeCatalog: [
            // Vjezdy 1L
            { id: 'R_1L_K1', startSignal: '1L', endTarget: 'K1', direction: 'RIGHT', switches: { 'W1': 'PLUS' }, sections: ['T1', 'SEC_BW1', 'K1'], aspect: 'GREEN' },
            { id: 'R_1L_K3', startSignal: '1L', endTarget: 'K3', direction: 'RIGHT', switches: { 'W1': 'MINUS', 'W3': 'PLUS' }, sections: ['T1', 'SEC_BW1_K3', 'K3'], aspect: 'YELLOW' },
            { id: 'R_1L_K5', startSignal: '1L', endTarget: 'K5', direction: 'RIGHT', switches: { 'W1': 'MINUS', 'W3': 'MINUS' }, sections: ['T1', 'SEC_BW1_K3', 'SEC_BW1_K5', 'K5'], aspect: 'YELLOW' },
            // Vjezdy 2L
            { id: 'R_2L_K2', startSignal: '2L', endTarget: 'K2', direction: 'RIGHT', switches: { 'W2': 'PLUS' }, sections: ['T2_WEST', 'SEC_BW2', 'K2'], aspect: 'GREEN' },
            { id: 'R_2L_K4', startSignal: '2L', endTarget: 'K4', direction: 'RIGHT', switches: { 'W2': 'MINUS' }, sections: ['T2_WEST', 'SEC_BW2_K4', 'K4'], aspect: 'YELLOW' },
            // Odjezdy na Východ
            { id: 'R_S1_EAST', startSignal: 'S1', endTarget: 'T_EAST', direction: 'RIGHT', switches: { 'W6': 'PLUS', 'W7': 'PLUS' }, sections: ['K1', 'SEC_BW6', 'T_EAST'], aspect: 'GREEN' },
            { id: 'R_S3_EAST', startSignal: 'S3', endTarget: 'T_EAST', direction: 'RIGHT', switches: { 'W6': 'MINUS', 'W7': 'PLUS' }, sections: ['K3', 'SEC_BW6_K3', 'T_EAST'], aspect: 'YELLOW' },
            { id: 'R_S1_SOUTH', startSignal: 'S1', endTarget: 'TRAIN_SOUTH', direction: 'RIGHT', switches: { 'W6': 'PLUS', 'W7': 'MINUS' }, sections: ['K1', 'SEC_BW6', 'TRAIN_SOUTH'], aspect: 'YELLOW' },
            // Vjezdy 1S
            { id: 'R_1S_K1', startSignal: '1S', endTarget: 'K1', direction: 'LEFT', switches: { 'W7': 'PLUS', 'W6': 'PLUS' }, sections: ['T_EAST', 'SEC_BW6', 'K1'], aspect: 'GREEN' },
            { id: 'R_1S_K3', startSignal: '1S', endTarget: 'K3', direction: 'LEFT', switches: { 'W7': 'PLUS', 'W6': 'MINUS' }, sections: ['T_EAST', 'SEC_BW6_K3', 'K3'], aspect: 'YELLOW' },
            // Odjezdy na Západ
            { id: 'R_L1_T1', startSignal: 'L1', endTarget: 'T1', direction: 'LEFT', switches: { 'W1': 'PLUS' }, sections: ['K1', 'SEC_BW1', 'T1'], aspect: 'GREEN' },
            { id: 'R_L2_T2', startSignal: 'L2', endTarget: 'T2_WEST', direction: 'LEFT', switches: { 'W2': 'PLUS' }, sections: ['K2', 'SEC_BW2', 'T2_WEST'], aspect: 'GREEN' }
        ],
        defaultSchedule: [
            { id: 'Ex 572',  category: 'Ex', from: 'Západ', to: 'Východ', targetTrack: 'K1', arrTime: '08:02', depTime: '08:05', direction: 'RIGHT', speed: 0.005, maxSpeed: 120, dwellDuration: 10, state: 'WAITING_CONSENT' },
            { id: 'R 841',   category: 'R',  from: 'Východ', to: 'Západ', targetTrack: 'K2', arrTime: '08:04', depTime: '08:08', direction: 'LEFT',  speed: 0.004, maxSpeed: 95, dwellDuration: 14, state: 'WAITING_CONSENT' },
            { id: 'Os 9410', category: 'Os', from: 'Západ', to: 'Východ', targetTrack: 'K4', arrTime: '08:07', depTime: '08:12', direction: 'RIGHT', speed: 0.0035, maxSpeed: 80, dwellDuration: 18, state: 'WAITING_CONSENT' },
            { id: 'Nex 41100', category: 'Nex', from: 'Východ', to: 'Západ', targetTrack: 'K3', arrTime: '08:10', depTime: '08:15', direction: 'LEFT', speed: 0.0035, maxSpeed: 85, dwellDuration: 12, state: 'WAITING_CONSENT' },
            { id: 'Mn 83200', category: 'Mn', from: 'Západ', to: 'Jih', targetTrack: 'K5', arrTime: '08:14', depTime: '08:20', direction: 'RIGHT', speed: 0.0028, maxSpeed: 60, dwellDuration: 20, state: 'WAITING_CONSENT' }
        ]
    }
};
