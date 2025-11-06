const WebSocket = require("ws");
const PORT = process.env.PORT || 10000;
const server = new WebSocket.Server({ port: PORT });

console.log("✅ Live Location Server started on port", PORT);

let clients = {};

server.on("connection", (ws) => {
  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === "update") {
        clients[data.id] = {
          id: data.id,
          name: data.name,
          device: data.device,
          lat: data.lat,
          lon: data.lon,
          lastUpdate: Date.now()
        };
      }
      // Send all user data to everyone
      const all = JSON.stringify({ type: "all", users: Object.values(clients) });
      for (const client of server.clients) {
        if (client.readyState === WebSocket.OPEN) client.send(all);
      }
    } catch (e) {
      console.log("❌ Invalid message", e);
    }
  });
});
