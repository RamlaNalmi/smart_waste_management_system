# Smart Waste Management Backend

Backend API for the Smart Waste Management System with Ollama AI Chatbot integration.

## Features

- User authentication and authorization
- Waste bin management with real-time sensor data
- AI-powered chatbot using Ollama (local AI models)
- MongoDB database integration
- RESTful API endpoints

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/smart-waste-db
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama2
   PORT=5000
   ```

3. **MongoDB Setup:**
   - Use MongoDB Atlas (cloud) or local MongoDB
   - Update the `MONGODB_URI` in `.env` with your connection string

4. **Ollama Setup:**
   - Install Ollama from https://ollama.ai/
   - Pull a model: `ollama pull llama2` (or any other model you prefer)
   - Make sure Ollama is running: `ollama serve`
   - Update `OLLAMA_MODEL` in `.env` if using a different model

## Running the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5000` by default.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Bins
- `GET /api/bins` - Get all bins
- `GET /api/bins/:id` - Get bin by ID
- `POST /api/bins` - Create new bin
- `PUT /api/bins/:id` - Update bin
- `DELETE /api/bins/:id` - Delete bin
- `POST /api/bins/:id/sensor` - Update bin sensor data

### Chat
- `POST /api/chat/message` - Send message to AI chatbot
- `GET /api/chat/history/:sessionId?` - Get chat history
- `GET /api/chat/sessions` - Get all chat sessions

## Database Models

### User
- username, email, password, role, createdAt

### Bin
- binId, location, capacity, fillLevel, status, sensorData, alerts

### ChatMessage
- userId, sessionId, message, role, timestamp, metadata

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Ollama for local AI chatbot
- bcryptjs for password hashing