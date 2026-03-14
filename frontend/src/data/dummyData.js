export const kpiData = {
  activeBins: 12,
  averageFill: 68,
  highRiskBins: 2,
  wasteCollectedToday: 32
};

export const binData = [
  {
    id: 'BIN-001',
    location: 'Colombo Fort - Main Street',
    fillLevel: 85,
    weight: 45.2,
    odorLevel: 7.8,
    temperature: 28.5,
    humidity: 65,
    status: 'critical',
    lastCollection: '2024-03-14 08:30',
    coordinates: [6.9271, 79.8612]
  },
  {
    id: 'BIN-002',
    location: 'Marine Drive - Galle Face',
    fillLevel: 45,
    weight: 22.1,
    odorLevel: 3.2,
    temperature: 26.8,
    humidity: 70,
    status: 'normal',
    lastCollection: '2024-03-14 06:15',
    coordinates: [6.9319, 79.8428]
  },
  {
    id: 'BIN-003',
    location: 'Kollupitiya - Supermarket Area',
    fillLevel: 72,
    weight: 38.7,
    odorLevel: 6.5,
    temperature: 27.2,
    humidity: 68,
    status: 'warning',
    lastCollection: '2024-03-14 09:45',
    coordinates: [6.9064, 79.8597]
  },
  {
    id: 'BIN-004',
    location: 'Bambalapitiya - Market Street',
    fillLevel: 91,
    weight: 48.9,
    odorLevel: 8.9,
    temperature: 29.1,
    humidity: 72,
    status: 'critical',
    lastCollection: '2024-03-14 07:20',
    coordinates: [6.8779, 79.8629]
  },
  {
    id: 'BIN-005',
    location: 'Nugegoda - Shopping Complex',
    fillLevel: 35,
    weight: 18.3,
    odorLevel: 2.8,
    temperature: 26.5,
    humidity: 66,
    status: 'normal',
    lastCollection: '2024-03-14 10:00',
    coordinates: [6.8893, 79.8875]
  },
  {
    id: 'BIN-006',
    location: 'Rajagiriya - Hospital Area',
    fillLevel: 58,
    weight: 31.4,
    odorLevel: 5.1,
    temperature: 27.8,
    humidity: 69,
    status: 'normal',
    lastCollection: '2024-03-14 08:45',
    coordinates: [6.9172, 79.9047]
  },
  {
    id: 'BIN-007',
    location: 'Kirillapone - Industrial Zone',
    fillLevel: 78,
    weight: 42.6,
    odorLevel: 7.2,
    temperature: 28.9,
    humidity: 71,
    status: 'warning',
    lastCollection: '2024-03-14 07:30',
    coordinates: [6.8523, 79.8768]
  },
  {
    id: 'BIN-008',
    location: 'Mount Lavinia - Beach Road',
    fillLevel: 42,
    weight: 21.8,
    odorLevel: 3.5,
    temperature: 26.2,
    humidity: 73,
    status: 'normal',
    lastCollection: '2024-03-14 09:15',
    coordinates: [6.8277, 79.8364]
  },
  {
    id: 'BIN-009',
    location: 'Dehiwala - Railway Station',
    fillLevel: 66,
    weight: 35.9,
    odorLevel: 5.8,
    temperature: 27.5,
    humidity: 67,
    status: 'normal',
    lastCollection: '2024-03-14 08:00',
    coordinates: [6.8370, 79.8539]
  },
  {
    id: 'BIN-010',
    location: 'Panadura - Town Center',
    fillLevel: 52,
    weight: 28.3,
    odorLevel: 4.6,
    temperature: 27.1,
    humidity: 64,
    status: 'normal',
    lastCollection: '2024-03-14 09:30',
    coordinates: [6.7132, 79.9154]
  },
  {
    id: 'BIN-011',
    location: 'Maharagama - Bus Stand',
    fillLevel: 81,
    weight: 44.7,
    odorLevel: 7.5,
    temperature: 28.7,
    humidity: 70,
    status: 'warning',
    lastCollection: '2024-03-14 06:45',
    coordinates: [6.8456, 79.9218]
  },
  {
    id: 'BIN-012',
    location: 'Kesbewa - Residential Area',
    fillLevel: 38,
    weight: 19.6,
    odorLevel: 3.1,
    temperature: 26.8,
    humidity: 65,
    status: 'normal',
    lastCollection: '2024-03-14 10:30',
    coordinates: [6.7778, 79.8856]
  }
];

export const alertsData = [
  {
    id: 1,
    binId: 'BIN-001',
    type: 'critical',
    message: 'Bin almost full (91% capacity)',
    timestamp: '2024-03-14 11:45',
    acknowledged: false
  },
  {
    id: 2,
    binId: 'BIN-004',
    type: 'critical',
    message: 'High odor detected (8.9 VOC level)',
    timestamp: '2024-03-14 11:30',
    acknowledged: false
  },
  {
    id: 3,
    binId: 'BIN-003',
    type: 'warning',
    message: 'Fill level approaching threshold (72%)',
    timestamp: '2024-03-14 10:15',
    acknowledged: true
  },
  {
    id: 4,
    binId: 'BIN-007',
    type: 'warning',
    message: 'Temperature above normal (28.9°C)',
    timestamp: '2024-03-14 09:45',
    acknowledged: true
  },
  {
    id: 5,
    binId: 'BIN-011',
    type: 'warning',
    message: 'Odor level increasing (7.5 VOC)',
    timestamp: '2024-03-14 09:00',
    acknowledged: false
  }
];

export const wasteTrendData = [
  { date: '2024-03-08', weight: 28.5 },
  { date: '2024-03-09', weight: 31.2 },
  { date: '2024-03-10', weight: 29.8 },
  { date: '2024-03-11', weight: 35.6 },
  { date: '2024-03-12', weight: 33.4 },
  { date: '2024-03-13', weight: 37.1 },
  { date: '2024-03-14', weight: 32.0 }
];

export const fillDistributionData = [
  { status: 'Normal', count: 7, percentage: 58 },
  { status: 'Warning', count: 3, percentage: 25 },
  { status: 'Critical', count: 2, percentage: 17 }
];

export const environmentalData = [
  { time: '06:00', temperature: 25.2, humidity: 72 },
  { time: '08:00', temperature: 26.8, humidity: 68 },
  { time: '10:00', temperature: 28.5, humidity: 65 },
  { time: '12:00', temperature: 29.8, humidity: 62 },
  { time: '14:00', temperature: 30.2, humidity: 60 },
  { time: '16:00', temperature: 28.9, humidity: 64 },
  { time: '18:00', temperature: 27.1, humidity: 67 },
  { time: '20:00', temperature: 26.3, humidity: 70 }
];
