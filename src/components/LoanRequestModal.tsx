import React, { useState, useMemo } from 'react';
import { X, AlertTriangle, CheckCircle, Calculator, Calendar, DollarSign, Clock, BookOpen, Sparkles } from 'lucide-react';
import { Student, Loan, TeacherSettings } from '../types';
import { calculateEffectiveInterest, calculateTotalDue, suggestTaskCombinations, formatCurrency } from '../utils/creditCalculator';

interface LoanRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  activeLoan?: Loan | null;
  settings: TeacherSettings;
  onSubmitLoan: (loanData: {
    principal: number;
    durationDays: number;
    loanType: 'short' | 'big';
    notes: string;
  }) => void;
}

export const LoanRequestModal: React.FC<LoanRequestModalProps> = ({
  isOpen,
  onClose,
  student,
  activeLoan,
  settings,
  onSubmitLoan,
}) => {
  const [loanAmount, setLoanAmount] = useState<number>(Math.min(50, student.maxLoanLimit));
  const [loanType, setLoanType] = useState<'short' | 'big'>('short');
  const [durationDays, setDurationDays] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');

  // Rules checks
  const isDelisted = student.cardStatus === 'delisted';
  const hasExistingLoan = !!activeLoan && activeLoan.status !== 'paid';

  // Calculations
  const effectiveRate = settings.baseInterestRate; // New loans start with base 10%
  const totalRepayment = useMemo(() => calculateTotalDue(loanAmount, effectiveRate), [loanAmount, effectiveRate]);
  const interestAmount = totalRepayment - loanAmount;

  // English task combos
  const taskSuggestions = useMemo(() => {
    return suggestTaskCombinations(totalRepayment, settings);
  }, [totalRepayment, settings]);

  if (!isOpen) return null;

  const handleTypeChange = (type: 'short' | 'big') => {
    setLoanType(type);
    if (type === 'short') {
      setDurationDays(Math.min(durationDays, 5));
    } else {
      setDurationDays(Math.max(6, Math.min(durationDays, 21)));
    }
  };

  const handlePrincipalChange = (val: number) => {
    const clamped = Math.max(10, Math.min(val, student.maxLoanLimit));
    setLoanAmount(clamped);
    if (clamped > 100 && loanType === 'short') {
      // Big loan recommended for higher sums
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDelisted || hasExistingLoan) return;
    onSubmitLoan({
      principal: loanAmount,
      durationDays,
      loanType,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-serif-card text-white">
                Request Classroom Loan
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Applicant: <strong className="text-slate-200">{student.name}</strong> • Card: {student.studentIdNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Blocking Warnings */}
        {isDelisted && (
          <div className="mt-4 p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-300 uppercase">Card Declined & Delisted Forever</h4>
              <p className="text-xs text-red-200/90 mt-1">
                Per didactic rules, students with defaulted loans have their cards permanently revoked and cannot apply for new loans.
              </p>
            </div>
          </div>
        )}

        {hasExistingLoan && !isDelisted && (
          <div className="mt-4 p-4 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-300 uppercase">Active Loan In Progress</h4>
              <p className="text-xs text-amber-200/90 mt-1">
                Rule: Students <strong>cannot ask for multiple loans at the same time</strong>. You must completely repay your active loan (${activeLoan.totalDue - activeLoan.amountRepaid} remaining) before requesting another.
              </p>
            </div>
          </div>
        )}

        {!isDelisted && !hasExistingLoan && (
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            {/* Amount Slider & Input */}
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-200">Loan Amount</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold font-mono-code text-amber-400">${loanAmount}</span>
                  <span className="text-xs text-slate-400">/ max ${student.maxLoanLimit}</span>
                </div>
              </div>

              <input
                type="range"
                min="10"
                max={student.maxLoanLimit}
                step="5"
                value={loanAmount}
                onChange={(e) => handlePrincipalChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />

              <div className="flex justify-between text-[11px] text-slate-400 font-mono-code">
                <span>Min: $10</span>
                <span>Starting Cap: ${settings.startingLoanLimit}</span>
                <span>Your Current Limit: ${student.maxLoanLimit}</span>
              </div>
            </div>

            {/* Loan Type & Duration Selector */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-200">Loan Term Classification</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleTypeChange('short')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    loanType === 'short'
                      ? 'bg-amber-500/10 border-amber-500/60 text-white shadow-lg shadow-amber-950/20'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Short Loan</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-xs text-slate-300 mt-1">Maximum 5 days</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Quick turnaround, quick score boost</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange('big')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    loanType === 'big'
                      ? 'bg-indigo-500/10 border-indigo-500/60 text-white shadow-lg shadow-indigo-950/20'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Big Loan</span>
                    <Calendar className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-xs text-slate-300 mt-1">Maximum 3 weeks (21 days)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">For larger study materials & projects</p>
                </button>
              </div>

              {/* Days selector */}
              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-300 font-medium">Payment Deadline:</span>
                  <p className="text-sm font-bold font-mono-code text-white">
                    {durationDays} Day{durationDays > 1 ? 's' : ''} ({loanType === 'short' ? 'Short Loan: 1-5 days' : 'Big Loan: 6-21 days'})
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {loanType === 'short' ? (
                    [1, 2, 3, 4, 5].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDurationDays(d)}
                        className={`w-8 h-8 rounded-lg font-mono-code text-xs font-bold transition-colors ${
                          durationDays === d
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {d}d
                      </button>
                    ))
                  ) : (
                    [7, 10, 14, 18, 21].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDurationDays(d)}
                        className={`px-2.5 h-8 rounded-lg font-mono-code text-xs font-bold transition-colors ${
                          durationDays === d
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {d}d
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Repayment & English Tasks Calculation Breakdown */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900 border border-slate-700/70 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold uppercase tracking-wider">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  Financial Breakdown (10% Interest)
                </div>
                <span className="text-xs font-mono-code text-emerald-400 font-bold">
                  Total Repayment: ${totalRepayment}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono-code">
                <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Principal</span>
                  <span className="font-bold text-white">${loanAmount}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Interest (10%)</span>
                  <span className="font-bold text-amber-400">+${interestAmount}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Late Delay Fee</span>
                  <span className="font-bold text-rose-400">+{settings.delayPenaltyIncrement}%/delay</span>
                </div>
              </div>

              {/* How to Pay in English Tasks */}
              <div className="pt-2">
                <p className="text-xs font-bold text-slate-200 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  How you can pay this loan with English tasks:
                </p>
                <div className="mt-2 space-y-1.5 text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-center text-cyan-300">
                    <span>Option A (Phrasal Verbs):</span>
                    <strong className="font-mono-code">
                      {taskSuggestions.purePhrasalVerbs} Phrasal Verb{taskSuggestions.purePhrasalVerbs > 1 ? 's' : ''} (${settings.phrasalVerbValue} ea)
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-emerald-300">
                    <span>Option B (English Sentences):</span>
                    <strong className="font-mono-code">
                      {taskSuggestions.pureSentences} Sentence{taskSuggestions.pureSentences > 1 ? 's' : ''} (${settings.sentenceValue} ea)
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-amber-300">
                    <span>Option C (Book Words):</span>
                    <strong className="font-mono-code">
                      {taskSuggestions.pureWords} New Word{taskSuggestions.pureWords > 1 ? 's' : ''} (${settings.wordValue} ea)
                    </strong>
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-purple-300">
                      <Sparkles className="w-3 h-3" />
                      Decorated Notebook Bonus:
                    </span>
                    <span className="text-purple-300 font-mono-code font-bold">
                      +{settings.decoratedPresentationScoreBoost} pts to Credit Score!
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes / Reason */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Loan Purpose / Educational Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. English literature workbook, grammar practice kit..."
                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm & Issue Loan
              </button>
            </div>
          </form>
        )}

        {(isDelisted || hasExistingLoan) && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
