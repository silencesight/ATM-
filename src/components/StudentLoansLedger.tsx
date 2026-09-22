import React, { useState } from 'react';
import {
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  ChevronRight,
  BookOpen,
  Calendar,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Student, Loan, TeacherSettings } from '../types';
import { getDaysDifference, formatCurrency } from '../utils/creditCalculator';

interface StudentLoansLedgerProps {
  student: Student;
  loans: Loan[];
  settings?: TeacherSettings;
  onOpenEnglishWork?: (loan: Loan) => void;
  onRequestNewLoan?: () => void;
  isTeacherView?: boolean;
}

export const StudentLoansLedger: React.FC<StudentLoansLedgerProps> = ({
  student,
  loans,
  settings,
  onOpenEnglishWork,
  onRequestNewLoan,
  isTeacherView = false,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'pendant' | 'paid'>('all');

  // Filter loans belonging to this student
  const studentLoans = loans.filter((l) => l.studentId === student.id);
  
  // Pendant (pending / active / unpaid) loans
  const pendantLoans = studentLoans.filter((l) => l.status !== 'paid');
  
  // Paid (settled) loans
  const paidLoans = studentLoans.filter((l) => l.status === 'paid');

  const displayedLoans =
    filterTab === 'pendant'
      ? pendantLoans
      : filterTab === 'paid'
      ? paidLoans
      : studentLoans;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
              Loans Ledger: Pendant &amp; Paid
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-normal">
                {student.name}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Complete chronological ledger of active pending borrowings and settled debts.
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 rounded transition-colors font-bold ${
              filterTab === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({studentLoans.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('pendant')}
            className={`px-3 py-1 rounded transition-colors font-bold flex items-center gap-1.5 ${
              filterTab === 'pendant'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Pendant ({pendantLoans.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('paid')}
            className={`px-3 py-1 rounded transition-colors font-bold flex items-center gap-1.5 ${
              filterTab === 'paid'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Paid ({paidLoans.length})
          </button>
        </div>
      </div>

      {/* Content List */}
      {displayedLoans.length === 0 ? (
        <div className="py-8 text-center bg-slate-950/60 rounded-lg border border-slate-800/80 p-6 space-y-2 font-mono">
          {filterTab === 'pendant' ? (
            <>
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-slate-300 font-bold text-sm">No Pendant Loans!</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {student.name} currently has zero outstanding debt. Ready to request a new classroom credit loan!
              </p>
              {onRequestNewLoan && student.cardStatus === 'active' && (
                <button
                  type="button"
                  onClick={onRequestNewLoan}
                  className="mt-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded transition-colors"
                >
                  + Request New Loan
                </button>
              )}
            </>
          ) : filterTab === 'paid' ? (
            <>
              <div className="w-10 h-10 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-slate-300 font-bold text-sm">No Settled Loans Yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once {student.name} completes full repayment through English statement presentations, paid records will be archived here.
              </p>
            </>
          ) : (
            <>
              <p className="text-slate-400 text-xs">No loans on record for {student.name}.</p>
              {onRequestNewLoan && student.cardStatus === 'active' && (
                <button
                  type="button"
                  onClick={onRequestNewLoan}
                  className="mt-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded transition-colors"
                >
                  + Issue First Loan
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedLoans.map((loan) => {
            const isPaid = loan.status === 'paid';
            const remaining = Math.max(0, loan.totalDue - loan.amountRepaid);
            const percentPaid = Math.min(100, Math.round((loan.amountRepaid / loan.totalDue) * 100));
            const daysInfo = getDaysDifference(loan.dueDate);
            const isOverdue = daysInfo.isOverdue && !isPaid;

            // Gather submissions statistics
            const totalSubmissions = loan.submissions?.length || 0;
            const approvedSubmissions = loan.submissions?.filter((s) => s.status === 'approved') || [];
            const pendingSubmissions = loan.submissions?.filter((s) => s.status === 'pending') || [];

            return (
              <div
                key={loan.id}
                className={`p-4 rounded-xl border transition-all ${
                  isPaid
                    ? 'bg-slate-950/70 border-emerald-500/30 hover:border-emerald-500/50'
                    : isOverdue
                    ? 'bg-red-950/20 border-red-500/50 hover:border-red-500/70'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                  {/* Left info: Type & ID */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 font-mono">
                      {isPaid ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Settled &amp; Paid
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border flex items-center gap-1 ${
                            isOverdue
                              ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                              : loan.status === 'pending_review'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {isOverdue ? 'Pendant (Overdue)' : loan.status === 'pending_review' ? 'Pendant (In Review)' : 'Pendant (Active)'}
                        </span>
                      )}

                      <span className="text-xs font-bold text-slate-200">
                        {loan.loanType === 'short' ? 'Short Loan (≤ 5 Days)' : 'Big Loan (≤ 3 Weeks)'}
                      </span>
                      <span className="text-[10px] text-slate-500">ID: {loan.id}</span>
                    </div>

                    <p className="text-xs text-slate-400 flex flex-wrap items-center gap-1.5 font-mono">
                      <span>Borrowed: {new Date(loan.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      {isPaid ? (
                        <span className="text-emerald-400">
                          Settled: {loan.paidAt ? new Date(loan.paidAt).toLocaleDateString() : 'Paid in full'}
                        </span>
                      ) : (
                        <span className={isOverdue ? 'text-red-400 font-bold' : 'text-slate-300'}>
                          Due: {new Date(loan.dueDate).toLocaleDateString()} ({daysInfo.isOverdue ? `${Math.abs(daysInfo.days)}d overdue` : `${daysInfo.days}d left`})
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Financial figures */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono bg-slate-900/80 p-2 sm:p-2.5 rounded-lg border border-slate-800/80 shrink-0">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Principal + Rate</span>
                      <p className="text-xs text-slate-300 font-bold">
                        ${loan.principal}.00 <span className="text-[10px] text-slate-400">({loan.effectiveInterestRate}%)</span>
                      </p>
                    </div>

                    <div className="pl-2.5 border-l border-slate-800">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Total Repaid</span>
                      <p className="text-xs text-slate-300 font-bold">${loan.amountRepaid}.00</p>
                    </div>

                    <div className="pl-2.5 border-l border-slate-800">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest block">
                        {isPaid ? 'Balance' : 'Remaining'}
                      </span>
                      <p className={`text-sm sm:text-base font-black whitespace-nowrap ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                        ${remaining}.00
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isPaid
                          ? 'bg-emerald-500'
                          : percentPaid > 50
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${percentPaid}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>
                      {percentPaid}% Repaid (${loan.amountRepaid} / ${loan.totalDue})
                    </span>
                    <span>
                      {loan.delaysCount > 0 && (
                        <span className="text-amber-400 mr-2">⚠️ {loan.delaysCount} delay penalty</span>
                      )}
                      {totalSubmissions > 0 && (
                        <span className="text-slate-300">
                          📝 {totalSubmissions} presentation {totalSubmissions === 1 ? 'record' : 'records'}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Footnote notes and action button */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                  <div className="text-[11px] text-slate-400 truncate">
                    {loan.notes ? (
                      <span>Note: {loan.notes}</span>
                    ) : isPaid ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Debt fully liquidated. Credit limit standing affirmed.
                      </span>
                    ) : (
                      <span>Settle by presenting verified sentences ($25), words ($5), or phrasal verbs ($50).</span>
                    )}
                  </div>

                  {!isPaid && onOpenEnglishWork && (
                    <button
                      type="button"
                      onClick={() => onOpenEnglishWork(loan)}
                      className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded text-xs font-bold transition-colors flex items-center gap-1 self-start sm:self-auto shrink-0 shadow-sm"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      {isTeacherView ? 'Verify Statements' : 'Present English Work'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
