import React from 'react';
import {
  CreditCard,
  Minus,
  Square,
  X,
  Sun,
  Moon,
  Sparkles,
  ShieldCheck,
  Search,
  Printer,
  ShoppingBag,
  LayoutDashboard,
} from 'lucide-react';
import { Student, TeacherSettings } from '../types';
import { StudentSelectorNav } from './StudentSelectorNav';
import { ActiveAppView } from './Sidebar';

interface TopHeaderProps {
  activeView: ActiveAppView;
  onSelectView?: (view: ActiveAppView) => void;
  students: Student[];
  selectedStudentId: string;
  onSelectStudent: (id: string) => void;
  settings: TeacherSettings;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeView,
  onSelectView,
  students,
  selectedStudentId,
  onSelectStudent,
  settings,
  theme = 'dark',
  onToggleTheme,
}) => {
  const activeCount = students.filter((s) => s.cardStatus === 'active').length;

  const isTauri =
    typeof window !== 'undefined' &&
    ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

  const handleMinimize = async () => {
    if (!isTauri) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    } catch {
      // ignore if outside Tauri
    }
  };

  const handleToggleMaximize = async () => {
    if (!isTauri) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    } catch {
      // ignore if outside Tauri
    }
  };

  const handleClose = async () => {
    if (!isTauri) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch {
      // ignore if outside Tauri
    }
  };

  const handleStartDrag = async (e: React.MouseEvent<HTMLElement>) => {
    if (!isTauri || e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, select, input, a, [data-no-drag]')) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().startDragging();
    } catch {
      // ignore if outside Tauri
    }
  };

  const viewMeta: Record<ActiveAppView, { badge: string; title: string; subtitle: string }> = {
    teacher: {
      badge: 'DIDACTIC TREASURY TERMINAL',
      title: 'Teacher Hub & Classroom Ledger',
      subtitle: settings.classroomTitle || 'ESL Financial Literacy & Micro-Banking',
    },
    student: {
      badge: 'VIRTUAL INSTRUMENT PORTAL',
      title: 'Student SmartPass & Credit Telemetry',
      subtitle: 'Real-time balance, task-based loan settlement & credit tier progression',
    },
    store: {
      badge: 'PRIVILEGE TREASURY & POS',
      title: 'School Store & Classroom Privileges',
      subtitle: 'Redeem Eurodollars for academic perks, passes, and classroom privileges',
    },
    grants: {
      badge: 'FACULTY DISCRETIONARY RESERVE',
      title: 'Award Daily English Eurodollars',
      subtitle: 'Instant liquidity grants & merit adjustments for active English participation',
    },
    print: {
      badge: 'PHYSICAL CARD ISSUANCE',
      title: 'SmartPass Print Studio',
      subtitle: 'Front & back folding credit card cutouts for classroom wallets',
    },
  };

  const currentMeta = viewMeta[activeView] || viewMeta.teacher;

  return (
    <header
      data-tauri-drag-region
      onMouseDown={handleStartDrag}
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest('button, select, input, a, [data-no-drag]')) return;
        handleToggleMaximize();
      }}
      className="no-print sticky top-0 z-40 h-16 px-4 sm:px-8 flex items-center justify-between gap-4 select-none glass-panel !bg-background/90 backdrop-blur-2xl border-b border-outline-variant/25"
    >
      {/* Left: Active Terminal Breadcrumb & View Title */}
      <div className="flex items-center gap-3 min-w-0" data-tauri-drag-region>
        <div
          className="w-9 h-9 rounded-xl glass-pill flex items-center justify-center text-primary-container shrink-0 specular-edge"
          data-tauri-drag-region
        >
          <CreditCard className="w-4 h-4 pointer-events-none" />
        </div>
        <div className="min-w-0" data-tauri-drag-region>
          <div className="flex items-center gap-2" data-tauri-drag-region>
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary-container font-bold">
              {currentMeta.badge}
            </span>
            <span className="hidden md:inline-block text-outline">•</span>
            <span className="hidden md:inline-block text-[11px] font-mono text-on-surface-variant truncate">
              {settings.schoolName || 'Oxford English Academy'}
            </span>
          </div>
          <h2
            className="text-sm sm:text-base font-headline font-bold text-on-surface tracking-tight truncate"
            data-tauri-drag-region
          >
            {currentMeta.title}
          </h2>
        </div>
      </div>

      {/* Right: Quick View Pills, Student Selector, Live Status, Theme Toggle, Window Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Quick Module Switcher Pills on Desktop */}
        {onSelectView && (
          <div className="hidden xl:flex items-center gap-1 p-1 rounded-full glass-well">
            <button
              type="button"
              onClick={() => onSelectView('teacher')}
              className={`px-3 py-1 rounded-full text-[11px] font-headline font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'teacher'
                  ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <LayoutDashboard className="w-3 h-3" />
              <span>Hub</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectView('student')}
              className={`px-3 py-1 rounded-full text-[11px] font-headline font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'student'
                  ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <CreditCard className="w-3 h-3" />
              <span>Portal</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectView('grants')}
              className={`px-3 py-1 rounded-full text-[11px] font-headline font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'grants'
                  ? 'bg-tertiary-container text-on-tertiary-fixed shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Award E$</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectView('store')}
              className={`px-3 py-1 rounded-full text-[11px] font-headline font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'store'
                  ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <ShoppingBag className="w-3 h-3" />
              <span>Store</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectView('print')}
              className={`px-3 py-1 rounded-full text-[11px] font-headline font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'print'
                  ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Printer className="w-3 h-3" />
              <span>Print</span>
            </button>
          </div>
        )}

        {/* Quick Student Switcher when in Student, Store, or Grants View */}
        {(activeView === 'student' || activeView === 'store' || activeView === 'grants') &&
          students.length > 0 && (
            <StudentSelectorNav
              students={students}
              selectedStudentId={selectedStudentId}
              onSelectStudent={onSelectStudent}
              label={
                activeView === 'store'
                  ? 'Shopper'
                  : activeView === 'grants'
                  ? 'Recipient'
                  : 'Cardholder'
              }
              variant="navbar"
              showBalance={true}
              showCreditScore={false}
            />
          )}

        {/* Active Cardholders Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass-pill text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-tertiary-container shadow-[0_0_8px_#65f2b5]" />
          <span className="text-on-surface font-bold">{activeCount}</span>
          <span className="text-on-surface-variant text-[11px]">Active</span>
        </div>

        {/* Theme Switcher Button */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            title={
              theme === 'dark'
                ? 'Switch to Aero Crystalline Glass (Light Mode)'
                : 'Switch to Prismatic Aero Glass (Dark Mode)'
            }
            className="w-9 h-9 rounded-full glass-pill flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:border-primary-container/50 transition-all"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-primary" />
            )}
          </button>
        )}

        {/* Native Window Controls (Minimize, Maximize, Close) */}
        {isTauri && (
          <div className="flex items-center gap-1 pl-2 border-l border-outline-variant/30">
            <button
              type="button"
              onClick={handleMinimize}
              title="Minimize"
              className="w-7 h-7 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleToggleMaximize}
              title="Maximize / Restore"
              className="w-7 h-7 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleClose}
              title="Close"
              className="w-7 h-7 rounded-lg hover:bg-error-container hover:text-on-error-container flex items-center justify-center text-on-surface-variant transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
