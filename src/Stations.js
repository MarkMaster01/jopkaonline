/**
 * Stations.js - Precizní geometrie a zabezpečovací konfigurace stanic pro Staničář
 * Stanice Lužná n. V. (střední) a Uzlová stanice Brod n. S. (velká uzlová s plnohodnotnými zhlavími)
 */

export const STATIONS = {
    // Stanice 1: Lužná nad Vltavou
    'luzna': {
        id: 'luzna',
        name: 'Stanice Lužná nad Vltavou',
        subtitle: 'Střední stanice se 3 dopravními kolejemi a automatickým přejezdem PZZ',
        canvasWidth: 1250,
        canvasHeight: 380,
        platforms: [
            { x: 490, y: 155, w: 260, h: 8, label: 'Nástupiště 2 (kolej 2)', textX: 590, textY: 150 },
            { x: 490, y: 235, w: 260, h: 8, label: 'Nástupiště 1 (kolej 1)', textX: 590, textY: 250 }
        ],
        sections: {
            // Západní trať
            'T1_EXT':     { id: 'T1_EXT',     name: 'Trať Západ (oddíl)',      occupied: false, locked: false, routeType: null, points: [{x: 40, y: 220}, {x: 170, y: 220}] },
            'T1':         { id: 'T1',         name: 'Trať 1 (Západ vjezd)',    occupied: false, locked: false, routeType: null, points: [{x: 170, y: 220}, {x: 320, y: 220}] },
            
            // Západní zhlaví
            'SEC_W1_W2':  { id: 'SEC_W1_W2',  name: 'Zhlaví W1-W2',            occupied: false, locked: false, routeType: null, points: [{x: 320, y: 220}, {x: 420, y: 220}] },
            'SEC_W1_K3':  { id: 'SEC_W1_K3',  name: 'Odbočka W1-K3',           occupied: false, locked: false, routeType: null, points: [{x: 320, y: 220}, {x: 440, y: 300}] },
            'SEC_W2_K2':  { id: 'SEC_W2_K2',  name: 'Odbočka W2-K2',           occupied: false, locked: false, routeType: null, points: [{x: 420, y: 220}, {x: 480, y: 140}] },

            // Staniční koleje
            'K2':         { id: 'K2',         name: 'Kolej 2',                 occupied: false, locked: false, routeType: null, points: [{x: 480, y: 140}, {x: 770, y: 140}], lengthM: 420, platform: true },
            'K1':         { id: 'K1',         name: 'Kolej 1 (hlavní)',        occupied: false, locked: false, routeType: null, points: [{x: 420, y: 220}, {x: 780, y: 220}], lengthM: 550, platform: true },
            'K3':         { id: 'K3',         name: 'Kolej 3',                 occupied: false, locked: false, routeType: null, points: [{x: 440, y: 300}, {x: 750, y: 300}], lengthM: 380, platform: false },

            // Východní zhlaví
            'SEC_K2_W3':  { id: 'SEC_K2_W3',  name: 'Odbočka K2-W3',           occupied: false, locked: false, routeType: null, points: [{x: 770, y: 140}, {x: 830, y: 220}] },
            'SEC_K3_W4':  { id: 'SEC_K3_W4',  name: 'Odbočka K3-W4',           occupied: false, locked: false, routeType: null, points: [{x: 750, y: 300}, {x: 910, y: 220}] },
            'SEC_W3_W4':  { id: 'SEC_W3_W4',  name: 'Zhlaví W3-W4',            occupied: false, locked: false, routeType: null, points: [{x: 780, y: 220}, {x: 910, y: 220}] },

            // Východní trať
            'T2':         { id: 'T2',         name: 'Trať 2 (Východ vjezd)',   occupied: false, locked: false, routeType: null, points: [{x: 910, y: 220}, {x: 1060, y: 220}] },
            'T2_EXT':     { id: 'T2_EXT',     name: 'Trať Východ (oddíl)',     occupied: false, locked: false, routeType: null, points: [{x: 1060, y: 220}, {x: 1200, y: 220}] }
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
            '1L': { id: '1L', name: 'Vjezdové 1L', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'T1', stopProgress: 0.70, position: { x: 285, y: 200 } },
            '1S': { id: '1S', name: 'Vjezdové 1S', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'T2', stopProgress: 0.30, position: { x: 945, y: 240 } },
            'S2': { id: 'S2', name: 'Odjezdové S2', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'K2', stopProgress: 0.90, position: { x: 755, y: 120 } },
            'S1': { id: 'S1', name: 'Odjezdové S1', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'K1', stopProgress: 0.90, position: { x: 765, y: 200 } },
            'S3': { id: 'S3', name: 'Odjezdové S3', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'K3', stopProgress: 0.90, position: { x: 735, y: 280 } },
            'L2': { id: 'L2', name: 'Odjezdové L2', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'K2', stopProgress: 0.10, position: { x: 495, y: 160 } },
            'L1': { id: 'L1', name: 'Odjezdové L1', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'K1', stopProgress: 0.10, position: { x: 435, y: 240 } },
            'L3': { id: 'L3', name: 'Odjezdové L3', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'K3', stopProgress: 0.10, position: { x: 455, y: 320 } }
        },
        tzz: {
            'WEST': { name: 'Trať Západ -> Lužná', direction: 'INTO_STATION', requestPending: false, pendingTrainId: null, arrowPos: { x: 90, y: 175 } },
            'EAST': { name: 'Trať Východ -> Brod',  direction: 'NONE',         requestPending: false, pendingTrainId: null, arrowPos: { x: 1090, y: 175 } }
        },
        routeCatalog: [
            // Vjezdy 1L (ze Západu)
            { id: 'R_1L_K1', startSignal: '1L', endTarget: 'K1', direction: 'RIGHT', switches: { 'W1': 'PLUS', 'W2': 'PLUS' }, sections: ['T1', 'SEC_W1_W2', 'K1'], aspect: 'GREEN' },
            { id: 'R_1L_K2', startSignal: '1L', endTarget: 'K2', direction: 'RIGHT', switches: { 'W1': 'PLUS', 'W2': 'MINUS' }, sections: ['T1', 'SEC_W1_W2', 'SEC_W2_K2', 'K2'], aspect: 'YELLOW' },
            { id: 'R_1L_K3', startSignal: '1L', endTarget: 'K3', direction: 'RIGHT', switches: { 'W1': 'MINUS' }, sections: ['T1', 'SEC_W1_K3', 'K3'], aspect: 'YELLOW' },
            // Odjezdy na Východ (T2)
            { id: 'R_S1_T2', startSignal: 'S1', endTarget: 'T2', direction: 'RIGHT', switches: { 'W3': 'PLUS', 'W4': 'PLUS' }, sections: ['K1', 'SEC_W3_W4', 'T2'], aspect: 'GREEN' },
            { id: 'R_S2_T2', startSignal: 'S2', endTarget: 'T2', direction: 'RIGHT', switches: { 'W3': 'MINUS', 'W4': 'PLUS' }, sections: ['K2', 'SEC_K2_W3', 'SEC_W3_W4', 'T2'], aspect: 'YELLOW' },
            { id: 'R_S3_T2', startSignal: 'S3', endTarget: 'T2', direction: 'RIGHT', switches: { 'W4': 'MINUS' }, sections: ['K3', 'SEC_K3_W4', 'T2'], aspect: 'YELLOW' },
            // Vjezdy 1S (z Východu)
            { id: 'R_1S_K1', startSignal: '1S', endTarget: 'K1', direction: 'LEFT', switches: { 'W4': 'PLUS', 'W3': 'PLUS' }, sections: ['T2', 'SEC_W3_W4', 'K1'], aspect: 'GREEN' },
            { id: 'R_1S_K2', startSignal: '1S', endTarget: 'K2', direction: 'LEFT', switches: { 'W4': 'PLUS', 'W3': 'MINUS' }, sections: ['T2', 'SEC_W3_W4', 'SEC_K2_W3', 'K2'], aspect: 'YELLOW' },
            { id: 'R_1S_K3', startSignal: '1S', endTarget: 'K3', direction: 'LEFT', switches: { 'W4': 'MINUS' }, sections: ['T2', 'SEC_K3_W4', 'K3'], aspect: 'YELLOW' },
            // Odjezdy na Západ (T1)
            { id: 'R_L1_T1', startSignal: 'L1', endTarget: 'T1', direction: 'LEFT', switches: { 'W2': 'PLUS', 'W1': 'PLUS' }, sections: ['K1', 'SEC_W1_W2', 'T1'], aspect: 'GREEN' },
            { id: 'R_L2_T1', startSignal: 'L2', endTarget: 'T1', direction: 'LEFT', switches: { 'W2': 'MINUS', 'W1': 'PLUS' }, sections: ['K2', 'SEC_W2_K2', 'SEC_W1_W2', 'T1'], aspect: 'YELLOW' },
            { id: 'R_L3_T1', startSignal: 'L3', endTarget: 'T1', direction: 'LEFT', switches: { 'W1': 'MINUS' }, sections: ['K3', 'SEC_W1_K3', 'T1'], aspect: 'YELLOW' }
        ],
        defaultSchedule: [
            { id: 'Os 4812', category: 'Os', from: 'Západ', to: 'Východ', targetTrack: 'K1', arrTime: '08:02', depTime: '08:06', direction: 'RIGHT', speed: 0.0035, maxSpeed: 80, dwellDuration: 14, state: 'WAITING_CONSENT' },
            { id: 'R 671',   category: 'R',  from: 'Východ', to: 'Západ', targetTrack: 'K2', arrTime: '08:06', depTime: '08:10', direction: 'LEFT',  speed: 0.0045, maxSpeed: 100, dwellDuration: 15, state: 'WAITING_CONSENT' },
            { id: 'Pn 52140',category: 'Pn', from: 'Západ', to: 'Východ', targetTrack: 'K3', arrTime: '08:11', depTime: '08:15', direction: 'RIGHT', speed: 0.003, maxSpeed: 70, dwellDuration: 10, state: 'WAITING_CONSENT' },
            { id: 'Sp 1745', category: 'Sp', from: 'Východ', to: 'Západ', targetTrack: 'K1', arrTime: '08:17', depTime: '08:21', direction: 'LEFT',  speed: 0.004, maxSpeed: 95, dwellDuration: 14, state: 'WAITING_CONSENT' }
        ]
    },

    // Stanice 2: Uzlová stanice Brod nad Sázavou (Plnohodnotná uzlová stanice s oboustrannými kolejovými spojkami a 5 kolejemi)
    'brod': {
        id: 'brod',
        name: 'Uzlová stanice Brod nad Sázavou',
        subtitle: 'Velká uzlová stanice s 5 dopravními kolejemi, oboustrannými spojkami a 3 traťovými směry',
        canvasWidth: 1440,
        canvasHeight: 460,
        platforms: [
            { x: 550, y: 110, w: 340, h: 8, label: 'Nástupiště 3 (kolej 4)', textX: 720, textY: 105 },
            { x: 550, y: 160, w: 340, h: 8, label: 'Nástupiště 2 (kolej 2)', textX: 720, textY: 155 },
            { x: 550, y: 220, w: 340, h: 8, label: 'Nástupiště 1 (kolej 1)', textX: 720, textY: 235 }
        ],
        sections: {
            // Dvoukolejná trať Západ
            'T2_EXT':     { id: 'T2_EXT',     name: '2. Trať Západ (oddíl)',   occupied: false, locked: false, routeType: null, points: [{x: 40, y: 160}, {x: 180, y: 160}] },
            'T2_WEST':    { id: 'T2_WEST',    name: '2. Trať Západ (vjezd)',   occupied: false, locked: false, routeType: null, points: [{x: 180, y: 160}, {x: 310, y: 160}] },
            'T1_EXT':     { id: 'T1_EXT',     name: '1. Trať Západ (oddíl)',   occupied: false, locked: false, routeType: null, points: [{x: 40, y: 220}, {x: 180, y: 220}] },
            'T1':         { id: 'T1',         name: '1. Trať Západ (vjezd)',   occupied: false, locked: false, routeType: null, points: [{x: 180, y: 220}, {x: 310, y: 220}] },

            // Západní zhlaví (plně propojené spojky W1, W2, W3, W4)
            'SEC_BW1':    { id: 'SEC_BW1',    name: 'Přímá W1-K1',             occupied: false, locked: false, routeType: null, points: [{x: 310, y: 220}, {x: 470, y: 220}] },
            'SEC_BW1_W2': { id: 'SEC_BW1_W2', name: 'Spojka W1-W2 dolů',       occupied: false, locked: false, routeType: null, points: [{x: 310, y: 220}, {x: 400, y: 270}] },
            'SEC_BW3':    { id: 'SEC_BW3',    name: 'Přímá W3-K2',             occupied: false, locked: false, routeType: null, points: [{x: 310, y: 160}, {x: 470, y: 160}] },
            'SEC_BW3_K4': { id: 'SEC_BW3_K4', name: 'Odbočka W3-K4',          occupied: false, locked: false, routeType: null, points: [{x: 310, y: 160}, {x: 450, y: 110}] },
            'SEC_BW2_K3': { id: 'SEC_BW2_K3', name: 'Odbočka W2-K3',          occupied: false, locked: false, routeType: null, points: [{x: 400, y: 270}, {x: 490, y: 270}] },
            'SEC_BW2_K5': { id: 'SEC_BW2_K5', name: 'Odbočka W2-K5',          occupied: false, locked: false, routeType: null, points: [{x: 400, y: 270}, {x: 520, y: 330}] },

            // 5 staničních kolejí
            'K4':         { id: 'K4',         name: 'Kolej 4 (předjízdná)',    occupied: false, locked: false, routeType: null, points: [{x: 450, y: 110}, {x: 920, y: 110}], lengthM: 520, platform: true },
            'K2':         { id: 'K2',         name: 'Kolej 2 (hlavní sudá)',   occupied: false, locked: false, routeType: null, points: [{x: 470, y: 160}, {x: 940, y: 160}], lengthM: 650, platform: true },
            'K1':         { id: 'K1',         name: 'Kolej 1 (hlavní lichá)',  occupied: false, locked: false, routeType: null, points: [{x: 470, y: 220}, {x: 940, y: 220}], lengthM: 670, platform: true },
            'K3':         { id: 'K3',         name: 'Kolej 3 (dopravní)',      occupied: false, locked: false, routeType: null, points: [{x: 490, y: 270}, {x: 910, y: 270}], lengthM: 480, platform: false },
            'K5':         { id: 'K5',         name: 'Kolej 5 (nákladní)',      occupied: false, locked: false, routeType: null, points: [{x: 520, y: 330}, {x: 880, y: 330}], lengthM: 410, platform: false },

            // Východní zhlaví (paralelní propustnost na 3 směry)
            'SEC_EW1_K4': { id: 'SEC_EW1_K4', name: 'Spojka K4-2.Trať',        occupied: false, locked: false, routeType: null, points: [{x: 920, y: 110}, {x: 990, y: 160}] },
            'SEC_EW1':    { id: 'SEC_EW1',    name: 'Přímá K2-2.Trať',         occupied: false, locked: false, routeType: null, points: [{x: 940, y: 160}, {x: 1060, y: 160}] },
            'SEC_EW2':    { id: 'SEC_EW2',    name: 'Přímá K1-1.Trať',         occupied: false, locked: false, routeType: null, points: [{x: 940, y: 220}, {x: 1060, y: 220}] },
            'SEC_EW3_K3': { id: 'SEC_EW3_K3', name: 'Spojka K3-1.Trať',        occupied: false, locked: false, routeType: null, points: [{x: 910, y: 270}, {x: 980, y: 220}] },
            'SEC_EW3_K5': { id: 'SEC_EW3_K5', name: 'Spojka K5-Lokálka',      occupied: false, locked: false, routeType: null, points: [{x: 880, y: 330}, {x: 1000, y: 330}] },
            'SEC_SOUTH':  { id: 'SEC_SOUTH',  name: 'Odbočka na Jih',          occupied: false, locked: false, routeType: null, points: [{x: 1000, y: 330}, {x: 1120, y: 330}] },

            // Východní tratě
            'T2_EAST':     { id: 'T2_EAST',    name: '2. Trať Východ (vjezd)',  occupied: false, locked: false, routeType: null, points: [{x: 1060, y: 160}, {x: 1210, y: 160}] },
            'T2_EAST_EXT': { id: 'T2_EAST_EXT',name: '2. Trať Východ (oddíl)',  occupied: false, locked: false, routeType: null, points: [{x: 1210, y: 160}, {x: 1400, y: 160}] },
            'T1_EAST':     { id: 'T1_EAST',    name: '1. Trať Východ (vjezd)',  occupied: false, locked: false, routeType: null, points: [{x: 1060, y: 220}, {x: 1210, y: 220}] },
            'T1_EAST_EXT': { id: 'T1_EAST_EXT',name: '1. Trať Východ (oddíl)',  occupied: false, locked: false, routeType: null, points: [{x: 1210, y: 220}, {x: 1400, y: 220}] },
            'T_SOUTH':     { id: 'T_SOUTH',    name: 'Trať Jih (Lokálka)',      occupied: false, locked: false, routeType: null, points: [{x: 1120, y: 330}, {x: 1350, y: 330}] }
        },
        switches: {
            'W1': { id: 'W1', name: 'Výhybka 1', position: 'PLUS', locked: false, joint: { x: 310, y: 220 }, plusTarget: { x: 470, y: 220 }, minusTarget: { x: 400, y: 270 } },
            'W2': { id: 'W2', name: 'Výhybka 2', position: 'PLUS', locked: false, joint: { x: 400, y: 270 }, plusTarget: { x: 490, y: 270 }, minusTarget: { x: 520, y: 330 } },
            'W3': { id: 'W3', name: 'Výhybka 3', position: 'PLUS', locked: false, joint: { x: 310, y: 160 }, plusTarget: { x: 470, y: 160 }, minusTarget: { x: 450, y: 110 } },
            'W6': { id: 'W6', name: 'Výhybka 6', position: 'PLUS', locked: false, joint: { x: 990, y: 160 }, plusTarget: { x: 940, y: 160 }, minusTarget: { x: 920, y: 110 } },
            'W7': { id: 'W7', name: 'Výhybka 7', position: 'PLUS', locked: false, joint: { x: 980, y: 220 }, plusTarget: { x: 940, y: 220 }, minusTarget: { x: 910, y: 270 } },
            'W8': { id: 'W8', name: 'Výhybka 8', position: 'PLUS', locked: false, joint: { x: 1000, y: 330 }, plusTarget: { x: 1120, y: 330 }, minusTarget: { x: 880, y: 330 } }
        },
        crossings: {
            'PZZ_B1': { id: 'PZZ_B1', name: 'Přejezd km 52.8', x: 230, y: 220, state: 'OPEN', manual: false }
        },
        signals: {
            '1L': { id: '1L', name: 'Vjezdové 1L', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'T1', stopProgress: 0.70, position: { x: 285, y: 200 } },
            '2L': { id: '2L', name: 'Vjezdové 2L', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'T2_WEST', stopProgress: 0.70, position: { x: 285, y: 140 } },
            '1S': { id: '1S', name: 'Vjezdové 1S', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'T1_EAST', stopProgress: 0.30, position: { x: 1090, y: 240 } },
            '2S': { id: '2S', name: 'Vjezdové 2S', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'T2_EAST', stopProgress: 0.30, position: { x: 1090, y: 180 } },

            'S4': { id: 'S4', name: 'Odjezdové S4', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'K4', stopProgress: 0.90, position: { x: 900, y: 90 } },
            'S2': { id: 'S2', name: 'Odjezdové S2', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'K2', stopProgress: 0.90, position: { x: 920, y: 140 } },
            'S1': { id: 'S1', name: 'Odjezdové S1', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'K1', stopProgress: 0.90, position: { x: 920, y: 200 } },
            'S3': { id: 'S3', name: 'Odjezdové S3', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'K3', stopProgress: 0.90, position: { x: 890, y: 250 } },
            'S5': { id: 'S5', name: 'Odjezdové S5', type: 'MAIN', direction: 'RIGHT', aspect: 'RED', section: 'K5', stopProgress: 0.90, position: { x: 860, y: 310 } },

            'L4': { id: 'L4', name: 'Odjezdové L4', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'K4', stopProgress: 0.10, position: { x: 470, y: 130 } },
            'L2': { id: 'L2', name: 'Odjezdové L2', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'K2', stopProgress: 0.10, position: { x: 490, y: 180 } },
            'L1': { id: 'L1', name: 'Odjezdové L1', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'K1', stopProgress: 0.10, position: { x: 490, y: 240 } },
            'L3': { id: 'L3', name: 'Odjezdové L3', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'K3', stopProgress: 0.10, position: { x: 510, y: 290 } },
            'L5': { id: 'L5', name: 'Odjezdové L5', type: 'MAIN', direction: 'LEFT',  aspect: 'RED', section: 'K5', stopProgress: 0.10, position: { x: 540, y: 350 } }
        },
        tzz: {
            'WEST': { name: 'Dvoukolejka Západ -> Praha', direction: 'INTO_STATION', requestPending: false, pendingTrainId: null, arrowPos: { x: 90, y: 120 } },
            'EAST': { name: 'Trať Východ -> Brno',        direction: 'NONE',         requestPending: false, pendingTrainId: null, arrowPos: { x: 1240, y: 120 } },
            'SOUTH': { name: 'Lokálka Jih -> Skalka',     direction: 'NONE',         requestPending: false, pendingTrainId: null, arrowPos: { x: 1240, y: 295 } }
        },
        routeCatalog: [
            // Vjezdy 1L (z 1. traťové Západ)
            { id: 'R_1L_K1', startSignal: '1L', endTarget: 'K1', direction: 'RIGHT', switches: { 'W1': 'PLUS' }, sections: ['T1', 'SEC_BW1', 'K1'], aspect: 'GREEN' },
            { id: 'R_1L_K3', startSignal: '1L', endTarget: 'K3', direction: 'RIGHT', switches: { 'W1': 'MINUS', 'W2': 'PLUS' }, sections: ['T1', 'SEC_BW1_W2', 'SEC_BW2_K3', 'K3'], aspect: 'YELLOW' },
            { id: 'R_1L_K5', startSignal: '1L', endTarget: 'K5', direction: 'RIGHT', switches: { 'W1': 'MINUS', 'W2': 'MINUS' }, sections: ['T1', 'SEC_BW1_W2', 'SEC_BW2_K5', 'K5'], aspect: 'YELLOW' },

            // Vjezdy 2L (z 2. traťové Západ)
            { id: 'R_2L_K2', startSignal: '2L', endTarget: 'K2', direction: 'RIGHT', switches: { 'W3': 'PLUS' }, sections: ['T2_WEST', 'SEC_BW3', 'K2'], aspect: 'GREEN' },
            { id: 'R_2L_K4', startSignal: '2L', endTarget: 'K4', direction: 'RIGHT', switches: { 'W3': 'MINUS' }, sections: ['T2_WEST', 'SEC_BW3_K4', 'K4'], aspect: 'YELLOW' },

            // Odjezdy na 1. trať Východ (T1_EAST)
            { id: 'R_S1_T1', startSignal: 'S1', endTarget: 'T1_EAST', direction: 'RIGHT', switches: { 'W7': 'PLUS' }, sections: ['K1', 'SEC_EW2', 'T1_EAST'], aspect: 'GREEN' },
            { id: 'R_S3_T1', startSignal: 'S3', endTarget: 'T1_EAST', direction: 'RIGHT', switches: { 'W7': 'MINUS' }, sections: ['K3', 'SEC_EW3_K3', 'SEC_EW2', 'T1_EAST'], aspect: 'YELLOW' },

            // Odjezdy na 2. trať Východ (T2_EAST)
            { id: 'R_S2_T2', startSignal: 'S2', endTarget: 'T2_EAST', direction: 'RIGHT', switches: { 'W6': 'PLUS' }, sections: ['K2', 'SEC_EW1', 'T2_EAST'], aspect: 'GREEN' },
            { id: 'R_S4_T2', startSignal: 'S4', endTarget: 'T2_EAST', direction: 'RIGHT', switches: { 'W6': 'MINUS' }, sections: ['K4', 'SEC_EW1_K4', 'SEC_EW1', 'T2_EAST'], aspect: 'YELLOW' },

            // Odjezdy na Lokálku Jih (T_SOUTH)
            { id: 'R_S5_SOUTH', startSignal: 'S5', endTarget: 'T_SOUTH', direction: 'RIGHT', switches: { 'W8': 'PLUS' }, sections: ['K5', 'SEC_EW3_K5', 'SEC_SOUTH', 'T_SOUTH'], aspect: 'GREEN' },

            // Vjezdy z Východu (1S a 2S)
            { id: 'R_1S_K1', startSignal: '1S', endTarget: 'K1', direction: 'LEFT', switches: { 'W7': 'PLUS' }, sections: ['T1_EAST', 'SEC_EW2', 'K1'], aspect: 'GREEN' },
            { id: 'R_1S_K3', startSignal: '1S', endTarget: 'K3', direction: 'LEFT', switches: { 'W7': 'MINUS' }, sections: ['T1_EAST', 'SEC_EW2', 'SEC_EW3_K3', 'K3'], aspect: 'YELLOW' },
            { id: 'R_2S_K2', startSignal: '2S', endTarget: 'K2', direction: 'LEFT', switches: { 'W6': 'PLUS' }, sections: ['T2_EAST', 'SEC_EW1', 'K2'], aspect: 'GREEN' },
            { id: 'R_2S_K4', startSignal: '2S', endTarget: 'K4', direction: 'LEFT', switches: { 'W6': 'MINUS' }, sections: ['T2_EAST', 'SEC_EW1', 'SEC_EW1_K4', 'K4'], aspect: 'YELLOW' },

            // Odjezdy na Západ
            { id: 'R_L1_T1', startSignal: 'L1', endTarget: 'T1', direction: 'LEFT', switches: { 'W1': 'PLUS' }, sections: ['K1', 'SEC_BW1', 'T1'], aspect: 'GREEN' },
            { id: 'R_L2_T2', startSignal: 'L2', endTarget: 'T2_WEST', direction: 'LEFT', switches: { 'W3': 'PLUS' }, sections: ['K2', 'SEC_BW3', 'T2_WEST'], aspect: 'GREEN' },
            { id: 'R_L3_T1', startSignal: 'L3', endTarget: 'T1', direction: 'LEFT', switches: { 'W2': 'PLUS', 'W1': 'MINUS' }, sections: ['K3', 'SEC_BW2_K3', 'SEC_BW1_W2', 'T1'], aspect: 'YELLOW' },
            { id: 'R_L4_T2', startSignal: 'L4', endTarget: 'T2_WEST', direction: 'LEFT', switches: { 'W3': 'MINUS' }, sections: ['K4', 'SEC_BW3_K4', 'SEC_BW3', 'T2_WEST'], aspect: 'YELLOW' },
            { id: 'R_L5_T1', startSignal: 'L5', endTarget: 'T1', direction: 'LEFT', switches: { 'W2': 'MINUS', 'W1': 'MINUS' }, sections: ['K5', 'SEC_BW2_K5', 'SEC_BW1_W2', 'T1'], aspect: 'YELLOW' }
        ],
        defaultSchedule: [
            { id: 'Ex 572',  category: 'Ex', from: 'Západ', to: 'Východ', targetTrack: 'K1', arrTime: '08:02', depTime: '08:05', direction: 'RIGHT', speed: 0.005, maxSpeed: 120, dwellDuration: 12, state: 'WAITING_CONSENT' },
            { id: 'R 841',   category: 'R',  from: 'Východ', to: 'Západ', targetTrack: 'K2', arrTime: '08:06', depTime: '08:10', direction: 'LEFT',  speed: 0.004, maxSpeed: 95, dwellDuration: 14, state: 'WAITING_CONSENT' },
            { id: 'Os 9410', category: 'Os', from: 'Západ', to: 'Východ', targetTrack: 'K4', arrTime: '08:11', depTime: '08:16', direction: 'RIGHT', speed: 0.0035, maxSpeed: 80, dwellDuration: 18, state: 'WAITING_CONSENT' },
            { id: 'Nex 41100', category: 'Nex', from: 'Východ', to: 'Západ', targetTrack: 'K3', arrTime: '08:16', depTime: '08:21', direction: 'LEFT', speed: 0.0035, maxSpeed: 85, dwellDuration: 12, state: 'WAITING_CONSENT' },
            { id: 'Mn 83200', category: 'Mn', from: 'Západ', to: 'Jih', targetTrack: 'K5', arrTime: '08:22', depTime: '08:28', direction: 'RIGHT', speed: 0.0028, maxSpeed: 60, dwellDuration: 20, state: 'WAITING_CONSENT' }
        ]
    }
};
