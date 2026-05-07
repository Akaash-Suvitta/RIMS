'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { streamAiChat } from '../../../services/ai-insights.service';

type Message = { role: 'user' | 'assistant'; content: string };

export default function AiPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    // Placeholder for the streaming assistant message
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    const stop = streamAiChat(
      { message: text },
      (token) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + token };
          }
          return updated;
        });
      },
      () => {
        setIsStreaming(false);
      },
      () => {
        setIsStreaming(false);
      },
    );

    stopRef.current = stop;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'DM Serif Display, serif', color: '#E8F0F8' }}>
          AI Intelligence
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#7A9BBD' }}>
          Ask questions about your regulatory portfolio
        </p>
      </div>

      <div className="flex gap-5" style={{ minHeight: '60vh' }}>
        {/* Left: Chat panel (60%) */}
        <div className="flex flex-col" style={{ flex: '0 0 60%' }}>
          <div
            className="flex flex-col overflow-hidden rounded-xl"
            style={{
              flex: 1,
              border: '1px solid rgba(56, 189, 248, 0.12)',
              backgroundColor: '#112238',
              minHeight: '400px',
            }}
          >
            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0 }}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
                  <Bot className="h-10 w-10" style={{ color: '#4A6A8A' }} />
                  <p className="text-sm" style={{ color: '#7A9BBD' }}>
                    Ask anything about your registrations, renewals, or submissions.
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: msg.role === 'user' ? 'rgba(0, 194, 168, 0.15)' : 'rgba(56, 189, 248, 0.1)',
                    }}
                  >
                    {msg.role === 'user' ? (
                      <User className="h-4 w-4" style={{ color: '#00C2A8' }} />
                    ) : (
                      <Bot className="h-4 w-4" style={{ color: '#38BDF8' }} />
                    )}
                  </div>
                  <div
                    className="max-w-[75%] rounded-xl px-4 py-2.5 text-sm"
                    style={{
                      backgroundColor: msg.role === 'user' ? 'rgba(0, 194, 168, 0.1)' : 'rgba(56, 189, 248, 0.06)',
                      color: '#E8F0F8',
                      border: msg.role === 'user'
                        ? '1px solid rgba(0, 194, 168, 0.2)'
                        : '1px solid rgba(56, 189, 248, 0.1)',
                    }}
                  >
                    {msg.content || (msg.role === 'assistant' && isStreaming ? (
                      <span style={{ color: '#4A6A8A' }}>…</span>
                    ) : null)}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div
              className="flex items-end gap-3 p-3"
              style={{ borderTop: '1px solid rgba(56, 189, 248, 0.1)' }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message… (Enter to send)"
                rows={1}
                className="flex-1 resize-none rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: 'rgba(11, 25, 41, 0.8)',
                  border: '1px solid rgba(56, 189, 248, 0.15)',
                  color: '#E8F0F8',
                  maxHeight: '120px',
                }}
                disabled={isStreaming}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleSend}
                disabled={isStreaming || !input.trim()}
              >
                {isStreaming ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Quick actions (40%) */}
        <div className="space-y-4" style={{ flex: '0 0 40%' }}>
          {/* Gap Analysis */}
          <Card>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold" style={{ color: '#E8F0F8' }}>Gap Analysis</h3>
                <p className="mt-1 text-sm" style={{ color: '#7A9BBD' }}>
                  Identify missing sections and documentation gaps in your dossier.
                </p>
              </div>
              <Button variant="secondary" size="sm" disabled>
                Coming soon
              </Button>
            </div>
          </Card>

          {/* Submission Readiness */}
          <Card>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold" style={{ color: '#E8F0F8' }}>Submission Readiness</h3>
                <p className="mt-1 text-sm" style={{ color: '#7A9BBD' }}>
                  Score your submission package and get actionable recommendations.
                </p>
              </div>
              <Button variant="secondary" size="sm" disabled>
                Coming soon
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
