const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const DEVICE_IDS = ['esp32_01', 'esp32_02'];
const TOPIC = 'demo/monthly-history';
const SEED_SOURCE = 'demo_month_may_fill_graphs';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const getFillStatus = (fillPercentage) => {
  if (fillPercentage >= 80) return 'HIGH';
  if (fillPercentage >= 40) return 'MEDIUM';
  return 'LOW';
};

const buildReading = ({ deviceId, timestamp, fillPercentage, gas, index }) => {
  const predictedNextFill = clamp(
    Math.round(fillPercentage + (deviceId === 'esp32_01' ? 4 : 6) + (index % 3)),
    0,
    100
  );

  return {
    device_id: deviceId,
    distance: clamp(100 - fillPercentage, 5, 100),
    bin_weight: Math.round(fillPercentage * (deviceId === 'esp32_01' ? 4.8 : 5.6)),
    fill_percentage: fillPercentage,
    fill_status: getFillStatus(fillPercentage),
    predicted_next_fill: predictedNextFill,
    predicted_fill_status: getFillStatus(predictedNextFill),
    hour: timestamp.getHours(),
    day_of_week: timestamp.getDay(),
    gas,
    gas_alert: gas >= 340,
    angleX: 0,
    angleY: 0,
    fall_detected: false,
    timestamp,
    received_at: new Date(timestamp.getTime() + 1000),
    topic: TOPIC,
    seed_source: SEED_SOURCE
  };
};

const generateMonthToDateReadings = (deviceId, now) => {
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0, 0);

  const readings = [];
  let index = 0;

  for (let current = new Date(start); current <= end; current.setHours(current.getHours() + 1)) {
    const day = current.getDate();
    const hour = current.getHours();
    const dailyBuildUp = hour * (deviceId === 'esp32_01' ? 2.2 : 2.8);
    const dayOffset = (day - 1) * (deviceId === 'esp32_01' ? 10 : 14);
    const wave = Math.round(Math.sin((hour / 24) * Math.PI) * 8);
    const emptiedReset = day > 1 && hour < 6 ? -35 : 0;
    const base = deviceId === 'esp32_01' ? 18 : 24;
    const fillPercentage = clamp(Math.round(base + dayOffset + dailyBuildUp + wave + emptiedReset), 4, 96);
    const gas = Math.round((deviceId === 'esp32_01' ? 235 : 260) + fillPercentage * 1.2 + (index % 5) * 7);

    readings.push(buildReading({
      deviceId,
      timestamp: new Date(current),
      fillPercentage,
      gas,
      index
    }));

    index += 1;
  }

  return readings;
};

async function seedDemoMonth() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-waste-db';
  const collectionName = process.env.SENSOR_COLLECTION || 'sensor_data';
  const now = new Date();
  const seedEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0, 0);

  await mongoose.connect(mongoUri);
  console.log(`[MongoDB] Connected to ${mongoose.connection.db.databaseName}`);

  const collection = mongoose.connection.db.collection(collectionName);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const deleteResult = await collection.deleteMany({
    device_id: { $in: DEVICE_IDS },
    seed_source: SEED_SOURCE,
    timestamp: {
      $gte: startOfMonth,
      $lte: endOfToday
    }
  });

  const readings = DEVICE_IDS.flatMap((deviceId) => generateMonthToDateReadings(deviceId, now));
  await collection.insertMany(readings);

  console.log(`[Seed] Removed ${deleteResult.deletedCount} previous demo records`);
  console.log(`[Seed] Inserted ${readings.length} demo records for ${DEVICE_IDS.join(', ')}`);
  console.log(`[Seed] Range: ${startOfMonth.toISOString()} to ${seedEnd.toISOString()}`);

  await mongoose.disconnect();
}

seedDemoMonth().catch(async (error) => {
  console.error('[Seed] Failed:', error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
