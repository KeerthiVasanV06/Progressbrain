from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from dotenv import load_dotenv
import asyncio

# Import chatbot modules
from chatbot_service import get_chatbot_service
from chatbot_context import ChatbotContext, UserProfile

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Global chatbot instance
chatbot_service = get_chatbot_service()

# Per-user contexts
user_contexts = {}


# -------------------------------------------------------------------------
# Context Management
# -------------------------------------------------------------------------
def get_user_context(user_id: str, user_data: dict = None) -> ChatbotContext:
    """Retrieve or create a user's ChatbotContext."""
    if user_id not in user_contexts:
        profile = UserProfile(
            user_id=user_id,
            name=user_data.get("name", "") if user_data else "",
            email=user_data.get("email", "") if user_data else "",
            study_level=user_data.get("study_level", "beginner") if user_data else "beginner",
            subjects_of_interest=user_data.get("subjects_of_interest", []) if user_data else [],
            is_registered=user_data.get("is_registered", True) if user_data else True,
        )
        user_contexts[user_id] = ChatbotContext(profile)

    return user_contexts[user_id]


# -------------------------------------------------------------------------
# Health Check
# -------------------------------------------------------------------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "ProgressBrain Chatbot API",
        "version": "1.0.0"
    }), 200


# -------------------------------------------------------------------------
# Chat Response Generation
# -------------------------------------------------------------------------
@app.route("/chat/generate", methods=["POST"])
def generate_response():
    try:
        data = request.json
        user_id = data.get("user_id")
        user_message = data.get("user_message")
        context = data.get("context", {})
        subject = data.get("subject")
        topic = data.get("topic")

        if not user_id or not user_message:
            return jsonify({"error": "user_id and user_message are required"}), 400

        # Retrieve or create context
        user_ctx = get_user_context(user_id, context)

        # Update user profile fields
        user_ctx.user_profile.name = context.get("name", user_ctx.user_profile.name)
        user_ctx.user_profile.email = context.get("email", user_ctx.user_profile.email)
        user_ctx.user_profile.study_level = context.get("study_level", user_ctx.user_profile.study_level)
        user_ctx.user_profile.subjects_of_interest = context.get(
            "subjects_of_interest",
            user_ctx.user_profile.subjects_of_interest
        )
        user_ctx.user_profile.is_registered = context.get(
            "is_registered",
            user_ctx.user_profile.is_registered
        )

        if "preferences" in context:
            user_ctx.user_profile.preferences.update(context["preferences"])

        # Build prompts
        system_prompt = user_ctx.build_system_prompt()
        context_prompt = user_ctx.get_response_prompt(user_message)

        # Generate chatbot response
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            response = loop.run_until_complete(
                chatbot_service.generate_response(
                    user_message=user_message,
                    user_id=user_id,
                    system_prompt=system_prompt,
                    context_prompt=context_prompt
                )
            )
        finally:
            loop.close()

        # Save conversation memory
        user_ctx.memory.add_exchange(
            user_message,
            response,
            {"subject": subject, "topic": topic}
        )

        return jsonify({
            "response": response,
            "timestamp": user_ctx.session_start_time.isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Error in generate_response: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------------------------------
# Feature Info
# -------------------------------------------------------------------------
@app.route("/chat/feature-info", methods=["POST"])
def feature_info():
    try:
        data = request.json
        feature = data.get("feature")
        user_id = data.get("user_id")

        if not feature:
            return jsonify({"error": "feature is required"}), 400

        user_ctx = get_user_context(user_id)
        feature_data = user_ctx.knowledge_base.get_feature_info(feature)

        if not feature_data:
            return jsonify({"error": f"Feature '{feature}' not found"}), 404

        explanation_prompt = f"""
Explain the '{feature}' feature of ProgressBrain in a beginner-friendly, clear way.

Feature Details:
- Description: {feature_data['description']}
- How to use: {feature_data['how_to']}
- Benefits: {', '.join(feature_data['benefits'])}
- Tips: {', '.join(feature_data['tips'])}

Write an engaging explanation combining these elements.
"""

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            response = loop.run_until_complete(
                chatbot_service.model.generate_content(explanation_prompt)
            )
            explanation = response.text
        finally:
            loop.close()

        return jsonify({
            "explanation": explanation,
            "feature": feature
        }), 200

    except Exception as e:
        logger.error(f"Error in feature_info: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------------------------------
# Registration Guidance
# -------------------------------------------------------------------------
@app.route("/chat/registration-guidance", methods=["POST"])
def registration_guidance():
    try:
        data = request.json
        step = data.get("step", 1)
        user_id = data.get("user_id")

        if step < 1 or step > 4:
            return jsonify({"error": "Step must be 1–4"}), 400

        user_ctx = get_user_context(user_id)
        step_data = user_ctx.knowledge_base.get_registration_step(step)

        if not step_data:
            return jsonify({"error": f"Step {step} not found"}), 404

        guidance_prompt = f"""
Provide warm, encouraging guidance for Step {step} of ProgressBrain registration.

Step Title: {step_data['title']}
Description: {step_data['description']}
Fields Required: {', '.join(step_data['fields'])}
Tips: {', '.join(step_data['tips'])}
{f"Action: {step_data['action']}" if "action" in step_data else ""}

Help the user feel confident and informed.
"""

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            response = loop.run_until_complete(
                chatbot_service.model.generate_content(guidance_prompt)
            )
            guidance = response.text
        finally:
            loop.close()

        return jsonify({"guidance": guidance, "step": step}), 200

    except Exception as e:
        logger.error(f"Error in registration_guidance: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------------------------------
# Study Help
# -------------------------------------------------------------------------
@app.route("/chat/study-help", methods=["POST"])
def study_help():
    try:
        data = request.json
        subject = data.get("subject")
        topic = data.get("topic")
        question = data.get("question")
        user_id = data.get("user_id")

        if not all([subject, topic, question]):
            return jsonify({"error": "subject, topic, and question are required"}), 400

        user_ctx = get_user_context(user_id)

        study_prompt = f"""
Help a student understand a concept clearly.

Subject: {subject}
Topic: {topic}
Question: {question}

Use simple explanation, examples, analogies, and encouragement.
Keep it conversational and friendly.
"""

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            response = loop.run_until_complete(
                chatbot_service.model.generate_content(study_prompt)
            )
            help_text = response.text
        finally:
            loop.close()

        # Save memory
        user_ctx.memory.add_exchange(
            question,
            help_text,
            {"subject": subject, "topic": topic}
        )

        return jsonify({
            "help": help_text,
            "subject": subject,
            "topic": topic
        }), 200

    except Exception as e:
        logger.error(f"Error in study_help: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------------------------------
# Motivation Message
# -------------------------------------------------------------------------
@app.route("/chat/motivation", methods=["POST"])
def motivation():
    try:
        data = request.json
        user_name = data.get("user_name", "Friend")
        streak = data.get("streak", 0)
        user_id = data.get("user_id")

        motivation_prompt = f"""
Generate a short, positive motivational message.

Name: {user_name}
Streak: {f'{streak}-day streak!' if streak > 0 else 'Just beginning.'}

Make it supportive, warm, and under 3 sentences.
"""

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            response = loop.run_until_complete(
                chatbot_service.model.generate_content(motivation_prompt)
            )
            message = response.text
        finally:
            loop.close()

        return jsonify({"message": message}), 200

    except Exception as e:
        logger.error(f"Error in motivation: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------------------------------
# FAQ
# -------------------------------------------------------------------------
@app.route("/chat/faq", methods=["GET"])
def get_faq():
    try:
        temp_ctx = get_user_context("temp")
        faq_items = [
            {"question": item["q"], "answer": item["a"]}
            for _, item in temp_ctx.knowledge_base.FAQ.items()
        ]
        return jsonify({"faq": faq_items}), 200

    except Exception as e:
        logger.error(f"Error in get_faq: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------------------------------
# Clear Context
# -------------------------------------------------------------------------
@app.route("/chat/clear", methods=["POST"])
def clear_context():
    try:
        data = request.json
        user_id = data.get("user_id")

        if user_id in user_contexts:
            del user_contexts[user_id]
            chatbot_service.clear_session(user_id)

        return jsonify({"message": "Context cleared successfully"}), 200

    except Exception as e:
        logger.error(f"Error in clear_context: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------------------------------
# Server Start
# -------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.getenv("CHATBOT_PORT", 5001))
    logger.info(f"Starting ProgressBrain Chatbot API on port {port}")
    app.run(
        host="0.0.0.0",
        port=port,
        debug=os.getenv("FLASK_ENV") == "development"
    )
