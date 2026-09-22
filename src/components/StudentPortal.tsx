import React, { useState } from 'react';
import {
  CreditCard,
  DollarSign,
  Clock,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  HelpCircle,
  PlusCircle,
  ArrowRight,
  ShieldAlert,
  GraduationCap,
  Printer
} from 'lucide-react';
import { Student, Loan, TeacherSettings } from '../types';
import { CreditCardVisual } from './CreditCardVisual';
import { LoanRequestModal } from './LoanRequestModal';
import { EnglishSubmissionModal } from './EnglishSubmissionModal';
import { StudentLoansLedger } from './StudentLoansLedger';
import { StudentYearlyHistory } from './StudentYearlyHistory';
import { StudentSelectorNav } from './StudentSelectorNav';
import {
  getCreditTier,
  formatCurrency,
  getDaysDifference,
  suggestTaskCombinations,
  DEFAULT_TEACHER_SETTINGS,
} from '../utils/creditCalculator';

interface StudentPortalProps {
  student: Student;
  students?: Student[];
  onSelectStudent?: (studentId: string) => void;
  activeLoan?: Loan | null;
  loans?: Loan[];
  settings: TeacherSettings;
  onUpdatePaymentFrequency: (studentId: string, freq: 'monthly' | 'bimonthly') => void;
  onRequestLoan: (loanData: {
    principal: number;
    durationDays: number;
    loanType: 'short' | 'big';
    notes: string;
  }) => void;
  onSubmitEnglishWork: (submission: any) => void;
  onPrintCard?: (studentId: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  student,
  students,
  onSelectStudent,
  activeLoan,
  loans = [],
  settings = DEFAULT_TEACHER_SETTINGS,
  onUpdatePaymentFrequency,
  onRequestLoan,
  onSubmitEnglishWork,
  onPrintCard,
}) => {
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const tier = getCreditTier(student.creditScore);
  const isDelisted = student.cardStatus === 'delisted';
  const todayStr = new Date().toISOString().slice(0, 10);
  const earnedToday =
    student.dailyEnglishEarned?.date === todayStr ? student.dailyEnglishEarned.amount : 0;

  const loanRemaining = activeLoan
    ? Math.max(0, activeLoan.totalDue - activeLoan.amountRepaid)
    : 0;

  const dueInfo = activeLoan ? getDaysDifference(activeLoan.dueDate) : null;

  const taskSuggestions = activeLoan
    ? suggestTaskCombinations(loanRemaining, settings)
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Quick Student Navigator */}
      {students && students.length > 1 && onSelectStudent && (
        <StudentSelectorNav
          students={students}
          selectedStudentId={student.id}
          onSelectStudent={onSelectStudent}
          label="Switch Student"
          variant="section"
          showBalance={true}
          showCreditScore={true}
          showClassFilter={true}
          showShuffle={true}
        />
      )}

      {/* Alert if Delisted */}
      {isDelisted && (
        <div className="p-5 rounded-xl bg-red-950/80 border-2 border-red-600/80 shadow-2xl flex items-start gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-red-600" />
          <div className="p-2.5 rounded-lg bg-red-900/60 text-red-300 border border-red-700/60 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-red-100 uppercase tracking-widest font-mono flex items-center gap-2">
              Credit Card Declined Forever &amp; Delisted
            </h2>
            <p className="text-sm text-red-200 leading-relaxed">
              Your classroom credit card was permanently revoked because the loan payment deadline was exceeded without settlement. Per didactic rules, your account has been delisted from active borrowing.
            </p>
            {student.delistedReason && (
              <p className="text-xs text-red-300/80 italic font-mono pt-1">
                Violation Record: {student.delistedReason}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Top Banner: Student Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 font-bold text-xl font-mono shadow-inner">
            {student.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{student.name}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${tier.badgeBg} ${tier.badgeColor}`}>
                {tier.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              ID: {student.studentIdNumber} • Card #{student.cardNumber.slice(0, 4)} •••• {student.cardNumber.slice(-4)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Account Balance & Daily Dollars Badges */}
          <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-left sm:text-right font-mono">
            <span className="text-[9px] uppercase text-slate-500 font-bold tracking-widest block">Account Balance</span>
            <p className="text-base font-bold text-emerald-400">${student.currentBalance}.00</p>
          </div>

          <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-left sm:text-right font-mono">
            <span className="text-[9px] uppercase text-teal-400/80 font-bold tracking-widest block">Daily English $</span>
            <p className="text-sm font-bold text-teal-300">
              E${earnedToday}.00 <span className="text-slate-500 text-xs font-normal">• Discretionary</span>
            </p>
          </div>

          {!isDelisted && !activeLoan && (
            <button
              onClick={() => setIsLoanModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/10"
            >
              <PlusCircle className="w-4 h-4" />
              Request Loan (Up to ${student.maxLoanLimit})
            </button>
          )}

          {activeLoan && activeLoan.status !== 'paid' && !isDelisted && (
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/10"
            >
              <BookOpen className="w-4 h-4" />
              Pay Loan With English Work (${loanRemaining} Due)
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Card Visual on Left, Financial Controls on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Visual Credit Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Assigned Virtual Instrument
              </h2>
              {onPrintCard && (
                <button
                  type="button"
                  onClick={() => onPrintCard(student.id)}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-slate-700/80 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Print this student's physical classroom card"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Card
                </button>
              )}
            </div>
            <CreditCardVisual student={student} settings={settings} interactive={true} />
          </div>

          {/* Payment Frequency Switcher */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Payment Cycle Option</h3>
                <p className="text-xs text-slate-400">
                  Switch between standard monthly or bimonthly installments.
                </p>
              </div>
              <Calendar className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={isDelisted}
                onClick={() => onUpdatePaymentFrequency(student.id, 'monthly')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  student.paymentFrequency === 'monthly'
                    ? 'bg-slate-950 border-emerald-500/80 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                } ${isDelisted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider">Monthly</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">30 days</span>
                </div>
                <p className="text-base font-bold font-mono text-white mt-1">
                  ${settings.monthlyPayment}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Single monthly payment</p>
              </button>

              <button
                type="button"
                disabled={isDelisted}
                onClick={() => onUpdatePaymentFrequency(student.id, 'bimonthly')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  student.paymentFrequency === 'bimonthly'
                    ? 'bg-slate-950 border-emerald-500/80 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                } ${isDelisted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider">Bimonthly</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">14 days</span>
                </div>
                <p className="text-base font-bold font-mono text-white mt-1">
                  ${settings.bimonthlyPayment}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Every two weeks</p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Loan Tracker & English Task Calculator (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Loan Card */}
          {activeLoan && activeLoan.status !== 'paid' ? (
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase font-mono">
                      Active Ledger Loan
                    </span>
                    <span className="text-xs text-slate-400 font-mono">ID: {activeLoan.id}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1 tracking-tight">
                    {activeLoan.loanType === 'short' ? 'Short Loan (≤ 5 Days)' : 'Big Loan (≤ 3 Weeks)'}
                  </h2>
                </div>

                {dueInfo && (
                  <div
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                      dueInfo.isOverdue
                        ? 'bg-red-950/80 border-red-500 text-red-200 animate-pulse'
                        : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                    {dueInfo.formatted}
                  </div>
                )}
              </div>

              {/* Loan Financial Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-500 font-mono font-bold tracking-wider">Principal</span>
                  <p className="text-base font-bold font-mono text-white mt-0.5">${activeLoan.principal}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-500 font-mono font-bold tracking-wider">Interest</span>
                  <p className="text-base font-bold font-mono text-amber-300 mt-0.5">
                    {activeLoan.effectiveInterestRate}%
                    {activeLoan.delaysCount > 0 && (
                      <span className="text-[10px] text-rose-400 block font-normal">
                        (+{activeLoan.delaysCount * activeLoan.delayPenaltyRate}% delay)
                      </span>
                    )}
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-500 font-mono font-bold tracking-wider">Total Due</span>
                  <p className="text-base font-bold font-mono text-white mt-0.5">${activeLoan.totalDue}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-emerald-500/40">
                  <span className="text-[10px] uppercase text-emerald-400 font-mono font-bold tracking-wider">
                    Remaining
                  </span>
                  <p className="text-lg font-black font-mono text-emerald-300 mt-0.5">
                    ${loanRemaining}
                  </p>
                </div>
              </div>

              {/* Overpayment Surplus Rule Notice */}
              <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-lg flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Overpayment Rule:</strong> If your submitted statements exceed the remaining loan balance (${loanRemaining}), all excess credit goes directly to your account balance!
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>Repaid: ${activeLoan.amountRepaid}</span>
                  <span className="text-emerald-400 font-bold">{Math.round((activeLoan.amountRepaid / activeLoan.totalDue) * 100)}% Settled</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (activeLoan.amountRepaid / activeLoan.totalDue) * 100)}%` }}
                  />
                </div>
              </div>

              {/* English Work Currency Converter Box */}
              {taskSuggestions && (
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-mono flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      In-Class Statement Presentation Rates:
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Balance: <strong className="text-white">${loanRemaining}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <p className="text-[10px] text-purple-300 font-bold uppercase font-mono tracking-wider">Phrasal Verbs</p>
                      <p className="text-sm font-bold font-mono text-white mt-1">
                        {taskSuggestions.purePhrasalVerbs} in notebook
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">($50 each)</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <p className="text-[10px] text-emerald-400 font-bold uppercase font-mono tracking-wider">Sentences</p>
                      <p className="text-sm font-bold font-mono text-white mt-1">
                        {taskSuggestions.pureSentences} in English
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">($25 each)</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <p className="text-[10px] text-amber-300 font-bold uppercase font-mono tracking-wider">Book Words</p>
                      <p className="text-sm font-bold font-mono text-white mt-1">
                        {taskSuggestions.pureWords} in book
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">($5 each)</p>
                    </div>
                  </div>

                  <div className="pt-2.5 flex items-center justify-between border-t border-slate-800">
                    <div className="text-[11px] text-slate-300 flex items-center gap-1.5 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Decorate your notebook to boost score +{settings.decoratedPresentationScoreBoost}!</span>
                    </div>
                    <button
                      onClick={() => setIsSubmitModalOpen(true)}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1 shadow-md shadow-emerald-500/10 font-mono"
                    >
                      Log In-Class Work
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Pending submissions list */}
              {activeLoan.submissions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">
                    In-Class Statement Presentations:
                  </h4>
                  {activeLoan.submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">
                            {sub.sentencesCount ?? sub.sentences.length} Sentences, {sub.wordsCount ?? sub.words.length} Words, {sub.phrasalVerbsCount ?? sub.phrasalVerbs.length} Phrasal Verbs
                          </span>
                          {sub.hasDecoratedPresentation && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-300 rounded border border-purple-500/30 font-mono">
                              ✨ Decorated (+{sub.scoreBonusAwarded} pts)
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Value: ${sub.totalCreditValue} • Presented {new Date(sub.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          sub.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : sub.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        }`}
                      >
                        {sub.status === 'pending' ? 'Pending Verification' : sub.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* No Active Loan State */
            <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">No Active Debt</h3>
                <p className="text-xs text-slate-400">
                  You currently have no pending loan. Your credit standing is in good order. You are eligible to request a loan up to <strong className="text-emerald-400 font-mono">${student.maxLoanLimit}</strong>.
                </p>
              </div>
              {!isDelisted && (
                <button
                  onClick={() => setIsLoanModalOpen(true)}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors inline-flex items-center gap-2 shadow-lg shadow-emerald-500/10"
                >
                  <PlusCircle className="w-4 h-4" />
                  Apply for Classroom Loan
                </button>
              )}
            </div>
          )}

          {/* Credit Score & Progression Roadmap */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  Credit Tier &amp; Loan Ceiling Progression
                </h3>
                <p className="text-xs text-slate-400">
                  Complete on-time payments and submit decorated statements to unlock up to $1,000!
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Credit Standing</span>
                <p className="text-lg font-black text-emerald-400">{student.creditScore} / 850</p>
              </div>
            </div>

            {/* Rules Didactic Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-emerald-400 font-bold font-mono flex items-center gap-1 uppercase text-[11px] tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Punctual Payment
                </span>
                <p className="text-[11px] text-slate-300">
                  Credit score increase (+{settings.punctualityScoreBoost} pts).
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-purple-300 font-bold font-mono flex items-center gap-1 uppercase text-[11px] tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Decorated Notebook
                </span>
                <p className="text-[11px] text-slate-300">
                  Moderate score boost (+{settings.decoratedPresentationScoreBoost} pts). Unlocks higher tiers!
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-rose-400 font-bold font-mono flex items-center gap-1 uppercase text-[11px] tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Late Penalty
                </span>
                <p className="text-[11px] text-slate-300">
                  Interest rises +{settings.delayPenaltyIncrement}% per delay. Missed deadline = permanent card revocation!
                </p>
              </div>
            </div>
          </div>

          {/* Daily English Dollars & Classroom Rewards Card */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Classroom English Dollars (E$)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Earn money added directly to your account by speaking English, reading, and active classroom participation!
                </p>
              </div>
              <div className="text-left sm:text-right font-mono">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Today&apos;s Earned</span>
                <p className="text-base font-bold text-teal-300">
                  E${earnedToday}.00
                </p>
              </div>
            </div>

            {/* Recent Classroom English Rewards Log */}
            {student.englishRewardsHistory && student.englishRewardsHistory.length > 0 ? (
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                  Recent Teacher English Rewards
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {student.englishRewardsHistory.slice(0, 5).map((rew) => (
                    <div
                      key={rew.id}
                      className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="space-y-0.5">
                        <p className="text-slate-200 font-bold">{rew.reason}</p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(rew.createdAt).toLocaleDateString()} at{' '}
                          {new Date(rew.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-xs">
                        +E${rew.amount}.00
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/60 text-xs text-slate-400 font-mono text-center">
                Participate in English during class to earn Eurodollars added directly to your account by your teacher!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= WHOLE YEAR HISTORY MINI-SECTION ================= */}
      <div className="mt-8">
        <StudentYearlyHistory student={student} loans={loans} />
      </div>

      {/* ================= PENDANT & PAID LOANS LEDGER ================= */}
      <div className="mt-8">
        <StudentLoansLedger
          student={student}
          loans={loans}
          settings={settings}
          onOpenEnglishWork={() => setIsSubmitModalOpen(true)}
          onRequestNewLoan={() => setIsLoanModalOpen(true)}
        />
      </div>

      {/* Modals */}
      {isLoanModalOpen && (
        <LoanRequestModal
          isOpen={isLoanModalOpen}
          onClose={() => setIsLoanModalOpen(false)}
          student={student}
          activeLoan={activeLoan}
          settings={settings}
          onSubmitLoan={onRequestLoan}
        />
      )}

      {isSubmitModalOpen && activeLoan && (
        <EnglishSubmissionModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          student={student}
          loan={activeLoan}
          settings={settings}
          onSubmitWork={onSubmitEnglishWork}
        />
      )}
    </div>
  );
};
