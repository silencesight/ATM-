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
} from 'lucide-react';
import { Student, Loan, TeacherSettings, EnglishSubmission, StoreItem, Classroom, BalanceAdjustmentTransaction } from '../types';
import {
  getCreditTier,
  getDaysDifference,
  formatCurrency,
  formatCardNumber,
  getStudentDailyEnglishDollars,
} from '../utils/creditCalculator';
import { LoanRequestModal } from './LoanRequestModal';
import { EnglishSubmissionModal } from './EnglishSubmissionModal';
import { EnglishDailyDollarsSection } from './EnglishDailyDollarsSection';
import { QuickAddDailyDollarsModal } from './QuickAddDailyDollarsModal';
import { BulkAddStudentsModal } from './BulkAddStudentsModal';
import { StudentLoansLedger } from './StudentLoansLedger';
import { StorePurchaseModal } from './StorePurchaseModal';
import { DeleteStudentModal } from './DeleteStudentModal';
import { ClassManagerModal } from './ClassManagerModal';
import { ManualBalanceAdjustModal } from './ManualBalanceAdjustModal';
import { GrantCreditLimitRaiseModal } from './GrantCreditLimitRaiseModal';
import { StudentReportsModal } from './StudentReportsModal';
import { DataBackupModal } from './DataBackupModal';
import { StudentYearlyHistory } from './StudentYearlyHistory';
import { BulkGiveMoneyModal } from './BulkGiveMoneyModal';

