import React from 'react';
import {
  Sun,
  Moon,
  Search,
  Sparkles,
  CreditCard,
  User,
  Award
} from 'lucide-react';
import { Student } from '../types';

interface TopHeaderProps {
  currentStudent?: Student;
  students: Student[];
  onSelectStudent: (studentId: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  title?: string;
  subtitle?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentStudent,
  students,
  onSelectStudent,
  theme,
  onToggleTheme,
  title = 'ESL Reserve Terminal',
  subtitle = 'v1.1 Edition',
}) => {
  const isDark = theme === 'dark';

  // Generate initials for avatar badge
  const getInitials = (name?: string) => {
    if (!name) return 'ES';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header
      className={`fixed top-0 left-0 lg:left-64 right-0 h-14 z-40 flex items-center justify-between px-4 sm:px-6 transition-colors duration-200 border-b no-print ${
        isDark
          ? 'bg-[#0e121b]/80 backdrop-blur-2xl border-white/[0.07] text-[#e6edf3] shadow-[0_2px_16px_rgba(0,0,0,0.35)]'
          : 'bg-white/90 backdrop-blur-md border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      {/* Left: Terminal Shell Title */}
      <div className="flex items-center gap-2.5">
        <span className="font-display font-bold text-sm sm:text-base tracking-tight truncate">
          {title}
        </span>
        <span
          className={`hidden sm:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full border ${
            isDark
              ? 'bg-white/[0.06] text-slate-300 border-white/[0.08]'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {subtitle}
        </span>
      </div>

      {/* Middle/Right: Active Cardholder Chip & Theme Toggle */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Active Cardholder Chip (Stitch Apple Wallet Chip) */}
        {currentStudent && (
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-full border transition-all text-xs ${
              isDark
                ? 'bg-[#181d29]/90 border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
                : 'bg-slate-100 border-slate-200 shadow-sm'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#00c896] to-[#42e5b0] text-[#003828] font-bold text-[10px] flex items-center justify-center font-display shrink-0">
              {getInitials(currentStudent.name)}
            </div>

            <div className="flex items-center gap-1.5 max-w-[140px] sm:max-w-[200px] truncate">
              <span className="font-semibold truncate">{currentStudent.name}</span>
              <span className="text-[10px] font-mono font-bold text-[#42e5b0]">
                ${currentStudent.currentBalance}
              </span>
            </div>

            {students.length > 1 && (
              <select
                value={currentStudent.id}
                onChange={(e) => onSelectStudent(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                title="Switch active student"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (${s.currentBalance})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* ☀️ / 🌙 Instant Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${
            isDark
              ? 'bg-[#181d29] hover:bg-[#212736] text-amber-300 border-white/[0.08]'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
          }`}
          title={isDark ? 'Switch to Light Mode (Projector Mode)' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
