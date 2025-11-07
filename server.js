const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

// Store connected clients and their last locations
let clients = new Map();

wss.on("connection", (ws) => {
  console.log("✅ Client connected");

  // Assign random id for this connection
  const id = Math.random().toString(36).substr(2, 9);
  clients.set(ws, { id, lat: null, lon: null });

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.lat && data.lon) {
        clients.set(ws, { id, lat: data.lat, lon: data.lon });
        broadcastAll();
      }
    } catch (e) {
      console.error("Invalid JSON:", e);
    }
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
    clients.delete(ws);
    broadcastAll();
  });
});

function broadcastAll() {
  const allUsers = [];
  for (const [_, user] of clients.entries()) {
    if (user.lat !== null && user.lon !== null) {
      allUsers.push(user);
    }
  }

  const message = JSON.stringify({ type: "all", users: allUsers });

  for (const client of clients.keys()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

console.log("🌍 Live location WebSocket server running on port", PORT);
