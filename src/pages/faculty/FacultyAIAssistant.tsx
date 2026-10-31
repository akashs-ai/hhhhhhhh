import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Paperclip,
  Mic,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  ChevronRight,
  Check,
} from 'lucide-react';
import { UserItem } from '../../types';

interface FacultyAIAssistantProps {
  currentUser: UserItem;
  onNavigateTab?: (tab: string) => void;
}

export const FacultyAIAssistant: React.FC<FacultyAIAssistantProps> = ({ currentUser, onNavigateTab }) => {
  const [submittedToCoord, setSubmittedToCoord] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatList, setChatList] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([]);

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim()) return;
    setChatList((prev) => [...prev, { sender: 'user', text: promptText.trim() }]);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ message: promptText.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Assistant service unavailable.');
      }

      setChatList((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: data.reply,
        },
      ]);
    } catch (err: any) {
      setChatList((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `SAT Copilot Notice: ${err.message || 'Unable to process query at this time.'}`,
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-blue-600">/ Faculty Assistant / Chilika Institute of Technology</div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Faculty Academic Scheduling Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Intelligent assistant to check your daily classes, simulate emergency leaves, verify invigilation duties, and find open lab spaces.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 text-xs">
          <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-200 font-semibold flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>SAT-Heuristic Solver Active</span>
          </span>
          <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold">
            Institutional Rule: No Silent Publishing
          </span>
        </div>
      </div>

      {/* Main Grid: Left Profile & Scenarios (4 Cols) + Right Chat (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-4 text-xs">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-black text-sm text-slate-900">Dr. R. Pattnaik</div>
                <div className="text-[11px] text-slate-400">Associate Professor • Dept. of CSE</div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between">
                <span>Teaching Load</span>
                <strong className="text-slate-800">18 / 20 hrs</strong>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[90%]"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-2 bg-slate-50 rounded-lg text-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold">Cohorts Handled</span>
                <div className="font-bold text-slate-800 text-[11px] mt-0.5">CSE-2A &amp; CSE-3B</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg text-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold">Enrolled Total</span>
                <div className="font-bold text-slate-800 text-[11px] mt-0.5">128 Students</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-amber-700 font-semibold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>1 Pending Reschedule Request: REQ-8821</span>
            </div>
          </div>

          {/* Suggested Scenarios */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              SUGGESTED SCENARIOS (Instant Query)
            </div>
            {[
              { title: 'Show my classes for today.', sub: '3 sessions scheduled across Block B' },
              { title: 'Summarize my timetable for this week.', sub: 'Weekly workload distribution and gap analysis' },
              { title: 'Help me report faculty unavailability.', sub: 'Simulate emergency shift and room swap' },
              { title: 'Show my upcoming examination duties.', sub: 'Mid-semester invigilation assignments' },
              { title: 'Explain timetable change for CS304.', sub: 'Coordinator modification audit trail' },
            ].map((sc, i) => (
              <button
                key={i}
                onClick={() => handleSendPrompt(sc.title)}
                className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:bg-blue-50/70 hover:border-blue-200 transition-all group"
              >
                <div className="font-bold text-slate-800 group-hover:text-blue-700">{sc.title}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{sc.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Reasoning Copilot */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">CIT Academic Assistant Core v4.8.1</div>
                <div className="text-[10px] text-slate-500">Grounded in CSE Department Master Rules & Room Allocations</div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto max-h-[580px] text-xs">
            <div className="text-center text-[10px] text-slate-400 font-mono">
              Session Initiated • Tuesday, 28 October 2026 • 09:14 AM
            </div>

            {/* User prompt from screenshot */}
            <div className="flex justify-end">
              <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-xs max-w-xl text-xs space-y-1">
                <div className="text-[10px] text-blue-200 font-semibold">Dr. R. Pattnaik • 09:14 AM</div>
                <p>
                  Help me report faculty unavailability for Tuesday 28 Oct morning and suggest a clash-free alternative slot.
                </p>
              </div>
            </div>

            {/* Assistant response */}
            <div className="flex items-start space-x-3 text-xs">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1">
                <Sparkles className="w-4 h-4" />
              </div>

              <div className="flex-1 space-y-3">
                <p className="text-slate-700">
                  I analyzed your schedule and the <strong>CSE-2A</strong> cohort constraints for <strong>Tuesday, 28 October 2026</strong>.
                </p>

                {/* Red Conflict Card */}
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-1 text-xs">
                  <div className="font-bold text-red-700 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Current Conflict Detected</span>
                  </div>
                  <div className="text-slate-800 pt-0.5">• Class: <strong>CS304 Operating Systems (Theory)</strong></div>
                  <div className="text-slate-800">• Scheduled Slot: <strong>10:30 AM – 11:30 AM in Room B-201 (62 students)</strong></div>
                </div>

                {/* Blue Solution Card */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 text-xs">
                  <div className="font-bold text-blue-800 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Compliant Alternative Recommended</span>
                  </div>
                  <div className="text-slate-800 pt-0.5">• Proposed Slot: <strong>Wednesday, 29 Oct 2026 • 02:00 PM – 03:00 PM</strong></div>
                  <div className="text-slate-800">• Venue: <strong>Room B-203 (Capacity 65, Audio-Visual Ready)</strong></div>
                  <div className="text-slate-800">• Solver Validation: <strong>0 cohort collisions, Dr. Pattnaik schedule free, Room B-203 vacant.</strong></div>
                </div>

                {/* Institutional Governance Notice */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Institutional Governance Notice</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    As an AI assistant, I cannot directly edit the live master timetable. I have pre-filled Request <strong>REQ-8821</strong> for you. Would you like to submit this to Coordinator <strong>Soumyajit Mohapatra</strong>?
                  </p>
                  <button
                    onClick={() => setSubmittedToCoord(true)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-all shadow-2xs"
                  >
                    {submittedToCoord ? 'Submitted to Coordinator ✓' : 'Submit Request REQ-8821'}
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic chat additions */}
            {chatList.map((c, i) => (
              <div
                key={i}
                className={`flex ${c.sender === 'user' ? 'justify-end' : 'items-start space-x-3 text-xs'}`}
              >
                {c.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-xl text-xs ${
                    c.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-800'
                  }`}
                >
                  {c.text}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Chat Bar */}
          <div className="p-4 border-t border-slate-200 bg-white space-y-1.5">
            <div className="relative flex items-center">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && chatInput.trim()) {
                    handleSendPrompt(chatInput);
                    setChatInput('');
                  }
                }}
                placeholder="Ask CIT Assistant about your classes, rooms, or examination duties..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-24 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <div className="absolute right-2 flex items-center space-x-1">
                <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600">
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (chatInput.trim()) {
                      handleSendPrompt(chatInput);
                      setChatInput('');
                    }
                  }}
                  className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>CIT Copilot operates under Institutional Scheduling Governance v4.8.</span>
              <span className="font-mono">Latency: 284ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
