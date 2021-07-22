const WebSocket = require('ws');
const wss = new WebSocket.Server({
    port: 8080,
});

wss.on('connection', function connection(ws) {
    ws.hasMoved = false;

    wss.clients.forEach((c) => {
        if (c !== ws && c.lastMetric) {
            const msg = JSON.parse(c.lastMetric);
            ws.send(JSON.stringify({ playerConnected: msg.uid, ...msg }));
        }
    });

    ws.on('close', () => {
        console.log('ass');
        wss.clients.forEach(function each(c) {
            if (c !== ws && ws.lastMetric) {
                const msg = JSON.parse(ws.lastMetric);
                c.send(JSON.stringify({ playerDisconnected: msg.uid }));
            }
        });
    });

    ws.on('message', (message) => {
        ws.lastMetric = message;
        if (!ws.hasMoved) {
            ws.hasMoved = true;

            const msg = JSON.parse(message);

            wss.clients.forEach(function each(c) {
                if (c !== ws) {
                    c.send(JSON.stringify({ playerConnected: msg.uid, ...msg }));
                }
            });
        }

        wss.clients.forEach(function each(c) {
            if (c !== ws) {
                c.send(message);
            }
        });
    });

});