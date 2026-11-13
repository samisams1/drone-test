const mqtt = require('mqtt');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

const TOPIC_PREFIX = 'samson/dji/dock01';

// 1. Serve the HTML Dashboard
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(fs.readFileSync('index.html'));
});

// 2. Attach WebSocket Server for the Browser
const wss = new WebSocket.Server({ server });

console.log('⏳ Connecting backend server to MQTT broker...');

// 3. Connect to the SAME MQTT Broker
/*const mqttClient = mqtt.connect('mqtt://127.0.0.1:1883', {
  clientId: 'rc-corner-server-' + Math.random().toString(16).slice(2, 8)
});*/
const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://127.0.0.1:1883';
const mqttClient = mqtt.connect(BROKER_URL, {
  clientId: 'rc-corner-server-' + Math.random().toString(16).slice(2, 8)
});
mqttClient.on('connect', () => {
  console.log('🖥️ [SERVER ONLINE] Connected & Subscribed to Drone Telemetry!');
  mqttClient.subscribe(`${TOPIC_PREFIX}/telemetry`, { qos: 1 });
});

// 4. Receive MQTT from Drone -> Push via WebSocket to Browser
mqttClient.on('message', (topic, message) => {
  const data = message.toString();
  console.log(`📥 Received Telemetry -> Forwarding to Web Dashboard`);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
});

// 5. Receive Button Click from Browser -> Publish MQTT Command to Drone
wss.on('connection', (ws) => {
  console.log('🌐 Browser Dashboard Connected');
  ws.on('message', (command) => {
    console.log(`📤 Sending Command to Drone: ${command}`);
    mqttClient.publish(`${TOPIC_PREFIX}/commands`, command.toString(), { qos: 1 });
  });
});

mqttClient.on('error', (err) => {
  console.error('❌ Server MQTT Error:', err.message);
});

server.listen(3000, () => {
  console.log('🚀 Dashboard ready at: http://localhost:3000');
});
