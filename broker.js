const { Aedes } = require('aedes');
const net = require('net');

async function startBroker() {
  const aedes = await Aedes.createBroker();
  const PORT = 1883;
  const server = net.createServer(aedes.handle);

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`📮 [LOCAL MQTT BROKER] Ready on mqtt://127.0.0.1:${PORT}`);
  });

  aedes.on('client', (client) => {
    console.log(`🔌 Device connected: ${client.id}`);
  });
}

startBroker();
