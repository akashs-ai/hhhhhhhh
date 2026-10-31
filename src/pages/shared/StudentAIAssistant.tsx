import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Paperclip,
  Mic,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Building2,
  ChevronRight,
  Check,
} from 'lucide-react';
import { UserItem } from '../../types';

interface StudentAIAssistantProps {
  currentUser: UserItem;
}

export const StudentAIAssistant: React.FC<StudentAIAssistantProps> = ({ currentUser }) => {
  const [stagedSlot, setStagedSlot] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text?: string; isDefault?: boolean }>>([
    { sender: 'user', isDefault: true },
  ]);

  const handleSend = async (overrideText?: string) => {
    const userText = (overrideText || inputVal).trim();
    if (!userText) return;
    setInputVal('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ message: userText }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Copilot assistant unavailable.');
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: data.reply,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `SAT Copilot Notice: ${err.message || 'Unable to check constraints.'}`,
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600">
            <span>CIT COPILOT V4.8</span>
            <span>•</span>
            <span>SAT-Heuristic Solver Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            CIT Academic Scheduling Copilot
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Intelligent constraint-satisfaction assistant for clash resolution, faculty substitution, and room optimization.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-200 font-semibold">
            Engine Latency: 0.02ms (Sub-SAT)
          </span>
          <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold">
            Governance Gatekeeper Active
          </span>
        </div>
      </div>

      {/* Main Grid: Context & Quick Queries (4 Cols) + Reasoning Chat (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Context & Prompts */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Active Context</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">CSE Dept</span>
            </div>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Active Term:</span>
                <strong className="text-slate-800">Autumn 2026 (Odd)</strong>
              </div>
              <div className="flex justify-between">
                <span>Target Cohort:</span>
                <strong className="text-slate-800">B.Tech Sem-5 (CSE-2A)</strong>
              </div>
              <div className="flex justify-between">
                <span>Staged Proposals:</span>
                <span className="text-amber-600 font-bold">2 Pending</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between text-[11px] mb-1">
                <span>Classroom Utilization</span>
                <strong className="text-slate-800">84.2%</strong>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[84.2%]"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              QUICK ANALYTICAL QUERIES
            </span>
            {[
              'Find scheduling conflicts in my department.',
              'Suggest alternative slots for an unavailable faculty member.',
              'Identify rooms with available capacity (>60 seats).',
              'Summarize this week\'s timetable changes & revisions.',
              'Simulate reschedule for CS304 Lab session block.',
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputVal(q);
                  handleSend();
                }}
                className="w-full text-left p-2 rounded-xl text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-between group"
              >
                <span className="line-clamp-1">{q}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive Chat */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Academic Reasoning Engine (Chilika-IT SAT 4.2)</div>
                <div className="text-[10px] text-slate-500">Synchronized with Central Registrar & Spectra Venue DB</div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto max-h-[580px]">
            {/* Hardcoded reference thread from screenshot */}
            <div className="flex justify-end">
              <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-xs max-w-xl text-xs space-y-1">
                <div className="text-[10px] text-blue-200 font-semibold">
                  {currentUser.name} • 10:41 AM
                </div>
                <p>
                  Dr. R. Pattnaik reported emergency leave on Tuesday 28 Oct between 09:30 AM and 12:30 PM. We have CS304 Operating Systems (CSE-2A, Theory, 62 students) scheduled at 10:30 AM in Room B-201. Can you suggest compliant alternative slots with no room or cohort collisions?
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="text-[10px] text-slate-400 font-mono">
                  CIT Scheduling Assistant • Constraint Verified • 10:41 AM
                </div>
                <p className="text-slate-800 leading-relaxed">
                  Analyzed timetable constraints for <strong>CS304 (Operating Systems, CSE-2A)</strong>. Found <strong>2 collision-free compensatory options</strong> that strictly satisfy institutional bylaws (maximum 2 consecutive theory sessions, zero faculty collision, cohort gap preserved, room capacity ≥ 62 seats).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Card 1 */}
                  <div className="p-3.5 bg-blue-50/70 border border-blue-300 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded">
                        BEST MATCH
                      </span>
                      <span className="text-blue-700 font-bold font-mono text-[11px]">99.4% Fitness</span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Wed, 29 Oct • 02:00 PM – 03:00 PM</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">Room B-203 (Capacity: 65)</div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        • Dr. R. Pattnaik: Free (0 bookings)<br />
                        • Cohort Impact: Open elective gap, 0 clashes
                      </div>
                    </div>
                    <button
                      onClick={() => setStagedSlot(true)}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
                    >
                      {stagedSlot ? 'Staged ✓' : 'Stage Slot'}
                    </button>
                  </div>

                  {/* Card 2 */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                        ALTERNATIVE • SUBSTITUTION
                      </span>
                      <span className="text-slate-500 font-bold font-mono text-[11px]">91.0% Fitness</span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Thu, 30 Oct • 09:00 AM – 10:00 AM</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">Room B-201 (Original, Cap: 64)</div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        • Substitute: Prof. K. Nayak (Co-instructor)<br />
                        • Status: Approved in swap pool
                      </div>
                    </div>
                    <button className="w-full py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all">
                      Review Terms
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">Governance Safety Check:</strong> The AI assistant cannot silently modify or publish live timetable streams. Staging this adjustment generates a certified Coordinator Revision Ticket.
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic message items if any */}
            {messages.slice(1).map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'items-start space-x-3 text-xs'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-xl text-xs ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-800'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Chat Bar */}
          <div className="p-4 border-t border-slate-200 bg-white space-y-2">
            {stagedSlot && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                <span>
                  Ready to Stage Change: <strong>CS304 Moving to Wed 29 Oct 02:00 PM</strong> (Room B-203)
                </span>
                <button
                  onClick={() => setStagedSlot(false)}
                  className="text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Discard
                </button>
              </div>
            )}

            <div className="relative flex items-center">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask CIT Assistant about clashes, room availability, or substitute scheduling..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-24 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <div className="absolute right-2 flex items-center space-x-1">
                <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600">
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSend()}
                  className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="text-[10px] text-slate-400">
              CIT Copilot operates under Institutional Scheduling Governance v4.8. All actions require manual coordinator sign-off.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
