import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  User,
  Shuffle,
  Check,
  CreditCard,
  Sparkles,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';
import { Student } from '../types';
import { getCreditTier } from '../utils/creditCalculator';

export interface StudentSelectorNavProps {
  students: Student[];
  selectedStudentId: string;
  onSelectStudent: (studentId: string) => void;
  label?: string; // e.g. "Shopper", "Viewing", "Student"
  variant?: 'store' | 'navbar' | 'section' | 'modal';
  showBalance?: boolean;
  showCreditScore?: boolean;
  showClassFilter?: boolean;
  showShuffle?: boolean;
  className?: string;
  disabled?: boolean;
}

export const StudentSelectorNav: React.FC<StudentSelectorNavProps> = ({
  students = [],
  selectedStudentId,
  onSelectStudent,
  label = 'Student',
  variant = 'store',
  showBalance = true,
  showCreditScore = true,
  showClassFilter = true,
  showShuffle = true,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const safeStudents = Array.isArray(students) ? students : [];
  const activeStudents = safeStudents.filter((s) => s.cardStatus === 'active');
  const currentStudent = safeStudents.find((s) => s.id === selectedStudentId) || safeStudents[0];
  const currentIndex = safeStudents.findIndex((s) => s.id === selectedStudentId);

  // Extract unique classes if any
  const availableClasses = Array.from(
    new Set(safeStudents.map((s) => s.className).filter(Boolean) as string[])
  );

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Navigate to previous student
  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (students.length <= 1) return;
    const nextIdx = currentIndex <= 0 ? students.length - 1 : currentIndex - 1;
    onSelectStudent(students[nextIdx].id);
  };

  // Navigate to next student
  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (students.length <= 1) return;
    const nextIdx = currentIndex >= students.length - 1 ? 0 : currentIndex + 1;
    onSelectStudent(students[nextIdx].id);
  };

  // Pick random student (great for classroom shopping / cold-calling)
  const handleShuffle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (students.length <= 1) return;
    const candidates = students.filter((s) => s.id !== selectedStudentId);
    const randomStudent = candidates[Math.floor(Math.random() * candidates.length)];
    if (randomStudent) {
      onSelectStudent(randomStudent.id);
    }
  };

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesQuery =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.studentIdNumber &&
        student.studentIdNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (student.cardNumber && student.cardNumber.includes(searchQuery));
    const matchesClass = selectedClass === 'all' || student.className === selectedClass;
    return matchesQuery && matchesClass;
  });

  // Shorten name if needed for compact displays
  const formatDisplayName = (name: string, maxLen = 26) => {
    if (!name) return 'Unknown';
    if (name.length <= maxLen) return name;
    return `${name.slice(0, maxLen - 2)}...`;
  };

  if (!currentStudent && students.length === 0) {
    return (
      <div className="text-xs text-slate-500 font-mono italic">No students available</div>
    );
  }

  // -------------------------------------------------------------
  // VARIANT: NAVBAR (Ultra compact for top bar)
  // -------------------------------------------------------------
  if (variant === 'navbar') {
    return (
      <div className={`relative flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 ${className}`}>
        {/* Prev Arrow */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={students.length <= 1 || disabled}
          title="Previous student"
          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 rounded transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Selected Student Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={disabled}
          className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-800 rounded text-xs font-mono text-left transition-colors max-w-[200px] sm:max-w-[260px]"
          title="Click to search and switch student"
        >
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider hidden lg:inline">
            {label}:
          </span>
          <span className="font-bold text-white truncate text-xs">
            {currentStudent ? formatDisplayName(currentStudent.name, 20) : 'Select'}
          </span>
          {showBalance && currentStudent && (
            <span className="text-emerald-400 font-bold text-[11px] shrink-0">
              E${currentStudent.currentBalance}
            </span>
          )}
        </button>

        {/* Next Arrow */}
        <button
          type="button"
          onClick={handleNext}
          disabled={students.length <= 1 || disabled}
          title="Next student"
          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 rounded transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Render Search Dropdown Modal */}
        {isOpen && renderSearchModal()}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VARIANT: STORE & SECTION (Prominent toolbar with next/prev & search)
  // -------------------------------------------------------------
  return (
    <div className={`relative w-full ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 sm:p-2 bg-slate-900/90 border border-emerald-500/30 rounded-xl shadow-inner backdrop-blur-sm">
        {/* Label & Index Indicator */}
        <div className="flex items-center gap-2 pl-2">
          <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-emerald-400">
            {label}:
          </span>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {currentIndex >= 0 ? currentIndex + 1 : 0} of {students.length}
          </span>
        </div>

        {/* Middle: Interactive Student Switcher Button */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[200px] max-w-full justify-center">
          {/* Previous Student Button */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={students.length <= 1 || disabled}
            title="Previous student (Arrow Left)"
            className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Main Search & Select Trigger */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            disabled={disabled}
            className="flex-1 flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-950 hover:bg-slate-800/90 border border-emerald-500/40 hover:border-emerald-400 rounded-lg text-left transition-all group shadow-sm overflow-hidden"
            title="Click to search students by name or ID"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="w-5 h-5 rounded-md bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-[10px] font-bold shrink-0">
                {currentStudent ? currentStudent.name.charAt(0) : '?'}
              </div>
              <div className="truncate">
                <p className="font-bold text-white text-xs sm:text-sm font-mono truncate group-hover:text-emerald-300 transition-colors">
                  {currentStudent ? currentStudent.name : 'Choose student...'}
                </p>
                {currentStudent?.className && (
                  <span className="text-[10px] text-slate-400 font-mono block leading-none">
                    {currentStudent.className}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {showBalance && currentStudent && (
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs">
                  E${currentStudent.currentBalance}
                </span>
              )}
              {showCreditScore && currentStudent && (
                <span className="hidden sm:inline text-[11px] font-mono text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-900/50">
                  {currentStudent.creditScore} pts
                </span>
              )}
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            </div>
          </button>

          {/* Next Student Button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={students.length <= 1 || disabled}
            title="Next student (Arrow Right)"
            className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Shuffle / Random Button */}
        {showShuffle && students.length > 1 && (
          <button
            type="button"
            onClick={handleShuffle}
            disabled={disabled}
            className="p-2 bg-slate-950 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-400/50 rounded-lg transition-colors shrink-0 shadow-sm flex items-center gap-1 text-xs font-mono"
            title="Select a random student (great for quick classroom turns!)"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline text-[10px] uppercase font-bold">Random</span>
          </button>
        )}
      </div>

      {/* Search Modal */}
      {isOpen && renderSearchModal()}
    </div>
  );

  // -------------------------------------------------------------
  // SEARCH & FILTER POPUP MODAL
  // -------------------------------------------------------------
  function renderSearchModal() {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div
          ref={dropdownRef}
          className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-100"
        >
          {/* Modal Header & Instant Filter Input */}
          <div className="p-4 border-b border-slate-800 bg-slate-950 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                    Select {label}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {students.length} students enrolled • Instant keyboard search
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, ID number, or card..."
                className="w-full pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Class Tabs Filter if multiple classes exist */}
            {showClassFilter && availableClasses.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setSelectedClass('all')}
                  className={`px-2.5 py-1 rounded-lg border transition-colors whitespace-nowrap ${
                    selectedClass === 'all'
                      ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({students.length})
                </button>
                {availableClasses.map((cls) => {
                  const count = students.filter((s) => s.className === cls).length;
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setSelectedClass(cls)}
                      className={`px-2.5 py-1 rounded-lg border transition-colors whitespace-nowrap ${
                        selectedClass === cls
                          ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cls} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Student List View */}
          <div className="overflow-y-auto p-2 divide-y divide-slate-800/60 flex-1 max-h-[50vh]">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <User className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-mono font-medium">
                  No students found matching &quot;{searchQuery}&quot;
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedClass('all');
                  }}
                  className="text-xs text-emerald-400 hover:underline font-mono"
                >
                  Clear search filters
                </button>
              </div>
            ) : (
              filteredStudents.map((student, idx) => {
                const isSelected = student.id === selectedStudentId;
                const tier = getCreditTier(student.creditScore);
                const isDelisted = student.cardStatus === 'delisted';

                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => {
                      onSelectStudent(student.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group ${
                      isSelected
                        ? 'bg-emerald-950/60 border border-emerald-500/60'
                        : 'hover:bg-slate-800/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar / Index indicator */}
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700 group-hover:border-emerald-500/40'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      {/* Name & Metadata */}
                      <div className="min-w-0 truncate">
                        <div className="flex items-center gap-2">
                          <p
                            className={`font-bold font-mono text-xs sm:text-sm truncate ${
                              isSelected
                                ? 'text-emerald-300'
                                : 'text-white group-hover:text-emerald-400'
                            }`}
                          >
                            {student.name}
                          </p>
                          {isDelisted && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-950 text-red-400 border border-red-800">
                              Delisted
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate flex items-center gap-1.5">
                          <span>ID: {student.studentIdNumber || 'N/A'}</span>
                          {student.className && (
                            <>
                              <span>•</span>
                              <span className="text-slate-300">{student.className}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Financial stats */}
                    <div className="flex items-center gap-2 shrink-0 ml-3 font-mono text-right">
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-emerald-400 block">
                          E${student.currentBalance}.00
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Score: <strong className={tier.badgeColor}>{student.creditScore}</strong>
                        </span>
                      </div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-700 group-hover:border-emerald-500/50" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Modal Footer with quick keyboard tips */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>
              Showing <strong className="text-white">{filteredStudents.length}</strong> of{' '}
              {students.length} students
            </span>
            <span className="text-slate-500 hidden sm:inline">Press Esc to exit</span>
          </div>
        </div>
      </div>
    );
  }
};
