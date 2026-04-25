const express = require('express');
const axios = require('axios');
const ChatMessage = require('../models/ChatMessage');

const router = express.Router();

// Ollama configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2';

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

    // Prepare conversation context for Ollama
    const systemPrompt = `You are an AI assistant for a Smart Waste Management System. You help users with:
- Information about waste bins and their status
- Waste management best practices
- Environmental tips
- System usage guidance
- Answering questions about waste collection and recycling

Be helpful, friendly, and knowledgeable about environmental topics.

Conversation history:
${conversationHistory.map(msg => `${msg.role}: ${msg.message}`).join('\n')}

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
        num_predict: 500
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