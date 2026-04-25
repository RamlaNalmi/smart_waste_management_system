# Gemini Setup Instructions

## 1. Create an API key

Create a Gemini API key in Google AI Studio and keep it private.

## 2. Configure the backend

Add these values to `backend/.env`:

```env
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```

## 3. Restart the backend

```bash
npm start
```

The chatbot will call Gemini through the REST `generateContent` endpoint. If the key is missing or Gemini is unavailable, the backend still returns a database-only fallback answer.
