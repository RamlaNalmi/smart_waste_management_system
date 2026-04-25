# Smart Chatbot - Quick Query Reference

## 🚀 Quick Start Examples

### Status & Overview
```
✓ "What's the current status?"
✓ "Give me a system summary"
✓ "How many bins are full?"
✓ "What's the overall health?"
✓ "Are there any active alerts?"
```

### Specific Bin Information
```
✓ "Which bins need collection?"
✓ "Show me bins over 80% full"
✓ "What are the filled bins?"
✓ "Which bin has the highest fill level?"
✓ "Are there any offline bins?"
```

### Trend Analysis
```
✓ "What trends do you see?"
✓ "Analyze the current patterns"
✓ "Why is Area B filling up faster?"
✓ "Explain the variation in fill levels"
✓ "What's the average fill percentage?"
```

### Problem Identification
```
✓ "Are there any problems?"
✓ "What needs immediate attention?"
✓ "Identify any anomalies"
✓ "What issues are there?"
✓ "Why is bin X offline?"
```

### Decision Support
```
✓ "What should we do?"
✓ "What's your recommendation?"
✓ "Which bin should be collected first?"
✓ "How can we optimize collection?"
✓ "What are the priorities?"
```

### Dashboard Guidance
```
✓ "How do I use the dashboard?"
✓ "Guide me through the system"
✓ "Explain the analytics section"
✓ "Where can I find X information?"
✓ "What does this metric mean?"
```

---

## 📊 What the Bot Can Analyze

### Real-Time Data
- ✅ Current fill levels for all bins
- ✅ Bin status (active, offline, maintenance)
- ✅ Location and address information
- ✅ Sensor data and readings
- ✅ Active alerts and issues

### Statistics
- ✅ Average fill percentage
- ✅ Highest and lowest bins
- ✅ Fill level distribution
- ✅ Variation and range
- ✅ System health percentage

### Trends & Patterns
- ✅ Fast-filling vs slow-filling areas
- ✅ Consistency in waste levels
- ✅ Peak waste times (if data available)
- ✅ Location-based variations
- ✅ Anomalies and unusual patterns

### Priorities
- ✅ Immediate action required (90%+)
- ✅ Urgent collection needed (80-89%)
- ✅ Monitor closely (50-79%)
- ✅ No immediate action (<50%)
- ✅ System issues (offline/maintenance)

---

## 🎯 Common Responses

### Status Check Response
When you ask for status, the bot provides:
- Total operational bins
- Average fill level
- Number of bins in each priority tier
- Critical issues
- Overall system health

### Recommendation Response
When you ask for recommendations, you get:
- Priority-ranked action items
- Specific bin IDs to address
- Urgency level for each
- Estimated collection order
- System maintenance needs

### Trend Analysis Response
When you ask about trends, you get:
- Which areas/bins fill fastest
- Average fill rate
- Variation between bins
- Factors influencing differences
- Optimization suggestions

### Problem Diagnosis Response
When you ask about problems, you get:
- List of detected anomalies
- Severity of each issue
- Root cause analysis
- Recommended remediation
- Priority order for fixes

---

## 💡 Pro Tips

### 1. Start Broad, Then Narrow
```
Bot: "What's the status?"
→ "Which of those bins is most urgent?"
→ "What's happening at Main Street?"
```

### 2. Ask Follow-Up Questions
```
"Why is Area B filling faster?"
→ "What can we do about it?"
→ "Should we increase collection frequency there?"
```

### 3. Use Bot for Decision Making
```
"What should be our collection priority today?"
→ "How long would each collection take?"
→ "What's the most efficient route?"
```

### 4. Explore Dashboard Recommendations
```
"Guide me through the analytics"
→ "Show me the dashboard overview"
→ "Where's the bin map?"
```

### 5. Context Matters
```
✓ "For Area B, why is the fill level so high?"
✓ "Given the current data, what should we do?"
✓ "Considering the offline bin, what's the risk?"
```

---

## 🔍 Question Patterns That Work Well

### "What/When/Where/Why" Questions
```
✓ "What bins need collection?" → Specific list
✓ "When should we collect?" → Priority-based timing
✓ "Where are the full bins?" → Location-specific
✓ "Why is X filling fast?" → Root cause analysis
```

### Comparative Questions
```
✓ "Compare Area A and Area B"
✓ "Which location has more issues?"
✓ "How do the fill levels differ?"
```

### Decision Questions
```
✓ "What should we prioritize?"
✓ "Is there a better collection strategy?"
✓ "How can we optimize this?"
```

### Explanation Questions
```
✓ "Explain this trend"
✓ "What does this data mean?"
✓ "Why is this happening?"
```

---

## 📱 Different Use Cases

### **Morning Briefing**
```
Bot: "What needs attention today?"
Response: Prioritized list of collection needs and issues
```

### **Route Planning**
```
Bot: "In what order should we collect?"
Response: Optimized collection sequence
```

### **Problem Solving**
```
Bot: "Why is the offline bin still offline?"
Response: Diagnosis and recommendations
```

### **Optimization**
```
Bot: "How can we reduce collection trips?"
Response: Data-backed suggestions for efficiency
```

### **Reporting**
```
Bot: "Summarize today's operations"
Response: Complete operational summary
```

---

## ⚡ Quick Reference Data

When you ask about data, the bot can tell you:

**About Bins:**
- Total number of bins in system
- How many are full, half-full, empty
- How many are offline or in maintenance

**About Locations:**
- Which area has the most waste
- Which area is least active
- Which area needs most attention

**About System:**
- Overall health percentage
- Average fill level across all bins
- Number of critical issues
- Number of alerts active

**About Status:**
- What's the most urgent action
- What's the collection priority
- What needs maintenance
- What's running smoothly

---

## 🔧 Troubleshooting Queries

### If Bot Says "No Data"
```
→ Make sure `npm run seed` was run
→ Check MongoDB is connected
→ Verify backend is running
```

### If Bot Gives Vague Answer
```
→ Be more specific in your question
→ Include location or bin information
→ Ask about specific time period
```

### If Bot Seems Confused
```
→ Try asking in a different way
→ Include more context
→ Break complex questions into parts
```

---

## 📞 Getting Help

In the Chat:
```
"What can you help me with?"
"Guide me through using this system"
"Explain the dashboard features"
"How do I interpret this data?"
```

Check Documentation:
- `ADVANCED_CHATBOT_GUIDE.md` - Full feature guide
- `QUICK_START.md` - Getting started
- `INTELLIGENT_CHATBOT.md` - Chatbot capabilities
- `backend/README.md` - Technical details

---

## ✨ Key Features to Remember

✅ **Real-time Data**: Always shows current status
✅ **Smart Analysis**: Identifies trends and anomalies  
✅ **Actionable Recommendations**: Prioritized suggestions
✅ **Context Aware**: Understands complex queries
✅ **Decision Support**: Helps you make smart choices
✅ **Dashboard Guidance**: Explains how to use the system
✅ **Natural Language**: Ask questions naturally

---

Ready to chat? Click the "Chat" button in the header and start exploring! 🚀