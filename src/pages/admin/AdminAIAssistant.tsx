import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Paperclip,
  Mic,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sliders,
  ChevronRight,
  Check,
} from 'lucide-react';
import { UserItem } from '../../types';

interface AdminAIAssistantProps {
  currentUser: UserItem;
}

export const AdminAIAssistant: React.FC<AdminAIAssistantProps> = ({ currentUser }) => {
  const [staged, setStaged] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; time: string }>>([
    {
      sender: 'user',
      text: 'Identify timetable conflicts across departments and suggest optimization for overloaded computing labs during Wednesday afternoon.',
      time: '10:14 AM',
    },
    {
      sender: 'assistant',
      text: 'Analyzing scheduling constraints: Deterministic SAT solver confirmed 0 hard collisions across active faculty and venue registries. Wednesday 14:00-16:00 lab load is 86.4% saturated.',
      time: '10:14 AM',
    },
  ]);

  const handleSendMessage = async (promptText?: string) => {
    const textToSend = promptText || inputMsg;
    if (!textToSend.trim()) return;

    const newMsgs = [
      ...chatMessages,
      { sender: 'user' as const, text: textToSend.trim(), time: 'Just now' },
    ];
    setChatMessages(newMsgs);
    setInputMsg('');
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ message: textToSend.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'AI service unavailable');
      }

      setChatMessages([
        ...newMsgs,
        {
          sender: 'assistant' as const,
          text: data.reply,
          time: 'Just now',
        },
      ]);
    } catch (err: any) {
      setChatMessages([
        ...newMsgs,
        {
          sender: 'assistant' as const,
          text: `Notice: ${err.message || 'Could not query assistant.'}`,
          time: 'Just now',
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-blue-600">Admin Authority &gt; AI Assistant</div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Central Academic Scheduling AI Copilot
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] font-mono">
            <span className="text-slate-500">CIT-SOLV-CORE // RUNTIME-4.8.1</span>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span>SAT-Solver Engine v4.8 Active</span>
            </span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              Sub-second Conflict Inference
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
              Governance Gatekeeper Enabled
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Operational Pulse (4 Cols) + Right Copilot Chat (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pulse & Prompts */}
        <div className="lg:col-span-4 space-y-4">
          {/* Operational Pulse Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">OPERATIONAL PULSE</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Autumn 2026</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2 bg-slate-50 rounded-xl">
                <div className="text-lg font-black text-slate-900">1,420</div>
                <div className="text-[9px] text-slate-400">Managed Slots</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl">
                <div className="text-lg font-black text-emerald-600">100%</div>
                <div className="text-[9px] text-slate-400">Solver Health</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl">
                <div className="text-lg font-black text-blue-600 font-mono">0.14s</div>
                <div className="text-[9px] text-slate-400">Mean Inference</div>
              </div>
            </div>
            <div className="pt-2 text-[11px] text-slate-500">
              <div className="flex justify-between">
                <span>Overall Campus Saturation</span>
                <span className="font-bold text-slate-700">78.4%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-blue-600 h-full w-[78.4%]"></div>
              </div>
            </div>
          </div>

          {/* Staged Revision Docket */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">STAGED REVISION DOCKET</span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                {staged ? '2 Queued' : '1 Queued'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Requires human cryptographic sign-off before publishing live master timetable.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800">REV-8849: ECE Cohort</span>
                <div className="text-[10px] text-slate-400 mt-0.5">AI/ML Lab 2 • Wed 14:00</div>
              </div>
              <button className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-[11px] font-semibold text-slate-700">
                Inspect
              </button>
            </div>
          </div>

          {/* Operational Prompts */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">OPERATIONAL PROMPTS</div>
            {[
              'Identify timetable conflicts across departments.',
              'Suggest alternatives for a room scheduling conflict.',
              'Summarize faculty workload distribution.',
              'Find rooms available for a given time slot.',
              'Summarize pending disruption requests.',
            ].map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="w-full text-left p-2 rounded-xl text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-between group"
              >
                <span className="line-clamp-1">{p}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Reasoning Chat Core */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Academic Reasoning Core v4.8.1</div>
                <div className="text-[10px] text-slate-500">
                  Grounded in Central Registrar & Master Senate Policies • Dual-Phase Constraint Solver
                </div>
              </div>
            </div>
          </div>

          {/* Chat Stream */}
          <div className="p-6 space-y-5 overflow-y-auto max-h-[580px]">
            {/* User Bubble */}
            <div className="flex justify-end">
              <div className="bg-blue-50 border border-blue-200 text-blue-950 p-4 rounded-2xl rounded-tr-xs max-w-xl text-xs space-y-1">
                <div className="text-[10px] font-semibold text-blue-600">
                  {currentUser.name} ({currentUser.roleLabel}) • 10:14 AM
                </div>
                <p>
                  Identify timetable conflicts across departments and suggest optimization for overloaded computing labs during Wednesday afternoon.
                </p>
              </div>
            </div>

            {/* AI Response Card */}
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>

              <div className="flex-1 space-y-4 text-xs text-slate-800">
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                  <span>CIT-Copilot Engine</span>
                  <span>•</span>
                  <span>Execution: 0.128s</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-bold">SAT-Model Check: Zero hard violations</span>
                </div>

                <p className="leading-relaxed">
                  Analysis complete for <strong>Autumn 2026 Term (Week 7-14)</strong> across CS, IT, AI, and ECE departments. Cross-departmental constraints yielded one critical localized hardware bottleneck on Wednesday post-lunch.
                </p>

                {/* Conflict Diagnosis Card */}
                <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-red-900">
                    <span className="flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Conflict Diagnosis: Peak Saturation Detected</span>
                    </span>
                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-mono">
                      98.2% Capacity (Bottleneck)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700">
                    <strong>Systems Lab 1 (Block-C, Room 302)</strong> is concurrently slated for <em>CS304 Operating Systems Lab</em> (Batch A & B) and <em>EC402 Embedded Hardware Simulation</em> on Wednesdays from 2:00 PM – 5:00 PM.
                  </p>
                  <div className="flex items-center space-x-4 text-[10px] text-slate-600 pt-1 border-t border-red-200/60">
                    <span>Enrolled Candidates: <strong>64 / 65 Workstations</strong></span>
                    <span className="text-red-600 font-bold">Thermal/HVAC: Warning (32.4°C Est.)</span>
                    <span>Overlap Duration: <strong>180 Minutes (Full Slot)</strong></span>
                  </div>
                </div>

                {/* Algorithmic Optimization Strategy */}
                <div className="space-y-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    ALGORITHMIC OPTIMIZATION STRATEGY (Sorted by Lowest Perturbation Index)
                  </div>

                  {/* Option 1 */}
                  <div className="p-4 bg-slate-50 border border-blue-300 rounded-xl space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded">
                          RECOMMENDED • OPTION 1
                        </span>
                        <span className="font-bold text-slate-900">Reallocate EC402 Cohort to AI/ML Lab 2</span>
                      </div>
                      <span className="font-mono text-sm font-bold text-blue-600">Score: 99.4 / 100</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <strong>AI/ML Lab 2 (Ramanujan Block, 1st Floor)</strong> is verified vacant during Wednesday 2:00 PM – 5:00 PM. It is equipped with 35 high-throughput GPU terminals and full FPGA simulation toolchains.
                    </p>
                    <div className="flex items-center space-x-3 text-[10px] text-emerald-700 pt-1 font-semibold">
                      <span>✓ Student Transit: 140m</span>
                      <span>✓ Workstation Spec Match: 100%</span>
                      <span>✓ Lab Tech: S. Mohanty Assigned</span>
                    </div>
                  </div>

                  {/* Option 2 */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">ALTERNATIVE • OPTION 2: Time-Shift CS304 Batch B to Thursday Morning</span>
                      <span className="font-mono text-xs font-semibold text-slate-500">Score: 84.1 / 100</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Split batch into Thursday 9:00 AM – 12:00 PM in Systems Lab 1. Requires adjusting Prof. Das's office consultation hours.
                    </p>
                  </div>
                </div>

                {/* Gatekeeper Decision Banner */}
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[11px] text-blue-900">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Zero System Clashes Projected. Senate Pacing Impact: <strong>0.0% Alteration</strong></span>
                  </div>
                  <button
                    onClick={() => setStaged(true)}
                    disabled={staged}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all"
                  >
                    {staged ? 'Staged to Docket ✓' : 'Review & Stage Change'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Chat Input */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex flex-wrap items-center gap-1.5 mb-2 text-[10px]">
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Dept: CS, IT, ECE</span>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Day: Wednesday</span>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Policy: Max Consecutive 3h</span>
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask AI Copilot about campus schedules, halls, faculty workload..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-24 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <div className="absolute right-2 flex items-center space-x-1">
                <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600">
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-slate-400">
              CIT-Engine enforces deterministic constraints. All actions adhere to Master Term Rule 11.4.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
