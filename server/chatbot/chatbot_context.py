import os
import json
import logging
from datetime import datetime
from dataclasses import dataclass, asdict, field
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# USER PROFILE
# ─────────────────────────────────────────────────────────────

@dataclass
class UserProfile:
    """Represents a user profile including preferences and conversation history."""
    
    user_id: str
    name: str = ""
    email: str = ""
    study_level: str = ""  
    subjects_of_interest: List[str] = field(default_factory=list)
    conversation_history: List[Dict] = field(default_factory=list)
    
    preferences: Dict[str, Any] = field(default_factory=lambda: {
        "response_style": "friendly",
        "response_length": "short",
        "humor_level": 0.3,
        "language": "English",
        "timezone": "UTC"
    })
    
    registration_step: int = 0
    is_registered: bool = False
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    last_updated: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict:
        return asdict(self)


# ─────────────────────────────────────────────────────────────
# CONVERSATION MEMORY
# ─────────────────────────────────────────────────────────────

class ConversationMemory:
    """Handles conversation history, context, and topic extraction."""

    def __init__(self, max_history: int = 20):
        self.max_history = max_history
        self.conversation_context: List[Dict] = []
        self.current_topic: Optional[str] = None
        self.context_summary: str = ""
        self.topics_discussed: set = set()

    def add_exchange(self, user_input: str, bot_response: str, context_info: Optional[Dict] = None):
        exchange = {
            "timestamp": datetime.now().isoformat(),
            "user": user_input,
            "bot": bot_response,
            "topic": self.current_topic,
            "context": context_info or {}
        }

        self.conversation_context.append(exchange)

        if len(self.conversation_context) > self.max_history:
            self.conversation_context = self.conversation_context[-self.max_history:]

    def get_context_for_llm(self) -> str:
        if not self.conversation_context:
            return "Start of conversation."

        recent = self.conversation_context[-5:]
        formatted = "Recent conversation:<br>"

        for i, ex in enumerate(recent, 1):
            formatted += f"{i}. User: {ex['user']}<br>   Bot: {ex['bot']}<br>"

        return formatted

    def extract_topic(self, text: str) -> str:
        text_lower = text.lower()

        topics = {
            "registration": ["register", "sign up", "create account", "onboarding"],
            "study_sessions": ["study", "session", "timer", "focus", "concentrate"],
            "streaks": ["streak", "consistency", "daily study"],
            "reports": ["report", "analytics", "statistics", "insights"],
            "settings": ["settings", "preferences", "profile", "update"],
            "features": ["feature", "explain", "tell me about"],
            "help": ["help", "support", "issue", "problem", "error"],
            "motivation": ["motivation", "encourage", "tips"],
            "general": []
        }

        for topic, keywords in topics.items():
            if any(keyword in text_lower for keyword in keywords):
                self.current_topic = topic
                self.topics_discussed.add(topic)
                return topic

        self.current_topic = "general"
        return "general"


# ─────────────────────────────────────────────────────────────
# KNOWLEDGE BASE
# ─────────────────────────────────────────────────────────────

