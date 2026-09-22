import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, CreditCard } from 'lucide-react';

const appWindow = getCurrentWindow();

export const Titlebar: React.FC = () => {
  return (
    <div 
      data-tauri-drag-region 
      className="h-9 select-none flex justify-between items-center bg-[#090e17] border-b border-slate-800/60 sticky top-0 z-[1000] w-full"
    >
      <div 
        data-tauri-drag-region 
        className="flex items-center gap-2 pl-3 text-emerald-500 font-mono text-xs font-bold uppercase tracking-wider pointer-events-none"
      >
        <CreditCard className="w-4 h-4" />
        DIDACTIC ESL ATM
      </div>

      <div className="flex h-full">
        <button
          onClick={() => appWindow.minimize().catch(e => alert(String(e)))}
          className="px-4 h-full flex items-center justify-center text-slate-400 hover:bg-slate-800 transition-colors"
          title="Minimize"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => appWindow.toggleMaximize().catch(e => alert(String(e)))}
          className="px-4 h-full flex items-center justify-center text-slate-400 hover:bg-slate-800 transition-colors"
          title="Maximize"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => appWindow.close().catch(e => alert(String(e)))}
          className="px-4 h-full flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
