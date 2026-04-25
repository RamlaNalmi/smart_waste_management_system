# Smart Waste Management Backend

Backend API for the Smart Waste Management System with Gemini AI Chatbot integration.

## Features

- User authentication and authorization
- Smart bin database readings from IoT sensor payloads
- AI-powered chatbot using Gemini API
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
   GEMINI_API_KEY=your-gemini-api-key
   GEMINI_MODEL=gemini-2.5-flash
   PORT=5000
   ```

3. **MongoDB Setup:**
   - Use MongoDB Atlas (cloud) or local MongoDB
   - Update the `MONGODB_URI` in `.env` with your connection string

4. **Gemini Setup:**
   - Create a Gemini API key in Google AI Studio
   - Put the key in `GEMINI_API_KEY`
   - Update `GEMINI_MODEL` in `.env` if using a different Gemini model

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
- `GET /api/bins` - Get all database sensor readings
- `GET /api/bins/bin-id/:deviceId` - Get latest reading by device ID
- `GET /api/bins/:id` - Get reading by MongoDB ID

### Chat
- `POST /api/chat/message` - Send message to AI chatbot
- `GET /api/chat/history/:sessionId?` - Get chat history
- `GET /api/chat/sessions` - Get all chat sessions

## Database Models

### User
- username, email, password, role, createdAt

### Bin
- device_id, distance, fill_percentage, fill_status, gas, gas_alert, fall_detected, timestamp, topic, received_at

### ChatMessage
- userId, sessionId, message, role, timestamp, metadata

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Gemini API for AI chatbot
- bcryptjs for password hashing
