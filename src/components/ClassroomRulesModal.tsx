import React from 'react';
import { BookOpen, CreditCard, DollarSign, Sparkles, X } from 'lucide-react';
import { TeacherSettings } from '../types';

interface ClassroomRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TeacherSettings;
  theme?: 'dark' | 'light';
}

export const ClassroomRulesModal: React.FC<ClassroomRulesModalProps> = ({
  isOpen,
  onClose,
  settings,
  theme = 'dark',
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className={`border rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-5 my-8 transition-colors ${
          isDark
            ? 'bg-[#121622] border-white/[0.1] text-slate-100'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        <div className={`flex items-center justify-between border-b pb-3.5 ${
          isDark ? 'border-white/[0.08]' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#42e5b0]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display tracking-tight">
                Classroom Credit &amp; Didactic Rules
              </h2>
              <p className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Operational standards for student cardholders &bull; {settings.schoolName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-white bg-white/[0.05] border-white/[0.08]'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 border-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs leading-relaxed max-h-[65vh] overflow-y-auto pr-1">
          {/* Section 1 */}
          <div
            className={`p-4 rounded-xl border space-y-1.5 ${
              isDark
                ? 'bg-white/[0.03] border-white/[0.06] text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <h3 className="font-bold text-[#42e5b0] text-xs uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <CreditCard className="w-4 h-4" />
              1. Starting Balance &amp; Maintenance Schedule
            </h3>
            <p>
              Every student receives a didactic debit/credit card with an initial balance of{' '}
              <strong className="font-mono text-[#42e5b0]">${settings.startingBalance}</strong>.
            </p>
            <p>
              Standard monthly payment is{' '}
              <strong className="font-mono font-semibold">${settings.monthlyPayment}</strong>, with a bimonthly option of{' '}
              <strong className="font-mono font-semibold">${settings.bimonthlyPayment}</strong> (every two weeks).
            </p>
          </div>

          {/* Section 2 */}
          <div
            className={`p-4 rounded-xl border space-y-1.5 ${
              isDark
                ? 'bg-white/[0.03] border-white/[0.06] text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <h3 className="font-bold text-sky-400 text-xs uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <DollarSign className="w-4 h-4" />
              2. Loans &amp; Duration Limits
            </h3>
            <p>
              Students can request loans starting at{' '}
              <strong className="font-mono font-semibold">${settings.startingLoanLimit}</strong>. Based on credit history, limits increase up to{' '}
              <strong className="font-mono font-semibold">${settings.maxLoanCap}</strong>.
            </p>
            <p className="text-amber-400 font-medium">
              &bull; Exact Rule: Exactly one active loan at a time; full settlement required before requesting another.
            </p>
            <p>
              Duration: Maximum <strong>5 days</strong> for Short Loans, and maximum <strong>3 weeks (21 days)</strong> for Big Loans.
            </p>
          </div>

          {/* Section 3 */}
          <div
            className={`p-4 rounded-xl border space-y-2 ${
              isDark
                ? 'bg-white/[0.03] border-white/[0.06] text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <h3 className="font-bold text-[#42e5b0] text-xs uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <BookOpen className="w-4 h-4" />
              3. Repayment with English Proficiency Currency
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono">
              <div
                className={`p-2.5 rounded-lg border text-center ${
                  isDark ? 'bg-black/30 border-white/[0.08]' : 'bg-white border-slate-200'
                }`}
              >
                <span className="text-[#42e5b0] font-bold block text-sm">${settings.sentenceValue}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-sans">English sentence</span>
              </div>
              <div
                className={`p-2.5 rounded-lg border text-center ${
                  isDark ? 'bg-black/30 border-white/[0.08]' : 'bg-white border-slate-200'
                }`}
              >
                <span className="text-[#42e5b0] font-bold block text-sm">${settings.wordValue}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-sans">New book word</span>
              </div>
              <div
                className={`p-2.5 rounded-lg border text-center ${
                  isDark ? 'bg-black/30 border-white/[0.08]' : 'bg-white border-slate-200'
                }`}
              >
                <span className="text-[#42e5b0] font-bold block text-sm">${settings.phrasalVerbValue}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-sans">Phrasal verb</span>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div
            className={`p-4 rounded-xl border space-y-1.5 ${
              isDark
                ? 'bg-white/[0.03] border-white/[0.06] text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <h3 className="font-bold text-purple-400 text-xs uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Sparkles className="w-4 h-4" />
              4. Interest, Delays &amp; Credit Progression
            </h3>
            <p>
              Base loan interest is <strong className="font-mono font-semibold">{settings.baseInterestRate}%</strong>. Delayed payments increase interest by{' '}
              <strong className="font-mono text-amber-400">+{settings.delayPenaltyIncrement}% per delay</strong>.
            </p>
            <p>
              Punctuality: On-time payments boost credit score by{' '}
              <strong className="font-mono text-[#42e5b0]">+{settings.punctualityScoreBoost} pts</strong>.
            </p>
            <p>
              Decorated Presentation: Art and illustrations boost credit score by{' '}
              <strong className="font-mono text-[#42e5b0]">+{settings.decoratedPresentationScoreBoost} pts</strong>.
            </p>
            <p className="text-rose-400 font-semibold">
              Permanent Delisting: Overdue loans that are not paid lead to permanent card decline and delisting.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md font-mono"
          >
            Understood &amp; Ready
          </button>
        </div>
      </div>
    </div>
  );
};
