import React, { useState } from 'react';
import { X, DollarSign, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Student, TeacherSettings } from '../types';
import {
  getStudentDailyEnglishDollars,
  getTodayDateString,
  DEFAULT_TEACHER_SETTINGS,
} from '../utils/creditCalculator';

interface QuickAddDailyDollarsModalProps {
  student: Student;
  settings: TeacherSettings;
  isOpen: boolean;
  onClose: () => void;
  onAddDailyReward: (
    studentId: string,
    amount: number,
    reason: string
  ) => { success: boolean; error?: string };
}

const PRESET_AMOUNTS = [10, 25, 50, 100];
const PRESET_REASONS = [
  '🗣️ Spoke in English',
  '📖 Reading Book & Vocab',
  '✍️ Notebook Statements',
  '🏆 Class Game / Activity',
  '🤝 Class Peer Helper',
];

export const QuickAddDailyDollarsModal: React.FC<QuickAddDailyDollarsModalProps> = ({
  student,
  settings: _settings,
  isOpen,
  onClose,
  onAddDailyReward,
}) => {
  const todayStr = getTodayDateString();
  const earnedToday =
    student.dailyEnglishEarned && student.dailyEnglishEarned.date === todayStr
      ? student.dailyEnglishEarned.amount
      : 0;

  const [selectedAmount, setSelectedAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [reason, setReason] = useState<string>('🗣️ Spoke in English');
  const [customReason, setCustomReason] = useState<string>('');

  if (!isOpen) return null;

  const effectiveAmount = isCustom ? Math.max(0, parseInt(customAmount) || 0) : selectedAmount;
  const effectiveReason = customReason.trim() ? customReason.trim() : reason;
  const canSubmit = effectiveAmount > 0 && student.cardStatus === 'active';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const res = onAddDailyReward(student.id, effectiveAmount, effectiveReason);
    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm font-mono font-bold text-base">
              E$
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Award English Classroom Dollars
                </h3>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                  Teacher Discretion (No Limit)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct classroom credit for <strong className="text-white">{student.name}</strong>
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

        {/* Student Status Summary */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold block">
                  Current Balance
                </span>
                <p className="text-xl font-black font-mono text-white">
                  E${student.currentBalance}.00
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                  Earned Today ({todayStr})
                </span>
                <p className="text-sm font-bold text-emerald-400">
                  E${earnedToday}.00
                </p>
                <span className="text-[10px] text-emerald-400/80 flex items-center gap-1 justify-end">
                  <Sparkles className="w-3 h-3" /> No Daily Cap
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Selection */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono block mb-2">
                Select Amount to Add (E$)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((amt) => {
                  const isSelected = !isCustom && selectedAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setIsCustom(false);
                        setSelectedAmount(amt);
                      }}
                      className={`py-2.5 rounded-lg font-mono font-bold text-sm transition-all ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800'
                      }`}
                    >
                      +E${amt}
                    </button>
                  );
                })}
              </div>

              {/* Custom amount toggle */}
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustom(!isCustom)}
                  className="text-xs font-mono text-emerald-400 hover:text-emerald-300 underline"
                >
                  {isCustom ? 'Use preset amounts' : 'Or enter custom amount...'}
                </button>
              </div>

              {isCustom && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-slate-500 font-mono text-xs">E$</span>
                    <input
                      type="number"
                      min="1"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Enter amount to award"
                      className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Reason Selection */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono block mb-1.5">
                Activity in English
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
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
                      className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                        isSelected
                          ? 'bg-slate-800 text-white border-emerald-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Or custom note (e.g. Excellent paragraph reading)"
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs font-mono text-slate-400">
                New balance:{' '}
                <strong className="text-emerald-400">
                  E${student.currentBalance + (effectiveAmount || 0)}.00
                </strong>
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
                  Award +E${effectiveAmount || 0}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
