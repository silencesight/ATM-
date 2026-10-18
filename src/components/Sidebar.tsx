import React, { useState } from 'react';
import {
  CreditCard,
  GraduationCap,
  BookOpen,
  RotateCcw,
  Settings,
  Printer,
  ShoppingBag,
  Sun,
  Moon,
  Pin,
  PinOff,
  Landmark,
  LayoutDashboard,
  Sparkles,
  BarChart3,
  Database,
  FolderKanban,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Classroom } from '../types';

export type ActiveAppView = 'teacher' | 'student' | 'store' | 'grants' | 'print';

interface SidebarProps {
  activeView: ActiveAppView;
  onSelectView: (view: ActiveAppView) => void;
  studentsCount: number;
  activeLoansCount: number;
  pendingReviewsCount: number;
  storeItemsCount: number;
  onOpenSettings: () => void;
  onOpenRules: () => void;
  onResetDemo: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  classrooms?: Classroom[];
  selectedClassFilter?: string;
  onSelectClassFilter?: (filter: string) => void;
  totalCirculation?: number;
  schoolName?: string;
  onOpenClassManager?: () => void;
  onOpenBackup?: () => void;
  onOpenReports?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  studentsCount,
  activeLoansCount,
  pendingReviewsCount,
  storeItemsCount,
  onOpenSettings,
  onOpenRules,
  onResetDemo,
  theme,
  onToggleTheme,
  classrooms = [],
  selectedClassFilter = 'all',
  onSelectClassFilter,
  totalCirculation = 0,
  schoolName = 'Oxford English Academy',
  onOpenClassManager,
  onOpenBackup,
  onOpenReports,
}) => {
  const [isPinned, setIsPinned] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = isPinned || isHovered;

  const navItems: {
    id: ActiveAppView;
    label: string;
    sublabel: string;
    icon: React.FC<{ className?: string }>;
    badge?: number | string;
    badgeTone?: 'cyan' | 'emerald' | 'amber';
  }[] = [
    {
      id: 'teacher',
      label: 'Teacher Hub',
      sublabel: 'Ledger & Cohort Control',
      icon: LayoutDashboard,
      badge: pendingReviewsCount > 0 ? `${pendingReviewsCount} due` : activeLoansCount > 0 ? activeLoansCount : undefined,
      badgeTone: pendingReviewsCount > 0 ? 'amber' : 'cyan',
    },
    {
      id: 'student',
      label: 'Student Portal',
      sublabel: 'Virtual Card & Advances',
      icon: CreditCard,
      badge: studentsCount,
      badgeTone: 'cyan',
    },
    {
      id: 'store',
      label: 'School Store',
      sublabel: 'Privileges & Point of Sale',
      icon: ShoppingBag,
      badge: storeItemsCount,
      badgeTone: 'emerald',
    },
    {
      id: 'grants',
      label: 'Discretionary Grants',
      sublabel: 'Award Daily Eurodollars',
      icon: Sparkles,
      badge: 'E$',
      badgeTone: 'emerald',
    },
    {
      id: 'print',
      label: 'Print Studio',
      sublabel: 'Physical SmartPass Cutouts',
      icon: Printer,
    },
  ];

  const handleWindowClose = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch {
      window.close();
    }
  };

  const handleWindowMinimize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    } catch {
      // Browser environment fallback
    }
  };

  const handleWindowMaximize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    } catch {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  };

  return (
    <>
      <div
        className={`no-print shrink-0 transition-all duration-300 ease-out ${
          isPinned ? 'w-64' : 'w-[72px]'
        }`}
      />

      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`no-print fixed top-0 left-0 bottom-0 z-50 flex flex-col justify-between transition-all duration-300 ease-out select-none glass-panel border-r border-outline-variant/25 ${
          isExpanded ? 'w-64' : 'w-[72px]'
        }`}
      >
        {/* Top Section: Window Chrome + Brand + Cohort Selector */}
        <div className="p-4 space-y-4 overflow-y-auto overflow-x-hidden flex-1">
          {/* Window Controls + Pin Action */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleWindowClose}
                title="Close Application"
                aria-label="Close Application"
                className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/60 shadow-inner hover:brightness-110 transition-all cursor-pointer"
              />
              <button
                type="button"
                onClick={handleWindowMinimize}
                title="Minimize Window"
                aria-label="Minimize Window"
                className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/60 shadow-inner hover:brightness-110 transition-all cursor-pointer"
              />
              <button
                type="button"
                onClick={handleWindowMaximize}
                title="Maximize / Fullscreen Window"
                aria-label="Maximize Window"
                className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/60 shadow-inner hover:brightness-110 transition-all cursor-pointer"
              />
            </div>
            {isExpanded && (
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                title={isPinned ? 'Unpin sidebar (auto-collapse)' : 'Pin sidebar open'}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest glass-well text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {isPinned ? <Pin className="w-3 h-3 text-primary-container" /> : <PinOff className="w-3 h-3" />}
                <span>{isPinned ? 'Pinned' : 'Auto'}</span>
              </button>
            )}
          </div>

          {/* Brand Header */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center shadow-lg shadow-primary-container/20 specular-edge shrink-0">
              <Landmark className="w-5 h-5 text-on-primary-fixed" />
            </div>
            <div
              className={`min-w-0 transition-all duration-200 ${
                isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none w-0'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <h1 className="font-headline font-bold text-base tracking-tight text-on-surface leading-none truncate">
                  ESL Reserve
                </h1>
                <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-primary-container/15 text-primary-container border border-primary-container/30 font-bold">
                  AeroOS
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant font-medium mt-1 truncate">
                {schoolName || 'Micro-Bank Terminal'}
              </p>
            </div>
          </div>

          {/* Active Session / Cohort Selector (when expanded) */}
          {isExpanded && onSelectClassFilter && (
            <div className="glass-well rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant font-semibold">
                  Active Cohort
                </span>
                {onOpenClassManager && (
                  <button
                    type="button"
                    onClick={onOpenClassManager}
                    className="text-[10px] font-mono text-primary-container hover:underline flex items-center gap-0.5"
                    title="Manage Classrooms & Rosters"
                  >
                    <FolderKanban className="w-3 h-3" />
                    <span>Manage</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  aria-label="Active Cohort Filter"
                  value={selectedClassFilter}
                  onChange={(e) => onSelectClassFilter(e.target.value)}
                  className="w-full text-xs font-headline font-bold bg-surface-container-low/80 text-on-surface rounded-lg px-2.5 py-1.5 border border-outline-variant/30 focus:outline-none focus:border-primary-container transition-colors cursor-pointer"
                >
                  <option value="all">All Classrooms ({studentsCount})</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.gradeLevel ? `• ${c.gradeLevel}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Core Modules Navigation */}
          <div className="space-y-1">
            {isExpanded && (
              <p className="px-2.5 text-[10px] font-mono uppercase tracking-widest text-outline mb-1.5 font-semibold">
                Core Modules
              </p>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectView(item.id)}
                  title={!isExpanded ? `${item.label} — ${item.sublabel}` : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 relative group ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-container/20 via-primary-container/10 to-transparent text-on-surface border border-primary-container/40 specular-edge shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50 border border-transparent'
                  }`}
                >
                  {isActive && (
                    <div className="w-1 h-5 bg-primary-container rounded-full absolute left-1 shadow-[0_0_10px_#00f0ff]" />
                  )}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                      isActive
                        ? 'bg-primary-container text-on-primary-fixed shadow-sm shadow-primary-container/30'
                        : 'glass-well text-on-surface-variant group-hover:text-on-surface'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div
                    className={`flex-1 min-w-0 text-left transition-all duration-200 ${
                      isExpanded ? 'opacity-100' : 'opacity-0 w-0 pointer-events-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-headline font-bold text-xs truncate">{item.label}</span>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                            item.badgeTone === 'amber'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : item.badgeTone === 'emerald'
                              ? 'bg-tertiary-container/20 text-tertiary-fixed-dim border border-tertiary-container/30'
                              : 'bg-primary-container/15 text-primary-container border border-primary-container/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-on-surface-variant/80 truncate leading-tight mt-0.5">
                      {item.sublabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Governance & Didactic Controls */}
          <div className="pt-2 border-t border-outline-variant/20 space-y-1">
            {isExpanded && (
              <p className="px-2.5 text-[10px] font-mono uppercase tracking-widest text-outline mb-1.5 font-semibold">
                Governance &amp; Vault
              </p>
            )}

            <button
              type="button"
              onClick={onOpenRules}
              title={!isExpanded ? 'Didactic Credit Rules' : undefined}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50 transition-all"
            >
              <BookOpen className="w-4 h-4 text-tertiary-fixed-dim shrink-0" />
              {isExpanded && <span className="truncate font-medium">Didactic Credit Rules</span>}
            </button>

            {onOpenReports && (
              <button
                type="button"
                onClick={onOpenReports}
                title={!isExpanded ? 'Cohort Analytics & Reports' : undefined}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50 transition-all"
              >
                <BarChart3 className="w-4 h-4 text-primary-container shrink-0" />
                {isExpanded && <span className="truncate font-medium">Analytics &amp; Reports</span>}
              </button>
            )}

            {onOpenBackup && (
              <button
                type="button"
                onClick={onOpenBackup}
                title={!isExpanded ? 'Data Snapshots & Backup' : undefined}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50 transition-all"
              >
                <Database className="w-4 h-4 text-secondary shrink-0" />
                {isExpanded && <span className="truncate font-medium">Snapshots &amp; Backup</span>}
              </button>
            )}

            <button
              type="button"
              onClick={onOpenSettings}
              title={!isExpanded ? 'Classroom Protocols & Settings' : undefined}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50 transition-all"
            >
              <Settings className="w-4 h-4 text-on-surface-variant shrink-0" />
              {isExpanded && <span className="truncate font-medium">Classroom Protocols</span>}
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              title={!isExpanded ? (theme === 'dark' ? 'Switch to Aero Crystalline Light' : 'Switch to Prismatic Aero Dark') : undefined}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50 transition-all"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-300 shrink-0" />
              ) : (
                <Moon className="w-4 h-4 text-primary shrink-0" />
              )}
              {isExpanded && (
                <span className="truncate font-medium">
                  {theme === 'dark' ? 'Aero Crystalline (Light)' : 'Prismatic Aero (Dark)'}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onResetDemo}
              title={!isExpanded ? 'Reset Demo Data' : undefined}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              {isExpanded && <span className="truncate font-medium">Reset Demo Ledger</span>}
            </button>
          </div>
        </div>

        {/* Bottom Section: Vault Circulation & Faculty Status */}
        <div className="p-3 border-t border-outline-variant/20 space-y-2.5 bg-surface-container-lowest/40">
          {isExpanded ? (
            <div className="glass-well rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant font-bold">
                  Ledger Circulation
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-tertiary-fixed-dim font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse" />
                  LIVE
                </span>
              </div>
              <div className="text-base font-mono font-bold text-on-surface tracking-tight">
                E$ {totalCirculation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-0.5">
                <span>{studentsCount} Cardholders</span>
                <span>{activeLoansCount} Active Loans</span>
              </div>
            </div>
          ) : (
            <div
              className="w-10 h-10 mx-auto rounded-xl glass-well flex items-center justify-center text-tertiary-fixed-dim font-mono text-xs font-bold"
              title={`Ledger Circulation: E$ ${totalCirculation}`}
            >
              E$
            </div>
          )}

          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-secondary-container to-primary-container p-[1.5px] shrink-0">
              <div className="w-full h-full rounded-full bg-surface-container-lowest flex items-center justify-center text-[11px] font-bold font-mono text-primary-container">
                FA
              </div>
            </div>
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-on-surface truncate leading-tight">
                  Faculty Admin
                </p>
                <p className="text-[10px] text-tertiary-fixed-dim font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Reserve Governor
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
