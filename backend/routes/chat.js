const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const ChatMessage = require('../models/ChatMessage');
const { buildConditionAlerts, normalizeBinRecord } = require('../utils/binHelpers');
const { getSensorCollection } = require('../utils/sensorCollection');

const router = express.Router();

/* ===============================
   CONFIG
================================ */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_BASE_URL =
  process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';

const DEMO_USER_ID = new mongoose.Types.ObjectId('000000000000000000000001');

/* ===============================
   AUTH
================================ */

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

/* ===============================
   UTILITIES
================================ */

const round = (val) => (Number.isFinite(val) ? Math.round(val) : 0);

const detectIntent = (message) => {
  const msg = message.toLowerCase();

  if (msg.includes('status') || msg.includes('summary') || msg.includes('health'))
    return 'system_status';

  if (msg.includes('highest fill')) return 'highest_fill';
  if (msg.includes('lowest fill')) return 'lowest_fill';
  if (msg.includes('average fill')) return 'average_fill';

  if (msg.includes('need collection') || msg.includes('over 80') || msg.includes('full'))
    return 'collection_needed';

  if (msg.includes('problem') || msg.includes('issue') || msg.includes('anomal'))
    return 'problem_detection';

  if (msg.includes('recommend') || msg.includes('priority') || msg.includes('optimize'))
    return 'decision_support';

  if (msg.includes('trend') || msg.includes('pattern'))
    return 'trend_analysis';

  if (msg.includes('dashboard') || msg.includes('guide') || msg.includes('metric'))
    return 'dashboard_help';

  return 'unknown';
};

/* ===============================
   DATABASE SNAPSHOT
================================ */

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

  const fillValues = readings.map((r) => Number(r.fill_percentage) || 0);

  return {
    readings,
    metrics: {
      totalReadings: readings.length,
      averageFill: readings.length
        ? round(fillValues.reduce((a, b) => a + b, 0) / readings.length)
        : 0,
      maxFill: readings.length ? Math.max(...fillValues) : 0,
      minFill: readings.length ? Math.min(...fillValues) : 0,
      gasAlerts: readings.filter((r) => r.gas_alert).length,
      fallDetected: readings.filter((r) => r.fall_detected).length
    }
  };
};

/* ===============================
   DETERMINISTIC LOGIC
================================ */

const buildDeterministicAnswer = (intent, data) => {
  const { readings, metrics } = data;

  if (!readings.length)
    return 'No sensor readings are available in the database.';

  switch (intent) {
    case 'system_status':
      return `
System Summary:
- Total bins: ${metrics.totalReadings}
- Average fill: ${metrics.averageFill}%
- Highest fill: ${metrics.maxFill}%
- Lowest fill: ${metrics.minFill}%
- Gas alerts: ${metrics.gasAlerts}
- Fall detections: ${metrics.fallDetected}
`;

    case 'highest_fill': {
      const highest = readings.reduce((a, b) =>
        b.fill_percentage > a.fill_percentage ? b : a
      );
      return `Highest fill level: ${highest.device_id} at ${highest.fill_percentage}% (${highest.fill_status}).`;
    }

    case 'lowest_fill': {
      const lowest = readings.reduce((a, b) =>
        b.fill_percentage < a.fill_percentage ? b : a
      );
      return `Lowest fill level: ${lowest.device_id} at ${lowest.fill_percentage}% (${lowest.fill_status}).`;
    }

    case 'average_fill':
      return `Average fill percentage across bins is ${metrics.averageFill}%.`;

    case 'collection_needed': {
      const bins = readings.filter((r) => r.fill_percentage >= 80);
      if (!bins.length)
        return 'No bins currently require immediate collection.';
      return [
        'Bins requiring collection:',
        ...bins.map((r) => `- ${r.device_id}: ${r.fill_percentage}%`)
      ].join('\n');
    }

    case 'problem_detection': {
      const issues = readings.filter(
        (r) =>
          r.fill_percentage >= 80 ||
          r.gas_alert ||
          r.fall_detected
      );
      if (!issues.length)
        return 'No major issues detected.';
      return [
        'Detected issues:',
        ...issues.map(
          (r) =>
            `- ${r.device_id}: fill=${r.fill_percentage}%, gas_alert=${r.gas_alert}, fall=${r.fall_detected}`
        )
      ].join('\n');
    }

    case 'decision_support': {
      const scored = readings.map((r) => ({
        ...r,
        score:
          r.fill_percentage * 0.7 +
          (r.gas_alert ? 20 : 0) +
          (r.fall_detected ? 30 : 0)
      }));

      const sorted = scored.sort((a, b) => b.score - a.score);

      return [
        'Collection Priority Ranking:',
        ...sorted.map(
          (r) =>
            `- ${r.device_id}: Priority Score ${Math.round(r.score)}`
        )
      ].join('\n');
    }

    case 'trend_analysis':
      return 'Trend analysis requires historical time-series comparison data, which is not included in the current snapshot.';

    default:
      return null;
  }
};

/* ===============================
   GEMINI CALL (Controlled)
================================ */

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
    ?.map((p) => p.text)
    .join('\n')
    .trim();
};

/* ===============================
   MAIN MESSAGE ROUTE
================================ */

router.post('/message', auth, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const activeSessionId = sessionId || 'default';

    if (!message)
      return res.status(400).json({ message: 'Message is required' });

    await ChatMessage.create({
      userId: req.userId,
      sessionId: activeSessionId,
      message,
      role: 'user'
    });

    const systemData = await getSystemData();
    const intent = detectIntent(message);

    let aiResponse = buildDeterministicAnswer(intent, systemData);
    let mode = 'deterministic';

    if (!aiResponse) {
      mode = 'gemini';

      const prompt = `
You are a Smart Waste Management assistant.

Use ONLY these system metrics:
- Total bins: ${systemData.metrics.totalReadings}
- Average fill: ${systemData.metrics.averageFill}%
- Highest fill: ${systemData.metrics.maxFill}%
- Lowest fill: ${systemData.metrics.minFill}%
- Gas alerts: ${systemData.metrics.gasAlerts}
- Fall detections: ${systemData.metrics.fallDetected}

User question:
${message}

Answer briefly and factually.
`;

      try {
        aiResponse = await askGemini(prompt);
      } catch {
        aiResponse = 'AI service unavailable. Please try again later.';
        mode = 'fallback_error';
      }
    }

    await ChatMessage.create({
      userId: req.userId,
      sessionId: activeSessionId,
      message: aiResponse,
      role: 'assistant',
      metadata: { mode }
    });

    res.json({
      message: aiResponse,
      sessionId: activeSessionId,
      metadata: { mode }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Error processing chat message' });
  }
});

/* ===============================
   HISTORY
================================ */

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