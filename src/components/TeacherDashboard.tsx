import React, { useState } from 'react';
import {
  Users,
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Search,
  Plus,
  Sliders,
  DollarSign,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Award,
  Trash2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  UserCheck,
  LayoutGrid,
  List,
  Printer,
  Receipt,
  ShoppingBag,
  Layers,
  SlidersHorizontal,
  FileText,
  Database,
  Calendar,
  X,
  Zap,
  Check,
  Building2,
  Wallet,
  ShieldCheck,
  PieChart,
  SlidersVertical,
  Radio,
  FileSpreadsheet,
  Download,
  Percent,
} from 'lucide-react';
import {
  Student,
  Loan,
  TeacherSettings,
  EnglishSubmission,
  StoreItem,
  Classroom,
  BalanceAdjustmentTransaction,
} from '../types';
import {
  getCreditTier,
  getDaysDifference,
  formatCurrency,
  formatCardNumber,
  getStudentDailyEnglishDollars,
} from '../utils/creditCalculator';
import { LoanRequestModal } from './LoanRequestModal';
import { EnglishSubmissionModal } from './EnglishSubmissionModal';
import { QuickAddDailyDollarsModal } from './QuickAddDailyDollarsModal';
import { BulkAddStudentsModal } from './BulkAddStudentsModal';
import { StudentLoansLedger } from './StudentLoansLedger';
import { StorePurchaseModal } from './StorePurchaseModal';
import { DeleteStudentModal } from './DeleteStudentModal';
import { ClassManagerModal } from './ClassManagerModal';
import { ManualBalanceAdjustModal } from './ManualBalanceAdjustModal';
import { GrantCreditLimitRaiseModal } from './GrantCreditLimitRaiseModal';
import { DataBackupModal } from './DataBackupModal';
import { StudentYearlyHistory } from './StudentYearlyHistory';
import { BulkGiveMoneyModal } from './BulkGiveMoneyModal';
import { StudentReportsModal } from './StudentReportsModal';

