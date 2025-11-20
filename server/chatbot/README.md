# ProgressBrain Chatbot Setup Guide

## Overview
The ProgressBrain Chatbot is a sophisticated AI study assistant powered by Google Gemini LLM. It's trained to understand the ProgressBrain platform, guide users through registration, and provide study support during learning sessions.

## Architecture

```
Frontend (React)
    ↓
Express Backend API (/api/chat/*)
    ↓
Python Flask Service (Port 5001)
    ↓
Google Gemini LLM API
```

## Files Structure

```
server/
├── chatbot/
│   ├── __init__.py                 # Python package init
│   ├── app.py                      # Flask API server
│   ├── chatbot_service.py          # Gemini LLM integration
│   ├── chatbot_context.py          # User context & knowledge base
│   ├── requirements.txt            # Python dependencies
│   └── README.md                   # Chatbot documentation
├── routes/
│   └── chatbotRoutes.js            # Express routes for chat API
└── .env                            # Configuration (add GEMINI_API_KEY)

client/
└── src/
    └── components/
        └── ChatBot.jsx             # React ChatBot component
```

## Setup Instructions

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Get API Key" or "Create API Key"
3. Copy your API key
4. Add to `server/.env`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

### 2. Install Python Dependencies

```bash
cd server/chatbot
pip install -r requirements.txt
```

Required packages:
- flask: Web framework
- flask-cors: Cross-origin requests
- python-dotenv: Environment variables
- google-generativeai: Gemini API client
- requests: HTTP client
- aiohttp: Async HTTP
- asyncio: Async programming

### 3. Start the Python Chatbot Service

```bash
cd server/chatbot
python app.py
```

The service will start on `http://localhost:5001`

### 4. Start the Node.js Backend

```bash
cd server
npm start
```

Server runs on `http://localhost:5000`

### 5. Start the Frontend

```bash
cd client
npm run dev
```

Frontend runs on `http://localhost:5173`

## API Endpoints

All endpoints require authentication (JWT token in header).

### Initialize Chat Context
**POST** `/api/chat/init`
- Initializes user's chatbot context with profile data
- Response: User info, study level, subjects

### Send Chat Message
**POST** `/api/chat/message`
```json
{
  "message": "What is photosynthesis?",
  "subject": "Biology",
  "topic": "Plant Processes"
}
```
- Sends user message to Gemini LLM
- Returns: AI response with timestamp
- Fallback: Generic response if service unavailable

### Explain Feature
**POST** `/api/chat/explain-feature`
```json
{
  "feature": "study_sessions"
}
```
- Gets detailed explanation of a ProgressBrain feature
- Features: study_sessions, streaks, reports, chatbot, settings

### Registration Help
**POST** `/api/chat/registration-help`
```json
{
  "step": 1
}
```
- Gets guidance for a specific registration step (1-4)
- Encourages users through onboarding

### Study Help
**POST** `/api/chat/study-help`
```json
{
  "subject": "Mathematics",
  "topic": "Calculus",
  "question": "How do I integrate x²?"
}
```
- Provides explanations and examples for study questions
- Context-aware based on subject and topic

### Get Motivation
**GET** `/api/chat/motivation`
- Returns personalized motivational message
- Considers user's streak and achievements
- Response: Encouragement and support

### Clear Chat Context
**POST** `/api/chat/clear`
- Clears user's conversation history
- Resets context for fresh start

## Chatbot Features

### 1. Platform Knowledge
The chatbot has been trained with comprehensive knowledge about:
- **ProgressBrain Features**: Study sessions, streaks, reports, chatbot
- **Registration Process**: 4-step guided onboarding
- **Study Tips**: Best practices and techniques
- **FAQ**: Frequently asked questions with answers

### 2. Conversation Memory
- Maintains last 20 conversation exchanges
- Tracks topics discussed
- Provides context-aware responses
- Remembers user preferences

### 3. User Profiles
- Stores name, email, study level, subjects
- Tracks response preferences (style, length, humor level)
- Remembers registration progress
- Personalized interactions

### 4. Topic Detection
Automatically identifies conversation topics:
- registration, study_sessions, streaks
- reports, settings, features, help
- motivation, general

