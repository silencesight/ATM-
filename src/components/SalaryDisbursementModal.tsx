import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  CheckSquare,
  Square,
  DollarSign,
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Calendar,
  RotateCcw,
  Sparkles,
  Info,
  Filter,
  TrendingUp,
} from 'lucide-react';
import { Student, Classroom, TeacherSettings } from '../types';
import { StudentAvatar } from './StudentAvatar';

export interface SalaryDisbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  classrooms?: Classroom[];
  settings: TeacherSettings;
  initialClassFilter?: string;
  theme?: 'dark' | 'light';
  onDisburseSalaries: (
    disbursements: { studentId: string; amount: number; customReason?: string }[]
  ) => void;
  onOpenSalaryRaiseModal?: (student: Student) => void;
}

interface StudentSalaryRow {
  student: Student;
  defaultAmount: number;
  amount: number;
  recentlyPaid: boolean;
  daysAgo: number | null;
  lastPaidDateStr: string | null;
  thresholdDays: number;
  standardBase: number;
  hasCustomSalary: boolean;
  raiseDelta: number;
}

export const SalaryDisbursementModal: React.FC<SalaryDisbursementModalProps> = ({
  isOpen,
  onClose,
  students,
  classrooms = [],
  settings,
  initialClassFilter = 'all',
  theme = 'dark',
  onDisburseSalaries,
  onOpenSalaryRaiseModal,
}) => {
  const [classFilter, setClassFilter] = useState<string>(initialClassFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'due_only' | 'recent_only'>('all');
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [showDuplicateWarningPrompt, setShowDuplicateWarningPrompt] = useState(false);

  // Sync initial class filter when modal opens
  useEffect(() => {
    if (isOpen) {
      setClassFilter(initialClassFilter);
      setShowDuplicateWarningPrompt(false);
      setSearchQuery('');
    }
  }, [isOpen, initialClassFilter]);

  // Compute rows with salary calculation & duplicate detection
  const studentRows = useMemo<StudentSalaryRow[]>(() => {
    return students.map((s) => {
      const standardBase =
        s.paymentFrequency === 'monthly'
          ? settings.monthlyPayment || 482
          : settings.bimonthlyPayment || 241;

      const defaultAmount =
        typeof s.customSalaryAmount === 'number' && s.customSalaryAmount > 0
          ? s.customSalaryAmount
          : standardBase;

      const hasCustomSalary =
        typeof s.customSalaryAmount === 'number' &&
        s.customSalaryAmount > 0 &&
        s.customSalaryAmount !== standardBase;

      const raiseDelta = (s.customSalaryAmount || standardBase) - standardBase;

      const thresholdDays = s.paymentFrequency === 'monthly' ? 14 : 7;
      let recentlyPaid = false;
      let daysAgo: number | null = null;
      let lastPaidDateStr: string | null = null;

      if (s.lastSalaryPaidAt) {
        const lastDate = new Date(s.lastSalaryPaidAt);
        if (!isNaN(lastDate.getTime())) {
          daysAgo = Math.max(
            0,
            Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
          );
          recentlyPaid = daysAgo < thresholdDays;
          lastPaidDateStr = lastDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
        }
      }

      const currentAmount =
        customAmounts[s.id] !== undefined ? customAmounts[s.id] : defaultAmount;

      return {
        student: s,
        defaultAmount,
        amount: currentAmount,
        recentlyPaid,
        daysAgo,
        lastPaidDateStr,
        thresholdDays,
        standardBase,
        hasCustomSalary,
        raiseDelta,
      };
    });
  }, [students, settings, customAmounts]);

  // Filter rows based on classroom, search, and due status
  const filteredRows = useMemo(() => {
    return studentRows.filter((row) => {
      const s = row.student;
      // Do not disburse to delisted cards
      if (s.cardStatus === 'delisted') return false;

      const matchesClass =
        classFilter === 'all' ||
        s.classId === classFilter ||
        s.className === classFilter;

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.studentIdNumber.toLowerCase().includes(query) ||
        (s.cardNumber && s.cardNumber.toLowerCase().includes(query));

      if (!matchesClass || !matchesSearch) return false;

      if (filterMode === 'due_only') {
        return !row.recentlyPaid;
      }
      if (filterMode === 'recent_only') {
        return row.recentlyPaid;
      }
      return true;
    });
  }, [studentRows, classFilter, searchQuery, filterMode]);

  // Initialize selected IDs when modal opens or filtered set changes
  useEffect(() => {
    if (isOpen) {
      // Auto-select eligible active students in the current view
      const activeIds = new Set(filteredRows.map((r) => r.student.id));
      setSelectedStudentIds(activeIds);
    }
  }, [isOpen, classFilter]);

  if (!isOpen) return null;

  const handleSelectAll = () => {
    const visibleIds = filteredRows.map((r) => r.student.id);
    const allSelected = visibleIds.every((id) => selectedStudentIds.has(id));

    if (allSelected) {
      const next = new Set(selectedStudentIds);
      visibleIds.forEach((id) => next.delete(id));
      setSelectedStudentIds(next);
    } else {
      const next = new Set(selectedStudentIds);
      visibleIds.forEach((id) => next.add(id));
      setSelectedStudentIds(next);
    }
  };

  const handleSelectOnlyDue = () => {
    const dueIds = new Set(
      filteredRows.filter((r) => !r.recentlyPaid).map((r) => r.student.id)
    );
    setSelectedStudentIds(dueIds);
    setShowDuplicateWarningPrompt(false);
  };

  const toggleStudent = (id: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedStudentIds(next);
  };

  const handleAmountChange = (studentId: string, val: string) => {
    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed < 0) {
      setCustomAmounts((prev) => ({ ...prev, [studentId]: 0 }));
    } else {
      setCustomAmounts((prev) => ({ ...prev, [studentId]: parsed }));
    }
  };

  const handleResetAmount = (studentId: string) => {
    setCustomAmounts((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  // Selected summaries
  const selectedRows = studentRows.filter((r) => selectedStudentIds.has(r.student.id));
  const totalPayout = selectedRows.reduce((sum, r) => sum + r.amount, 0);
  const monthlySelectedCount = selectedRows.filter(
    (r) => r.student.paymentFrequency === 'monthly'
  ).length;
  const biweeklySelectedCount = selectedRows.filter(
    (r) => r.student.paymentFrequency === 'bimonthly'
  ).length;

  const recentlyPaidSelected = selectedRows.filter((r) => r.recentlyPaid);

  const executeDisbursement = () => {
    const disbursements = selectedRows.map((r) => ({
      studentId: r.student.id,
      amount: r.amount,
      customReason: `Cadence Salary Disbursed (${
        r.student.paymentFrequency === 'monthly' ? 'Monthly' : 'Bi-weekly'
      }: +E$${r.amount.toFixed(2)})`,
    }));

    onDisburseSalaries(disbursements);
    onClose();
  };

  const handlePrimaryClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRows.length === 0 || totalPayout <= 0) return;

    if (recentlyPaidSelected.length > 0 && !showDuplicateWarningPrompt) {
      setShowDuplicateWarningPrompt(true);
      return;
    }

    executeDisbursement();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-panel rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden specular-edge shadow-2xl border border-outline-variant/30">
        {/* HEADER */}
        <div className="p-5 sm:p-6 border-b border-outline-variant/20 flex items-start justify-between gap-4 shrink-0 bg-surface-container-lowest/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                TREASURY DISBURSEMENT ENGINE
              </span>
              <span className="text-xs font-mono text-on-surface-variant">
                • {settings.schoolName}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-headline font-bold text-on-surface flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-400" />
              <span>Disburse Student Cadence Salaries</span>
            </h2>
            <p className="text-xs text-on-surface-variant max-w-2xl">
              Disburse regular wages to student accounts based on their cadence schedule. Monthly default:{' '}
              <strong className="text-emerald-300 font-mono">E${settings.monthlyPayment || 482}</strong>, Bi-weekly default:{' '}
              <strong className="text-emerald-300 font-mono">E${settings.bimonthlyPayment || 241}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl glass-pill text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOP FILTER & SEARCH BAR */}
        <div className="p-4 sm:px-6 border-b border-outline-variant/15 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0 bg-surface-container-high/20">
          <div className="flex flex-wrap items-center gap-2">
            {/* Classroom select */}
            <div className="flex items-center gap-1.5 glass-well px-3 py-1.5 rounded-full text-xs font-mono">
              <Filter className="w-3.5 h-3.5 text-on-surface-variant" />
              <span className="text-on-surface-variant text-[11px]">Cohort:</span>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-transparent font-bold text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-surface-container text-on-surface">
                  All Cohorts ({students.length})
                </option>
                {classrooms.map((c) => {
                  const cnt = students.filter(
                    (s) => s.classId === c.id || s.className === c.name
                  ).length;
                  return (
                    <option key={c.id} value={c.name} className="bg-surface-container text-on-surface">
                      {c.name} ({cnt})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Status mode buttons */}
            <div className="glass-well p-1 rounded-full flex items-center gap-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-full transition-all font-bold ${
                  filterMode === 'all'
                    ? 'bg-emerald-500 text-black shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All Active ({studentRows.filter((r) => r.student.cardStatus !== 'delisted').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('due_only')}
                className={`px-3 py-1 rounded-full transition-all font-bold ${
                  filterMode === 'due_only'
                    ? 'bg-emerald-500 text-black shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Due Cycle ({studentRows.filter((r) => !r.recentlyPaid && r.student.cardStatus !== 'delisted').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('recent_only')}
                className={`px-3 py-1 rounded-full transition-all font-bold ${
                  filterMode === 'recent_only'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Paid Recently ({studentRows.filter((r) => r.recentlyPaid && r.student.cardStatus !== 'delisted').length})
              </button>
            </div>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter student name, ID..."
              className="pl-8 pr-3 py-1.5 glass-well rounded-full text-xs text-on-surface font-mono placeholder:text-outline focus:outline-none focus:border-emerald-400 w-full sm:w-56"
            />
          </div>
        </div>

        {/* DUPLICATE WARNING BANNER (IF TRIGGERED) */}
        {showDuplicateWarningPrompt && recentlyPaidSelected.length > 0 && (
          <div className="p-4 mx-4 sm:mx-6 mt-4 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-xs font-mono space-y-2 shrink-0">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Duplicate Cycle Protection Notice</span>
            </div>
            <p className="text-on-surface-variant">
              <strong className="text-amber-200">{recentlyPaidSelected.length} student{recentlyPaidSelected.length > 1 ? 's' : ''}</strong> in your current selection received their salary recently (within the last 7 days for bi-weekly or 14 days for monthly):
            </p>
            <div className="flex flex-wrap gap-1.5 pt-0.5 max-h-24 overflow-y-auto">
              {recentlyPaidSelected.map((r) => (
                <span
                  key={r.student.id}
                  className="px-2 py-0.5 rounded-lg bg-black/40 border border-amber-400/30 text-amber-200 text-[11px]"
                >
                  {r.student.name} ({r.daysAgo === 0 ? 'today' : `${r.daysAgo}d ago`})
                </span>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleSelectOnlyDue}
                className="px-3 py-1.5 rounded-xl glass-pill text-xs font-bold text-on-surface hover:border-outline"
              >
                Deselect Recently Paid
              </button>
              <button
                type="button"
                onClick={executeDisbursement}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-colors"
              >
                Confirm &amp; Disburse Anyway
              </button>
            </div>
          </div>
        )}

        {/* ROSTER TABLE CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:px-6">
          <div className="flex items-center justify-between gap-2 pb-2 text-xs font-mono text-on-surface-variant">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 font-bold hover:text-on-surface transition-colors cursor-pointer"
              >
                {filteredRows.length > 0 &&
                filteredRows.every((r) => selectedStudentIds.has(r.student.id)) ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>Select Visible ({filteredRows.length})</span>
              </button>
              <span>•</span>
              <span className="text-emerald-400 font-bold">
                {selectedStudentIds.size} of {filteredRows.length} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCustomAmounts({})}
                className="hover:text-on-surface flex items-center gap-1 transition-colors"
                title="Reset all modified amounts to cadence defaults"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {filteredRows.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant font-mono text-xs">
              No students found matching your filters.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRows.map((row) => {
                const s = row.student;
                const isSelected = selectedStudentIds.has(s.id);
                const hasCustomAmount = customAmounts[s.id] !== undefined;

                return (
                  <div
                    key={s.id}
                    className={`rounded-2xl p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border transition-all ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-400/40 shadow-sm'
                        : 'glass-well border-outline-variant/20 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* Left: Checkbox & Student Identity */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleStudent(s.id)}
                        className="p-1 text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      <StudentAvatar
                        name={s.name}
                        avatarUrl={s.avatarUrl}
                        size="sm"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-headline font-bold text-sm text-on-surface truncate">
                            {s.name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full glass-well text-on-surface-variant">
                            {s.className || 'Oxford'}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                              s.paymentFrequency === 'monthly'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                            }`}
                          >
                            {s.paymentFrequency === 'monthly' ? 'Monthly' : 'Bi-weekly'}
                          </span>
                          {row.hasCustomSalary && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1 shadow-sm">
                              <TrendingUp className="w-3 h-3 text-emerald-400" />
                              <span>
                                {row.raiseDelta > 0 ? `+E$${row.raiseDelta} Raise` : 'Custom Wage'}
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-mono text-on-surface-variant mt-0.5">
                          <span>Balance: E${s.currentBalance}.00</span>
                          <span>•</span>
                          {/* Last Salary Indicator */}
                          {row.lastPaidDateStr ? (
                            <span
                              className={`flex items-center gap-1 ${
                                row.recentlyPaid
                                  ? 'text-amber-300 font-bold'
                                  : 'text-on-surface-variant'
                              }`}
                            >
                              {row.recentlyPaid ? (
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              )}
                              <span>
                                Last paid: {row.lastPaidDateStr} ({row.daysAgo === 0 ? 'today' : `${row.daysAgo}d ago`})
                              </span>
                            </span>
                          ) : (
                            <span className="text-emerald-400/90 font-medium">
                              🌱 Not yet paid this cycle
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Salary Amount & Override Field */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="flex items-center gap-1.5">
                        {onOpenSalaryRaiseModal && (
                          <button
                            type="button"
                            onClick={() => onOpenSalaryRaiseModal(s)}
                            className="p-1.5 rounded-xl glass-pill text-on-surface-variant hover:text-emerald-300 hover:border-emerald-400/40 transition-colors"
                            title="Customize Student Wage / Grant Raise"
                          >
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                        )}
                        <span className="text-xs font-mono font-bold text-emerald-400">E$</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={row.amount}
                          onChange={(e) => handleAmountChange(s.id, e.target.value)}
                          className={`w-24 px-2.5 py-1.5 rounded-xl font-mono text-sm font-bold text-right focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-all ${
                            hasCustomAmount
                              ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                              : 'glass-well border border-outline-variant/30 text-on-surface'
                          }`}
                        />
                        {hasCustomAmount && (
                          <button
                            type="button"
                            onClick={() => handleResetAmount(s.id)}
                            title="Reset to default cadence amount"
                            className="p-1 rounded-lg glass-pill text-on-surface-variant hover:text-on-surface"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER SUMMARY & ACTION BAR */}
        <div className="p-4 sm:p-6 border-t border-outline-variant/20 bg-surface-container-lowest/60 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant">Total Selected:</span>
              <strong className="text-sm text-on-surface">
                {selectedRows.length} Student{selectedRows.length === 1 ? '' : 's'}
              </strong>
              <span className="text-xs text-on-surface-variant">
                ({monthlySelectedCount} Monthly • {biweeklySelectedCount} Bi-weekly)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant">Total Disbursement:</span>
              <span className="text-lg font-bold text-emerald-400">
                E$ {totalPayout.toLocaleString('en-US')}.00
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full glass-pill text-xs font-mono font-bold text-on-surface hover:border-outline transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={selectedRows.length === 0 || totalPayout <= 0}
              onClick={handlePrimaryClick}
              className="liquid-button-primary px-6 py-2.5 rounded-full text-xs font-headline font-bold transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Briefcase className="w-4 h-4" />
              <span>
                {showDuplicateWarningPrompt
                  ? 'Confirm & Proceed'
                  : `Disburse E$ ${totalPayout.toLocaleString('en-US')}.00`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
