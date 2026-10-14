import React from 'react';
import {
  LayoutDashboard,
  CreditCard,
  ShoppingBag,
  Printer,
  Sliders,
  Sparkles,
  Users,
  ShieldCheck,
  ChevronDown,
  BookOpen,
  Download,
  RotateCcw
} from 'lucide-react';
import { Student, Classroom } from '../types';

interface SidebarProps {
  currentView: 'teacher' | 'student' | 'print' | 'store';
  onChangeView: (view: 'teacher' | 'student' | 'print' | 'store') => void;
  students: Student[];
  classrooms?: Classroom[];
  selectedClassId?: string;
  onSelectClass?: (classId: string) => void;
  onOpenSettings: () => void;
  onOpenRules?: () => void;
  onExportData?: () => void;
  onResetData?: () => void;
  theme?: 'dark' | 'light';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  students,
  classrooms = [],
  selectedClassId = 'all',
  onSelectClass,
  onOpenSettings,
  onOpenRules,
  onExportData,
  onResetData,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  // Calculate cohort metrics
  const activeStudents =
    selectedClassId === 'all'
      ? students
      : students.filter((s) => s.classId === selectedClassId);

  const totalBalance = activeStudents.reduce((sum, s) => sum + s.currentBalance, 0);
  const activeClass = classrooms.find((c) => c.id === selectedClassId);
  const cohortName = activeClass ? activeClass.name : 'All Cohorts • 1st & 2nd BGU';

  // Active loan solvency rate (students without defaulted loans)
  const solventCount = activeStudents.filter((s) => s.cardStatus === 'active').length;
  const solvencyRate = activeStudents.length > 0
    ? Math.round((solventCount / activeStudents.length) * 100)
    : 100;

  const navItems = [
    {
      id: 'teacher',
      label: 'Teacher Hub',
      icon: LayoutDashboard,
      badge: `${activeStudents.length}`,
    },
    {
      id: 'student',
      label: 'Student Portal',
      icon: CreditCard,
      badge: 'Cards',
    },
    {
      id: 'store',
      label: 'School Store',
      icon: ShoppingBag,
      badge: 'v1.1',
    },
    {
      id: 'print',
      label: 'Print Studio',
      icon: Printer,
      badge: undefined,
    },
  ] as const;

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-64 z-50 flex flex-col transition-colors duration-200 no-print select-none ${
        isDark
          ? 'bg-[#11151f]/90 backdrop-blur-2xl border-r border-white/[0.08] text-[#e6edf3] shadow-[2px_0_24px_rgba(0,0,0,0.45)]'
          : 'bg-white/95 backdrop-blur-xl border-r border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      {/* 1. Window Header / Mac-WinUI Traffic Lights */}
      <div
        className={`h-12 flex items-center px-4 gap-2 border-b ${
          isDark ? 'border-white/[0.06]' : 'border-slate-100'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/60 shadow-[0_0_6px_rgba(255,95,86,0.35)] inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/60 shadow-[0_0_6px_rgba(255,189,46,0.35)] inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/60 shadow-[0_0_6px_rgba(39,201,63,0.35)] inline-block" />
        </div>
        <span
          className={`ml-2 font-mono text-[11px] tracking-wider uppercase font-semibold ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Terminal v1.1
        </span>
      </div>

      {/* 2. Active Cohort Glass Card */}
      <div className="px-3.5 py-3">
        <div
          className={`p-3 rounded-xl border transition-all ${
            isDark
              ? 'bg-[#181d29]/90 backdrop-blur-md border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.3)]'
              : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] uppercase tracking-wider font-semibold font-mono ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Active Cohort
            </span>
            <span className="w-2 h-2 rounded-full bg-[#42e5b0] shadow-[0_0_8px_rgba(66,229,176,0.7)] animate-pulse" />
          </div>

          {classrooms.length > 0 && onSelectClass ? (
            <div className="relative mt-1">
              <select
                value={selectedClassId}
                onChange={(e) => onSelectClass(e.target.value)}
                className={`w-full font-semibold text-xs tracking-tight py-1 pr-6 rounded-lg bg-transparent border-0 cursor-pointer focus:ring-0 truncate font-display ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <option value="all" className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                  All Cohorts • 1st &amp; 2nd BGU
                </option>
                {classrooms.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                    className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                  >
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-1 top-2 text-slate-400 pointer-events-none" />
            </div>
          ) : (
            <div
              className={`mt-1 font-semibold text-xs tracking-tight truncate font-display ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {cohortName}
            </div>
          )}

          <div className="mt-1.5 flex items-center justify-between text-xs pt-1 border-t border-white/[0.05]">
            <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              ESL Credit Solvency
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-[#42e5b0] border border-emerald-500/30 font-semibold font-mono">
              {solvencyRate}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Section Label */}
      <div className="px-4 pt-2 pb-1">
        <span
          className={`text-[10px] uppercase tracking-wider font-semibold font-mono ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          Core Navigation
        </span>
      </div>

      {/* 4. Core Navigation Links */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? isDark
                    ? 'bg-white/[0.1] text-white border border-white/[0.12] shadow-[0_2px_12px_rgba(0,0,0,0.3)]'
                    : 'bg-emerald-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:bg-white/[0.05] hover:text-white border border-transparent'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive
                      ? isDark
                        ? 'text-[#42e5b0]'
                        : 'text-white'
                      : 'text-slate-400 group-hover:text-[#42e5b0]'
                  }`}
                />
                <span className="font-display">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? isDark
                        ? 'bg-[#42e5b0]/20 text-[#42e5b0] border border-[#42e5b0]/30'
                        : 'bg-white/20 text-white'
                      : isDark
                      ? 'bg-white/[0.06] text-slate-400'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* System Settings & Utilities */}
        <div className="pt-2 space-y-1">
          <button
            type="button"
            onClick={onOpenSettings}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              isDark
                ? 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4 text-slate-400" />
            <span className="font-display">Classroom Protocols</span>
          </button>

          {onOpenRules && (
            <button
              type="button"
              onClick={onOpenRules}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                isDark
                  ? 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span className="font-display">Didactic Rules</span>
            </button>
          )}

          {(onExportData || onResetData) && (
            <div className="flex items-center gap-1.5 px-1 pt-1">
              {onExportData && (
                <button
                  type="button"
                  onClick={onExportData}
                  title="Export Classroom JSON Backup"
                  className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-mono flex items-center justify-center gap-1.5 transition-colors ${
                    isDark
                      ? 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <Download className="w-3 h-3 text-[#42e5b0]" />
                  <span>Backup</span>
                </button>
              )}
              {onResetData && (
                <button
                  type="button"
                  onClick={onResetData}
                  title="Reset Sample Roster"
                  className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-mono flex items-center justify-center gap-1.5 transition-colors ${
                    isDark
                      ? 'bg-white/[0.04] text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10'
                      : 'bg-slate-100 text-rose-600 hover:text-rose-700 border border-slate-200'
                  }`}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* 5. Bottom Synchronized Ledger Card */}
      <div className={`p-3.5 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
        <div
          className={`p-3 rounded-xl border flex items-center justify-between ${
            isDark
              ? 'bg-[#181d29]/80 backdrop-blur-md border-white/[0.07]'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#42e5b0] shadow-[0_0_8px_rgba(66,229,176,0.8)]" />
            <div>
              <div
                className={`text-[10px] font-bold uppercase font-mono tracking-wider ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Ledger Total
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {activeStudents.length} Active Accounts
              </div>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[#42e5b0]">
            ${totalBalance.toLocaleString()}
          </span>
        </div>
      </div>
    </aside>
  );
};
