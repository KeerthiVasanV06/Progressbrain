import express from "express";
import axios from "axios";
import { protect } from "../middleware/authMiddleware.js";
import UserModel from "../models/userModel.js";
import StudySessionModel from "../models/studySessionModel.js";

const router = express.Router();

// Store conversation contexts in memory (in production, use database)
const conversationContexts = new Map();

// Python backend URL (where chatbot service runs)
const CHATBOT_API_URL = process.env.CHATBOT_API_URL || "http://localhost:5001";

/**
 * Initialize or get user's chatbot context
 * POST /api/chat/init
 */
router.post("/init", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if context already exists
    if (!conversationContexts.has(userId)) {
      conversationContexts.set(userId, {
        user_id: userId,
        name: user.name,
        email: user.email,
        study_level: user.studyLevel || "beginner",
        subjects_of_interest: user.subjectsOfInterest || [],
        is_registered: true,
        preferences: {
          response_style: "friendly",
          response_length: "medium",
          humor_level: 0.5,
        },
        initialized_at: new Date().toISOString(),
      });
    }

    const context = conversationContexts.get(userId);

    res.json({
      success: true,
      message: "Chatbot context initialized",
      context: {
        user_name: context.name,
        user_id: userId,
        study_level: context.study_level,
      },
    });
  } catch (error) {
    console.error("Error initializing chatbot context:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send message to chatbot
 * POST /api/chat/message
 * Body: { message: string, subject?: string, topic?: string }
 */
router.post("/message", protect, async (req, res) => {
  try {
    const { message, subject, topic } = req.body;
    const userId = req.user.id;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get or create context
    if (!conversationContexts.has(userId)) {
      conversationContexts.set(userId, {
        user_id: userId,
        name: user.name,
        email: user.email,
        study_level: user.studyLevel || "beginner",
        subjects_of_interest: user.subjectsOfInterest || [],
        is_registered: true,
        preferences: {
          response_style: "friendly",
          response_length: "medium",
          humor_level: 0.5,
        },
      });
    }

    const context = conversationContexts.get(userId);
    if (subject) context.current_subject = subject;
    if (topic) context.current_topic = topic;

    // Call Python chatbot service
    try {
      console.log(`📤 Calling Flask at: ${CHATBOT_API_URL}/chat/generate`);
      console.log(`💬 Message from user ${userId}: ${message}`);
      
      // Prepare minimal context for Python service
      const minimalContext = {
        user_id: userId,
        name: context.name || "Student",
        email: context.email || "",
        study_level: context.study_level || "beginner",
        subjects_of_interest: context.subjects_of_interest || [],
        is_registered: context.is_registered || true,
      };
      
      console.log(`🔗 Making request to ${CHATBOT_API_URL}/chat/generate`);
      
      const chatResponse = await axios.post(
        `${CHATBOT_API_URL}/chat/generate`,
        {
          user_id: userId,
          user_message: message,
          context: minimalContext,
          subject: subject,
          topic: topic,
        },
        {
          timeout: 15000, // 15 second timeout
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log(`✅ Flask responded successfully with status ${chatResponse.status}`);

      // Update last message in context
      if (!context.last_messages) {
        context.last_messages = [];
      }
      context.last_messages.push({
        user: message,
        bot: chatResponse.data.response,
        timestamp: new Date().toISOString(),
      });

      // Keep only last 10 messages
      if (context.last_messages.length > 10) {
        context.last_messages = context.last_messages.slice(-10);
      }

      res.json({
        success: true,
        response: chatResponse.data.response,
        timestamp: new Date().toISOString(),
      });
    } catch (pythonError) {
      console.error("❌ Python chatbot service error:", pythonError.message);
      console.error("Error details:", {
        url: `${CHATBOT_API_URL}/chat/generate`,
        status: pythonError.response?.status,
        statusText: pythonError.response?.statusText,
        data: pythonError.response?.data,
        code: pythonError.code,
      });

      // Fallback response if Python service is unavailable
      const fallbackResponses = {
        study_sessions:
          "Study sessions help you maintain focus and track your learning time. Start a new session from the Study page by entering your subject, topic, and planned duration!",
        streaks:
          "Keep up your streak by completing at least one study session per day! Even short sessions count towards maintaining your consistency.",
        reports:
          "Check your Reports page to see detailed analytics about your study patterns, time spent on different subjects, and progress over time.",
        registration:
          "Registration is simple! Just provide your email, password, and basic study preferences. You'll be ready to start learning in minutes.",
        help:
          "I'm here to help! Ask me about ProgressBrain features, study techniques, registration, or anything related to your learning journey.",
        default: `Thanks for your message! I'm still connecting to my main system. Your message: "${message.substring(0, 50)}..." was received!`,
      };

      let fallbackResponse =
        fallbackResponses[
          Object.keys(fallbackResponses).find((key) =>
            message.toLowerCase().includes(key)
          ) || "default"
        ];

      res.json({
        success: true,
        response: fallbackResponse,
        timestamp: new Date().toISOString(),
        note: "Using fallback response - main AI service temporarily unavailable",
      });
    }
  } catch (error) {
    console.error("Error in chat message:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get feature explanation
 * POST /api/chat/explain-feature
 * Body: { feature: string }
 */
router.post("/explain-feature", protect, async (req, res) => {
  try {
    const { feature } = req.body;
    const userId = req.user.id;

    if (!feature) {
      return res.status(400).json({ error: "Feature name required" });
    }

    try {
      const chatResponse = await axios.post(`${CHATBOT_API_URL}/chat/feature-info`, {
        feature: feature,
        user_id: userId,
      });

      res.json({
        success: true,
        explanation: chatResponse.data.explanation,
      });
    } catch (pythonError) {
      // Fallback explanations
      const explanations = {
        study_sessions:
          "Study Sessions are focused learning periods tracked by ProgressBrain. Set a timer, choose your subject and topic, and the app will help you stay focused while tracking your progress!",
        streaks:
          "Streaks track your daily study consistency. Maintain your streak by studying at least once per day. Streaks help build consistent learning habits!",
        reports:
          "Reports provide detailed analytics about your study patterns including total time, subjects studied, session breakdown, and progress trends over time.",
        chatbot:
          "I'm your AI study assistant! I can help answer questions during study sessions, provide explanations, offer motivation, and guide you through ProgressBrain features.",
      };

      const explanation =
        explanations[feature.toLowerCase()] ||
        `I can help explain the ${feature} feature. What specifically would you like to know about it?`;

      res.json({
        success: true,
        explanation: explanation,
        note: "Using cached explanation",
      });
    }
  } catch (error) {
    console.error("Error explaining feature:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get registration guidance
 * POST /api/chat/registration-help
 * Body: { step: number }
 */
router.post("/registration-help", protect, async (req, res) => {
  try {
    const { step } = req.body;
    const userId = req.user.id;

    if (!step || step < 1 || step > 4) {
      return res.status(400).json({ error: "Invalid registration step (1-4)" });
    }

    try {
      const chatResponse = await axios.post(
        `${CHATBOT_API_URL}/chat/registration-guidance`,
        {
          step: step,
          user_id: userId,
        }
      );

      res.json({
        success: true,
        guidance: chatResponse.data.guidance,
      });
    } catch (pythonError) {
      const stepGuidance = {
        1: "Welcome! Let's start by creating your account. Choose a strong password and verify your email address. This ensures your account is secure!",
        2: "Now let's set up your profile! Tell us your name and what you'd like to study. This helps us personalize your experience.",
        3: "Choose your preferred study settings - how you'd like responses from the chatbot and any notification preferences.",
        4: "You're all set! Go to the Study page and create your first study session. Start with a manageable time like 25 minutes.",
      };

      res.json({
        success: true,
        guidance: stepGuidance[step],
        note: "Using standard guidance",
      });
    }
  } catch (error) {
    console.error("Error getting registration help:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get study help
 * POST /api/chat/study-help
 * Body: { subject: string, topic: string, question: string }
 */
router.post("/study-help", protect, async (req, res) => {
  try {
    const { subject, topic, question } = req.body;
    const userId = req.user.id;

    if (!subject || !topic || !question) {
      return res.status(400).json({
        error: "Subject, topic, and question are required",
      });
    }

    try {
      const chatResponse = await axios.post(`${CHATBOT_API_URL}/chat/study-help`, {
        subject: subject,
        topic: topic,
        question: question,
        user_id: userId,
      });

      res.json({
        success: true,
        help: chatResponse.data.help,
      });
    } catch (pythonError) {
      const genericHelp = `I'd be happy to help you understand ${topic} in ${subject}! Your question was: "${question.substring(0, 50)}...". 

Try breaking down the problem into smaller parts, looking for examples, or relating it to something you already know. What part is most confusing?`;

      res.json({
        success: true,
        help: genericHelp,
        note: "Using generic help - main AI temporarily unavailable",
      });
    }
  } catch (error) {
    console.error("Error getting study help:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get motivational message
 * GET /api/chat/motivation
 */
router.get("/motivation", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    try {
      // Get user's streak
      const sessions = await StudySessionModel.find({
        userId: userId,
        status: "completed",
      })
        .sort({ endTime: -1 })
        .limit(1);

      const streak = user.currentStreak || 0;

      const chatResponse = await axios.post(
        `${CHATBOT_API_URL}/chat/motivation`,
        {
          user_name: user.name,
          streak: streak,
          user_id: userId,
        }
      );

      res.json({
        success: true,
        message: chatResponse.data.message,
      });
    } catch (pythonError) {
      const motivations = [
        `${user.name}, you're doing amazing! Keep up this momentum!`,
        `Every study session brings you closer to your goals. You've got this!`,
        `Consistency is key! Keep building that streak!`,
        `${user.name}, your dedication is inspiring. Keep learning!`,
        `Progress beats perfection. You're making progress! 🚀`,
      ];

      const randomMotivation =
        motivations[Math.floor(Math.random() * motivations.length)];

      res.json({
        success: true,
        message: randomMotivation,
        note: "Using cached motivation",
      });
    }
  } catch (error) {
    console.error("Error getting motivation:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Clear user's chat context
 * POST /api/chat/clear
 */
router.post("/clear", protect, (req, res) => {
  try {
    const userId = req.user.id;
    conversationContexts.delete(userId);

    res.json({
      success: true,
      message: "Chat context cleared",
    });
  } catch (error) {
    console.error("Error clearing chat context:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

