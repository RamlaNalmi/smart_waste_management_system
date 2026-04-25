const express = require('express');
const axios = require('axios');
const ChatMessage = require('../models/ChatMessage');
const Bin = require('../models/Bin');

const router = express.Router();

// Ollama configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

// Middleware to verify token (reuse from auth)
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
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

// Helper functions for intelligent responses
const getSystemData = async () => {
  try {
    const bins = await Bin.find();
    
    const binStatus = {
      total: bins.length,
      full: bins.filter(b => b.fillLevel >= 80).length,
      halfFull: bins.filter(b => b.fillLevel >= 50 && b.fillLevel < 80).length,
      empty: bins.filter(b => b.fillLevel < 50).length,
      offline: bins.filter(b => b.status === 'offline').length,
      maintenance: bins.filter(b => b.status === 'maintenance').length
    };

    const filledBins = bins
      .filter(b => b.fillLevel >= 80)
      .map(b => ({ 
        id: b.binId, 
        fill: b.fillLevel, 
        location: b.location?.address || 'Unknown location',
        status: b.status
      }))
      .slice(0, 10);

    const alerts = [];
    bins.forEach(b => {
      if (b.fillLevel >= 90) {
        alerts.push(`Bin ${b.binId} is ${b.fillLevel}% full at ${b.location?.address || 'Unknown'}`);
      }
      if (b.status === 'offline') {
        alerts.push(`Bin ${b.binId} is offline`);
      }
    });

    return { binStatus, filledBins, alerts, bins };
  } catch (error) {
    console.error('Error fetching system data:', error);
    return { binStatus: {}, filledBins: [], alerts: [], bins: [] };
  }
};

// Analyze trends in bin data
const analyzeTrends = (bins) => {
  if (bins.length === 0) return { trends: [], insights: [] };

  // Sort by fill level
  const sortedByFill = [...bins].sort((a, b) => b.fillLevel - a.fillLevel);
  
  // Calculate statistics
  const fillLevels = bins.map(b => b.fillLevel);
  const avgFill = fillLevels.reduce((a, b) => a + b, 0) / fillLevels.length;
  const maxFill = Math.max(...fillLevels);
  const minFill = Math.min(...fillLevels);

  const trends = {
    highestFilled: sortedByFill[0],
    lowestFilled: sortedByFill[sortedByFill.length - 1],
    averageFill: Math.round(avgFill * 10) / 10,
    fillRange: maxFill - minFill,
    criticalBins: bins.filter(b => b.fillLevel >= 90).length,
    urgentBins: bins.filter(b => b.fillLevel >= 80 && b.fillLevel < 90).length
  };

  // Generate insights
  const insights = [];
  
  if (trends.criticalBins > 0) {
    insights.push(`⚠️ CRITICAL: ${trends.criticalBins} bin(s) are 90%+ full and require immediate attention`);
  }
  
  if (trends.urgentBins > 0) {
    insights.push(`📊 URGENT: ${trends.urgentBins} bin(s) are between 80-90% full - schedule collection soon`);
  }

  const offlineBins = bins.filter(b => b.status === 'offline').length;
  if (offlineBins > 0) {
    insights.push(`🔴 SYSTEM ISSUE: ${offlineBins} bin(s) are offline - check connectivity`);
  }

  if (trends.averageFill < 30) {
    insights.push(`✅ GOOD: Average fill level is low (${trends.averageFill}%) - efficient collection schedule`);
  } else if (trends.averageFill > 70) {
    insights.push(`⚠️ ALERT: Average fill level is high (${trends.averageFill}%) - consider increasing collection frequency`);
  }

  const variability = trends.fillRange > 60;
  if (variability) {
    insights.push(`📈 PATTERN: Significant variation in fill levels (${trends.fillRange}%) - uneven waste distribution`);
  }

  return { trends, insights };
};

// Identify anomalies in data
const identifyAnomalies = (bins) => {
  const anomalies = [];

  // Check for offline bins
  bins.forEach(b => {
    if (b.status === 'offline' && b.fillLevel > 50) {
      anomalies.push({
        type: 'offline_filled',
        severity: 'high',
        description: `Bin ${b.binId} is offline but showing ${b.fillLevel}% fill - potential data inconsistency`
      });
    }
  });

  // Check for rapid changes (if data is available)
  bins.forEach(b => {
    if (b.sensorData && b.sensorData.length > 1) {
      const latestSensor = b.sensorData[b.sensorData.length - 1];
      const previousSensor = b.sensorData[b.sensorData.length - 2];
      const fillChange = latestSensor.fillLevel - previousSensor.fillLevel;
      
      if (fillChange > 50) {
        anomalies.push({
          type: 'rapid_fill',
          severity: 'medium',
          description: `Bin ${b.binId} filled rapidly - possible sensor error or heavy waste intake`
        });
      }
    }
  });

  return anomalies;
};

