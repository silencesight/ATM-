import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  CheckSquare,
  Square,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  Users
} from 'lucide-react';
import { Student, Classroom } from '../types';

interface BulkGiveMoneyModalProps {
  students: Student[];
  classrooms?: Classroom[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    studentIds: string[],
    amount: number,
    type: 'increase' | 'reduce',
    reason: string
  ) => void;
  theme?: 'dark' | 'light';
}

export const BulkGiveMoneyModal: React.FC<BulkGiveMoneyModalProps> = ({
  students,
  classrooms = [],
  isOpen,
  onClose,
  onSubmit,
  theme = 'dark',
}) => {
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    () => new Set(students.filter((s) => s.cardStatus === 'active').map((s) => s.id))
  );
  const [amount, setAmount] = useState<number | ''>(50);
  const [type, setType] = useState<'increase' | 'reduce'>('increase');
  const [reason, setReason] = useState<string>('Exemplary English Participation');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  const isDark = theme === 'dark';

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.cardNumber && s.cardNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesClass =
        classFilter === 'all' ||
        s.classId === classFilter ||
        s.className === classFilter;

      return matchesSearch && matchesClass;
    });
  }, [students, searchQuery, classFilter]);

  if (!isOpen) return null;

  const handleSelectAll = () => {
    if (selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)));
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || selectedStudentIds.size === 0) return;
    onSubmit(Array.from(selectedStudentIds), Number(amount), type, reason.trim() || 'Classroom Award');
    onClose();
  };

  const PRESET_REASONS = [
    '🗣️ Exemplary English Participation',
    '📖 Reading Chapter Milestone',
    '✍️ Outstanding Notebook Work',
    '🏆 Class Competition Award',
    '🤝 Collaborative Group Bonus',
    '⚡ Discretionary Teacher Merit',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl glass-panel specular-edge rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-on-surface">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-tertiary-container/15 border border-tertiary-container/30 flex items-center justify-center text-tertiary-fixed-dim">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-headline tracking-tight text-on-surface">
                  Bulk Credit &amp; Balance Award
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-tertiary-container/15 text-tertiary-fixed-dim border border-tertiary-container/30">
                  Batch Dispatcher
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Simultaneously deposit or deduct Eurodollars across multiple student cardholders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl glass-pill text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Split */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left: Student Checklist */}
          <div
            className={`flex-1 flex flex-col border-b md:border-b-0 md:border-r ${
              isDark ? 'border-white/[0.08] bg-[#0b0e14]/50' : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            {/* Filter controls */}
            <div className={`p-3.5 border-b space-y-2.5 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-[#42e5b0] transition-colors ${
                      isDark
                        ? 'bg-[#181d29] border-white/[0.1] text-white placeholder-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
                {classrooms.length > 0 && (
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-[#42e5b0] ${
                      isDark
                        ? 'bg-[#181d29] border-white/[0.1] text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="all">All Cohorts</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="flex items-center gap-1.5 font-semibold text-[#42e5b0] hover:underline"
                >
                  {selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-[#42e5b0]" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  <span>
                    {selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0
                      ? 'Deselect All'
                      : 'Select All Filtered'}
                  </span>
                </button>
                <span className="font-mono text-xs text-slate-400">
                  <strong className="text-[#42e5b0]">{selectedStudentIds.size}</strong> / {students.length} Selected
                </span>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 max-h-[360px]">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">No students match filter.</div>
              ) : (
                filteredStudents.map((s) => {
                  const isChecked = selectedStudentIds.has(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleStudent(s.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                        isChecked
                          ? isDark
                            ? 'bg-[#42e5b0]/10 border-[#42e5b0]/40 text-white'
                            : 'bg-emerald-50 border-emerald-300 text-slate-900'
                          : isDark
                          ? 'bg-[#181d29]/60 border-white/[0.06] text-slate-300 hover:border-white/[0.12]'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-[#42e5b0] shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="font-semibold text-xs truncate block">{s.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {s.className || 'General'} &bull; Balance: E${s.currentBalance}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#42e5b0] shrink-0 ml-2">
                        E${s.currentBalance}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Parameters Form */}
          <form onSubmit={handleSubmit} className="w-full md:w-80 flex flex-col p-4 sm:p-5 space-y-4">
            {/* Type selector */}
            <div>
              <label className="block text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Adjustment Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('increase')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold font-mono transition-all ${
                    type === 'increase'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-[#42e5b0] shadow-sm'
                      : isDark
                      ? 'bg-[#181d29] border-white/[0.08] text-slate-400'
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-[#42e5b0]" />
                  <span>DEPOSIT</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('reduce')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold font-mono transition-all ${
                    type === 'reduce'
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-sm'
                      : isDark
                      ? 'bg-[#181d29] border-white/[0.08] text-slate-400'
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  <span>DEDUCT</span>
                </button>
              </div>
            </div>

            {/* Amount input & preset buttons */}
            <div>
              <label className="block text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Amount per Cardholder
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-lg font-bold font-mono border focus:outline-none focus:ring-1 focus:ring-[#42e5b0] ${
                    isDark
                      ? 'bg-[#0b0e14] border-white/[0.1] text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Quick amount chips */}
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className={`py-1 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                      amount === amt
                        ? 'bg-[#42e5b0] text-[#003828] border-[#42e5b0] font-bold'
                        : isDark
                        ? 'bg-[#181d29] border-white/[0.08] text-slate-300 hover:text-white'
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    +${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason selector */}
            <div>
              <label className="block text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Activity / Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-[#42e5b0] mb-2 ${
                  isDark
                    ? 'bg-[#0b0e14] border-white/[0.1] text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {PRESET_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Or type custom memo..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-[#42e5b0] ${
                  isDark
                    ? 'bg-[#0b0e14] border-white/[0.1] text-white placeholder-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Total batch metric */}
            <div
              className={`p-3 rounded-xl border space-y-1 text-xs font-mono ${
                isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <div className="flex justify-between text-slate-400">
                <span>Total Recipients:</span>
                <span className="font-bold text-white">{selectedStudentIds.size}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Aggregate Delta:</span>
                <span className="font-bold text-[#42e5b0]">
                  {type === 'increase' ? '+' : '-'}E${Number(amount || 0) * selectedStudentIds.size}.00
                </span>
              </div>
            </div>

            <div className="pt-2 mt-auto">
              <button
                type="submit"
                disabled={!amount || Number(amount) <= 0 || selectedStudentIds.size === 0}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg font-mono"
              >
                Execute for {selectedStudentIds.size} Cardholder{selectedStudentIds.size !== 1 ? 's' : ''}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
