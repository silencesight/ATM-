import React, { useState } from 'react';
import {
  Sparkles,
  DollarSign,
  Plus,
  CheckCircle2,
  AlertCircle,
  History,
  MessageSquare,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Student, TeacherSettings } from '../types';
import {
  getStudentDailyEnglishDollars,
  getTodayDateString,
  DEFAULT_TEACHER_SETTINGS,
} from '../utils/creditCalculator';
import { StudentSelectorNav } from './StudentSelectorNav';

interface EnglishDailyDollarsSectionProps {
  students: Student[];
  settings: TeacherSettings;
  onAddDailyReward: (
    studentId: string,
    amount: number,
    reason: string
  ) => { success: boolean; error?: string };
  selectedStudentId?: string;
  onSelectStudent?: (id: string) => void;
}

const PRESET_AMOUNTS = [10, 25, 50, 100];

const PRESET_REASONS = [
  { label: '🗣️ Spoke in English', desc: 'Active oral participation in class' },
  { label: '📖 Reading Book & Vocab', desc: 'Identified new words in reader' },
  { label: '✍️ Notebook Statements', desc: 'Wrote sentences or phrasal verbs' },
  { label: '🏆 Class Game / Activity', desc: 'English competition or game' },
  { label: '🤝 Class Peer Helper', desc: 'Assisted classmate using English' },
];

export const EnglishDailyDollarsSection: React.FC<EnglishDailyDollarsSectionProps> = ({
  students,
  settings,
  onAddDailyReward,
  selectedStudentId,
  onSelectStudent,
}) => {
  const activeStudents = students.filter((s) => s.cardStatus === 'active');
  const [currentId, setCurrentId] = useState<string>(
    selectedStudentId || activeStudents[0]?.id || ''
  );
  const [selectedAmount, setSelectedAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [useCustomAmount, setUseCustomAmount] = useState<boolean>(false);
  const [reason, setReason] = useState<string>('🗣️ Spoke in English');
  const [customReason, setCustomReason] = useState<string>('');
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Sync when prop changes
  React.useEffect(() => {
    if (selectedStudentId) {
      setCurrentId(selectedStudentId);
    }
  }, [selectedStudentId]);

  const selectedStudent = students.find((s) => s.id === currentId);
  const todayStr = getTodayDateString();

  const earnedToday =
    selectedStudent?.dailyEnglishEarned && selectedStudent.dailyEnglishEarned.date === todayStr
      ? selectedStudent.dailyEnglishEarned.amount
      : 0;

  const effectiveAmount = useCustomAmount
    ? Math.max(0, parseInt(customAmount) || 0)
    : selectedAmount;

  const effectiveReason = customReason.trim() ? customReason.trim() : reason;

  const canSubmit =
    selectedStudent &&
    effectiveAmount > 0 &&
    selectedStudent.cardStatus === 'active';

  const handleApplyPreset = (amt: number) => {
    setUseCustomAmount(false);
    setSelectedAmount(amt);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedStudent) return;

    const res = onAddDailyReward(selectedStudent.id, effectiveAmount, effectiveReason);
    if (res.success) {
      setCustomAmount('');
      setUseCustomAmount(false);
      setCustomReason('');
    }
  };

  // Collect all rewards awarded today across all students
  const todayAllRewards = students
    .flatMap((s) =>
      (s.englishRewardsHistory || []).map((r) => ({
        ...r,
        studentName: s.name,
      }))
    )
    .filter((r) => r.createdAt && r.createdAt.slice(0, 10) === todayStr)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
      {/* Top accent glow line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Manual English Daily Dollars
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
                Teacher Discretion • Unlimited E$
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly award classroom credit directly to a student&apos;s account for doing things in English.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              showHistory
                ? 'bg-slate-800 border-slate-600 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Today&apos;s Log ({todayAllRewards.length})</span>
            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* History Drawer */}
      {showHistory && (
        <div className="mt-4 p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
          <div className="flex justify-between items-center text-slate-400 font-mono text-[11px]">
            <span className="font-bold uppercase tracking-wider text-slate-300">
              Rewards Awarded Today ({todayStr})
            </span>
            <span>Total: ${todayAllRewards.reduce((sum, r) => sum + r.amount, 0)}.00</span>
          </div>
          {todayAllRewards.length === 0 ? (
            <p className="text-slate-500 py-3 text-center text-xs">
              No English dollars awarded yet today. Select a student below to add their first reward!
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {todayAllRewards.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="font-bold text-white font-mono">{r.studentName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300">{r.reason}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-[10px] text-slate-500">
                      {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                      +${r.amount}.00
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interactive Form */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Step 1: Select Student Navigator */}
        <div className="space-y-1.5">
          <StudentSelectorNav
            students={students}
            selectedStudentId={currentId}
            onSelectStudent={(id) => {
              setCurrentId(id);
              if (onSelectStudent) onSelectStudent(id);
            }}
            label="1. Student"
            variant="section"
            showBalance={true}
            showCreditScore={true}
            showClassFilter={true}
            showShuffle={true}
          />
        </div>

        {/* Selected Student Status Display */}
        {selectedStudent && (
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-mono">{selectedStudent.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Balance: <strong className="text-emerald-400">E${selectedStudent.currentBalance}.00</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-mono text-slate-300">
                    Earned Today: <strong className="text-emerald-300">E${earnedToday}.00</strong>
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono block">
                  Reward Policy
                </span>
                <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1 justify-end">
                  <Sparkles className="w-3.5 h-3.5" /> Unlimited Discretion
                </span>
              </div>
            </div>
          )}

        {/* Step 2: Choose Amount */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">
              2. Choose Amount to Add (E$)
            </label>
            {useCustomAmount && (
              <button
                type="button"
                onClick={() => setUseCustomAmount(false)}
                className="text-[10px] text-emerald-400 hover:underline font-mono"
              >
                Use Quick Presets
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!useCustomAmount ? (
              <>
                {PRESET_AMOUNTS.map((amt) => {
                  const isSelected = selectedAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleApplyPreset(amt)}
                      className={`px-4 py-2 rounded-lg font-mono font-bold text-xs transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span>+E${amt}</span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setUseCustomAmount(true);
                    setCustomAmount(selectedAmount > 0 ? selectedAmount.toString() : '');
                  }}
                  className="px-3.5 py-2 rounded-lg font-mono text-xs text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 hover:border-slate-700"
                >
                  Custom E$...
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-mono text-xs">E$</span>
                  <input
                    type="number"
                    min="1"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-36 pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Select or Type English Activity Reason */}
        <div>
          <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono block mb-1.5">
            3. Activity in English
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {PRESET_REASONS.map((p) => {
              const isSelected = reason === p.label && !customReason;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setReason(p.label);
                    setCustomReason('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    isSelected
                      ? 'bg-slate-800 text-white border-emerald-500/50 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                  }`}
                  title={p.desc}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Or type custom activity note (e.g. Completed Chapter 4 summary, Perfect spelling test)"
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>
        </div>

        {/* Action Button & Validation Feedback */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-mono text-slate-400">
            {selectedStudent ? (
              <span className="text-slate-300">
                Adding <strong className="text-emerald-400 font-mono">+E${effectiveAmount}.00</strong> to{' '}
                {selectedStudent.name}&apos;s balance (New balance: E${selectedStudent.currentBalance + effectiveAmount}.00)
              </span>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 font-mono"
          >
            <CheckCircle2 className="w-4 h-4" />
            Add +E${effectiveAmount || 0} to Account
          </button>
        </div>
      </form>
    </div>
  );
};
