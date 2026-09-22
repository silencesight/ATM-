import React, { useState } from 'react';
import { X, Search, DollarSign, CheckSquare, Square, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { Student, Classroom } from '../types';

interface BulkGiveMoneyModalProps {
  students: Student[];
  classrooms?: Classroom[];
  onClose: () => void;
  onSubmit: (studentIds: string[], amount: number, type: 'increase' | 'reduce', reason: string) => void;
}

export const BulkGiveMoneyModal: React.FC<BulkGiveMoneyModalProps> = ({
  students,
  classrooms = [],
  onClose,
  onSubmit,
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [type, setType] = useState<'increase' | 'reduce'>('increase');
  const [reason, setReason] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Filter students safely
  const filteredStudents = students.filter((s) => {
    if (!s) return false;
    const safeName = s.name || '';
    const safeCard = s.cardNumber || '';
    const safeId = s.id || '';
    
    const matchesSearch =
      safeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      safeCard.includes(searchQuery) ||
      safeId.includes(searchQuery);
      
    const matchesClass = classFilter === 'all' || s.className === classFilter;
    return matchesSearch && matchesClass;
  });

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
    if (!amount || amount <= 0 || selectedStudentIds.size === 0) return;
    
    onSubmit(Array.from(selectedStudentIds), Number(amount), type, reason || 'Bulk adjustment');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 w-full max-w-4xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Bulk Balance Adjustment
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Add or deduct money for multiple students simultaneously.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left Side: Student Selection */}
          <div className="flex-1 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col bg-slate-950/30">
            <div className="p-4 border-b border-slate-800 space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500"
                  />
                </div>
                {classrooms.length > 0 && (
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="all">All Classes</option>
                    {classrooms.map((c) => (
                      c ? (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ) : null
                    ))}
                  </select>
                )}
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                >
                  {selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  {selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedStudentIds.size} selected
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[200px]">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No students match your search.</div>
              ) : (
                filteredStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleStudent(s.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                      selectedStudentIds.has(s.id)
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {selectedStudentIds.has(s.id) ? (
                        <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-sm">{s.name}</div>
                        <div className="text-xs opacity-70 font-mono">Balance: E${s.currentBalance}</div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Side: Form */}
          <form onSubmit={handleSubmit} className="w-full md:w-80 flex flex-col bg-slate-900">
            <div className="p-5 flex-1 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('increase')}
                    className={`py-2.5 px-3 rounded-lg border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      type === 'increase'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    DEPOSIT
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('reduce')}
                    className={`py-2.5 px-3 rounded-lg border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      type === 'reduce'
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    DEDUCT
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Amount (E$)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-lg font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Reason / Memo
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Field trip bonus"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/50">
              <button
                type="submit"
                disabled={!amount || amount <= 0 || selectedStudentIds.size === 0}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20"
              >
                Apply to {selectedStudentIds.size} Student{selectedStudentIds.size !== 1 && 's'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
