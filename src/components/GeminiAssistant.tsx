import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { generateAIResponse, type AIResponse, type AISuggestion } from '../hooks/useAI';
import { useTasks } from '../hooks/useTasks';
import './GeminiAssistant.css';

interface GeminiAssistantProps {
  onClose: () => void;
  onAddTask?: (task: AISuggestion) => void;
}

interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
  id: string;
}

const QUICK_ACTIONS = [
  { 
    text: "Phân tích tasks hiện tại và đề xuất ưu tiên", 
    label: "📊 Phân tích tasks",
    icon: "📊"
  },
  { 
    text: "Gợi ý lịch trình làm việc cho ngày hôm nay", 
    label: "📅 Lịch trình hôm nay",
    icon: "📅"
  },
  { 
    text: "Đâu là các task quan trọng cần tập trung?", 
    label: "⚠️ Task ưu tiên",
    icon: "⚠️"
  },
  { 
    text: "Gợi ý các task mới dựa trên tasks hiện có", 
    label: "💡 Đề xuất task",
    icon: "💡"
  }
];

const INITIAL_MESSAGE: ChatMessage = {
  text: "👋 Xin chào! Tôi là NAVER AI Assistant. Tôi có thể giúp bạn:\n• Tạo task mới thông minh\n• Phân tích và tối ưu workflow\n• Gợi ý lịch trình cá nhân hóa\n• Tổng hợp tiến độ và dự báo\n\nHãy thử một trong các tùy chọn nhanh bên dưới hoặc hỏi tôi bất cứ điều gì!",
  isUser: false,
  timestamp: new Date(),
  id: 'initial-' + Date.now()
};

