import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  History,
  MessageSquare,
  BookOpen,
  Award,
  PenTool,
  Users,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  ArrowRight,
  Wifi,
} from 'lucide-react';
import { Student, TeacherSettings } from '../types';
import {
  getTodayDateString,
  getCreditTier,
  formatCardNumber,
} from '../utils/creditCalculator';
import { StudentSelectorNav } from './StudentSelectorNav';

interface EnglishDailyDollarsSectionProps {
  students: Student[];
  settings: TeacherSettings;
  onAddDailyReward: (
    studentId: string,
    amount: number,
    reason: string,
    creditScoreDelta?: number
  ) => { success: boolean; error?: string };
  onManualAdjustBalance?: (
    studentId: string,
    type: 'increase' | 'decrease',
    amount: number,
    reason: string,
    category: 'reward' | 'correction' | 'fine' | 'contest' | 'activity' | 'other',
    creditScoreChange?: number
  ) => void;
  selectedStudentId?: string;
  onSelectStudent?: (id: string) => void;
}

const FAST_DENOMINATIONS = [10, 25, 50, 100, 250, 500];

const QUALIFYING_ACTIVITIES = [
  {
    id: 'oral',
    label: '🗣️ Spoke in English',
    title: 'Spontaneous Oral Fluency',
    desc: 'Active English conversation, debate, or classroom response',
    icon: MessageSquare,
    defaultAmount: 25,
    badge: 'ORAL MERIT',
  },
  {
    id: 'reading',
    label: '📖 Reading Book & Vocab',
    title: 'Lexical Literature Analysis',
    desc: 'Identified new vocabulary words or read aloud from reader',
    icon: BookOpen,
    defaultAmount: 25,
    badge: 'LEXICAL',
  },
  {
    id: 'writing',
    label: '✍️ Notebook Statements',
    title: 'Syntactic Composition',
    desc: 'Wrote complete English sentences, idioms, or phrasal verbs',
    icon: PenTool,
    defaultAmount: 50,
    badge: 'SYNTAX',
  },
  {
    id: 'game',
    label: '🏆 Class Game / Activity',
    title: 'Didactic Challenge & Peer Aid',
    desc: 'English competition winner or assisted a classmate in English',
    icon: Award,
    defaultAmount: 50,
    badge: 'CHALLENGE',
  },
];

const SCORE_DELTAS = [
  { value: -10, label: '-10 PTS', desc: 'Compliance Penalty' },
  { value: 0, label: '0 PTS', desc: 'Neutral Liquidity' },
  { value: 5, label: '+5 PTS', desc: 'Standard Merit' },
  { value: 15, label: '+15 PTS', desc: 'Honors Distinction' },
];

