const WebSocket = require('ws');

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

let clients = {};
const CLIENT_TIMEOUT = 30000; // 30 seconds

console.log('WebSocket server listening on port', PORT);

wss.on('connection', ws => {
  console.log('New client connected');

  // Heartbeat
  ws.isAlive = true;
  ws.on('pong', () => ws.isAlive = true);

  ws.on('message', msg => {
    try {
      const data = JSON.parse(msg);

      if (data.type === 'update' && data.id && data.lat && data.lon) {
        clients[data.id] = {
          ws,
          id: data.id,
          name: data.name || '',
          phone: data.phone || '',
          device: data.device || '',
          lat: data.lat,
          lon: data.lon,
          ts: Date.now()
        };
      }

      broadcastClients();
    } catch (e) {
      console.error('Invalid message received:', e);
    }
  });

  ws.on('close', () => {
    removeClient(ws);
    broadcastClients();
  });

  ws.on('error', () => {
    removeClient(ws);
    broadcastClients();
  });
});

// Remove client helper
function removeClient(ws) {
  for (const id in clients) {
    if (clients[id].ws === ws) {
      delete clients[id];
      break;
    }
  }
}

// Broadcast active clients
function broadcastClients() {
  const now = Date.now();

  for (const id in clients) {
    if (now - clients[id].ts > CLIENT_TIMEOUT || clients[id].ws.readyState !== WebSocket.OPEN) {
      delete clients[id];
    }
  }

  const snapshot = JSON.stringify({
    type: 'all',
    users: Object.values(clients).map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      device: c.device,
      lat: c.lat,
      lon: c.lon,
      ts: c.ts
    }))
  });

  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) c.send(snapshot);
  });
}

// Heartbeat ping every 10 seconds
setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 10000);
