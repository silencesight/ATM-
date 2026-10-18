import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Student, Loan, TeacherSettings } from '../types';
import { getDaysDifference } from '../utils/creditCalculator';

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
  onOpenEnglishWork,
  onRequestNewLoan,
  isTeacherView = false,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'pendant' | 'paid'>('all');

  const studentLoans = loans.filter((l) => l.studentId === student.id);
  const pendantLoans = studentLoans.filter((l) => l.status !== 'paid');
  const paidLoans = studentLoans.filter((l) => l.status === 'paid');

  const displayedLoans =
    filterTab === 'pendant'
      ? pendantLoans
      : filterTab === 'paid'
      ? paidLoans
      : studentLoans;

  return (
    <div className="glass-panel rounded-3xl p-6 space-y-5 specular-edge">
      {/* Header & Segmented Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-container/15 border border-primary-container/30 flex items-center justify-center text-primary-container">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-headline uppercase tracking-wider text-on-surface flex items-center gap-2">
              Loans Ledger: Pendant &amp; Settled
              <span className="text-[10px] px-2.5 py-0.5 rounded-full glass-well text-on-surface-variant font-mono font-normal">
                {student.name}
              </span>
            </h3>
            <p className="text-xs text-on-surface-variant">
              Chronological micro-loan agreements, active obligations, and settled English contracts.
            </p>
          </div>
        </div>

        <div className="flex items-center glass-well p-1 rounded-full text-xs font-mono">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1 rounded-full transition-all font-bold ${
              filterTab === 'all'
                ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All ({studentLoans.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('pendant')}
            className={`px-3.5 py-1 rounded-full transition-all font-bold flex items-center gap-1.5 ${
              filterTab === 'pendant'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Pendant ({pendantLoans.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('paid')}
            className={`px-3.5 py-1 rounded-full transition-all font-bold flex items-center gap-1.5 ${
              filterTab === 'paid'
                ? 'bg-tertiary-container/20 text-tertiary-fixed-dim border border-tertiary-container/40 shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" />
            Paid ({paidLoans.length})
          </button>
        </div>
      </div>

      {/* Content List */}
      {displayedLoans.length === 0 ? (
        <div className="py-10 text-center glass-well rounded-2xl p-6 space-y-2.5 font-mono">
          {filterTab === 'pendant' ? (
            <>
              <div className="w-11 h-11 mx-auto rounded-2xl bg-tertiary-container/15 border border-tertiary-container/30 flex items-center justify-center text-tertiary-fixed-dim">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-on-surface font-bold text-sm font-headline">
                Zero Pendant Obligations!
              </p>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                {student.name} currently has zero outstanding debt. Eligible for immediate classroom credit advance!
              </p>
              {onRequestNewLoan && student.cardStatus === 'active' && (
                <button
                  type="button"
                  onClick={onRequestNewLoan}
                  className="mt-2 px-4 py-2 liquid-button-primary font-bold text-xs rounded-full transition-all"
                >
                  + Request Liquidity Advance
                </button>
              )}
            </>
          ) : filterTab === 'paid' ? (
            <>
              <div className="w-11 h-11 mx-auto rounded-2xl glass-pill flex items-center justify-center text-on-surface-variant">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-on-surface font-bold text-sm font-headline">No Settled Loans Yet</p>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                Once {student.name} completes full repayment through English statement presentations, settled contracts are archived here.
              </p>
            </>
          ) : (
            <>
              <p className="text-on-surface-variant text-xs">
                No micro-loan contracts on record for {student.name}.
              </p>
              {onRequestNewLoan && student.cardStatus === 'active' && (
                <button
                  type="button"
                  onClick={onRequestNewLoan}
                  className="mt-2 px-4 py-2 liquid-button-primary font-bold text-xs rounded-full transition-all"
                >
                  + Issue First Micro-Loan
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {displayedLoans.map((loan) => {
            const isPaid = loan.status === 'paid';
            const remaining = Math.max(0, loan.totalDue - loan.amountRepaid);
            const percentPaid = Math.min(
              100,
              Math.round((loan.amountRepaid / loan.totalDue) * 100)
            );
            const daysInfo = getDaysDifference(loan.dueDate);
            const isOverdue = daysInfo.isOverdue && !isPaid;
            const totalSubmissions = loan.submissions?.length || 0;

            return (
              <div
                key={loan.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isPaid
                    ? 'glass-well border-tertiary-container/30'
                    : isOverdue
                    ? 'bg-error-container/15 border-error/40'
                    : 'glass-card-interactive'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 font-mono">
                      {isPaid ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary-fixed-dim border border-tertiary-container/40 text-[10px] font-bold uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Settled &amp; Paid
                        </span>
                      ) : (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1 ${
                            isOverdue
                              ? 'bg-error-container/40 text-error border-error/50 animate-pulse'
                              : loan.status === 'pending_review'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-primary-container/15 text-primary-container border-primary-container/35'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {isOverdue
                            ? 'Pendant (Overdue)'
                            : loan.status === 'pending_review'
                            ? 'Pendant (In Review)'
                            : 'Pendant (Active)'}
                        </span>
                      )}

                      <span className="text-xs font-bold text-on-surface font-headline">
                        {loan.loanType === 'short'
                          ? 'Short Liquidity Advance (≤ 5 Days)'
                          : 'Extended Term Loan (≤ 3 Weeks)'}
                      </span>
                      <span className="text-[10px] text-outline">ID: {loan.id}</span>
                    </div>

                    <p className="text-xs text-on-surface-variant flex flex-wrap items-center gap-1.5 font-mono">
                      <span>Issued: {new Date(loan.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      {isPaid ? (
                        <span className="text-tertiary-fixed-dim">
                          Settled:{' '}
                          {loan.paidAt
                            ? new Date(loan.paidAt).toLocaleDateString()
                            : 'Paid in full'}
                        </span>
                      ) : (
                        <span className={isOverdue ? 'text-error font-bold' : 'text-on-surface'}>
                          Maturity: {new Date(loan.dueDate).toLocaleDateString()} (
                          {daysInfo.isOverdue
                            ? `${Math.abs(daysInfo.days)}d overdue`
                            : `${daysInfo.days}d left`}
                          )
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Financial Figures */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono glass-well p-2.5 rounded-xl shrink-0">
                    <div>
                      <span className="text-[9px] text-on-surface-variant uppercase tracking-widest block">
                        Principal + Rate
                      </span>
                      <p className="text-xs text-on-surface font-bold">
                        E$ {loan.principal}.00{' '}
                        <span className="text-[10px] text-on-surface-variant">
                          ({loan.effectiveInterestRate}%)
                        </span>
                      </p>
                    </div>

                    <div className="pl-2.5 border-l border-outline-variant/30">
                      <span className="text-[9px] text-on-surface-variant uppercase tracking-widest block">
                        Repaid
                      </span>
                      <p className="text-xs text-on-surface font-bold">
                        E$ {loan.amountRepaid}.00
                      </p>
                    </div>

                    <div className="pl-2.5 border-l border-outline-variant/30">
                      <span className="text-[9px] text-on-surface-variant uppercase tracking-widest block">
                        {isPaid ? 'Balance' : 'Remaining'}
                      </span>
                      <p
                        className={`text-sm sm:text-base font-black whitespace-nowrap ${
                          isPaid ? 'text-tertiary-fixed-dim' : 'text-amber-400'
                        }`}
                      >
                        E$ {remaining}.00
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3.5 space-y-1.5">
                  <div className="w-full glass-well h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isPaid
                          ? 'bg-tertiary-container'
                          : percentPaid > 50
                          ? 'bg-primary-container'
                          : 'bg-amber-400'
                      }`}
                      style={{ width: `${percentPaid}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
                    <span>
                      {percentPaid}% Repaid (E$ {loan.amountRepaid} / E$ {loan.totalDue})
                    </span>
                    <span>
                      {loan.delaysCount > 0 && (
                        <span className="text-amber-400 mr-2">
                          ⚠️ {loan.delaysCount} delay penalty
                        </span>
                      )}
                      {totalSubmissions > 0 && (
                        <span className="text-on-surface">
                          📝 {totalSubmissions} presentation{' '}
                          {totalSubmissions === 1 ? 'record' : 'records'}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Footnote & Action */}
                <div className="mt-3 pt-2.5 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                  <div className="text-[11px] text-on-surface-variant truncate">
                    {loan.notes ? (
                      <span>Note: {loan.notes}</span>
                    ) : isPaid ? (
                      <span className="text-tertiary-fixed-dim flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Obligation liquidated. Credit standing affirmed.
                      </span>
                    ) : (
                      <span>
                        Settle via English sentences (E$25), vocabulary words (E$5), or phrasal verbs (E$50).
                      </span>
                    )}
                  </div>

                  {!isPaid && onOpenEnglishWork && (
                    <button
                      type="button"
                      onClick={() => onOpenEnglishWork(loan)}
                      className="px-3.5 py-1.5 liquid-button-emerald rounded-full text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0"
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
