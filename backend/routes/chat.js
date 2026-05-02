const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const ChatMessage = require('../models/ChatMessage');
const BinRegistration = require('../models/BinRegistration');
const { predictFillLevel } = require('../services/fillLevelPrediction');
const { buildConditionAlerts, normalizeBinRecord } = require('../utils/binHelpers');
const { getSensorCollection } = require('../utils/sensorCollection');

const router = express.Router();

const LLM_PROVIDER = (process.env.LLM_PROVIDER || 'ollama').toLowerCase();
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
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

  if (
    msg.includes('what can you do') ||
    msg.includes('things you can help') ||
    msg.includes('help me with') ||
    msg.includes('what kind of things') ||
    msg.includes('capabilities')
  ) return 'capabilities';
  if (
    (msg.includes('predict') ||
      msg.includes('forecast') ||
      msg.includes('tomorrow') ||
      msg.includes('today') ||
      msg.includes('next') ||
      msg.includes('would be')) &&
    msg.includes('fill')
  ) return 'fill_prediction';
  if (msg.includes('status') || msg.includes('summary') || msg.includes('health')) return 'system_status';
  if (msg.includes('highest fill')) return 'highest_fill';
  if (msg.includes('lowest fill')) return 'lowest_fill';
  if (msg.includes('average fill')) return 'average_fill';
  if ((msg.includes('high') || msg.includes('full')) && msg.includes('bin') && msg.includes('location')) return 'high_fill_locations';
  if (msg.includes('compare') || msg.includes('comparison')) return 'comparison';
  if (msg.includes('factor') || msg.includes('influence') || msg.includes('affect')) return 'decision_factors';
  if (msg.includes('weight')) return 'weight_summary';
  if (msg.includes('alert') || msg.includes('gas') || msg.includes('fall')) return 'alert_summary';
  if (msg.includes('need collection') || msg.includes('over 80') || msg.includes('full')) return 'collection_needed';
  if (msg.includes('problem') || msg.includes('issue') || msg.includes('anomal')) return 'problem_detection';
  if (msg.includes('recommend') || msg.includes('priority') || msg.includes('optimize')) return 'decision_support';
  if (msg.includes('trend') || msg.includes('pattern')) return 'trend_analysis';
  if (msg.includes('dashboard') || msg.includes('guide') || msg.includes('metric') || msg.includes('where')) return 'dashboard_help';

  return 'unknown';
};

const extractDeviceId = (message) => message.match(/esp32_\d+/i)?.[0] || null;

const isCollectionPlanningQuery = (message = '') => {
  const msg = message.toLowerCase();
  return (
    (msg.includes('collect') || msg.includes('collection') || msg.includes('pickup') || msg.includes('pick up'))
    && (msg.includes('which') || msg.includes('should') || msg.includes('need') || msg.includes('tomorrow') || msg.includes('priority'))
  );
};

const parseTargetTimestamp = (message) => {
  const lowerMessage = message.toLowerCase();
  const messageWithoutDeviceIds = lowerMessage.replace(/esp32_\d+/g, '');
  const target = new Date();

  if (lowerMessage.includes('tomorrow')) {
    target.setDate(target.getDate() + 1);
  }

  const timeMatch = messageWithoutDeviceIds.match(/(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/);
  if (timeMatch) {
    let hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2] || 0);
    const period = timeMatch[3];

    if (period === 'pm' && hour < 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      target.setHours(hour, minute, 0, 0);
    }
  } else if (!lowerMessage.includes('tomorrow') && !lowerMessage.includes('next')) {
    return null;
  }

  if (lowerMessage.includes('next hour')) {
    target.setHours(target.getHours() + 1, 0, 0, 0);
  }

  return target;
};

const getLagFeatures = (fillHistory) => {
  const values = fillHistory.filter(Number.isFinite);
  const current = values.at(-1) ?? 50;
  const lag1 = values.at(-2) ?? current;
  const lag2 = values.at(-3) ?? lag1;
  const lag3 = values.at(-4) ?? lag2;

  return {
    fill_level: current,
    lag_1: lag1,
    lag_2: lag2,
    lag_3: lag3,
    rolling_mean_3: (lag1 + lag2 + lag3) / 3,
    fill_diff: current - lag1
  };
};

const formatTargetTime = (timestamp) =>
  timestamp.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

const getFillStatus = (fillPercentage) => {
  if (fillPercentage >= 80) return 'HIGH';
  if (fillPercentage >= 40) return 'MEDIUM';
  return 'LOW';
};

