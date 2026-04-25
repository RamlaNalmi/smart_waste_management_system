const SENSOR_QUERY = {
  device_id: { $exists: true, $nin: [null, ''] },
  fill_percentage: { $exists: true }
};

// Alternate query for legacy `bins` collection schema
const BINS_QUERY = {
  binId: { $exists: true, $nin: [null, ''] },
  fillLevel: { $exists: true }
};

const getSensorCollection = async (mongooseConnection) => {
  const db = mongooseConnection.db;

  if (process.env.SENSOR_COLLECTION) {
    return db.collection(process.env.SENSOR_COLLECTION);
  }

  const collections = await db.listCollections().toArray();

  for (const collectionInfo of collections) {
    const collection = db.collection(collectionInfo.name);

    // Count documents matching either the expected sensor_data schema
    // or the legacy bins schema and pick the first collection that has matches.
    const sensorCount = await collection.countDocuments(SENSOR_QUERY);
    const binsCount = await collection.countDocuments(BINS_QUERY);

    if (sensorCount > 0 || binsCount > 0) {
      return collection;
    }
  }

  // Fallback: prefer explicit 'bins' collection if present
  return db.collection('bins');
};

const getSensorCollectionDebug = async (mongooseConnection) => {
  const db = mongooseConnection.db;
  const collections = await db.listCollections().toArray();
  const configuredCollection = process.env.SENSOR_COLLECTION || null;

  const summaries = [];

  for (const collectionInfo of collections) {
    const collection = db.collection(collectionInfo.name);
    const sensorCount = await collection.countDocuments(SENSOR_QUERY);
    const binsCount = await collection.countDocuments(BINS_QUERY);
    const totalCount = await collection.estimatedDocumentCount();
    const sample = await collection.findOne({});

    summaries.push({
      name: collectionInfo.name,
      totalCount,
      sensorCount,
      binsCount,
      sampleKeys: sample ? Object.keys(sample) : []
    });
  }

  return {
    databaseName: db.databaseName,
    configuredCollection,
    collections: summaries
  };
};

module.exports = {
  getSensorCollection,
  getSensorCollectionDebug,
  SENSOR_QUERY
};
