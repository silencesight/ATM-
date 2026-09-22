import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  History,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Student, BalanceAdjustmentTransaction } from '../types';
import { formatCurrency, CURRENCY_SYMBOL, CURRENCY_NAME, CURRENCY_NICKNAME } from '../utils/creditCalculator';
import { StudentSelectorNav } from './StudentSelectorNav';

interface ManualBalanceAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  students: Student[];
  onSelectStudent?: (studentId: string) => void;
  onAdjustBalance: (
    studentId: string,
    type: 'increase' | 'decrease',
    amount: number,
    reason: string,
    category: BalanceAdjustmentTransaction['category'],
    creditScoreChange: number
  ) => void;
}

const REASON_PRESETS = {
  increase: [
    { label: 'Exemplary English Speaking', category: 'reward' as const, defaultCreditChange: 5 },
    { label: 'Homework / Project Bonus', category: 'reward' as const, defaultCreditChange: 5 },
    { label: 'Classroom Competition 1st Place', category: 'contest' as const, defaultCreditChange: 10 },
    { label: 'Peer Tutoring & Helping', category: 'activity' as const, defaultCreditChange: 5 },
    { label: 'Manual Balance Correction', category: 'correction' as const, defaultCreditChange: 0 },
  ],
  decrease: [
    { label: 'Classroom Store Custom Purchase', category: 'store' as const, defaultCreditChange: 5 },
    { label: 'Late Assignment Penalty', category: 'fine' as const, defaultCreditChange: -10 },
    { label: 'Disciplinary / Disruption Fine', category: 'fine' as const, defaultCreditChange: -15 },
    { label: 'Lost Material / Classroom Expense', category: 'fine' as const, defaultCreditChange: 0 },
    { label: 'Manual Balance Correction', category: 'correction' as const, defaultCreditChange: 0 },
  ],
};

const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500, 1000];

