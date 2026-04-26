const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const ChatMessage = require('../models/ChatMessage');
const { buildConditionAlerts, normalizeBinRecord } = require('../utils/binHelpers');
const { getSensorCollection } = require('../utils/sensorCollection');

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_BASE_URL =
  process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';

const DEMO_USER_ID = new mongoose.Types.ObjectId('000000000000000000000001');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token || token === 'null' || token === 'undefined') {
    req.userId = process.env.DEMO_USER_ID || DEMO_USER_ID;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const round = (value) => (Number.isFinite(value) ? Math.round(value) : 0);

const detectIntent = (message) => {
  const msg = message.toLowerCase();

  if (msg.includes('status') || msg.includes('summary') || msg.includes('health')) return 'system_status';
  if (msg.includes('highest fill')) return 'highest_fill';
  if (msg.includes('lowest fill')) return 'lowest_fill';
  if (msg.includes('average fill')) return 'average_fill';
  if (msg.includes('weight')) return 'weight_summary';
  if (msg.includes('alert') || msg.includes('gas') || msg.includes('fall')) return 'alert_summary';
  if (msg.includes('need collection') || msg.includes('over 80') || msg.includes('full')) return 'collection_needed';
  if (msg.includes('problem') || msg.includes('issue') || msg.includes('anomal')) return 'problem_detection';
  if (msg.includes('recommend') || msg.includes('priority') || msg.includes('optimize')) return 'decision_support';
  if (msg.includes('trend') || msg.includes('pattern')) return 'trend_analysis';
  if (msg.includes('dashboard') || msg.includes('guide') || msg.includes('metric')) return 'dashboard_help';

  return 'unknown';
};

const getSystemData = async () => {
  const collection = await getSensorCollection(mongoose.connection);
  const readings = (
    await collection
      .aggregate([
        { $match: { device_id: { $exists: true, $nin: [null, ''] } } },
        { $sort: { received_at: -1, _id: -1 } },
        { $group: { _id: '$device_id', latest: { $first: '$$ROOT' } } },
        { $replaceRoot: { newRoot: '$latest' } },
        { $sort: { device_id: 1 } }
      ])
      .toArray()
  ).map(normalizeBinRecord);

  const alerts = readings.flatMap(buildConditionAlerts);
  const fillValues = readings.map((reading) => Number(reading.fill_percentage) || 0);
  const weightValues = readings
    .map((reading) => Number(reading.bin_weight))
    .filter(Number.isFinite);

  return {
    readings,
    alerts,
    metrics: {
      totalReadings: readings.length,
      averageFill: readings.length
        ? round(fillValues.reduce((sum, value) => sum + value, 0) / readings.length)
        : 0,
      maxFill: readings.length ? Math.max(...fillValues) : 0,
      minFill: readings.length ? Math.min(...fillValues) : 0,
      averageWeight: weightValues.length
        ? round(weightValues.reduce((sum, value) => sum + value, 0) / weightValues.length)
        : 0,
      gasAlerts: readings.filter((reading) => reading.gas_alert).length,
      fallDetected: readings.filter((reading) => reading.fall_detected).length
    }
  };
};

const formatReadingLine = (reading) =>
  `${reading.device_id}: distance ${reading.distance ?? 'missing'}, bin_weight ${reading.bin_weight ?? 'missing'}, fill ${reading.fill_percentage}%, fill_status ${reading.fill_status || 'missing'}, gas ${reading.gas ?? 'missing'}, gas_alert ${reading.gas_alert}, fall_detected ${reading.fall_detected}, topic ${reading.topic || 'missing'}, timestamp ${reading.timestamp || 'missing'}, received_at ${reading.received_at || 'missing'}`;

const buildDataContext = ({ readings, alerts, metrics }) => [
  'CURRENT DATABASE SNAPSHOT',
  `Total readings: ${metrics.totalReadings}`,
  `Average fill_percentage: ${metrics.averageFill}%`,
  `Highest fill_percentage: ${metrics.maxFill}%`,
  `Lowest fill_percentage: ${metrics.minFill}%`,
  `Average bin_weight: ${metrics.averageWeight} kg`,
  `Gas alert count: ${metrics.gasAlerts}`,
  `Fall detected count: ${metrics.fallDetected}`,
  '',
  'READINGS',
  ...(readings.length ? readings.map(formatReadingLine) : ['None']),
  '',
  'CONDITION ALERTS',
  ...(alerts.length
    ? alerts.map((alert) => `${alert.device_id}: ${alert.alertType} - ${alert.message}`)
    : ['None'])
].join('\n');

const buildDeterministicAnswer = (intent, data) => {
  const { readings, alerts, metrics } = data;

  if (!readings.length) return 'No sensor readings are available in the database.';

  switch (intent) {
    case 'system_status':
      return [
        'System Summary:',
        `- Total bins: ${metrics.totalReadings}`,
        `- Average fill: ${metrics.averageFill}%`,
        `- Highest fill: ${metrics.maxFill}%`,
        `- Lowest fill: ${metrics.minFill}%`,
        `- Average weight: ${metrics.averageWeight} kg`,
        `- Gas alerts: ${metrics.gasAlerts}`,
        `- Fall detections: ${metrics.fallDetected}`
      ].join('\n');

    case 'highest_fill': {
      const highest = readings.reduce((first, second) =>
        second.fill_percentage > first.fill_percentage ? second : first
      );
      return `Highest fill level: ${highest.device_id} at ${highest.fill_percentage}% (${highest.fill_status}).`;
    }

    case 'lowest_fill': {
      const lowest = readings.reduce((first, second) =>
        second.fill_percentage < first.fill_percentage ? second : first
      );
      return `Lowest fill level: ${lowest.device_id} at ${lowest.fill_percentage}% (${lowest.fill_status}).`;
    }

    case 'average_fill':
      return `Average fill percentage across bins is ${metrics.averageFill}%.`;

    case 'weight_summary':
      return [
        `Average bin weight is ${metrics.averageWeight} kg.`,
        ...readings.map((reading) => `- ${reading.device_id}: ${reading.bin_weight ?? 'missing'} kg`)
      ].join('\n');

    case 'alert_summary':
      return [
        `I found ${alerts.length} condition-based alert(s) from the database fields.`,
        ...alerts.map((alert) => `- ${alert.device_id}: ${alert.alertType} - ${alert.message}`),
        `Gas alerts: ${metrics.gasAlerts}`,
        `Fall detected: ${metrics.fallDetected}`
      ].join('\n');

    case 'collection_needed': {
      const collectionBins = readings.filter((reading) => reading.fill_percentage >= 80);
      if (!collectionBins.length) return 'No bins currently require immediate collection.';
      return [
        'Bins requiring collection:',
        ...collectionBins.map((reading) => `- ${reading.device_id}: ${reading.fill_percentage}%`)
      ].join('\n');
    }

    case 'problem_detection': {
      const issues = readings.filter(
        (reading) => reading.fill_percentage >= 80 || reading.gas_alert || reading.fall_detected
      );
      if (!issues.length) return 'No major issues detected.';
      return [
        'Detected issues:',
        ...issues.map(
          (reading) =>
            `- ${reading.device_id}: fill=${reading.fill_percentage}%, gas_alert=${reading.gas_alert}, fall=${reading.fall_detected}`
        )
      ].join('\n');
    }

    case 'decision_support': {
      const sorted = readings
        .map((reading) => ({
          ...reading,
          score:
            reading.fill_percentage * 0.7 +
            (reading.gas_alert ? 20 : 0) +
            (reading.fall_detected ? 30 : 0)
        }))
        .sort((first, second) => second.score - first.score);

      return [
        'Collection Priority Ranking:',
        ...sorted.map((reading) => `- ${reading.device_id}: Priority Score ${Math.round(reading.score)}`)
      ].join('\n');
    }

    case 'trend_analysis':
      return 'Trend analysis requires historical time-series comparison data, which is not included in the current snapshot.';

    case 'dashboard_help':
      return 'The dashboard metrics come from MongoDB sensor fields: fill percentage/status, gas/gas_alert, fall_detected, bin_weight, distance, timestamp, and received_at.';

    default:
      return null;
  }
};

const askGemini = async (prompt) => {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key missing');

  const response = await axios.post(
    `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent`,
    {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        topP: 0.1,
        maxOutputTokens: 300
      }
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      }
    }
  );

  return response.data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .join('\n')
    .trim();
};

