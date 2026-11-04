import React, { useState, useMemo } from 'react';
import { StoreItem, StoreRedemptionAllocation } from '../types';
import {
  X,
  Calendar,
  FileText,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Layers,
} from 'lucide-react';

export interface StoreRedemptionRequirement {
  mode: 'skip' | 'points';
  targetLabel: 'Homework' | 'Lesson';
  pointsPerUnit: number;
}

export function getStoreRedemptionRequirement(
  item: Pick<StoreItem, 'name' | 'iconType' | 'subtitle'>
): StoreRedemptionRequirement | null {
  const lowerName = (item.name || '').toLowerCase();
  const lowerSub = (item.subtitle || '').toLowerCase();

  if (item.iconType === 'skip-lesson' || item.iconType === 'half-lesson') {
    return null;
  }

  if (
    item.iconType === 'skip-hw' ||
    lowerName.includes('skip homework') ||
    lowerName.includes('skip hw') ||
    (lowerName.includes('skip') && (lowerName.includes('homework') || lowerName.includes('hw')))
  ) {
    return { mode: 'skip', targetLabel: 'Homework', pointsPerUnit: 0 };
  }

  if (
    item.iconType === 'extra-points-hw' ||
    item.iconType === 'extra-points-lss' ||
    lowerName.includes('extra point') ||
    lowerName.includes('points in')
  ) {
    const numMatch = (item.name || '').match(/(\d+)/);
    const pointsPerUnit = numMatch ? Math.max(1, parseInt(numMatch[1], 10)) : 3;
    const isHomework =
      item.iconType === 'extra-points-hw' ||
      lowerName.includes('hw') ||
      lowerName.includes('homework') ||
      lowerSub.includes('homework');
    const isLesson =
      item.iconType === 'extra-points-lss' ||
      lowerName.includes('lss') ||
      lowerName.includes('lesson') ||
      lowerSub.includes('lesson');

    return {
      mode: 'points',
      targetLabel: isHomework && !isLesson ? 'Homework' : 'Lesson',
      pointsPerUnit,
    };
  }

  return null;
}

export function formatStoreAllocationsSummary(allocations?: StoreRedemptionAllocation[]): string {
  if (!allocations || allocations.length === 0) return '';
  return allocations
    .map((a) => {
      const pts = a.pointsAllocated ? `+${a.pointsAllocated} pt${a.pointsAllocated > 1 ? 's' : ''} on ` : '';
      return `${pts}"${a.targetName}" (${a.targetDate})`;
    })
    .join(' • ');
}

interface StoreRedemptionConfigModalProps {
  item: StoreItem;
  quantity?: number;
  initialAllocations?: StoreRedemptionAllocation[];
  onConfirm: (allocations: StoreRedemptionAllocation[], quantity: number) => void;
  onClose: () => void;
}

export function reconcileStoreAllocations(
  item: Pick<StoreItem, 'name' | 'iconType' | 'subtitle'>,
  quantity: number,
  initialAllocations?: StoreRedemptionAllocation[],
  defaultDateStr?: string
): StoreRedemptionAllocation[] {
  const requirement = getStoreRedemptionRequirement(item);
  if (!requirement) return [];
  const todayStr = defaultDateStr || new Date().toISOString().split('T')[0];
  const safeQty = Math.max(1, quantity);

  if (requirement.mode === 'skip') {
    return Array.from({ length: safeQty }, (_, idx) => ({
      targetName: initialAllocations?.[idx]?.targetName || '',
      targetDate: initialAllocations?.[idx]?.targetDate || todayStr,
    }));
  }

  const totalPoints = requirement.pointsPerUnit * safeQty;
  if (!initialAllocations || initialAllocations.length <= 1) {
    return [
      {
        targetName: initialAllocations?.[0]?.targetName || '',
        targetDate: initialAllocations?.[0]?.targetDate || todayStr,
        pointsAllocated: totalPoints,
      },
    ];
  }

  // Split mode with > 1 existing rows
  const trimmed = initialAllocations.slice(0, totalPoints).map((row) => ({
    targetName: row.targetName || '',
    targetDate: row.targetDate || todayStr,
    pointsAllocated: Math.max(1, Number(row.pointsAllocated) || 1),
  }));
  const currentSum = trimmed.reduce((s, r) => s + (r.pointsAllocated || 1), 0);
  if (currentSum < totalPoints) {
    trimmed[trimmed.length - 1].pointsAllocated =
      (trimmed[trimmed.length - 1].pointsAllocated || 1) + (totalPoints - currentSum);
  } else if (currentSum > totalPoints) {
    let excess = currentSum - totalPoints;
    for (let i = trimmed.length - 1; i >= 0 && excess > 0; i--) {
      const canReduce = Math.max(0, (trimmed[i].pointsAllocated || 1) - 1);
      const deduct = Math.min(canReduce, excess);
      trimmed[i].pointsAllocated = (trimmed[i].pointsAllocated || 1) - deduct;
      excess -= deduct;
    }
  }
  return trimmed;
}