export const ManualBalanceAdjustModal: React.FC<ManualBalanceAdjustModalProps> = ({
  isOpen,
  onClose,
  student,
  students,
  onSelectStudent,
  onAdjustBalance,
}) => {
  const [activeTab, setActiveTab] = useState<'increase' | 'decrease'>('increase');
  const [amountStr, setAmountStr] = useState<string>('50');
  const [reason, setReason] = useState<string>('Exemplary English Speaking');
  const [category, setCategory] = useState<BalanceAdjustmentTransaction['category']>('reward');
  const [creditChangeStr, setCreditChangeStr] = useState<string>('5');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(student?.id || '');
  const [showHistory, setShowHistory] = useState<boolean>(false);

  useEffect(() => {
    if (student) {
      setSelectedStudentId(student.id);
    } else if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [student, students]);

  if (!isOpen) return null;

  const currentStudent = students.find((s) => s.id === selectedStudentId) || student;
  if (!currentStudent) return null;

  const amount = Math.max(0, parseFloat(amountStr) || 0);
  const creditChange = parseInt(creditChangeStr, 10) || 0;

  const currentBalance = currentStudent.currentBalance;
  const newBalance =
    activeTab === 'increase'
      ? currentBalance + amount
      : Math.max(0, currentBalance - amount);

  const isExceedingBalance = activeTab === 'decrease' && amount > currentBalance;

  const currentScore = currentStudent.creditScore;
  const newScore = Math.max(300, Math.min(850, currentScore + creditChange));

  const handlePresetSelect = (preset: {
    label: string;
    category: BalanceAdjustmentTransaction['category'];
    defaultCreditChange: number;
  }) => {
    setReason(preset.label);
    setCategory(preset.category);
    setCreditChangeStr(preset.defaultCreditChange.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    onAdjustBalance(
      currentStudent.id,
      activeTab,
      amount,
      reason.trim() || (activeTab === 'increase' ? 'Manual Eurodollar Award' : 'Manual Eurodollar Deduction'),
      category,
      creditChange
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border font-mono-code font-black text-base shadow-sm ${
                activeTab === 'increase'
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                  : 'bg-rose-950/80 border-rose-500/40 text-rose-400'
              }`}
            >
              {activeTab === 'increase' ? (
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-rose-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-100 tracking-tight">
                  Adjust Eurodollar Balance
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase bg-amber-950/60 border border-amber-500/30 text-amber-300">
                  {CURRENCY_NICKNAME} ({CURRENCY_SYMBOL})
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Directly add or deduct {CURRENCY_NAME} for students
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Selector Navigator */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-950/40">
          <StudentSelectorNav
            students={students}
            selectedStudentId={selectedStudentId}
            onSelectStudent={(id) => {
              setSelectedStudentId(id);
              if (onSelectStudent) onSelectStudent(id);
            }}
            label="Student"
            variant="section"
            showBalance={true}
            showCreditScore={true}
            showClassFilter={true}
            showShuffle={false}
          />
        </div>

        {/* Mode Selector Tabs (Increase vs Decrease) */}
        <div className="p-5 pb-0">
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('increase');
                handlePresetSelect(REASON_PRESETS.increase[0]);
              }}
              className={`py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === 'increase'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              Add Eurodollars (+{CURRENCY_SYMBOL})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('decrease');
                handlePresetSelect(REASON_PRESETS.decrease[0]);
              }}
              className={`py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === 'decrease'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-4 h-4 text-rose-300" />
              Deduct Eurodollars (-{CURRENCY_SYMBOL})
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Amount input & presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono-code uppercase font-bold text-slate-300">
                Amount ({CURRENCY_SYMBOL} Eurodollars)
              </label>
              <span className="text-xs text-slate-500 font-mono-code">
                Wallet: <strong className="text-slate-200">{formatCurrency(currentBalance)}</strong>
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono-code font-black text-slate-400 text-base">
                {activeTab === 'increase' ? `+${CURRENCY_SYMBOL}` : `-${CURRENCY_SYMBOL}`}
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-16 pr-4 py-3 text-2xl font-mono-code font-black text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                required
              />
            </div>

            {/* Quick Amount Pills */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setAmountStr(q.toString())}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono-code font-bold border transition-colors ${
                    amountStr === q.toString()
                      ? activeTab === 'increase'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                        : 'bg-rose-500 text-white border-rose-400 font-black'
                      : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  {activeTab === 'increase' ? `+` : `-`}
                  {formatCurrency(q)}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Reasons */}
          <div>
            <label className="block text-[11px] font-mono-code uppercase font-bold text-slate-400 mb-1.5">
              Quick Reason Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {REASON_PRESETS[activeTab].map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handlePresetSelect(p)}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    reason === p.label
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason Note */}
          <div>
            <label className="block text-[11px] font-mono-code uppercase font-bold text-slate-400 mb-1.5">
              Specific Reason / Note
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Unit 3 speaking debate excellence or store purchase"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
              required
            />
          </div>

          {/* Credit Score Modifier */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Credit Score Adjustment (Optional)
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Current: <span className="font-mono-code font-bold text-slate-200">{currentScore}</span>
                {creditChange !== 0 && (
                  <span className="font-mono-code ml-1.5 text-amber-300">
                    → {newScore} ({creditChange > 0 ? `+${creditChange}` : creditChange} pts)
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCreditChangeStr('-10')}
                className={`px-2 py-1 text-xs font-mono-code rounded border ${
                  creditChangeStr === '-10'
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => setCreditChangeStr('0')}
                className={`px-2 py-1 text-xs font-mono-code rounded border ${
                  creditChangeStr === '0'
                    ? 'bg-slate-700 text-white border-slate-600'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setCreditChangeStr('5')}
                className={`px-2 py-1 text-xs font-mono-code rounded border ${
                  creditChangeStr === '5'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                +5
              </button>
              <button
                type="button"
                onClick={() => setCreditChangeStr('15')}
                className={`px-2 py-1 text-xs font-mono-code rounded border ${
                  creditChangeStr === '15'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                +15
              </button>
            </div>
          </div>

          {/* Warning if deducting more than balance */}
          {isExceedingBalance && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-center gap-2.5 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Amount ({formatCurrency(amount)}) exceeds student current balance ({formatCurrency(currentBalance)}). New balance will be capped at {CURRENCY_SYMBOL} 0.
              </span>
            </div>
          )}

          {/* Transaction Summary Card */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] font-mono-code uppercase tracking-wider text-slate-500 mb-2 font-bold">
              Transaction Preview
            </div>
            <div className="flex items-center justify-between text-sm font-mono-code">
              <div>
                <div className="text-xs text-slate-400">Previous Balance</div>
                <div className="text-slate-300 font-bold">{formatCurrency(currentBalance)}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="text-center">
                <div className="text-xs text-slate-400">Adjustment</div>
                <div
                  className={`font-black ${
                    activeTab === 'increase' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {activeTab === 'increase' ? `+` : `-`}
                  {formatCurrency(amount)}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="text-right">
                <div className="text-xs text-slate-400">New Balance</div>
                <div className="text-emerald-300 font-black text-base">
                  {formatCurrency(newBalance)}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={amount <= 0}
              className={`flex-1 py-3 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'increase'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm {activeTab === 'increase' ? 'Deposit' : 'Deduction'} ({formatCurrency(amount)})
            </button>
          </div>
        </form>

        {/* Audit Log / History Toggle */}
        {currentStudent.balanceAdjustmentsHistory && currentStudent.balanceAdjustmentsHistory.length > 0 && (
          <div className="p-5 border-t border-slate-800 bg-slate-950/30">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-200"
            >
              <span className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                Recent Manual Adjustments ({currentStudent.balanceAdjustmentsHistory.length})
              </span>
              <span>{showHistory ? '▲ Hide' : '▼ View'}</span>
            </button>

            {showHistory && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                {currentStudent.balanceAdjustmentsHistory.map((h) => (
                  <div
                    key={h.id}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-200">{h.reason}</div>
                      <div className="text-[10px] text-slate-500 font-mono-code">
                        {new Date(h.timestamp).toLocaleString()} • Prev: {formatCurrency(h.previousBalance)} → New: {formatCurrency(h.newBalance)}
                      </div>
                    </div>
                    <span
                      className={`font-mono-code font-black text-xs px-2 py-0.5 rounded ${
                        h.type === 'increase'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {h.type === 'increase' ? '+' : '-'}
                      {formatCurrency(h.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
