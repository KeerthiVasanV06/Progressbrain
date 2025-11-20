// ChatBot.jsx
import React, { useState, useRef, useEffect, useContext } from 'react';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/ChatBot.module.css';

const ChatBot = ({ subject = 'General', topic = 'Learning' }) => {
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `Hi! I'm your AI study assistant. I'm here to help you with ${topic} in ${subject}. Feel free to ask me anything!`,
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const messageIdRef = useRef(2);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    const userMessage = {
      id: messageIdRef.current++,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    const userInput = inputValue;
    setInputValue('');
    setIsLoading(true);
    setError('');

    try {
      const response = await API.post('/api/chat/message', {
        message: userInput,
        subject,
        topic,
      });

      if (response.data.success) {
        const botMessage = {
          id: messageIdRef.current++,
          text: response.data.response,
          sender: 'bot',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
      } else {
        setError('Failed to get response. Please try again.');
      }
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackError = err.response?.data?.error || 'Connection error. Please try again.';

      setError(fallbackError);

      const errorMsg = {
        id: messageIdRef.current++,
        text: `Sorry, I encountered an error: ${fallbackError}. Please try again or ask something else.`,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.chatbotContainer}>
      <div className={styles.chatHeader}>
        <h3 className={styles.chatTitle}>🤖 AI Study Assistant</h3>
        <p className={styles.chatSubtitle}>{subject} - {topic}</p>
      </div>

      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${
              message.sender === 'user' ? styles.userMessage : styles.botMessage
            }`}
          >
            <div className={styles.messageBubble}>
              {message.sender === 'bot' && <span className={styles.botIcon}>🤖</span>}

              {/* FIXED: bot messages now render <br> and formatting */}
              {message.sender === 'bot' ? (
                <p
                  className={styles.messageText}
                  dangerouslySetInnerHTML={{ __html: message.text }}
                />
              ) : (
                <p className={styles.messageText}>{message.text}</p>
              )}

              {message.sender === 'user' && <span className={styles.userIcon}>👤</span>}
            </div>

            <span className={styles.timestamp}>
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className={styles.loadingMessage}>
            <div className={styles.loadingDot}></div>
            <div className={styles.loadingDot}></div>
            <div className={styles.loadingDot}></div>
          </div>
        )}

        {error && (
          <div className={styles.message} style={{ justifyContent: 'center' }}>
            <div
              style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                maxWidth: '80%',
              }}
            >
              ⚠️ {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className={styles.inputContainer}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask me anything about your study topic..."
          className={styles.input}
          disabled={isLoading}
        />

        <button
          type="submit"
          className={styles.sendBtn}
          disabled={isLoading || !inputValue.trim()}
        >
          ➤
        </button>
      </form>
    </div>
  );
};

export default ChatBot;