class ProgressBrainKnowledgeBase:

    WEBSITE_INFO = {
        "name": "ProgressBrain",
        "description": "A study tracking and productivity platform.",
        "mission": "Help learners stay consistent and improve using data + AI.",
        "launch_year": 2024
    }

    FEATURES = {
        "study_sessions": {
            "description": "Track and manage focused study sessions.",
            "how_to": "Go to Study → Enter subject → Pick duration → Start.",
            "benefits": ["Stay focused", "Track progress", "Improve consistency"],
            "tips": ["Use Pomodoro", "Short breaks help"]
        },
        "streaks": {
            "description": "Track daily learning consistency.",
            "how_to": "Do at least one study session daily.",
            "benefits": ["Build habits", "Improve discipline"],
            "tips": ["Even 10 minutes counts"]
        },
        "reports": {
            "description": "Analytics of your study patterns.",
            "how_to": "Open Reports page.",
            "benefits": ["Spot trends", "Fix weak areas"],
            "tips": ["Check weekly for insights"]
        },
        "chatbot": {
            "description": "AI assistant for study help.",
            "how_to": "Ask anything anytime.",
            "benefits": ["Quick answers", "Clear breakdowns"],
            "tips": ["Be specific with questions"]
        },
        "settings": {
            "description": "Personalize your learning experience.",
            "how_to": "Open Settings.",
            "benefits": ["More control over responses"],
            "tips": ["Update preferences regularly"]
        }
    }

    REGISTRATION_FLOW = {
        "step_1": {
            "title": "Create Account",
            "description": "Register using email + password.",
            "fields": ["Email", "Password", "Confirm Password"],
            "tips": ["Use a strong password"]
        },
        "step_2": {
            "title": "Profile Setup",
            "description": "Enter study details.",
            "fields": ["Full Name", "Study Level", "Subjects"],
            "tips": ["Choose accurate levels"]
        },
        "step_3": {
            "title": "Preferences",
            "description": "Set learning preferences.",
            "fields": ["Response Style", "Notifications"],
            "tips": ["Conversational tone works well"]
        },
        "step_4": {
            "title": "Start Learning",
            "description": "Begin your study journey.",
            "action": "Start first session",
            "tips": ["Explore features"]
        }
    }

    FAQ = {
        "q_session_duration": {
            "q": "Recommended session duration?",
            "a": "25–50 minutes is ideal, but you can choose from 1–480 minutes."
        },
        "q_streak_rules": {
            "q": "How do streaks work?",
            "a": "Study once daily to maintain your streak."
        },
        "q_data_privacy": {
            "q": "Is my data safe?",
            "a": "Yes — encrypted & protected."
        }
    }

    @classmethod
    def get_feature_info(cls, feature_name: str) -> Optional[Dict]:
        return cls.FEATURES.get(feature_name.lower())

    @classmethod
    def get_registration_step(cls, step: int) -> Optional[Dict]:
        return cls.REGISTRATION_FLOW.get(f"step_{step}")

    @classmethod
    def search_faq(cls, query: str) -> Optional[Dict]:
        query_lower = query.lower()
        for data in cls.FAQ.values():
            if any(word in query_lower for word in data["q"].lower().split()):
                return data
        return None


# ─────────────────────────────────────────────────────────────
# CHATBOT CONTEXT / SYSTEM PROMPTS
# ─────────────────────────────────────────────────────────────

class ChatbotContext:
    """Builds the system prompt controlling assistant behavior."""

    def __init__(self, user_profile: UserProfile):
        self.user_profile = user_profile
        self.memory = ConversationMemory()
        self.knowledge_base = ProgressBrainKnowledgeBase()
        self.session_start_time = datetime.now()
        self.interaction_count = 0

    def build_system_prompt(self) -> str:
        """
        Defines:
        - Bot personality (clean, friendly, compact)
        - No greetings unless user greets first
        """

        prompt = f"""
You are **ProgressBrain**, an intelligent, friendly, crisp AI study assistant.

## 🎯 Personality
- Helpful, supportive, and short-spoken  
- NEVER mention your model, backend, or being an LLM  
- No repeating long intros or greetings

## 📝 Mandatory Response Style  
Always answer short and directly using this style:
- 2–4 bullet points (if relevant)  
- 1–3 emojis max  
- 8. Never use <br>. Use real line breaks using "\n"
- No greetings unless the user greets first  
- Do NOT restate the question  
- Do NOT talk about yourself unless asked  

## 👤 User Info
- Name: {self.user_profile.name or "Friend"}  
- Study Level: {self.user_profile.study_level or "Not given"}  
- Registered: {"Yes" if self.user_profile.is_registered else "No"}  

## 🔍 Platform Info
{json.dumps(ProgressBrainKnowledgeBase.WEBSITE_INFO, indent=2)}

## 💬 Recent Conversation
{self.memory.get_context_for_llm()}

Stay short, useful, and friendly.
"""
        return prompt

    def get_response_prompt(self, user_message: str) -> str:
        topic = self.memory.extract_topic(user_message)
        topics_discussed = ", ".join(self.memory.topics_discussed) or "None"
        context = self.memory.get_context_for_llm()

        return f"""
User Message: {user_message}

Current Topic: {topic}  
Topics Discussed: {topics_discussed}  
Conversation Context:<br>{context}

Respond following all formatting rules.
"""