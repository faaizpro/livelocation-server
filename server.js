const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

// ✅ Configuration
const PORT = process.env.PORT || 10000;
const FILE_PATH = path.join(__dirname, "locations.json");
const CLIENT_TIMEOUT = 30000; // 30 seconds

// ✅ Start WebSocket Server
const wss = new WebSocket.Server({ port: PORT });
console.log(`✅ Live Location WebSocket Server running on port ${PORT}`);

// Active clients → ws => { lat, lon, ts }
let clients = new Map();

// ✅ Handle new client connection
wss.on("connection", (ws) => {
  console.log("🟢 Client connected");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      if (typeof data.lat === "number" && typeof data.lon === "number") {
        // Save client's latest location
        clients.set(ws, { lat: data.lat, lon: data.lon, ts: Date.now() });
      }

      // Update file and broadcast to all
      broadcastAll();
      saveToFile();
    } catch (err) {
      console.error("❌ Invalid message:", err.message);
    }
  });

  ws.on("close", () => {
    console.log("🔴 Client disconnected");
    clients.delete(ws);
    broadcastAll();
    saveToFile();
  });
});

// ✅ Broadcast active client locations to everyone
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

  // Send live locations to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(snapshot);
    }
  });
}

// ✅ Save current coordinates to a JSON file
function saveToFile() {
  const users = Array.from(clients.values()).map((c) => ({
    lat: c.lat,
    lon: c.lon,
    ts: c.ts,
  }));

  fs.writeFile(FILE_PATH, JSON.stringify(users, null, 2), (err) => {
    if (err) console.error("❌ Error saving file:", err);
  });
}
