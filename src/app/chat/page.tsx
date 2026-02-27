'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, Send, Sparkles, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.role === 'user';
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();

    // Basic markdown stripping for cleaner speech
    // Removes **, *, ##, and links
    const cleanText = message.content
      .replace(/[*_~`#]+/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/<[^>]*>?/gm, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  // Stop playing if component unmounts
  useEffect(() => {
    return () => {
      if (isPlaying && typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`
        flex max-w-[85%] md:max-w-[75%] 
        ${isUser ? 'flex-row-reverse' : 'flex-row'} 
        items-end gap-2
      `}>
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
        )}

        <div className={`
          relative px-5 py-3.5 rounded-2xl shadow-sm text-[15px] leading-relaxed
          ${isUser
            ? 'bg-gradient-to-br from-teal-600 to-emerald-600 text-white rounded-br-none'
            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
          }
        `}>
          <p className="whitespace-pre-wrap">{message.content}</p>
          <div className={`text-[10px] mt-1.5 opacity-70 flex items-center gap-2 ${isUser ? 'justify-end text-teal-50' : 'text-gray-400 justify-between'}`}>
            <div className="flex items-center gap-1">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {isUser && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            </div>
            {!isUser && (
              <button
                onClick={toggleSpeech}
                className={`p-1 hover:bg-gray-100 rounded-md transition-colors ${isPlaying ? 'text-teal-600 bg-teal-50' : ''}`}
                title="Read aloud"
              >
                {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function ChatContent() {
  const searchParams = useSearchParams();
  const initialSymptoms = searchParams.get('symptoms') || '';
  const initialAnalysis = searchParams.get('analysis') || '';
  const { t, languageName } = useLanguage();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Setup Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = languageName === 'English' ? 'en-US' : (languageName.substring(0, 2) + '-IN'); // Basic localization map

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              setInput((prev) => prev + event.results[i][0].transcript + ' ');
            } else {
              currentTranscript += event.results[i][0].transcript;
            }
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.warn('Speech recognition warning:', event.error);
          setIsListening(false);

          if (event.error === 'not-allowed') {
            alert("Microphone access was denied. Please check your browser's site settings and allow microphone access to use Voice Typing.");
          } else if (event.error === 'network') {
            alert("A network error occurred while trying to use speech recognition.");
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [languageName]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      // Don't clear input, just append
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Could not start speech recognition:", e);
        alert("Your browser might not support speech recognition, or it is currently busy. Please try again.");
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: initialSymptoms
        ? `Hello! I'm **HealthLens AI**. I see you've recently analyzed some symptoms. I'm here to answer any follow-up questions you might have. \n\n*Note: I provide general health information only and am not a substitute for professional medical advice.* \n\nHow can I help you today?`
        : `👋 **Hi there! I'm HealthLens AI.**\n\nI can help you with:\n• General health questions\n• Understanding symptoms\n• Wellness tips\n\n*Remember: Always consult a healthcare professional for medical advice.*\n\nHow can I help you today?`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [initialSymptoms]);

  const handleReset = () => {
    const welcome = messages.find(m => m.id === 'welcome');
    if (welcome) {
      setMessages([welcome]);
    } else {
      setMessages([]);
    }
    inputRef.current?.focus();
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const apiMessages = [...messages.filter(m => m.id !== 'welcome'), userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          context: initialSymptoms ? {
            symptoms: initialSymptoms,
            analysis: initialAnalysis
          } : undefined,
          language: languageName, // Pass language to the API
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t.common?.error || "I'm sorry, I encountered an error processing your message. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="h-[calc(100dvh-64px)] overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50 via-gray-50 to-white px-3 py-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-1 md:px-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                {t.chat.title}
              </h1>
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                {t.chat.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 text-gray-400 hover:text-teal-600 hover:bg-white rounded-full transition-all"
              title="Start New Chat"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <Link href="/" className="px-4 py-2 bg-white text-gray-600 text-sm font-medium rounded-full shadow-sm hover:shadow transition-all">
              Exit
            </Link>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50 flex flex-col overflow-hidden relative">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
            <AnimatePresence initial={false} mode='popLayout'>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gray-50 px-4 py-3 rounded-2xl rounded-bl-none border border-gray-100 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  </div>
                  <span className="text-xs text-gray-400 animate-pulse">{t.common?.loading || 'Thinking...'}</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions (Suggested Questions) */}
          <AnimatePresence>
            {messages.length <= 1 && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="px-6 pb-2"
              >
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {t.chat.suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestedQuestion(q)}
                      className="whitespace-nowrap px-4 py-2 bg-gray-50 hover:bg-teal-50 text-gray-600 hover:text-teal-700 text-xs font-medium rounded-full border border-gray-100 hover:border-teal-200 transition-all duration-200 active:scale-95"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Area */}
          <div className="p-4 md:p-5 bg-white border-t border-gray-50">
            <form
              onSubmit={handleSubmit}
              className="relative flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.chat.inputPlaceholder}
                className="w-full pl-5 pr-14 py-4 bg-gray-50 border-0 rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all outline-none"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={toggleListen}
                className={`absolute right-14 p-2 rounded-xl transition-all flex items-center justify-center ${isListening
                  ? 'bg-red-100 text-red-600 animate-pulse'
                  : 'bg-transparent text-gray-400 hover:text-teal-600 hover:bg-gray-100'
                  }`}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl text-white shadow-md disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
            <p className="text-[10px] text-gray-400 mt-3 text-center flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500/50" />
              {t.chat.disclaimer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