interface TeacherDashboardProps {
  students: Student[];
  loans: Loan[];
  settings: TeacherSettings;
  classrooms?: Classroom[];
  theme?: 'dark' | 'light';
  onBulkAdjustBalance?: (
    studentIds: string[],
    amount: number,
    type: 'increase' | 'reduce',
    reason: string
  ) => void;
  onOpenSettings: () => void;
  onOpenPrintStudio: () => void;
  onOpenClassManager?: () => void;
  onSwitchToStudentView: (studentId: string) => void;
  onUpdateCreditLimit: (studentId: string, newLimit: number) => void;
  onGrantCreditLimitRaise?: (
    studentId: string,
    newLimit: number,
    reason: string,
    creditScoreBonus?: number
  ) => void;
  onRestoreBackup?: (data: {
    students: Student[];
    loans: Loan[];
    storeItems?: StoreItem[];
    settings?: TeacherSettings;
  }) => void;
  onSaveManualSnapshot?: () => void;
  onUpdatePaymentFrequency: (studentId: string, freq: 'monthly' | 'bimonthly') => void;
  onDelistStudent: (studentId: string, reason: string) => void;
  onReinstateStudent: (studentId: string) => void;
  onAddStudent: (newStudent: Omit<Student, 'id'>) => void;
  onAddBulkStudents?: (students: Omit<Student, 'id'>[]) => void;
  onPrintStudentCard?: (studentId: string) => void;
  onApplyDelayPenalty: (loanId: string) => void;
  onIssueLoan: (studentId: string, loanData: any) => void;
  onApproveEnglishSubmission: (submissionId: string, loanId: string) => void;
  onRejectEnglishSubmission: (submissionId: string, loanId: string) => void;
  onGradeWorkDirectly: (studentId: string, loanId: string) => void;
  onSubmitEnglishWork?: (submission: Omit<EnglishSubmission, 'id' | 'createdAt'>) => void;
  onAddDailyReward?: (
    studentId: string,
    amount: number,
    reason: string
  ) => { success: boolean; error?: string };
  onDeleteStudent?: (studentId: string) => void;
  onReduceBalance?: (
    studentId: string,
    amount: number,
    reason?: string,
    storeDetails?: {
      itemId?: string;
      itemName: string;
      originalPrice: number;
      discountPercent: number;
      quantity?: number;
    }
  ) => void;
  onManualAdjustBalance?: (
    studentId: string,
    type: 'increase' | 'decrease',
    amount: number,
    reason: string,
    category?: BalanceAdjustmentTransaction['category'],
    creditScoreChange?: number
  ) => void;
  onCreateClassroom?: (newClass: Omit<Classroom, 'id' | 'createdAt'>) => void;
  onUpdateClassroom?: (updatedClass: Classroom) => void;
  onDeleteClassroom?: (classId: string) => void;
  onReassignStudents?: (fromClassId: string, toClassId: string) => void;
  storeCatalog?: StoreItem[];
  onUpdateCatalog?: (newCatalog: StoreItem[]) => void;
  onOpenStore?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  students,
  loans,
  settings,
  classrooms = [],
  theme = 'dark',
  onBulkAdjustBalance,
  onOpenSettings,
  onOpenPrintStudio,
  onOpenClassManager,
  onSwitchToStudentView,
  onUpdateCreditLimit,
  onGrantCreditLimitRaise,
  onRestoreBackup,
  onSaveManualSnapshot,
  onUpdatePaymentFrequency,
  onDelistStudent,
  onReinstateStudent,
  onAddStudent,
  onAddBulkStudents,
  onPrintStudentCard,
  onApplyDelayPenalty,
  onIssueLoan,
  onApproveEnglishSubmission,
  onRejectEnglishSubmission,
  onGradeWorkDirectly,
  onSubmitEnglishWork,
  onAddDailyReward,
  onDeleteStudent,
  onReduceBalance,
  onManualAdjustBalance,
  onCreateClassroom,
  onUpdateClassroom,
  onDeleteClassroom,
  onReassignStudents,
  storeCatalog = [],
  onUpdateCatalog,
  onOpenStore,
}) => {
  const isDark = theme === 'dark';

  // Filters & View state
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'overdue' | 'high' | 'review'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Fast Incentive Dispenser (Quick-Award Dock)
  const [dockSelectedStudentId, setDockSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  );
  const [dockAmount, setDockAmount] = useState<number>(25);
  const [dockReason, setDockReason] = useState<string>('Spoke in English');

  // Modals state
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [isBulkGiveMoneyOpen, setIsBulkGiveMoneyOpen] = useState(false);
  const [isClassManagerOpen, setIsClassManagerOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Single Student action modals
  const [studentForLoans, setStudentForLoans] = useState<Student | null>(null);
  const [studentForAdjustBalance, setStudentForAdjustBalance] = useState<Student | null>(null);
  const [studentForRaise, setStudentForRaise] = useState<Student | null>(null);
  const [studentForHistory, setStudentForHistory] = useState<Student | null>(null);
  const [studentForDelete, setStudentForDelete] = useState<Student | null>(null);

  // Add Student Form State
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClassId, setNewStudentClassId] = useState(classrooms[0]?.id || '');
  const [newStudentTheme, setNewStudentTheme] = useState<Student['cardDesignTheme']>('emerald');

  // Cohort & Financial metrics
  const activeStudents = students.filter((s) => s.cardStatus === 'active');
  const delistedStudents = students.filter((s) => s.cardStatus === 'delisted');
  const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'pending_review');
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + (l.totalDue - l.amountRepaid), 0);
  const classLiquidity = activeStudents.reduce((sum, s) => sum + s.currentBalance, 0);
  const avgCreditScore =
    activeStudents.length > 0
      ? Math.round(activeStudents.reduce((acc, s) => acc + s.creditScore, 0) / activeStudents.length)
      : 650;

  // Filtered Students list
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentIdNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.cardNumber.slice(-4).includes(searchQuery);

    const matchesClass =
      selectedClassFilter === 'all' ||
      s.classId === selectedClassFilter ||
      s.className === selectedClassFilter;

    if (!matchesSearch || !matchesClass) return false;

    if (scoreFilter === 'overdue') {
      const studentLoans = loans.filter((l) => l.studentId === s.id && l.status === 'active');
      return studentLoans.some((l) => getDaysDifference(l.dueDate).isOverdue);
    }
    if (scoreFilter === 'high') {
      return s.creditScore >= 700;
    }
    if (scoreFilter === 'review') {
      return s.currentBalance < 100 || s.creditScore < 580;
    }

    return true;
  });

  const focusedDockStudent =
    students.find((s) => s.id === dockSelectedStudentId) ||
    filteredStudents[0] ||
    students[0];

  // Quick Award Dock execution
  const handleExecuteDockAward = () => {
    if (!focusedDockStudent) return;
    if (onAddDailyReward) {
      onAddDailyReward(focusedDockStudent.id, dockAmount, dockReason);
    } else if (onManualAdjustBalance) {
      onManualAdjustBalance(
        focusedDockStudent.id,
        'increase',
        dockAmount,
        `Quick Award: ${dockReason}`,
        'reward',
        5
      );
    }
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const idNum = `ENG-${new Date().getFullYear()}-${String(students.length + 1).padStart(3, '0')}`;
    const rawCard = `4${Math.floor(100 + Math.random() * 900)}${Math.floor(1000 + Math.random() * 9000)}${Math.floor(1000 + Math.random() * 9000)}${randomSuffix}`;
    const targetClass = classrooms.find((c) => c.id === newStudentClassId) || classrooms[0];

    onAddStudent({
      name: newStudentName.trim(),
      studentIdNumber: idNum,
      cardNumber: rawCard,
      expiryDate: '12/29',
      cvv: String(Math.floor(100 + Math.random() * 900)),
      cardDesignTheme: newStudentTheme,
      classId: targetClass?.id,
      className: targetClass?.name,
      startingBalance: settings.startingBalance,
      currentBalance: settings.startingBalance,
      creditScore: 600,
      maxLoanLimit: settings.startingLoanLimit,
      paymentFrequency: 'monthly',
      cardStatus: 'active',
      activeLoanId: null,
      totalLoansCompleted: 0,
      punctualPaymentsCount: 0,
      delaysCount: 0,
      decoratedStatementsCount: 0,
    });

    setNewStudentName('');
    setIsAddStudentOpen(false);
  };

  // Card background metallic gradients based on cardDesignTheme
  const getCardThemeGradient = (themeChoice?: Student['cardDesignTheme']) => {
    switch (themeChoice) {
      case 'emerald':
        return 'from-[#0c2340] via-[#044343] to-[#01684c]';
      case 'sapphire':
        return 'from-[#061826] via-[#0d2a45] to-[#044e68]';
      case 'gold':
        return 'from-[#2e1d05] via-[#4d320b] to-[#7a5413]';
      case 'ruby':
        return 'from-[#26080e] via-[#47121c] to-[#6e1e2d]';
      case 'obsidian':
      default:
        return 'from-[#12161f] via-[#1a2130] to-[#0b0e14]';
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* ======================================================== */}
      {/* 1. DESKTOP UTILITY & CONTROL BAR (macOS Tahoe Glass Surface) */}
      {/* ======================================================== */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-3.5 rounded-2xl border transition-all ${
          isDark
            ? 'bg-[#131722]/85 backdrop-blur-xl border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.45)] text-slate-100'
            : 'bg-white border-slate-200 shadow-sm text-slate-900'
        }`}
      >
        {/* Cohort Filter Segmented Pill Group */}
        <div className="flex items-center gap-1.5 p-1 bg-black/30 border border-white/[0.06] rounded-xl overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedClassFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              selectedClassFilter === 'all'
                ? 'bg-white/[0.14] text-white border border-white/[0.15] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00c896] shadow-[0_0_8px_rgba(0,200,150,0.9)] animate-pulse" />
            <span>All Classes ({students.length})</span>
          </button>

          {classrooms.map((cls) => {
            const isSelected = selectedClassFilter === cls.id;
            const count = students.filter(
              (s) => s.classId === cls.id || s.className === cls.name
            ).length;
            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => setSelectedClassFilter(cls.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all shrink-0 ${
                  isSelected
                    ? 'bg-white/[0.14] text-white border border-white/[0.15] shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{cls.name}</span>
                <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Quick Action Toolset */}
        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-mono text-[11px] font-semibold uppercase tracking-wider ${
              isDark
                ? 'bg-[#181e2b]/80 border-white/[0.06] text-slate-400'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#00c896]" />
            <span>Auth L-3 Reserve</span>
          </div>

          <button
            type="button"
            onClick={onOpenPrintStudio}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all shadow-sm ${
              isDark
                ? 'bg-[#181d2a] hover:bg-[#202737] border-white/[0.08] text-slate-200 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="Print physical ATM debit cards"
          >
            <Printer className="w-3.5 h-3.5 text-[#00c896]" />
            <span>Print Cards</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBulkGiveMoneyOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all shadow-sm ${
              isDark
                ? 'bg-[#181d2a] hover:bg-[#202737] border-white/[0.08] text-slate-200 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="Bulk award or deduct E$ across students"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Bulk Award</span>
          </button>

          <button
            type="button"
            onClick={() => setIsClassManagerOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all shadow-sm ${
              isDark
                ? 'bg-[#181d2a] hover:bg-[#202737] border-white/[0.08] text-slate-200 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="Manage classrooms & cohort rosters"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Classrooms</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddStudentOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00c896] hover:bg-[#00dfa7] text-[#052e22] font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_18px_rgba(0,200,150,0.35)] transition-all"
            title="Enroll new student cardholder"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Student</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PRIMARY FINANCIAL METRICS TRIPTYCH (Stitch Exact Cards) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Aggregate Reserve Liquidity */}
        <div
          className={`relative overflow-hidden p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            isDark
              ? 'bg-[#131722]/85 backdrop-blur-2xl border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Reserve Vault Liquidity
              </div>
              <div className="font-display text-2xl lg:text-3xl font-extrabold tracking-tight text-white font-mono">
                E${classLiquidity.toLocaleString()}.00
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[#00c896] shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div
            className={`mt-4 flex items-center justify-between pt-2.5 -mx-5 -mb-5 px-5 py-2.5 border-t ${
              isDark ? 'bg-[#0d1017]/70 border-white/[0.06]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[#00c896] font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>+4.8% bi-wk</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">
              {activeStudents.length} Solvency Accounts
            </span>
          </div>
        </div>

        {/* Card 2: Active Overdraft & Micro-loans */}
        <div
          className={`relative overflow-hidden p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            isDark
              ? 'bg-[#131722]/85 backdrop-blur-2xl border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Active Institutional Loans
              </div>
              <div className="flex items-baseline gap-2 font-display text-2xl lg:text-3xl font-extrabold tracking-tight text-white font-mono">
                <span>{activeLoans.length}</span>
                <span className="text-base text-slate-400 font-normal">/ {activeStudents.length}</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 shadow-sm">
              <PieChart className="w-5 h-5" />
            </div>
          </div>

          <div
            className={`mt-4 flex items-center justify-between pt-2.5 -mx-5 -mb-5 px-5 py-2.5 border-t ${
              isDark ? 'bg-[#0d1017]/70 border-white/[0.06]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
              <span>
                {activeStudents.length > 0
                  ? `${Math.round((activeLoans.length / activeStudents.length) * 100)}% active rate`
                  : '0% rate'}
              </span>
            </div>
            <span className="font-mono text-sky-400 text-[10px] font-bold">
              Underwritten: E${totalOutstanding.toLocaleString()}.00
            </span>
          </div>
        </div>

        {/* Card 3: Class Credit Score Index */}
        <div
          className={`relative overflow-hidden p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            isDark
              ? 'bg-[#131722]/85 backdrop-blur-2xl border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Avg Class Credit Index
              </div>
              <div className="flex items-baseline gap-2 font-display text-2xl lg:text-3xl font-extrabold tracking-tight text-white font-mono">
                <span>{avgCreditScore}</span>
                <span className="text-base text-slate-400 font-normal">/ 850 Max</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[#00c896] shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div
            className={`mt-4 flex items-center justify-between pt-2.5 -mx-5 -mb-5 px-5 py-2.5 border-t ${
              isDark ? 'bg-[#0d1017]/70 border-white/[0.06]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[#00c896] font-mono text-[10px] font-bold">
              <Award className="w-3 h-3" />
              <span>Prime Grade Portfolio</span>
            </div>
            <span className="font-mono text-slate-400 text-[10px]">+14 pts this cycle</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. INLINE FAST INCENTIVE DISPENSER (Quick-Award Dock) */}
      {/* ======================================================== */}
      {focusedDockStudent && (
        <div
          className={`p-4 rounded-2xl border transition-all flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 ${
            isDark
              ? 'bg-gradient-to-r from-emerald-950/40 via-[#131722]/90 to-[#10141d]/90 backdrop-blur-xl border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          {/* Active Selected Student Pill */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-[#052e22] flex items-center justify-center font-display font-extrabold text-sm shadow-md ring-1 ring-white/20 shrink-0">
              {focusedDockStudent.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#00c896] font-bold">
                  Focused Cardholder
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                <span className="font-mono text-[11px] text-slate-400">
                  ID: #{focusedDockStudent.studentIdNumber || focusedDockStudent.cardNumber.slice(-4)}
                </span>
              </div>
              <div className="font-display font-semibold text-sm truncate tracking-tight text-white">
                {focusedDockStudent.name}
              </div>
              <div className="font-mono text-[11px] text-slate-400">
                Balance: <span className="font-bold text-[#00c896]">E${focusedDockStudent.currentBalance}.00</span>
                {' '}&bull; Available Limit: <span className="text-slate-300">E${focusedDockStudent.maxLoanLimit}.00</span>
              </div>
            </div>
          </div>

          {/* Fast Currency Buttons & Badges */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Direct Denomination Disbursers */}
            <div className="flex items-center gap-1 bg-[#0b0e14]/80 border border-white/[0.06] p-1 rounded-xl shadow-inner">
              {[10, 25, 50, 100].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDockAmount(amt)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all ${
                    dockAmount === amt
                      ? 'bg-[#00c896] text-[#052e22] shadow-sm'
                      : 'bg-[#181d2a] hover:bg-[#222a3a] text-slate-200'
                  }`}
                >
                  +E${amt}
                </button>
              ))}
            </div>

            {/* Quick Criteria Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                'Spoke in English',
                'Reading Log',
                'Peer Helper',
                'Notebook Bonus',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setDockReason(reason)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-medium transition-all ${
                    dockReason === reason
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold shadow-sm'
                      : isDark
                      ? 'bg-[#181d2a] hover:bg-white/[0.08] text-slate-300 border-white/[0.08]'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            {/* Push Ledger Mutation CTA */}
            <button
              type="button"
              onClick={handleExecuteDockAward}
              className="px-4 py-1.5 rounded-xl bg-[#00c896] hover:bg-[#00dfa7] text-[#052e22] font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_18px_rgba(0,200,150,0.35)] flex items-center gap-1.5 ml-auto transition-all"
            >
              <Zap className="w-3.5 h-3.5 stroke-[3]" />
              <span>Issue E${dockAmount}</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SEARCH, CONTROLS & FILTER TOOLBAR */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: `All Cardholders (${students.length})` },
            { id: 'overdue', label: 'Overdue Only' },
            { id: 'high', label: 'High Credit 700+' },
            { id: 'review', label: 'Needs Solvency Review' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setScoreFilter(pill.id as any)}
              className={`px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all ${
                scoreFilter === pill.id
                  ? 'bg-white text-[#0b0e14] font-bold shadow-sm'
                  : isDark
                  ? 'bg-[#161b26]/90 hover:bg-[#1f2535] border border-white/[0.08] text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search Input & View Toggles */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter student or card ID..."
              className={`w-full h-8 pl-8 pr-3 rounded-xl font-mono text-xs border shadow-inner focus:outline-none focus:ring-1 focus:ring-[#00c896] ${
                isDark
                  ? 'bg-[#131722]/90 border-white/[0.08] text-white placeholder:text-slate-500'
                  : 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
            />
          </div>

          {/* Segmented View Toggle */}
          <div className="flex items-center bg-[#0b0e14]/70 border border-white/[0.06] p-0.5 rounded-xl shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white/[0.14] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Matrix Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white/[0.14] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Table Ledger View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. CARDHOLDER MATRIX (macOS Tahoe 3-Column Desktop Grid) */}
      {/* ======================================================== */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((st) => {
            const tier = getCreditTier(st.creditScore);
            const studentLoan = loans.find(
              (l) => l.studentId === st.id && (l.status === 'active' || l.status === 'pending_review')
            );
            const isDelisted = st.cardStatus === 'delisted';
            const isFocused = focusedDockStudent?.id === st.id;

            return (
              <div
                key={st.id}
                onClick={() => setDockSelectedStudentId(st.id)}
                className={`group relative flex flex-col justify-between rounded-2xl p-4 border transition-all cursor-pointer ${
                  isFocused
                    ? isDark
                      ? 'bg-[#131722]/85 backdrop-blur-xl border-[#00c896]/50 shadow-[0_8px_32px_rgba(0,200,150,0.18)] ring-1 ring-[#00c896]/30'
                      : 'bg-emerald-50 border-2 border-[#00c896] shadow-md ring-1 ring-[#00c896]'
                    : isDark
                    ? 'bg-[#131722]/85 backdrop-blur-xl border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:border-white/[0.18] hover:shadow-[0_12px_36px_rgba(0,0,0,0.55)]'
                    : 'bg-white border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Stitch Apple Wallet Micro-Reserve Card Preview */}
                <div
                  className={`relative w-full aspect-[1.586/1] rounded-xl overflow-hidden p-3.5 flex flex-col justify-between shadow-xl mb-3.5 text-white border border-white/[0.15] bg-gradient-to-br ${getCardThemeGradient(
                    st.cardDesignTheme
                  )}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-[9px] tracking-wider uppercase text-cyan-200/80 font-bold">
                        {st.className || '2nd BGU'} &bull; ESL Reserve
                      </div>
                      <div className="font-display font-bold text-sm tracking-tight text-white truncate max-w-[170px]">
                        {st.name}
                      </div>
                    </div>
                    {/* Translucent Chip Insignia */}
                    <div className="w-7 h-5 rounded-md bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-sm">
                      <Radio className="w-3 h-3 text-cyan-300 rotate-90" />
                    </div>
                  </div>

                  <div className="flex items-end justify-between font-mono text-[10px]">
                    <div>
                      <div className="text-[8px] uppercase text-cyan-200/70 font-bold">Card Serial</div>
                      <div className="tracking-widest font-semibold text-white">
                        •••• {st.cardNumber.slice(-4)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] uppercase text-cyan-200/70 font-bold">Solvency Tier</div>
                      <div className="font-bold text-emerald-300 uppercase">
                        {isDelisted ? 'REVOKED' : tier.name}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Metrics & Ledger Snapshot */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between pb-1">
                    <div className="min-w-0 pr-2">
                      <div className="font-display font-semibold text-sm text-white truncate">
                        {st.name}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        Class Seat: #{st.studentIdNumber || st.cardNumber.slice(-4)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-sm text-white">{st.creditScore}</div>
                      <div className="font-mono text-[10px] text-[#00c896] font-semibold">
                        {tier.name}
                      </div>
                    </div>
                  </div>

                  {/* Metric Table Box */}
                  <div className="grid grid-cols-2 gap-2 bg-[#0b0e14]/70 border border-white/[0.06] p-2.5 rounded-xl">
                    <div>
                      <span className="font-mono text-[9px] text-slate-400 block uppercase font-bold">
                        Reserve Balance
                      </span>
                      <span className="font-mono font-bold text-[#00c896] text-xs">
                        E${st.currentBalance}.00
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-[9px] text-slate-400 block uppercase font-bold">
                        Loan Cap Limit
                      </span>
                      <span className="font-mono font-semibold text-slate-200 text-xs">
                        E${st.maxLoanLimit}.00
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center justify-between pt-1 border-t border-white/[0.04] text-[10px] font-mono">
                      <div className="flex items-center gap-1 text-[#00c896] font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{st.punctualPaymentsCount} On-Time Settle</span>
                      </div>
                      {studentLoan ? (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                          Debt: E${studentLoan.totalDue - studentLoan.amountRepaid}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                          No Debt
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card-Level Operational Actions */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="mt-3 pt-2.5 flex items-center gap-1.5 border-t border-white/[0.06]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setStudentForAdjustBalance(st);
                    }}
                    className="flex-1 py-1 px-2 rounded-lg bg-[#00c896] hover:bg-[#00dfa7] text-[#052e22] font-mono text-[11px] font-bold shadow-[0_0_12px_rgba(0,200,150,0.25)] transition-all text-center"
                  >
                    + Award E$
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudentForRaise(st)}
                    className="py-1 px-2 rounded-lg bg-[#181d2a] hover:bg-[#222a3a] border border-white/[0.08] text-slate-200 font-mono text-[11px] font-medium transition-all"
                  >
                    Raise Cap
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudentForLoans(st)}
                    className="p-1.5 rounded-lg bg-[#181d2a] hover:bg-[#222a3a] border border-white/[0.08] text-slate-400 hover:text-white transition-all"
                    title="View Student Loans & English History"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSwitchToStudentView(st.id)}
                    className="p-1.5 rounded-lg bg-[#181d2a] hover:bg-[#222a3a] border border-white/[0.08] text-sky-400 hover:text-sky-300 transition-all"
                    title="Open Student Portal"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Alternate Table Ledger View */
        <div
          className={`rounded-2xl border overflow-hidden shadow-xl ${
            isDark ? 'bg-[#131722]/85 border-white/[0.08]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead
                className={`text-[10px] uppercase font-bold tracking-wider border-b ${
                  isDark ? 'bg-[#0b0e14]/70 border-white/[0.08] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <tr>
                  <th className="py-3 px-4">Cardholder</th>
                  <th className="py-3 px-3">Class</th>
                  <th className="py-3 px-3">Credit Score</th>
                  <th className="py-3 px-3">Wallet Reserve</th>
                  <th className="py-3 px-3">Loan Cap</th>
                  <th className="py-3 px-3">Debt Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredStudents.map((st) => {
                  const tier = getCreditTier(st.creditScore);
                  const studentLoan = loans.find(
                    (l) => l.studentId === st.id && (l.status === 'active' || l.status === 'pending_review')
                  );

                  return (
                    <tr
                      key={st.id}
                      onClick={() => setDockSelectedStudentId(st.id)}
                      className={`hover:bg-white/[0.04] transition-colors cursor-pointer ${
                        focusedDockStudent?.id === st.id ? 'bg-emerald-500/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[#00c896] font-bold text-xs flex items-center justify-center">
                          {st.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-display font-semibold text-white">{st.name}</div>
                          <div className="text-[10px] text-slate-400">
                            •••• {st.cardNumber.slice(-4)}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{st.className || '2nd BGU'}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-white">{st.creditScore}</span>
                        <span className="text-[10px] text-[#00c896] block">{tier.name}</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-[#00c896]">
                        E${st.currentBalance}.00
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-semibold">
                        E${st.maxLoanLimit}.00
                      </td>
                      <td className="py-3 px-3">
                        {studentLoan ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                            Due E${studentLoan.totalDue - studentLoan.amountRepaid}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            Settled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStudentForAdjustBalance(st);
                            }}
                            className="px-2 py-1 rounded bg-[#00c896] hover:bg-[#00dfa7] text-[#052e22] font-bold text-[10px] uppercase shadow-sm"
                          >
                            + Award
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSwitchToStudentView(st.id);
                            }}
                            className="p-1 rounded bg-[#181d2a] hover:bg-[#202737] text-sky-400 border border-white/[0.08]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
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

      {/* ======================================================== */}
      {/* 6. MODALS PRESERVATION */}
      {/* ======================================================== */}

      {/* Add Single Student Modal */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-5 ${
              isDark ? 'bg-[#121622] border-white/[0.1] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#00c896]" />
                <h3 className="font-display font-bold text-sm">Enroll Single Student</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStudentOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="pt-4 space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Full Student Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Maria Esther Andrade"
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#00c896] ${
                    isDark ? 'bg-[#181d29] border-white/[0.1] text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Assign Classroom / Cohort
                </label>
                <select
                  value={newStudentClassId}
                  onChange={(e) => setNewStudentClassId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#00c896] ${
                    isDark ? 'bg-[#181d29] border-white/[0.1] text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.section ? `(${c.section})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Card Metallic Theme
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(['emerald', 'sapphire', 'gold', 'ruby', 'obsidian'] as const).map((th) => (
                    <button
                      key={th}
                      type="button"
                      onClick={() => setNewStudentTheme(th)}
                      className={`p-2 rounded-xl border text-[10px] font-bold uppercase transition-all capitalize ${
                        newStudentTheme === th
                          ? 'border-[#00c896] ring-1 ring-[#00c896] text-white shadow-sm'
                          : 'border-white/[0.08] text-slate-400 hover:text-white'
                      }`}
                    >
                      {th}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/[0.1] text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00c896] text-[#052e22] font-bold uppercase tracking-wider rounded-xl shadow-md"
                >
                  Enroll Cardholder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Students Modal */}
      {isBulkAddOpen && onAddBulkStudents && (
        <BulkAddStudentsModal
          isOpen={isBulkAddOpen}
          onClose={() => setIsBulkAddOpen(false)}
          onAddBulkStudents={onAddBulkStudents}
          classrooms={classrooms}
          settings={settings}
        />
      )}

      {/* Bulk Give Money Modal */}
      {isBulkGiveMoneyOpen && onBulkAdjustBalance && (
        <BulkGiveMoneyModal
          isOpen={isBulkGiveMoneyOpen}
          onClose={() => setIsBulkGiveMoneyOpen(false)}
          students={students}
          classrooms={classrooms}
          onBulkAdjustBalance={onBulkAdjustBalance}
        />
      )}

      {/* Class Manager Modal */}
      {isClassManagerOpen && (
        <ClassManagerModal
          isOpen={isClassManagerOpen}
          onClose={() => setIsClassManagerOpen(false)}
          classrooms={classrooms}
          students={students}
          onCreateClassroom={onCreateClassroom || (() => {})}
          onUpdateClassroom={onUpdateClassroom || (() => {})}
          onDeleteClassroom={onDeleteClassroom || (() => {})}
          onReassignStudents={onReassignStudents || (() => {})}
        />
      )}

      {/* Reports Modal */}
      {isReportsModalOpen && (
        <StudentReportsModal
          isOpen={isReportsModalOpen}
          onClose={() => setIsReportsModalOpen(false)}
          students={students}
          loans={loans}
          classrooms={classrooms}
          settings={settings}
        />
      )}

      {/* Backup & Recovery Modal */}
      {isBackupModalOpen && (
        <DataBackupModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
          students={students}
          loans={loans}
          settings={settings}
          storeItems={storeCatalog}
          onRestoreBackup={onRestoreBackup}
          onSaveManualSnapshot={onSaveManualSnapshot}
        />
      )}

      {/* Single Student Manual Balance Adjust */}
      {studentForAdjustBalance && onManualAdjustBalance && (
        <ManualBalanceAdjustModal
          isOpen={!!studentForAdjustBalance}
          onClose={() => setStudentForAdjustBalance(null)}
          student={studentForAdjustBalance}
          onAdjustBalance={onManualAdjustBalance}
        />
      )}

      {/* Single Student Credit Limit Raise */}
      {studentForRaise && onGrantCreditLimitRaise && (
        <GrantCreditLimitRaiseModal
          isOpen={!!studentForRaise}
          onClose={() => setStudentForRaise(null)}
          student={studentForRaise}
          onGrantRaise={onGrantCreditLimitRaise}
        />
      )}

      {/* Single Student Loans & English History Sheet */}
      {studentForLoans && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className={`w-full max-w-3xl rounded-2xl border shadow-2xl p-5 max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-[#121622] border-white/[0.1] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#00c896]" />
                <div>
                  <h3 className="font-display font-bold text-base">{studentForLoans.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Loans &amp; English Statement Submissions Ledger
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStudentForLoans(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <StudentLoansLedger
              student={studentForLoans}
              loans={loans}
              settings={settings}
              onOpenEnglishWork={() => {}}
              onRequestNewLoan={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
};
