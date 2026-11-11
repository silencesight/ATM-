import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  TrendingUp,
  Sparkles,
  Award,
  CheckCircle2,
  DollarSign,
  Briefcase,
  History,
  RotateCcw,
  Info,
  Calendar,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { Student, TeacherSettings, SalaryRaiseRecord } from '../types';
import { StudentAvatar } from './StudentAvatar';

export interface GrantSalaryRaiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  students?: Student[];
  settings: TeacherSettings;
  onGrantSalaryRaise: (
    studentId: string,
    newSalary: number,
    reason: string,
    creditScoreBonus?: number
  ) => void;
  onSelectStudent?: (studentId: string) => void;
}

const PRESET_RAISES = [25, 50, 75, 100, 150, 200];

const PRESET_REASONS = [
  '⭐ Exceptional English fluency & oral participation',
  '📖 Outstanding homework & notebook presentation excellence',
  '🤝 Classroom peer leader & academic tutor',
  '🏆 ESL competition winner / honor roll distinction',
  '📈 High attendance, punctuality & proactive classroom effort',
  '💼 Promotion to higher classroom responsibility / merit role',
];

export const GrantSalaryRaiseModal: React.FC<GrantSalaryRaiseModalProps> = ({
  isOpen,
  onClose,
  student,
  students = [],
  settings,
  onGrantSalaryRaise,
  onSelectStudent,
}) => {
  const [currentStudentId, setCurrentStudentId] = useState<string>(student?.id || '');

  useEffect(() => {
    if (student?.id) {
      setCurrentStudentId(student.id);
    }
  }, [student]);

  const activeStudent = useMemo(() => {
    return students.find((s) => s.id === currentStudentId) || student;
  }, [students, currentStudentId, student]);

  const standardBase = useMemo(() => {
    if (!activeStudent) return 482;
    return activeStudent.paymentFrequency === 'monthly'
      ? settings.monthlyPayment || 482
      : settings.bimonthlyPayment || 241;
  }, [activeStudent, settings]);

  const currentSalary = useMemo(() => {
    if (!activeStudent) return standardBase;
    return typeof activeStudent.customSalaryAmount === 'number' && activeStudent.customSalaryAmount > 0
      ? activeStudent.customSalaryAmount
      : standardBase;
  }, [activeStudent, standardBase]);

  // Mode: 'increment' (+E$ on top of current salary) or 'exact' (direct new salary target)
  const [mode, setMode] = useState<'increment' | 'exact'>('increment');
  const [incrementAmount, setIncrementAmount] = useState<number>(50);
  const [customIncrement, setCustomIncrement] = useState<string>('');
  const [exactAmount, setExactAmount] = useState<number>(currentSalary + 50);
  const [customExactAmount, setCustomExactAmount] = useState<string>('');
  const [reason, setReason] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [creditBonus, setCreditBonus] = useState<number>(10);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Sync exact amount if active student changes
  useEffect(() => {
    setExactAmount(currentSalary + 50);
    setCustomIncrement('');
    setCustomExactAmount('');
  }, [currentStudentId, currentSalary]);

  if (!isOpen || !activeStudent) return null;

  const effectiveNewSalary = Math.max(
    0,
    mode === 'increment'
      ? currentSalary +
        (customIncrement !== '' ? Math.max(0, parseInt(customIncrement) || 0) : incrementAmount)
      : customExactAmount !== ''
      ? Math.max(0, parseInt(customExactAmount) || 0)
      : exactAmount
  );

  const raiseDelta = effectiveNewSalary - currentSalary;
  const totalRaiseOverStandard = effectiveNewSalary - standardBase;
  const effectiveReason = customReason.trim() ? customReason.trim() : reason;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (effectiveNewSalary <= 0) return;
    onGrantSalaryRaise(activeStudent.id, effectiveNewSalary, effectiveReason, creditBonus);
    onClose();
  };

  const handleResetToStandard = () => {
    const confirmReset = window.confirm(
      `Reset ${activeStudent.name}'s salary back to the standard school default of E$${standardBase}.00?`
    );
    if (!confirmReset) return;
    onGrantSalaryRaise(
      activeStudent.id,
      standardBase,
      'Reset to standard classroom cadence default',
      0
    );
    onClose();
  };

  const cadenceLabel = activeStudent.paymentFrequency === 'monthly' ? 'Monthly' : 'Bi-weekly';
  const existingRaiseHistory: SalaryRaiseRecord[] = activeStudent.salaryRaisesHistory || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-panel rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden specular-edge shadow-2xl border border-outline-variant/30">
        {/* HEADER */}
        <div className="p-5 sm:p-6 border-b border-outline-variant/20 flex items-start justify-between gap-4 shrink-0 bg-surface-container-lowest/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-md">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                  STUDENT SALARY &amp; WAGE ENGINE
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-400/30">
                  Custom Wage
                </span>
              </div>
              <h2 className="text-xl font-headline font-bold text-on-surface">
                Customize Salary &amp; Grant Raise
              </h2>
              <p className="text-xs text-on-surface-variant">
                Adjust regular cadence salary for <strong>{activeStudent.name}</strong>. Reflects on every future payout.
              </p>
            </div>
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

        {/* BODY */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Active Student Selector / Summary Card */}
          <div className="glass-well rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-outline-variant/25">
            <div className="flex items-center gap-3">
              <StudentAvatar
                name={activeStudent.name}
                avatarUrl={activeStudent.avatarUrl}
                size="md"
              />
              <div>
                <h3 className="font-headline font-bold text-base text-on-surface">
                  {activeStudent.name}
                </h3>
                <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant mt-0.5">
                  <span>{activeStudent.className || 'Oxford Class'}</span>
                  <span>•</span>
                  <span className="font-bold text-primary-container">
                    {cadenceLabel} Cadence
                  </span>
                  <span>•</span>
                  <span>Balance: E${activeStudent.currentBalance}.00</span>
                </div>
              </div>
            </div>

            {/* Current Salary Badge */}
            <div className="text-right sm:text-right shrink-0 font-mono">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant block font-bold">
                Current Salary Rate
              </span>
              <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                <span className="text-xl font-bold text-emerald-400">
                  E$ {currentSalary}.00
                </span>
                <span className="text-xs text-on-surface-variant">
                  /{activeStudent.paymentFrequency === 'monthly' ? 'mo' : '2wk'}
                </span>
              </div>
              <span className="text-[11px] text-on-surface-variant block">
                Standard School Base: E${standardBase}.00
              </span>
            </div>
          </div>

          {/* Raise Customization Mode Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>1. Choose Raise Amount or Target Salary</span>
              </label>

              <div className="glass-well p-1 rounded-full flex items-center gap-1 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setMode('increment')}
                  className={`px-3 py-1 rounded-full transition-all font-bold ${
                    mode === 'increment'
                      ? 'bg-emerald-500 text-black shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  + Add Raise (+E$)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('exact')}
                  className={`px-3 py-1 rounded-full transition-all font-bold ${
                    mode === 'exact'
                      ? 'bg-emerald-500 text-black shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  = Set Exact Salary
                </button>
              </div>
            </div>

            {mode === 'increment' ? (
              <div className="space-y-3 p-4 rounded-2xl glass-well border border-outline-variant/20">
                <span className="text-xs font-mono text-on-surface-variant block">
                  Select a salary increase to add on top of current rate (E${currentSalary}.00):
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_RAISES.map((val) => {
                    const isSelected = customIncrement === '' && incrementAmount === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setIncrementAmount(val);
                          setCustomIncrement('');
                        }}
                        className={`py-2 px-2 rounded-xl font-mono text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-emerald-500 text-black border-emerald-400 shadow-sm scale-105'
                            : 'glass-well border-outline-variant/25 text-on-surface hover:border-emerald-400/40'
                        }`}
                      >
                        +E${val}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs font-mono text-on-surface-variant shrink-0">
                    Or custom raise amount:
                  </span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-emerald-400">
                      +E$
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="e.g. 80"
                      value={customIncrement}
                      onChange={(e) => setCustomIncrement(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 rounded-xl glass-well border border-outline-variant/30 text-on-surface font-mono text-xs font-bold focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-4 rounded-2xl glass-well border border-outline-variant/20">
                <span className="text-xs font-mono text-on-surface-variant block">
                  Choose a direct target salary for this student:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[300, 400, 500, 550, 600, 750].map((val) => {
                    const isSelected = customExactAmount === '' && exactAmount === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setExactAmount(val);
                          setCustomExactAmount('');
                        }}
                        className={`py-2 px-2 rounded-xl font-mono text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-emerald-500 text-black border-emerald-400 shadow-sm scale-105'
                            : 'glass-well border-outline-variant/25 text-on-surface hover:border-emerald-400/40'
                        }`}
                      >
                        E${val}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs font-mono text-on-surface-variant shrink-0">
                    Or custom exact salary:
                  </span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-emerald-400">
                      E$
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="e.g. 520"
                      value={customExactAmount}
                      onChange={(e) => setCustomExactAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl glass-well border border-outline-variant/30 text-on-surface font-mono text-xs font-bold focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-secondary" />
              <span>2. Official Academic / Merit Reason</span>
            </label>
            <div className="space-y-1.5">
              {PRESET_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setReason(r);
                    setCustomReason('');
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-mono transition-all border flex items-center justify-between ${
                    reason === r && customReason === ''
                      ? 'bg-emerald-500/15 border-emerald-400/50 text-on-surface font-bold shadow-sm'
                      : 'glass-well border-outline-variant/15 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span>{r}</span>
                  {reason === r && customReason === '' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Or write custom reason (e.g. Bilingual debate tournament winner)..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-well border border-outline-variant/30 text-on-surface font-mono text-xs placeholder:text-outline focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* FICO Credit Score Bonus */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary-container" />
              <span>3. Optional FICO Credit Score Bonus</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'None (0)', val: 0 },
                { label: '+10 PTS', val: 10 },
                { label: '+15 PTS', val: 15 },
                { label: '+25 PTS (Honors)', val: 25 },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setCreditBonus(item.val)}
                  className={`py-2 px-2 rounded-xl font-mono text-xs font-bold transition-all border ${
                    creditBonus === item.val
                      ? 'bg-primary-container text-on-primary-fixed border-primary-container shadow-sm'
                      : 'glass-well border-outline-variant/20 text-on-surface hover:border-primary-container/40'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* LIVE IMPACT PREVIEW BANNER */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Salary Raise Preview
              </span>
              <span className="text-emerald-200 font-bold">
                {raiseDelta >= 0 ? `+E$${raiseDelta}.00` : `-E$${Math.abs(raiseDelta)}.00`}
              </span>
            </div>

            <div className="flex items-center justify-between text-on-surface pt-1 border-t border-emerald-400/20">
              <span className="text-on-surface-variant">New Cadence Wage:</span>
              <strong className="text-base text-emerald-300">
                E$ {effectiveNewSalary.toLocaleString('en-US')}.00 / {cadenceLabel}
              </strong>
            </div>

            <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
              <span>Standard Baseline: E${standardBase}.00</span>
              <span className="text-emerald-400 font-bold">
                {totalRaiseOverStandard > 0
                  ? `+E$${totalRaiseOverStandard}.00 Merit Raise above school standard`
                  : totalRaiseOverStandard === 0
                  ? 'Equal to standard school rate'
                  : `-E$${Math.abs(totalRaiseOverStandard)}.00 custom rate`}
              </span>
            </div>

            <p className="text-[11px] text-on-surface-variant/90 pt-1">
              💡 When you click <strong>"Pay Salaries"</strong>, {activeStudent.name} will now automatically appear with <strong>E${effectiveNewSalary}.00</strong>.
            </p>
          </div>

          {/* Student Raise History Accordion */}
          {existingRaiseHistory.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-outline-variant/15">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between text-xs font-mono font-bold text-on-surface-variant hover:text-on-surface"
              >
                <div className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-secondary" />
                  <span>
                    Previous Salary Raises ({existingRaiseHistory.length} recorded)
                  </span>
                </div>
                <span>{showHistory ? 'Hide ▲' : 'Show ▼'}</span>
              </button>

              {showHistory && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {existingRaiseHistory.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-2.5 rounded-xl glass-well text-xs font-mono flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-300">
                            E${rec.previousSalary} → E${rec.newSalary}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                            +{rec.raiseAmount >= 0 ? `E$${rec.raiseAmount}` : `E$${rec.raiseAmount}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant truncate">
                          {rec.reason}
                        </p>
                      </div>
                      <span className="text-[10px] text-on-surface-variant shrink-0">
                        {new Date(rec.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        {/* FOOTER */}
        <div className="p-4 sm:p-6 border-t border-outline-variant/20 bg-surface-container-lowest/60 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            {currentSalary !== standardBase && (
              <button
                type="button"
                onClick={handleResetToStandard}
                className="text-xs font-mono text-on-surface-variant hover:text-error flex items-center gap-1 transition-colors"
                title="Revert salary back to standard school cadence default"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Standard School Base (E${standardBase}.00)</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full glass-pill text-xs font-mono font-bold text-on-surface hover:border-outline transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={effectiveNewSalary <= 0}
              className="liquid-button-primary px-6 py-2.5 rounded-full text-xs font-headline font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-40"
            >
              <TrendingUp className="w-4 h-4" />
              <span>
                Grant Raise &amp; Save (E$ {effectiveNewSalary}.00)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
