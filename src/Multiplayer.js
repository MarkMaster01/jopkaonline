/**
 * Multiplayer.js - Podpora síťové hry JOP Staničář přes WebRTC (PeerJS)
 * Umožňuje dvěma hráčům (spolužákům) řídit provoz společně přímo z prohlížeče.
 */

export class MultiplayerManager {
    constructor(onMessageReceived) {
        this.peer = null;
        this.conn = null;
        this.isHost = false;
        this.myId = null;
        this.onMessageReceived = onMessageReceived;
        this.statusCallback = null;
    }

    onStatusChange(cb) {
        this.statusCallback = cb;
    }

    notifyStatus(msg, type = 'info') {
        if (this.statusCallback) this.statusCallback(msg, type);
    }

    /**
     * Vytvoření místnosti (Host)
     */
    hostGame() {
        if (typeof Peer === 'undefined') {
            this.notifyStatus('Knihovna PeerJS se nenačetla. Zkontrolujte připojení k internetu.', 'error');
            return;
        }

        const roomCode = 'JOP-' + Math.floor(1000 + Math.random() * 9000);
        this.peer = new Peer(roomCode);

        this.peer.on('open', (id) => {
            this.myId = id;
            this.isHost = true;
            this.notifyStatus(`Místnost vytvořena! Kód pro spolužáka: ${id}`, 'success');
        });

        this.peer.on('connection', (conn) => {
            this.conn = conn;
            this.setupConnectionHandlers();
            this.notifyStatus(`Spolužák se připojil jako 2. výpravčí!`, 'success');
        });

        this.peer.on('error', (err) => {
            console.error('PeerJS error:', err);
            this.notifyStatus(`Chyba sítě: ${err.type || err.message}`, 'error');
        });
    }

    /**
     * Připojení k existující místnosti (Klient)
     */
    joinGame(roomCode) {
        if (!roomCode) {
            this.notifyStatus('Zadejte kód místnosti!', 'error');
            return;
        }

        if (typeof Peer === 'undefined') {
            this.notifyStatus('Knihovna PeerJS se nenačetla.', 'error');
            return;
        }

        this.peer = new Peer();

        this.peer.on('open', (id) => {
            this.myId = id;
            this.isHost = false;
            this.notifyStatus(`Připojuji k místnosti ${roomCode}...`, 'info');

            this.conn = this.peer.connect(roomCode.trim());
            this.setupConnectionHandlers();
        });

        this.peer.on('error', (err) => {
            console.error('PeerJS error:', err);
            this.notifyStatus(`Chyba připojení: ${err.message}`, 'error');
        });
    }

    setupConnectionHandlers() {
        this.conn.on('open', () => {
            this.notifyStatus(`Spojení navázáno! Můžete spolupracovat na řízení.`, 'success');
        });

        this.conn.on('data', (data) => {
            if (this.onMessageReceived) {
                this.onMessageReceived(data);
            }
        });

        this.conn.on('close', () => {
            this.notifyStatus(`Druhý výpravčí se odpojil.`, 'warning');
            this.conn = null;
        });
    }

    /**
     * Odeslání herní akce druhému hráči
     */
    sendAction(actionType, payload) {
        if (this.conn && this.conn.open) {
            this.conn.send({
                type: actionType,
                payload: payload,
                sender: this.isHost ? 'HOST' : 'CLIENT'
            });
        }
    }
}