### 5. Gemini LLM Integration
- Uses Gemini 2.0 Flash for speed
- Temperature: 0.7 for balanced responses
- Max output: 1024 tokens
- Async processing for performance

## Customization

### Change Response Style
Edit `preferences` in `ChatbotContext`:
```python
"response_style": "friendly"  # or "formal", "conversational"
"response_length": "medium"   # or "short", "long"
"humor_level": 0.5            # 0-1 scale
```

### Add New Features to Knowledge Base
Edit `ProgressBrainKnowledgeBase` in `chatbot_context.py`:
```python
FEATURES = {
    "your_feature": {
        "description": "...",
        "how_to": "...",
        "benefits": [...],
        "tips": [...]
    }
}
```

### Modify System Prompt
Edit `build_system_prompt()` in `ChatbotContext` to change:
- Personality and tone
- Guidelines and rules
- Knowledge about platform
- Response behavior

## Troubleshooting

### Chatbot Service Not Responding
```bash
# Check if Flask service is running
curl http://localhost:5001/health

# Restart the service
cd server/chatbot
python app.py
```

### API Key Errors
- Verify `GEMINI_API_KEY` is set in `.env`
- Check API key is valid in [Google AI Studio](https://aistudio.google.com/app/apikey)
- Ensure key has Generative AI API access

### CORS Errors
- Check `CHATBOT_API_URL` in server `.env`
- Verify Flask CORS is configured properly
- Check backend is accessible from frontend

### Memory/Performance Issues
- Reduce `max_history` in `ConversationMemory`
- Clear old user contexts periodically
- Monitor Flask service memory usage

## Production Deployment

### Environment Variables Needed
```env
GEMINI_API_KEY=your_production_key
CHATBOT_API_URL=https://your-api-domain.com
CHATBOT_PORT=5001
FLASK_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

### Deployment Steps
1. Set up environment variables on production server
2. Install Python dependencies in production environment
3. Use production WSGI server (Gunicorn, uWSGI) instead of Flask dev server
4. Set up proper logging and monitoring
5. Configure SSL/TLS certificates
6. Set up load balancing if needed

### Recommended Production Setup
```bash
# Run Flask with Gunicorn
gunicorn --workers 4 --worker-class async app:app --bind 0.0.0.0:5001

# Or with uWSGI
uwsgi --http :5001 --wsgi-file app.py --callable app --processes 4
```

## Performance Optimization

### Caching Responses
- Implement Redis for caching frequently asked questions
- Cache feature explanations
- Store user preferences in cache

### Async Processing
- Use message queues for long-running tasks
- Implement rate limiting
- Add response timeouts

### Database Integration
- Store conversation history in MongoDB
- Cache user contexts in Redis
- Implement conversation analytics

## Security Considerations

1. **API Key Management**
   - Never commit `.env` files
   - Use environment secrets in production
   - Rotate keys regularly

2. **Input Validation**
   - Sanitize user messages
   - Validate message length (max ~2000 chars)
   - Check for malicious content

3. **Rate Limiting**
   - Implement per-user rate limits
   - Prevent API abuse
   - Log suspicious activity

4. **Data Privacy**
   - Don't store sensitive user data
   - Implement data retention policies
   - GDPR compliance

## Future Enhancements

1. **Multi-language Support**
   - Detect user language
   - Translate conversations
   - Localize responses

2. **Voice Integration**
   - Text-to-speech for responses
   - Speech-to-text for input
   - Multi-modal interaction

3. **Advanced Analytics**
   - Track user learning patterns
   - Provide personalized recommendations
   - Generate study insights

4. **Custom Training**
   - Fine-tune Gemini with ProgressBrain data
   - Domain-specific knowledge
   - Improved context understanding

5. **Integration with Study Sessions**
   - Analyze session content
   - Provide real-time study suggestions
   - Track learning progress

## Support & Documentation

- **Gemini API Docs**: https://ai.google.dev
- **Flask Documentation**: https://flask.palletsprojects.com
- **React Documentation**: https://react.dev
- **Express Documentation**: https://expressjs.com

## License

ProgressBrain © 2024. All rights reserved.