// Get dashboard guidance based on context
const getDashboardGuidance = (userQuery) => {
  const guidance = {};

  if (userQuery.includes('dashboard') || userQuery.includes('how to') || userQuery.includes('explore')) {
    guidance.section = 'Dashboard Navigation';
    guidance.tips = [
      '📊 **Dashboard Overview**: Shows all key metrics at a glance',
      '🗑️ **Bin Overview**: View individual bin status and fill levels',
      '📈 **Analytics**: See trends and patterns in waste collection',
      '🚨 **Alerts**: Check active alerts and required actions',
      '🗺️ **Map View**: Visual representation of bin locations',
      '📑 **Reports**: Generate and download collection reports'
    ];
  }

  if (userQuery.includes('fill') || userQuery.includes('trend') || userQuery.includes('pattern')) {
    guidance.section = 'Understanding Trends';
    guidance.tips = [
      '📊 High fill levels (80%+) indicate urgent collection needs',
      '📉 Consistent low fill suggests efficient collection schedule',
      '🔄 Sudden spikes may indicate events or sensor issues',
      '📍 Compare fill patterns across different locations',
      '⏰ Monitor changes over time using the Analytics section'
    ];
  }

  if (userQuery.includes('alert') || userQuery.includes('problem') || userQuery.includes('issue')) {
    guidance.section = 'Alerts & Issues';
    guidance.tips = [
      '🔴 **Critical (90%+)**: Immediate collection required',
      '🟠 **Urgent (80-89%)**: Schedule collection within hours',
      '🟡 **Warning**: Monitor closely, collection coming up',
      '🔌 **Offline**: Check sensor connectivity and power',
      '⚙️ **Maintenance**: Scheduled service in progress'
    ];
  }

  return guidance;
};

// Make smart recommendations
const makeRecommendations = (systemData) => {
  const recommendations = [];

  // Collection priority
  if (systemData.binStatus.full > 0) {
    recommendations.push(`🚛 Prioritize collection for ${systemData.binStatus.full} bin(s) at 80%+ capacity`);
  }

  // System maintenance
  if (systemData.binStatus.offline > 0) {
    recommendations.push(`🔧 Address ${systemData.binStatus.offline} offline bin(s) - check sensors and connectivity`);
  }

  if (systemData.binStatus.maintenance > 0) {
    recommendations.push(`⚙️ ${systemData.binStatus.maintenance} bin(s) under maintenance - monitor for completion`);
  }

  // Optimization suggestions
  if (systemData.binStatus.total > 0) {
    const offlinePercent = (systemData.binStatus.offline / systemData.binStatus.total) * 100;
    if (offlinePercent > 10) {
      recommendations.push(`📊 System health at ${100 - offlinePercent.toFixed(0)}% - investigate offline bins`);
    }
  }

  return recommendations;
};

const shouldIncludeSystemData = (message) => {
  const keywords = [
    'bin', 'filled', 'full', 'empty', 'status', 'alert', 'offline',
    'how many', 'which', 'where', 'location', 'waste', 'collection',
    'full bins', 'filled bins', 'empty bins', 'trend', 'pattern', 'anomaly',
    'dashboard', 'analytics', 'explore', 'report', 'explore', 'guide',
    'factor', 'influence', 'why', 'what causes', 'problem', 'issue',
    'maintenance', 'sensor', 'data', 'statistics', 'summary'
  ];
  
  const lowerMessage = message.toLowerCase();
  return keywords.some(keyword => lowerMessage.includes(keyword));
};

