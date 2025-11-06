const WebSocket = require("ws");
const PORT = process.env.PORT || 10000;
const server = new WebSocket.Server({ port: PORT });

console.log("✅ Live Location Server running on port", PORT);

server.on("connection", (ws) => {
  console.log("User connected");
  ws.on("message", (msg) => {
    // Broadcast message to all clients
    for (const client of server.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg.toString());
      }
    }
  });
});
