import React, { useState } from 'react';
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
  RotateCcw,
  Pin,
  PinOff,
  Menu,
  ChevronRight,
  Minus,
  Square,
  X as CloseIcon
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
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const isDark = theme === 'dark';

  // Calculate cohort metrics
  const activeStudents =
    selectedClassId === 'all'
      ? students
      : students.filter((s) => s.classId === selectedClassId);

  const totalBalance = activeStudents.reduce((sum, s) => sum + s.currentBalance, 0);
  const activeClass = classrooms.find((c) => c.id === selectedClassId);
  const cohortName = activeClass ? activeClass.name : 'All Cohorts • 1st & 2nd BGU';

  // Active loan solvency rate
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
      badge: 'HOT',
    },
    {
      id: 'print',
      label: 'Print Studio',
      icon: Printer,
      badge: undefined,
    },
  ] as const;

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // @ts-ignore
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch {
      window.close();
    }
  };

  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // @ts-ignore
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    } catch (err) {
      console.warn('Minimize only works in desktop window', err);
    }
  };

  const handleMaximize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // @ts-ignore
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    } catch (err) {
      console.warn('Maximize only works in desktop window', err);
    }
  };

  const isVisible = isHovered || isPinned;

  return (
    <>
      {/* 1. Left Edge Trigger Zone (When Hidden) */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        className="fixed top-14 bottom-0 left-0 w-4 z-40 cursor-pointer pointer-events-auto"
        title="Hover to show navigation sidebar"
      />

      {/* 2. Sleek Floating Reveal Tab (Visible When Sidebar is Hidden) */}
      {!isVisible && (
        <button
          type="button"
          onMouseEnter={() => setIsHovered(true)}
          onClick={() => setIsHovered(true)}
          className={`fixed left-0 top-20 z-40 pl-1.5 pr-2.5 py-3 rounded-r-2xl border-y border-r transition-all duration-200 flex flex-col items-center gap-2 group shadow-xl ${
            isDark
              ? 'bg-[#11151f]/90 hover:bg-[#181d29] border-white/[0.12] text-slate-300 hover:text-white'
              : 'bg-white/95 hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900'
          }`}
          title="Hover or click to open sidebar"
        >
          <div className="w-2 h-2 rounded-full bg-[#42e5b0] shadow-[0_0_8px_rgba(66,229,176,0.9)] animate-pulse" />
          <Menu className="w-4 h-4 text-[#42e5b0] group-hover:scale-110 transition-transform" />
          <span className="[writing-mode:vertical-rl] text-[9px] font-mono font-bold tracking-widest uppercase opacity-75 group-hover:opacity-100">
            NAV
          </span>
        </button>
      )}

      {/* 3. The Slide-in Sidebar Surface */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          if (!isPinned) setIsHovered(false);
        }}
        className={`fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col transition-transform duration-300 ease-out no-print select-none ${
          isVisible ? 'translate-x-0' : '-translate-x-full'
        } ${
          isDark
            ? 'bg-[#0f131c]/95 backdrop-blur-2xl border-r border-white/[0.1] text-[#e6edf3] shadow-[8px_0_36px_rgba(0,0,0,0.6)]'
            : 'bg-white/95 backdrop-blur-2xl border-r border-slate-200 text-slate-900 shadow-2xl'
        }`}
      >
        {/* Top Header / Mac-WinUI Traffic Lights + Pin Button */}
        <div
          data-tauri-drag-region
          className={`h-13 flex items-center justify-between px-4 border-b select-none ${
            isDark ? 'border-white/[0.08] bg-[#0b0e14]/50' : 'border-slate-100 bg-slate-50/50'
          }`}
        >
          <div
            data-tauri-drag-region="false"
            onMouseDown={(e) => e.stopPropagation()}
            className="flex items-center gap-2 pointer-events-auto"
          >
            <button
              type="button"
              onClick={handleClose}
              className="group w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-[#E0443E]/80 shadow-[0_0_6px_rgba(255,95,86,0.35)] flex items-center justify-center transition-transform hover:scale-110"
              title="Close App"
            >
              <CloseIcon className="w-2 h-2 text-[#4c0002] opacity-0 group-hover:opacity-100 transition-opacity stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={handleMinimize}
              className="group w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]/80 shadow-[0_0_6px_rgba(255,189,46,0.35)] flex items-center justify-center transition-transform hover:scale-110"
              title="Minimize App"
            >
              <Minus className="w-2 h-2 text-[#543b00] opacity-0 group-hover:opacity-100 transition-opacity stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={handleMaximize}
              className="group w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-[#1AAB29]/80 shadow-[0_0_6px_rgba(39,201,63,0.35)] flex items-center justify-center transition-transform hover:scale-110"
              title="Maximize App"
            >
              <Square className="w-1.5 h-1.5 text-[#003810] opacity-0 group-hover:opacity-100 transition-opacity stroke-[3]" />
            </button>
            <span
              className={`ml-1.5 font-mono text-[10px] tracking-wider uppercase font-semibold ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Terminal
            </span>
          </div>

          {/* Pin Toggle */}
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setIsPinned(!isPinned)}
            className={`p-1.5 rounded-lg border transition-all ${
              isPinned
                ? 'bg-[#42e5b0]/20 text-[#42e5b0] border-[#42e5b0]/40 shadow-sm'
                : isDark
                ? 'text-slate-500 hover:text-slate-300 border-transparent hover:border-white/[0.08]'
                : 'text-slate-400 hover:text-slate-700 border-transparent hover:border-slate-200'
            }`}
            title={isPinned ? 'Sidebar pinned open (click to auto-hide)' : 'Pin sidebar open'}
          >
            {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Active Cohort Glass Card */}
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
                  className={`w-full font-display font-semibold text-xs tracking-tight bg-transparent border-none p-0 pr-5 cursor-pointer focus:outline-none truncate ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <option value="all" className={isDark ? 'bg-[#181d29] text-white' : 'bg-white text-slate-900'}>
                    All Cohorts ({students.length} Accounts)
                  </option>
                  {classrooms.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                      className={isDark ? 'bg-[#181d29] text-white' : 'bg-white text-slate-900'}
                    >
                      {c.name} ({students.filter((s) => s.classId === c.id).length})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-0 top-1 text-slate-400 pointer-events-none" />
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

            <div className="mt-1.5 flex items-center justify-between text-xs pt-1.5 border-t border-white/[0.06]">
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ESL Credit Solvency
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-[#42e5b0] border border-emerald-500/30 font-semibold font-mono">
                {solvencyRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Section Label */}
        <div className="px-4 pt-1 pb-1">
          <span
            className={`text-[10px] uppercase tracking-wider font-semibold font-mono ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            Core Navigation
          </span>
        </div>

        {/* Core Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChangeView(item.id);
                  if (!isPinned) setIsHovered(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? isDark
                      ? 'bg-emerald-500/15 text-white border border-emerald-400/30 shadow-[0_2px_12px_rgba(66,229,176,0.2)]'
                      : 'bg-emerald-600 text-white shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white border border-transparent'
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
                          ? 'bg-[#42e5b0]/25 text-[#42e5b0] border border-[#42e5b0]/40'
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
              onClick={() => {
                onOpenSettings();
                if (!isPinned) setIsHovered(false);
              }}
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
                onClick={() => {
                  onOpenRules();
                  if (!isPinned) setIsHovered(false);
                }}
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

        {/* Bottom Synchronized Ledger Card */}
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
    </>
  );
};
