const WebSocket = require("ws");

// ✅ Server setup
const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`✅ Live Location WebSocket Server running on port ${PORT}`);

// Store clients with location data
let clients = new Map(); // ws → { lat, lon, ts }
const CLIENT_TIMEOUT = 30000; // remove client if no update in 30s

// ✅ Handle new connections
wss.on("connection", (ws) => {
  console.log("🟢 Client connected");

  // When a client sends a message
  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      if (typeof data.lat === "number" && typeof data.lon === "number") {
        // Save latest location
        clients.set(ws, { lat: data.lat, lon: data.lon, ts: Date.now() });
      }

      broadcastAll();
    } catch (e) {
      console.error("❌ Invalid message:", e.message);
    }
  });

  // On close → remove client
  ws.on("close", () => {
    console.log("🔴 Client disconnected");
    clients.delete(ws);
    broadcastAll();
  });
});

// ✅ Broadcast all active client locations
function broadcastAll() {
  const now = Date.now();

  // Remove inactive clients
  for (const [ws, info] of clients) {
    if (now - info.ts > CLIENT_TIMEOUT) {
      clients.delete(ws);
    }
  }

  const users = Array.from(clients.values());
  const snapshot = JSON.stringify({ type: "all", users });

  // Send updated locations to all
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(snapshot);
    }
  });
}
