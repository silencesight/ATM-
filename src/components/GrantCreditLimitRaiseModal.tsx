import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  History,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { Student, CreditTier } from '../types';
import { getCreditTier } from '../utils/creditCalculator';
import { StudentSelectorNav } from './StudentSelectorNav';

interface GrantCreditLimitRaiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  students?: Student[];
  selectedStudent?: Student;
  student?: Student;
  onGrantRaise: (
    studentId: string,
    newLimit: number,
    reason: string,
    creditScoreBonus?: number
  ) => void;
}

const PRESET_INCREASES = [50, 100, 150, 200, 300, 500];
const PRESET_NEW_LIMITS = [200, 350, 500, 750, 1000];

const PRESET_REASONS = [
  '⭐ Pristine on-time loan settlement track record',
  '🗣️ Outstanding English fluency & oral participation',
  '📖 Exemplary vocabulary reader & notebook presentation',
  '🤝 Classroom peer tutor and cooperative leader',
  '🏆 English speaking contest / academic achievement',
];

export const GrantCreditLimitRaiseModal: React.FC<GrantCreditLimitRaiseModalProps> = ({
  isOpen,
  onClose,
  students = [],
  selectedStudent,
  student,
  onGrantRaise,
}) => {
  const activeTargetStudent = selectedStudent || student;
  const safeStudents = Array.isArray(students) && students.length > 0 
    ? students 
    : activeTargetStudent ? [activeTargetStudent] : [];
  const activeStudents = safeStudents.filter((s) => s.cardStatus === 'active');
  const [studentId, setStudentId] = useState<string>(
    activeTargetStudent?.id || activeStudents[0]?.id || ''
  );

  useEffect(() => {
    if (activeTargetStudent) {
      setStudentId(activeTargetStudent.id);
    }
  }, [activeTargetStudent]);

  const currentStudent = safeStudents.find((s) => s.id === studentId) || activeTargetStudent;
  const currentLimit = currentStudent?.maxLoanLimit || 50;

  // Calculation mode: 'increment' (+E$) or 'exact' (target new limit)
  const [mode, setMode] = useState<'increment' | 'exact'>('increment');
  const [incrementAmount, setIncrementAmount] = useState<number>(100);
  const [customIncrement, setCustomIncrement] = useState<string>('');
  const [exactLimit, setExactLimit] = useState<number>(currentLimit + 100);
  const [customExactLimit, setCustomExactLimit] = useState<string>('');
  const [reason, setReason] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [scoreBonus, setScoreBonus] = useState<number>(15);

  if (!isOpen) return null;

  const effectiveNewLimit =
    mode === 'increment'
      ? currentLimit +
        (customIncrement !== '' ? Math.max(0, parseInt(customIncrement) || 0) : incrementAmount)
      : customExactLimit !== ''
      ? Math.max(0, parseInt(customExactLimit) || 0)
      : exactLimit;

  const increaseAmount = effectiveNewLimit - currentLimit;
  const effectiveReason = customReason.trim() ? customReason.trim() : reason;
  const currentTier: CreditTier = currentStudent
    ? getCreditTier(currentStudent.creditScore)
    : { name: 'Standard', minScore: 300, maxLoanLimit: 50, badgeColor: 'text-slate-400', badgeBg: 'bg-slate-800', cardLabel: 'STANDARD' };

  const canSubmit =
    currentStudent &&
    currentStudent.cardStatus === 'active' &&
    effectiveNewLimit > 0 &&
    effectiveNewLimit !== currentLimit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !currentStudent) return;
    onGrantRaise(currentStudent.id, effectiveNewLimit, effectiveReason, scoreBonus);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Grant Credit Limit Raise
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                  Manual Promotion
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Reward student financial responsibility with a credit line expansion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Select Student Navigator */}
          <div className="space-y-1.5">
            <StudentSelectorNav
              students={activeStudents}
              selectedStudentId={studentId}
              onSelectStudent={(id) => {
                setStudentId(id);
                const st = students.find((s) => s.id === id);
                if (st) {
                  setExactLimit(st.maxLoanLimit + 100);
                }
              }}
              label="1. Student"
              variant="section"
              showBalance={false}
              showCreditScore={true}
              showClassFilter={true}
              showShuffle={false}
            />
          </div>

          {/* Current vs New Limit Card */}
          {currentStudent && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{currentStudent.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${currentTier.badgeBg} ${currentTier.badgeColor}`}
                  >
                    {currentTier.name}
                  </span>
                </div>
                <span className="text-slate-400">Score: {currentStudent.creditScore} pts</span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1 border-t border-slate-800/80 text-center">
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold block">
                    Current Limit
                  </span>
                  <p className="text-base font-bold font-mono text-slate-300">
                    E${currentLimit}.00
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono font-bold block">
                    New Credit Limit
                  </span>
                  <p className="text-base font-bold font-mono text-emerald-300">
                    E${effectiveNewLimit}.00
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold block">
                    Total Rise
                  </span>
                  <p
                    className={`text-base font-bold font-mono ${
                      increaseAmount >= 0 ? 'text-teal-300' : 'text-rose-400'
                    }`}
                  >
                    {increaseAmount >= 0 ? `+E$${increaseAmount}.00` : `-E$${Math.abs(increaseAmount)}.00`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Choose Rise Mode & Amount */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">
                2. Choose Rise Amount (Your Choice)
              </label>
              <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setMode('increment')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    mode === 'increment' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  + Increase Amount
                </button>
                <button
                  type="button"
                  onClick={() => setMode('exact')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    mode === 'exact' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Set Specific Limit
                </button>
              </div>
            </div>

            {mode === 'increment' ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_INCREASES.map((inc) => {
                    const isSelected = customIncrement === '' && incrementAmount === inc;
                    return (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => {
                          setCustomIncrement('');
                          setIncrementAmount(inc);
                        }}
                        className={`py-2 rounded-lg font-mono font-bold text-xs transition-all border ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                            : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-800'
                        }`}
                      >
                        +E${inc}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-slate-500 font-mono text-xs">+E$</span>
                    <input
                      type="number"
                      min="1"
                      value={customIncrement}
                      onChange={(e) => setCustomIncrement(e.target.value)}
                      placeholder="Or type custom rise (e.g. 75, 250, 400)"
                      className="w-full pl-10 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_NEW_LIMITS.map((lim) => {
                    const isSelected = customExactLimit === '' && exactLimit === lim;
                    return (
                      <button
                        key={lim}
                        type="button"
                        onClick={() => {
                          setCustomExactLimit('');
                          setExactLimit(lim);
                        }}
                        className={`py-2 rounded-lg font-mono font-bold text-xs transition-all border ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                            : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-800'
                        }`}
                      >
                        E${lim}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-slate-500 font-mono text-xs">E$</span>
                    <input
                      type="number"
                      min="1"
                      value={customExactLimit}
                      onChange={(e) => setCustomExactLimit(e.target.value)}
                      placeholder="Enter exact new limit (e.g. 450, 800)"
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Commendation / Reason */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono block mb-1.5">
              3. Merit / Reason for Rise
            </label>
            <div className="space-y-1.5 mb-2">
              {PRESET_REASONS.map((r) => {
                const isSelected = reason === r && !customReason;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setReason(r);
                      setCustomReason('');
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs font-sans transition-all border flex items-center gap-2 ${
                      isSelected
                        ? 'bg-slate-800 text-white border-emerald-500/60 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex-1">{r}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Or enter custom teacher commendation note..."
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          {/* Step 4: Optional Merit Score Bonus */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono block mb-1.5">
              4. Credit Score Bonus Awarded
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 10, 15, 25].map((pts) => (
                <button
                  key={pts}
                  type="button"
                  onClick={() => setScoreBonus(pts)}
                  className={`py-2 rounded-lg font-mono font-bold text-xs transition-all border ${
                    scoreBonus === pts
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {pts === 0 ? 'No Bonus' : `+${pts} Points`}
                </button>
              ))}
            </div>
          </div>

          {/* Previous Raises History for this student */}
          {currentStudent?.creditLimitRaisesHistory && currentStudent.creditLimitRaisesHistory.length > 0 && (
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/70 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-teal-400" />
                Previous Limit Rises ({currentStudent.creditLimitRaisesHistory.length} recorded this year)
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {currentStudent.creditLimitRaisesHistory.map((hist) => (
                  <div
                    key={hist.id}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono flex items-center justify-between"
                  >
                    <div>
                      <p className="text-slate-200 font-bold">
                        E${hist.previousLimit} → E${hist.newLimit}{' '}
                        <span className="text-emerald-400">
                          (+E${hist.increaseAmount})
                        </span>
                      </p>
                      <p className="text-[10px] text-slate-500">{hist.reason}</p>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(hist.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs font-mono text-slate-400">
              {increaseAmount > 0 ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Granting +E${increaseAmount}.00 limit rise
                </span>
              ) : (
                <span>No change to current limit</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 font-mono"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Limit Rise
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