const getCollectionPriority = (predictedFill) => {
  if (predictedFill >= 90) return 'Collect immediately';
  if (predictedFill >= 80) return 'High priority';
  if (predictedFill >= 70) return 'Schedule soon';
  return 'Monitor';
};

const getTrendDirection = (values = []) => {
  const cleanValues = values.filter(Number.isFinite);
  if (cleanValues.length < 2) return { direction: 'not enough history', delta: 0 };

  const first = cleanValues[0];
  const last = cleanValues[cleanValues.length - 1];
  const delta = last - first;

  if (Math.abs(delta) < 5) return { direction: 'stable', delta };
  return { direction: delta > 0 ? 'increasing' : 'decreasing', delta };
};

const buildTrendSummary = (data) => data.readings.map((reading) => {
  const history = data.fillHistoryByDevice[reading.device_id] || [reading.fill_percentage];
  const trend = getTrendDirection(history);

  return {
    device_id: reading.device_id,
    fill_percentage: reading.fill_percentage,
    fill_status: reading.fill_status,
    direction: trend.direction,
    delta: Math.round(trend.delta)
  };
});

const buildAnomalySummary = (readings) => readings.filter((reading) =>
  reading.fill_percentage >= 80 ||
  reading.gas_alert ||
  reading.fall_detected ||
  reading.fill_percentage <= 5
);

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
  const registrations = await BinRegistration.find().sort({ device_id: 1 }).lean();
  const registrationsByDevice = new Map(
    registrations.map((registration) => [registration.device_id, registration])
  );
  const readingsWithLocations = readings.map((reading) => {
    const registration = registrationsByDevice.get(reading.device_id);
    return {
      ...reading,
      location: registration?.location?.address || reading.location || '',
      latitude: registration?.latitude ?? registration?.location?.latitude ?? null,
      longitude: registration?.longitude ?? registration?.location?.longitude ?? null
    };
  });
  const historyEntries = await Promise.all(
    readingsWithLocations.map(async (reading) => {
      const history = await collection
        .find({ device_id: reading.device_id })
        .sort({ received_at: -1, _id: -1 })
        .limit(4)
        .toArray();

      return [
        reading.device_id,
        history
          .map(normalizeBinRecord)
          .reverse()
          .map((record) => record.fill_percentage)
      ];
    })
  );

  const alerts = readingsWithLocations.flatMap(buildConditionAlerts);
  const fillValues = readingsWithLocations.map((reading) => Number(reading.fill_percentage) || 0);
  const weightValues = readings
    .map((reading) => Number(reading.bin_weight))
    .filter(Number.isFinite);

  return {
    readings: readingsWithLocations,
    registrations,
    fillHistoryByDevice: Object.fromEntries(historyEntries),
    alerts,
    metrics: {
      totalReadings: readingsWithLocations.length,
      averageFill: readingsWithLocations.length
        ? round(fillValues.reduce((sum, value) => sum + value, 0) / readingsWithLocations.length)
        : 0,
      maxFill: readingsWithLocations.length ? Math.max(...fillValues) : 0,
      minFill: readingsWithLocations.length ? Math.min(...fillValues) : 0,
      averageWeight: weightValues.length
        ? round(weightValues.reduce((sum, value) => sum + value, 0) / weightValues.length)
        : 0,
      gasAlerts: readingsWithLocations.filter((reading) => reading.gas_alert).length,
      fallDetected: readingsWithLocations.filter((reading) => reading.fall_detected).length
    }
  };
};

const formatReadingLine = (reading) =>
  `${reading.device_id}: location ${reading.location || 'missing'}, fill ${reading.fill_percentage}%, fill_status ${reading.fill_status || 'missing'}, gas ${reading.gas ?? 'missing'}, bin_weight ${reading.bin_weight ?? 'missing'}`;

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

