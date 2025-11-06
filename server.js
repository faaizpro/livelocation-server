const WebSocket = require('ws');
const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });
let clients = {}; // store latest user info by id

wss.on('connection', ws => {
  ws.on('message', msg => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'update') {
        clients[data.id] = {
          id: data.id,
          name: data.name,
          phone: data.phone,
          device: data.device,
          lat: data.lat,
          lon: data.lon,
          ts: Date.now()
        };
      }
      // broadcast snapshot of all users
      const all = JSON.stringify({ type: 'all', users: Object.values(clients) });
      wss.clients.forEach(c => {
        if (c.readyState === WebSocket.OPEN) c.send(all);
      });
    } catch (e) {
      console.error('invalid message', e);
    }
  });

  ws.on('close', () => {});
});

console.log('WebSocket server listening on', PORT);
