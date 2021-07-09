export class Network {
    socket;
    constructor(serverAddress, onConnection) {
        const socket = new WebSocket('ws://localhost:8080');

        // Connection opened
        socket.addEventListener('open', function (event) {
            socket.send('Hello Server!');
            onConnection();
        });

        // Listen for messages
        socket.addEventListener('message', function (event) {
            console.log('Message from server ', event.data);
        });
        this.socket = socket;
    }
    sendMetrics(metrics) {
        this.socket.send(JSON.stringify(metrics));
    }
}