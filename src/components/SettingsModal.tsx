import React, { useState } from 'react';
import { X, Sliders, Save, RotateCcw, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';
import { TeacherSettings } from '../types';
import { DEFAULT_TEACHER_SETTINGS } from '../utils/creditCalculator';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TeacherSettings;
  onSaveSettings: (newSettings: TeacherSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [form, setForm] = useState<TeacherSettings>({ ...settings });

  if (!isOpen) return null;

  const handleChange = (field: keyof TeacherSettings, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [field]: typeof prev[field] === 'number' ? Number(value) : value,
    }));
  };

  const handleResetDefaults = () => {
    setForm({ ...DEFAULT_TEACHER_SETTINGS });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-950 text-emerald-400 border border-slate-800">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
                Classroom Financial &amp; Didactic Protocols
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure interest rates, penalty increments, task exchange values, and credit limits.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Group 1: General & Classroom info */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
              Classroom &amp; Card Branding
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">School / Institution Name</label>
                <input
                  type="text"
                  value={form.schoolName}
                  onChange={(e) => handleChange('schoolName', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-md text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Class / Project Title</label>
                <input
                  type="text"
                  value={form.classroomTitle}
                  onChange={(e) => handleChange('classroomTitle', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-md text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Group 2: English Task Exchange Rates (Currency) */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-mono flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              English Work Exchange Rates (Repayment Values)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  1 English Sentence ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 text-xs font-mono">$</span>
                  <input
                    type="number"
                    min="1"
                    value={form.sentenceValue}
                    onChange={(e) => handleChange('sentenceValue', e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block font-mono">Default: $25</span>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  1 New Word in Book ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 text-xs font-mono">$</span>
                  <input
                    type="number"
                    min="1"
                    value={form.wordValue}
                    onChange={(e) => handleChange('wordValue', e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block font-mono">Default: $5</span>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  1 Phrasal Verb ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 text-xs font-mono">$</span>
                  <input
                    type="number"
                    min="1"
                    value={form.phrasalVerbValue}
                    onChange={(e) => handleChange('phrasalVerbValue', e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block font-mono">Default: $50</span>
              </div>
            </div>
          </div>

          {/* Group 3: Interest Rates & Late Penalty */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-amber-400 font-mono">
              Interest &amp; Delay Penalties
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  Base Loan Interest (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.baseInterestRate}
                    onChange={(e) => handleChange('baseInterestRate', e.target.value)}
                    className="w-full pr-7 pl-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 text-xs font-mono">%</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block font-mono">Default: 10%</span>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  Penalty Increment per Delay (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={form.delayPenaltyIncrement}
                    onChange={(e) => handleChange('delayPenaltyIncrement', e.target.value)}
                    className="w-full pr-7 pl-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 text-xs font-mono">%</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block font-mono">Default: +2% per delay</span>
              </div>
            </div>
          </div>

          {/* Group 4: Card Starting Balances & Payments */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-300 font-mono">
              Card Limits &amp; Maintenance Payments
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Card Starting Balance</label>
                <input
                  type="number"
                  value={form.startingBalance}
                  onChange={(e) => handleChange('startingBalance', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white font-mono"
                />
                <span className="text-[10px] text-slate-500 font-mono">Default: $150</span>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Monthly Payment</label>
                <input
                  type="number"
                  value={form.monthlyPayment}
                  onChange={(e) => handleChange('monthlyPayment', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white font-mono"
                />
                <span className="text-[10px] text-slate-500 font-mono">Default: $482</span>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Bimonthly (2-Wk)</label>
                <input
                  type="number"
                  value={form.bimonthlyPayment}
                  onChange={(e) => handleChange('bimonthlyPayment', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white font-mono"
                />
                <span className="text-[10px] text-slate-500 font-mono">Default: $241</span>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Max Ceiling Cap</label>
                <input
                  type="number"
                  value={form.maxLoanCap}
                  onChange={(e) => handleChange('maxLoanCap', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white font-mono"
                />
                <span className="text-[10px] text-slate-500 font-mono">Default: $1000</span>
              </div>

              <div>
                <label className="text-[11px] text-emerald-300 block mb-1">Daily English $ Cap</label>
                <input
                  type="number"
                  value={form.maxDailyEnglishDollars ?? 100}
                  onChange={(e) => handleChange('maxDailyEnglishDollars', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-emerald-500/40 rounded-md text-emerald-300 font-mono"
                />
                <span className="text-[10px] text-slate-500 font-mono">Default: $100 / day</span>
              </div>
            </div>
          </div>

          {/* Group 5: Credit Score Adjustments */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-purple-300 font-mono">
              Credit Score Adjustments
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Punctual Payment Boost</label>
                <input
                  type="number"
                  value={form.punctualityScoreBoost}
                  onChange={(e) => handleChange('punctualityScoreBoost', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white font-mono"
                />
                <span className="text-[10px] text-slate-500 font-mono">Default: +15 pts</span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Decorated Presentation</label>
                <input
                  type="number"
                  value={form.decoratedPresentationScoreBoost}
                  onChange={(e) => handleChange('decoratedPresentationScoreBoost', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white font-mono"
                />
                <span className="text-[10px] text-slate-500 font-mono">Default: +35 pts</span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Late Delay Penalty</label>
                <input
                  type="number"
                  value={form.lateDelayScorePenalty}
                  onChange={(e) => handleChange('lateDelayScorePenalty', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white font-mono"
                />
                <span className="text-[10px] text-slate-500 font-mono">Default: -25 pts</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-mono uppercase tracking-wider transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/10"
              >
                <Save className="w-4 h-4" />
                Save Protocol
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
