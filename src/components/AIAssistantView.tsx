import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Building2,
  AlertTriangle,
  User,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { UserItem } from '../types';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  status?: 'sending' | 'delivered' | 'error';
}

interface QuickItem {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface AIAssistantViewProps {
  currentUser: UserItem;
  roleType: 'admin' | 'faculty' | 'student';
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ currentUser, roleType }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ code: string; message: string; lastFailedText: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Role-Specific Configuration
  const roleConfig = React.useMemo(() => {
    switch (roleType) {
      case 'faculty':
        return {
          title: 'Faculty Academic Scheduling Assistant',
          subtitle: 'Grounded in your teaching timetable, exam duties, and booking requests',
          badgeLabel: `Professor Scope (${currentUser.department || 'CSE'})`,
          quickPrompts: [
            { id: 'fp1', label: 'Show my upcoming classes.', icon: Calendar },
            { id: 'fp2', label: 'Summarize my pending requests.', icon: Clock },
            { id: 'fp3', label: 'Check my timetable for conflicts.', icon: ShieldCheck },
            { id: 'fp4', label: 'Show my upcoming examinations.', icon: BookOpen },
            { id: 'fp5', label: 'Summarize schedule changes affecting me.', icon: AlertTriangle },
            { id: 'fp6', label: 'Find available venues for my permitted booking workflow.', icon: Building2 },
          ],
          quickQuestions: [
            'Where is my next lecture scheduled?',
            'Do I have any invigilation duties this week?',
            'What is my total weekly teaching contact hours?',
            'Has my latest booking request been reviewed?',
            'Are there any room changes for my classes?',
          ],
        };
      case 'student':
        return {
          title: 'Student Academic Scheduling Assistant',
          subtitle: 'Grounded in your cohort timetable, midterm exam desks, and campus notices',
          badgeLabel: `Student Cohort (${currentUser.studentGroupId || 'CSE-3'})`,
          quickPrompts: [
            { id: 'sp1', label: 'Show my upcoming classes.', icon: Calendar },
            { id: 'sp2', label: 'What are my upcoming examinations?', icon: BookOpen },
            { id: 'sp3', label: 'Summarize my timetable changes.', icon: AlertTriangle },
            { id: 'sp4', label: 'Show my examination and seating information, if available.', icon: Building2 },
            { id: 'sp5', label: 'Which of my requests are pending?', icon: Clock },
            { id: 'sp6', label: 'Explain my current schedule.', icon: HelpCircle },
          ],
          quickQuestions: [
            'Where is my first class on Monday morning?',
            'Which desk is assigned to me for my exams?',
            'Who is the lead invigilator for my next exam?',
            'Are there any rescheduled classes for my cohort?',
            'How does the campus biometric attendance system work?',
          ],
        };
      case 'admin':
      default:
        return {
          title: 'Central Academic Scheduling AI Copilot',
          subtitle: 'Grounded in institutional timetables, venue saturation, disruptions, and SAT solver audits',
          badgeLabel: currentUser.role === 'department_coordinator' ? `HOD Scope: ${currentUser.department || 'CSE'}` : 'Dean / Central Authority',
          quickPrompts: [
            { id: 'ap1', label: 'Summarize pending requests.', icon: Clock },
            { id: 'ap2', label: 'Identify timetable conflicts.', icon: ShieldCheck },
            { id: 'ap3', label: 'Show departmental workload.', icon: User },
            { id: 'ap4', label: 'Summarize upcoming examinations.', icon: BookOpen },
            { id: 'ap5', label: 'Analyze venue utilization.', icon: Building2 },
            { id: 'ap6', label: 'Summarize unresolved disruptions.', icon: AlertTriangle },
          ],
          quickQuestions: [
            'Are any examination halls near capacity?',
            'Which faculty member has the highest teaching load?',
            'How many venue booking requests are awaiting review?',
            'What is the current status of the SAT solver?',
            'Are there any emergency room closures active?',
          ],
        };
    }
  }, [roleType, currentUser]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    setErrorInfo(null);
    setInputText('');

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Prepare bounded history for context continuity
    const historyPayload = messages.slice(-8).map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          message: trimmed,
          history: historyPayload,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.error?.message || `AI query failed (HTTP ${response.status})`;
        const errorCode = data.error?.code || 'AI_QUERY_FAILED';
        throw { code: errorCode, message: errorMsg };
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'assistant',
        text: data.reply || 'Query processed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages([...updatedMessages, assistantMessage]);
    } catch (err: any) {
      console.error('AI Assistant Query Error:', err);
      const code = err.code || 'REQUEST_FAILED';
      const msg = err.message || 'Unable to connect to the scheduling AI assistant. Please try again.';
      setErrorInfo({
        code,
        message: msg,
        lastFailedText: trimmed,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
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

  const handleRetry = () => {
    if (errorInfo?.lastFailedText) {
      handleSendMessage(errorInfo.lastFailedText);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">CIT Academic Scheduling AI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            {roleConfig.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {roleConfig.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

      {/* SECTION A: QUICK PROMPTS */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
              Quick Prompts
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">Click any prompt to query instantly</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {roleConfig.quickPrompts.map((qp) => {
            const Icon = qp.icon || Sparkles;
            return (
              <button
                key={qp.id}
                onClick={() => handleSendMessage(qp.label)}
                disabled={isLoading}
                className="flex items-center justify-between p-3 bg-white hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all group shadow-2xs hover:shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center space-x-2.5 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-700 flex items-center justify-center shrink-0 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 group-hover:text-blue-900 line-clamp-2">
                    {qp.label}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION B: QUICK QUESTIONS */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Quick Questions
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {roleConfig.quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-full text-xs font-medium transition-colors shadow-2xs cursor-pointer disabled:opacity-50 text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION C: CHATBOX */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* Chatbox Sub-Header */}
        <div className="p-3.5 px-4 bg-slate-50/75 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-700">Google Gemini 2.5 Scheduling Engine</span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-500 hidden sm:inline">Permission-Grounded & Clash-Free</span>
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
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-sm font-bold text-slate-900">
                  How can I help you today?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ask me questions about your academic timetable, upcoming examinations, venue bookings, schedule changes, or workload.
                </p>
              </div>
              <div className="pt-2">
                <span className="text-[11px] text-slate-400">
                  Select a Quick Prompt above or type your question below.
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
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mr-2.5 mt-1 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs shadow-2xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75">
                    <span className="font-semibold">
                      {msg.sender === 'user' ? currentUser.name : 'Gemini Assistant'}
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
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 shadow-2xs flex items-center space-x-2 text-xs text-slate-600">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Querying Google Gemini with verified schedule records...</span>
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
                <button
                  onClick={handleRetry}
                  disabled={isLoading}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Message</span>
                </button>
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
              placeholder="Ask a question about your timetable, exams, bookings, or requests... (Shift + Enter for new line)"
              className="flex-1 p-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-slate-50 disabled:text-slate-400"
            />
            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
              className="p-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5 shrink-0 shadow-2xs cursor-pointer h-[58px]"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold">Send</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for a new line</span>
            <span className="hidden sm:inline">Official Google Gemini API • End-to-end RBAC</span>
          </div>
        </div>
      </div>
    </div>
  );
};