interface TeacherDashboardProps {
  students: Student[];
  loans: Loan[];
  settings: TeacherSettings;
  classrooms?: Classroom[];
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
  onAddDailyReward?: (studentId: string, amount: number, reason: string) => { success: boolean; error?: string };
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
  onBulkAdjustBalance?: (
    studentIds: string[],
    amount: number,
    type: 'increase' | 'reduce',
    reason: string
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
  onSubmitEnglishWork,
  onAddDailyReward,
  onDeleteStudent,
  onReduceBalance,
  onManualAdjustBalance,
  onBulkAdjustBalance,
  onCreateClassroom,
  onUpdateClassroom,
  onDeleteClassroom,
  onReassignStudents,
  storeCatalog,
  onUpdateCatalog,
  onOpenStore,
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'loans' | 'submissions' | 'delisted'>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [isClassManagerOpen, setIsClassManagerOpen] = useState(false);
  const [isBulkGiveMoneyOpen, setIsBulkGiveMoneyOpen] = useState(false);
  const [manualAdjustStudent, setManualAdjustStudent] = useState<Student | null>(null);
  const [newStudentClassId, setNewStudentClassId] = useState<string>(classrooms[0]?.id || '');
  const [selectedStudentForLoan, setSelectedStudentForLoan] = useState<Student | null>(null);
  const [recordingPresentationFor, setRecordingPresentationFor] = useState<{ student: Student; loan: Loan } | null>(null);
  const [quickRewardStudent, setQuickRewardStudent] = useState<Student | null>(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [expandedLoansStudentId, setExpandedLoansStudentId] = useState<string | null>(null);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentTheme, setNewStudentTheme] = useState<Student['cardDesignTheme']>('sapphire');
  const [delistingStudent, setDelistingStudent] = useState<Student | null>(null);
  const [delistReasonInput, setDelistReasonInput] = useState('Failed to settle loan on time beyond permissible deadline.');
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [storePurchaseStudent, setStorePurchaseStudent] = useState<Student | null>(null);
  const [adjustingLimitStudent, setAdjustingLimitStudent] = useState<Student | null>(null);
  const [customLimitValue, setCustomLimitValue] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'overdue' | 'high'>('all');
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [selectedStudentForRaise, setSelectedStudentForRaise] = useState<Student | undefined>(undefined);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [historyModalStudent, setHistoryModalStudent] = useState<Student | null>(null);

  // Statistics
  const activeStudents = students.filter((s) => s.cardStatus === 'active');
  const delistedStudents = students.filter((s) => s.cardStatus === 'delisted');
  const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'pending_review');
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + (l.totalDue - l.amountRepaid), 0);
  const classLiquidity = activeStudents.reduce((sum, s) => sum + s.currentBalance, 0);
  const completedPayments = students.reduce((acc, s) => acc + s.punctualPaymentsCount + s.delaysCount, 0);
  const punctualityRate = completedPayments > 0
    ? Math.round((students.reduce((acc, s) => acc + s.punctualPaymentsCount, 0) / completedPayments) * 100)
    : 88;
  const avgCreditScore = activeStudents.length > 0
    ? Math.round(activeStudents.reduce((acc, s) => acc + s.creditScore, 0) / activeStudents.length)
    : 650;

  // Pending submissions across all loans
  const pendingSubmissions: { sub: EnglishSubmission; loan: Loan; student: Student }[] = [];
  loans.forEach((loan) => {
    const student = students.find((s) => s.id === loan.studentId);
    if (!student) return;
    loan.submissions.forEach((sub) => {
      if (sub.status === 'pending') {
        pendingSubmissions.push({ sub, loan, student });
      }
    });
  });

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
      creditScore: 600, // Starts at Good Fair standard
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

  const handleConfirmDelist = () => {
    if (!delistingStudent) return;
    onDelistStudent(delistingStudent.id, delistReasonInput);
    setDelistingStudent(null);
  };

  const handleConfirmLimit = () => {
    if (!adjustingLimitStudent) return;
    onUpdateCreditLimit(adjustingLimitStudent.id, customLimitValue);
    setAdjustingLimitStudent(null);
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentIdNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass =
      selectedClassFilter === 'all' ||
      s.classId === selectedClassFilter ||
      s.className === selectedClassFilter;

    if (activeTab === 'delisted') {
      return matchesSearch && matchesClass && s.cardStatus === 'delisted';
    }
    if (activeTab === 'roster') {
      return matchesSearch && matchesClass && s.cardStatus === 'active';
    }
    return matchesSearch && matchesClass;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Terminal Telemetry Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Terminal Online • {settings.classroomTitle}
            </span>
          </div>
          <h1 className="text-2xl font-light tracking-tight text-white mt-1 uppercase">
            Teacher Terminal <span className="font-bold text-emerald-400">v1.0</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            ESL Credit Reserve &amp; Didactic Loan System. Punctual payments boost credit score; decorated statements unlock higher loan limits; unreturned loans face permanent card revocation.
          </p>
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 min-w-[120px]">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Class Liquidity</p>
            <p className="text-xl font-mono text-white font-bold">E${classLiquidity.toLocaleString()}.00</p>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 min-w-[120px]">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Active Loans</p>
            <p className="text-xl font-mono text-emerald-400 font-bold">
              {activeLoans.length} <span className="text-xs text-slate-500 font-normal">/ {activeStudents.length}</span>
            </p>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 min-w-[120px]">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Punctuality</p>
            <p className="text-xl font-mono text-blue-400 font-bold">{punctualityRate}%</p>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 min-w-[120px]">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Avg Score</p>
            <p className="text-xl font-mono text-white font-bold">
              {avgCreditScore} <span className="text-xs text-slate-500 font-normal">/ 850</span>
            </p>
          </div>
        </div>
      </div>

      {/* Quick Reference Rail: Exchange Rates & Global Rules & Terminal Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Exchange Rates (matching Geometric Balance template) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3">
              English Currency Exchange Rates
            </p>
            <div className="space-y-2">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">English Sentence</span>
                <span className="text-emerald-400 font-mono font-bold">E${settings.sentenceValue}.00</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">New Vocabulary Word</span>
                <span className="text-emerald-400 font-mono font-bold">E${settings.wordValue}.00</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Phrasal Verb in Notebook</span>
                <span className="text-emerald-400 font-mono font-bold">E${settings.phrasalVerbValue}.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Global Rules & Protocols */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3">
              Classroom Lending Protocols
            </p>
            <div className="space-y-2">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Standard Interest</span>
                <span className="text-white font-mono font-bold">{settings.baseInterestRate}%</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Delay Penalty</span>
                <span className="text-amber-400 font-mono font-bold">+{settings.delayPenaltyIncrement}% / delay</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Starting Balance / Limit</span>
                <span className="text-white font-mono font-bold">E${settings.startingBalance} / E${settings.startingLoanLimit}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Quick Terminal Actions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3">
              Terminal Actions
            </p>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setIsAddStudentOpen(true)}
                  className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5"
                  title="Enroll an individual student"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">+ Student</span>
                  <span className="sm:hidden text-[9px]">Student</span>
                </button>
                <button
                  onClick={() => setIsBulkAddOpen(true)}
                  className="py-2.5 px-2 bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg border border-emerald-500/40 transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-sm"
                  title="Import student roster in bulk"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">+ Roster</span>
                  <span className="sm:hidden text-[9px]">Roster</span>
                </button>
                <button
                  onClick={() => setIsBulkGiveMoneyOpen(true)}
                  className="py-2.5 px-2 bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg border border-emerald-500/40 transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-sm"
                  title="Add money to multiple students at once"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">+ Bulk $</span>
                  <span className="sm:hidden text-[9px]">Bulk $</span>
                </button>
              </div>
              <button
                onClick={() => setIsClassManagerOpen(true)}
                className="w-full py-2 bg-gradient-to-r from-amber-700/80 to-amber-600/80 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg border border-amber-500/40 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Layers className="w-4 h-4 text-amber-200" />
                Classrooms &amp; Groups ({classrooms.length})
              </button>
              <button
                onClick={onOpenPrintStudio}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                Print Physical Cards ({students.length})
              </button>
              {onOpenStore && (
                <button
                  onClick={onOpenStore}
                  className="w-full py-2 bg-gradient-to-r from-emerald-700 to-amber-600 hover:from-emerald-600 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg border border-amber-500/40 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-200" />
                  Classroom Store (1st BGU)
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedStudentForRaise(undefined);
                  setIsRaiseModalOpen(true);
                }}
                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg border border-teal-400/40 transition-all flex items-center justify-center gap-2 shadow-sm"
                title="Give a discretionary credit limit raise of your choice to students"
              >
                <TrendingUp className="w-4 h-4 text-teal-200" />
                Give Credit Limit Rise (+E$)
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsReportsModalOpen(true)}
                  className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold text-xs uppercase tracking-wider rounded-lg border border-blue-500/30 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  title="Download complete reports (CSV, JSON, Print Report Cards) for specific or all students"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  Reports
                </button>
                <button
                  onClick={() => setIsBackupModalOpen(true)}
                  className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs uppercase tracking-wider rounded-lg border border-purple-500/30 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  title="Save & Export Progress backup snapshot or restore state"
                >
                  <Database className="w-3.5 h-3.5 text-purple-400" />
                  Backup &amp; Save
                </button>
              </div>
              <button
                onClick={onOpenSettings}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Sliders className="w-4 h-4" />
                Configure Classroom Rates
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Section: Add Money for Doing Things in English (Max $100 Daily) */}
      {onAddDailyReward && (
        <EnglishDailyDollarsSection
          students={students}
          settings={settings}
          onAddDailyReward={onAddDailyReward}
        />
      )}

      {/* Section Header & Tabs Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-2xl font-light text-white tracking-tight uppercase">
            Student Ledger
          </h2>
          <p className="text-xs text-slate-400">
            Real-time balance, credit tiers, outstanding didactic loans, and delinquency enforcement.
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student name or card ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
          />
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex items-center gap-2 overflow-x-auto bg-slate-900 border border-slate-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 ${
            activeTab === 'roster'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Active Cardholders ({activeStudents.length})
        </button>

        <button
          onClick={() => setActiveTab('loans')}
          className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 ${
            activeTab === 'loans'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Classroom Loans ({loans.length})
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 ${
            activeTab === 'submissions'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          English Grading Queue
          {pendingSubmissions.length > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-700/50">
              {pendingSubmissions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('delisted')}
          className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 ${
            activeTab === 'delisted'
              ? 'bg-red-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Delisted &amp; Revoked ({delistedStudents.length})
        </button>
      </div>

      {/* ================= TAB 1: ACTIVE STUDENT ROSTER ================= */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Classrooms Group Filter Bar */}
          {classrooms && classrooms.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1 mr-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Classroom:
              </span>
              <button
                type="button"
                onClick={() => setSelectedClassFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                  selectedClassFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Classes ({activeStudents.length})
              </button>
              {classrooms.map((c) => {
                const count = activeStudents.filter((s) => s.classId === c.id || s.className === c.name).length;
                const isSelected = selectedClassFilter === c.id || selectedClassFilter === c.name;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedClassFilter(c.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow ring-1 ring-amber-400'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="px-1.5 py-0.2 text-[10px] rounded bg-black/40 text-amber-300 font-bold">
                      {count}
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setIsClassManagerOpen(true)}
                className="ml-auto px-2.5 py-1 rounded-lg text-xs font-bold uppercase text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-dashed border-amber-500/40 flex items-center gap-1 transition-colors"
                title="Create, rename, or manage classroom classes"
              >
                <Plus className="w-3 h-3" />
                Manage Classes
              </button>
            </div>
          )}

          {/* Sub-bar: Filter Pills & View Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-lg p-2.5">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mr-1">Filter:</span>
              <button
                onClick={() => setScoreFilter('all')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                  scoreFilter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Cardholders
              </button>
              <button
                onClick={() => setScoreFilter('overdue')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                  scoreFilter === 'overdue'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Overdue Only
              </button>
              <button
                onClick={() => setScoreFilter('high')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                  scoreFilter === 'high'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                High Credit (700+)
              </button>
            </div>

            {/* Roster Controls: Add Student, Bulk Add, Print Cards & View Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddStudentOpen(true)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1 transition-colors"
                title="Enroll single student"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Student</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBulkAddOpen(true)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1 transition-colors shadow-sm"
                title="Bulk enroll multiple students"
              >
                <Users className="w-3.5 h-3.5" />
                <span>+ Bulk</span>
              </button>

              <button
                type="button"
                onClick={onOpenPrintStudio}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1 transition-colors"
                title="Print physical cards studio"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Print Cards</span>
              </button>

              {/* View Mode Switcher */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    viewMode === 'cards'
                      ? 'bg-slate-800 text-emerald-400 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Geometric Cards Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    viewMode === 'table'
                      ? 'bg-slate-800 text-emerald-400 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Detailed Data Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* VIEW MODE A: GEOMETRIC CARDS GRID */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredStudents
                .filter((s) => {
                  if (scoreFilter === 'high') return s.creditScore >= 700;
                  if (scoreFilter === 'overdue') {
                    const loan = loans.find(
                      (l) => l.studentId === s.id && (l.status === 'active' || l.status === 'pending_review')
                    );
                    return loan ? getDaysDifference(loan.dueDate).isOverdue : false;
                  }
                  return true;
                })
                .map((student) => {
                  const activeLoan = loans.find(
                    (l) => l.studentId === student.id && (l.status === 'active' || l.status === 'pending_review')
                  );
                  const dueInfo = activeLoan ? getDaysDifference(activeLoan.dueDate) : null;
                  const isOverdue = dueInfo?.isOverdue;
                  const isExpanded = expandedLoansStudentId === student.id;

                  return (
                    <div
                      key={student.id}
                      className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden transition-all hover:border-slate-700 shadow-md ${
                        isExpanded ? 'col-span-full ring-2 ring-indigo-500/50 bg-slate-900/95' : ''
                      }`}
                    >
                      {/* Vertical edge accent bar matching Geometric Balance */}
                      <div
                        className={`absolute top-0 right-0 w-1.5 h-full ${
                          isOverdue
                            ? 'bg-red-500'
                            : student.creditScore >= 750
                            ? 'bg-blue-500'
                            : activeLoan
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />

                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-lg font-bold text-white leading-tight truncate">{student.name}</h3>
                            {student.className && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider">
                                {student.className}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 italic mt-0.5">
                            {student.delaysCount === 0
                              ? 'Credit History: Pristine'
                              : `Credit History: ${student.delaysCount} Delay(s)`}
                            {student.decoratedStatementsCount > 0 && ' • Decorated Deck'}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                            {student.studentIdNumber} • Card #{student.cardNumber.slice(-4)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest font-mono">Score</p>
                          <p
                            className={`text-2xl font-mono font-bold ${
                              student.creditScore >= 750
                                ? 'text-blue-400'
                                : student.creditScore >= 650
                                ? 'text-emerald-400'
                                : 'text-orange-400'
                            }`}
                          >
                            {student.creditScore}
                          </p>
                        </div>
                      </div>

                      {/* Dual Metric Boxes (Balance & Loan Limit) */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest font-mono">Balance</p>
                            <button
                              type="button"
                              onClick={() => setStorePurchaseStudent(student)}
                              className="text-[10px] text-amber-400 hover:text-amber-300 uppercase font-mono font-bold flex items-center gap-1 transition-colors px-1 py-0.5 rounded hover:bg-amber-400/10"
                              title="Manually reduce student balance for store purchase"
                            >
                              <ShoppingBag className="w-2.5 h-2.5" />
                              Store -$
                            </button>
                          </div>
                          <p className="font-mono text-white text-lg font-bold">E${student.currentBalance}.00</p>
                        </div>

                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest font-mono">Loan Limit</p>
                            <button
                              type="button"
                              onClick={() => {
                                setAdjustingLimitStudent(student);
                                setCustomLimitValue(student.maxLoanLimit);
                              }}
                              className="text-[10px] text-emerald-400 hover:underline uppercase font-mono font-bold px-1 py-0.5 rounded hover:bg-emerald-400/10"
                            >
                              Edit
                            </button>
                          </div>
                          <p className="font-mono text-white text-lg font-bold">E${student.maxLoanLimit}.00</p>
                        </div>
                      </div>

                      {/* Didactic Metrics & Plan */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 py-2 px-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                        <span>Plan: <strong className="text-white">{student.paymentFrequency === 'monthly' ? 'E$482/mo' : 'E$241/bi-wk'}</strong></span>
                        <span>On-time: <strong className="text-emerald-400">{student.punctualPaymentsCount}</strong></span>
                        <span>Decorated: <strong className="text-purple-300">{student.decoratedStatementsCount}</strong></span>
                      </div>

                      {/* Dedicated Debt & Loan Status Banner */}
                      <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                        activeLoan
                          ? isOverdue
                            ? 'bg-red-950/40 border-red-800/80 text-red-200'
                            : 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                          : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                      }`}>
                        <div className="min-w-0">
                          {activeLoan ? (
                            isOverdue ? (
                              <div>
                                <span className="text-xs font-bold font-mono text-red-400 flex items-center gap-1.5 animate-pulse">
                                  <AlertTriangle className="w-4 h-4 shrink-0" />
                                  OVERDUE: E${activeLoan.totalDue - activeLoan.amountRepaid}.00 Due
                                </span>
                                <p className="text-[11px] text-red-300/80 font-mono mt-0.5">
                                  Penalty: +{activeLoan.delaysCount * settings.delayPenaltyIncrement}% Int. • {activeLoan.durationDays}d term
                                </p>
                              </div>
                            ) : (
                              <div>
                                <span className="text-xs font-bold font-mono text-amber-300 flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 shrink-0" />
                                  Active Loan: E${activeLoan.totalDue - activeLoan.amountRepaid}.00 Due
                                </span>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  {activeLoan.durationDays}d term • Due {new Date(activeLoan.dueDate).toLocaleDateString()}
                                </p>
                              </div>
                            )
                          ) : (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <div>
                                <span className="text-xs font-bold font-mono text-emerald-300 block">No Active Debt</span>
                                <span className="text-[10px] text-slate-400 font-mono">Good standing • Max loan E${student.maxLoanLimit}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0">
                          {!activeLoan ? (
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForLoan(student)}
                              className="w-full sm:w-auto px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              New Loan
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setRecordingPresentationFor({ student, loan: activeLoan })}
                              className="w-full sm:w-auto px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                              title="Record statements presented in class"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              In-Class Work
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Uncompacted Action Toolbar (Clear, spacious, accessible) */}
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        {/* Row 1: Student Views & Tools */}
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => onSwitchToStudentView(student.id)}
                            className="px-2.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                            title="Open student portal view"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                            <span>Portal</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedLoansStudentId(
                                expandedLoansStudentId === student.id ? null : student.id
                              )
                            }
                            className={`px-2.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 border ${
                              expandedLoansStudentId === student.id
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                                : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                            }`}
                            title="Toggle pendant and paid loans ledger"
                          >
                            <Receipt className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Loans</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onPrintStudentCard
                                ? onPrintStudentCard(student.id)
                                : onOpenPrintStudio()
                            }
                            className="px-2.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                            title="Print this student's physical card"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Print</span>
                          </button>
                        </div>

                        {/* Row 2: Classroom Operations */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setManualAdjustStudent(student)}
                            className="px-2.5 py-1.5 bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-700/60 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                            title="Manually increase or reduce student money"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="truncate">± Adjust E$</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setStorePurchaseStudent(student)}
                            className="px-2 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 shadow-sm"
                            title="Manually reduce money for classroom store purchase"
                          >
                            <ShoppingBag className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">Store -$</span>
                          </button>

                          {onAddDailyReward && (
                            <button
                              type="button"
                              onClick={() => setQuickRewardStudent(student)}
                              className="px-2 py-1.5 bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-700/50 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 shadow-sm"
                              title="Manually award classroom English dollars"
                            >
                              <DollarSign className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="truncate">+$ Eng</span>
                            </button>
                          )}
                        </div>

                        {/* Row 3: Credit Rise & Yearly History */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentForRaise(student);
                              setIsRaiseModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-teal-950/70 hover:bg-teal-900/90 text-teal-300 border border-teal-600/60 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                            title="Give a discretionary credit limit raise of your choice to this student"
                          >
                            <TrendingUp className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                            <span className="truncate">Give Rise</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setHistoryModalStudent(student)}
                            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                            title="View student's full yearly history: rises, paid loans, rewards, and store purchases"
                          >
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">History</span>
                          </button>
                        </div>

                        {/* Row 4: Delist & Erase */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setDelistingStudent(student)}
                            className="px-2 py-1.5 bg-slate-950 hover:bg-red-950/40 border border-slate-800 hover:border-red-800/60 text-slate-400 hover:text-red-300 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                            title="Revoke credit card and delist student"
                          >
                            <ShieldAlert className="w-3 h-3 text-red-400 shrink-0" />
                            <span className="truncate">Decline Forever</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingStudent(student)}
                            className="px-2 py-1.5 bg-slate-950 hover:bg-red-950 border border-slate-800 hover:border-red-700 text-slate-500 hover:text-red-400 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                            title="Permanently erase student from roster"
                          >
                            <Trash2 className="w-3 h-3 text-red-500 shrink-0" />
                            <span className="truncate">Erase</span>
                          </button>
                        </div>
                      </div>

                      {/* Expandable Student Loans Ledger (Pendant & Paid Loans) */}
                      {isExpanded && (
                        <div className="pt-4 mt-1 border-t border-slate-800">
                          <StudentLoansLedger
                            student={student}
                            loans={loans}
                            settings={settings}
                            isTeacherView={true}
                            onOpenEnglishWork={(loan) =>
                              setRecordingPresentationFor({ student, loan })
                            }
                            onRequestNewLoan={() => setSelectedStudentForLoan(student)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* VIEW MODE B: DETAILED TABLE */}
          {viewMode === 'table' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Student &amp; Card ID</th>
                      <th className="py-3.5 px-4">Credit Score &amp; Tier</th>
                      <th className="py-3.5 px-4">Loan Limit (Cap)</th>
                      <th className="py-3.5 px-4">Payment Plan</th>
                      <th className="py-3.5 px-4">Active Loan Status</th>
                      <th className="py-3.5 px-4">Didactic Record</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 italic">
                          No active students matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => {
                        const tier = getCreditTier(student.creditScore);
                        const activeLoan = loans.find(
                          (l) => l.studentId === student.id && (l.status === 'active' || l.status === 'pending_review')
                        );
                        const dueInfo = activeLoan ? getDaysDifference(activeLoan.dueDate) : null;

                        return (
                          <React.Fragment key={student.id}>
                            <tr className="hover:bg-slate-800/40 transition-colors">
                            {/* Student Name */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs">
                                  {student.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-white text-sm">{student.name}</p>
                                    {student.className && (
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold uppercase">
                                        {student.className}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] font-mono text-slate-400">
                                    {student.studentIdNumber} • Card #{student.cardNumber.slice(-4)} • Bal: <span className="text-emerald-400 font-bold">E${student.currentBalance}</span>
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Credit Score */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-sm font-mono text-white">
                                    {student.creditScore}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">/ 850</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono border ${tier.badgeBg} ${tier.badgeColor}`}>
                                  {tier.name}
                                </span>
                              </div>
                            </td>

                            {/* Loan Limit */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold font-mono text-amber-300 text-sm">
                                  E${student.maxLoanLimit}
                                </span>
                                <button
                                  onClick={() => {
                                    setAdjustingLimitStudent(student);
                                    setCustomLimitValue(student.maxLoanLimit);
                                  }}
                                  className="text-[10px] text-emerald-400 hover:underline font-mono uppercase"
                                >
                                  Edit
                                </button>
                              </div>
                              <span className="text-[9px] text-slate-400">Starts E$50 up to E$1k</span>
                            </td>

                            {/* Payment Plan */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold font-mono text-slate-200">
                                  {student.paymentFrequency === 'monthly' ? 'E$482' : 'E$241'}
                                </span>
                                <button
                                  onClick={() =>
                                    onUpdatePaymentFrequency(
                                      student.id,
                                      student.paymentFrequency === 'monthly' ? 'bimonthly' : 'monthly'
                                    )
                                  }
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 font-mono"
                                  title="Toggle payment plan"
                                >
                                  {student.paymentFrequency === 'monthly' ? 'Monthly' : 'Bi-weekly'}
                                </button>
                              </div>
                            </td>

                            {/* Active Loan Status */}
                            <td className="py-3.5 px-4">
                              {activeLoan ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-amber-300 font-mono">
                                      E${activeLoan.totalDue - activeLoan.amountRepaid} Due
                                    </span>
                                    {dueInfo?.isOverdue && (
                                      <span className="px-1.5 py-0.5 bg-red-950 text-red-300 text-[9px] rounded font-bold uppercase border border-red-700 animate-pulse font-mono">
                                        Overdue!
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    Rate: {activeLoan.effectiveInterestRate}% ({activeLoan.durationDays}d term)
                                  </p>
                                </div>
                              ) : (
                                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                                  <CheckCircle2 className="w-3 h-3" />
                                  No active debt
                                </span>
                              )}
                            </td>

                            {/* Didactic Record */}
                            <td className="py-3.5 px-4">
                              <div className="text-[10px] text-slate-400 space-y-0.5 font-mono">
                                <span className="text-emerald-300 block">
                                  ✓ {student.punctualPaymentsCount} on-time
                                </span>
                                <span className="text-purple-300 block">
                                  ✨ {student.decoratedStatementsCount} decorated
                                </span>
                                {student.delaysCount > 0 && (
                                  <span className="text-rose-400 block">
                                    ⚠️ {student.delaysCount} late delay(s)
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {!activeLoan ? (
                                  <button
                                    onClick={() => setSelectedStudentForLoan(student)}
                                    className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold uppercase tracking-wider transition-colors font-mono"
                                  >
                                    Issue Loan
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setRecordingPresentationFor({ student, loan: activeLoan })}
                                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded text-xs font-bold uppercase tracking-wider transition-colors font-mono"
                                    title="Verify statements presented in class"
                                  >
                                    In-Class
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setManualAdjustStudent(student)}
                                  className="px-2 py-1 bg-blue-950/70 hover:bg-blue-900 text-blue-300 border border-blue-800/50 rounded text-xs font-bold uppercase tracking-wider transition-colors font-mono flex items-center gap-1 shadow-sm"
                                  title="Increase or reduce student money manually"
                                >
                                  <SlidersHorizontal className="w-3 h-3 text-blue-400" />
                                  ± Adjust
                                </button>

                                <button
                                  onClick={() => onSwitchToStudentView(student.id)}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                                  title="Simulate student view"
                                >
                                  Portal
                                </button>

                                <button
                                  onClick={() =>
                                    setExpandedLoansStudentId(
                                      expandedLoansStudentId === student.id ? null : student.id
                                    )
                                  }
                                  className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider transition-colors font-mono flex items-center gap-1 ${
                                    expandedLoansStudentId === student.id
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                                  }`}
                                  title="View loans ledger"
                                >
                                  <Receipt className="w-3 h-3 text-indigo-400" />
                                  Loans
                                </button>

                                <button
                                  onClick={() =>
                                    onPrintStudentCard
                                      ? onPrintStudentCard(student.id)
                                      : onOpenPrintStudio()
                                  }
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 border border-slate-700 rounded text-xs font-bold uppercase tracking-wider transition-colors font-mono flex items-center gap-1"
                                  title="Print student card"
                                >
                                  <Printer className="w-3 h-3 text-emerald-400" />
                                  Print
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedStudentForRaise(student);
                                    setIsRaiseModalOpen(true);
                                  }}
                                  className="px-2 py-1 bg-teal-950/70 hover:bg-teal-900 text-teal-300 border border-teal-700/50 rounded text-xs font-bold uppercase tracking-wider transition-colors font-mono flex items-center gap-1 shadow-sm"
                                  title="Give a discretionary credit limit raise of your choice to this student"
                                >
                                  <TrendingUp className="w-3 h-3 text-teal-400" />
                                  Rise
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setHistoryModalStudent(student)}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded text-xs font-bold uppercase tracking-wider transition-colors font-mono flex items-center gap-1"
                                  title="View student's full yearly history: rises, paid loans, rewards, and purchases"
                                >
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  History
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setStorePurchaseStudent(student)}
                                  className="px-2 py-1 bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800/50 rounded text-xs font-bold uppercase tracking-wider transition-colors font-mono flex items-center gap-1 shadow-sm"
                                  title="Reduce money for classroom store purchase"
                                >
                                  <ShoppingBag className="w-3 h-3 text-amber-400" />
                                  Store -$
                                </button>

                                {onAddDailyReward && (
                                  <button
                                    type="button"
                                    onClick={() => setQuickRewardStudent(student)}
                                    className="px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 rounded text-xs font-bold uppercase tracking-wider transition-colors font-mono flex items-center gap-1 shadow-sm"
                                    title="Manually add daily English dollars (up to $100 daily)"
                                  >
                                    <DollarSign className="w-3 h-3 text-emerald-400" />
                                    +$ English
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setDelistingStudent(student)}
                                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded hover:bg-slate-800"
                                  title="Revoke card & delist student"
                                >
                                  <ShieldAlert className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeletingStudent(student)}
                                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded hover:bg-slate-800"
                                  title="Permanently erase student from roster"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expandable Table Row for Student Loans Ledger */}
                          {expandedLoansStudentId === student.id && (
                            <tr className="bg-slate-950/90 border-b border-slate-800">
                              <td colSpan={7} className="p-4">
                                <StudentLoansLedger
                                  student={student}
                                  loans={loans}
                                  settings={settings}
                                  isTeacherView={true}
                                  onOpenEnglishWork={(loan) =>
                                    setRecordingPresentationFor({ student, loan })
                                  }
                                  onRequestNewLoan={() => setSelectedStudentForLoan(student)}
                                />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: LOANS TRACKER ================= */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loans.map((loan) => {
              const student = students.find((s) => s.id === loan.studentId);
              const dueInfo = getDaysDifference(loan.dueDate);
              const isPaid = loan.status === 'paid';
              const isDefaulted = loan.status === 'defaulted';

              return (
                <div
                  key={loan.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isDefaulted
                      ? 'bg-red-950/30 border-red-800/80'
                      : isPaid
                      ? 'bg-slate-900/50 border-emerald-900/60 opacity-80'
                      : dueInfo.isOverdue
                      ? 'bg-slate-900/90 border-rose-600 shadow-lg shadow-rose-950/20'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                    <div>
                      <p className="font-bold text-white text-sm">{student?.name || 'Unknown Student'}</p>
                      <p className="text-[10px] text-slate-400 font-mono-code">
                        Loan ID: {loan.id} • {loan.loanType.toUpperCase()} ({loan.durationDays}d)
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase ${
                        isPaid
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : isDefaulted
                          ? 'bg-red-500/20 text-red-300'
                          : dueInfo.isOverdue
                          ? 'bg-rose-500/20 text-rose-300 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {isDefaulted ? 'DEFAULTED' : isPaid ? 'PAID' : dueInfo.formatted}
                    </span>
                  </div>

                  {/* Financial Details */}
                  <div className="my-3 grid grid-cols-3 gap-2 text-center text-xs font-mono-code">
                    <div className="bg-slate-800/50 p-2 rounded">
                      <span className="text-[9px] text-slate-400 block">Principal</span>
                      <strong className="text-white">${loan.principal}</strong>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded">
                      <span className="text-[9px] text-slate-400 block">Interest</span>
                      <strong className="text-amber-400">{loan.effectiveInterestRate}%</strong>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded">
                      <span className="text-[9px] text-slate-400 block">Total Due</span>
                      <strong className="text-white">${loan.totalDue}</strong>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Repaid: ${loan.amountRepaid}</span>
                      <span className="text-emerald-400 font-bold font-mono-code">
                        Remaining: ${Math.max(0, loan.totalDue - loan.amountRepaid)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${Math.min(100, (loan.amountRepaid / loan.totalDue) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Delay Penalty & Didactic Actions */}
                  {!isPaid && !isDefaulted && (
                    <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onApplyDelayPenalty(loan.id)}
                          className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-700/60 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 font-mono"
                          title="Log a delay: increases interest rate by +2% and docks credit score"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          +2% Delay Penalty ({loan.delaysCount})
                        </button>

                        {student && (
                          <button
                            onClick={() => setRecordingPresentationFor({ student, loan })}
                            className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-[11px] font-mono transition-colors flex items-center gap-1 shadow-md shadow-emerald-500/10"
                            title="Verify statements presented in class"
                          >
                            <BookOpen className="w-3 h-3" />
                            Record In-Class
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          if (student) {
                            setDelistingStudent(student);
                            setDelistReasonInput(
                              `Loan ${loan.id} ($${loan.totalDue} due) expired without repayment.`
                            );
                          }
                        }}
                        className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[11px] font-bold transition-colors font-mono"
                        title="Permanent Card Delisting"
                      >
                        Default &amp; Delist
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 3: ENGLISH WORK GRADING QUEUE ================= */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {pendingSubmissions.length === 0 ? (
            <div className="bg-slate-900/60 p-12 rounded-2xl border border-slate-800 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">Queue Empty</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No in-class statements are currently awaiting teacher verification. Students present their notebook statements directly to you in class!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingSubmissions.map(({ sub, loan, student }) => (
                <div
                  key={sub.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4"
                >
                  <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="font-bold text-white text-base font-mono">{student.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">
                        Loan: {loan.id} • Balance Due: ${loan.totalDue - loan.amountRepaid}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono text-emerald-400 font-bold block">
                        Credit: +${sub.totalCreditValue}
                      </span>
                      {sub.hasDecoratedPresentation && (
                        <span className="text-[10px] text-purple-300 font-semibold flex items-center gap-1 font-mono">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          Decorated (+{sub.scoreBonusAwarded} pts)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submission Items Detailed View */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-purple-300 font-mono block">
                        Phrasal Verbs
                      </span>
                      <p className="text-sm font-bold font-mono text-white mt-1">
                        {sub.phrasalVerbsCount ?? sub.phrasalVerbs.length} in notebook
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Credit: ${sub.phrasalVerbsCredit}
                      </p>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono block">
                        English Sentences
                      </span>
                      <p className="text-sm font-bold font-mono text-white mt-1">
                        {sub.sentencesCount ?? sub.sentences.length} statements
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Credit: ${sub.sentencesCredit}
                      </p>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-amber-300 font-mono block">
                        Book Words
                      </span>
                      <p className="text-sm font-bold font-mono text-white mt-1">
                        {sub.wordsCount ?? sub.words.length} words
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Credit: ${sub.wordsCredit}
                      </p>
                    </div>
                  </div>

                  {sub.teacherFeedback && (
                    <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono">
                      <strong className="text-slate-400 uppercase text-[10px] block mb-0.5">Presentation Note:</strong>
                      {sub.teacherFeedback}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => onRejectEnglishSubmission(sub.id, loan.id)}
                      className="px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-950/60 rounded-lg transition-colors font-mono"
                    >
                      Request Revision
                    </button>
                    <button
                      onClick={() => onApproveEnglishSubmission(sub.id, loan.id)}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/20 font-mono"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verify Statements (+${sub.totalCreditValue})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: DELISTED & REVOKED CARDS ================= */}
      {activeTab === 'delisted' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-300 uppercase">
                Strict Classroom Didactic Rule: Card Declined Forever
              </h4>
              <p className="mt-1 leading-relaxed text-slate-300">
                &quot;Also, if the students don&apos;t pay the loan on time, their credit card will be declined forever and delisted from the list.&quot; Students below have their virtual credit cards blocked and removed from regular borrowing rosters.
              </p>
            </div>
          </div>

          {delistedStudents.length === 0 ? (
            <div className="bg-slate-900/60 p-12 rounded-2xl border border-slate-800 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">No Delisted Students</h3>
              <p className="text-xs text-slate-400">All students are currently in good standing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {delistedStudents.map((student) => (
                <div
                  key={student.id}
                  className="bg-slate-900 border border-red-900/80 rounded-xl p-5 shadow-xl space-y-4 relative overflow-hidden group"
                >
                  {/* Geometric Balance DECLINED Stamp Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rotate-12 z-10 pointer-events-none">
                    <span className="px-5 py-1.5 border-4 border-red-600 text-red-500 font-black text-2xl uppercase tracking-widest bg-black/70 shadow-2xl">
                      DECLINED
                    </span>
                  </div>

                  {/* Vertical red accent line on right edge */}
                  <div className="absolute top-0 right-0 w-1 bg-red-600 h-full" />

                  <div className="flex items-start justify-between relative z-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        <h4 className="font-bold text-white text-base">{student.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        ID: {student.studentIdNumber} • Card #{student.cardNumber.slice(0, 4)} •••• {student.cardNumber.slice(-4)}
                      </p>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-950 border border-red-700 text-red-300">
                      REVOKED FOREVER
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-red-950 text-xs text-slate-300 space-y-1 relative z-0">
                    <span className="text-[10px] uppercase font-bold text-red-400 font-mono block">
                      Default &amp; Delisting Reason
                    </span>
                    <p className="italic text-slate-300 font-mono text-[11px]">
                      {student.delistedReason || 'Loan deadline lapsed without English task settlement.'}
                    </p>
                    {student.delistedAt && (
                      <p className="text-[10px] text-slate-500 pt-1 font-mono">
                        Delisted Date: {new Date(student.delistedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 relative z-20">
                    <button
                      onClick={() => onSwitchToStudentView(student.id)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider transition-colors font-mono"
                    >
                      Inspect Card Visual
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDeletingStudent(student)}
                        className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1 font-mono"
                        title="Permanently erase this delisted student"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        Erase
                      </button>

                      <button
                        onClick={() => onReinstateStudent(student.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 font-mono"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Mercy Reinstatement
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: ENROLL NEW STUDENT ================= */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl text-slate-100 space-y-4">
            <h3 className="text-lg font-bold font-serif-card text-white">Enroll New Student Cardholder</h3>
            <p className="text-xs text-slate-400">
              Each student receives an initial didactic balance of E${settings.startingBalance}, credit limit of E${settings.startingLoanLimit}, and unique card number.
            </p>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Carlos Morales"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              {classrooms && classrooms.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Classroom / Section</label>
                  <select
                    value={newStudentClassId}
                    onChange={(e) => setNewStudentClassId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-400 font-mono"
                  >
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.section ? `(Sec ${c.section})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Card Theme Style</label>
                <select
                  value={newStudentTheme}
                  onChange={(e) => setNewStudentTheme(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-400"
                >
                  <option value="sapphire">Sapphire Blue (Prestige)</option>
                  <option value="gold">Gold Elite (Linguist)</option>
                  <option value="emerald">Emerald Green (Scholar)</option>
                  <option value="obsidian">Obsidian Black (Polyglot)</option>
                  <option value="ruby">Ruby Velvet (Classic)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Enroll &amp; Issue Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELIST CONFIRMATION ================= */}
      {delistingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-red-700 rounded-2xl p-6 w-full max-w-md shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-lg font-bold font-serif-card text-white">
                Decline Card Forever &amp; Delist Student?
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently revoke <strong className="text-white">{delistingStudent.name}</strong>&apos;s credit card? Per the classroom rules, their card will be stamped declined forever and blocked from taking loans.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Delisting Reason / Violation</label>
              <textarea
                rows={3}
                value={delistReasonInput}
                onChange={(e) => setDelistReasonInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDelistingStudent(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelist}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30"
              >
                Confirm Permanent Delisting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADJUST CREDIT LIMIT ================= */}
      {adjustingLimitStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl text-slate-100 space-y-4">
            <h3 className="text-lg font-bold font-serif-card text-white">
              Adjust Loan Limit for {adjustingLimitStudent.name}
            </h3>
            <p className="text-xs text-slate-400">
              Gradually increases based on credit score (starts at $50, maximum cap $1000). Teacher can override as needed.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Max Loan Limit ($)</label>
                <span className="text-lg font-bold font-mono-code text-amber-400">${customLimitValue}</span>
              </div>
              <input
                type="range"
                min="50"
                max={settings.maxLoanCap}
                step="25"
                value={customLimitValue}
                onChange={(e) => setCustomLimitValue(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono-code">
                <span>$50</span>
                <span>$250</span>
                <span>$500</span>
                <span>$1,000</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustingLimitStudent(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLimit}
                className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20"
              >
                Update Limit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ISSUE LOAN FOR STUDENT ================= */}
      {selectedStudentForLoan && (
        <LoanRequestModal
          isOpen={!!selectedStudentForLoan}
          onClose={() => setSelectedStudentForLoan(null)}
          student={selectedStudentForLoan}
          activeLoan={loans.find((l) => l.studentId === selectedStudentForLoan.id && l.status !== 'paid')}
          settings={settings}
          onSubmitLoan={(data) => {
            onIssueLoan(selectedStudentForLoan.id, data);
            setSelectedStudentForLoan(null);
          }}
        />
      )}

      {/* ================= MODAL: RECORD IN-CLASS PRESENTATION ================= */}
      {recordingPresentationFor && (
        <EnglishSubmissionModal
          isOpen={!!recordingPresentationFor}
          onClose={() => setRecordingPresentationFor(null)}
          student={recordingPresentationFor.student}
          loan={recordingPresentationFor.loan}
          settings={settings}
          isTeacherReviewer={true}
          onSubmitWork={(sub) => {
            if (onSubmitEnglishWork) {
              onSubmitEnglishWork(sub);
            } else {
              onApproveEnglishSubmission('direct', recordingPresentationFor.loan.id);
            }
            setRecordingPresentationFor(null);
          }}
        />
      )}

      {/* ================= MODAL: QUICK ADD DAILY ENGLISH DOLLARS ================= */}
      {quickRewardStudent && onAddDailyReward && (
        <QuickAddDailyDollarsModal
          isOpen={!!quickRewardStudent}
          onClose={() => setQuickRewardStudent(null)}
          student={quickRewardStudent}
          settings={settings}
          onAddDailyReward={onAddDailyReward}
        />
      )}

      {/* ================= MODAL: MANUAL STORE PURCHASE / BALANCE REDUCTION ================= */}
      {storePurchaseStudent && (
        <StorePurchaseModal
          isOpen={!!storePurchaseStudent}
          onClose={() => setStorePurchaseStudent(null)}
          student={storePurchaseStudent}
          storeCatalog={storeCatalog}
          onUpdateCatalog={onUpdateCatalog}
          onConfirmDeduction={(studentId, amount, note, storeDetails) => {
            if (onReduceBalance) {
              onReduceBalance(studentId, amount, note, storeDetails);
            }
            setStorePurchaseStudent(null);
          }}
        />
      )}

      {/* ================= MODAL: PERMANENTLY ERASE STUDENT ================= */}
      {deletingStudent && (
        <DeleteStudentModal
          isOpen={!!deletingStudent}
          onClose={() => setDeletingStudent(null)}
          student={deletingStudent}
          activeLoan={loans.find(
            (l) => l.studentId === deletingStudent.id && (l.status === 'active' || l.status === 'pending_review')
          )}
          onConfirmDelete={(studentId) => {
            if (onDeleteStudent) {
              onDeleteStudent(studentId);
            }
            setDeletingStudent(null);
          }}
        />
      )}

      {/* ================= MODAL: BULK ADD STUDENTS ================= */}
      {isBulkAddOpen && (
        <BulkAddStudentsModal
          isOpen={isBulkAddOpen}
          onClose={() => setIsBulkAddOpen(false)}
          classrooms={classrooms}
          onAddBulkStudents={(batch) => {
            if (onAddBulkStudents) {
              onAddBulkStudents(batch);
            } else {
              batch.forEach((st) => onAddStudent(st));
            }
            setIsBulkAddOpen(false);
          }}
          settings={settings}
          existingStudentCount={students.length}
        />
      )}

      {/* ================= MODAL: CLASSROOMS & GROUPS MANAGER ================= */}
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

      {/* ================= MODAL: MANUAL BALANCE ADJUSTMENT (INCREASE / REDUCE) ================= */}
      {manualAdjustStudent && (
        <ManualBalanceAdjustModal
          isOpen={!!manualAdjustStudent}
          onClose={() => setManualAdjustStudent(null)}
          student={manualAdjustStudent}
          students={students}
          onAdjustBalance={(studentId, type, amount, reason, category, creditScoreChange) => {
            if (onManualAdjustBalance) {
              onManualAdjustBalance(studentId, type, amount, reason, category, creditScoreChange);
            }
            setManualAdjustStudent(null);
          }}
        />
      )}

      {/* ================= MODAL: GRANT CREDIT LIMIT RAISE ================= */}
      <GrantCreditLimitRaiseModal
        isOpen={isRaiseModalOpen}
        onClose={() => {
          setIsRaiseModalOpen(false);
          setSelectedStudentForRaise(undefined);
        }}
        students={students}
        initialSelectedStudent={selectedStudentForRaise}
        onGrantRaise={(studentId, newLimit, reason, creditScoreBonus) => {
          if (onGrantCreditLimitRaise) {
            onGrantCreditLimitRaise(studentId, newLimit, reason, creditScoreBonus);
          } else {
            onUpdateCreditLimit(studentId, newLimit);
          }
        }}
      />

      {/* ================= MODAL: COMPREHENSIVE STUDENT REPORTS ================= */}
      <StudentReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        students={students}
        loans={loans}
        settings={settings}
      />

      {/* ================= MODAL: SAVE & EXPORT PROGRESS BACKUP ================= */}
      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        students={students}
        loans={loans}
        storeItems={storeCatalog || []}
        settings={settings}
        onRestoreBackup={onRestoreBackup || (() => {})}
        onSaveManualSnapshot={onSaveManualSnapshot || (() => {})}
      />

      {/* ================= MODAL: WHOLE-YEAR STUDENT HISTORY VIEWER ================= */}
      {historyModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-4xl shadow-2xl space-y-4 my-8 text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-base font-bold text-white uppercase tracking-tight">
                    Whole-Year Activity &amp; Credit Ledger
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Student: <span className="text-emerald-300 font-bold">{historyModalStudent.name}</span> • Card: {historyModalStudent.cardNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalStudent(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Close history viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1">
              <StudentYearlyHistory student={historyModalStudent} loans={loans} />
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryModalStudent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-colors"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {isBulkGiveMoneyOpen && onBulkAdjustBalance && (
        <BulkGiveMoneyModal
          students={students}
          classrooms={classrooms}
          onClose={() => setIsBulkGiveMoneyOpen(false)}
          onSubmit={(studentIds, amount, type, reason) => {
            onBulkAdjustBalance(studentIds, amount, type, reason);
            setIsBulkGiveMoneyOpen(false);
          }}
        />
      )}
    </div>
  );
};
