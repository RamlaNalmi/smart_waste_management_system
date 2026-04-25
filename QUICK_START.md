# Quick Start - Intelligent Chatbot

## 🚀 Get Started in 5 Minutes

### Step 1: Seed Database with Sample Bins

Open a terminal in the backend folder and run:
```bash
npm run seed
```

**Expected Output:**
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

### Step 2: Start All Services

**Terminal 1 - Ollama (Local AI):**
```bash
ollama serve
```

**Terminal 2 - Backend Server:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm start
```

### Step 3: Access the Application

1. Open `http://localhost:3000` in your browser
2. Login with your credentials
3. Click the **"Chat"** button in the header (top-right)

### Step 4: Test the Chatbot

Try these questions:

```
"What are the filled bins?"
"Show me bins over 80% full"
"Which bins need collection?"
"Are there any offline bins?"
"What's the status of our waste management system?"
"What are the current alerts?"
"List all bins and their fill levels"
```

## 📊 What You'll Get

### Example Response for "What are the filled bins?"

The chatbot will provide:
- ✅ Exact number of filled bins
- ✅ Specific bin IDs and locations
- ✅ Current fill percentages
- ✅ Active alerts and maintenance status
- ✅ Collection recommendations

### Example Response for "Are there any offline bins?"

The chatbot will provide:
- ✅ List of offline bins
- ✅ Their locations and last status
- ✅ Recommended actions
- ✅ Impact on collection schedule

## 🔄 How It Works

1. **You Ask** → "What are the filled bins?"
2. **Chatbot Detects** → "This is about bin status"
3. **Chatbot Fetches** → Queries MongoDB for current bin data
4. **Chatbot Analyzes** → Identifies relevant bins (80%+ full)
5. **Chatbot Responds** → Provides detailed, specific answer with locations

## 🛠️ Troubleshooting

### Chatbot Says: "Error connecting to chatbot"
- ✅ Make sure Ollama is running: `ollama serve`
- ✅ Make sure backend is running: `npm run dev`

### Chatbot Not Providing Bin Data
- ✅ Run seed first: `npm run seed`
- ✅ Check MongoDB is connected
- ✅ Try asking again with different keywords: "filled", "full", "status", "bins"

### No Response at All
- ✅ Check all three services are running
- ✅ Check browser console for errors (F12)
- ✅ Check backend console for connection errors

## 💡 Pro Tips

### Keywords That Trigger Data Fetching
- "bin", "filled", "full", "empty", "status"
- "alert", "offline", "maintenance", "collection"
- "how many", "which", "where", "location"

### Ask Follow-Up Questions
- "Tell me more about BIN-002"
- "When was BIN-001 last emptied?"
- "What should I do about the offline bin?"

### Mix Questions
- "What's the bin status and give me waste management tips?"
- "Which bins need collection and how can we reduce waste?"

## 📈 Next Steps

After testing:
1. Add your own bins via API or database
2. Update sensor data from IoT devices
3. Monitor alerts in real-time
4. Get collection recommendations
5. Track waste trends

## 🎓 Learn More

For detailed documentation, see:
- `INTELLIGENT_CHATBOT.md` - Full feature guide
- `backend/README.md` - Backend setup
- `frontend/CHATBOT_INTEGRATION.md` - Frontend integration details

Enjoy your intelligent waste management chatbot! 🤖♻️