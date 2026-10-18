import React, { useState } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Award,
  Calendar,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Filter,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import {
  Student,
  Loan,
  CreditLimitRaiseTransaction,
  EnglishRewardTransaction,
  StorePurchaseTransaction,
  BalanceAdjustmentTransaction,
} from '../types';

interface StudentYearlyHistoryProps {
  student: Student;
  loans: Loan[];
  compact?: boolean;
}

type HistoryCategory = 'all' | 'rises' | 'paid_loans' | 'rewards' | 'store';

interface UnifiedHistoryEvent {
  id: string;
  type: 'rise' | 'paid_loan' | 'reward' | 'adjustment' | 'store';
  timestamp: string;
  title: string;
  subtitle: string;
  amountLabel: string;
  amountColor: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  details?: string;
  icon: React.ReactNode;
}

export const StudentYearlyHistory: React.FC<StudentYearlyHistoryProps> = ({
  student,
  loans,
  compact = false,
}) => {
  const [filter, setFilter] = useState<HistoryCategory>('all');

  // 1. Credit Limit Rises
  const rises: CreditLimitRaiseTransaction[] = student.creditLimitRaisesHistory || [];

  // 2. Paid Loans
  const paidLoans = loans.filter(
    (l) => l.studentId === student.id && (l.status === 'paid' || l.amountRepaid >= l.totalDue)
  );

  // 3. English Participation Rewards
  const rewards: EnglishRewardTransaction[] = student.englishRewardsHistory || [];

  // 4. Store Purchases
  const storePurchases: StorePurchaseTransaction[] = student.storePurchasesHistory || [];

  // 5. Balance Adjustments
  const adjustments: BalanceAdjustmentTransaction[] = student.balanceAdjustmentsHistory || [];

  // Assemble unified list sorted by date descending
  const events: UnifiedHistoryEvent[] = [];

  rises.forEach((r) => {
    events.push({
      id: r.id,
      type: 'rise',
      timestamp: r.timestamp,
      title: `Credit Limit Raised to E$${r.newLimit}.00`,
      subtitle: `Previous: E$${r.previousLimit}.00 • Granted by ${r.grantedBy}`,
      amountLabel: `+E$${r.increaseAmount}.00 Rise`,
      amountColor: 'text-emerald-400',
      badge: 'Credit Limit Rise',
      badgeColor: 'text-emerald-300',
      badgeBg: 'bg-emerald-500/20 border-emerald-500/40',
      details: r.reason + (r.creditScoreBonus ? ` (Awarded +${r.creditScoreBonus} Credit Score!)` : ''),
      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    });
  });

  paidLoans.forEach((l) => {
    const isPunctual = l.delaysCount === 0;
    events.push({
      id: l.id,
      type: 'paid_loan',
      timestamp: l.paidAt || l.dueDate || l.createdAt,
      title: `Loan Paid & Settled in Full`,
      subtitle: `Principal: E$${l.principal}.00 • Total with Interest: E$${l.totalDue}.00 (${l.effectiveInterestRate}%)`,
      amountLabel: `E$${l.totalDue}.00 Repaid`,
      amountColor: 'text-teal-400',
      badge: isPunctual ? 'Punctual Settlement' : `${l.delaysCount} Delays`,
      badgeColor: isPunctual ? 'text-teal-300' : 'text-amber-300',
      badgeBg: isPunctual
        ? 'bg-teal-500/20 border-teal-500/40'
        : 'bg-amber-500/20 border-amber-500/40',
      details: l.notes || (isPunctual ? 'Settled on time per didactic credit regulations.' : 'Settled with didactic delays.'),
      icon: <CheckCircle2 className="w-4 h-4 text-teal-400" />,
    });
  });

  rewards.forEach((rw) => {
    events.push({
      id: rw.id,
      type: 'reward',
      timestamp: rw.createdAt,
      title: `In-Class English Reward`,
      subtitle: rw.reason,
      amountLabel: `+E$${rw.amount}.00`,
      amountColor: 'text-emerald-400',
      badge: 'Class Participation',
      badgeColor: 'text-cyan-300',
      badgeBg: 'bg-cyan-500/20 border-cyan-500/40',
      details: `Awarded directly to account balance for active English participation.`,
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
    });
  });

  adjustments.forEach((adj) => {
    const isIncrease = adj.type === 'increase';
    events.push({
      id: adj.id,
      type: 'adjustment',
      timestamp: adj.timestamp,
      title: `Teacher Balance ${isIncrease ? 'Credit' : 'Adjustment'}`,
      subtitle: adj.reason,
      amountLabel: `${isIncrease ? '+E$' : '-E$'}${adj.amount}.00`,
      amountColor: isIncrease ? 'text-emerald-400' : 'text-rose-400',
      badge: adj.category?.toUpperCase() || 'ADJUSTMENT',
      badgeColor: isIncrease ? 'text-emerald-300' : 'text-rose-300',
      badgeBg: isIncrease
        ? 'bg-emerald-500/20 border-emerald-500/40'
        : 'bg-rose-500/20 border-rose-500/40',
      details: `Previous Balance: E$${adj.previousBalance}.00 → New Balance: E$${adj.newBalance}.00`,
      icon: <DollarSign className={`w-4 h-4 ${isIncrease ? 'text-emerald-400' : 'text-rose-400'}`} />,
    });
  });

  storePurchases.forEach((sp) => {
    events.push({
      id: sp.id,
      type: 'store',
      timestamp: sp.timestamp,
      title: `Classroom Store: ${sp.itemName}`,
      subtitle: `Acquired privilege item with Eurodollars`,
      amountLabel: `-E$${sp.pricePaid}.00`,
      amountColor: 'text-purple-400',
      badge: 'Store Privilege',
      badgeColor: 'text-purple-300',
      badgeBg: 'bg-purple-500/20 border-purple-500/40',
      details: `Paid E$${sp.pricePaid}.00${sp.discountPercent > 0 ? ` (${sp.discountPercent}% discount applied)` : ''}. Awarded +${sp.creditScoreBonusAwarded} Credit Score bonus!`,
      icon: <ShoppingBag className="w-4 h-4 text-purple-400" />,
    });
  });

  // Sort chronological descending
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter events
  const filteredEvents = events.filter((ev) => {
    if (filter === 'all') return true;
    if (filter === 'rises') return ev.type === 'rise';
    if (filter === 'paid_loans') return ev.type === 'paid_loan';
    if (filter === 'rewards') return ev.type === 'reward' || ev.type === 'adjustment';
    if (filter === 'store') return ev.type === 'store';
    return true;
  });

  const totalRisesAmount = rises.reduce((acc, r) => acc + r.increaseAmount, 0);
  const totalPaidLoansCount = paidLoans.length;
  const totalRewardsAmount = rewards.reduce((acc, r) => acc + r.amount, 0);

  return (
    <div className="glass-panel rounded-3xl p-5 md:p-6 space-y-5 relative overflow-hidden specular-edge">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary-container to-tertiary-container" />

      {/* Header & KPI Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-outline-variant/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-on-surface uppercase tracking-wider font-headline flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-container" />
              Annual Activity &amp; Credit History
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-container/15 text-primary-container font-mono text-[10px] font-bold border border-primary-container/30">
              Whole Year Track Record
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Complete financial dossier of credit limit rises granted, loans settled, and English rewards earned throughout the academic year.
          </p>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          <div className="p-2.5 rounded-2xl glass-well text-center">
            <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-mono font-bold block">
              Rises Received
            </span>
            <p className="text-sm font-bold font-mono text-tertiary-fixed-dim">
              {rises.length} {rises.length === 1 ? 'Rise' : 'Rises'}
            </p>
            <span className="text-[10px] text-on-surface-variant font-mono">
              +E${totalRisesAmount} total
            </span>
          </div>

          <div className="p-2.5 rounded-2xl glass-well text-center">
            <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-mono font-bold block">
              Loans Paid Off
            </span>
            <p className="text-sm font-bold font-mono text-primary-container">
              {totalPaidLoansCount} Settled
            </p>
            <span className="text-[10px] text-on-surface-variant font-mono">
              {student.punctualPaymentsCount} on-time
            </span>
          </div>

          <div className="p-2.5 rounded-2xl glass-well text-center">
            <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-mono font-bold block">
              English Earned
            </span>
            <p className="text-sm font-bold font-mono text-tertiary-fixed-dim">
              E${totalRewardsAmount}.00
            </p>
            <span className="text-[10px] text-on-surface-variant font-mono">
              in class awards
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
            filter === 'all'
              ? 'bg-primary-container text-on-primary-fixed shadow-sm'
              : 'glass-well text-on-surface-variant hover:text-on-surface'
          }`}
        >
          All Activity ({events.length})
        </button>
        <button
          onClick={() => setFilter('rises')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            filter === 'rises'
              ? 'bg-tertiary-container/25 text-tertiary-fixed-dim border border-tertiary-container/50 shadow-sm'
              : 'glass-well text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-tertiary-fixed-dim" />
          Credit Rises ({rises.length})
        </button>
        <button
          onClick={() => setFilter('paid_loans')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            filter === 'paid_loans'
              ? 'bg-primary-container/20 text-primary-container border border-primary-container/50 shadow-sm'
              : 'glass-well text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-primary-container" />
          Paid Loans ({paidLoans.length})
        </button>
        <button
          onClick={() => setFilter('rewards')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            filter === 'rewards'
              ? 'bg-primary-container/20 text-primary-container border border-primary-container/50 shadow-sm'
              : 'glass-well text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-primary-container" />
          Rewards &amp; Credits ({rewards.length + adjustments.length})
        </button>
        {storePurchases.length > 0 && (
          <button
            onClick={() => setFilter('store')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              filter === 'store'
                ? 'bg-secondary-container/30 text-secondary border border-secondary/40 shadow-sm'
                : 'glass-well text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-secondary" />
            Store ({storePurchases.length})
          </button>
        )}
      </div>

      {/* History Timeline Cards */}
      <div className={`space-y-2.5 ${compact ? 'max-h-80' : 'max-h-[520px]'} overflow-y-auto pr-1`}>
        {filteredEvents.length > 0 ? (
          filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="p-3.5 rounded-2xl glass-well hover:border-primary-container/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl glass-pill shrink-0 mt-0.5">
                  {ev.icon}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-bold text-on-surface font-mono">{ev.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${ev.badgeBg} ${ev.badgeColor}`}
                    >
                      {ev.badge}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-sans">{ev.subtitle}</p>
                  {ev.details && (
                    <p className="text-[11px] text-outline font-mono italic">
                      Note: {ev.details}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-outline-variant/20 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
                <span className={`text-sm font-bold font-mono ${ev.amountColor}`}>
                  {ev.amountLabel}
                </span>
                <span className="text-[10px] text-on-surface-variant font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-outline" />
                  {new Date(ev.timestamp).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 rounded-2xl glass-well text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-outline mx-auto" />
            <p className="text-xs font-bold text-on-surface font-mono uppercase tracking-wider">
              No History Records in this Filter
            </p>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              Your academic year records update automatically as loans are settled, credit limit rises are awarded by the teacher, and English participation dollars are logged!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
