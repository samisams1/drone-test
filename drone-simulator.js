const mqtt = require('mqtt');
const DRONE_CONFIG = {
  brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://127.0.0.1:1883',
  topicPrefix: 'samson/dji/dock01'
};
console.log('⏳ Connecting drone to MQTT broker...');

const droneClient = mqtt.connect(DRONE_CONFIG.brokerUrl, {
  clientId: 'dji-matrice-30t-' + Math.random().toString(16).slice(2, 8),
  clean: true
});

let latitude = 25.2528;
let longitude = 55.3644;
let altitude = 50;
let battery = 100;
let droneStatus = 'IN_FLIGHT'; // Tracks live state

droneClient.on('connect', () => {
  console.log('🚁 [DRONE ONLINE] Connected to MQTT Broker!');

  // Subscribe with QoS 1 and confirm subscription succeeds
  const commandTopic = `${DRONE_CONFIG.topicPrefix}/commands`;
  droneClient.subscribe(commandTopic, { qos: 1 }, (err) => {
    if (!err) {
      console.log(`👂 Drone listening for commands on: ${commandTopic}`);
    } else {
      console.error('❌ Subscription failed:', err);
    }
  });

  // Send telemetry every 1 second
  setInterval(() => {
    // If returning home, fly back toward starting point!
    if (droneStatus === 'RETURNING_TO_HOME') {
      latitude -= 0.0001;
      longitude -= 0.0001;
    } else {
      latitude += 0.0001;
      longitude += 0.0001;
    }

    battery = battery > 10 ? +(battery - 0.1).toFixed(1) : 100;

    const telemetryData = {
      droneId: 'Matrice-30T-01',
      status: droneStatus,
      gps: {
        lat: +latitude.toFixed(6),
        lng: +longitude.toFixed(6),
        altitude_m: altitude
      },
      battery_percent: battery,
      wind_speed_ms: +(Math.random() * 5 + 2).toFixed(1),
      timestamp: new Date().toISOString()
    };

    const topic = `${DRONE_CONFIG.topicPrefix}/telemetry`;
    droneClient.publish(topic, JSON.stringify(telemetryData), { qos: 1 });
    console.log(`📡 [${droneStatus}] Lat: ${telemetryData.gps.lat}, Battery: ${battery}%`);
  }, 1000);
});

// Triggered when you click the red button on your dashboard!
droneClient.on('message', (topic, message) => {
  const command = message.toString();
  console.log(`\n🚨 [COMMAND RECEIVED ON DRONE]: ${command}\n`);

  if (command === 'RETURN_TO_HOME_NOW') {
    droneStatus = 'RETURNING_TO_HOME';
  }
});

droneClient.on('error', (err) => {
  console.error('❌ Drone MQTT Error:', err.message);
});
