# ProgressBrain Chatbot API Reference

## Base URL
- Development: `http://localhost:5000/api/chat`
- Production: `https://your-domain.com/api/chat`

## Authentication
All endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Endpoints

### 1. Initialize Chat Context
**POST** `/api/chat/init`

Initializes or gets the user's chatbot context with their profile data.

**Request:**
```bash
curl -X POST http://localhost:5000/api/chat/init \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Chatbot context initialized",
  "context": {
    "user_name": "John Doe",
    "user_id": "user123",
    "study_level": "beginner"
  }
}
```

**Status Codes:**
- `200`: Success
- `404`: User not found
- `500`: Server error

---

### 2. Send Chat Message
**POST** `/api/chat/message`

Sends a message to the chatbot and receives an AI response.

**Request:**
```bash
curl -X POST http://localhost:5000/api/chat/message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is photosynthesis?",
    "subject": "Biology",
    "topic": "Plant Processes"
  }'
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| message | string | Yes | User message to send |
| subject | string | No | Current subject (for context) |
| topic | string | No | Current topic (for context) |

**Response:**
```json
{
  "success": true,
  "response": "Photosynthesis is the process by which plants convert light energy...",
  "timestamp": "2024-11-20T10:30:45.123Z"
}
```

**Status Codes:**
- `200`: Success
- `400`: Bad request (empty message)
- `404`: User not found
- `500`: Server error

**Notes:**
- Empty messages are rejected
- Response includes full AI-generated answer
- Fallback response provided if Python service unavailable
- Response is automatically stored in conversation memory

---

### 3. Explain Feature
**POST** `/api/chat/explain-feature`

Gets detailed explanation of a ProgressBrain feature.

**Request:**
```bash
curl -X POST http://localhost:5000/api/chat/explain-feature \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "feature": "study_sessions"
  }'
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| feature | string | Yes | Feature name to explain |

**Valid Features:**
- `study_sessions` - Timed focused study periods
- `streaks` - Daily study consistency tracking
- `reports` - Analytics and insights
- `chatbot` - AI study assistant
- `settings` - Customization options

**Response:**
```json
{
  "success": true,
  "explanation": "Study Sessions are focused learning periods tracked by ProgressBrain. When you start a study session..."
}
```

**Status Codes:**
- `200`: Success
- `400`: Feature name missing
- `404`: Feature not found
- `500`: Server error

---

### 4. Get Registration Help
**POST** `/api/chat/registration-help`

Gets guidance for a specific registration step.

