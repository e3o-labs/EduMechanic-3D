/**
 * Standalone Yjs WebSocket Server Mock for EduMechanic 3D Phase 3 Harness
 */
const http = require('http');
const WebSocket = require('ws');

const port = process.env.PORT || 1234;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('EduMechanic 3D Yjs WebSocket Server Running\n');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (conn, req) => {
  console.log(`🔌 [Yjs WS Harness] New 3D Collaboration Client Connected! Room: ${req.url}`);
  conn.on('message', (message) => {
    // Broadcast message to all connected clients in the room
    wss.clients.forEach((client) => {
      if (client !== conn && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

server.listen(port, () => {
  console.log(`🚀 [Yjs WS Harness] Listening on ws://localhost:${port}`);
});
