const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const DEVICE_IDS = ['esp32_01', 'esp32_02', 'esp32_03', 'esp32_04', 'esp32_05', 'esp32_06', 'esp32_07', 'esp32_08'];
const RECORDS_TO_GENERATE = 200; // Increased to 200 historical records per bin

const generateDynamicData = (deviceId, numRecords) => {
  const bins = [];
  let currentDate = new Date();
  
  // Start from numRecords hours ago to simulate past data
  currentDate.setHours(currentDate.getHours() - numRecords);

  let currentDistance = 100; // Start empty (100cm distance from sensor)

  for (let i = 0; i < numRecords; i++) {
    // Simulate gradual filling (distance decreasing) or sudden emptying
    if (currentDistance < 15) {
      currentDistance = 100; // Emptied
    } else {
      currentDistance -= Math.floor(Math.random() * 15); // Decrease by 0-14cm per hour
    }

    // Calculate fill percentage based on distance (assuming 100cm depth)
    const fill_percentage = Math.max(0, Math.min(100, 100 - currentDistance));
    
    // Determine status text
    let fill_status = 'LOW';
    if (fill_percentage >= 80) fill_status = 'HIGH';
    else if (fill_percentage >= 50) fill_status = 'MEDIUM';

    // Simulate gas readings
    const gas = Math.floor(Math.random() * 40); // 0-40 ppm
    const gas_alert = gas > 30; // Alert triggers if gas > 30
    
    // Occasional fall detection (5% chance)
    const fall_detected = Math.random() > 0.95; 

    const recordTime = new Date(currentDate);
    recordTime.setHours(recordTime.getHours() + i);

    bins.push({
      device_id: deviceId,
      distance: currentDistance,
      fill_percentage: fill_percentage,
      fill_status: fill_status,
      gas: gas,
      gas_alert: gas_alert,
      fall_detected: fall_detected,
      timestamp: recordTime,
      topic: 'iot/smartbin/data',
      received_at: new Date(recordTime.getTime() + 1000) // Received 1 second later
    });
  }

  return bins;
};

async function seedTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-waste-db');
    console.log('Connected to MongoDB');

    const collection = mongoose.connection.collection('sensor_data');

    // Loop through all devices to generate and insert data
    for (const deviceId of DEVICE_IDS) {
      // Remove existing test data for this specific device to prevent duplicates
      const deleteResult = await collection.deleteMany({ device_id: deviceId });
      console.log(`Cleared ${deleteResult.deletedCount} existing records for ${deviceId}`);

      const dynamicBins = generateDynamicData(deviceId, RECORDS_TO_GENERATE);
      await collection.insertMany(dynamicBins);
      console.log(`Successfully seeded ${dynamicBins.length} dynamic test records for ${deviceId}!`);
    }
    
  } catch (error) {
    console.error('Error seeding test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedTest();