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
  const [printDensity, setPrintDensity] = useState<'ultra-compact' | 'compact' | 'standard'>('ultra-compact');
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

  const cardsPerA4Page =
    cardSide === 'both'
      ? 5
      : printDensity === 'ultra-compact'
      ? 15
      : printDensity === 'compact'
      ? 10
      : 4;
  const estimatedA4Sheets = Math.max(1, Math.ceil(activeStudentsToPrint.length / cardsPerA4Page));

  return (
    <div className="min-h-screen text-on-surface p-2 md:p-4 print:p-0 print:min-h-0">
      {/* Non-printable Liquid Glass Control Panel */}
      <div className="no-print max-w-6xl mx-auto mb-8 glass-panel rounded-3xl p-6 shadow-2xl space-y-6 specular-edge">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl glass-pill hover:border-primary-container/50 text-on-surface transition-all"
              title="Return to Teacher Hub"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold font-headline uppercase tracking-wider text-on-surface flex items-center gap-2">
                SmartPass Print &amp; Bulk A4 Mint Studio
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wider">
                  {cardsPerA4Page} Cards / A4 Sheet (~{estimatedA4Sheets} {estimatedA4Sheets === 1 ? 'Page' : 'Pages'})
                </span>
              </h1>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Paper-saving bulk A4 layout with full card numbers, CVV, and didactic repayment rules.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* A4 Paper Density Selector */}
            <div className="flex items-center glass-well p-1 rounded-full text-xs font-headline font-bold">
              <button
                type="button"
                onClick={() => setPrintDensity('ultra-compact')}
                className={`px-3 py-1.5 rounded-full transition-all ${
                  printDensity === 'ultra-compact'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Ultra-Compact Bulk Mode: 3 columns × 5 rows = 15 cards per A4 page"
              >
                Ultra-Compact (15/A4)
              </button>
              <button
                type="button"
                onClick={() => setPrintDensity('compact')}
                className={`px-3 py-1.5 rounded-full transition-all ${
                  printDensity === 'compact'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Compact Standard Mode: 2 columns × 5 rows = 10 cards per A4 page"
              >
                Compact (10/A4)
              </button>
              <button
                type="button"
                onClick={() => setPrintDensity('standard')}
                className={`px-3 py-1.5 rounded-full transition-all ${
                  printDensity === 'standard'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Large Display Mode: 4 cards per A4 page"
              >
                Large (4/A4)
              </button>
            </div>

            {/* Side Format Mode */}
            <div className="flex items-center glass-well p-1 rounded-full text-xs font-headline font-bold">
              <button
                type="button"
                onClick={() => setCardSide('front')}
                className={`px-3.5 py-1.5 rounded-full transition-all ${
                  cardSide === 'front'
                    ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Front Side
              </button>
              <button
                type="button"
                onClick={() => setCardSide('both')}
                className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                  cardSide === 'both'
                    ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Front &amp; Back (Foldable)
              </button>
              <button
                type="button"
                onClick={() => setCardSide('back')}
                className={`px-3.5 py-1.5 rounded-full transition-all ${
                  cardSide === 'back'
                    ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Back Side (Magnetic)
              </button>
            </div>

            {/* Print Trigger Button */}
            <button
              onClick={handlePrintAll}
              disabled={activeStudentsToPrint.length === 0}
              className="px-5 py-2.5 liquid-button-emerald disabled:opacity-50 disabled:cursor-not-allowed font-headline font-bold uppercase tracking-wider text-xs rounded-full transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Selected ({activeStudentsToPrint.length})
            </button>
          </div>
        </div>

        {/* Student Selector Toolbar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-on-surface">
                Target Passes ({selectedStudentIds.length} of {students.length} Selected):
              </span>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-primary-container hover:underline uppercase tracking-wider transition-colors text-[11px] font-bold"
                >
                  Select All
                </button>
                <span className="text-outline">•</span>
                <button
                  type="button"
                  onClick={selectNone}
                  className="text-on-surface-variant hover:text-on-surface uppercase tracking-wider transition-colors text-[11px] font-bold"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter by student name..."
                className="w-full pl-8 pr-3 py-1.5 glass-well rounded-full text-xs text-on-surface placeholder-outline font-mono focus:outline-none focus:border-primary-container"
              />
            </div>
          </div>

          {/* Class Filter Bar */}
          {classrooms.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              <span className="text-[10px] uppercase font-bold font-mono text-on-surface-variant tracking-wider mr-1">
                Cohort:
              </span>
              <button
                type="button"
                onClick={() => setSelectedClassFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase transition-all ${
                  selectedClassFilter === 'all'
                    ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                    : 'glass-well text-on-surface-variant hover:text-on-surface'
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
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase transition-all ${
                        isCurrent
                          ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                          : 'glass-well text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {c.name} ({count})
                    </button>
                    <button
                      type="button"
                      onClick={() => selectOnlyCurrentClass(c.id)}
                      title={`Select only students in ${c.name}`}
                      className="px-2 py-1 rounded-full text-[10px] font-mono uppercase glass-pill text-primary-container hover:border-primary-container/50"
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
                  className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left text-xs transition-all ${
                    isSelected
                      ? 'bg-primary-container/15 border-primary-container/60 text-on-surface specular-edge'
                      : 'glass-well border-transparent text-on-surface-variant opacity-65 hover:opacity-100'
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-primary-container shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-outline shrink-0" />
                  )}
                  <div className="truncate min-w-0">
                    <p className="font-headline font-bold truncate text-xs text-on-surface">
                      {student.name}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-on-surface-variant font-mono truncate">
                      {student.className && (
                        <span className="text-primary-container font-bold">
                          [{student.className.split(' ')[0]}]
                        </span>
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
        <div className="p-4 rounded-2xl glass-well text-xs text-on-surface-variant flex items-start gap-3 font-mono">
          <Sparkles className="w-4 h-4 text-tertiary-fixed-dim shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold uppercase tracking-wider text-[11px] text-tertiary-fixed-dim">
              Paper-Saving Bulk A4 Print Guidelines:
            </p>
            <p className="text-on-surface leading-relaxed text-[11px]">
              1. <strong>Ultra-Compact (15/A4)</strong> fits a 3×5 grid (15 cards) on a single A4 sheet; <strong>Compact (10/A4)</strong> fits a 2×5 grid (10 cards); <strong>Front &amp; Back (Foldable)</strong> prints Front &amp; Back side-by-side (5 foldable cards per A4 sheet).
            </p>
            <p className="text-on-surface-variant leading-relaxed text-[11px]">
              2. In your browser print dialog, check <strong>&quot;Background graphics&quot;</strong> and set Margins to <strong>Default or Minimum</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Printable Sheet Grid */}
      <div className="max-w-6xl mx-auto print:max-w-none print:w-full">
        <div className="no-print text-xs text-on-surface-variant mb-4 flex items-center justify-between font-mono">
          <span className="uppercase tracking-wider text-[11px] text-on-surface font-bold">
            Print Preview ({activeStudentsToPrint.length} Students Queued • ~{estimatedA4Sheets} A4 {estimatedA4Sheets === 1 ? 'Sheet' : 'Sheets'})
          </span>
          <span className="text-[11px] text-on-surface-variant">
            Mode: {printDensity === 'ultra-compact' ? 'Ultra-Compact 3×5 (15/A4)' : printDensity === 'compact' ? 'Compact 2×5 (10/A4)' : 'Standard (4/A4)'}
          </span>
        </div>

        {activeStudentsToPrint.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-3xl specular-edge font-mono">
            <p className="text-on-surface text-sm uppercase tracking-wider font-bold">
              No student cards selected in batch queue.
            </p>
            <p className="text-on-surface-variant text-xs mt-1">
              Select students above or click &quot;Select All&quot; to print cards.
            </p>
            <button
              type="button"
              onClick={selectAll}
              className="mt-4 px-5 py-2.5 liquid-button-emerald rounded-full text-xs font-bold uppercase tracking-wider transition-all"
            >
              Select All Cards
            </button>
          </div>
        ) : (
          <div
            className={`grid ${
              cardSide === 'both'
                ? 'grid-cols-1 gap-3 print-grid-foldable'
                : printDensity === 'ultra-compact'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 print-grid-ultra'
                : printDensity === 'compact'
                ? 'grid-cols-1 md:grid-cols-2 gap-3 print-grid-compact'
                : 'grid-cols-1 md:grid-cols-2 gap-6 print-grid-standard'
            } printable-card-grid`}
          >
            {activeStudentsToPrint.map((student) => (
              <div
                key={student.id}
                className={`printable-card-item ${
                  printDensity === 'ultra-compact'
                    ? 'p-2 rounded-2xl print:p-0.5 print:rounded-lg'
                    : printDensity === 'compact'
                    ? 'p-3 rounded-2xl print:p-1 print:rounded-xl'
                    : 'p-4 rounded-3xl print:p-1.5 print:rounded-xl'
                } glass-panel specular-edge flex flex-col items-center justify-center relative shadow-lg print:bg-transparent print:border print:border-dashed print:border-slate-300 print:shadow-none`}
                style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
              >
                {/* Single print button in web preview */}
                <div className="no-print w-full flex items-center justify-between pb-2 mb-2 border-b border-outline-variant/20 text-xs font-mono">
                  <span className="font-bold text-on-surface truncate text-[11px]">{student.name}</span>
                  <button
                    type="button"
                    onClick={() => handlePrintSingle(student.id)}
                    className="px-2.5 py-0.5 rounded-full glass-pill hover:border-primary-container/50 text-primary-container text-[10px] font-bold flex items-center gap-1 transition-all shrink-0"
                  >
                    <Printer className="w-3 h-3" />
                    Print 1
                  </button>
                </div>

                {/* Card visual(s) based on format mode */}
                {cardSide === 'both' ? (
                  <div className="w-full grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-2 items-center relative">
                    {/* Front */}
                    <div className="w-full">
                      <span className="no-print text-[9px] font-mono text-on-surface-variant uppercase tracking-widest block mb-1">
                        Front
                      </span>
                      <CreditCardVisual
                        student={student}
                        settings={settings}
                        interactive={false}
                        compact={printDensity !== 'standard'}
                        printDensity={printDensity === 'standard' ? 'compact' : printDensity}
                        hideMetricsRail={true}
                        forceSide="front"
                      />
                    </div>

                    {/* Back (Side-by-side with vertical fold line for compact A4 printing) */}
                    <div className="w-full md:pl-2 print:pl-1.5 md:border-l print:border-l border-dashed border-outline-variant print:border-slate-400">
                      <span className="no-print text-[9px] font-mono text-on-surface-variant uppercase tracking-widest block mb-1">
                        Back (Fold along center dashed line)
                      </span>
                      <CreditCardVisual
                        student={student}
                        settings={settings}
                        interactive={false}
                        compact={printDensity !== 'standard'}
                        printDensity={printDensity === 'standard' ? 'compact' : printDensity}
                        hideMetricsRail={true}
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
                      compact={printDensity !== 'standard'}
                      printDensity={printDensity}
                      hideMetricsRail={true}
                      forceSide={cardSide}
                    />
                  </div>
                )}

                {/* Cutout guideline footer (only in standard mode or screen preview so compact print fits 10-15 cards per A4 page) */}
                {printDensity === 'standard' && (
                  <div className="mt-2 flex items-center justify-between w-full text-[9px] text-on-surface-variant font-mono px-1 pt-1.5 border-t border-outline-variant/20 print:border-slate-300">
                    <span className="flex items-center gap-1">
                      <Scissors className="w-2.5 h-2.5 text-on-surface-variant" /> Trim edge
                    </span>
                    <span>
                      {student.studentIdNumber} • CVV: {student.cvv}
                    </span>
                    <span>{settings.schoolName || 'Oxford English Academy'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