const GeminiAssistant = ({ onClose, onAddTask }: GeminiAssistantProps) => {
  const { tasks } = useTasks();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Tạo ID ngẫu nhiên cho message
  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isMinimized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, suggestions, scrollToBottom]);

  // Focus vào input khi component mount
  useEffect(() => {
    if (!isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isMinimized]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    // Thêm message người dùng
    const userMessage: ChatMessage = { 
      text: input, 
      isUser: true, 
      timestamp: new Date(),
      id: generateId()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Gọi AI với tasks hiện có
      const aiResponse = await generateAIResponse(input, tasks);
      setLastResponse(aiResponse);
      
      // Thêm phản hồi AI
      const aiMessage: ChatMessage = { 
        text: aiResponse.message, 
        isUser: false,
        timestamp: new Date(),
        id: generateId()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Hiển thị suggestions nếu có
      if (aiResponse.suggestions && aiResponse.suggestions.length > 0) {
        setSuggestions(aiResponse.suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('AI Response Error:', error);
      const errorMessage: ChatMessage = { 
        text: "⚠️ Rất tiếc, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại trong giây lát!", 
        isUser: false,
        timestamp: new Date(),
        id: generateId()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, tasks]);

  const handleAddTask = useCallback((suggestion: AISuggestion) => {
    if (onAddTask) {
      onAddTask(suggestion);
      // Hiệu ứng confirm khi thêm task
      setSuggestions(prev => prev.map(s => 
        s.title === suggestion.title 
          ? {...s, added: true} 
          : s
      ));
      
      // Ẩn suggestion sau 2 giây
      setTimeout(() => {
        setSuggestions(prev => prev.filter(s => s.title !== suggestion.title));
      }, 2000);
    }
  }, [onAddTask]);

  const handleQuickAction = useCallback((action: string) => {
    setInput(action);
    // Sử dụng setTimeout để đảm bảo state được cập nhật trước khi gửi
    setTimeout(() => handleSend(), 100);
  }, [handleSend]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  // Xóa toàn bộ lịch sử chat
  const clearChat = useCallback(() => {
    setMessages([INITIAL_MESSAGE]);
    setSuggestions([]);
  }, []);

  // Component cho typing indicator
  const TypingIndicator = useCallback(() => (
    <div className="message bot">
      <div className="message-content">
        <div className="typing-indicator">
          <span>NAVER AI đang suy nghĩ</span>
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      <div className="message-time">
        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  ), []);

  // Component cho message
  const MessageItem = useCallback(({ message }: { message: ChatMessage }) => (
    <div key={message.id} className={`message ${message.isUser ? 'user' : 'bot'}`}>
      <div className="message-avatar">
        {message.isUser ? '👤' : '🤖'}
      </div>
      <div className="message-content">
        {message.text.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < message.text.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
      <div className="message-time">
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  ), []);

  // Component cho suggestion cards
  const SuggestionCard = useCallback(({ suggestion, index }: { suggestion: AISuggestion & { added?: boolean }, index: number }) => (
    <div key={index} className={`suggestion-card ${suggestion.added ? 'added' : ''}`}>
      <div className="suggestion-content">
        <h5>{suggestion.title}</h5>
        {suggestion.description && (
          <p>{suggestion.description}</p>
        )}
        <div className="suggestion-meta">
          {suggestion.estimatedMinutes && (
            <span className="meta-item">⏱️ {suggestion.estimatedMinutes} phút</span>
          )}
          {suggestion.priority && (
            <span className={`priority priority-${suggestion.priority.toLowerCase()}`}>
              {suggestion.priority}
            </span>
          )}
          {suggestion.added && (
            <span className="added-confirm">✅ Đã thêm</span>
          )}
        </div>
      </div>
      {onAddTask && !suggestion.added && (
        <button 
          className="add-task-btn"
          onClick={() => handleAddTask(suggestion)}
          aria-label={`Thêm task ${suggestion.title}`}
        >
          Thêm Task
        </button>
      )}
    </div>
  ), [onAddTask, handleAddTask]);

  // Memoized message list
  const messageList = useMemo(() => (
    messages.map(message => (
      <MessageItem key={message.id} message={message} />
    ))
  ), [messages, MessageItem]);

  if (isMinimized) {
    return (
      <div className="gemini-assistant-minimized">
        <div className="minimized-header">
          <div className="minimized-title">
            <span className="gemini-icon">🤖</span>
            <span>NAVER AI</span>
          </div>
          <div className="minimized-actions">
            <button onClick={toggleMinimize} className="icon-btn" aria-label="Mở rộng">
              ↗
            </button>
            <button onClick={onClose} className="icon-btn" aria-label="Đóng">
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gemini-assistant">
      <div className="gemini-header">
        <div className="gemini-title">
          <span className="gemini-icon">🤖</span>
          <div className="title-content">
            <h3>NAVER AI Assistant</h3>
            <span className="gemini-status">Đang trực tuyến</span>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={clearChat} className="icon-btn" aria-label="Xóa chat">
            🗑️
          </button>
          <button onClick={toggleMinimize} className="icon-btn" aria-label="Thu nhỏ">
            −
          </button>
          <button onClick={onClose} className="icon-btn" aria-label="Đóng">
            ✕
          </button>
        </div>
      </div>

      <div className="gemini-chat" ref={chatContainerRef}>
        {/* Quick Actions */}
        <div className="quick-actions">
          <h4>Hành động nhanh</h4>
          <div className="quick-actions-grid">
            {QUICK_ACTIONS.map((action, index) => (
              <button 
                key={index}
                onClick={() => handleQuickAction(action.text)} 
                className="quick-btn"
                disabled={isLoading}
              >
                <span className="quick-icon">{action.icon}</span>
                <span className="quick-label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="gemini-messages">
          {messageList}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} className="scroll-anchor" />
        </div>

        {suggestions.length > 0 && (
          <div className="suggestions-section">
            <div className="suggestions-header">
              <h4>💡 Đề xuất từ AI</h4>
              <button 
                onClick={() => setSuggestions([])} 
                className="icon-btn"
                aria-label="Ẩn đề xuất"
              >
                ✕
              </button>
            </div>
            <div className="suggestions-grid">
              {suggestions.map((suggestion, index) => (
                <SuggestionCard key={index} suggestion={suggestion} index={index} />
              ))}
            </div>
          </div>
        )}

        <div className="gemini-input-container">
          <div className="gemini-input">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập câu hỏi hoặc yêu cầu của bạn..."
              disabled={isLoading}
              aria-label="Nhập tin nhắn cho trợ lý ảo"
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className="send-button"
              aria-label="Gửi tin nhắn"
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
                </svg>
              )}
            </button>
          </div>
          <div className="input-hint">
            Nhấn Enter để gửi • Shift+Enter để xuống dòng
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(GeminiAssistant);