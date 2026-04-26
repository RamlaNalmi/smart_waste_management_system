const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const ChatMessage = require('../models/ChatMessage');
const { buildConditionAlerts, normalizeBinRecord } = require('../utils/binHelpers');
const { getSensorCollection } = require('../utils/sensorCollection');

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
const DEMO_USER_ID = new mongoose.Types.ObjectId('000000000000000000000001');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token || token === 'null' || token === 'undefined') {
    req.userId = process.env.DEMO_USER_ID || DEMO_USER_ID;
    return next();
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const round = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
};

const getSystemData = async () => {
  const collection = await getSensorCollection(mongoose.connection);
  const readings = (await collection.aggregate([
    {
      $match: {
        device_id: { $exists: true, $nin: [null, ''] }
      }
    },
    { $sort: { received_at: -1, _id: -1 } },
    {
      $group: {
        _id: '$device_id',
        latest: { $first: '$$ROOT' }
      }
    },
    { $replaceRoot: { newRoot: '$latest' } },
    { $sort: { device_id: 1 } }
  ]).toArray()).map(normalizeBinRecord);
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
      averageFill: readings.length ? round(fillValues.reduce((sum, value) => sum + value, 0) / readings.length) : 0,
      maxFill: readings.length ? Math.max(...fillValues) : 0,
      minFill: readings.length ? Math.min(...fillValues) : 0,
      averageWeight: weightValues.length ? round(weightValues.reduce((sum, value) => sum + value, 0) / weightValues.length) : 0,
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

const buildFallbackAnswer = (message, systemData) => {
  const { readings, alerts, metrics } = systemData;
  const lowerMessage = message.toLowerCase();

  if (metrics.totalReadings === 0) {
    return 'I checked the database, but there are no sensor readings saved.';
  }

  if (lowerMessage.includes('alert') || lowerMessage.includes('gas') || lowerMessage.includes('fall')) {
    return [
      `I found ${alerts.length} condition-based alert(s) from the database fields.`,
      ...alerts.map((alert) => `- ${alert.device_id}: ${alert.alertType} - ${alert.message}`),
      `Gas alerts: ${metrics.gasAlerts}`,
      `Fall detected: ${metrics.fallDetected}`
    ].join('\n');
  }

  if (lowerMessage.includes('fill')) {
    return [
      `Average fill_percentage is ${metrics.averageFill}%.`,
      `Highest fill_percentage is ${metrics.maxFill}%.`,
      `Lowest fill_percentage is ${metrics.minFill}%.`,
      ...readings.map((reading) => `- ${reading.device_id}: ${reading.fill_percentage}% (${reading.fill_status || 'missing fill_status'})`)
    ].join('\n');
  }

  if (lowerMessage.includes('weight')) {
    return [
      `Average bin_weight is ${metrics.averageWeight} kg.`,
      ...readings.map((reading) => `- ${reading.device_id}: ${reading.bin_weight ?? 'missing'} kg`)
    ].join('\n');
  }

  return [
    `I checked the database. There are ${metrics.totalReadings} reading(s).`,
    ...readings.map((reading) => `- ${formatReadingLine(reading)}`)
  ].join('\n');
};

const getGeminiText = (response) =>
  response.data.candidates
    ?.flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text)
    .filter(Boolean)
    .join('\n')
    .trim();

const askGemini = async (prompt) => {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const response = await axios.post(
    `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent`,
    {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        maxOutputTokens: 500
      }
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      timeout: 30000
    }
  );

  return getGeminiText(response);
};

router.post('/message', auth, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const activeSessionId = sessionId || 'default';

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    await ChatMessage.create({
      userId: req.userId,
      sessionId: activeSessionId,
      message,
      role: 'user'
    });

    const systemData = await getSystemData();
    const fallbackAnswer = buildFallbackAnswer(message, systemData);
    const dataContext = buildDataContext(systemData);

    let aiResponse = '';
    const metadata = {
      usedDatabase: true,
      metrics: systemData.metrics,
      alertsCount: systemData.alerts.length
    };

    const prompt = `You are a Smart Waste Management database assistant.
Answer using only the MongoDB fields shown below.
Do not mention locations, height, temperature, humidity, collection routes, sensor uptime, or ML predictions because those fields are not in the database snapshot.
If the user asks for missing data, say that the database does not contain that field.

${dataContext}

User question: ${message}
Assistant answer:`;

    try {
      aiResponse = await askGemini(prompt);
    } catch (error) {
      console.warn('Gemini unavailable, using database fallback answer:', error.message);
      aiResponse = fallbackAnswer;
      metadata.fallback = 'gemini_unavailable';
    }

    if (!aiResponse) {
      aiResponse = fallbackAnswer;
      metadata.fallback = 'empty_ai_response';
    }

    await ChatMessage.create({
      userId: req.userId,
      sessionId: activeSessionId,
      message: aiResponse,
      role: 'assistant',
      metadata
    });

    res.json({
      message: aiResponse,
      sessionId: activeSessionId,
      metadata
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
