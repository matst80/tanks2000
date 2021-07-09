const WebSocket = require('ws');
const wss = new WebSocket.Server({
    port: 8080,
});

wss.on('connection', function connection(ws) {
    ws.hasMoved = false;

    wss.clients.forEach(function each(c) {
        if (c !== ws && c.lastMetric) {
            const msg = JSON.parse(c.lastMetric);
            ws.send(JSON.stringify({ playerConnected: msg.uid, ...msg }));
        }
    });

    ws.on('message', function incoming(message) {
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