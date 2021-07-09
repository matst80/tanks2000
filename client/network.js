export class Network {
    socket;
    uid;
    events = [];
    constructor(serverAddress, onConnection, uid) {
        this.uid = uid;
        const socket = new WebSocket('ws://localhost:8080');

        // Connection opened
        socket.addEventListener('open', function (event) {
            onConnection();
        });

        // Listen for messages
        socket.addEventListener('message', (event) => {
            this.events.push(JSON.parse(event.data));
        });
        this.socket = socket;
    }
    getEvents() {
        const result = [...this.events];
        this.events = [];
        return result;
    }
    sendMetrics(metrics) {
        this.socket.send(JSON.stringify({ metrics, uid: this.uid }));
    }
}