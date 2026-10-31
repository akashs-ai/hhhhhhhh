import React, { useState } from 'react';
import {
  Rocket,
  CheckCircle2,
  Clock,
  Sparkles,
  Sliders,
  Building2,
  Check,
  RefreshCw,
  Terminal,
  Save,
  UploadCloud,
} from 'lucide-react';
import { UserItem } from '../../types';

interface FacultyTimetableProps {
  currentUser: UserItem;
}

export const FacultyTimetable: React.FC<FacultyTimetableProps> = ({ currentUser }) => {
  const [workloadHours, setWorkloadHours] = useState(6.0);
  const [isRunning, setIsRunning] = useState(false);
  const [solverCompleted, setSolverCompleted] = useState(true);

  const handleRunEngine = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setSolverCompleted(true);
    }, 1000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-blue-600">ACADEMICS &gt; TIMETABLES &gt; AUTOMATED SYNTHESIS</div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Timetable Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Algorithmic constraint-satisfaction schedule builder. Automatically allocates faculty, rooms, and cohorts without clashes.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>SOLVER CLUSTER Node-EU4: Active (0.02ms lag)</span>
        </div>
      </div>

      {/* 4-Step Process Wizard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-emerald-300 rounded-xl flex items-center space-x-2 text-xs">
          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
            ✓
          </span>
          <div>
            <div className="text-[10px] text-slate-400 font-bold">STEP 01</div>
            <div className="font-bold text-slate-800">Select Parameters</div>
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-400 rounded-xl flex items-center space-x-2 text-xs">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
            2
          </span>
          <div>
            <div className="text-[10px] text-blue-600 font-bold">STEP 02 (IN PROGRESS)</div>
            <div className="font-bold text-blue-900">Set Constraints</div>
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center space-x-2 text-xs text-slate-400">
          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px]">
            3
          </span>
          <div>
            <div className="text-[10px] font-bold">STEP 03</div>
            <div className="font-semibold text-slate-600">Run AI Solver</div>
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center space-x-2 text-xs text-slate-400">
          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px]">
            4
          </span>
          <div>
            <div className="text-[10px] font-bold">STEP 04</div>
            <div className="font-semibold text-slate-600">Review & Publish</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Parameters & Constraints (7 Cols) + Console & Preview (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Academic Scope Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Academic Scope</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                Dual Section Mode
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Department</label>
                <select className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800">
                  <option>Computer Science & Engineering</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Academic Calendar</label>
                <select className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800">
                  <option>Autumn 2026 (Odd Term)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Semester Cohort</span>
                <div className="font-bold text-slate-800 mt-0.5">3rd Semester (Batch 2025-29)</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Section Distribution</span>
                <div className="font-bold text-slate-800 mt-0.5">CSE - A (62) & CSE - B (58)</div>
              </div>
            </div>
          </div>

          {/* Heuristic Constraint Rules */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Heuristic Constraint Rules</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                5 of 5 Active Rules
              </span>
            </div>

            <div className="space-y-3 text-slate-700">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-blue-600" />
                <div>
                  <div className="font-bold text-slate-800">Avoid consecutive heavy theory classes</div>
                  <div className="text-[11px] text-slate-500">Limits dense theoretical lectures to max 2 hours continuous per cohort.</div>
                </div>
              </label>

              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input type="checkbox" defaultChecked disabled className="mt-0.5 rounded text-blue-600" />
                <div>
                  <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <span>Mandatory lunch recess hard-lock</span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">IMMUTABLE</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Daily lock: 01:00 PM - 02:00 PM across all departments and faculties.</div>
                </div>
              </label>

              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-blue-600" />
                <div>
                  <div className="font-bold text-slate-800">Dedicated 3-hour contiguous laboratory blocks</div>
                  <div className="text-[11px] text-slate-500">Allocates contiguous morning (09-12) or afternoon (02-05) timeframes for labs.</div>
                </div>
              </label>

              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-blue-600" />
                <div>
                  <div className="font-bold text-slate-800">Respect faculty preferred off-periods</div>
                  <div className="text-[11px] text-slate-500">Dr. S. Pattnaik: Friday afternoon off (Research sabbaticals respected).</div>
                </div>
              </label>

              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-blue-600" />
                <div>
                  <div className="font-bold text-slate-800">No same-day repeat of 3-credit core subjects</div>
                  <div className="text-[11px] text-slate-500">Distributes OS (CS301) and DBMS (CS302) evenly across distinct weekdays.</div>
                </div>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Max Daily Academic Workload:</span>
                <span className="font-bold text-blue-600">{workloadHours} Hours / Day</span>
              </div>
              <input
                type="range"
                min="4"
                max="8"
                step="0.5"
                value={workloadHours}
                onChange={(e) => setWorkloadHours(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>4 Hours (Relaxed)</span>
                <span>6 Hours (Recommended)</span>
                <span>8 Hours (Max Limit)</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-2xs">
              Reset Constraints
            </button>
            <button
              onClick={handleRunEngine}
              disabled={isRunning}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Rocket className="w-4 h-4" />
              <span>{isRunning ? 'Synthesizing Chromosomes...' : 'Run Genetic Solver Engine (Ready: 64 slots)'}</span>
            </button>
          </div>
        </div>

        {/* Right Column (5 Cols): Console + Quick Preview */}
        <div className="lg:col-span-5 space-y-5">
          {/* Simulated Terminal */}
          <div className="bg-slate-950 text-white rounded-2xl p-4 font-mono text-xs shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-slate-300 font-bold">AI Heuristic Solver Engine v3.4</span>
              </div>
              <span className="text-[9px] text-slate-500">GENETIC-CSP-4.2</span>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-300 h-44 overflow-y-auto">
              <div className="text-slate-500">Terminal: worker_04@cluster.citschedule • TTY-1</div>
              <div className="text-blue-400">[OPTIMIZER] Initializing Constraint Satisfaction Algorithm...</div>
              <div className="text-emerald-400">[OK] Loaded 64 Faculty availability profiles</div>
              <div className="text-emerald-400">[OK] Loaded 14 Smart Laboratories for Block 4</div>
              <div className="text-slate-300">[RUNNING] Generating 320 weekly slots across Section A & B...</div>
              <div className="text-indigo-400">[EVALUATING] Generation 1,480 / 2,000 completed</div>
              <div className="p-2 bg-emerald-950/80 border border-emerald-700 rounded text-emerald-300 font-bold text-[10px] mt-2">
                SUCCESS: 0 Faculty Clashes, 0 Room Collisions detected. Final Chromosome Fitness Score: 99.4%
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center text-[10px]">
              <div className="p-1.5 bg-slate-900 rounded">
                <div className="text-slate-400">COMPUTE TIME</div>
                <div className="font-bold text-white text-xs mt-0.5">0.42s</div>
              </div>
              <div className="p-1.5 bg-slate-900 rounded">
                <div className="text-slate-400">CONFLICT PROB.</div>
                <div className="font-bold text-emerald-400 text-xs mt-0.5">0.00%</div>
              </div>
              <div className="p-1.5 bg-slate-900 rounded">
                <div className="text-slate-400">ROOM EFFICIENCY</div>
                <div className="font-bold text-blue-400 text-xs mt-0.5">94.2%</div>
              </div>
            </div>
          </div>

          {/* Quick Preview Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Generated Timetable Quick Preview</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Ready for Review
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="grid grid-cols-5 text-[9px] font-bold text-slate-400 p-1 bg-slate-50 rounded">
                <div>DAY</div>
                <div>09:00 AM</div>
                <div>10:30 AM</div>
                <div>12:00 PM</div>
                <div>01:00 PM</div>
              </div>
              <div className="grid grid-cols-5 text-[10px] p-1 border-b border-slate-100">
                <div className="font-bold text-slate-800">MON</div>
                <div className="text-blue-600 font-semibold">Data Struct</div>
                <div className="text-sky-600 font-semibold">OS Lab</div>
                <div className="text-indigo-600 font-semibold">Cyber Sec</div>
                <div className="text-amber-700 font-bold">LUNCH</div>
              </div>
              <div className="grid grid-cols-5 text-[10px] p-1 border-b border-slate-100">
                <div className="font-bold text-slate-800">TUE</div>
                <div className="text-blue-600 font-semibold">DBMS</div>
                <div className="text-slate-700 font-semibold">Discrete Math</div>
                <div className="text-blue-600 font-semibold">Data Struct</div>
                <div className="text-amber-700 font-bold">LUNCH</div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-2xs">
                Review Full Master Grid
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg font-semibold text-slate-700">
                  Save Draft
                </button>
                <button className="py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg font-bold">
                  Publish Portals
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
