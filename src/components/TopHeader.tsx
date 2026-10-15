import React from 'react';
import {
  Sun,
  Moon,
  Minus,
  Square,
  X as CloseIcon,
  Sparkles
} from 'lucide-react';

interface TopHeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  title?: string;
  subtitle?: string;
  onOpenSidebar?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  theme,
  onToggleTheme,
  title = 'ESL Reserve Terminal',
  subtitle = 'v2.1 Native Shell',
  onOpenSidebar,
}) => {
  const isDark = theme === 'dark';

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
      console.warn('Minimize only works in Tauri desktop window', err);
    }
  };

  const handleMaximize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // @ts-ignore
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    } catch (err) {
      console.warn('Maximize only works in Tauri desktop window', err);
    }
  };

  const handleStartDrag = async (e: React.MouseEvent) => {
    // Only drag on primary left button and avoid child button clicks
    if (e.button !== 0) return;
    try {
      // @ts-ignore
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().startDragging();
    } catch {
      // Running in browser
    }
  };

  const handleDoubleClickHeader = async () => {
    try {
      // @ts-ignore
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    } catch {}
  };

  return (
    <header
      data-tauri-drag-region
      onMouseDown={handleStartDrag}
      onDoubleClick={handleDoubleClickHeader}
      className={`fixed top-0 left-0 right-0 h-13 z-40 flex items-center justify-between px-3 sm:px-5 transition-colors duration-200 border-b select-none no-print cursor-default ${
        isDark
          ? 'bg-[#0e121b]/90 backdrop-blur-2xl border-white/[0.08] text-[#e6edf3] shadow-[0_2px_16px_rgba(0,0,0,0.35)]'
          : 'bg-[#f8f9ff]/90 backdrop-blur-xl border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      {/* Left: Window Traffic Light Controls + Terminal Title */}
      <div data-tauri-drag-region className="flex items-center gap-3">
        {/* macOS Traffic Lights Window Controls */}
        <div
          data-tauri-drag-region="false"
          onMouseDown={(e) => e.stopPropagation()}
          className="flex items-center gap-2 pointer-events-auto"
        >
          <button
            type="button"
            onClick={handleClose}
            className="group w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-[#E0443E]/80 shadow-[0_0_6px_rgba(255,95,86,0.35)] flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            title="Close Window"
          >
            <CloseIcon className="w-2 h-2 text-[#4c0002] opacity-0 group-hover:opacity-100 transition-opacity stroke-[3]" />
          </button>
          <button
            type="button"
            onClick={handleMinimize}
            className="group w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]/80 shadow-[0_0_6px_rgba(255,189,46,0.35)] flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            title="Minimize Window"
          >
            <Minus className="w-2 h-2 text-[#543b00] opacity-0 group-hover:opacity-100 transition-opacity stroke-[3]" />
          </button>
          <button
            type="button"
            onClick={handleMaximize}
            className="group w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-[#1AAB29]/80 shadow-[0_0_6px_rgba(39,201,63,0.35)] flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            title="Toggle Maximize"
          >
            <Square className="w-1.5 h-1.5 text-[#003810] opacity-0 group-hover:opacity-100 transition-opacity stroke-[3]" />
          </button>
        </div>

        <div className="h-4 w-px bg-white/[0.1] hidden sm:block" />

        {/* Title */}
        <div data-tauri-drag-region className="flex items-center gap-2">
          <span className="font-display font-bold text-xs sm:text-sm tracking-tight truncate">
            {title}
          </span>
          <span
            className={`hidden md:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              isDark
                ? 'bg-white/[0.06] text-slate-300 border-white/[0.08]'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {subtitle}
          </span>
        </div>
      </div>

      {/* Right: Theme Switcher & Utility */}
      <div
        data-tauri-drag-region="false"
        onMouseDown={(e) => e.stopPropagation()}
        className="flex items-center gap-2 pointer-events-auto"
      >
        {/* ☀️ / 🌙 Instant Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-mono font-semibold transition-all cursor-pointer ${
            isDark
              ? 'bg-[#181d29] hover:bg-[#212736] text-amber-300 border-white/[0.1] shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
          }`}
          title={isDark ? 'Switch to Light Mode (Projector Ready)' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline text-[11px] text-amber-200">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden sm:inline text-[11px] text-slate-700">Dark</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
