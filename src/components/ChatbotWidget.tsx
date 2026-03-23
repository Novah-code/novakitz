'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatbotWidgetProps {
  language?: 'en' | 'ko';
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ChatbotWidget({ language = 'en', isOpen: controlledOpen, onClose: controlledClose }: ChatbotWidgetProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? controlledOpen! : internalOpen;

  const setIsOpen = (val: boolean) => {
    if (isControlled) {
      if (!val && controlledClose) controlledClose();
    } else {
      setInternalOpen(val);
    }
  };

  const initialMessage = language === 'ko'
    ? '안녕하세요! Novakitz에 대한 질문이 있으시면 도와드릴게요.'
    : "Hi! I'm here to help with questions about Novakitz.";

  const faqQuestions = language === 'ko' ? [
    '프리미엄은 얼마예요?',
    'AI 해석은 몇 번 쓸 수 있나요?',
    '아키타입 테스트가 뭔가요?',
    '라이선스 키는 어떻게 입력하나요?',
  ] : [
    'How much is Premium?',
    'How many AI analyses do I get?',
    'What is the Archetype Test?',
    'How do I enter a license key?',
  ];

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: initialMessage }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contactSupportMode, setContactSupportMode] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Reset initial message when language changes
  useEffect(() => {
    setMessages([{ role: 'assistant', content: initialMessage }]);
  }, [language]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Contact support mode: send email instead of AI reply
    if (contactSupportMode) {
      setContactSupportMode(false);
      try {
        await fetch('/api/contact-support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages, language, userEmail: contactEmail || undefined })
        });
      } catch { /* silently fail */ }
      const replyEmail = contactEmail.trim();
      setContactEmail('');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: language === 'ko'
          ? `문의 내용을 받았어요! ${replyEmail ? replyEmail + ' 으로 빠른 시간 내에 연락드릴게요.' : '빠른 시간 내에 확인하고 연락드릴게요.'}`
          : `Got it!${replyEmail ? ` We'll reach out to ${replyEmail} as soon as possible.` : " We'll get back to you soon."}`
      }]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.ok) throw new Error('Failed');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || (language === 'ko' ? '죄송해요, 다시 시도해주세요.' : "Sorry, I couldn't process that.") }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: language === 'ko' ? '오류가 발생했어요. 다시 시도해주세요.' : 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: isControlled ? '24px' : '92px',
          right: '24px',
          width: '360px',
          maxWidth: 'calc(100vw - 48px)',
          height: '500px',
          maxHeight: 'calc(100vh - 120px)',
          backgroundColor: 'rgba(255, 255, 255, 0.97)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 4px 20px rgba(127, 176, 105, 0.15)',
          border: '1px solid rgba(127, 176, 105, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1100,
          animation: 'chatSlideUp 0.3s ease'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(127, 176, 105, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '20px 20px 0 0',
            background: 'linear-gradient(135deg, rgba(127, 176, 105, 0.08), rgba(127, 176, 105, 0.03))'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7fb069, #5a9a47)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937' }}>Novakitz Support</div>
                <div style={{ fontSize: '11px', color: '#7fb069', fontWeight: '500' }}>AI Assistant</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(0,0,0,0.06)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: '#6b7280',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)')}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            minHeight: 0,
            overscrollBehavior: 'contain'
          }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  backgroundColor: msg.role === 'user' ? '#7fb069' : '#f3f4f6',
                  color: msg.role === 'user' ? 'white' : '#1f2937',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  wordBreak: 'break-word'
                }}>
                  {msg.content.split(/(https?:\/\/[^\s]+)/g).map((part, j) =>
                    /^https?:\/\//.test(part)
                      ? <a key={j} href={part} target="_blank" rel="noopener noreferrer" style={{ color: msg.role === 'user' ? 'rgba(255,255,255,0.9)' : '#5a9a47', textDecoration: 'underline', wordBreak: 'break-all' }}>{part}</a>
                      : <span key={j} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '10px 16px',
                  borderRadius: '18px 18px 18px 4px',
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center'
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#9ca3af',
                      animation: `chatDot 1.2s ease-in-out ${i * 0.2}s infinite`
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />

            {/* FAQ Quick Chips — always visible */}
            {!isLoading && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '4px 0' }}>
                {faqQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const newMessages: Message[] = [...messages, { role: 'user', content: q }];
                      setMessages(newMessages);
                      setIsLoading(true);
                      fetch('/api/chatbot', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ messages: newMessages })
                      })
                        .then(r => r.ok ? r.json() : Promise.reject())
                        .then(data => setMessages(prev => [...prev, { role: 'assistant', content: data.reply || (language === 'ko' ? '죄송해요, 다시 시도해주세요.' : "Sorry, I couldn't process that.") }]))
                        .catch(() => setMessages(prev => [...prev, { role: 'assistant', content: language === 'ko' ? '오류가 발생했어요. 다시 시도해주세요.' : 'Sorry, something went wrong. Please try again.' }]))
                        .finally(() => setIsLoading(false));
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '16px',
                      border: '1.5px solid rgba(127, 176, 105, 0.4)',
                      backgroundColor: 'rgba(127, 176, 105, 0.08)',
                      color: '#5a9a47',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      lineHeight: '1.3'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = 'rgba(127, 176, 105, 0.18)';
                      e.currentTarget.style.borderColor = 'rgba(127, 176, 105, 0.7)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'rgba(127, 176, 105, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(127, 176, 105, 0.4)';
                    }}
                  >
                    {q}
                  </button>
                ))}

                {/* Contact Support button */}
                <button
                  onClick={() => {
                    setContactSupportMode(true);
                    const promptMsg = language === 'ko'
                      ? '문의사항을 남겨주시면 빠른 시간 내에 확인하고 연락드릴게요! 이메일과 문의 내용을 입력해 주세요.'
                      : "Leave your email and message below and we'll get back to you as soon as possible!";
                    setMessages(prev => [...prev, { role: 'assistant', content: promptMsg }]);
                    setTimeout(() => emailInputRef.current?.focus(), 100);
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '16px',
                    border: '1.5px solid rgba(239, 130, 80, 0.45)',
                    backgroundColor: 'rgba(239, 130, 80, 0.07)',
                    color: '#c25e28',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 130, 80, 0.16)';
                    e.currentTarget.style.borderColor = 'rgba(239, 130, 80, 0.7)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 130, 80, 0.07)';
                    e.currentTarget.style.borderColor = 'rgba(239, 130, 80, 0.45)';
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 5.18 5.18l.82-.82a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 20.73 16v2.91" />
                  </svg>
                  {language === 'ko' ? '상담사 연결' : 'Contact Support'}
                </button>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(127, 176, 105, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexShrink: 0
          }}>
            {contactSupportMode && (
              <input
                ref={emailInputRef}
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder={language === 'ko' ? '이메일 주소 (선택)' : 'Your email (optional)'}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '20px',
                  border: '1.5px solid rgba(239, 130, 80, 0.35)',
                  outline: 'none',
                  fontSize: '14px',
                  backgroundColor: '#fff8f5',
                  color: '#1f2937',
                  boxSizing: 'border-box'
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(239, 130, 80, 0.7)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(239, 130, 80, 0.35)')}
              />
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={contactSupportMode
                ? (language === 'ko' ? '문의 내용을 입력하세요...' : 'Describe your issue...')
                : (language === 'ko' ? '질문을 입력하세요...' : 'Ask a question...')
              }
              disabled={isLoading}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '10px 14px',
                borderRadius: '20px',
                border: '1.5px solid rgba(127, 176, 105, 0.25)',
                outline: 'none',
                fontSize: '16px',
                backgroundColor: '#f9fafb',
                color: '#1f2937',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(127, 176, 105, 0.6)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(127, 176, 105, 0.25)')}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              style={{
                width: '44px',
                height: '44px',
                minWidth: '44px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: input.trim() && !isLoading ? '#7fb069' : '#e5e7eb',
                color: 'white',
                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button — only in uncontrolled mode */}
      {!isControlled && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: isOpen
              ? 'linear-gradient(135deg, #5a9a47, #7fb069)'
              : 'linear-gradient(135deg, #7fb069, #5a9a47)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(127, 176, 105, 0.4), 0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1101,
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          title="Chat with support"
        >
          {isOpen ? (
            <span style={{ fontSize: '18px', fontWeight: '700' }}>✕</span>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          )}
        </button>
      )}

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
