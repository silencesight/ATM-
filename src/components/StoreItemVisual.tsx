import React from 'react';
import { StoreItem } from '../types';
import { BookOpen, FastForward, Star, HelpCircle, Gift, Sparkles } from 'lucide-react';

interface StoreItemVisualProps {
  iconType?: StoreItem['iconType'];
  emoji?: string;
  className?: string;
}

export const StoreItemVisual: React.FC<StoreItemVisualProps> = ({
  iconType = 'custom',
  emoji,
  className = 'w-full h-32',
}) => {
  if (emoji && emoji.trim()) {
    return (
      <div
        className={`relative flex items-center justify-center bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-indigo-500/10 rounded-2xl border border-slate-200/80 p-2 overflow-hidden shadow-inner ${className}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)]" />
        <span
          className="text-5xl sm:text-6xl drop-shadow-md select-none transform hover:scale-110 transition-transform duration-200 leading-none"
          role="img"
          aria-label="Item emoji"
        >
          {emoji.trim()}
        </span>
      </div>
    );
  }

  switch (iconType) {
    case 'skip-hw':
      return (
        <div className={`relative flex items-center justify-center bg-amber-50/10 rounded-lg p-2 ${className}`}>
          {/* Open notebook with green cover and skip >> icon */}
          <div className="relative w-28 h-20 flex items-center justify-center">
            {/* Left page */}
            <div className="absolute left-1 w-12 h-16 bg-emerald-100/90 rounded-l border-2 border-emerald-600 shadow-sm -rotate-6 transform origin-bottom-right" />
            {/* Right page */}
            <div className="absolute right-1 w-12 h-16 bg-amber-50 rounded-r border-2 border-amber-300 shadow-sm rotate-6 transform origin-bottom-left flex flex-col justify-center px-1 space-y-1">
              <div className="h-1 bg-amber-200 rounded w-3/4" />
              <div className="h-1 bg-amber-200 rounded w-1/2" />
              <div className="h-1 bg-amber-200 rounded w-4/5" />
            </div>
            {/* Spine */}
            <div className="absolute w-2 h-16 bg-emerald-700 rounded-sm z-10" />
            {/* Fast forward >> overlay */}
            <div className="absolute z-20 flex items-center justify-center bg-slate-950/85 text-emerald-400 rounded-full p-2 border border-emerald-500/60 shadow-lg right-2">
              <FastForward className="w-5 h-5 fill-emerald-400" />
            </div>
          </div>
        </div>
      );

    case 'skip-lesson':
      return (
        <div className={`relative flex items-center justify-center bg-emerald-950/20 rounded-lg p-2 ${className}`}>
          {/* Classroom blackboard with teacher & >> */}
          <div className="relative w-28 h-20 bg-emerald-900 border-4 border-amber-800 rounded-md shadow-md flex items-center justify-center overflow-hidden">
            {/* Chalkboard lines */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]" />
            {/* Teacher silhouette with pointer */}
            <div className="absolute right-1.5 bottom-1 flex flex-col items-center opacity-85">
              <div className="w-4 h-4 rounded-full bg-amber-200 border border-amber-400" />
              <div className="w-6 h-7 bg-slate-800 rounded-t-lg -mt-0.5" />
              <div className="absolute -left-3 top-2 w-5 h-0.5 bg-amber-200 -rotate-45" />
            </div>
            {/* Skip icon >> on blackboard */}
            <div className="z-10 text-white flex items-center drop-shadow-md left-3 absolute">
              <FastForward className="w-7 h-7 fill-white stroke-white" />
            </div>
          </div>
        </div>
      );

    case 'extra-points-hw':
    case 'extra-points-lss':
      return (
        <div className={`relative flex items-center justify-center bg-amber-950/10 rounded-lg p-2 ${className}`}>
          {/* Three golden stars */}
          <div className="flex items-center gap-2">
            <div className="text-amber-400 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
              <Star className="w-8 h-8 fill-amber-400 stroke-amber-500" />
            </div>
            <div className="text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.7)] -translate-y-1 scale-110">
              <Star className="w-10 h-10 fill-amber-400 stroke-amber-500" />
            </div>
            <div className="text-amber-400 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
              <Star className="w-8 h-8 fill-amber-400 stroke-amber-500" />
            </div>
          </div>
        </div>
      );

    case 'half-lesson':
      return (
        <div className={`relative flex items-center justify-center bg-sky-950/20 rounded-lg p-2 ${className}`}>
          {/* Multi-colored LESSONS badge split */}
          <div className="flex flex-col items-center">
            <div className="text-base font-black tracking-widest uppercase flex gap-1 font-mono">
              <span className="text-amber-400">L</span>
              <span className="text-sky-400">E</span>
              <span className="text-red-400">S</span>
              <span className="text-emerald-400">S</span>
              <span className="text-purple-400">O</span>
              <span className="text-orange-400">N</span>
              <span className="text-cyan-400">S</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-2 py-0.5 bg-amber-500/30 text-amber-300 text-[10px] font-bold uppercase rounded border border-amber-500/40">
                ½ Period
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Early Pass</span>
            </div>
          </div>
        </div>
      );

    case 'lucky-draw':
      return (
        <div className={`relative flex items-center justify-center bg-purple-950/20 rounded-lg p-2 ${className}`}>
          {/* Colorful spinner wheel */}
          <div className="relative w-20 h-20 rounded-full border-4 border-amber-400 shadow-lg overflow-hidden flex items-center justify-center animate-[spin_12s_linear_infinite]">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'conic-gradient(#ef4444 0deg 45deg, #f59e0b 45deg 90deg, #10b981 90deg 135deg, #06b6d4 135deg 180deg, #3b82f6 180deg 225deg, #8b5cf6 225deg 270deg, #ec4899 270deg 315deg, #eab308 315deg 360deg)',
              }}
            />
            {/* Center star hub */}
            <div className="absolute w-6 h-6 rounded-full bg-slate-900 border-2 border-amber-300 z-10 flex items-center justify-center text-amber-300 shadow-md">
              <Star className="w-3.5 h-3.5 fill-amber-300" />
            </div>
          </div>
          {/* Pointer needle */}
          <div className="absolute top-2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-amber-300 drop-shadow z-20" />
        </div>
      );

    case 'super-mini-prize':
      return (
        <div className={`relative flex items-center justify-center bg-pink-950/20 rounded-lg p-2 ${className}`}>
          {/* Open box with bursting stars */}
          <div className="relative flex flex-col items-center">
            <div className="flex gap-1 text-amber-300 -mb-1 animate-bounce">
              <Star className="w-3.5 h-3.5 fill-amber-300" />
              <Sparkles className="w-4 h-4 text-pink-400" />
              <Star className="w-3.5 h-3.5 fill-amber-300" />
            </div>
            <div className="w-16 h-14 border-2 border-slate-300 rounded-md bg-slate-900 flex items-center justify-center shadow-md relative overflow-hidden">
              <div className="w-full h-2 bg-pink-500 absolute top-0" />
              <Gift className="w-7 h-7 text-pink-400" />
            </div>
          </div>
        </div>
      );

    case 'mini-prize':
      return (
        <div className={`relative flex items-center justify-center bg-slate-950/40 rounded-lg p-2 ${className}`}>
          {/* Black Mystery Isometric Cube with question marks */}
          <div className="relative w-16 h-16 bg-slate-950 border-2 border-slate-700 rounded-lg shadow-xl flex items-center justify-center transform rotate-6 hover:rotate-0 transition-transform">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black rounded-md" />
            <span className="relative z-10 text-white font-mono font-black text-2xl drop-shadow">
              ?
            </span>
            <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-slate-500 opacity-60" />
            <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-slate-500 opacity-60" />
          </div>
        </div>
      );

    case 'big-prize':
      return (
        <div className={`relative flex items-center justify-center bg-indigo-950/30 rounded-lg p-2 ${className}`}>
          {/* 3D Purple Glowing Mystery Cube */}
          <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-600 to-purple-900 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center border border-purple-400/50 transform -rotate-6 hover:rotate-0 transition-transform">
            <div className="absolute inset-1 rounded-lg border border-purple-300/30" />
            <HelpCircle className="w-9 h-9 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </div>
        </div>
      );

    default:
      return (
        <div className={`flex items-center justify-center bg-slate-950 rounded-lg p-2 ${className}`}>
          <Gift className="w-10 h-10 text-amber-400" />
        </div>
      );
  }
};
