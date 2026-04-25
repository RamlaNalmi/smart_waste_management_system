# Smart Waste Management - Intelligent Chatbot Guide

## Overview

The chatbot is now intelligent and context-aware! It can answer questions about:
- Which bins are filled
- Current bin status across the system
- Maintenance alerts
- Offline bins
- Collection priorities
- Environmental tips

## How It Works

### Smart Context Injection

When you ask a question about bins, the chatbot:
1. **Detects** if your question involves bins or system data
2. **Fetches** real data from the database
3. **Includes** this data in the AI model's context
4. **Generates** accurate, specific responses

### Example Questions

Try asking the chatbot:

**About Filled Bins:**
- "What are the filled bins?"
- "Which bins need emptying?"
- "Show me bins over 80% full"
- "What's the status of our bins?"

**About Specific Locations:**
- "What's happening at Area A?"
- "Are there any offline bins?"
- "Which bin has the highest fill level?"

**About Maintenance:**
- "Are any bins in maintenance?"
- "List all active alerts"
- "What bins need attention?"

**Environmental Tips:**
- "How can I reduce waste?"
- "Tell me about recycling best practices"
- "What are the benefits of waste management?"

## Setup Instructions

### 1. Make Sure Services Are Running

**Terminal 1 - Start Ollama:**
```bash
ollama serve
```

**Terminal 2 - Start Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Start Frontend:**
```bash
cd frontend
npm start
```

### 2. Seed the Database with Sample Data

In the backend directory, run:
```bash
npm run seed
```

This will create 8 sample bins with different fill levels, statuses, and locations.

**Output:**
```
Connected to MongoDB
Cleared existing bins
Created 8 sample bins

Bin Summary:
- Total bins: 8
- Full bins (80%+): 3
- Offline bins: 1
- Bins under maintenance: 1
```

### 3. Login and Test

1. Go to `http://localhost:3000`
2. Login with your credentials
3. Click the "Chat" button in the header
4. Ask questions about the bins!

## Sample Data

The seed script creates these bins:

| Bin ID | Location | Fill Level | Status | Alert |
|--------|----------|------------|--------|-------|
| BIN-001 | Downtown Street, Area A | 85% | Active | None |
| BIN-002 | Main Street, Area B | 92% | Active | **Full** |
| BIN-003 | Park Avenue, Area C | 45% | Active | None |
| BIN-004 | Market Square, Area D | 88% | Active | **Full** |
| BIN-005 | Central Park, Area E | 65% | Active | None |
| BIN-006 | Harbor Road, Area F | 20% | Active | None |
| BIN-007 | Industrial Zone, Area G | 100% | **Offline** | **Full + Offline** |
| BIN-008 | Residential Area, Area H | 55% | **Maintenance** | **Maintenance** |

## Chatbot Features

### Real-Time Data Integration
The chatbot automatically fetches current system data when:
- You mention "bin", "filled", "full", "empty", or "status"
- You ask "which", "how many", "where", or "what"
- You inquire about alerts, locations, or collection schedules

### System Analytics
The chatbot provides:
- Total bin count
- Full bins (80%+)
- Half-full bins (50-79%)
- Empty bins (<50%)
- Offline bins
- Bins in maintenance
- Active alerts

### Conversational Memory
- Chat history is saved per session
- Multiple chat sessions can be managed
- Previous context helps answer follow-up questions

## Example Interaction

**User:** "What are the filled bins?"

**Chatbot Response:**
```
Based on the current system status, we have 3 bins that are 80% or more full:

1. **Bin BIN-001** - 85% full at Downtown Street, Area A (Active)
2. **Bin BIN-002** - 92% full at Main Street, Area B (Active) ⚠️
3. **Bin BIN-004** - 88% full at Market Square, Area D (Active) ⚠️

These bins should be prioritized for collection soon, especially BIN-002 which is at 92% capacity. 

Additionally, **Bin BIN-007** at Industrial Zone, Area G is completely full (100%) but currently **offline**, so it needs both technical attention and urgent collection once service is restored.

Would you like more details about any specific bin?
```

## Adding More Bins

### Option 1: Add via Chatbot (Coming Soon)
Future versions will allow adding bins through the chat interface.

### Option 2: Add via API
```bash
curl -X POST http://localhost:5000/api/bins \
  -H "Content-Type: application/json" \
  -d '{
    "binId": "BIN-009",
    "location": {
      "latitude": 40.7200,
      "longitude": -73.9990,
      "address": "New Street, Area I"
    },
    "capacity": 100,
    "fillLevel": 50,
    "status": "active"
  }'
```

### Option 3: Update seed.js
Edit `seed.js` to add new bins to the sample data and run `npm run seed` again.

## Troubleshooting

### Chatbot Not Responding to Bin Queries

**Issue:** Chatbot says "I don't have access to that data"

**Solutions:**
1. Make sure seed data is loaded: `npm run seed`
2. Verify MongoDB is running and connected
3. Check backend logs for errors
4. Restart the backend server

### No Bins in Database

```bash
npm run seed
```

### Chatbot Slow to Respond

- Close other applications
- Check if Ollama is running smoothly
- Try asking simpler questions first
- Restart services if needed

### Connection Errors

1. Ensure backend is running: `npm run dev`
2. Ensure Ollama is running: `ollama serve`
3. Check MongoDB connection string in `.env`
4. Verify ports: 3000 (frontend), 5000 (backend), 11434 (Ollama)

## API Endpoints Used by Chatbot

- `GET /api/bins` - Fetches all bins for context
- `POST /api/chat/message` - Sends messages
- `GET /api/chat/history/:sessionId` - Gets chat history
- `GET /api/chat/sessions` - Lists all sessions

## Advanced Features

### Custom Queries
The chatbot intelligently detects when to include system data based on your query keywords:
- "bin", "filled", "full", "empty", "status"
- "alert", "offline", "maintenance", "collection"
- "how many", "which", "where", "location"

### Context Window
- Last 10 messages are included in context
- Helps chatbot understand conversation flow
- Better continuity in longer conversations

## Next Steps

1. ✅ Test the chatbot with sample data
2. ✅ Try different questions
3. - Add your own bins to the system
4. - Integrate real sensor data
5. - Customize system prompts for your needs

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review backend logs for errors
3. Verify all three services are running
4. Check MongoDB connection
5. Ensure sample data is seeded