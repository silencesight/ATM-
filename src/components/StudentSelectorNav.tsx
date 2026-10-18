import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  User,
  Shuffle,
  Check,
} from 'lucide-react';
import { Student } from '../types';
import { getCreditTier } from '../utils/creditCalculator';

export interface StudentSelectorNavProps {
  students: Student[];
  selectedStudentId: string;
  onSelectStudent: (studentId: string) => void;
  label?: string;
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
  const currentStudent =
    safeStudents.find((s) => s.id === selectedStudentId) || safeStudents[0];
  const currentIndex = safeStudents.findIndex((s) => s.id === selectedStudentId);

  const availableClasses = Array.from(
    new Set(safeStudents.map((s) => s.className).filter(Boolean) as string[])
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

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

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (safeStudents.length <= 1) return;
    const nextIdx = currentIndex <= 0 ? safeStudents.length - 1 : currentIndex - 1;
    onSelectStudent(safeStudents[nextIdx].id);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (safeStudents.length <= 1) return;
    const nextIdx = currentIndex >= safeStudents.length - 1 ? 0 : currentIndex + 1;
    onSelectStudent(safeStudents[nextIdx].id);
  };

  const handleShuffle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (safeStudents.length <= 1) return;
    const candidates = safeStudents.filter((s) => s.id !== selectedStudentId);
    const randomStudent = candidates[Math.floor(Math.random() * candidates.length)];
    if (randomStudent) {
      onSelectStudent(randomStudent.id);
    }
  };

  const filteredStudents = safeStudents.filter((student) => {
    const matchesQuery =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.studentIdNumber &&
        student.studentIdNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (student.cardNumber && student.cardNumber.includes(searchQuery));
    const matchesClass = selectedClass === 'all' || student.className === selectedClass;
    return matchesQuery && matchesClass;
  });

  const formatDisplayName = (name: string, maxLen = 26) => {
    if (!name) return 'Unknown';
    if (name.length <= maxLen) return name;
    return `${name.slice(0, maxLen - 2)}...`;
  };

  if (!currentStudent && safeStudents.length === 0) {
    return (
      <div className="text-xs text-on-surface-variant font-mono italic">
        No students available
      </div>
    );
  }

  // VARIANT: NAVBAR (Compact Liquid Pill for TopHeader)
  if (variant === 'navbar') {
    return (
      <div
        className={`relative flex items-center gap-1 glass-pill rounded-full p-1 ${className}`}
      >
        <button
          type="button"
          onClick={handlePrev}
          disabled={safeStudents.length <= 1 || disabled}
          title="Previous student"
          className="p-1.5 text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container-high/60 rounded-full transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={disabled}
          className="flex items-center gap-2 px-2.5 py-1 hover:bg-surface-container-high/50 rounded-full text-xs font-mono text-left transition-colors max-w-[200px] sm:max-w-[260px]"
          title="Click to search and switch student"
        >
          <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider hidden lg:inline">
            {label}:
          </span>
          <span className="font-bold text-on-surface truncate text-xs font-headline">
            {currentStudent ? formatDisplayName(currentStudent.name, 18) : 'Select'}
          </span>
          {showBalance && currentStudent && (
            <span className="text-tertiary-fixed-dim font-bold text-[11px] shrink-0">
              E$ {currentStudent.currentBalance}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={safeStudents.length <= 1 || disabled}
          title="Next student"
          className="p-1.5 text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container-high/60 rounded-full transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {isOpen && renderSearchModal()}
      </div>
    );
  }

  // VARIANT: STORE & SECTION (Refractive Student Switcher Ribbon)
  return (
    <div className={`relative w-full ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 glass-panel rounded-2xl specular-edge">
        {/* Left: Label & Cohort Index */}
        <div className="flex items-center gap-2.5 pl-2">
          <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-primary-container">
            {label}
          </span>
          <span className="text-[11px] font-mono text-on-surface-variant glass-well px-2.5 py-1 rounded-full font-bold">
            {currentIndex >= 0 ? currentIndex + 1 : 0} of {safeStudents.length}
          </span>
        </div>

        {/* Center: Prev / Student Master Identity Pill / Next */}
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-2xl justify-center">
          <button
            type="button"
            onClick={handlePrev}
            disabled={safeStudents.length <= 1 || disabled}
            title="Previous student"
            className="w-9 h-9 glass-pill hover:border-primary-container/50 text-on-surface-variant hover:text-on-surface rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            disabled={disabled}
            className="flex-1 flex items-center justify-between gap-3 px-3.5 py-2 glass-well hover:border-primary-container/50 rounded-xl text-left transition-all group overflow-hidden"
            title="Click to search students by name, ID, or card number"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center text-on-primary-fixed text-xs font-bold font-mono shrink-0 shadow-sm">
                {currentStudent ? currentStudent.name.charAt(0) : '?'}
              </div>
              <div className="truncate">
                <p className="font-bold text-on-surface text-xs sm:text-sm font-headline truncate group-hover:text-primary-container transition-colors">
                  {currentStudent ? currentStudent.name : 'Choose student...'}
                </p>
                <p className="text-[10px] text-on-surface-variant font-mono truncate">
                  ID: {currentStudent?.studentIdNumber || 'N/A'}
                  {currentStudent?.className ? ` • ${currentStudent.className}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {showBalance && currentStudent && (
                <span className="px-2.5 py-1 rounded-lg bg-tertiary-container/15 border border-tertiary-container/30 text-tertiary-fixed-dim font-mono font-bold text-xs">
                  E$ {currentStudent.currentBalance}
                </span>
              )}
              {showCreditScore && currentStudent && (
                <span className="hidden sm:inline text-[11px] font-mono text-primary-container bg-primary-container/10 px-2 py-1 rounded-lg border border-primary-container/25 font-bold">
                  {currentStudent.creditScore} pts
                </span>
              )}
              <Search className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary-container transition-colors" />
            </div>
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={safeStudents.length <= 1 || disabled}
            title="Next student"
            className="w-9 h-9 glass-pill hover:border-primary-container/50 text-on-surface-variant hover:text-on-surface rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Random Draw Button */}
        {showShuffle && safeStudents.length > 1 && (
          <button
            type="button"
            onClick={handleShuffle}
            disabled={disabled}
            className="px-3 py-2 glass-pill hover:border-primary-container/50 text-on-surface hover:text-primary-container rounded-xl transition-all shrink-0 flex items-center gap-1.5 text-xs font-mono font-bold"
            title="Select a random student from the roster"
          >
            <Shuffle className="w-3.5 h-3.5 text-primary-container" />
            <span className="hidden md:inline text-[10px] uppercase tracking-wider">
              Random Draw
            </span>
          </button>
        )}
      </div>

      {isOpen && renderSearchModal()}
    </div>
  );

  function renderSearchModal() {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div
          ref={dropdownRef}
          className="glass-panel rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-on-surface border border-outline-variant/30"
        >
          {/* Modal Header */}
          <div className="p-5 border-b border-outline-variant/20 space-y-3.5 bg-surface-container-lowest/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-container/15 border border-primary-container/30 flex items-center justify-center text-primary-container">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface font-headline">
                    Select {label}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant font-mono">
                    {safeStudents.length} enrolled cardholders • Instant search
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-xl hover:bg-surface-container-high transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, ID number, or card digits..."
                className="w-full pl-10 pr-9 py-2.5 glass-well rounded-xl text-xs sm:text-sm text-on-surface font-mono placeholder:text-outline focus:outline-none focus:border-primary-container"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Class Filter Pills */}
            {showClassFilter && availableClasses.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setSelectedClass('all')}
                  className={`px-3 py-1 rounded-full border transition-all whitespace-nowrap ${
                    selectedClass === 'all'
                      ? 'bg-primary-container text-on-primary-fixed border-primary-container font-bold'
                      : 'glass-well text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All ({safeStudents.length})
                </button>
                {availableClasses.map((cls) => {
                  const count = safeStudents.filter((s) => s.className === cls).length;
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setSelectedClass(cls)}
                      className={`px-3 py-1 rounded-full border transition-all whitespace-nowrap ${
                        selectedClass === cls
                          ? 'bg-primary-container text-on-primary-fixed border-primary-container font-bold'
                          : 'glass-well text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {cls} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Student List */}
          <div className="overflow-y-auto p-3 space-y-1.5 flex-1 max-h-[50vh]">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant space-y-2">
                <User className="w-8 h-8 mx-auto text-outline" />
                <p className="text-xs font-mono font-medium">
                  No students found matching &quot;{searchQuery}&quot;
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedClass('all');
                  }}
                  className="text-xs text-primary-container hover:underline font-mono"
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
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left group ${
                      isSelected
                        ? 'bg-primary-container/15 border border-primary-container/50 specular-edge'
                        : 'hover:bg-surface-container-high/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 border ${
                          isSelected
                            ? 'bg-primary-container text-on-primary-fixed border-primary-container'
                            : 'glass-well text-on-surface-variant group-hover:border-primary-container/40'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div className="min-w-0 truncate">
                        <div className="flex items-center gap-2">
                          <p
                            className={`font-bold font-headline text-xs sm:text-sm truncate ${
                              isSelected
                                ? 'text-primary-container'
                                : 'text-on-surface group-hover:text-primary-container'
                            }`}
                          >
                            {student.name}
                          </p>
                          {isDelisted && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-error-container text-on-error-container">
                              Delisted
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface-variant font-mono truncate flex items-center gap-1.5">
                          <span>ID: {student.studentIdNumber || 'N/A'}</span>
                          {student.className && (
                            <>
                              <span>•</span>
                              <span>{student.className}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 ml-3 font-mono text-right">
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-tertiary-fixed-dim block">
                          E$ {student.currentBalance}.00
                        </span>
                        <span className="text-[10px] text-on-surface-variant block">
                          Score: <strong className={tier.badgeColor}>{student.creditScore}</strong>
                        </span>
                      </div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-primary-container text-on-primary-fixed flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-outline-variant/50 group-hover:border-primary-container/50" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-3.5 bg-surface-container-lowest/50 border-t border-outline-variant/20 flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
            <span>
              Showing <strong className="text-on-surface">{filteredStudents.length}</strong> of{' '}
              {safeStudents.length} students
            </span>
            <span className="hidden sm:inline">Press Esc to close</span>
          </div>
        </div>
      </div>
    );
  }
};
