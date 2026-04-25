# Chatbot Integration Guide

## Overview

The Smart Waste Management System now includes an AI-powered chatbot integrated with Ollama. The chatbot is available in two ways:

1. **Floating Chat Widget** - Always accessible from any page (bottom-right corner)
2. **Full Chat Page** - Dedicated chat interface accessible from the sidebar

## Features

✅ **Real-time Messaging** - Instant responses from Ollama AI model
✅ **Conversation History** - Messages are saved in MongoDB
✅ **Multiple Sessions** - Users can manage multiple chat sessions
✅ **User Authentication** - Chat tied to authenticated users
✅ **Responsive Design** - Works on desktop and mobile
✅ **Local AI** - Runs on Ollama (no external API costs)

## Components

### 1. ChatBot.js
**Location:** `src/components/ChatBot.js`

A floating chat widget that appears as a button in the bottom-right corner of every page.

**Features:**
- Floating action button
- Expandable chat window
- Message history for the session
- Real-time typing indicators
- Responsive design

**Usage:**
The component is automatically included in the main App and displays for authenticated users.

### 2. ChatBotPage.js
**Location:** `src/components/ChatBotPage.js`

A full-page chat interface with session management.

**Features:**
- Full-screen chat area
- Session sidebar showing conversation history
- Create new chat sessions
- View previous conversations
- Larger message area for better readability

**Access:**
- Click "AI Assistant" in the sidebar
- Or navigate to the chat route

## How to Use

### For Users

1. **Floating Chat Widget:**
   - Click the blue chat icon (bottom-right)
   - Type your question
   - Click Send or press Enter
   - Click X to close

2. **Full Chat Interface:**
   - Click "AI Assistant" in the sidebar
   - Start typing in the message input
   - Create new conversations with "New Chat" button
   - Switch between past conversations from the sidebar

### Example Questions

- "What is waste management?"
- "How do I reduce plastic waste?"
- "Tell me about recycling"
- "What are the bin status updates?"
- "How often should bins be emptied?"

## Backend API Endpoints

### Chat Endpoints

**Send Message:**
```
POST /api/chat/message
Headers: Authorization: Bearer {token}
Body: {
  "message": "Your question here",
  "sessionId": "session-id"
}
Response: {
  "message": "AI response",
  "sessionId": "session-id"
}
```

**Get Chat History:**
```
GET /api/chat/history/:sessionId
Headers: Authorization: Bearer {token}
Response: [{message history}]
```

**Get All Sessions:**
```
GET /api/chat/sessions
Headers: Authorization: Bearer {token}
Response: [{session list}]
```

## Configuration

### Frontend (.env or config)
No additional configuration needed. The frontend uses:
- Backend URL: `http://localhost:5000`
- API base: `/api/chat`

### Backend (.env)
```
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
```

## Running the System

### 1. Start Ollama Server
```bash
ollama serve
```

### 2. Start Backend
```bash
cd backend
npm run dev
```

### 3. Start Frontend
```bash
cd frontend
npm start
```

### 4. Access the Application
```
http://localhost:3000
```

## Troubleshooting

### Chatbot not responding

**Issue:** Messages show error about backend connection

**Solutions:**
1. Ensure backend is running: `npm run dev` in backend folder
2. Check Ollama is running: `ollama serve` in separate terminal
3. Verify MongoDB connection in backend console
4. Check browser console for network errors

### Ollama model not found

**Issue:** Error saying model is not available

**Solutions:**
1. Check if model is installed: `ollama list`
2. Pull the model: `ollama pull qwen2.5:3b`
3. Update OLLAMA_MODEL in backend .env
4. Restart backend

### Slow responses

**Issue:** Chatbot takes a long time to respond

**Reasons:**
- Model is too large for your system (try a smaller model)
- System has limited RAM or CPU
- Other processes using system resources

**Solutions:**
1. Switch to a smaller model: `mistral` or `neural-chat`
2. Close unnecessary applications
3. Check system resources

### Authentication errors

**Issue:** "No token provided" or "Invalid token"

**Solutions:**
1. Make sure you're logged in
2. Clear browser cache and log in again
3. Check if JWT_SECRET matches between sessions
4. Verify AuthContext is working properly

## Database Schema

### ChatMessage Model
```javascript
{
  userId: ObjectId,           // Reference to User
  sessionId: String,          // Chat session ID
  message: String,            // Message content
  role: String,               // 'user' or 'assistant'
  timestamp: Date,            // When message was sent
  metadata: Mixed             // Any additional data
}
```

## Security

- ✅ Authentication required for all chat endpoints
- ✅ Messages tied to user ID
- ✅ JWT token validation on backend
- ✅ User can only access their own chat history
- ✅ Local model (no external API exposure)

## Performance Considerations

- Chat history is limited to last 10 messages for context
- Messages are stored in MongoDB
- Ollama runs locally for faster responses
- Conversation context helps maintain continuity

## Future Enhancements

- [ ] Export conversation to PDF
- [ ] Share conversations with other users
- [ ] Custom system prompts per user role
- [ ] Real-time notifications for bin-related queries
- [ ] Voice input support
- [ ] Multi-language support
- [ ] Sentiment analysis for feedback
- [ ] Integration with bin data for contextual responses

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review browser console for error messages
3. Check backend logs for API errors
4. Verify Ollama is running and responsive