// Send message to AI chatbot
router.post('/message', auth, async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Save user message
    const userMessage = new ChatMessage({
      userId: req.userId,
      sessionId: sessionId || 'default',
      message,
      role: 'user'
    });
    await userMessage.save();

    // Get recent conversation history (last 10 messages)
    const conversationHistory = await ChatMessage.find({
      userId: req.userId,
      sessionId: sessionId || 'default'
    })
    .sort({ timestamp: -1 })
    .limit(10)
    .sort({ timestamp: 1 });

    // Fetch system data if user is asking about bins
    let systemDataContext = '';
    let dashboardGuidance = '';
    if (shouldIncludeSystemData(message)) {
      const systemData = await getSystemData();
      const { trends, insights } = analyzeTrends(systemData.bins);
      const anomalies = identifyAnomalies(systemData.bins);
      const recommendations = makeRecommendations(systemData);
      const guidance = getDashboardGuidance(message);
      
      systemDataContext = `

CURRENT SYSTEM DATA:
- Total Bins: ${systemData.binStatus.total}
- Full Bins (80%+): ${systemData.binStatus.full}
- Half Full Bins (50-79%): ${systemData.binStatus.halfFull}
- Empty Bins (<50%): ${systemData.binStatus.empty}
- Offline Bins: ${systemData.binStatus.offline}
- Bins in Maintenance: ${systemData.binStatus.maintenance}

ANALYTICS & TRENDS:
- Highest Fill Level: ${trends.highestFilled?.fillLevel || 'N/A'}% (${trends.highestFilled?.binId || 'N/A'})
- Lowest Fill Level: ${trends.lowestFilled?.fillLevel || 'N/A'}% (${trends.lowestFilled?.binId || 'N/A'})
- Average Fill Level: ${trends.averageFill}%
- Fill Level Variation: ${trends.fillRange}%
- Critical Bins (90%+): ${trends.criticalBins}
- Urgent Bins (80-89%): ${trends.urgentBins}

KEY INSIGHTS:
${insights.map(insight => `• ${insight}`).join('\n')}

${anomalies.length > 0 ? `ANOMALIES DETECTED:\n${anomalies.map(a => `• [${a.severity.toUpperCase()}] ${a.description}`).join('\n')}` : ''}

RECOMMENDATIONS:
${recommendations.map(rec => `• ${rec}`).join('\n')}

${systemData.filledBins.length > 0 ? `Filled Bins (80%+):
${systemData.filledBins.map(b => `- Bin ${b.id}: ${b.fill}% full at ${b.location}`).join('\n')}` : 'No bins are currently 80% or more full.'}

${systemData.alerts.length > 0 ? `Active Alerts:\n${systemData.alerts.join('\n')}` : ''}`;

      if (guidance.tips) {
        dashboardGuidance = `

DASHBOARD GUIDANCE - ${guidance.section}:
${guidance.tips.join('\n')}`;
      }
    }

    // Prepare conversation context for Ollama
    const systemPrompt = `You are an intelligent AI analyst for a Smart Waste Management System. Your role is to:

1. ANSWER NATURAL LANGUAGE QUERIES about waste data with specificity and insight
2. GUIDE USERS in exploring the dashboard and understanding available features
3. EXPLAIN TRENDS, PATTERNS, and anomalies in the visual analytics
4. SUPPORT DECISION-MAKING by answering "what" and "why" questions
5. PROVIDE RECOMMENDATIONS based on current system state and data patterns

Core Competencies:
- Deep understanding of waste management operations
- Data analysis and trend identification
- System anomaly detection and diagnosis
- Actionable recommendations for operators
- Clear explanations for non-technical users

When responding:
✓ Use specific numbers and data points from the system
✓ Highlight critical issues that need immediate attention
✓ Explain the implications of trends and patterns
✓ Suggest next steps and best practices
✓ Relate observations to waste management best practices
✓ Be helpful for both operational and strategic decisions

${systemDataContext}${dashboardGuidance}

Previous conversation:
${conversationHistory.map(msg => `${msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}: ${msg.message}`).join('\n')}

User: ${message}
Assistant:`;

    // Get AI response from Ollama
    const ollamaResponse = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: systemPrompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 700
      }
    });

    const aiResponse = ollamaResponse.data.response;

    // Save AI response
    const aiMessage = new ChatMessage({
      userId: req.userId,
      sessionId: sessionId || 'default',
      message: aiResponse,
      role: 'assistant'
    });
    await aiMessage.save();

    res.json({
      message: aiResponse,
      sessionId: sessionId || 'default'
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Error processing chat message' });
  }
});

// Get chat history
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

// Get all chat sessions for user
router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await ChatMessage.aggregate([
      { $match: { userId: req.userId } },
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