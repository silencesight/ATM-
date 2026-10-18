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
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="glass-panel rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-5 my-8 specular-edge text-on-surface">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-tertiary-container/15 border border-tertiary-container/30 flex items-center justify-center text-tertiary-fixed-dim">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-headline tracking-tight text-on-surface">
                Classroom Credit &amp; Didactic Rules
              </h2>
              <p className="text-[11px] font-mono text-on-surface-variant">
                Operational standards for student cardholders &bull; {settings.schoolName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl glass-pill text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs leading-relaxed max-h-[65vh] overflow-y-auto pr-1">
          {/* Section 1 */}
          <div className="p-4 rounded-2xl glass-well space-y-1.5 text-on-surface-variant">
            <h3 className="font-bold text-tertiary-fixed-dim text-xs uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <CreditCard className="w-4 h-4" />
              1. Starting Balance &amp; Maintenance Schedule
            </h3>
            <p>
              Every student receives a didactic debit/credit card with an initial balance of{' '}
              <strong className="font-mono text-tertiary-fixed-dim">E${settings.startingBalance}</strong>.
            </p>
            <p>
              Standard monthly payment is{' '}
              <strong className="font-mono font-semibold text-on-surface">E${settings.monthlyPayment}</strong>, with a bimonthly option of{' '}
              <strong className="font-mono font-semibold text-on-surface">E${settings.bimonthlyPayment}</strong> (every two weeks).
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-4 rounded-2xl glass-well space-y-1.5 text-on-surface-variant">
            <h3 className="font-bold text-primary-container text-xs uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <DollarSign className="w-4 h-4" />
              2. Loans &amp; Duration Limits
            </h3>
            <p>
              Students can request loans starting at{' '}
              <strong className="font-mono font-semibold text-on-surface">E${settings.startingLoanLimit}</strong>. Based on credit history, limits increase up to{' '}
              <strong className="font-mono font-semibold text-on-surface">E${settings.maxLoanCap}</strong>.
            </p>
            <p className="text-amber-400 font-medium">
              &bull; Exact Rule: Exactly one active loan at a time; full settlement required before requesting another.
            </p>
            <p>
              Duration: Maximum <strong className="text-on-surface">5 days</strong> for Short Loans, and maximum <strong className="text-on-surface">3 weeks (21 days)</strong> for Big Loans.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-4 rounded-2xl glass-well space-y-2 text-on-surface-variant">
            <h3 className="font-bold text-tertiary-fixed-dim text-xs uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <BookOpen className="w-4 h-4" />
              3. Repayment with English Proficiency Currency
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono">
              <div className="p-2.5 rounded-xl glass-pill text-center">
                <span className="text-tertiary-fixed-dim font-bold block text-sm">E${settings.sentenceValue}</span>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider font-sans">English sentence</span>
              </div>
              <div className="p-2.5 rounded-xl glass-pill text-center">
                <span className="text-tertiary-fixed-dim font-bold block text-sm">E${settings.wordValue}</span>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider font-sans">New book word</span>
              </div>
              <div className="p-2.5 rounded-xl glass-pill text-center">
                <span className="text-tertiary-fixed-dim font-bold block text-sm">E${settings.phrasalVerbValue}</span>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider font-sans">Phrasal verb</span>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="p-4 rounded-2xl glass-well space-y-1.5 text-on-surface-variant">
            <h3 className="font-bold text-secondary text-xs uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Sparkles className="w-4 h-4" />
              4. Interest, Delays &amp; Credit Progression
            </h3>
            <p>
              Base loan interest is <strong className="font-mono font-semibold text-on-surface">{settings.baseInterestRate}%</strong>. Delayed payments increase interest by{' '}
              <strong className="font-mono text-amber-400">+{settings.delayPenaltyIncrement}% per delay</strong>.
            </p>
            <p>
              Punctuality: On-time payments boost credit score by{' '}
              <strong className="font-mono text-tertiary-fixed-dim">+{settings.punctualityScoreBoost} pts</strong>.
            </p>
            <p>
              Decorated Presentation: Art and illustrations boost credit score by{' '}
              <strong className="font-mono text-tertiary-fixed-dim">+{settings.decoratedPresentationScoreBoost} pts</strong>.
            </p>
            <p className="text-error font-semibold">
              Permanent Delisting: Overdue loans that are not paid lead to permanent card decline and delisting.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 liquid-button-emerald font-bold text-xs uppercase tracking-widest rounded-full transition-all font-headline"
          >
            Understood &amp; Ready
          </button>
        </div>
      </div>
    </div>
  );
};
