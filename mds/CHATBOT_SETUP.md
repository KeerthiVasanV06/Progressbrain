# ProgressBrain Chatbot - Quick Start Guide

## What's New?

Your ProgressBrain now has an **AI-powered study assistant** that:
✅ Understands the entire ProgressBrain platform
✅ Guides users through registration step-by-step
✅ Helps during study sessions with explanations
✅ Learns from conversation context
✅ Provides motivational support
✅ Answers FAQs about features

## Getting Started (3 Steps)

### Step 1: Get Gemini API Key (Free!)

1. Visit: https://aistudio.google.com/app/apikey
2. Click "Get API Key" (it's free)
3. Copy your key
4. Add to `server/.env`:
   ```
   GEMINI_API_KEY=your_copied_key_here
   ```

### Step 2: Install Python Chatbot Service

```bash
# Navigate to chatbot directory
cd server/chatbot

# Install dependencies
pip install -r requirements.txt

# Start the chatbot service
python app.py
```

You should see: `Starting ProgressBrain Chatbot API on port 5001`

### Step 3: Run Everything

In separate terminals:

```bash
# Terminal 1 - Backend (Node.js)
cd server
npm start

# Terminal 2 - Chatbot Service (Python)
cd server/chatbot
python app.py

# Terminal 3 - Frontend (React)
cd client
npm run dev
```

Visit: `http://localhost:5173`

## How It Works

### During Study Sessions
1. User starts a study session
2. ChatBot appears on the right side
3. User asks questions about their topic
4. Gemini LLM provides context-aware answers
5. Conversation is remembered for consistency

### Registration
When users register, the chatbot:
- Explains what ProgressBrain is
- Guides through each registration step
- Answers their concerns
- Encourages them to start studying

### General Chat
- Ask about features (study sessions, streaks, reports)
- Get study help on any topic
- Receive motivational messages
- Access FAQ information

## API Endpoints

All require authentication (JWT token).

```
POST   /api/chat/init                  # Initialize chat
POST   /api/chat/message              # Send message
POST   /api/chat/explain-feature      # Explain a feature
POST   /api/chat/registration-help    # Registration guidance
POST   /api/chat/study-help           # Study explanation
GET    /api/chat/motivation            # Motivational message
POST   /api/chat/clear                # Clear chat history
```

## Customizing the Chatbot

### Change Personality

Edit `server/chatbot/chatbot_context.py`:

```python
# In ChatbotContext.build_system_prompt():
# Change these preferences:
"response_style": "friendly"  # or "formal", "conversational"
"response_length": "medium"   # or "short", "long"
"humor_level": 0.5            # 0-1 scale (0 = no humor, 1 = lots of humor)
```

### Add New Features to Knowledge Base

Edit `ProgressBrainKnowledgeBase.FEATURES` in `chatbot_context.py`:

```python
"new_feature": {
    "description": "What it does",
    "how_to": "Step-by-step instructions",
    "benefits": ["benefit 1", "benefit 2"],
    "tips": ["tip 1", "tip 2"]
}
```

### Modify Registration Steps

Edit `ProgressBrainKnowledgeBase.REGISTRATION_FLOW`:

```python
"step_1": {
    "title": "Create Account",
    "description": "Sign up with email and password",
    "fields": ["Email", "Password"],
    "tips": ["Use strong password", "Verify email"]
}
```

## Testing the Chatbot

### Test in Browser
1. Start all three services
2. Go to Study page
3. Create a study session
4. Type in the ChatBot
5. See AI responses!

### Test Specific Endpoints

```bash
# Get motivation
curl -X GET http://localhost:5000/api/chat/motivation \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Ask a question
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "What is photosynthesis?",
    "subject": "Biology",
    "topic": "Plant Processes"
  }'
```

## Features Explained

### 1. Context Awareness
- Remembers recent messages
- Knows current subject/topic
- Tracks conversation themes
- Provides relevant responses

### 2. User Profiles
- Stores preferences
- Remembers registration progress
- Personalizes interactions
- Adapts to learning style

### 3. Knowledge Base
- **Platform Features**: How to use ProgressBrain
- **Registration Flow**: Step-by-step onboarding
- **FAQ**: Common questions answered
- **Study Tips**: Learning best practices

### 4. Conversation Memory
- Last 20 messages stored
- Topic tracking
- Context summaries
- Personalization data

## Architecture

```
┌─────────────────┐
│   React Frontend │
│   (ChatBot.jsx) │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────────────┐
│  Express Backend        │
│  (/api/chat/*)          │
└────────┬────────────────┘
         │ HTTP
         ▼
┌──────────────────────────┐
│  Flask Python Service    │
│  (Chatbot API)           │
└────────┬─────────────────┘
         │ API Call
         ▼
┌──────────────────────────┐
│  Google Gemini LLM       │
│  (AI Intelligence)       │
└──────────────────────────┘
```

## Troubleshooting

### "Connection refused" error
```bash
# Make sure Flask service is running
python app.py  # in server/chatbot/

# Or check the port
curl http://localhost:5001/health
```

### "API key not valid"
- Go to https://aistudio.google.com/app/apikey
- Create a new key
- Update `.env` file

### Chatbot not responding
- Check Flask console for errors
- Verify `.env` has correct API key
- Restart all services
- Check internet connection

### Messages not showing
- Check browser console for errors
- Verify JWT token is valid
- Check network tab in DevTools
- Make sure user is authenticated

## Environment Variables

Add to `server/.env`:

```env
# Required
GEMINI_API_KEY=your_gemini_api_key

# Optional
CHATBOT_API_URL=http://localhost:5001
CHATBOT_PORT=5001
FLASK_ENV=development
```

## Performance Tips

1. **Caching**: Responses are cached automatically
2. **Async**: All API calls are non-blocking
3. **Memory**: Old conversations cleaned up automatically
4. **Rate Limiting**: Implement for production

## Security Notes

✅ Never commit `.env` files
✅ API key is server-side only
✅ User data is isolated per user
✅ JWT token required for all endpoints
✅ Messages not stored in plain text

## Next Steps

1. ✅ Install dependencies
2. ✅ Get Gemini API key
3. ✅ Start all services
4. ✅ Test the chatbot
5. ✅ Customize prompts as needed
6. ✅ Deploy to production

## Production Checklist

- [ ] Use production Gemini API key
- [ ] Set `FLASK_ENV=production`
- [ ] Use Gunicorn/uWSGI instead of Flask dev server
- [ ] Set up HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up logging
- [ ] Implement rate limiting
- [ ] Monitor API usage
- [ ] Regular backups
- [ ] Security audit

## Support

For issues:
1. Check error messages in console
2. Review `README.md` in `server/chatbot/`
3. Check Gemini API documentation
4. Review code comments for guidance

Happy studying with ProgressBrain! 🚀
