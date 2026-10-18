import React, { useState } from 'react';
import {
  Users,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Ban,
  RefreshCw,
  Clock,
  BookOpen,
  DollarSign,
  TrendingUp,
  Search,
  Sparkles,
  FilePlus,
  Printer,
  Trash2,
  FolderKanban,
  Scale,
  BarChart3,
  Database,
  History,
  Wifi,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpRight,
  Zap,
  Download,
  ShoppingBag,
  Settings,
  X,
} from 'lucide-react';
import {
  Student,
  Loan,
  TeacherSettings,
  Classroom,
  StoreItem,
  EnglishSubmission,
  BalanceAdjustmentTransaction,
} from '../types';
import {
  getCreditTier,
  getDaysDifference,
  formatCardNumber,
} from '../utils/creditCalculator';
import { LoanRequestModal } from './LoanRequestModal';
import { EnglishSubmissionModal } from './EnglishSubmissionModal';
import { QuickAddDailyDollarsModal } from './QuickAddDailyDollarsModal';
import { GrantCreditLimitRaiseModal } from './GrantCreditLimitRaiseModal';
import { DeleteStudentModal } from './DeleteStudentModal';
import { BulkAddStudentsModal } from './BulkAddStudentsModal';
import { BulkGiveMoneyModal } from './BulkGiveMoneyModal';
import { ClassManagerModal } from './ClassManagerModal';
import { ManualBalanceAdjustModal } from './ManualBalanceAdjustModal';
import { StudentReportsModal } from './StudentReportsModal';
import { DataBackupModal } from './DataBackupModal';
import { StudentYearlyHistory } from './StudentYearlyHistory';