const buildVisualAnalyticsPrompt = (message, systemData) => {
  const trendSummary = buildTrendSummary(systemData);
  const anomalies = buildAnomalySummary(systemData.readings);

  return `You are the Smart Waste Management visual analytics assistant.

Your role:
- Answer natural-language questions about the MongoDB sensor dataset.
- Guide users through dashboard pages and filters.
- Explain trends, comparisons, and anomalies visible in the dashboard charts.
- Support decision questions by explaining which data factors matter and what action to take.

Rules:
- Be conversational and concise.
- Never return raw JSON.
- Return only information relevant to the user's question.
- Use the provided dataset context only. Do not invent bins, locations, values, predictions, or routes.
- If the user asks for a prediction, explain that exact predictions are handled by the ML prediction tool when a device and time are provided.
- For dashboard guidance, mention the relevant page: Dashboard, Database Readings, Map View, Analytics, Alerts, Reports, or Chat.
- For decisions, prioritize fill percentage, fill status, gas alert, fall detection, bin weight, recent fill trend, and location.

Dashboard capabilities:
- Dashboard: top cards and filtered Database Readings table.
- Database Readings: registered bins, sensor readings, weight, fill status, gas, received time.
- Map View: bin locations colored by fill level; marker popup shows location, device ID, fill, gas, weight.
- Analytics: historical and predicted fill-level charts, weight/gas chart, current device comparison.
- Alerts: critical/warning/unacknowledged alerts with clickable summary filters.
- Reports: dataset summaries and exportable reporting.

Current metrics:
- Total bins/readings: ${systemData.metrics.totalReadings}
- Average fill: ${systemData.metrics.averageFill}%
- Highest fill: ${systemData.metrics.maxFill}%
- Lowest fill: ${systemData.metrics.minFill}%
- Average weight: ${systemData.metrics.averageWeight} kg
- Gas alerts: ${systemData.metrics.gasAlerts}
- Fall detections: ${systemData.metrics.fallDetected}

Current readings:
${systemData.readings.length ? systemData.readings.map(formatReadingLine).join('\n') : 'None'}

Recent fill trends:
${trendSummary.length ? trendSummary.map((trend) => `${trend.device_id}: ${trend.direction}, delta ${trend.delta}%, current ${trend.fill_percentage}% (${trend.fill_status})`).join('\n') : 'None'}

Anomalies and important conditions:
${anomalies.length ? anomalies.map((reading) => `${reading.device_id}: fill ${reading.fill_percentage}%, gas_alert ${reading.gas_alert}, fall_detected ${reading.fall_detected}`).join('\n') : 'None'}

Condition alerts:
${systemData.alerts.length ? systemData.alerts.map((alert) => `${alert.device_id}: ${alert.alertType} - ${alert.message}`).join('\n') : 'None'}

User question:
${message}

Assistant answer:`;
};

