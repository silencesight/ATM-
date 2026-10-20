import React, { useState } from 'react';
import {
  CheckCircle2,
  BookOpen,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  DollarSign,
  Layers,
  Printer,
  Zap,
  History,
  GraduationCap,
  ArrowUpRight,
} from 'lucide-react';
import {
  Student,
  Loan,
  TeacherSettings,
  PaymentFrequency,
  EnglishSubmission,
} from '../types';
import {
  getCreditTier,
  CREDIT_TIERS,
  suggestTaskCombinations,
  getDaysDifference,
  getTodayDateString,
} from '../utils/creditCalculator';
import { CreditCardVisual } from './CreditCardVisual';
import { LoanRequestModal } from './LoanRequestModal';
import { EnglishSubmissionModal } from './EnglishSubmissionModal';
import { QuickAddDailyDollarsModal } from './QuickAddDailyDollarsModal';
import { GrantCreditLimitRaiseModal } from './GrantCreditLimitRaiseModal';
import { StudentLoansLedger } from './StudentLoansLedger';
import { StudentSelectorNav } from './StudentSelectorNav';
import { StudentAvatar } from './StudentAvatar';

interface StudentPortalProps {
  student: Student;
  students?: Student[];
  allStudents?: Student[];
  onSelectStudent?: (id: string) => void;
  activeLoan?: Loan | null;
  loans: Loan[];
  settings: TeacherSettings;
  onUpdatePaymentFrequency?: (studentId: string, freq: PaymentFrequency) => void;
  onRequestLoan: (loanData: {
    principal: number;
    durationDays: number;
    loanType: 'short' | 'big';
    notes: string;
  }) => void;
  onSubmitEnglishWork: (submission: Omit<EnglishSubmission, 'id' | 'createdAt'>) => void;
  onPrintCard?: (studentId: string) => void;
  onAddDailyReward?: (
    studentId: string,
    amount: number,
    reason: string
  ) => { success: boolean; error?: string };
  onGrantCreditLimitRaise?: (
    studentId: string,
    newLimit: number,
    reason: string,
    creditScoreBonus?: number
  ) => void;
  theme?: 'dark' | 'light';
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  student,
  students,
  allStudents,
  onSelectStudent,
  activeLoan: activeLoanProp,
  loans,
  settings,
  onUpdatePaymentFrequency,
  onRequestLoan,
  onSubmitEnglishWork,
  onPrintCard,
  onAddDailyReward,
  onGrantCreditLimitRaise,
}) => {
  const roster = students || allStudents || [];
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [isDailyRewardModalOpen, setIsDailyRewardModalOpen] = useState(false);
  const [isCreditRaiseModalOpen, setIsCreditRaiseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'statements' | 'loans'>('overview');
  const [selectedPresetAdvance, setSelectedPresetAdvance] = useState<number>(
    Math.min(50, student.maxLoanLimit)
  );

  const todayStr = getTodayDateString();
  const earnedToday =
    student.dailyEnglishEarned && student.dailyEnglishEarned.date === todayStr
      ? student.dailyEnglishEarned.amount
      : 0;

  const studentLoans = loans.filter((l) => l.studentId === student.id);
  const activeLoan =
    activeLoanProp !== undefined
      ? activeLoanProp
      : studentLoans.find((l) => l.status !== 'paid') || null;
  const paidLoans = studentLoans.filter((l) => l.status === 'paid');

  const tier = getCreditTier(student.creditScore);
  const isDelisted = student.cardStatus === 'delisted';

  const currentTierIndex = CREDIT_TIERS.findIndex((t) => t.name === tier.name);
  const nextTier =
    currentTierIndex >= 0 && currentTierIndex < CREDIT_TIERS.length - 1
      ? CREDIT_TIERS[currentTierIndex + 1]
      : null;

  const remainingDebt = activeLoan
    ? Math.max(0, activeLoan.totalDue - activeLoan.amountRepaid)
    : 0;
  const combo = activeLoan ? suggestTaskCombinations(remainingDebt, settings) : null;
  const daysInfo = activeLoan ? getDaysDifference(activeLoan.dueDate) : null;

  // Build unified activity stream for this student
  const studentActivityStream = React.useMemo(() => {
    const items: {
      id: string;
      date: string;
      title: string;
      subtitle: string;
      amount: number;
      type: 'reward' | 'adjustment' | 'loan';
    }[] = [];

    (student.englishRewardsHistory || []).forEach((r) => {
      items.push({
        id: `rew-${r.id}`,
        date: r.createdAt,
        title: r.reason,
        subtitle: 'English Daily Eurodollar Grant',
        amount: r.amount,
        type: 'reward',
      });
    });

    (student.balanceAdjustmentsHistory || []).forEach((m) => {
      items.push({
        id: `adj-${m.id}`,
        date: m.timestamp,
        title: m.reason,
        subtitle: `Treasury ${(m.category || 'adjustment').toUpperCase()}${
          m.creditScoreChange
            ? ` (${m.creditScoreChange > 0 ? '+' : ''}${m.creditScoreChange} PTS)`
            : ''
        }`,
        amount: m.type === 'increase' ? m.amount : -m.amount,
        type: 'adjustment',
      });
    });

    (student.storePurchasesHistory || []).forEach((p) => {
      items.push({
        id: `store-${p.id}`,
        date: p.timestamp,
        title: `Store Redemption: ${p.itemName}`,
        subtitle: `Privilege • Qty ${p.quantity || 1}${
          p.creditScoreBonusAwarded ? ` (+${p.creditScoreBonusAwarded} PTS)` : ''
        }`,
        amount: -p.pricePaid,
        type: 'adjustment',
      });
    });

    studentLoans.forEach((l) => {
      items.push({
        id: `loan-${l.id}`,
        date: l.createdAt,
        title: `${l.loanType === 'short' ? 'Short Liquidity Advance' : 'Extended Term Loan'}`,
        subtitle: `Principal E$${l.principal} • ${l.effectiveInterestRate}% APR • ${
          l.status === 'paid' ? 'Settled' : 'Active'
        }`,
        amount: l.principal,
        type: 'loan',
      });
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [student, studentLoans]);

  const ficoPercent = Math.min(
    100,
    Math.max(5, Math.round(((student.creditScore - 300) / (850 - 300)) * 100))
  );

  return (
    <div className="space-y-6">
      {/* 1. TOP STUDENT SWITCHER RIBBON */}
      {roster.length > 1 && onSelectStudent && (
        <StudentSelectorNav
          students={roster}
          selectedStudentId={student.id}
          onSelectStudent={onSelectStudent}
          label="Active Cardholder"
          variant="section"
          showBalance={true}
          showCreditScore={true}
          showClassFilter={true}
          showShuffle={true}
        />
      )}

      {/* DELISTED WARNING BANNER */}
      {isDelisted && (
        <div className="glass-panel rounded-3xl p-5 border-2 border-error/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-error-container text-on-error-container flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-headline font-bold text-error uppercase tracking-wide">
                SmartPass Instrument Permanently Revoked &amp; Delisted
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                This account exceeded didactic repayment deadlines without verified English work presentation. Borrowing privileges are suspended until faculty reinstatement.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. STUDENT IDENTITY & HIGH-LEVEL TELEMETRY PLATE */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 specular-edge relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
          {/* Left: Student Identity & Badges */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <StudentAvatar
                name={student.name}
                avatarUrl={student.avatarUrl}
                size="lg"
              />
              <div
                className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-surface-container-lowest ${
                  isDelisted
                    ? 'bg-error text-on-error'
                    : 'bg-tertiary-container text-on-tertiary-fixed'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-headline font-bold text-on-surface tracking-tight">
                  {student.name}
                </h2>
                <span className="px-3 py-0.5 rounded-full text-[11px] font-mono font-bold bg-primary-container/15 text-primary-container border border-primary-container/35">
                  {tier.name} • {student.creditScore} PTS
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    isDelisted
                      ? 'bg-error-container text-on-error-container'
                      : 'bg-tertiary-container/15 text-tertiary-fixed-dim border border-tertiary-container/30'
                  }`}
                >
                  {isDelisted ? 'REVOKED' : 'NFC ENROLLED'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-on-surface-variant">
                <span>ID: {student.studentIdNumber}</span>
                <span>•</span>
                <span>Pass: •••• {student.cardNumber.slice(-4)}</span>
                {student.className && (
                  <>
                    <span>•</span>
                    <span className="text-on-surface font-semibold">{student.className}</span>
                  </>
                )}
                <span>•</span>
                <span>{settings.schoolName}</span>
              </div>
            </div>
          </div>

          {/* Right: Telemetry Pods & Primary CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Account Balance Pod */}
            <div className="glass-well rounded-2xl px-4 py-3 min-w-[155px]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant font-bold block">
                Available Reserve
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-mono font-extrabold text-tertiary-fixed-dim">
                  E$ {student.currentBalance.toLocaleString('en-US')}.00
                </span>
              </div>
              <span className="text-[10px] font-mono text-primary-container">
                +E$ {earnedToday}.00 earned today
              </span>
            </div>

            {/* Allowance Yield Pod */}
            <div className="glass-well rounded-2xl px-4 py-3 min-w-[140px]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant font-bold block">
                Allowance Yield
              </span>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="text-lg font-mono font-bold text-on-surface block">
                  {student.paymentFrequency === 'monthly'
                    ? `E$ ${settings.monthlyPayment}/MO`
                    : `E$ ${settings.bimonthlyPayment}/2WK`}
                </span>
                {onUpdatePaymentFrequency && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePaymentFrequency(
                        student.id,
                        student.paymentFrequency === 'monthly' ? 'bimonthly' : 'monthly'
                      )
                    }
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary-container/15 text-primary-container hover:bg-primary-container/25 transition-colors"
                    title="Switch Payment Frequency"
                  >
                    Switch
                  </button>
                )}
              </div>
              <span className="text-[10px] font-mono text-on-surface-variant">
                Ceiling: E$ {student.maxLoanLimit}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {onAddDailyReward && !isDelisted && (
                <button
                  type="button"
                  onClick={() => setIsDailyRewardModalOpen(true)}
                  className="liquid-button-emerald px-4 py-3 rounded-2xl text-xs font-headline font-bold flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Award +E$</span>
                </button>
              )}

              {activeLoan ? (
                <button
                  type="button"
                  onClick={() => setIsWorkModalOpen(true)}
                  className="liquid-button-primary px-5 py-3 rounded-2xl text-xs font-headline font-bold flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Present English Work</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isDelisted}
                  onClick={() => setIsLoanModalOpen(true)}
                  className="liquid-button-primary px-5 py-3 rounded-2xl text-xs font-headline font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Request Loan</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 glass-well p-1 rounded-full text-xs font-headline font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-1.5 rounded-full transition-all ${
                activeTab === 'overview'
                  ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Telemetry Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('statements')}
              className={`px-4 py-1.5 rounded-full transition-all ${
                activeTab === 'statements'
                  ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Statement Archive ({studentActivityStream.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('loans')}
              className={`px-4 py-1.5 rounded-full transition-all ${
                activeTab === 'loans'
                  ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Loan Agreements ({studentLoans.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => (onPrintCard ? onPrintCard(student.id) : window.print())}
            className="glass-pill px-3.5 py-1.5 rounded-full text-xs font-mono text-on-surface-variant hover:text-on-surface flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-primary-container" />
            <span>Print SmartPass</span>
          </button>
        </div>
      </div>

      {/* 3. TAB CONTENT */}
      {activeTab === 'loans' ? (
        <StudentLoansLedger
          student={student}
          loans={loans}
          settings={settings}
          onOpenEnglishWork={() => setIsWorkModalOpen(true)}
          onRequestNewLoan={() => setIsLoanModalOpen(true)}
        />
      ) : activeTab === 'statements' ? (
        <div className="glass-panel rounded-3xl p-6 space-y-4 specular-edge">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-primary-container" />
              <div>
                <h3 className="text-base font-headline font-bold text-on-surface">
                  Complete Statement Archive — {student.name}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Chronological record of all Eurodollar credits, adjustments, and loan contracts
                </p>
              </div>
            </div>
          </div>

          {studentActivityStream.length === 0 ? (
            <div className="glass-well rounded-2xl p-8 text-center text-xs font-mono text-on-surface-variant">
              No statement entries recorded yet for {student.name}.
            </div>
          ) : (
            <div className="space-y-2.5">
              {studentActivityStream.map((item) => (
                <div
                  key={item.id}
                  className="glass-well rounded-2xl p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-headline font-bold text-sm text-on-surface">{item.title}</p>
                    <p className="text-xs font-mono text-on-surface-variant">
                      {item.subtitle} • {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div
                    className={`font-mono font-bold text-sm ${
                      item.amount >= 0 ? 'text-tertiary-fixed-dim' : 'text-error'
                    }`}
                  >
                    {item.amount >= 0 ? '+' : '-'}E$ {Math.abs(item.amount)}.00
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* OVERVIEW TAB: 12-COLUMN ASYMMETRIC BENTO GRID */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 5 COLUMNS: Virtual SmartPass + Immediate Liquidity Advance + Campus Credential */}
          <div className="lg:col-span-5 space-y-6">
            {/* Assigned Virtual Instrument */}
            <div className="glass-panel rounded-3xl p-6 space-y-4 specular-edge">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-primary-container font-bold block">
                    HOLOGRAPHIC INSTRUMENT
                  </span>
                  <h3 className="text-base font-headline font-bold text-on-surface">
                    Assigned Virtual SmartPass
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full glass-well text-on-surface-variant">
                  CVV: {student.cvv}
                </span>
              </div>

              <CreditCardVisual student={student} settings={settings} interactive={true} />
            </div>

            {/* Immediate Liquidity Advance Interactive Pod */}
            <div className="glass-panel rounded-3xl p-6 space-y-4 specular-edge">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary-container" />
                  <h3 className="text-sm font-headline font-bold uppercase tracking-wider text-on-surface">
                    Immediate Liquidity Advance
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-primary-container font-bold">
                  Cap: E$ {student.maxLoanLimit}
                </span>
              </div>

              <p className="text-xs text-on-surface-variant">
                Borrow classroom Eurodollars now and settle principal + {settings.baseInterestRate}% interest by presenting verified English sentences, words, or phrasal verbs.
              </p>

              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map((amt) => {
                  const exceedsCap = amt > student.maxLoanLimit;
                  const isSelected = selectedPresetAdvance === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      disabled={exceedsCap || isDelisted || Boolean(activeLoan)}
                      onClick={() => setSelectedPresetAdvance(amt)}
                      className={`py-2.5 rounded-xl font-mono font-bold text-xs transition-all ${
                        isSelected
                          ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                          : 'glass-well text-on-surface hover:border-primary-container/40 disabled:opacity-35'
                      }`}
                    >
                      E$ {amt}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={isDelisted || Boolean(activeLoan)}
                onClick={() => setIsLoanModalOpen(true)}
                className="w-full py-3 rounded-full liquid-button-primary font-headline font-bold text-xs uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                <span>
                  {activeLoan
                    ? 'Active Loan in Progress'
                    : `Configure E$ ${selectedPresetAdvance} Advance`}
                </span>
              </button>
            </div>

            {/* Campus Identity & Didactic Exchange Credential Card */}
            <div className="glass-panel rounded-3xl p-6 space-y-4 specular-edge">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-tertiary-fixed-dim" />
                <div>
                  <h3 className="text-sm font-headline font-bold uppercase tracking-wider text-on-surface">
                    Didactic Repayment Tariff
                  </h3>
                  <p className="text-[11px] text-on-surface-variant">
                    Official English task exchange rates for loan settlement
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
                <div className="glass-well rounded-2xl p-3">
                  <span className="text-[10px] text-on-surface-variant uppercase block">
                    1 Sentence
                  </span>
                  <span className="text-sm font-extrabold text-tertiary-fixed-dim mt-0.5 block">
                    E$ {settings.sentenceValue}
                  </span>
                </div>
                <div className="glass-well rounded-2xl p-3">
                  <span className="text-[10px] text-on-surface-variant uppercase block">
                    1 Book Word
                  </span>
                  <span className="text-sm font-extrabold text-primary-container mt-0.5 block">
                    E$ {settings.wordValue}
                  </span>
                </div>
                <div className="glass-well rounded-2xl p-3">
                  <span className="text-[10px] text-on-surface-variant uppercase block">
                    1 Phrasal Verb
                  </span>
                  <span className="text-sm font-extrabold text-secondary mt-0.5 block">
                    E$ {settings.phrasalVerbValue}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 7 COLUMNS: Active Debt / Zero Debt Hero + Credit Tier Progression + Activity Stream */}
          <div className="lg:col-span-7 space-y-6">
            {/* Hero Panel: Active Loan Obligation OR Zero Active Debt */}
            {activeLoan ? (
              <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-5 specular-edge border border-amber-400/35">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/20">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-bold uppercase">
                        ACTIVE MICRO-LOAN OBLIGATION
                      </span>
                      <span className="text-xs font-mono text-on-surface-variant">
                        {daysInfo?.formatted}
                      </span>
                    </div>
                    <h3 className="text-xl font-headline font-bold text-on-surface mt-1">
                      Remaining Settlement: E$ {remainingDebt}.00
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsWorkModalOpen(true)}
                    className="liquid-button-emerald px-5 py-2.5 rounded-full text-xs font-headline font-bold flex items-center gap-2 self-start"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Present English Work</span>
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-on-surface-variant">
                    <span>Repaid: E$ {activeLoan.amountRepaid}.00</span>
                    <span>
                      Total Due: E$ {activeLoan.totalDue}.00 ({activeLoan.effectiveInterestRate}% APR)
                    </span>
                  </div>
                  <div className="w-full h-2.5 glass-well rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-container to-tertiary-container rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((activeLoan.amountRepaid / activeLoan.totalDue) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Suggested English Task Combinations */}
                {combo && remainingDebt > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant font-bold">
                      Recommended English Settlement Pathways:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                      <div className="glass-well rounded-2xl p-3.5">
                        <span className="text-[10px] text-primary-container uppercase font-bold block">
                          Balanced Combo
                        </span>
                        <p className="text-on-surface font-bold mt-1">
                          {combo.balancedCombo.phrasalVerbs} Phrasal +{' '}
                          {combo.balancedCombo.sentences} Sent. + {combo.balancedCombo.words} Words
                        </p>
                      </div>
                      <div className="glass-well rounded-2xl p-3.5">
                        <span className="text-[10px] text-tertiary-fixed-dim uppercase font-bold block">
                          Statements Only
                        </span>
                        <p className="text-on-surface font-bold mt-1">
                          {combo.pureSentences} Complete Sentences
                        </p>
                      </div>
                      <div className="glass-well rounded-2xl p-3.5">
                        <span className="text-[10px] text-secondary uppercase font-bold block">
                          Phrasal Mastery
                        </span>
                        <p className="text-on-surface font-bold mt-1">
                          {combo.purePhrasalVerbs} Phrasal Verbs
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* NO ACTIVE DEBT HERO */
              <div className="glass-panel rounded-3xl p-6 sm:p-7 specular-edge relative overflow-hidden">
                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-tertiary-container/15 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-tertiary-container/20 border border-tertiary-container/40 flex items-center justify-center text-tertiary-fixed-dim shrink-0 shadow-lg">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-tertiary-fixed-dim font-bold">
                        PRISTINE SOLVENCY STATUS
                      </span>
                      <h3 className="text-xl font-headline font-bold text-on-surface mt-0.5">
                        Zero Active Debt Obligations
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-1 max-w-md">
                        {student.name} has zero unpaid balances and {paidLoans.length} settled{' '}
                        {paidLoans.length === 1 ? 'contract' : 'contracts'}. Eligible for up to{' '}
                        <strong className="text-on-surface">E$ {student.maxLoanLimit}.00</strong> in immediate classroom credit.
                      </p>
                    </div>
                  </div>

                  {!isDelisted && (
                    <button
                      type="button"
                      onClick={() => setIsLoanModalOpen(true)}
                      className="liquid-button-primary px-5 py-2.5 rounded-full text-xs font-headline font-bold shrink-0 self-start sm:self-center"
                    >
                      + Request Advance
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Credit Tier & Loan Ceiling Progression Terminal */}
            <div className="glass-panel rounded-3xl p-6 space-y-5 specular-edge">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-primary-container font-bold block">
                    FICO-ESL TRAJECTORY
                  </span>
                  <h3 className="text-base font-headline font-bold text-on-surface">
                    Credit Tier &amp; Loan Ceiling Progression
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-tertiary-fixed-dim glass-well px-3 py-1 rounded-full">
                    {student.creditScore} / 850 PTS
                  </span>
                  {onGrantCreditLimitRaise && (
                    <button
                      type="button"
                      onClick={() => setIsCreditRaiseModalOpen(true)}
                      className="glass-pill px-3 py-1 rounded-full text-xs font-mono font-bold text-primary-container hover:border-primary-container/50 flex items-center gap-1"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Raise Limit</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Liquid Progress Bar */}
              <div className="space-y-2">
                <div className="w-full h-3 glass-well rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-secondary-container via-primary-container to-tertiary-container rounded-full transition-all duration-500"
                    style={{ width: `${ficoPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-on-surface-variant">
                  <span>300 (Novice)</span>
                  <span>
                    {nextTier
                      ? `${nextTier.minScore - student.creditScore} PTS to ${nextTier.name} (E$${nextTier.maxLoanLimit} Cap)`
                      : 'Maximum Diamond Polyglot Tier Achieved!'}
                  </span>
                  <span>850 (Diamond)</span>
                </div>
              </div>

              {/* Tier Milestone Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CREDIT_TIERS.slice(-3).map((t) => {
                  const achieved = student.creditScore >= t.minScore;
                  return (
                    <div
                      key={t.name}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        achieved
                          ? 'bg-primary-container/15 border-primary-container/40 specular-edge'
                          : 'glass-well opacity-65'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-primary-container">
                          {t.minScore}+ PTS
                        </span>
                        {achieved && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-tertiary-fixed-dim" />
                        )}
                      </div>
                      <p className="font-headline font-bold text-xs text-on-surface mt-1">
                        {t.name}
                      </p>
                      <p className="text-[11px] font-mono text-on-surface-variant">
                        Ceiling: E$ {t.maxLoanLimit}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Reserve Ledger Activity Stream */}
            <div className="glass-panel rounded-3xl p-6 space-y-4 specular-edge">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary-container" />
                  <h3 className="text-sm font-headline font-bold uppercase tracking-wider text-on-surface">
                    Recent Reserve Ledger Activity
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('statements')}
                  className="text-xs font-mono text-primary-container hover:underline flex items-center gap-1"
                >
                  <span>Full Statement</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {studentActivityStream.length === 0 ? (
                <div className="glass-well rounded-2xl p-6 text-center text-xs font-mono text-on-surface-variant">
                  No recent transactions recorded for {student.name}.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {studentActivityStream.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="glass-well rounded-2xl p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-headline font-bold text-xs sm:text-sm text-on-surface truncate">
                          {item.title}
                        </p>
                        <p className="text-[11px] font-mono text-on-surface-variant truncate">
                          {item.subtitle} • {new Date(item.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`font-mono font-bold text-xs sm:text-sm shrink-0 ${
                          item.amount >= 0 ? 'text-tertiary-fixed-dim' : 'text-error'
                        }`}
                      >
                        {item.amount >= 0 ? '+' : '-'}E$ {Math.abs(item.amount)}.00
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {isLoanModalOpen && (
        <LoanRequestModal
          isOpen={true}
          student={student}
          activeLoan={activeLoan}
          initialAmount={selectedPresetAdvance}
          settings={settings}
          onClose={() => {
            setIsLoanModalOpen(false);
          }}
          onSubmitLoan={(data) => {
            onRequestLoan(data);
            setIsLoanModalOpen(false);
          }}
        />
      )}

      {isWorkModalOpen && activeLoan && (
        <EnglishSubmissionModal
          isOpen={true}
          loan={activeLoan}
          student={student}
          settings={settings}
          isTeacherReviewer={false}
          onClose={() => setIsWorkModalOpen(false)}
          onSubmitWork={(sub) => {
            onSubmitEnglishWork(sub);
            setIsWorkModalOpen(false);
          }}
        />
      )}

      {isDailyRewardModalOpen && onAddDailyReward && (
        <QuickAddDailyDollarsModal
          isOpen={true}
          student={student}
          settings={settings}
          onClose={() => setIsDailyRewardModalOpen(false)}
          onAddDailyReward={(sid, amt, rsn) => {
            const res = onAddDailyReward(sid, amt, rsn);
            setIsDailyRewardModalOpen(false);
            return res;
          }}
        />
      )}

      {isCreditRaiseModalOpen && onGrantCreditLimitRaise && (
        <GrantCreditLimitRaiseModal
          isOpen={true}
          student={student}
          students={roster}
          onSelectStudent={onSelectStudent}
          onClose={() => setIsCreditRaiseModalOpen(false)}
          onGrantRaise={(sid, newLimit, reason, bonus) => {
            onGrantCreditLimitRaise(sid, newLimit, reason, bonus);
            setIsCreditRaiseModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