export const EnglishDailyDollarsSection: React.FC<EnglishDailyDollarsSectionProps> = ({
  students,
  settings,
  onAddDailyReward,
  onManualAdjustBalance,
  selectedStudentId,
  onSelectStudent,
}) => {
  const activeStudents = students.filter((s) => s.cardStatus === 'active');
  const [currentId, setCurrentId] = useState<string>(
    selectedStudentId || activeStudents[0]?.id || students[0]?.id || ''
  );
  const [mode, setMode] = useState<'award' | 'debit'>('award');
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [useCustomAmount, setUseCustomAmount] = useState<boolean>(false);
  const [reason, setReason] = useState<string>('🗣️ Spoke in English');
  const [customReason, setCustomReason] = useState<string>('');
  const [scoreDelta, setScoreDelta] = useState<number>(5);
  const [justSubmitted, setJustSubmitted] = useState<string | null>(null);

  React.useEffect(() => {
    if (selectedStudentId) {
      setCurrentId(selectedStudentId);
    }
  }, [selectedStudentId]);

  const selectedStudent = students.find((s) => s.id === currentId) || students[0];
  const todayStr = getTodayDateString();

  const earnedToday =
    selectedStudent?.dailyEnglishEarned &&
    selectedStudent.dailyEnglishEarned.date === todayStr
      ? selectedStudent.dailyEnglishEarned.amount
      : 0;

  const effectiveAmount = useCustomAmount
    ? Math.max(0, parseInt(customAmount, 10) || 0)
    : selectedAmount;

  const signedDelta = mode === 'award' ? effectiveAmount : -effectiveAmount;
  const effectiveReason = customReason.trim() ? customReason.trim() : reason;

  const canSubmit =
    Boolean(selectedStudent) &&
    effectiveAmount > 0 &&
    selectedStudent.cardStatus === 'active';

  const projectedBalance = selectedStudent
    ? Math.max(0, selectedStudent.currentBalance + signedDelta)
    : 0;

  const projectedScore = selectedStudent
    ? Math.max(300, Math.min(850, selectedStudent.creditScore + scoreDelta))
    : 600;

  const tier = selectedStudent ? getCreditTier(selectedStudent.creditScore) : null;

  const handleApplyPreset = (amt: number) => {
    setUseCustomAmount(false);
    setSelectedAmount(amt);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedStudent) return;

    if (mode === 'award') {
      onAddDailyReward(selectedStudent.id, effectiveAmount, effectiveReason, scoreDelta);
    } else if (onManualAdjustBalance) {
      onManualAdjustBalance(
        selectedStudent.id,
        'decrease',
        effectiveAmount,
        effectiveReason,
        'fine',
        scoreDelta
      );
    } else {
      onAddDailyReward(selectedStudent.id, effectiveAmount, effectiveReason, scoreDelta);
    }

    setJustSubmitted(
      `${mode === 'award' ? '+' : '-'}E$ ${effectiveAmount} recorded for ${selectedStudent.name}`
    );
    setTimeout(() => setJustSubmitted(null), 3500);
    setCustomAmount('');
    setUseCustomAmount(false);
    setCustomReason('');
  };

  // Collect all rewards and manual adjustments awarded today across all students
  const todayAllRewards = students
    .flatMap((s) =>
      (s.englishRewardsHistory || []).map((r) => ({
        ...r,
        studentName: s.name,
        studentClass: s.className,
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const todayTotalAwarded = todayAllRewards
    .filter((r) => r.createdAt && r.createdAt.slice(0, 10) === todayStr)
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Student Switcher Ribbon */}
      <StudentSelectorNav
        students={students}
        selectedStudentId={currentId}
        onSelectStudent={(id) => {
          setCurrentId(id);
          if (onSelectStudent) onSelectStudent(id);
        }}
        label="Discretionary Recipient"
        variant="section"
        showBalance={true}
        showCreditScore={true}
        showClassFilter={true}
        showShuffle={true}
      />

      {/* Main 12-Column Liquid Glass Split Architecture */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 8 COLUMNS: Operations Refractive Membrane + Live Feed */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-6 specular-edge relative overflow-hidden">
            {/* Ambient Top Glow */}
            <div
              className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-25 ${
                mode === 'award' ? 'bg-tertiary-container' : 'bg-error'
              }`}
            />

            {/* Header Row: Mode Switcher + Specular Delta Display */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-outline-variant/20">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-tertiary-container/15 border border-tertiary-container/30 text-tertiary-fixed-dim text-[10px] font-mono font-bold uppercase tracking-widest">
                    Faculty Treasury • Unlimited E$
                  </span>
                  <span className="text-[11px] font-mono text-on-surface-variant">
                    Earned Today: <strong className="text-on-surface">E$ {earnedToday}.00</strong>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-headline font-bold text-on-surface tracking-tight">
                  Discretionary Eurodollar Engine
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Instantly mint classroom liquidity for spoken English, reading comprehension, or notebook excellence.
                </p>
              </div>

              {/* Segmented Award vs Debit Toggle */}
              <div className="glass-well p-1.5 rounded-2xl flex items-center gap-1 self-start">
                <button
                  type="button"
                  onClick={() => {
                    setMode('award');
                    if (scoreDelta < 0) setScoreDelta(5);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-headline font-bold transition-all flex items-center gap-1.5 ${
                    mode === 'award'
                      ? 'liquid-button-emerald shadow-md'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Award +E$</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('debit');
                    if (scoreDelta > 0) setScoreDelta(-10);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-headline font-bold transition-all flex items-center gap-1.5 ${
                    mode === 'debit'
                      ? 'bg-error-container text-on-error-container border border-error/40 shadow-md'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Debit -E$</span>
                </button>
              </div>
            </div>

            {/* Massive Specular Delta Display Module */}
            <div className="glass-well rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-outline-variant/25">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant font-bold block">
                  Active Transaction Magnitude
                </span>
                <div
                  className={`text-3xl sm:text-4xl font-mono font-extrabold tracking-tight mt-1 ${
                    mode === 'award' ? 'text-tertiary-fixed-dim' : 'text-error'
                  }`}
                >
                  {mode === 'award' ? '+' : '-'}E$ {effectiveAmount.toLocaleString('en-US')}.00
                </div>
              </div>

              {selectedStudent && (
                <div className="flex items-center gap-3 glass-pill px-4 py-3 rounded-xl">
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block">
                      Current Reserve
                    </span>
                    <span className="text-sm font-mono font-bold text-on-surface">
                      E$ {selectedStudent.currentBalance}.00
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary-container shrink-0" />
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-primary-container font-bold block">
                      Projected Net
                    </span>
                    <span className="text-sm font-mono font-extrabold text-tertiary-fixed-dim">
                      E$ {projectedBalance}.00
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 1: Fast Denominations Grid (6 Presets + Custom Input) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant font-bold">
                  1. Fast Liquidity Denominations (Eurodollars)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomAmount(!useCustomAmount);
                    if (!useCustomAmount) {
                      setCustomAmount(selectedAmount.toString());
                    }
                  }}
                  className="text-[11px] font-mono text-primary-container hover:underline font-bold"
                >
                  {useCustomAmount ? 'Use Preset Grid' : 'Enter Custom Amount...'}
                </button>
              </div>

              {!useCustomAmount ? (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {FAST_DENOMINATIONS.map((amt) => {
                    const isSelected = selectedAmount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleApplyPreset(amt)}
                        className={`py-3 px-2 rounded-2xl font-mono font-bold text-sm transition-all flex flex-col items-center justify-center gap-0.5 ${
                          isSelected
                            ? mode === 'award'
                              ? 'liquid-button-emerald scale-[1.02]'
                              : 'bg-error-container text-on-error-container border border-error/50 shadow-lg'
                            : 'glass-card-interactive text-on-surface hover:border-primary-container/50'
                        }`}
                      >
                        <span className="text-[10px] opacity-75 uppercase">
                          {mode === 'award' ? 'Grant' : 'Debit'}
                        </span>
                        <span>
                          {mode === 'award' ? '+' : '-'}E${amt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="relative max-w-xs">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-container font-mono font-bold text-sm">
                    E$
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter custom Eurodollar amount"
                    className="w-full pl-11 pr-4 py-3 glass-well rounded-2xl text-on-surface font-mono font-bold text-sm focus:outline-none focus:border-primary-container"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Step 2: 2x2 Qualifying Activity Selector Glass Tiles */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant font-bold block">
                2. Qualifying Pedagogical Activity
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QUALIFYING_ACTIVITIES.map((act) => {
                  const Icon = act.icon;
                  const isSelected = reason === act.label && !customReason;
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => {
                        setReason(act.label);
                        setCustomReason('');
                      }}
                      className={`p-4 rounded-2xl text-left transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'bg-primary-container/15 border-2 border-primary-container specular-edge shadow-lg'
                          : 'glass-card-interactive'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                            : 'glass-well text-primary-container'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-headline font-bold text-xs sm:text-sm text-on-surface truncate">
                            {act.title}
                          </span>
                          <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded glass-well text-primary-container font-bold shrink-0">
                            {act.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2">
                          {act.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Additional quick peer helper chip & Custom Pedagogical Auditor Note */}
              <div className="pt-2 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReason('🤝 Class Peer Helper');
                      setCustomReason('');
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 ${
                      reason === '🤝 Class Peer Helper' && !customReason
                        ? 'bg-primary-container text-on-primary-fixed font-bold'
                        : 'glass-pill text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>🤝 Class Peer Helper</span>
                  </button>
                  <span className="text-[11px] text-on-surface-variant font-mono">
                    Or enter custom auditor note below:
                  </span>
                </div>

                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Pedagogical Auditor Note (e.g., Completed Chapter 4 oral summary, Debate MVP)..."
                  className="w-full px-4 py-2.5 text-xs sm:text-sm glass-well rounded-xl text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container"
                />
              </div>
            </div>

            {/* Step 3: Credit Score Impact Selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant font-bold">
                  3. Credit Score Merit Delta (FICO Trajectory)
                </label>
                <span className="text-[11px] font-mono text-primary-container font-bold">
                  Projected Score: {projectedScore} / 850
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SCORE_DELTAS.map((sd) => {
                  const isSelected = scoreDelta === sd.value;
                  return (
                    <button
                      key={sd.value}
                      type="button"
                      onClick={() => setScoreDelta(sd.value)}
                      className={`p-2.5 rounded-xl text-center transition-all font-mono ${
                        isSelected
                          ? sd.value < 0
                            ? 'bg-error-container/60 text-error border border-error/50 font-bold'
                            : 'bg-primary-container/20 text-primary-container border border-primary-container font-bold specular-edge'
                          : 'glass-well text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <div className="text-xs font-extrabold">{sd.label}</div>
                      <div className="text-[10px] opacity-80 truncate">{sd.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Classroom Micro-Grants Feed */}
          <div className="glass-panel rounded-3xl p-6 space-y-4 specular-edge">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-tertiary-container/15 border border-tertiary-container/30 flex items-center justify-center text-tertiary-fixed-dim">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-headline font-bold text-on-surface uppercase tracking-wider">
                    Live Classroom Micro-Grants Stream
                  </h3>
                  <p className="text-[11px] text-on-surface-variant font-mono">
                    Real-time audit log of discretionary English rewards ({todayAllRewards.length} total entries)
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full glass-well text-xs font-mono font-bold text-tertiary-fixed-dim">
                Today: +E$ {todayTotalAwarded}.00
              </span>
            </div>

            {todayAllRewards.length === 0 ? (
              <div className="glass-well rounded-2xl p-6 text-center text-xs text-on-surface-variant font-mono">
                No English micro-grants recorded yet. Select a student above and authorize a grant!
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {todayAllRewards.slice(0, 15).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-2xl glass-well hover:border-primary-container/30 transition-all text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-tertiary-container/15 border border-tertiary-container/30 flex items-center justify-center text-tertiary-fixed-dim font-mono font-bold text-xs shrink-0">
                        {r.studentName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-on-surface font-headline truncate">
                            {r.studentName}
                          </span>
                          {r.studentClass && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded glass-pill text-on-surface-variant">
                              {r.studentClass}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface-variant truncate">{r.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 font-mono shrink-0 ml-2">
                      <span className="text-[10px] text-outline hidden sm:inline">
                        {new Date(r.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="font-bold text-tertiary-fixed-dim bg-tertiary-container/15 px-2.5 py-1 rounded-lg border border-tertiary-container/30">
                        +E$ {r.amount}.00
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT 4 COLUMNS: Aero SmartPass Verification Card & Cohort Velocity */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel rounded-3xl p-6 space-y-5 specular-edge sticky top-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary-container" />
                <span className="text-xs font-mono uppercase tracking-widest font-bold text-on-surface">
                  SmartPass Settlement
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary-container/15 text-primary-container border border-primary-container/30 font-bold">
                ECC-256 VERIFIED
              </span>
            </div>

            {/* Holographic Mini SmartPass Card */}
            {selectedStudent && (
              <div className="holo-card-cyan rounded-2xl p-4 text-white relative overflow-hidden space-y-4">
                <div className="absolute inset-0 holo-sheen pointer-events-none opacity-70" />
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-cyan-200/80">
                      {settings.schoolName}
                    </p>
                    <p className="text-sm font-headline font-bold truncate max-w-[180px]">
                      {selectedStudent.name}
                    </p>
                  </div>
                  <Wifi className="w-4 h-4 text-cyan-200 rotate-90" />
                </div>

                <div className="relative z-10 font-mono text-xs tracking-[0.18em] text-cyan-100">
                  {formatCardNumber(selectedStudent.cardNumber)}
                </div>

                <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/15 text-[10px] font-mono">
                  <span>ID: {selectedStudent.studentIdNumber}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/15 text-white font-bold">
                    {tier?.name} • {selectedStudent.creditScore} PTS
                  </span>
                </div>
              </div>
            )}

            {/* Settlement Breakdown */}
            <div className="glass-well rounded-2xl p-4 space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Opening Reserve</span>
                <span className="font-bold text-on-surface">
                  E$ {selectedStudent?.currentBalance ?? 0}.00
                </span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Discretionary Delta</span>
                <span
                  className={`font-bold ${
                    mode === 'award' ? 'text-tertiary-fixed-dim' : 'text-error'
                  }`}
                >
                  {mode === 'award' ? '+' : '-'}E$ {effectiveAmount}.00
                </span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Activity Rubric</span>
                <span className="text-on-surface truncate max-w-[160px] text-right font-sans">
                  {effectiveReason}
                </span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>FICO Score Impact</span>
                <span className="text-primary-container font-bold">
                  {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta} PTS → {projectedScore}
                </span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Clearing Fee</span>
                <span className="text-tertiary-fixed-dim">E$ 0.00 (Waived)</span>
              </div>
              <div className="pt-2.5 border-t border-outline-variant/25 flex items-center justify-between text-sm">
                <span className="font-bold text-on-surface font-headline">Projected Net</span>
                <span className="font-extrabold text-tertiary-fixed-dim text-base">
                  E$ {projectedBalance}.00
                </span>
              </div>
            </div>

            {/* Optical Barcode Strip */}
            <div className="glass-well rounded-xl p-3 flex flex-col items-center gap-1.5">
              <div
                className="w-full h-7 opacity-70"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, currentColor 0px, currentColor 2px, transparent 2px, transparent 5px, currentColor 5px, currentColor 6px, transparent 6px, transparent 9px)',
                }}
              />
              <span className="text-[9px] font-mono tracking-[0.25em] text-on-surface-variant uppercase">
                AERO-TX-{selectedStudent?.studentIdNumber || '0000'}-{effectiveAmount}
              </span>
            </div>

            {justSubmitted && (
              <div className="p-3 rounded-xl bg-tertiary-container/20 border border-tertiary-container/40 text-tertiary-fixed-dim text-xs font-mono font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{justSubmitted}</span>
              </div>
            )}

            {/* Submit Liquid Pill CTA */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full py-3.5 px-6 rounded-full font-headline font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                mode === 'award'
                  ? 'liquid-button-emerald'
                  : 'bg-error-container text-on-error-container border border-error/50 shadow-lg'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>
                {mode === 'award'
                  ? `Confirm & Award +E$ ${effectiveAmount || 0}`
                  : `Execute Debit -E$ ${effectiveAmount || 0}`}
              </span>
            </button>
          </div>

          {/* Cohort English Velocity Sparkline Card */}
          <div className="glass-panel rounded-3xl p-5 space-y-3 specular-edge">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant font-bold block">
                  Cohort English Velocity
                </span>
                <p className="text-base font-headline font-bold text-on-surface mt-0.5">
                  E$ {todayTotalAwarded.toLocaleString('en-US')}.00 Minted Today
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-tertiary-container/15 text-tertiary-fixed-dim font-mono text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> +18.4%
              </span>
            </div>

            {/* SVG Sparkline */}
            <div className="h-14 w-full">
              <svg viewBox="0 0 240 50" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary-container)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--color-primary-container)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,42 Q35,38 65,26 T130,22 T190,10 T240,6 L240,50 L0,50 Z"
                  fill="url(#velocityGrad)"
                />
                <path
                  d="M0,42 Q35,38 65,26 T130,22 T190,10 T240,6"
                  fill="none"
                  stroke="var(--color-primary-container)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