export interface TeacherDashboardProps {
  students: Student[];
  loans: Loan[];
  settings: TeacherSettings;
  classrooms: Classroom[];
  selectedClassId?: string;
  onSelectClass?: (classId: string) => void;
  theme?: 'dark' | 'light';
  onBulkAdjustBalance: (
    studentIds: string[],
    amount: number,
    type: 'increase' | 'reduce',
    reason: string
  ) => void;
  onOpenSettings: () => void;
  onOpenPrintStudio: () => void;
  onSwitchToStudentView: (studentId: string) => void;
  onUpdateCreditLimit: (studentId: string, newLimit: number) => void;
  onUpdatePaymentFrequency: (studentId: string, freq: 'monthly' | 'bimonthly') => void;
  onDelistStudent: (studentId: string, reason: string) => void;
  onReinstateStudent: (studentId: string) => void;
  onAddStudent: (newStudentData: Omit<Student, 'id'>) => void;
  onAddBulkStudents: (newStudentsBatch: Omit<Student, 'id'>[]) => void;
  onPrintStudentCard: (studentId: string) => void;
  onApplyDelayPenalty: (loanId: string) => void;
  onIssueLoan: (
    studentId: string,
    data: { principal: number; durationDays: number; loanType: 'short' | 'big'; notes: string }
  ) => void;
  onApproveEnglishSubmission: (submissionId: string, loanId: string) => void;
  onRejectEnglishSubmission: (submissionId: string, loanId: string) => void;
  onGradeWorkDirectly?: () => void;
  onSubmitEnglishWork: (submissionData: Omit<EnglishSubmission, 'id' | 'createdAt'>) => void;
  onAddDailyReward: (
    studentId: string,
    amount: number,
    reason: string
  ) => { success: boolean; error?: string };
  onDeleteStudent: (studentId: string) => void;
  onReduceBalance: (studentId: string, amountToDeduct: number, reason?: string) => void;
  onManualAdjustBalance: (
    studentId: string,
    type: 'increase' | 'decrease',
    amount: number,
    reason: string,
    category?: BalanceAdjustmentTransaction['category'],
    creditScoreChange?: number
  ) => void;
  onCreateClassroom: (classroomData: Omit<Classroom, 'id' | 'createdAt'>) => void;
  onUpdateClassroom: (updatedClass: Classroom) => void;
  onDeleteClassroom: (classId: string) => void;
  onReassignStudents: (fromClassId: string, toClassId: string) => void;
  storeCatalog: StoreItem[];
  onUpdateCatalog: React.Dispatch<React.SetStateAction<StoreItem[]>>;
  onOpenStore: (studentId?: string) => void;
  onGrantCreditLimitRaise: (
    studentId: string,
    newLimit: number,
    reason: string,
    creditScoreBonus?: number
  ) => void;
  onRestoreBackup: (data: {
    students: Student[];
    loans: Loan[];
    storeItems?: StoreItem[];
    settings?: TeacherSettings;
  }) => void;
  onSaveManualSnapshot: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  students,
  loans,
  settings,
  classrooms,
  selectedClassId = 'all',
  onSelectClass,
  theme = 'dark',
  onBulkAdjustBalance,
  onOpenSettings,
  onOpenPrintStudio,
  onSwitchToStudentView,
  onDelistStudent,
  onReinstateStudent,
  onAddStudent,
  onAddBulkStudents,
  onPrintStudentCard,
  onApplyDelayPenalty,
  onIssueLoan,
  onApproveEnglishSubmission,
  onRejectEnglishSubmission,
  onSubmitEnglishWork,
  onAddDailyReward,
  onDeleteStudent,
  onManualAdjustBalance,
  onCreateClassroom,
  onUpdateClassroom,
  onDeleteClassroom,
  onReassignStudents,
  storeCatalog,
  onOpenStore,
  onGrantCreditLimitRaise,
  onRestoreBackup,
  onSaveManualSnapshot,
}) => {
  const [localClassFilter, setLocalClassFilter] = useState<string>(selectedClassId);
  const effectiveClassFilter = onSelectClass ? selectedClassId : localClassFilter;
  const setClassFilter = (val: string) => {
    setLocalClassFilter(val);
    if (onSelectClass) onSelectClass(val);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'delisted' | 'pending'>(
    'all'
  );
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showAddForm, setShowAddForm] = useState(false);

  // Instant Dispenser State
  const [dispenserStudentId, setDispenserStudentId] = useState<string>(students[0]?.id || '');
  const [dispenserAmount, setDispenserAmount] = useState<number>(25);
  const [dispenserReason, setDispenserReason] = useState<string>('🗣️ Spoke in English');
  const [dispenserToast, setDispenserToast] = useState<string | null>(null);

  // New Student Form State
  const [newName, setNewName] = useState('');
  const [newFreq, setNewFreq] = useState<'monthly' | 'bimonthly'>('monthly');
  const [newTheme, setNewTheme] = useState<Student['cardDesignTheme']>('sapphire');
  const [newBalance, setNewBalance] = useState(settings.startingBalance);
  const [newScore, setNewScore] = useState(650);
  const [newStudentClassId, setNewStudentClassId] = useState<string>(
    classrooms[0]?.id || ''
  );

  // Modal States
  const [selectedStudentForLoan, setSelectedStudentForLoan] = useState<Student | null>(null);
  const [selectedLoanForWork, setSelectedLoanForWork] = useState<{
    loan: Loan;
    student: Student;
  } | null>(null);
  const [selectedStudentForDailyDollar, setSelectedStudentForDailyDollar] =
    useState<Student | null>(null);
  const [selectedStudentForCreditRaise, setSelectedStudentForCreditRaise] =
    useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [isBulkMoneyModalOpen, setIsBulkMoneyModalOpen] = useState(false);
  const [isClassManagerOpen, setIsClassManagerOpen] = useState(false);
  const [studentForManualAdjust, setStudentForManualAdjust] = useState<Student | null>(null);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [studentForHistory, setStudentForHistory] = useState<Student | null>(null);
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'grants' | 'adjustments' | 'loans'>(
    'all'
  );

  React.useEffect(() => {
    if (!students.some((s) => s.id === dispenserStudentId) && students[0]) {
      setDispenserStudentId(students[0].id);
    }
  }, [students, dispenserStudentId]);

  const classFilteredStudents =
    effectiveClassFilter === 'all'
      ? students
      : students.filter(
          (s) =>
            s.classId === effectiveClassFilter ||
            s.className === effectiveClassFilter
        );

  const classStudentIds = new Set(classFilteredStudents.map((s) => s.id));
  const classFilteredLoans = loans.filter((l) => classStudentIds.has(l.studentId));

  const activeLoans = classFilteredLoans.filter(
    (l) => l.status !== 'paid' && l.status !== 'defaulted'
  );
  const totalOutstandingDebt = activeLoans.reduce(
    (acc, l) => acc + Math.max(0, l.totalDue - l.amountRepaid),
    0
  );
  const totalBalanceInCirculation = classFilteredStudents.reduce(
    (acc, s) => acc + s.currentBalance,
    0
  );
  const activeCardsCount = classFilteredStudents.filter((s) => s.cardStatus === 'active').length;
  const delistedCardsCount = classFilteredStudents.filter(
    (s) => s.cardStatus === 'delisted'
  ).length;
  const avgCreditScore =
    classFilteredStudents.length > 0
      ? Math.round(
          classFilteredStudents.reduce((acc, s) => acc + s.creditScore, 0) /
            classFilteredStudents.length
        )
      : 600;

  const pendingReviewsCount = activeLoans.reduce(
    (acc, l) => acc + l.submissions.filter((sub) => sub.status === 'pending').length,
    0
  );

  const overdueLoansCount = activeLoans.filter(
    (l) => getDaysDifference(l.dueDate).isOverdue
  ).length;

  const filteredStudents = classFilteredStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentIdNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.cardNumber.includes(searchQuery);

    if (!matchesSearch) return false;

    const studentActiveLoan = loans.find(
      (l) => l.studentId === student.id && l.status !== 'paid' && l.status !== 'defaulted'
    );
    const hasPending = studentActiveLoan?.submissions.some((s) => s.status === 'pending');

    if (filterStatus === 'active') return student.cardStatus === 'active';
    if (filterStatus === 'delisted') return student.cardStatus === 'delisted';
    if (filterStatus === 'pending') return Boolean(hasPending);
    return true;
  });

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const cls = classrooms.find((c) => c.id === newStudentClassId || c.name === newStudentClassId);
    const tier = getCreditTier(newScore);
    const randomCard = `4532 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(
      1000 + Math.random() * 9000
    )} ${Math.floor(1000 + Math.random() * 9000)}`;

    onAddStudent({
      name: newName.trim(),
      studentIdNumber: `ESL-2025-${String(students.length + 1).padStart(3, '0')}`,
      cardNumber: randomCard,
      expiryDate: '06/28',
      cvv: String(Math.floor(100 + Math.random() * 900)),
      cardDesignTheme: newTheme,
      startingBalance: newBalance,
      currentBalance: newBalance,
      creditScore: newScore,
      maxLoanLimit: Math.max(settings.startingLoanLimit, tier.maxLoanLimit),
      paymentFrequency: newFreq,
      cardStatus: 'active',
      activeLoanId: null,
      totalLoansCompleted: 0,
      punctualPaymentsCount: 0,
      delaysCount: 0,
      decoratedStatementsCount: 0,
      classId: cls?.id,
      className: cls?.name || 'General ESL',
    });
    setNewName('');
    setShowAddForm(false);
  };

  const handleInstantDispense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispenserStudentId || dispenserAmount <= 0) return;
    const target = students.find((s) => s.id === dispenserStudentId);
    if (!target || target.cardStatus !== 'active') return;
    const res = onAddDailyReward(dispenserStudentId, dispenserAmount, dispenserReason);
    if (res.success) {
      setDispenserToast(`+E$ ${dispenserAmount} dispensed to ${target.name}`);
      setTimeout(() => setDispenserToast(null), 3000);
    }
  };

  // Build unified Classroom Ledger Journal entries
  const unifiedLedgerEntries = React.useMemo(() => {
    const entries: {
      id: string;
      timestamp: string;
      studentId: string;
      studentName: string;
      className?: string;
      type: 'grant' | 'adjustment' | 'loan';
      badge: string;
      description: string;
      delta: number;
      scoreNote?: string;
    }[] = [];

    classFilteredStudents.forEach((s) => {
      (s.englishRewardsHistory || []).forEach((r) => {
        entries.push({
          id: `rew-${r.id}`,
          timestamp: r.createdAt,
          studentId: s.id,
          studentName: s.name,
          className: s.className,
          type: 'grant',
          badge: 'ENGLISH GRANT',
          description: r.reason,
          delta: r.amount,
        });
      });

      (s.balanceAdjustmentsHistory || []).forEach((m) => {
        entries.push({
          id: `adj-${m.id}`,
          timestamp: m.timestamp,
          studentId: s.id,
          studentName: s.name,
          className: s.className,
          type: 'adjustment',
          badge: (m.category || 'ADJUST').toUpperCase(),
          description: m.reason,
          delta: m.type === 'increase' ? m.amount : -m.amount,
          scoreNote: m.creditScoreChange
            ? `${m.creditScoreChange > 0 ? '+' : ''}${m.creditScoreChange} PTS`
            : undefined,
        });
      });

      (s.storePurchasesHistory || []).forEach((p) => {
        entries.push({
          id: `store-${p.id}`,
          timestamp: p.timestamp,
          studentId: s.id,
          studentName: s.name,
          className: s.className,
          type: 'adjustment',
          badge: 'STORE POS',
          description: p.itemName,
          delta: -p.pricePaid,
          scoreNote: p.creditScoreBonusAwarded ? `+${p.creditScoreBonusAwarded} PTS` : undefined,
        });
      });
    });

    classFilteredLoans.forEach((l) => {
      const st = students.find((s) => s.id === l.studentId);
      entries.push({
        id: `loan-${l.id}`,
        timestamp: l.createdAt,
        studentId: l.studentId,
        studentName: st?.name || 'Student',
        className: st?.className,
        type: 'loan',
        badge: l.status === 'paid' ? 'LOAN SETTLED' : 'MICRO-LOAN',
        description: `${l.loanType === 'short' ? 'Short Advance' : 'Extended Loan'} (${
          l.effectiveInterestRate
        }% APR) • Repaid E$${l.amountRepaid}/${l.totalDue}`,
        delta: l.principal,
      });
    });

    return entries
      .filter((e) => {
        if (ledgerFilter === 'grants') return e.type === 'grant';
        if (ledgerFilter === 'adjustments') return e.type === 'adjustment';
        if (ledgerFilter === 'loans') return e.type === 'loan';
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [classFilteredStudents, classFilteredLoans, students, ledgerFilter]);

  const handleExportLedgerCSV = () => {
    const header = 'Timestamp,Student,Classroom,Category,Description,Amount (E$)\n';
    const rows = unifiedLedgerEntries
      .map(
        (e) =>
          `"${new Date(e.timestamp).toLocaleString()}","${e.studentName}","${
            e.className || ''
          }","${e.badge}","${e.description.replace(/"/g, '""')}","${e.delta}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classroom-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const holoStyleMap: Record<string, string> = {
    sapphire: 'holo-card-cyan',
    gold: 'holo-card-amber',
    emerald: 'holo-card-emerald',
    obsidian: 'holo-card-indigo',
    ruby: 'holo-card-indigo',
  };

  const avgTier = getCreditTier(avgCreditScore);
  const scoreGaugeDash = Math.round((Math.min(850, Math.max(300, avgCreditScore)) / 850) * 175.9);

  return (
    <div className="space-y-7">
      {/* 1. HEADER TERMINAL BANNER */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-primary-container/15 text-primary-container border border-primary-container/30 font-bold">
              DIDACTIC TREASURY TERMINAL • LIVE
            </span>
            <span className="text-xs font-mono text-on-surface-variant">
              {effectiveClassFilter === 'all' ? 'All Cohorts' : effectiveClassFilter} •{' '}
              {settings.schoolName}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-headline font-bold tracking-tight text-on-surface">
            Teacher Hub &amp; Classroom Ledger
          </h2>
        </div>

        {/* Action Pills Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsClassManagerOpen(true)}
            className="glass-pill px-3.5 py-2 rounded-full text-xs font-medium text-on-surface hover:border-primary-container/50 transition-all flex items-center gap-1.5"
          >
            <FolderKanban className="w-3.5 h-3.5 text-primary-container" />
            <span>Classrooms ({classrooms.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReportsModalOpen(true)}
            className="glass-pill px-3.5 py-2 rounded-full text-xs font-medium text-on-surface hover:border-primary-container/50 transition-all flex items-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-secondary" />
            <span>Reports</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBackupModalOpen(true)}
            className="glass-pill px-3.5 py-2 rounded-full text-xs font-medium text-on-surface hover:border-primary-container/50 transition-all flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5 text-tertiary-fixed-dim" />
            <span>Vault Backup</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBulkAddModalOpen(true)}
            className="glass-pill px-3.5 py-2 rounded-full text-xs font-medium text-on-surface hover:border-primary-container/50 transition-all flex items-center gap-1.5"
          >
            <FilePlus className="w-3.5 h-3.5 text-primary-container" />
            <span>Bulk Add</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBulkMoneyModalOpen(true)}
            className="glass-pill px-3.5 py-2 rounded-full text-xs font-medium text-on-surface hover:border-tertiary-container/50 transition-all flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5 text-tertiary-fixed-dim" />
            <span>Bulk E$</span>
          </button>

          <button
            type="button"
            onClick={onOpenPrintStudio}
            className="glass-pill px-3.5 py-2 rounded-full text-xs font-medium text-on-surface hover:border-primary-container/50 transition-all flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-secondary" />
            <span>Print Passes</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="glass-pill px-3 py-2 rounded-full text-xs font-medium text-on-surface hover:border-primary-container/50 transition-all flex items-center gap-1"
            title="Classroom Protocols & Settings"
          >
            <Settings className="w-3.5 h-3.5 text-on-surface-variant" />
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="liquid-button-primary px-5 py-2 rounded-full text-xs font-headline font-bold tracking-wide transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Student</span>
          </button>
        </div>
      </div>

      {/* Classroom Tabs Bar */}
      {classrooms.length > 0 && (
        <div className="glass-panel rounded-2xl p-2 flex items-center justify-between gap-2 overflow-x-auto specular-edge">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setClassFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap ${
                effectiveClassFilter === 'all'
                  ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50'
              }`}
            >
              All Cohorts ({students.length})
            </button>
            {classrooms.map((c) => {
              const count = students.filter(
                (s) => s.classId === c.id || s.className === c.name
              ).length;
              const isSelected =
                effectiveClassFilter === c.id || effectiveClassFilter === c.name;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setClassFilter(c.name)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isSelected
                      ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50'
                  }`}
                >
                  <span>{c.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setIsClassManagerOpen(true)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-mono text-primary-container hover:underline shrink-0"
          >
            + Manage Classes
          </button>
        </div>
      )}

      {/* 2. PRISMATIC METRIC CARDS (3-COLUMN BENTO) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Vault Reserve Liquidity */}
        <div className="glass-card-interactive rounded-3xl p-5 relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-container/10 rounded-full blur-2xl group-hover:bg-primary-container/20 transition-all" />
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant font-bold">
                Vault Reserve Liquidity
              </p>
              <h3 className="text-3xl font-mono font-bold text-on-surface mt-1 tracking-tight">
                E$ {totalBalanceInCirculation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-container/15 border border-primary-container/30 flex items-center justify-center text-primary-container">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-full h-1.5 glass-well rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-container to-tertiary-container rounded-full"
                style={{
                  width: `${
                    classFilteredStudents.length > 0
                      ? Math.round((activeCardsCount / classFilteredStudents.length) * 100)
                      : 100
                  }%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-mono">
              <span>
                Active Passes:{' '}
                <strong className="text-on-surface">
                  {activeCardsCount}/{classFilteredStudents.length}
                </strong>
              </span>
              <span>
                Delisted: <strong className="text-error">{delistedCardsCount}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Active Micro-Loans */}
        <div className="glass-card-interactive rounded-3xl p-5 relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-secondary-container/20 rounded-full blur-2xl transition-all" />
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant font-bold">
                Active Micro-Loans
              </p>
              <div className="flex items-baseline gap-2.5 mt-1">
                <h3 className="text-3xl font-mono font-bold text-on-surface tracking-tight">
                  {activeLoans.length} Active
                </h3>
                <span className="text-xs font-mono text-secondary font-semibold">
                  E$ {totalOutstandingDebt.toLocaleString('en-US')} Due
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-container/30 border border-secondary/30 flex items-center justify-center text-secondary">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="glass-well rounded-xl px-3 py-1.5 flex items-center justify-between">
              <span className="text-[10px] font-mono text-on-surface-variant">IN REVIEW</span>
              <span className="text-xs font-mono font-bold text-tertiary-fixed-dim">
                {pendingReviewsCount} Tasks
              </span>
            </div>
            <div className="glass-well rounded-xl px-3 py-1.5 flex items-center justify-between">
              <span className="text-[10px] font-mono text-on-surface-variant">LATE / DELAY</span>
              <span className="text-xs font-mono font-bold text-error">
                {overdueLoansCount} ({settings.baseInterestRate}%+{settings.delayPenaltyIncrement}%)
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Cohort Prime Credit Score */}
        <div className="glass-card-interactive rounded-3xl p-5 relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-tertiary-container/10 rounded-full blur-2xl transition-all" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant font-bold">
                Cohort Prime Credit Score
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-3xl font-mono font-bold text-on-surface tracking-tight">
                  {avgCreditScore}
                </h3>
                <span className="text-xs font-mono text-tertiary-fixed-dim font-semibold">
                  / 850 FICO-ESL
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-tertiary-container" />
                Tier: <strong className="text-on-surface">{avgTier.name}</strong>
              </p>
            </div>

            {/* Circular Liquid Gauge */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  className="text-outline-variant/25"
                  strokeWidth="5"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="var(--color-tertiary-container)"
                  strokeDasharray="175.9"
                  strokeDashoffset={175.9 - scoreGaugeDash}
                  strokeLinecap="round"
                  strokeWidth="5"
                />
              </svg>
              <span className="absolute text-[10px] font-mono font-bold text-tertiary-fixed-dim">
                {Math.round((avgCreditScore / 850) * 100)}%
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
            <span>Credit Ceiling Range</span>
            <span className="text-primary-container font-bold">
              E$ {settings.startingLoanLimit} → E$ {settings.maxLoanCap}
            </span>
          </div>
        </div>
      </div>

      {/* 3. INSTANT ENGLISH REWARD DISPENSER BAR */}
      <form
        onSubmit={handleInstantDispense}
        className="glass-panel rounded-3xl p-4 sm:p-5 relative overflow-hidden specular-edge"
      >
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-tertiary-container/30 to-primary-container/20 border border-tertiary-container/40 flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-tertiary-fixed-dim" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline font-bold text-sm sm:text-base text-on-surface">
                  Instant English Reward Dispenser
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-tertiary-container/15 text-tertiary-fixed-dim border border-tertiary-container/30 font-bold">
                  UNLIMITED E$
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                One-click Eurodollar minting for active English participation in class
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end">
            <div className="glass-well rounded-xl px-3 py-1.5 flex items-center gap-2 min-w-[200px] max-w-[280px] sm:max-w-[340px] overflow-hidden">
              <Users className="w-3.5 h-3.5 text-primary-container shrink-0" />
              <select
                aria-label="Target Student for Instant Reward"
                value={dispenserStudentId}
                onChange={(e) => setDispenserStudentId(e.target.value)}
                className="bg-transparent text-xs font-headline font-semibold text-on-surface focus:outline-none w-full cursor-pointer truncate"
              >
                {classFilteredStudents
                  .filter((s) => s.cardStatus === 'active')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (E$ {s.currentBalance})
                    </option>
                  ))}
              </select>
            </div>

            <div className="glass-well rounded-xl p-1 flex items-center gap-1 font-mono text-xs">
              {[10, 25, 50, 100].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDispenserAmount(amt)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    dispenserAmount === amt
                      ? 'bg-tertiary-container text-on-tertiary-fixed shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  +E${amt}
                </button>
              ))}
            </div>

            <div className="glass-well rounded-xl px-3 py-1.5 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-tertiary-fixed-dim shrink-0" />
              <select
                aria-label="English Activity Reason"
                value={dispenserReason}
                onChange={(e) => setDispenserReason(e.target.value)}
                className="bg-transparent text-xs font-medium text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="🗣️ Spoke in English">🗣️ Spoke in English</option>
                <option value="📖 Reading Book & Vocab">📖 Reading Book &amp; Vocab</option>
                <option value="✍️ Notebook Statements">✍️ Notebook Statements</option>
                <option value="🏆 Class Game / Activity">🏆 Class Game / Activity</option>
                <option value="🤝 Class Peer Helper">🤝 Class Peer Helper</option>
              </select>
            </div>

            <button
              type="submit"
              className="liquid-button-emerald px-4 py-2 rounded-xl text-xs font-headline font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dispense +E${dispenserAmount}</span>
            </button>
          </div>
        </div>

        {dispenserToast && (
          <div className="mt-3 px-3.5 py-2 rounded-xl bg-tertiary-container/20 border border-tertiary-container/40 text-tertiary-fixed-dim text-xs font-mono font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{dispenserToast}</span>
          </div>
        )}
      </form>

      {/* 4. COLLAPSIBLE NEW STUDENT ENROLLMENT FORM */}
      {showAddForm && (
        <form
          onSubmit={handleAddStudentSubmit}
          className="glass-panel rounded-3xl p-6 space-y-4 specular-edge border border-primary-container/40 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary-container">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-headline font-bold uppercase tracking-wider text-on-surface">
                Enroll New Student Cardholder &amp; Mint SmartPass
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs font-mono text-on-surface-variant hover:text-on-surface"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block mb-1 font-bold">
                Student Full Name
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Elena Rostova"
                className="w-full px-3.5 py-2 glass-well rounded-xl text-on-surface text-sm focus:outline-none focus:border-primary-container"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block mb-1 font-bold">
                Cohort / Class
              </label>
              <select
                value={newStudentClassId}
                onChange={(e) => setNewStudentClassId(e.target.value)}
                className="w-full px-3 py-2 glass-well rounded-xl text-on-surface text-sm focus:outline-none focus:border-primary-container"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                {classrooms.length === 0 && <option value="General ESL">General ESL</option>}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block mb-1 font-bold">
                Allowance Cadence
              </label>
              <select
                value={newFreq}
                onChange={(e) => setNewFreq(e.target.value as 'monthly' | 'bimonthly')}
                className="w-full px-3 py-2 glass-well rounded-xl text-on-surface text-sm focus:outline-none focus:border-primary-container"
              >
                <option value="monthly">Monthly (E${settings.monthlyPayment}/mo)</option>
                <option value="bimonthly">Bi-Weekly (E${settings.bimonthlyPayment}/2wk)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block mb-1 font-bold">
                Holographic Finish
              </label>
              <select
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value as Student['cardDesignTheme'])}
                className="w-full px-3 py-2 glass-well rounded-xl text-on-surface text-sm focus:outline-none focus:border-primary-container"
              >
                <option value="sapphire">Laser Cyan / Sapphire</option>
                <option value="gold">Solar Amber / Gold</option>
                <option value="emerald">Aurora Emerald</option>
                <option value="obsidian">Spectral Indigo / Obsidian</option>
                <option value="ruby">Crimson Ruby</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block mb-1 font-bold">
                  Start E$
                </label>
                <input
                  type="number"
                  value={newBalance}
                  onChange={(e) => setNewBalance(Number(e.target.value))}
                  className="w-full px-2.5 py-2 glass-well rounded-xl text-on-surface text-sm font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block mb-1 font-bold">
                  FICO Score
                </label>
                <input
                  type="number"
                  min={300}
                  max={850}
                  value={newScore}
                  onChange={(e) => setNewScore(Number(e.target.value))}
                  className="w-full px-2.5 py-2 glass-well rounded-xl text-on-surface text-sm font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-full glass-pill text-xs font-mono text-on-surface-variant hover:text-on-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-full liquid-button-primary text-xs font-headline font-bold"
            >
              Issue SmartPass Card
            </button>
          </div>
        </form>
      )}

      {/* 5. PENDING ENGLISH REPAYMENT SUBMISSIONS ALERT */}
      {pendingReviewsCount > 0 && (
        <div className="glass-panel rounded-2xl p-4 border border-amber-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-headline font-bold text-on-surface">
                {pendingReviewsCount} English Loan Repayment{' '}
                {pendingReviewsCount === 1 ? 'Presentation' : 'Presentations'} Awaiting Verification
              </h4>
              <p className="text-xs text-on-surface-variant">
                Verify student sentences, vocabulary, or phrasal verbs to credit their loan balance and boost FICO score.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}
            className="px-4 py-2 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-xs font-mono font-bold shrink-0"
          >
            {filterStatus === 'pending' ? 'Show All Students' : 'Filter Pending Reviews'}
          </button>
        </div>
      )}

      {/* 6. ACTIVE STUDENT INSTRUMENTS HEADER & FILTER BAR */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-headline font-bold text-on-surface">
              Active Student Instruments
            </h3>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full glass-well text-primary-container font-bold">
              {filteredStudents.length} Cardholders
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, ID, card..."
                className="pl-8 pr-3 py-1.5 glass-well rounded-full text-xs text-on-surface font-mono placeholder:text-outline focus:outline-none focus:border-primary-container w-48 sm:w-56"
              />
            </div>

            <div className="glass-well p-1 rounded-full flex items-center gap-1 text-xs font-mono">
              {(['all', 'active', 'pending', 'delisted'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-full capitalize transition-all font-bold ${
                    filterStatus === st
                      ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="glass-well p-1 rounded-full flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                title="Holographic Matrix View"
                className={`p-1.5 rounded-full transition-all ${
                  viewMode === 'cards'
                    ? 'bg-primary-container text-on-primary-fixed'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Compact Ledger Table View"
                className={`p-1.5 rounded-full transition-all ${
                  viewMode === 'table'
                    ? 'bg-primary-container text-on-primary-fixed'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 7. STUDENT INSTRUMENTS MATRIX (CARDS VIEW) */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStudents.map((student) => {
              const tier = getCreditTier(student.creditScore);
              const isDelisted = student.cardStatus === 'delisted';
              const activeLoan = loans.find(
                (l) =>
                  l.studentId === student.id &&
                  l.status !== 'paid' &&
                  l.status !== 'defaulted'
              );
              const pendingSubmissions =
                activeLoan?.submissions.filter((s) => s.status === 'pending') || [];
              const loanDaysInfo = activeLoan ? getDaysDifference(activeLoan.dueDate) : null;
              const holoClass = isDelisted
                ? 'holo-card-delisted'
                : holoStyleMap[student.cardDesignTheme] || 'holo-card-cyan';

              return (
                <div
                  key={student.id}
                  className={`glass-card-interactive rounded-3xl p-5 flex flex-col justify-between gap-3.5 overflow-hidden min-w-0 ${
                    isDelisted ? 'opacity-85 border-error/30' : ''
                  }`}
                >
                  {/* Top Student Identity Header (Full Width for Long Student Names) */}
                  <div className="space-y-3 min-w-0 w-full">
                    <div className="flex items-start gap-3 min-w-0 w-full">
                      <div className="relative shrink-0 mt-0.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-container/30 to-secondary-container/40 border border-primary-container/40 flex items-center justify-center font-headline font-bold text-base text-on-surface">
                          {student.name.charAt(0)}
                        </div>
                        <span
                          className={`absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold border ${
                            isDelisted
                              ? 'bg-error-container text-on-error-container border-error'
                              : 'bg-tertiary-container text-on-tertiary-fixed border-white/40'
                          }`}
                        >
                          {student.creditScore}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => onSwitchToStudentView(student.id)}
                          title={student.name}
                          style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                          className="w-full font-headline font-bold text-sm sm:text-base text-on-surface hover:text-primary-container transition-colors text-left leading-snug break-words whitespace-normal"
                        >
                          {student.name}
                        </button>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-on-surface-variant mt-1">
                          <span className="truncate">{student.studentIdNumber}</span>
                          <span>•</span>
                          <span className="text-primary-container font-semibold truncate">
                            {tier.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dedicated 6-Button Quick Utility Toolbar Row (Never Overlaps Student Name) */}
                    <div className="glass-well rounded-xl p-1 grid grid-cols-6 gap-1 w-full">
                      <button
                        type="button"
                        onClick={() => setStudentForHistory(student)}
                        title="View Student Yearly History"
                        className="py-1.5 rounded-lg hover:bg-surface-container-high/60 text-on-surface-variant hover:text-primary-container transition-colors flex items-center justify-center"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForCreditRaise(student)}
                        title="Grant Credit Limit Raise / Honors"
                        className="py-1.5 rounded-lg hover:bg-surface-container-high/60 text-on-surface-variant hover:text-tertiary-fixed-dim transition-colors flex items-center justify-center"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenStore(student.id)}
                        title="Shop in School Store as Student"
                        className="py-1.5 rounded-lg hover:bg-surface-container-high/60 text-on-surface-variant hover:text-primary-container transition-colors flex items-center justify-center"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onPrintStudentCard(student.id)}
                        title="Print Student SmartPass"
                        className="py-1.5 rounded-lg hover:bg-surface-container-high/60 text-on-surface-variant hover:text-secondary transition-colors flex items-center justify-center"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {isDelisted ? (
                        <button
                          type="button"
                          onClick={() => onReinstateStudent(student.id)}
                          title="Reinstate Delisted Card"
                          className="py-1.5 rounded-lg bg-tertiary-container/20 text-tertiary-fixed-dim hover:bg-tertiary-container/30 transition-colors flex items-center justify-center"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            onDelistStudent(
                              student.id,
                              'Unpaid didactic loan exceeded time limit'
                            )
                          }
                          title="Delist & Revoke Card"
                          className="py-1.5 rounded-lg hover:bg-surface-container-high/60 text-on-surface-variant hover:text-error transition-colors flex items-center justify-center"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setStudentToDelete(student)}
                        title="Delete Student"
                        className="py-1.5 rounded-lg hover:bg-surface-container-high/60 text-on-surface-variant hover:text-error transition-colors flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Embedded Mini Holographic SmartPass */}
                  <div
                    onClick={() => onSwitchToStudentView(student.id)}
                    className={`${holoClass} rounded-2xl p-4 relative overflow-hidden cursor-pointer group/card transition-transform duration-300 hover:scale-[1.01] text-white`}
                  >
                    <div className="holo-sheen absolute inset-0 pointer-events-none" />
                    <div className="flex items-center justify-between gap-2 mb-3 relative z-10 min-w-0">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-white/80 font-semibold truncate min-w-0">
                        {student.className || 'Oxford Reserve'}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isDelisted ? (
                          <span className="px-2 py-0.5 rounded bg-red-600/80 text-white text-[9px] font-mono font-bold uppercase">
                            REVOKED
                          </span>
                        ) : (
                          <Wifi className="w-4 h-4 text-white/80 rotate-90" />
                        )}
                      </div>
                    </div>

                    <div className="font-mono text-xs tracking-[0.14em] text-white/95 mb-3 relative z-10 truncate">
                      {formatCardNumber(student.cardNumber)}
                    </div>

                    <div className="flex items-end justify-between relative z-10 pt-1 border-t border-white/15">
                      <div>
                        <p className="text-[9px] font-mono uppercase text-white/70">
                          Reserve Balance
                        </p>
                        <p className="text-lg font-mono font-bold text-white leading-tight">
                          E$ {student.currentBalance.toLocaleString('en-US')}.00
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-mono uppercase text-white/70">
                          Loan Ceiling
                        </p>
                        <p className="text-xs font-mono font-bold text-emerald-300">
                          E$ {student.maxLoanLimit}.00
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Active Loan Obligation or Clean Standing Bar */}
                  {activeLoan ? (
                    <div className="glass-well rounded-2xl p-3 space-y-2 border border-amber-400/25">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-amber-300 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Loan: E$ {Math.max(0, activeLoan.totalDue - activeLoan.amountRepaid)} left
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            loanDaysInfo?.isOverdue ? 'text-error' : 'text-on-surface-variant'
                          }`}
                        >
                          {loanDaysInfo?.formatted} ({activeLoan.effectiveInterestRate}% APR)
                        </span>
                      </div>

                      <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-container to-tertiary-container"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((activeLoan.amountRepaid / activeLoan.totalDue) * 100)
                            )}%`,
                          }}
                        />
                      </div>

                      {/* Pending Submissions inline quick-approve */}
                      {pendingSubmissions.length > 0 && (
                        <div className="pt-1 space-y-1">
                          {pendingSubmissions.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-amber-500/15 border border-amber-400/30 text-[10px] font-mono"
                            >
                              <span className="text-amber-200 truncate">
                                Pending: E${sub.totalCreditValue} work
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onApproveEnglishSubmission(sub.id, activeLoan.id)
                                  }
                                  className="px-2 py-0.5 rounded bg-tertiary-container text-on-tertiary-fixed font-bold"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onRejectEnglishSubmission(sub.id, activeLoan.id)
                                  }
                                  className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => onApplyDelayPenalty(activeLoan.id)}
                          className="text-[10px] font-mono text-error hover:underline flex items-center gap-1"
                          title="Apply +2% interest delay penalty & -25 credit score"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>+2% Delay ({activeLoan.delaysCount})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedLoanForWork({ loan: activeLoan, student })
                          }
                          className="text-[10px] font-mono font-bold text-tertiary-fixed-dim hover:underline flex items-center gap-1"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Record English Work</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-well rounded-2xl px-3.5 py-2.5 flex items-center justify-between text-xs font-mono">
                      <span className="text-on-surface-variant flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-tertiary-fixed-dim" />
                        Zero Active Debt
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        {student.paymentFrequency === 'monthly' ? 'E$482/mo' : 'E$241/2wk'}
                      </span>
                    </div>
                  )}

                  {/* Quick Action Footer Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <button
                      type="button"
                      disabled={isDelisted}
                      onClick={() => setSelectedStudentForDailyDollar(student)}
                      className="py-2 px-2 rounded-xl bg-tertiary-container/15 hover:bg-tertiary-container/25 border border-tertiary-container/30 text-tertiary-fixed-dim font-mono font-bold text-[11px] transition-all disabled:opacity-40 flex items-center justify-center gap-1"
                      title="Award Daily English Eurodollars"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>+E$</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStudentForManualAdjust(student)}
                      className="py-2 px-2 rounded-xl glass-well hover:border-primary-container/40 text-on-surface font-mono font-bold text-[11px] transition-all flex items-center justify-center gap-1"
                      title="Manual Balance & Credit Score Adjustment"
                    >
                      <Scale className="w-3 h-3 text-primary-container" />
                      <span>Adjust</span>
                    </button>

                    {activeLoan ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedLoanForWork({ loan: activeLoan, student })
                        }
                        className="py-2 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-mono font-bold text-[11px] transition-all flex items-center justify-center gap-1"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Verify</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isDelisted}
                        onClick={() => setSelectedStudentForLoan(student)}
                        className="py-2 px-2 rounded-xl glass-well hover:border-primary-container/40 text-on-surface font-mono font-bold text-[11px] transition-all disabled:opacity-40 flex items-center justify-center gap-1"
                      >
                        <DollarSign className="w-3 h-3 text-secondary" />
                        <span>Loan</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSwitchToStudentView(student.id)}
                      className="py-2 px-2 rounded-xl bg-primary-container/15 hover:bg-primary-container/25 border border-primary-container/30 text-primary-container font-mono font-bold text-[11px] transition-all flex items-center justify-center gap-1"
                    >
                      <span>Portal</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* COMPACT LEDGER TABLE VIEW */
          <div className="glass-panel rounded-3xl overflow-hidden specular-edge">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/50 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                    <th className="py-3.5 px-4">Student Cardholder</th>
                    <th className="py-3.5 px-4">Cohort</th>
                    <th className="py-3.5 px-4">Reserve Balance</th>
                    <th className="py-3.5 px-4">FICO Standing</th>
                    <th className="py-3.5 px-4">Loan Obligation</th>
                    <th className="py-3.5 px-4 text-right">Treasury Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 font-mono">
                  {filteredStudents.map((student) => {
                    const tier = getCreditTier(student.creditScore);
                    const activeLoan = loans.find(
                      (l) =>
                        l.studentId === student.id &&
                        l.status !== 'paid' &&
                        l.status !== 'defaulted'
                    );
                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-surface-container-high/35 transition-colors"
                      >
                        <td className="py-3 px-4 max-w-[260px]">
                          <button
                            type="button"
                            onClick={() => onSwitchToStudentView(student.id)}
                            style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                            className="font-headline font-bold text-sm text-on-surface hover:text-primary-container text-left block break-words whitespace-normal"
                          >
                            {student.name}
                          </button>
                          <span className="text-[10px] text-on-surface-variant">
                            {student.studentIdNumber} • •••• {student.cardNumber.slice(-4)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="glass-well px-2.5 py-1 rounded-lg text-xs text-on-surface">
                            {student.className || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-tertiary-fixed-dim text-sm">
                          E$ {student.currentBalance}.00
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-on-surface">
                            {student.creditScore} PTS
                          </span>
                          <span className="block text-[10px] text-primary-container">
                            {tier.name} (Cap E${student.maxLoanLimit})
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {activeLoan ? (
                            <span className="text-amber-300 font-bold">
                              E$ {Math.max(0, activeLoan.totalDue - activeLoan.amountRepaid)} Due
                            </span>
                          ) : (
                            <span className="text-on-surface-variant">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForDailyDollar(student)}
                              className="px-2.5 py-1 rounded-lg bg-tertiary-container/20 text-tertiary-fixed-dim font-bold"
                            >
                              +E$
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentForManualAdjust(student)}
                              className="px-2.5 py-1 rounded-lg glass-well text-on-surface"
                            >
                              Adjust
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForCreditRaise(student)}
                              className="px-2.5 py-1 rounded-lg glass-well text-primary-container"
                            >
                              Limit+
                            </button>
                            <button
                              type="button"
                              onClick={() => onSwitchToStudentView(student.id)}
                              className="px-2.5 py-1 rounded-lg bg-primary-container text-on-primary-fixed font-bold"
                            >
                              Portal
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 8. CONTINUOUS CLASSROOM LEDGER JOURNAL (BOTTOM GLASS TABLE) */}
      <div className="glass-panel rounded-3xl overflow-hidden specular-edge">
        <div className="p-5 sm:p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary-container font-bold">
                CHRONOLOGICAL AUDIT TRAIL
              </span>
            </div>
            <h3 className="text-lg font-headline font-bold text-on-surface mt-0.5">
              Continuous Classroom Ledger Journal
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="glass-well p-1 rounded-full flex items-center gap-1 text-xs font-mono">
              {(
                [
                  { id: 'all', label: 'All Entries' },
                  { id: 'grants', label: 'English Grants' },
                  { id: 'adjustments', label: 'Store & Adjust' },
                  { id: 'loans', label: 'Micro-Loans' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setLedgerFilter(tab.id)}
                  className={`px-3 py-1 rounded-full transition-all font-bold ${
                    ledgerFilter === tab.id
                      ? 'bg-primary-container text-on-primary-fixed'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleExportLedgerCSV}
              className="glass-pill px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-on-surface hover:border-primary-container/50 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-primary-container" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/40 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-5">Cardholder</th>
                <th className="py-3 px-5">Classification</th>
                <th className="py-3 px-5">Didactic Rubric / Note</th>
                <th className="py-3 px-5 text-right">Magnitude</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15">
              {unifiedLedgerEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-on-surface-variant font-mono text-xs"
                  >
                    No ledger entries matching current filter.
                  </td>
                </tr>
              ) : (
                unifiedLedgerEntries.slice(0, 25).map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-surface-container-high/30 transition-colors"
                  >
                    <td className="py-3 px-5 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleDateString()}{' '}
                      <span className="opacity-70">
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <button
                        type="button"
                        onClick={() => onSwitchToStudentView(entry.studentId)}
                        className="font-headline font-bold text-on-surface hover:text-primary-container"
                      >
                        {entry.studentName}
                      </button>
                      {entry.className && (
                        <span className="ml-2 text-[10px] font-mono text-on-surface-variant">
                          ({entry.className})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          entry.type === 'grant'
                            ? 'bg-tertiary-container/15 text-tertiary-fixed-dim border border-tertiary-container/30'
                            : entry.type === 'loan'
                            ? 'bg-secondary-container/30 text-secondary border border-secondary/30'
                            : 'bg-primary-container/15 text-primary-container border border-primary-container/30'
                        }`}
                      >
                        {entry.badge}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-on-surface-variant max-w-md truncate">
                      {entry.description}
                      {entry.scoreNote && (
                        <span className="ml-2 text-[10px] font-mono font-bold text-primary-container">
                          [{entry.scoreNote}]
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-right font-mono font-bold whitespace-nowrap">
                      <span
                        className={entry.delta >= 0 ? 'text-tertiary-fixed-dim' : 'text-error'}
                      >
                        {entry.delta >= 0 ? '+' : '-'}E$ {Math.abs(entry.delta)}.00
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {selectedStudentForLoan && (
        <LoanRequestModal
          student={selectedStudentForLoan}
          settings={settings}
          isOpen={true}
          onClose={() => setSelectedStudentForLoan(null)}
          onSubmitLoan={(loanData) => {
            onIssueLoan(selectedStudentForLoan.id, loanData);
            setSelectedStudentForLoan(null);
          }}
        />
      )}

      {selectedLoanForWork && (
        <EnglishSubmissionModal
          loan={selectedLoanForWork.loan}
          student={selectedLoanForWork.student}
          settings={settings}
          isTeacherReviewer={true}
          isOpen={true}
          onClose={() => setSelectedLoanForWork(null)}
          onSubmitWork={(sub) => {
            onSubmitEnglishWork(sub);
            setSelectedLoanForWork(null);
          }}
        />
      )}

      {selectedStudentForDailyDollar && (
        <QuickAddDailyDollarsModal
          student={selectedStudentForDailyDollar}
          settings={settings}
          isOpen={true}
          onClose={() => setSelectedStudentForDailyDollar(null)}
          onAddDailyReward={onAddDailyReward}
        />
      )}

      {selectedStudentForCreditRaise && (
        <GrantCreditLimitRaiseModal
          students={students}
          student={selectedStudentForCreditRaise}
          isOpen={true}
          onClose={() => setSelectedStudentForCreditRaise(null)}
          onGrantRaise={onGrantCreditLimitRaise}
        />
      )}

      {studentToDelete && (
        <DeleteStudentModal
          student={studentToDelete}
          isOpen={true}
          onClose={() => setStudentToDelete(null)}
          onConfirmDelete={onDeleteStudent}
        />
      )}

      <BulkAddStudentsModal
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        settings={settings}
        existingStudentCount={students.length}
        classrooms={classrooms}
        theme={theme}
        onAddBulkStudents={onAddBulkStudents}
      />

      <BulkGiveMoneyModal
        isOpen={isBulkMoneyModalOpen}
        onClose={() => setIsBulkMoneyModalOpen(false)}
        students={students}
        classrooms={classrooms}
        theme={theme}
        onSubmit={onBulkAdjustBalance}
      />

      <ClassManagerModal
        isOpen={isClassManagerOpen}
        onClose={() => setIsClassManagerOpen(false)}
        classrooms={classrooms}
        students={students}
        onCreateClassroom={onCreateClassroom}
        onUpdateClassroom={onUpdateClassroom}
        onDeleteClassroom={onDeleteClassroom}
        onReassignStudents={onReassignStudents}
      />

      {studentForManualAdjust && (
        <ManualBalanceAdjustModal
          isOpen={true}
          onClose={() => setStudentForManualAdjust(null)}
          student={studentForManualAdjust}
          students={students}
          onAdjustBalance={onManualAdjustBalance}
        />
      )}

      <StudentReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        students={students}
        loans={loans}
        settings={settings}
      />

      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        students={students}
        loans={loans}
        storeItems={storeCatalog}
        settings={settings}
        onRestoreBackup={onRestoreBackup}
        onSaveManualSnapshot={onSaveManualSnapshot}
      />

      {studentForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass-panel rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 space-y-4 specular-edge">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="text-base font-headline font-bold text-on-surface">
                Yearly Financial &amp; Merit History — {studentForHistory.name}
              </h3>
              <button
                type="button"
                onClick={() => setStudentForHistory(null)}
                className="p-1.5 rounded-xl glass-pill text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <StudentYearlyHistory student={studentForHistory} loans={loans} />
          </div>
        </div>
      )}
    </div>
  );
};
