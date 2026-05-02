const mqtt = require('mqtt');

const DEFAULT_MQTT_BROKER = 'mqtt://broker.hivemq.com:1883';
const DEFAULT_MQTT_TOPIC = 'iot/smartbin/data';
const DEFAULT_SENSOR_COLLECTION = 'sensor_data';

let mqttClient = null;

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

const normalizeSensorPayload = (payload, topic) => {
  const now = new Date();

  return {
    ...payload,
    distance: payload.distance == null ? payload.distance : Number(payload.distance),
    fill_percentage: payload.fill_percentage == null ? payload.fill_percentage : Number(payload.fill_percentage),
    predicted_next_fill: payload.predicted_next_fill == null ? payload.predicted_next_fill : Number(payload.predicted_next_fill),
    hour: payload.hour == null ? payload.hour : Number(payload.hour),
    day_of_week: payload.day_of_week == null ? payload.day_of_week : Number(payload.day_of_week),
    gas: payload.gas == null ? payload.gas : Number(payload.gas),
    gas_alert: payload.gas_alert == null ? payload.gas_alert : toBoolean(payload.gas_alert),
    angleX: payload.angleX == null ? payload.angleX : Number(payload.angleX),
    angleY: payload.angleY == null ? payload.angleY : Number(payload.angleY),
    fall_detected: payload.fall_detected == null ? payload.fall_detected : toBoolean(payload.fall_detected),
    topic,
    received_at: now,
    timestamp: payload.timestamp ? new Date(payload.timestamp) : now
  };
};

const startMqttIngest = (mongooseConnection) => {
  if (mqttClient) {
    return mqttClient;
  }

  if (process.env.MQTT_ENABLED === 'false') {
    console.log('[MQTT] Disabled by MQTT_ENABLED=false');
    return null;
  }

  const broker = process.env.MQTT_BROKER || DEFAULT_MQTT_BROKER;
  const topic = process.env.MQTT_TOPIC || DEFAULT_MQTT_TOPIC;
  const collectionName = process.env.SENSOR_COLLECTION || DEFAULT_SENSOR_COLLECTION;

  console.log(`[MQTT] Connecting to ${broker}...`);

  mqttClient = mqtt.connect(broker, {
    reconnectPeriod: 2000,
    connectTimeout: 10000,
    clientId: `node_smartbin_${Math.random().toString(16).slice(2, 8)}`
  });

  mqttClient.on('connect', () => {
    console.log('[MQTT] Connected');

    mqttClient.subscribe(topic, (error) => {
      if (error) {
        console.error('[MQTT] Subscribe failed:', error.message);
        return;
      }

      console.log(`[MQTT] Subscribed to ${topic}`);
    });
  });

  mqttClient.on('reconnect', () => {
    console.log('[MQTT] Reconnecting...');
  });

  mqttClient.on('error', (error) => {
    console.error('[MQTT] Error:', error.message);
  });

  mqttClient.on('message', async (messageTopic, message) => {
    const raw = message.toString();

    try {
      if (!mongooseConnection.db) {
        console.error('[MongoDB] Database not ready, skipping MQTT insert');
        return;
      }

      const payload = JSON.parse(raw);

      if (!payload.device_id) {
        console.error('[MQTT] Missing device_id, skipping payload:', raw);
        return;
      }

      const collection = mongooseConnection.db.collection(collectionName);
      const document = normalizeSensorPayload(payload, messageTopic);
      const result = await collection.insertOne(document);

      console.log('[DB] MQTT inserted:', result.insertedId.toString());
      console.log('[DATA]', document);
    } catch (error) {
      console.error('[DB] MQTT insert failed or invalid JSON:', error.message);
      console.error('[RAW]', raw);
    }
  });

  return mqttClient;
};

module.exports = {
  startMqttIngest
};