router.post('/message', auth, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const activeSessionId = sessionId || 'default';

    if (!message) return res.status(400).json({ message: 'Message is required' });

    await ChatMessage.create({
      userId: req.userId,
      sessionId: activeSessionId,
      message,
      role: 'user'
    });

    const systemData = await getSystemData();
    const intent = detectIntent(message);
    let mode = 'deterministic';
    let aiResponse = buildDeterministicAnswer(intent, systemData);

    if (!aiResponse) {
      mode = 'gemini';
      const prompt = `You are a Smart Waste Management database assistant.
Answer using only the MongoDB fields shown below.
Do not mention locations, height, temperature, humidity, collection routes, sensor uptime, or ML predictions unless those fields are shown in the database snapshot.
If the user asks for missing data, say that the database does not contain that field.

${buildDataContext(systemData)}

User question: ${message}
Assistant answer:`;

      try {
        aiResponse = await askGemini(prompt);
      } catch (error) {
        console.warn('Gemini unavailable:', error.message);
        aiResponse = [
          `I checked the database. There are ${systemData.metrics.totalReadings} reading(s).`,
          ...systemData.readings.map((reading) => `- ${formatReadingLine(reading)}`)
        ].join('\n');
        mode = 'fallback_database';
      }
    }

    if (!aiResponse) {
      aiResponse = 'I checked the database, but I could not produce an answer for that question.';
      mode = 'fallback_empty';
    }

    await ChatMessage.create({
      userId: req.userId,
      sessionId: activeSessionId,
      message: aiResponse,
      role: 'assistant',
      metadata: {
        mode,
        usedDatabase: true,
        metrics: systemData.metrics,
        alertsCount: systemData.alerts.length
      }
    });

    res.json({
      message: aiResponse,
      sessionId: activeSessionId,
      metadata: {
        mode,
        usedDatabase: true,
        metrics: systemData.metrics,
        alertsCount: systemData.alerts.length
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Error processing chat message' });
  }
});

router.get('/history/:sessionId?', auth, async (req, res) => {
  try {
    const sessionId = req.params.sessionId || 'default';

    const messages = await ChatMessage.find({
      userId: req.userId,
      sessionId
    })
      .sort({ timestamp: 1 })
      .select('message role timestamp');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/sessions', auth, async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.userId);

    const sessions = await ChatMessage.aggregate([
      { $match: { userId: userObjectId } },
      { $sort: { timestamp: 1 } },
      {
        $group: {
          _id: '$sessionId',
          lastMessage: { $last: '$timestamp' },
          messageCount: { $sum: 1 }
        }
      },
      { $sort: { lastMessage: -1 } }
    ]);

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
