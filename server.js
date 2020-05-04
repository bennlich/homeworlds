let WebSocket = require('ws');

let wss = new WebSocket.Server({
  host: 'localhost',
  port: 8787
}, () => console.log(`Websocket server listening on ${JSON.stringify(wss.address())}`));

let state = {};

wss.on('connection', (ws) => {
  console.log('New connection!');

  // Send full state to new clients
  ws.send(JSON.stringify({ type: 'init', state }));
  
  // Forward update messages from clients to other clients, and update
  // in-memory state
  ws.on('message', (data) => {
    console.log(`Received ${data}`);
    data = JSON.parse(data);
    if (data.type === 'set') {
      state[data.key] = data.value;
    }
    if (data.type === 'delete') {
      delete state[data.key];
    }
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });
  
  ws.on('close', () => {
    console.log('Connection closed');
  });
});

