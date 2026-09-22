import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Layers,
  Palette
} from 'lucide-react';
import { Student, TeacherSettings, Classroom } from '../types';

interface BulkAddStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBulkStudents: (students: Omit<Student, 'id'>[]) => void;
  settings: TeacherSettings;
  existingStudentCount: number;
  classrooms?: Classroom[];
}

const THEME_OPTIONS: Array<{ key: Student['cardDesignTheme']; label: string; color: string }> = [
  { key: 'sapphire', label: 'Sapphire Blue', color: 'bg-blue-600' },
  { key: 'emerald', label: 'Emerald Green', color: 'bg-emerald-600' },
  { key: 'ruby', label: 'Ruby Crimson', color: 'bg-rose-600' },
  { key: 'gold', label: 'Imperial Gold', color: 'bg-amber-600' },
  { key: 'obsidian', label: 'Obsidian Noir', color: 'bg-zinc-700' },
];

const SAMPLE_STUDENTS = [
  'Gabriel Santana',
  'Yuki Tanaka',
  'Mateo Fernandez',
  'Fatima Zahra',
  'Chloe Lefebvre',
  'Alexander Novak',
];

export const BulkAddStudentsModal: React.FC<BulkAddStudentsModalProps> = ({
  isOpen,
  onClose,
  onAddBulkStudents,
  settings,
  existingStudentCount,
  classrooms = [],
}) => {
  const [namesInput, setNamesInput] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classrooms[0]?.id || ''
  );
  const [startingBalance, setStartingBalance] = useState<number>(settings.startingBalance || 100);
  const [startingLimit, setStartingLimit] = useState<number>(settings.startingLoanLimit || 50);
  const [themeMode, setThemeMode] = useState<'cycle' | Student['cardDesignTheme']>('cycle');
  const [paymentFrequency, setPaymentFrequency] = useState<'monthly' | 'bimonthly'>('monthly');
  const [startingScore, setStartingScore] = useState<number>(600);

  // Parse lines or commas into names
  const parsedNames = useMemo(() => {
    if (!namesInput.trim()) return [];
    const lines = namesInput
      .split(/[\n,;]+/)
      .map((n) => n.trim())
      .filter((n) => n.length >= 2);
    // Remove duplicates
    return Array.from(new Set(lines));
  }, [namesInput]);

  // Selected classroom object
  const currentClass = classrooms.find((c) => c.id === selectedClassId) || classrooms[0];

  // Generate student preview items
  const previewStudents = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const themes: Student['cardDesignTheme'][] = ['sapphire', 'emerald', 'ruby', 'gold', 'obsidian'];

    return parsedNames.map((name, index) => {
      const studentIndex = existingStudentCount + index + 1;
      const idNum = `ENG-${currentYear}-${String(studentIndex).padStart(3, '0')}`;
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const rawCard = `4${Math.floor(100 + Math.random() * 900)}${Math.floor(1000 + Math.random() * 9000)}${Math.floor(1000 + Math.random() * 9000)}${randomSuffix}`;
      const cvv = String(Math.floor(100 + Math.random() * 900));
      
      const theme =
        themeMode === 'cycle'
          ? themes[index % themes.length]
          : themeMode;

      return {
        name,
        studentIdNumber: idNum,
        cardNumber: rawCard,
        expiryDate: '12/29',
        cvv,
        cardDesignTheme: theme,
        startingBalance,
        currentBalance: startingBalance,
        creditScore: startingScore,
        maxLoanLimit: startingLimit,
        paymentFrequency,
        classId: currentClass?.id,
        className: currentClass?.name,
        cardStatus: 'active' as const,
        activeLoanId: null,
        totalLoansCompleted: 0,
        punctualPaymentsCount: 0,
        delaysCount: 0,
        decoratedStatementsCount: 0,
      };
    });
  }, [parsedNames, existingStudentCount, startingBalance, startingLimit, themeMode, paymentFrequency, startingScore, currentClass]);

  if (!isOpen) return null;

  const handleLoadSample = () => {
    setNamesInput(SAMPLE_STUDENTS.join('\n'));
  };

  const handleRemoveName = (nameToRemove: string) => {
    const updated = parsedNames.filter((n) => n !== nameToRemove);
    setNamesInput(updated.join('\n'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (previewStudents.length === 0) return;
    onAddBulkStudents(previewStudents);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                Batch Student Enrollment (Bulk Add)
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Roster Importer
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Paste student names to automatically mint cards, assign IDs, and issue classroom credit instruments in batch.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Names Input Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <span>Student Names Roster (One per line or comma-separated)</span>
                <span className="text-emerald-400 font-bold">({parsedNames.length} detected)</span>
              </label>
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-mono font-medium flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Load Sample Class (6 Students)
              </button>
            </div>

            <textarea
              rows={5}
              value={namesInput}
              onChange={(e) => setNamesInput(e.target.value)}
              placeholder="e.g.&#10;Gabriel Santana&#10;Yuki Tanaka&#10;Mateo Fernandez&#10;Fatima Zahra"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono text-xs leading-relaxed"
            />
            <p className="text-[11px] text-slate-500 font-mono">
              Tip: You can copy-paste a list from Excel, Google Sheets, or a text document.
            </p>
          </div>

          {/* Batch Default Settings Grid */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Batch Instrument Defaults
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono">
              {/* Target Classroom */}
              {classrooms.length > 0 && (
                <div>
                  <label className="text-[10px] text-amber-400 uppercase tracking-widest block mb-1 font-bold">
                    Assign to Class
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-amber-500/50 rounded-lg text-xs text-white font-bold"
                  >
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Starting Balance */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
                  Starting Balance
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-500 text-xs">E$</span>
                  <input
                    type="number"
                    min={0}
                    max={5000}
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {/* Starting Loan Limit */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
                  Starting Loan Cap
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-500 text-xs">E$</span>
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={startingLimit}
                    onChange={(e) => setStartingLimit(Number(e.target.value) || 50)}
                    className="w-full pl-7 pr-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {/* Initial Credit Score */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
                  Starting Score
                </label>
                <input
                  type="number"
                  min={300}
                  max={850}
                  value={startingScore}
                  onChange={(e) => setStartingScore(Number(e.target.value) || 600)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              {/* Payment Frequency */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
                  Payment Cycle
                </label>
                <select
                  value={paymentFrequency}
                  onChange={(e) => setPaymentFrequency(e.target.value as 'monthly' | 'bimonthly')}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="monthly">Monthly (E$482/mo)</option>
                  <option value="bimonthly">Bimonthly (E$241/bi-wk)</option>
                </select>
              </div>
            </div>

            {/* Theme Assignment Mode */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2 font-mono">
                Card Design Theme Distribution
              </label>
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setThemeMode('cycle')}
                  className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                    themeMode === 'cycle'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Auto-Rotate All Gemstones (Varied Roster)
                </button>

                {THEME_OPTIONS.map((th) => (
                  <button
                    key={th.key}
                    type="button"
                    onClick={() => setThemeMode(th.key)}
                    className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                      themeMode === th.key
                        ? 'bg-slate-800 text-white border-emerald-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${th.color}`} />
                    {th.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold uppercase tracking-wider text-slate-400">
                Enrollment Verification Queue ({previewStudents.length} Students)
              </span>
              <span className="text-slate-500 text-[11px]">
                Ready to mint ISO/IEC 7810 classroom cards
              </span>
            </div>

            {previewStudents.length === 0 ? (
              <div className="p-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500 font-mono">
                Type or paste student names above to view the enrollment verification queue.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {previewStudents.map((st, idx) => (
                  <div
                    key={st.studentIdNumber + idx}
                    className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono group hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500 w-5 text-right">{idx + 1}.</span>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <p className="font-bold text-white text-xs">{st.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {st.studentIdNumber} • Card: {st.cardNumber.slice(0, 4)}••••{st.cardNumber.slice(-4)} • CVV: {st.cvv}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {st.className && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-amber-500/30 text-amber-300 font-bold">
                          {st.className}
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-400 font-bold">
                        E${st.startingBalance} Bal
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                        Score: {st.creditScore}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveName(st.name)}
                        className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                        title="Remove student from queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono font-bold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={previewStudents.length === 0}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold uppercase tracking-wider text-xs rounded-lg transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 font-mono"
            >
              <CheckCircle2 className="w-4 h-4" />
              Enroll {previewStudents.length} Students in Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