**Request:**
```bash
curl -X POST http://localhost:5000/api/chat/registration-help \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "step": 1
  }'
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| step | number | Yes | Registration step (1-4) |

**Registration Steps:**
- `1` - Account creation (email, password)
- `2` - Profile setup (name, study level)
- `3` - Preferences (response style, notifications)
- `4` - Getting started (first study session)

**Response:**
```json
{
  "success": true,
  "guidance": "Welcome! Let's start by creating your account. Choose a strong password..."
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid step (must be 1-4)
- `500`: Server error

---

### 5. Get Study Help
**POST** `/api/chat/study-help`

Gets help on a specific study topic with explanations and examples.

**Request:**
```bash
curl -X POST http://localhost:5000/api/chat/study-help \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Mathematics",
    "topic": "Calculus",
    "question": "How do I integrate x²?"
  }'
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| subject | string | Yes | Subject being studied |
| topic | string | Yes | Topic within subject |
| question | string | Yes | Student's question |

**Response:**
```json
{
  "success": true,
  "help": "Great question! To integrate x², we use the power rule for integration...",
  "subject": "Mathematics",
  "topic": "Calculus"
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing required fields
- `500`: Server error

---

### 6. Get Motivation
**GET** `/api/chat/motivation`

Gets a personalized motivational message for the user.

**Request:**
```bash
curl -X GET http://localhost:5000/api/chat/motivation \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "John, you're doing amazing! Keep up this momentum!"
}
```

**Status Codes:**
- `200`: Success
- `404`: User not found
- `500`: Server error

**Notes:**
- Message personalized with user's name
- Considers user's current streak
- Fallback cached messages if AI unavailable

---

### 7. Clear Chat Context
**POST** `/api/chat/clear`

Clears the user's conversation history and resets context.

**Request:**
```bash
curl -X POST http://localhost:5000/api/chat/clear \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Chat context cleared"
}
```

**Status Codes:**
- `200`: Success
- `500`: Server error

**Notes:**
- Clears conversation memory
- Resets context for fresh start
- User profile data still retained

---

## Error Responses

### Standard Error Format
```json
{
  "error": "Description of error"
}
```

### Common Errors

**400 - Bad Request**
```json
{
  "error": "Message cannot be empty"
}
```

**404 - Not Found**
```json
{
  "error": "User not found"
}
```

**401 - Unauthorized**
```json
{
  "error": "Authentication required"
}
```

**500 - Server Error**
```json
{
  "error": "Internal server error"
}
```

---

## Request Examples

### Example 1: Complete Study Session Flow

```bash
# 1. Initialize
POST /api/chat/init

# 2. Send first message
POST /api/chat/message
{
  "message": "Hi! I'm starting a biology lesson",
  "subject": "Biology",
  "topic": "Photosynthesis"
}

# 3. Ask for help
POST /api/chat/message
{
  "message": "Can you explain the light reactions?",
  "subject": "Biology",
  "topic": "Photosynthesis"
}

# 4. Get motivation
GET /api/chat/motivation

# 5. Clear when done
POST /api/chat/clear
```

### Example 2: Feature Learning

```bash
# 1. Ask about a feature
POST /api/chat/explain-feature
{
  "feature": "streaks"
}

# 2. Ask a follow-up
POST /api/chat/message
{
  "message": "What if I miss a day?"
}

# 3. Clear
POST /api/chat/clear
```

### Example 3: Registration Support

```bash
# 1. Get step 1 guidance
POST /api/chat/registration-help
{
  "step": 1
}

# 2. Ask a question
POST /api/chat/message
{
  "message": "How strong should my password be?"
}

# 3. Move to step 2
POST /api/chat/registration-help
{
  "step": 2
}
```

---

## Response Times

| Endpoint | Typical Time | Max Time |
|----------|--------------|----------|
| init | <100ms | 500ms |
| message | 1-3 sec | 10 sec |
| explain-feature | 1-2 sec | 8 sec |
| registration-help | 1-2 sec | 8 sec |
| study-help | 1-3 sec | 10 sec |
| motivation | 500ms-1 sec | 5 sec |
| clear | <100ms | 500ms |

---

## Rate Limiting

Current implementation has no rate limiting. For production:

**Recommended Limits:**
- 30 requests per minute per user
- 100 requests per minute per IP
- 1000 messages per day per user

---

## Fallback Responses

If the Python Gemini service is unavailable, the Express backend provides cached fallback responses based on content:

- Mentions "study_sessions" → Returns study session explanation
- Mentions "streaks" → Returns streak explanation
- Mentions "reports" → Returns reports explanation
- Default → Generic helpful response

This ensures the chat continues to work even if the AI service is down.

---

## Testing

### Using cURL
```bash
# Test initialization
curl -X POST http://localhost:5000/api/chat/init \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json"

# Test message
curl -X POST http://localhost:5000/api/chat/message \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

### Using Postman
1. Create a new collection
2. Add authorization header with Bearer token
3. Create requests for each endpoint
4. Test with sample data

### Using Python
```python
import requests

token = "your_jwt_token"
headers = {"Authorization": f"Bearer {token}"}

# Init
response = requests.post("http://localhost:5000/api/chat/init", headers=headers)
print(response.json())

# Send message
response = requests.post("http://localhost:5000/api/chat/message",
  headers=headers,
  json={"message": "Hello!", "subject": "Biology"})
print(response.json())
```

---

## Troubleshooting

### 401 Unauthorized
- Check JWT token is valid
- Verify token not expired
- Token should be in Authorization header as "Bearer TOKEN"

### 500 Server Error
- Check backend logs: `npm start`
- Check Python service: `python server/chatbot/app.py`
- Verify Gemini API key is valid

### Slow Responses
- Check network connection
- Verify Gemini API service status
- Check server resources

### No Response
- Verify both services are running
- Check CHATBOT_API_URL in Express .env
- Check Flask service health: `curl http://localhost:5001/health`

---

## Future Endpoints

Planned additions:
- `GET /api/chat/faq` - Get all FAQ items
- `POST /api/chat/feedback` - Rate response quality
- `GET /api/chat/history` - Get conversation history
- `POST /api/chat/export` - Export conversations

---

## Support

For issues:
1. Check endpoint documentation above
2. Verify request format matches examples
3. Check status codes and error messages
4. Review troubleshooting section
5. Check logs in both services

---

**Version:** 1.0.0  
**Last Updated:** November 2024  
**API Status:** Production Ready