export const StoreRedemptionConfigModal: React.FC<StoreRedemptionConfigModalProps> = ({
  item,
  quantity = 1,
  initialAllocations,
  onConfirm,
  onClose,
}) => {
  const requirement = useMemo(() => getStoreRedemptionRequirement(item), [item]);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const totalPointsToAllocate = requirement
    ? requirement.mode === 'points'
      ? requirement.pointsPerUnit * quantity
      : 0
    : 0;

  const [splitMode, setSplitMode] = useState<'single' | 'split'>(() => {
    if (initialAllocations && initialAllocations.length > 1) return 'split';
    return 'single';
  });

  const [allocations, setAllocations] = useState<StoreRedemptionAllocation[]>(() =>
    reconcileStoreAllocations(item, quantity, initialAllocations, todayStr)
  );

  const [error, setError] = useState<string | null>(null);

  if (!requirement) return null;

  const handleSwitchSplitMode = (mode: 'single' | 'split') => {
    setSplitMode(mode);
    setError(null);
    if (mode === 'single') {
      setAllocations([
        {
          targetName: allocations[0]?.targetName || '',
          targetDate: allocations[0]?.targetDate || todayStr,
          pointsAllocated: totalPointsToAllocate,
        },
      ]);
    } else {
      // Default split into individual 1-point rows (up to 3 initially)
      const count = Math.min(totalPointsToAllocate, 3);
      const basePts = Math.floor(totalPointsToAllocate / count);
      const remainder = totalPointsToAllocate % count;
      const nextRows: StoreRedemptionAllocation[] = Array.from({ length: count }, (_, idx) => ({
        targetName: allocations[idx]?.targetName || '',
        targetDate: allocations[idx]?.targetDate || todayStr,
        pointsAllocated: basePts + (idx === 0 ? remainder : 0),
      }));
      setAllocations(nextRows);
    }
  };

  const handleUpdateRow = (index: number, patch: Partial<StoreRedemptionAllocation>) => {
    setError(null);
    setAllocations((prev) => prev.map((row, idx) => (idx === index ? { ...row, ...patch } : row)));
  };

  const handleAddSplitRow = () => {
    if (allocations.length >= totalPointsToAllocate) return;
    setError(null);
    setAllocations((prev) => [
      ...prev,
      {
        targetName: '',
        targetDate: todayStr,
        pointsAllocated: 1,
      },
    ]);
  };

  const handleRemoveSplitRow = (index: number) => {
    if (allocations.length <= 1) return;
    setError(null);
    setAllocations((prev) => prev.filter((_, idx) => idx !== index));
  };

  const currentAllocatedSum =
    requirement.mode === 'points' && splitMode === 'single'
      ? totalPointsToAllocate
      : allocations.reduce((sum, a) => sum + (Number(a.pointsAllocated) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    for (let i = 0; i < allocations.length; i++) {
      const row = allocations[i];
      if (!row.targetName.trim()) {
        setError(`Please enter the name of the ${requirement.targetLabel} for item #${i + 1}.`);
        return;
      }
      if (!row.targetDate.trim()) {
        setError(`Please select the date of the ${requirement.targetLabel} for "${row.targetName}".`);
        return;
      }
      if (
        requirement.mode === 'points' &&
        splitMode === 'split' &&
        (!row.pointsAllocated || row.pointsAllocated < 1)
      ) {
        setError(`Each ${requirement.targetLabel} entry must have at least 1 point allocated.`);
        return;
      }
    }

    if (
      requirement.mode === 'points' &&
      splitMode === 'split' &&
      currentAllocatedSum !== totalPointsToAllocate
    ) {
      setError(
        `Total allocated points (${currentAllocatedSum}) must equal exactly ${totalPointsToAllocate} points.`
      );
      return;
    }

    const cleaned = allocations.map((a) => ({
      targetName: a.targetName.trim(),
      targetDate: a.targetDate.trim(),
      ...(requirement.mode === 'points'
        ? {
            pointsAllocated:
              splitMode === 'single'
                ? totalPointsToAllocate
                : Number(a.pointsAllocated) || totalPointsToAllocate,
          }
        : {}),
    }));

    onConfirm(cleaned, quantity);
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/90 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-2xl shadow-inner">
              {item.emoji || (requirement.mode === 'skip' ? '🛡️' : '⭐')}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">
                {requirement.mode === 'skip'
                  ? `Skip ${requirement.targetLabel} Details`
                  : `Extra Points Allocation (${totalPointsToAllocate} Pts)`}
              </span>
              <h3 className="text-base font-black text-white">{item.name}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Instructions Banner */}
          <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-2xl p-3.5 text-xs text-indigo-200 leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              {requirement.mode === 'skip' ? (
                <>
                  Please write the <strong>exact name of the {requirement.targetLabel}</strong> you want to skip and pick its <strong>date</strong> so Teacher Anthony can register it upon approval.
                </>
              ) : (
                <>
                  You are getting <strong>{totalPointsToAllocate} Extra Points</strong>! Choose whether to use all {totalPointsToAllocate} points in a single {requirement.targetLabel.toLowerCase()} or split them across multiple {requirement.targetLabel.toLowerCase()}s with their dates.
                </>
              )}
            </div>
          </div>

          {/* Points Mode Selector: Single vs Split */}
          {requirement.mode === 'points' && totalPointsToAllocate > 1 && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                How do you want to use your {totalPointsToAllocate} points?
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSwitchSplitMode('single')}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                    splitMode === 'single'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-extrabold">1 {requirement.targetLabel}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Use all {totalPointsToAllocate} pts together
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchSplitMode('split')}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                    splitMode === 'split'
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-600/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-extrabold">Multiple {requirement.targetLabel}s</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Split {totalPointsToAllocate} pts across dates
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Allocation Rows */}
          <div className="space-y-3">
            {allocations.map((row, idx) => (
              <div
                key={idx}
                className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {requirement.mode === 'skip'
                      ? `${requirement.targetLabel} to Skip ${allocations.length > 1 ? `#${idx + 1}` : ''}`
                      : splitMode === 'single'
                      ? `${requirement.targetLabel} (+${totalPointsToAllocate} Points)`
                      : `${requirement.targetLabel} #${idx + 1}`}
                  </span>
                  {requirement.mode === 'points' && splitMode === 'split' && allocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSplitRow(idx)}
                      className="text-rose-400 hover:text-rose-300 text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      {requirement.targetLabel} Name / Topic *
                    </label>
                    <input
                      type="text"
                      value={row.targetName}
                      onChange={(e) => handleUpdateRow(idx, { targetName: e.target.value })}
                      placeholder={
                        requirement.targetLabel === 'Homework'
                          ? 'e.g., Workbook Unit 3 Page 18 / Grammar HW'
                          : 'e.g., Unit 5 Speaking Lesson / Present Perfect Lesson'
                      }
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        Date of {requirement.targetLabel} *
                      </label>
                      <input
                        type="date"
                        value={row.targetDate}
                        onChange={(e) => handleUpdateRow(idx, { targetDate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    {requirement.mode === 'points' && splitMode === 'split' && (
                      <div>
                        <label className="text-[11px] font-semibold text-amber-300 block mb-1">
                          Points for this {requirement.targetLabel} *
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={totalPointsToAllocate}
                          value={row.pointsAllocated || 1}
                          onChange={(e) =>
                            handleUpdateRow(idx, {
                              pointsAllocated: Math.max(
                                1,
                                Math.min(totalPointsToAllocate, parseInt(e.target.value, 10) || 1)
                              ),
                            })
                          }
                          className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Split mode controls & counter */}
            {requirement.mode === 'points' && splitMode === 'split' && (
              <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5">
                <div className="text-xs">
                  <span className="text-slate-400">Points Allocated: </span>
                  <span
                    className={`font-mono font-black ${
                      currentAllocatedSum === totalPointsToAllocate
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {currentAllocatedSum} / {totalPointsToAllocate} pts
                  </span>
                </div>
                {allocations.length < totalPointsToAllocate && (
                  <button
                    type="button"
                    onClick={handleAddSplitRow}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another {requirement.targetLabel}
                  </button>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save & Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