const buildDeterministicAnswer = async (intent, data, message) => {
  const { readings, alerts, metrics } = data;

  if (!readings.length) return 'No sensor readings are available in the database.';

  switch (intent) {
    case 'capabilities':
      return [
        'I can help you with:',
        '- Answer dataset questions about fill level, gas, weight, fall detection, alerts, and locations.',
        '- Predict a bin fill level for a selected device and time using the ML model.',
        '- Compare bins by fill level, status, gas, weight, or collection priority.',
        '- Explain recent trends in the Analytics charts.',
        '- Identify anomalies such as high fill, gas alerts, falls, or unusual readings.',
        '- Guide you through Dashboard, Database Readings, Map View, Analytics, Alerts, and Reports.',
        '- Recommend which bins need attention first based on fill level, gas alerts, falls, and recent trend.'
      ].join('\n');

    case 'fill_prediction': {
      const deviceId = extractDeviceId(message);
      const targetTimestamp = parseTargetTimestamp(message);
      const collectionPlanning = isCollectionPlanningQuery(message);

      if (!deviceId && collectionPlanning) {
        const planningTimestamp = targetTimestamp || (() => {
          const tomorrowMorning = new Date();
          tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
          tomorrowMorning.setHours(9, 0, 0, 0);
          return tomorrowMorning;
        })();

        const predictedBins = await Promise.all(
          readings.map(async (reading) => {
            try {
              const prediction = await predictFillLevel({
                device_id: reading.device_id,
                timestamp: planningTimestamp.toISOString(),
                ...getLagFeatures(data.fillHistoryByDevice[reading.device_id] || [reading.fill_percentage])
              }, reading);

              const predictedFill = Number(prediction.predictedFillPercentage) || 0;
              return {
                device_id: reading.device_id,
                location: reading.location || 'location not registered',
                predictedFill,
                priority: getCollectionPriority(predictedFill)
              };
            } catch {
              return null;
            }
          })
        );

        const actionableBins = predictedBins
          .filter(Boolean)
          .sort((first, second) => second.predictedFill - first.predictedFill)
          .filter((bin) => bin.predictedFill >= 70);

        if (!actionableBins.length) {
          return `No bins are predicted to require collection by ${formatTargetTime(planningTimestamp)}.`;
        }

        return [
          `Bins to collect by ${formatTargetTime(planningTimestamp)} (predicted):`,
          ...actionableBins.map((bin) =>
            `- ${bin.device_id}: ${bin.location} - ${Math.round(bin.predictedFill)}% (${bin.priority})`
          )
        ].join('\n');
      }

      if (!deviceId) return 'Please include the device ID, for example esp32_08, or ask "which bins should I collect tomorrow?".';

      const reading = readings.find((item) => item.device_id.toLowerCase() === deviceId.toLowerCase());
      if (!reading) return `No current reading found for ${deviceId}.`;

      if (!targetTimestamp) return `Please include the prediction time for ${reading.device_id}.`;

      let prediction;

      try {
        prediction = await predictFillLevel({
          device_id: reading.device_id,
          timestamp: targetTimestamp.toISOString(),
          ...getLagFeatures(data.fillHistoryByDevice[reading.device_id] || [reading.fill_percentage])
        }, reading);
      } catch (error) {
        return `Prediction unavailable for ${reading.device_id}: ${error.message}`;
      }

      const predictedFill = prediction.predictedFillPercentage;
      const fillStatus = getFillStatus(predictedFill);

      return `${reading.device_id} is predicted to be ${predictedFill}% full at ${formatTargetTime(targetTimestamp)}. Fill status: ${fillStatus}. Recommended action: ${prediction.recommendedAction}.`;
    }

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

    case 'high_fill_locations': {
      const highBins = readings.filter((reading) => reading.fill_status === 'HIGH');
      if (!highBins.length) return 'High filled bins: 0';

      return [
        `High filled bins: ${highBins.length}`,
        ...highBins.map((reading) => {
          const location = reading.location || 'location not registered';
          return `- ${reading.device_id}: ${location} (${reading.fill_percentage}%)`;
        })
      ].join('\n');
    }

    case 'weight_summary':
      return [
        `Average bin weight is ${metrics.averageWeight} kg.`,
        ...readings.map((reading) => `- ${reading.device_id}: ${reading.bin_weight ?? 'missing'} kg`)
      ].join('\n');

    case 'comparison': {
      const sorted = [...readings].sort((first, second) => second.fill_percentage - first.fill_percentage);
      return [
        'Fill level comparison:',
        ...sorted.map((reading) => `- ${reading.device_id}: ${reading.fill_percentage}% (${reading.fill_status})`)
      ].join('\n');
    }

    case 'decision_factors':
      return [
        'Main factors used for fill prediction:',
        '- Current fill level',
        '- Recent fill history: lag_1, lag_2, lag_3',
        '- Rolling mean of the last 3 readings',
        '- Fill difference from the previous reading',
        '- Time features: hour, day of week, day of month, month',
        '- Bin/device ID'
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
      const issues = buildAnomalySummary(readings);
      if (!issues.length) return 'No major issues detected.';
      return [
        'Detected anomalies and issues:',
        ...issues.map(
          (reading) =>
            `- ${reading.device_id}: fill ${reading.fill_percentage}% (${reading.fill_status}), gas alert ${reading.gas_alert}, fall detected ${reading.fall_detected}`
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

    case 'trend_analysis': {
      const trends = buildTrendSummary(data);
      return [
        'Recent fill-level trends:',
        ...trends.map((trend) =>
          `- ${trend.device_id}: ${trend.direction}, changed by ${trend.delta}% recently, now ${trend.fill_percentage}% (${trend.fill_status})`
        )
      ].join('\n');
    }

    case 'dashboard_help':
      return [
        'Use these dashboard areas:',
        '- Dashboard: quick cards and filtered Database Readings.',
        '- Analytics: historical and predicted fill charts, weight/gas trends, and comparisons.',
        '- Map View: bin locations colored by fill level; click a marker for location, ID, fill, gas, and weight.',
        '- Alerts: critical, warning, and unacknowledged alert filters.',
        '- Reports: summaries and exportable data.'
      ].join('\n');

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

const askOllama = async (prompt) => {
  const response = await axios.post(
    `${OLLAMA_BASE_URL}/api/generate`,
    {
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0,
        top_p: 0.1,
        num_predict: 300
      }
    },
    {
      timeout: 120000
    }
  );

  return String(response.data?.response || '').trim();
};

const askLlm = async (prompt) => {
  if (LLM_PROVIDER === 'gemini') {
    return askGemini(prompt);
  }

  return askOllama(prompt);
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
    let aiResponse = await buildDeterministicAnswer(intent, systemData, message);

    if (!aiResponse) {
      mode = LLM_PROVIDER;
      const prompt = buildVisualAnalyticsPrompt(message, systemData);

      try {
        aiResponse = await askLlm(prompt);
      } catch (error) {
        console.warn(`${LLM_PROVIDER} unavailable:`, error.message);
        aiResponse = 'I can answer from the database, but please ask for a specific dashboard field such as fill level, location, gas, fall status, weight, prediction, comparison, or collection priority.';
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
