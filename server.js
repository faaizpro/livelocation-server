const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

let clients = new Map();

wss.on("connection", (ws) => {
  console.log("✅ Client connected");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.id && data.lat && data.lon) {
        clients.set(data.id, { id: data.id, lat: data.lat, lon: data.lon });
        broadcastAll();
      }
    } catch (e) {
      console.error("❌ JSON parse error:", e);
    }
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
    broadcastAll();
  });
});

function broadcastAll() {
  const users = Array.from(clients.values());
  const message = JSON.stringify({ type: "all", users });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  });
}

console.log(`🌍 Live Location Server running on ws://localhost:${PORT}`);
