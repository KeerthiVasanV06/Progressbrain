import os
import json
import logging
import asyncio
from datetime import datetime
from typing import Dict, Optional, Any

import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# CHATBOT SERVICE USING GEMINI LLM
# ─────────────────────────────────────────────────────────────

class ChatbotService:
    """Handles all interactions with the Gemini LLM for user conversations."""

    def __init__(self):
        """Initialize Gemini API and model configuration."""
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")

        genai.configure(api_key=api_key)

        self.model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                top_p=0.95,
                top_k=40,
                max_output_tokens=1024
            )
        )

        self.chat_sessions: Dict[str, Any] = {}
        logger.info("ChatbotService initialized with Gemini API")

    # ─────────────────────────────────────────────────────────────
    # CHAT SESSION MANAGEMENT
    # ─────────────────────────────────────────────────────────────

    def get_or_create_chat_session(self, user_id: str, system_prompt: str):
        """Retrieve or create a persistent chat session for a user."""
        
        if user_id not in self.chat_sessions:
            self.chat_sessions[user_id] = self.model.start_chat(
                history=[
                    {"role": "user", "parts": ["[SYSTEM INITIALIZATION]"]},
                    {"role": "model", "parts": [system_prompt]}
                ]
            )
        return self.chat_sessions[user_id]

    def clear_session(self, user_id: str):
        """Delete stored chat session for a user."""
        if user_id in self.chat_sessions:
            del self.chat_sessions[user_id]
            logger.info(f"Cleared chat session for user {user_id}")

    # ─────────────────────────────────────────────────────────────
    # RESPONSE POST-PROCESSING (NEW SECTION)
    # ─────────────────────────────────────────────────────────────

    def format_response(self, text: str) -> str:
        """
        Convert plain text into:
        • Pointwise format
        • With emojis
        • And safe <br> HTML line breaks
        """

        # Replace newlines with HTML
        text = text.replace("\n", "<br>")

        # Ensure bullet formatting stays compact
        text = text.replace("•", "• ")

        return text

    # ─────────────────────────────────────────────────────────────
    # RESPONSE GENERATION CORE
    # ─────────────────────────────────────────────────────────────

    async def generate_response(
        self,
        user_message: str,
        user_id: str,
        system_prompt: str,
        context_prompt: str
    ) -> str:
        """Generate AI response using chat session and conversation context."""
        
        try:
            print(f"🤖 Generating response for user {user_id}")
            print(f"📨 Message: {user_message}")

            chat = self.get_or_create_chat_session(user_id, system_prompt)

            # Short, crisp, emoji-friendly instruction added:
            full_prompt = (
                "Respond in medium paragraphs"
                "Use emojis. Avoid long paragraphs. No greetings. "
                "Directly answer the user's question.<br><br>"
                f"{context_prompt}<br><br>{user_message}"
            )

            print(f"📤 Sending to Gemini...")

            response = chat.send_message(full_prompt)

            print(f"✅ Got response from Gemini")

            # Apply formatting before returning
            return self.format_response(response.text)

        except Exception as e:
            error_msg = str(e)
            print(f"❌ Error generating response: {error_msg}")
            logger.error(f"Error generating response: {error_msg}")
            return f"I encountered an error while processing your message. Please try again. Error: {error_msg}"

    # ─────────────────────────────────────────────────────────────
    # FEATURE EXPLANATION
    # ─────────────────────────────────────────────────────────────

    async def get_feature_explanation(self, feature_name: str, user_id: str) -> str:
        """Generate explanation about a specific ProgressBrain feature."""
        
        prompt = (
            f'Explain the "{feature_name}" feature of ProgressBrain in simple bullet points with emojis.'
        )

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.model.generate_content(prompt)
            )
            return self.format_response(response.text)

        except Exception as e:
            logger.error(f"Error getting feature explanation: {str(e)}")
            return "I couldn't generate an explanation. Please try again."

    # ─────────────────────────────────────────────────────────────
    # REGISTRATION GUIDANCE
    # ─────────────────────────────────────────────────────────────

    async def get_registration_guidance(self, step: int, user_id: str) -> str:
        """Provide encouraging guidance for a specific registration step."""
        
        prompt = (
            f"User is on registration step {step}. Give short, clear steps with emojis."
        )

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.model.generate_content(prompt)
            )
            return self.format_response(response.text)

        except Exception as e:
            logger.error(f"Error getting registration guidance: {str(e)}")
            return "I couldn't generate guidance. Please try again."

    # ─────────────────────────────────────────────────────────────
    # STUDY HELP GENERATION
    # ─────────────────────────────────────────────────────────────

    async def get_study_help(self, subject: str, topic: str, question: str, user_id: str) -> str:
        """Explain a study concept clearly with examples in bullet points."""
        
        prompt = (
            "Explain the following in bullet points with emojis:<br>"
            f"Subject: {subject}<br>"
            f"Topic: {topic}<br>"
            f"Question: {question}"
        )

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.model.generate_content(prompt)
            )
            return self.format_response(response.text)

        except Exception as e:
            logger.error(f"Error getting study help: {str(e)}")
            return "I couldn't generate study help. Please try again."

    # ─────────────────────────────────────────────────────────────
    # MOTIVATION GENERATION
    # ─────────────────────────────────────────────────────────────

    async def get_motivational_message(self, user_name: str = "", streak: int = 0, user_id: str = "") -> str:
        """Generate a personalized motivational message."""
        
        prompt = (
            "Give a short motivational message with emojis."
            f"{f' Name: {user_name}.' if user_name else ''}"
            f"{f' Streak: {streak} days.' if streak > 0 else ''}"
        )

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.model.generate_content(prompt)
            )
            return self.format_response(response.text)

        except Exception:
            logger.error("Error generating motivational message")
            return "Keep going! You're doing great! 💪✨"


# ─────────────────────────────────────────────────────────────
# GLOBAL CHATBOT SERVICE ACCESSOR
# ─────────────────────────────────────────────────────────────

_chatbot_service: Optional[ChatbotService] = None


def get_chatbot_service() -> ChatbotService:
    """Return global ChatbotService instance (singleton pattern)."""
    
    global _chatbot_service

    if _chatbot_service is None:
        _chatbot_service = ChatbotService()

    return _chatbot_service
