const mongoose = require('mongoose');
const Bin = require('./models/Bin');
require('dotenv').config();

const seedBins = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-waste-db');
    console.log('Connected to MongoDB');

    // Clear existing bins
    await Bin.deleteMany({});
    console.log('Cleared existing bins');

    // Create sample bins
    const sampleBins = [
      {
        binId: 'BIN-001',
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'Downtown Street, Area A'
        },
        capacity: 100,
        height: 120,
        fillLevel: 85,
        status: 'active',
        lastEmptied: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        sensorData: [
          {
            timestamp: new Date(),
            fillLevel: 85,
            temperature: 22,
            humidity: 45
          }
        ]
      },
      {
        binId: 'BIN-002',
        location: {
          latitude: 40.7138,
          longitude: -74.0070,
          address: 'Main Street, Area B'
        },
        capacity: 100,
        height: 120,
        fillLevel: 92,
        status: 'active',
        lastEmptied: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        sensorData: [
          {
            timestamp: new Date(),
            fillLevel: 92,
            temperature: 23,
            humidity: 48
          }
        ],
        alerts: [
          {
            type: 'full',
            message: 'Bin is 92% full',
            timestamp: new Date(),
            resolved: false
          }
        ]
      },
      {
        binId: 'BIN-003',
        location: {
          latitude: 40.7148,
          longitude: -74.0050,
          address: 'Park Avenue, Area C'
        },
        capacity: 100,
        height: 120,
        fillLevel: 45,
        status: 'active',
        lastEmptied: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        sensorData: [
          {
            timestamp: new Date(),
            fillLevel: 45,
            temperature: 21,
            humidity: 50
          }
        ]
      },
      {
        binId: 'BIN-004',
        location: {
          latitude: 40.7158,
          longitude: -74.0040,
          address: 'Market Square, Area D'
        },
        capacity: 100,
        height: 120,
        fillLevel: 88,
        status: 'active',
        lastEmptied: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        sensorData: [
          {
            timestamp: new Date(),
            fillLevel: 88,
            temperature: 24,
            humidity: 46
          }
        ],
        alerts: [
          {
            type: 'full',
            message: 'Bin is 88% full',
            timestamp: new Date(),
            resolved: false
          }
        ]
      },
      {
        binId: 'BIN-005',
        location: {
          latitude: 40.7168,
          longitude: -74.0030,
          address: 'Central Park, Area E'
        },
        capacity: 100,
        height: 120,
        fillLevel: 65,
        status: 'active',
        lastEmptied: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        sensorData: [
          {
            timestamp: new Date(),
            fillLevel: 65,
            temperature: 20,
            humidity: 52
          }
        ]
      },
      {
        binId: 'BIN-006',
        location: {
          latitude: 40.7178,
          longitude: -74.0020,
          address: 'Harbor Road, Area F'
        },
        capacity: 100,
        height: 120,
        fillLevel: 20,
        status: 'active',
        lastEmptied: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        sensorData: [
          {
            timestamp: new Date(),
            fillLevel: 20,
            temperature: 19,
            humidity: 48
          }
        ]
      },
      {
        binId: 'BIN-007',
        location: {
          latitude: 40.7188,
          longitude: -74.0010,
          address: 'Industrial Zone, Area G'
        },
        capacity: 100,
        height: 120,
        fillLevel: 100,
        status: 'offline',
        lastEmptied: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        sensorData: [],
        alerts: [
          {
            type: 'offline',
            message: 'Bin is offline',
            timestamp: new Date(),
            resolved: false
          },
          {
            type: 'full',
            message: 'Bin is 100% full',
            timestamp: new Date(),
            resolved: false
          }
        ]
      },
      {
        binId: 'BIN-008',
        location: {
          latitude: 40.7198,
          longitude: -74.0000,
          address: 'Residential Area, Area H'
        },
        capacity: 100,
        height: 120,
        fillLevel: 55,
        status: 'maintenance',
        lastEmptied: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        sensorData: [],
        alerts: [
          {
            type: 'maintenance',
            message: 'Bin is under maintenance',
            timestamp: new Date(),
            resolved: false
          }
        ]
      }
    ];

    // Insert bins
    const createdBins = await Bin.insertMany(sampleBins);
    console.log(`Created ${createdBins.length} sample bins`);

    // Display summary
    console.log('\nBin Summary:');
    console.log(`- Total bins: ${createdBins.length}`);
    console.log(`- Full bins (80%+): ${createdBins.filter(b => b.fillLevel >= 80).length}`);
    console.log(`- Offline bins: ${createdBins.filter(b => b.status === 'offline').length}`);
    console.log(`- Bins under maintenance: ${createdBins.filter(b => b.status === 'maintenance').length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedBins();
