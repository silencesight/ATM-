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
  Printer,
  Eye,
  EyeOff,
  Radio,
  Wifi,
  Share2,
  Award,
  Wallet,
  TrendingUp,
  ShieldCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  School,
  Verified,
  Zap,
} from 'lucide-react';
import { Student, Loan, TeacherSettings } from '../types';
import { LoanRequestModal } from './LoanRequestModal';
import { EnglishSubmissionModal } from './EnglishSubmissionModal';
import { StudentLoansLedger } from './StudentLoansLedger';
import { StudentYearlyHistory } from './StudentYearlyHistory';
import {
  getCreditTier,
  formatCurrency,
  formatCardNumber,
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
  theme?: 'dark' | 'light';
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  student,
  students = [],
  onSelectStudent,
  activeLoan,
  loans = [],
  settings = DEFAULT_TEACHER_SETTINGS,
  onUpdatePaymentFrequency,
  onRequestLoan,
  onSubmitEnglishWork,
  onPrintCard,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isNumberRevealed, setIsNumberRevealed] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'statement' | 'agreements'>('overview');

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

  // Student Carousel Switcher
  const currentIndex = students.findIndex((s) => s.id === student.id);
  const handlePrevStudent = () => {
    if (!onSelectStudent || students.length <= 1) return;
    const prevIdx = (currentIndex - 1 + students.length) % students.length;
    onSelectStudent(students[prevIdx].id);
  };
  const handleNextStudent = () => {
    if (!onSelectStudent || students.length <= 1) return;
    const nextIdx = (currentIndex + 1) % students.length;
    onSelectStudent(students[nextIdx].id);
  };

  const getCardThemeGradient = (themeChoice?: Student['cardDesignTheme']) => {
    switch (themeChoice) {
      case 'emerald':
        return 'from-[#0c1815] via-[#09261f] to-[#041a22] border-emerald-500/30';
      case 'sapphire':
        return 'from-[#061826] via-[#0d2a45] to-[#044e68] border-cyan-500/30';
      case 'gold':
        return 'from-[#2e1d05] via-[#4d320b] to-[#7a5413] border-amber-500/30';
      case 'ruby':
        return 'from-[#26080e] via-[#47121c] to-[#6e1e2d] border-rose-500/30';
      case 'obsidian':
      default:
        return 'from-[#0b0e14] via-[#161b26] to-[#07090e] border-white/20';
    }
  };

  const maskedCardNumber = isNumberRevealed
    ? formatCardNumber(student.cardNumber)
    : `${student.cardNumber.slice(0, 4)} •••• •••• ${student.cardNumber.slice(-4)}`;

  return (
    <div className="w-full space-y-6 pb-12 font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* ======================================================== */}
      {/* 1. TOP SYSTEM SUBHEADER & SEGMENTED TABS (Tahoe Style) */}
      {/* ======================================================== */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl border transition-all ${
          isDark
            ? 'bg-[#11151f]/80 backdrop-blur-md border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.3)]'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#181d29] border border-white/[0.08] text-[#42e5b0] shadow-inner">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <span className="font-display font-semibold text-sm text-white">
              Student Treasury &amp; Virtual Reserve Pass
            </span>
            <span className="ml-2 font-mono text-[10px] px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-slate-400">
              v3.0 NATIVE SHELL
            </span>
          </div>
        </div>

        {/* macOS Segmented Pill Switcher */}
        <div className="flex items-center bg-[#07090e]/80 p-0.5 rounded-xl border border-white/[0.06] font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'overview'
                ? 'bg-[#1f2433] text-white border border-white/[0.1] shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview &amp; Card
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('statement')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'statement'
                ? 'bg-[#1f2433] text-white border border-white/[0.1] shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Statement Archive
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('agreements')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'agreements'
                ? 'bg-[#1f2433] text-white border border-white/[0.1] shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Loan Agreements
          </button>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-[#42e5b0] shadow-[0_0_6px_rgba(66,229,176,0.6)] animate-pulse" />
          <span>VBCA-EC-QUITO-01 &bull; Verified</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. ACTIVE LEARNER STATUS BAR BANNER */}
      {/* ======================================================== */}
      <div
        className={`p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
          isDark
            ? 'bg-[#11151f]/90 backdrop-blur-xl border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-4 min-w-0">
          {/* Student Carousel Navigation */}
          {students.length > 1 && onSelectStudent && (
            <div className="flex items-center bg-[#0b0e14]/80 border border-white/[0.08] p-1 rounded-xl shadow-inner shrink-0">
              <button
                type="button"
                onClick={handlePrevStudent}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                title="Previous Student"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-xs text-white font-bold select-none">
                {currentIndex + 1} / {students.length}
              </span>
              <button
                type="button"
                onClick={handleNextStudent}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                title="Next Student"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Avatar & Student Name */}
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#009b74] via-[#00c896] to-[#42e5b0] text-[#003828] font-bold text-sm flex items-center justify-center shadow-md">
              {student.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#42e5b0] border border-[#0b0e14] flex items-center justify-center text-[#003828]">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-bold text-base text-white truncate">{student.name}</h1>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#42e5b0]/15 text-[#42e5b0] border border-[#42e5b0]/30 font-bold uppercase">
                {isDelisted ? 'Delisted' : 'Enrolled'}
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                #{student.studentIdNumber || student.cardNumber.slice(-4)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 font-mono text-xs text-slate-400">
              <span className="text-[#42e5b0] font-semibold flex items-center gap-1">
                <Award className="w-3 h-3 text-[#42e5b0]" />
                {tier.name}
              </span>
              <span>&bull;</span>
              <span>{student.className || '2nd BGU'}</span>
              <span>&bull;</span>
              <span className="text-slate-300">Attendance 100%</span>
            </div>
          </div>
        </div>

        {/* Credit Standing Pill Group */}
        <div className="flex items-center gap-3">
          <div className="bg-[#181d29] border border-[#42e5b0]/25 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm font-mono">
            <div className="flex flex-col text-right">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                FICO-ESL Score
              </span>
              <span className="text-base font-bold text-[#42e5b0]">
                {student.creditScore}
                <span className="text-xs font-normal text-slate-400">/850</span>
              </span>
            </div>
            <div className="h-8 w-px bg-white/[0.1]" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-xs text-white font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#42e5b0] shadow-[0_0_6px_rgba(66,229,176,0.8)]" />
                <span>Good Standing</span>
              </div>
              <span className="text-[10px] text-[#42e5b0]/80">Low Risk Tier</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert if Delisted */}
      {isDelisted && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-600 shadow-2xl flex items-start gap-3.5">
          <ShieldAlert className="w-6 h-6 text-rose-300 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-rose-100 uppercase tracking-widest font-mono">
              Credit Card Declined &amp; Delisted
            </h2>
            <p className="text-xs text-rose-200">
              Your classroom debit card was suspended because a previous loan payment deadline was missed. Please contact your instructor.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MAIN TWO-COLUMN STITCH LAYOUT */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN (6 cols) ================= */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Apple Wallet-Style Reserve Card */}
            <div
              className={`relative overflow-hidden rounded-2xl border shadow-[0_12px_36px_rgba(0,0,0,0.6)] p-5 text-white select-none transition-all duration-300 hover:shadow-[0_16px_44px_rgba(66,229,176,0.15)] bg-gradient-to-br ${getCardThemeGradient(
                student.cardDesignTheme
              )}`}
            >
              {/* Specular Ambient Glow Overlays */}
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-[#42e5b0]/20 blur-3xl pointer-events-none" />

              {/* Card Header */}
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-300">
                    {settings.schoolName || 'Victoria Bilingual Christian Academy'}
                  </span>
                  <div className="font-display text-sm tracking-tight text-white font-bold">
                    ESL Reserve Pass
                  </div>
                </div>

                {/* Contactless Wave & Virtual Pill */}
                <div className="flex items-center gap-1.5 text-cyan-300">
                  <Wifi className="w-4 h-4 rotate-90 drop-shadow-[0_0_8px_rgba(76,214,251,0.6)]" />
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                    VIRTUAL
                  </span>
                </div>
              </div>

              {/* Microchip & Hologram Foil */}
              <div className="relative z-10 my-4 flex items-center justify-between">
                {/* Shimmer Gold Microchip SVG */}
                <div className="w-11 h-8 rounded-md bg-gradient-to-br from-[#f6d365] via-[#f7c254] to-[#d48806] p-1 shadow-[0_2px_10px_rgba(246,211,101,0.3)] flex flex-col justify-between border border-[#e5a022]">
                  <div className="flex justify-between items-center h-2">
                    <span className="w-3 h-px bg-[#7c3d00]" />
                    <span className="w-2 h-2 rounded-full border border-[#7c3d00]" />
                    <span className="w-3 h-px bg-[#7c3d00]" />
                  </div>
                  <div className="flex justify-between items-center h-2">
                    <span className="w-full h-px bg-[#7c3d00]" />
                  </div>
                </div>

                {/* Reserve Foil Crest Watermark */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 border border-white/[0.1] backdrop-blur-md text-[#42e5b0] shadow-inner font-mono text-[10px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>RESERVE SECURE</span>
                </div>
              </div>

              {/* Card Account Number with show/hide */}
              <div className="relative z-10 flex items-center justify-between font-mono tracking-widest text-base text-white font-semibold">
                <span>{maskedCardNumber}</span>
                <button
                  type="button"
                  onClick={() => setIsNumberRevealed(!isNumberRevealed)}
                  className="text-slate-400 hover:text-white p-1 transition-colors"
                  title={isNumberRevealed ? 'Hide full number' : 'Reveal full number'}
                >
                  {isNumberRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Card Metadata Footer */}
              <div className="relative z-10 mt-3 pt-2.5 border-t border-white/[0.1] flex items-end justify-between font-mono text-xs">
                <div>
                  <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-bold">
                    Cardholder
                  </span>
                  <span className="font-semibold text-white tracking-wider">
                    {student.name.toUpperCase()}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-bold">
                    Expires
                  </span>
                  <span className="text-white">{student.expiryDate || '12/29'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-bold">
                    Class Loan Limit
                  </span>
                  <span className="font-display font-bold text-[#42e5b0] text-sm">
                    E$ {student.maxLoanLimit}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Direct Controls Bar */}
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setIsNumberRevealed(!isNumberRevealed)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border transition-all ${
                  isDark
                    ? 'bg-[#181d29] hover:bg-[#1f2433] text-white border-white/[0.08]'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-[#42e5b0]" />
                <span>{isNumberRevealed ? 'Mask Pass' : 'Reveal Details'}</span>
              </button>

              <button
                type="button"
                onClick={() => onPrintCard && onPrintCard(student.id)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border transition-all ${
                  isDark
                    ? 'bg-[#181d29] hover:bg-[#1f2433] text-white border-white/[0.08]'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <Printer className="w-3.5 h-3.5 text-[#42e5b0]" />
                <span>Print Pass</span>
              </button>

              <div
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border ${
                  isDark
                    ? 'bg-[#181d29] text-cyan-300 border-white/[0.08]'
                    : 'bg-white text-cyan-700 border-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400 rotate-90" />
                <span>NFC Tap Ready</span>
              </div>
            </div>

            {/* Primary Prominent Loan Request Action */}
            <div className="bg-gradient-to-r from-[#003828] via-[#004d38] to-[#002f3a] p-4 rounded-2xl border border-[#42e5b0]/30 shadow-[0_8px_24px_rgba(0,56,40,0.5)] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#42e5b0]/15 border border-[#42e5b0]/30 flex items-center justify-center shrink-0 text-[#42e5b0]">
                  <DollarSign className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <div className="font-display font-bold text-sm text-white">
                    Immediate Liquidity Advance
                  </div>
                  <div className="font-mono text-[11px] text-slate-300">
                    Disbursed instantly into your active balance upon authorization
                  </div>
                </div>
              </div>

              {!isDelisted && !activeLoan && (
                <button
                  type="button"
                  onClick={() => setIsLoanModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#42e5b0] text-[#003828] hover:bg-[#60fcc6] font-display font-bold text-xs uppercase tracking-wider shadow-[0_0_16px_rgba(66,229,176,0.35)] flex items-center justify-center gap-1.5 transition-all shrink-0"
                >
                  <PlusCircle className="w-4 h-4 stroke-[3]" />
                  <span>+ Request Loan</span>
                </button>
              )}

              {activeLoan && activeLoan.status !== 'paid' && (
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#42e5b0] text-[#003828] hover:bg-[#60fcc6] font-display font-bold text-xs uppercase tracking-wider shadow-[0_0_16px_rgba(66,229,176,0.35)] flex items-center justify-center gap-1.5 transition-all shrink-0"
                >
                  <BookOpen className="w-4 h-4 stroke-[3]" />
                  <span>Pay With English Work</span>
                </button>
              )}
            </div>

            {/* Quick Financial Metrics Tiles */}
            <div className="grid grid-cols-3 gap-3 font-mono">
              <div
                className={`p-3.5 rounded-2xl border shadow-sm flex flex-col justify-between ${
                  isDark ? 'bg-[#11151f] border-white/[0.08]' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <span>Wallet</span>
                  <Wallet className="w-3.5 h-3.5 text-[#42e5b0]" />
                </div>
                <div className="mt-2">
                  <div className="font-display font-bold text-lg text-white">
                    E$ {student.currentBalance}
                  </div>
                  <div className="flex items-center gap-1 text-[#42e5b0] text-[10px] font-semibold mt-0.5">
                    <TrendingUp className="w-3 h-3" />
                    <span>+E${earnedToday} today</span>
                  </div>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-2xl border shadow-sm flex flex-col justify-between ${
                  isDark ? 'bg-[#11151f] border-white/[0.08]' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <span>Loan Cap</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="mt-2">
                  <div className="font-display font-bold text-lg text-white">
                    E$ {student.maxLoanLimit}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#42e5b0]" />
                    <span>Debt: E${loanRemaining}</span>
                  </div>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-2xl border shadow-sm flex flex-col justify-between ${
                  isDark ? 'bg-[#11151f] border-white/[0.08]' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <span>Installment</span>
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="mt-2">
                  <div className="font-display font-bold text-lg text-white">
                    E$ {student.paymentFrequency === 'monthly' ? settings.monthlyPayment : settings.bimonthlyPayment}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {student.paymentFrequency === 'monthly' ? 'Monthly cycle' : 'Bimonthly cycle'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN (6 cols) ================= */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Status Banner: Active Loan vs Zero Pending Liability */}
            {activeLoan && activeLoan.status !== 'paid' ? (
              <div
                className={`p-4 rounded-2xl border space-y-3.5 ${
                  isDark ? 'bg-[#11151f] border-amber-500/30' : 'bg-white border-amber-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-sm text-white">
                        Active Classroom Loan ({activeLoan.loanType.toUpperCase()})
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        Total Due: E${activeLoan.totalDue}.00 &bull; {dueInfo?.formatted || 'Due soon'}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    REMAINING: E${loanRemaining}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Repaid: E${activeLoan.amountRepaid}.00</span>
                    <span className="text-[#42e5b0] font-bold">
                      {Math.round((activeLoan.amountRepaid / activeLoan.totalDue) * 100)}% Settled
                    </span>
                  </div>
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/[0.08]">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (activeLoan.amountRepaid / activeLoan.totalDue) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* English task calculator */}
                {taskSuggestions && (
                  <div className="p-3 bg-black/30 rounded-xl border border-white/[0.06] space-y-2 font-mono text-xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                      <span>Repay by Doing English Tasks:</span>
                      <span className="text-[#42e5b0]">Excess credits go to your wallet!</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                        <span className="text-purple-300 font-bold block">
                          {taskSuggestions.purePhrasalVerbs} Verbs
                        </span>
                        <span className="text-[10px] text-slate-400">E$50 each</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                        <span className="text-[#42e5b0] font-bold block">
                          {taskSuggestions.pureSentences} Sentences
                        </span>
                        <span className="text-[10px] text-slate-400">E$25 each</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                        <span className="text-amber-300 font-bold block">
                          {taskSuggestions.pureWords} Words
                        </span>
                        <span className="text-[10px] text-slate-400">E$5 each</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`p-4 rounded-2xl border shadow-sm flex items-start gap-3.5 ${
                  isDark ? 'bg-[#11151f] border-white/[0.08]' : 'bg-white border-slate-200'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#42e5b0]/10 border border-[#42e5b0]/20 flex items-center justify-center text-[#42e5b0] shrink-0">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-white">
                      Zero Pending Liability
                    </span>
                    <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-[#42e5b0]/10 text-[#42e5b0] border border-[#42e5b0]/25 font-bold">
                      AUDITED
                    </span>
                  </div>
                  <p className="mt-1 font-sans text-xs text-slate-400 leading-relaxed">
                    You currently have no pending classroom loan. Your credit standing is in prime order, qualifying for credit score raises during weekly teacher audits.
                  </p>
                  <div className="mt-2.5 flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                    <span className="flex items-center gap-1 text-[#42e5b0]">
                      <Calendar className="w-3 h-3" />
                      Assembly Audit: Every Friday
                    </span>
                    <span>&bull;</span>
                    <span>Prime Credit Record</span>
                  </div>
                </div>
              </div>
            )}

            {/* Academy Reserve Ladder: Credit Tier & Ceiling Progression */}
            <div
              className={`p-4 rounded-2xl border shadow-sm flex flex-col gap-3 ${
                isDark ? 'bg-[#11151f] border-white/[0.08]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Academy Reserve Ladder
                  </div>
                  <div className="font-display font-bold text-sm text-white">
                    Credit Tier &amp; Ceiling Progression
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-400">Target Ceiling</span>
                  <div className="font-bold text-[#42e5b0] text-sm">E$ 1,000</div>
                </div>
              </div>

              {/* Progress Bar & Visual Gauge */}
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Current Score: {student.creditScore} pts</span>
                  <span className="text-[#42e5b0] font-semibold">Tier: {tier.name}</span>
                </div>
                <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/[0.08]">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 via-[#42e5b0] to-emerald-400 transition-all duration-500"
                    style={{
                      width: `${Math.max(
                        10,
                        Math.min(100, ((student.creditScore - 300) / 550) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Rules Grid */}
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.06] space-y-1">
                  <div className="text-[#42e5b0] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Punctual</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">+15 score boost</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.06] space-y-1">
                  <div className="text-purple-300 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Decorated</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">+35 presentation</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.06] space-y-1">
                  <div className="text-rose-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Late Risk</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">+2% delay fee</span>
                </div>
              </div>
            </div>

            {/* Daily English Rewards Log */}
            <div
              className={`p-4 rounded-2xl border shadow-sm space-y-3 ${
                isDark ? 'bg-[#11151f] border-white/[0.08]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#ffc149]" />
                  <span className="font-display font-bold text-sm text-white">
                    Classroom English Dollars (E$)
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-[#42e5b0]">
                  Today: E${earnedToday}.00
                </span>
              </div>

              {student.englishRewardsHistory && student.englishRewardsHistory.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {student.englishRewardsHistory.slice(0, 4).map((rew) => (
                    <div
                      key={rew.id}
                      className="p-2 rounded-xl bg-black/30 border border-white/[0.05] flex items-center justify-between font-mono text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{rew.reason}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(rew.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="font-bold text-[#42e5b0]">+E${rew.amount}.00</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 font-mono text-xs text-slate-400 italic">
                  Participate in English during class to earn Eurodollars credited by your teacher!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STATEMENT ARCHIVE */}
      {activeTab === 'statement' && (
        <div className="mt-4">
          <StudentYearlyHistory student={student} loans={loans} />
        </div>
      )}

      {/* TAB 3: LOAN AGREEMENTS */}
      {activeTab === 'agreements' && (
        <div className="mt-4">
          <StudentLoansLedger
            student={student}
            loans={loans}
            settings={settings}
            onOpenEnglishWork={() => setIsSubmitModalOpen(true)}
            onRequestNewLoan={() => setIsLoanModalOpen(true)}
          />
        </div>
      )}

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
