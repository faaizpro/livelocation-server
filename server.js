// server.js
const WebSocket = require("ws");
const PORT = process.env.PORT || 8000;
const wss = new WebSocket.Server({ port: PORT });

let users = new Map(); // key: userId, value: { lat, lon }

wss.on("connection", (ws) => {
  console.log("✅ New client connected");

  // Send initial list of users
  ws.send(JSON.stringify({ type: "all", users: [...users.entries()].map(([id, u]) => ({ id, ...u })) }));

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.lat && data.lon) {
        // Create ID if not provided
        if (!data.id) data.id = Math.random().toString(36).substring(2, 10);
        users.set(data.id, { lat: data.lat, lon: data.lon });

        // Broadcast to all clients
        const allUsers = [...users.entries()].map(([id, u]) => ({ id, ...u }));
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "all", users: allUsers }));
          }
        });
      }
    } catch (err) {
      console.error("Error parsing message:", err);
    }
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });
});

console.log(`🌐 WebSocket server running on port ${PORT}`);
