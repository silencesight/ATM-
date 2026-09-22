import React, { useState, useEffect } from 'react';
import {
  Printer,
  ArrowLeft,
  CheckSquare,
  Square,
  Sparkles,
  Search,
  Layers,
  RotateCw,
  Scissors
} from 'lucide-react';
import { Student, TeacherSettings, Classroom } from '../types';
import { CreditCardVisual } from './CreditCardVisual';
import { DEFAULT_TEACHER_SETTINGS } from '../utils/creditCalculator';

interface PrintableCardsProps {
  students: Student[];
  settings?: TeacherSettings;
  classrooms?: Classroom[];
  onBack: () => void;
  initialSelectedStudentId?: string | null;
}

export const PrintableCards: React.FC<PrintableCardsProps> = ({
  students,
  settings = DEFAULT_TEACHER_SETTINGS,
  classrooms = [],
  onBack,
  initialSelectedStudentId,
}) => {
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(() => {
    if (initialSelectedStudentId && students.some((s) => s.id === initialSelectedStudentId)) {
      return [initialSelectedStudentId];
    }
    return students.filter((s) => s.cardStatus !== 'delisted').map((s) => s.id);
  });

  const [cardSide, setCardSide] = useState<'front' | 'both' | 'back'>('front');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  useEffect(() => {
    if (initialSelectedStudentId && students.some((s) => s.id === initialSelectedStudentId)) {
      setSelectedStudentIds([initialSelectedStudentId]);
    }
  }, [initialSelectedStudentId, students]);

  const toggleStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((sid) => sid !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedClassFilter === 'all') {
      setSelectedStudentIds(students.map((s) => s.id));
    } else {
      const classStudentIds = students
        .filter((s) => s.classId === selectedClassFilter || s.className === selectedClassFilter)
        .map((s) => s.id);
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...classStudentIds])));
    }
  };

  const selectOnlyCurrentClass = (classId: string) => {
    setSelectedClassFilter(classId);
    if (classId === 'all') {
      setSelectedStudentIds(students.map((s) => s.id));
    } else {
      const classStudentIds = students
        .filter((s) => s.classId === classId || s.className === classId)
        .map((s) => s.id);
      setSelectedStudentIds(classStudentIds);
    }
  };

  const selectNone = () => {
    setSelectedStudentIds([]);
  };

  const handlePrintAll = () => {
    window.focus();
    window.print();
  };

  const handlePrintSingle = (studentId: string) => {
    setSelectedStudentIds([studentId]);
    setTimeout(() => {
      window.focus();
      window.print();
    }, 150);
  };

  const filteredRoster = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.studentIdNumber.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesClass =
      selectedClassFilter === 'all' ||
      s.classId === selectedClassFilter ||
      s.className === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  const activeStudentsToPrint = students.filter((s) => selectedStudentIds.includes(s.id));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Non-printable Control Panel */}
      <div className="no-print max-w-6xl mx-auto mb-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Return"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
                Card Print &amp; Tangible Mint Studio
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider">
                  ISO/IEC 7810
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate high-resolution printable cards with standard classroom token economics guidelines.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Side Format Mode */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setCardSide('front')}
                className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
                  cardSide === 'front'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Front Side
              </button>
              <button
                type="button"
                onClick={() => setCardSide('both')}
                className={`px-3 py-1.5 rounded-lg transition-colors font-bold flex items-center gap-1.5 ${
                  cardSide === 'both'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3 h-3" />
                Front &amp; Back (Foldable)
              </button>
              <button
                type="button"
                onClick={() => setCardSide('back')}
                className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
                  cardSide === 'back'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Back Side (Magnetic)
              </button>
            </div>

            {/* Print Trigger Button */}
            <button
              onClick={handlePrintAll}
              disabled={activeStudentsToPrint.length === 0}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold uppercase tracking-wider text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 font-mono"
            >
              <Printer className="w-4 h-4" />
              Print Selected Cards ({activeStudentsToPrint.length})
            </button>
          </div>
        </div>

        {/* Student Selector Toolbar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-slate-300">
                Target Cards to Print ({selectedStudentIds.length} of {students.length} Selected):
              </span>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-emerald-400 hover:text-emerald-300 uppercase tracking-wider transition-colors text-[11px] font-bold"
                >
                  Select All
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={selectNone}
                  className="text-slate-400 hover:text-slate-300 uppercase tracking-wider transition-colors text-[11px] font-bold"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter by student name..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 font-mono"
              />
            </div>
          </div>

          {/* Class Filter Bar */}
          {classrooms.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              <span className="text-[10px] uppercase font-bold font-mono text-slate-500 tracking-wider mr-1">
                Class:
              </span>
              <button
                type="button"
                onClick={() => setSelectedClassFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                  selectedClassFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Classes ({students.length})
              </button>

              {classrooms.map((c) => {
                const count = students.filter(
                  (s) => s.classId === c.id || s.className === c.name
                ).length;
                const isCurrent = selectedClassFilter === c.id || selectedClassFilter === c.name;

                return (
                  <div key={c.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedClassFilter(c.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                        isCurrent
                          ? 'bg-amber-600 text-white shadow'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {c.name} ({count})
                    </button>
                    <button
                      type="button"
                      onClick={() => selectOnlyCurrentClass(c.id)}
                      title={`Select only students in ${c.name}`}
                      className="px-1.5 py-1 rounded text-[10px] font-mono uppercase bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40"
                    >
                      Pick All
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
            {filteredRoster.map((student) => {
              const isSelected = selectedStudentIds.includes(student.id);
              const isDelisted = student.cardStatus === 'delisted';
              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => toggleStudent(student.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500/60 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 opacity-60 hover:opacity-100'
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                  <div className="truncate min-w-0">
                    <p className="font-bold truncate text-xs">{student.name}</p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono truncate">
                      {student.className && (
                        <span className="text-amber-400 font-bold">[{student.className.split(' ')[0]}]</span>
                      )}
                      <span>{isDelisted ? 'REVOKED' : `${student.creditScore} pts`}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Print instructions banner */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-3 font-mono">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold uppercase tracking-wider text-[11px] text-emerald-400">
              Print Guidelines for Best Tangible Classroom Feel:
            </p>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              1. In your browser print dialog, ensure <strong>&quot;Background graphics&quot;</strong> is checked so metallic gradients, EMV chips, and themes are preserved.
            </p>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              2. Print on 250–300 gsm heavy cardstock or photo paper. If printing <strong>Front &amp; Back</strong>, fold along the dotted line and glue or laminate together.
            </p>
          </div>
        </div>
      </div>

      {/* Printable Sheet Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="no-print text-xs text-slate-400 mb-4 flex items-center justify-between font-mono">
          <span className="uppercase tracking-wider text-[11px] text-slate-300 font-bold">
            Print Preview ({activeStudentsToPrint.length} Students Queued)
          </span>
          <span className="text-[11px] text-slate-500">
            Standard Credit Card Ratio: 85.6mm × 53.98mm (3.37&quot; × 2.125&quot;)
          </span>
        </div>

        {activeStudentsToPrint.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 rounded-2xl border border-slate-800 font-mono">
            <p className="text-slate-400 text-sm uppercase tracking-wider font-bold">No student cards selected in batch queue.</p>
            <p className="text-slate-500 text-xs mt-1">Select students above or click &quot;Select All&quot; to print cards.</p>
            <button
              type="button"
              onClick={selectAll}
              className="mt-4 px-4 py-2 bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-400 transition-colors"
            >
              Select All Cards
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 printable-card-grid">
            {activeStudentsToPrint.map((student) => (
              <div
                key={student.id}
                className="printable-card-item p-5 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative shadow-lg print:bg-transparent print:border-dashed print:border-slate-400 print:shadow-none print:p-2"
                style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
              >
                {/* Single print button in web preview */}
                <div className="no-print w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-mono">
                  <span className="font-bold text-slate-200">{student.name}</span>
                  <button
                    type="button"
                    onClick={() => handlePrintSingle(student.id)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 rounded border border-slate-700 text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <Printer className="w-3 h-3" />
                    Print Just This Card
                  </button>
                </div>

                {/* Card visual(s) based on format mode */}
                {cardSide === 'both' ? (
                  <div className="w-full space-y-4">
                    {/* Front */}
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Front</span>
                      <CreditCardVisual
                        student={student}
                        settings={settings}
                        interactive={false}
                        compact={false}
                        forceSide="front"
                      />
                    </div>

                    {/* Fold line */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono my-2">
                      <div className="flex-1 border-t border-dashed border-slate-600 print:border-slate-400" />
                      <span className="flex items-center gap-1">
                        <Scissors className="w-3 h-3 text-slate-400" /> Fold / Cut line
                      </span>
                      <div className="flex-1 border-t border-dashed border-slate-600 print:border-slate-400" />
                    </div>

                    {/* Back */}
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Back</span>
                      <CreditCardVisual
                        student={student}
                        settings={settings}
                        interactive={false}
                        compact={false}
                        forceSide="back"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full">
                    <CreditCardVisual
                      student={student}
                      settings={settings}
                      interactive={false}
                      compact={false}
                      forceSide={cardSide}
                    />
                  </div>
                )}

                {/* Cutout guideline footer */}
                <div className="mt-3 flex items-center justify-between w-full text-[10px] text-slate-400 font-mono px-2 pt-2 border-t border-slate-800/60 print:border-slate-300">
                  <span className="flex items-center gap-1">
                    <Scissors className="w-3 h-3 text-slate-400" /> Trim along outer edge
                  </span>
                  <span>{student.studentIdNumber}</span>
                  <span>{settings.schoolName || 'Oxford English Academy'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
