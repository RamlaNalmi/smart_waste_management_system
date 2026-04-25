import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function ChatBotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(Math.random().toString(36).substring(7));
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(sessionId);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
    loadChatHistory(sessionId);
  }, []);

  // Load chat history when session changes
  useEffect(() => {
    if (activeSession) {
      loadChatHistory(activeSession);
    }
  }, [activeSession]);

  const loadSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/chat/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadChatHistory = async (sId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/chat/history/${sId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const history = await response.json();
        setMessages(history);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message to UI
    const userMessage = {
      _id: Date.now(),
      message: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    const messageText = input;
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: messageText,
          sessionId: activeSession
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage = {
          _id: Date.now() + 1,
          message: data.message,
          role: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = {
          _id: Date.now() + 1,
          message: 'Sorry, I encountered an error. Please try again.',
          role: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        _id: Date.now() + 1,
        message: 'Error connecting to chatbot. Please ensure the backend is running.',
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = () => {
    const newSessionId = Math.random().toString(36).substring(7);
    setSessionId(newSessionId);
    setActiveSession(newSessionId);
    setMessages([]);
    loadSessions();
  };

  return (
    <div className="h-full flex bg-light-grey">
      {/* Sidebar with Sessions */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={startNewSession}
            className="w-full flex items-center justify-center gap-2 bg-civic-blue text-white px-4 py-2 rounded-lg hover:bg-steel-blue transition"
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs text-gray-500 font-semibold mb-3">Recent Conversations</p>
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-400">No conversations yet</p>
          ) : (
            sessions.map((session) => (
              <button
                key={session._id}
                onClick={() => setActiveSession(session._id)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-2 transition ${
                  activeSession === session._id
                    ? 'bg-civic-blue text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <p className="text-sm truncate">Session {session._id}</p>
                <p className="text-xs opacity-70">
                  {session.messageCount} messages
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-civic-blue to-steel-blue text-white p-4">
          <div className="flex items-center gap-2">
            <MessageCircle size={24} />
            <div>
              <h2 className="font-bold text-lg">Smart Waste Assistant</h2>
              <p className="text-sm opacity-90">Ask anything about waste management</p>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageCircle size={64} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg mb-2">No messages yet</p>
                <p className="text-gray-400 text-sm">Start typing to begin a conversation</p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-2xl px-6 py-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-civic-blue text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="text-base">{msg.message}</p>
                  <span className="text-xs opacity-70 mt-2 block">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 px-6 py-3 rounded-lg rounded-bl-none shadow-sm">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-civic-blue rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-civic-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 h-3 bg-civic-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={sendMessage} className="border-t border-gray-200 p-4 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-blue disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-civic-blue text-white px-6 py-3 rounded-lg hover:bg-steel-blue transition disabled:opacity-50 flex items-center gap-2"
            >
              <Send size={20} />
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatBotPage;