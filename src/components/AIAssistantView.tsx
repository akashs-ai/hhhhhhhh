import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Send,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Calendar,
  Clock,
  Building2,
  AlertTriangle,
  User,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Database,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { UserItem } from '../types';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  mode?: 'database' | 'beta';
  source?: string;
}

interface QuestionItem {
  id: string;
  question: string;
  category: string;
  audience?: string;
}

interface AIAssistantViewProps {
  currentUser: UserItem;
  roleType: 'admin' | 'faculty' | 'student';
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  General: HelpCircle,
  Student: BookOpen,
  Faculty: Calendar,
  Scheduling: ShieldCheck,
  Administration: Building2,
  'Accounts & Support': Info,
};

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ currentUser, roleType }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ code: string; message: string; lastQuestionId?: string } | null>(null);

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load active suggested questions from PostgreSQL / Backend Catalog
  useEffect(() => {
    let isMounted = true;
    const fetchQuestions = async () => {
      setIsLoadingQuestions(true);
      try {
        const token = currentUser.token || localStorage.getItem('cit_auth_token') || '';
        const res = await fetch('/api/assistant/questions', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.questions)) {
          setQuestions(data.questions);
        }
      } catch (err) {
        console.warn('[Assistant] Could not load questions catalog, using default schema:', err);
      } finally {
        if (isMounted) setIsLoadingQuestions(false);
      }
    };

    fetchQuestions();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Role-Specific Header Configuration
  const roleConfig = useMemo(() => {
    switch (roleType) {
      case 'faculty':
        return {
          title: 'Faculty Academic Scheduling Assistant',
          subtitle: 'Grounded in your teaching timetable, exam duties, and booking requests',
          badgeLabel: `Professor Scope (${currentUser.department || 'CSE'})`,
        };
      case 'student':
        return {
          title: 'Student Academic Scheduling Assistant',
          subtitle: 'Grounded in your cohort timetable, midterm exam desks, and campus notices',
          badgeLabel: `Student Cohort (${currentUser.studentGroupId || 'CSE-2'})`,
        };
      case 'admin':
      default:
        return {
          title: 'Central Academic Scheduling AI Copilot',
          subtitle: 'Grounded in institutional timetables, venue saturation, disruptions, and SAT solver audits',
          badgeLabel:
            currentUser.role === 'department_coordinator'
              ? `HOD Scope: ${currentUser.department || 'CSE'}`
              : 'Dean / Central Authority',
        };
    }
  }, [roleType, currentUser]);

  // Extract distinct categories from questions
  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    questions.forEach((q) => {
      if (q.category) set.add(q.category);
    });
    return Array.from(set);
  }, [questions]);

  // Filter questions by active category
  const filteredQuestions = useMemo(() => {
    if (selectedCategory === 'All') return questions;
    return questions.filter((q) => q.category === selectedCategory);
  }, [questions, selectedCategory]);

  // --------------------------------------------------------------------------
  // MODE A: DATABASE-POWERED QUESTION EXECUTION
  // --------------------------------------------------------------------------
  const handleSelectQuestion = async (questionId: string, questionText: string) => {
    if (isLoading) return;

    setErrorInfo(null);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: 'user',
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const token = currentUser.token || localStorage.getItem('cit_auth_token') || '';
      const response = await fetch('/api/assistant/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.error?.message || `Failed to retrieve answer (HTTP ${response.status})`;
        const errorCode = data.error?.code || 'ASSISTANT_QUERY_FAILED';
        throw { code: errorCode, message: errorMsg, lastQuestionId: questionId };
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-db`,
        sender: 'assistant',
        text: data.answer || data.message || 'Information retrieved from database.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: data.mode || 'database',
        source: data.source || 'database',
      };

      setMessages([...updatedMessages, assistantMessage]);
    } catch (err: any) {
      console.error('Assistant Query Error:', err);
      const code = err.code || 'REQUEST_FAILED';
      const msg = err.message || 'Unable to connect to the scheduling database. Please try again.';
      setErrorInfo({
        code,
        message: msg,
        lastQuestionId: questionId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // MODE B: CUSTOM QUESTIONS — BETA MODE
  // --------------------------------------------------------------------------
  const handleSendCustomMessage = (customText: string) => {
    const trimmed = customText.trim();
    if (!trimmed || isLoading) return;

    setErrorInfo(null);
    setInputText('');

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Immediate Mode B response without making any paid LLM API calls
    const betaMessage: ChatMessage = {
      id: `msg-${Date.now()}-beta`,
      sender: 'assistant',
      text:
        '🧪 **AI Assistant — Beta Mode**\n\n' +
        'Custom AI-generated responses are temporarily unavailable while institutional LLM compliance checks are underway.\n\n' +
        'For now, please select one of the suggested questions above to receive an authoritative answer directly from our verified institutional database.\n\n' +
        'Thank you for your patience!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: 'beta',
      source: 'beta_mode',
    };

    setMessages([...messages, userMessage, betaMessage]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendCustomMessage(inputText);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInputText('');
    setErrorInfo(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span className="uppercase tracking-wider">CIT Database-Powered Assistant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            {roleConfig.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{roleConfig.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Database Mode Active</span>
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {roleConfig.badgeLabel}
          </span>
          <button
            onClick={handleNewChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Start a new conversation"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* SECTION A: DATABASE-POWERED SUGGESTED QUESTIONS */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
              Verified Database Questions
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Click any question to query PostgreSQL live without LLM charges
          </span>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Questions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {isLoadingQuestions ? (
            <div className="col-span-full py-6 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Loading verified question catalog from database...</span>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const Icon = CATEGORY_ICONS[q.category] || HelpCircle;
              return (
                <button
                  key={q.id}
                  onClick={() => handleSelectQuestion(q.id, q.question)}
                  disabled={isLoading}
                  className="flex items-center justify-between p-3 bg-white hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all group shadow-2xs hover:shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5 pr-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-700 flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-800 group-hover:text-blue-900 line-clamp-2">
                        {q.question}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        {q.category}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION B: CHAT STREAM & INPUT */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
        {/* Chatbox Sub-Header */}
        <div className="p-3.5 px-4 bg-slate-50/75 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-700">Verified PostgreSQL Assistant Engine</span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-500 hidden sm:inline">Zero LLM Quota Required • Clash-Free</span>
          </div>
          {messages.length > 0 && (
            <span className="text-[11px] text-slate-400">
              {messages.length} message{messages.length === 1 ? '' : 's'} in current session
            </span>
          )}
        </div>

        {/* Message Stream Area */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto min-h-[380px] max-h-[560px] bg-slate-50/30">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-2xs">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-sm font-bold text-slate-900">How can I assist you today?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select any verified question above to retrieve live timetable records, examination seatings, venue statuses, and institutional answers directly from PostgreSQL.
                </p>
              </div>
              <div className="pt-2">
                <span className="text-[11px] text-slate-400">
                  Click any question card above or type a custom question below.
                </span>
              </div>
            </div>
          ) : (
            /* Messages List */
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div
                    className={`w-7 h-7 rounded-full text-white flex items-center justify-center shrink-0 mr-2.5 mt-1 shadow-2xs ${
                      msg.mode === 'beta' ? 'bg-amber-600' : 'bg-blue-600'
                    }`}
                  >
                    {msg.mode === 'beta' ? (
                      <span className="text-xs">🧪</span>
                    ) : (
                      <Database className="w-3.5 h-3.5" />
                    )}
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs shadow-2xs'
                      : msg.mode === 'beta'
                      ? 'bg-amber-50/80 border border-amber-200 text-amber-950 rounded-tl-xs shadow-2xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75">
                    <span className="font-semibold flex items-center space-x-1">
                      {msg.sender === 'user' ? (
                        <span>{currentUser.name}</span>
                      ) : msg.mode === 'beta' ? (
                        <span className="text-amber-800 font-bold flex items-center space-x-1">
                          <span>🧪 CIT Assistant (Beta Mode)</span>
                        </span>
                      ) : (
                        <span className="text-blue-700 font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>CIT Assistant (Verified Database)</span>
                        </span>
                      )}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div>{msg.text}</div>
                </div>
              </div>
            ))
          )}

          {/* Typing / Loading Indicator */}
          {isLoading && (
            <div className="flex items-start space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                <Database className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 shadow-2xs flex items-center space-x-2 text-xs text-slate-600">
                <div className="flex space-x-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <span>Querying verified CIT PostgreSQL database...</span>
              </div>
            </div>
          )}

          {/* Error Message & Retry */}
          {errorInfo && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-2">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">Error Processing Query ({errorInfo.code})</div>
                  <div className="mt-0.5 text-red-700">{errorInfo.message}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 pt-1">
                {errorInfo.lastQuestionId && (
                  <button
                    onClick={() => {
                      const q = questions.find((item) => item.id === errorInfo.lastQuestionId);
                      if (q) handleSelectQuestion(q.id, q.question);
                    }}
                    disabled={isLoading}
                    className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Query</span>
                  </button>
                )}
                <button
                  onClick={() => setErrorInfo(null)}
                  className="text-xs text-red-600 hover:underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Text Input & Controls */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 space-y-2">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={2}
              placeholder="Ask a question or type a custom query... (Beta Mode)"
              className="flex-1 p-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-slate-50 disabled:text-slate-400"
            />
            <button
              onClick={() => handleSendCustomMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
              className="p-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5 shrink-0 shadow-2xs cursor-pointer h-[58px]"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold">Ask</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>
              Press <strong>Enter</strong> to submit, <strong>Shift + Enter</strong> for a new line
            </span>
            <span className="hidden sm:inline">
              Verified PostgreSQL Mode • Predefined & Live Queries
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
