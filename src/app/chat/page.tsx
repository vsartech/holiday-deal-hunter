'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase, ChatMessage } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  "What's the cheapest deal for Bangkok?",
  "Compare Dubai vs Singapore packages",
  "Best card offers for flight booking",
  "Plan a 5-day Bali itinerary",
  "Maldives honeymoon packages under 1 lakh",
  "Best time to visit Japan",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          sessionId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = { role: 'assistant', content: data.message };
      setMessages([...newMessages, assistantMessage]);

      // Save to Supabase
      await supabase.from('chat_conversations').insert([
        { session_id: sessionId, message_role: 'user', message_content: messageText },
        { session_id: sessionId, message_role: 'assistant', message_content: data.message },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages([...newMessages, errorMessage]);
    }
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div>
      <header className="header">
        <div className="container header-content">
          <h1>🏖️ Holiday Deal Hunter</h1>
          <nav>
            <a href="/">Deals</a>
            <a href="/analytics">Analytics</a>
            <a href="/chat">Chat Assistant</a>
          </nav>
        </div>
      </header>

      <main className="container" style={{ padding: '30px 20px' }}>
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card-header">
            <span className="card-title">💬 Holiday AI Assistant</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Powered by NVIDIA AI
            </span>
          </div>

          <div className="chat-container">
            <div className="chat-messages">
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>How can I help you plan your holiday?</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                    {SUGGESTIONS.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(suggestion)}
                        style={{
                          padding: '8px 16px',
                          border: '1px solid var(--border)',
                          borderRadius: '20px',
                          background: 'white',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.color = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.color = 'inherit';
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, i) => (
                <div
                  key={i}
                  className={`chat-message ${message.role === 'user' ? 'chat-user' : 'chat-assistant'}`}
                >
                  {message.content}
                </div>
              ))}

              {loading && (
                <div className="chat-message chat-assistant">
                  <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
              <input
                type="text"
                className="search-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about travel deals, destinations, or planning..."
                disabled={loading}
              />
              <button
                className="btn btn-primary"
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
