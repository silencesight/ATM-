import React, { useState } from 'react';
import {
  CreditCard,
  User,
  ShieldCheck,
  Printer,
  Sliders,
  HelpCircle,
  Download,
  RotateCcw,
  Sparkles,
  BookOpen,
  DollarSign,
  ShoppingBag
} from 'lucide-react';
import { Student, TeacherSettings } from '../types';
import { StudentSelectorNav } from './StudentSelectorNav';

interface NavbarProps {
  currentView: 'teacher' | 'student' | 'print' | 'store';
  onChangeView: (view: 'teacher' | 'student' | 'print' | 'store') => void;
  students: Student[];
  selectedStudentId: string;
  onSelectStudent: (id: string) => void;
  onOpenSettings: () => void;
  onResetData: () => void;
  onExportData: () => void;
  settings: TeacherSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onChangeView,
  students,
  selectedStudentId,
  onSelectStudent,
  onOpenSettings,
  onResetData,
  onExportData,
  settings,
}) => {
  const [showRulesModal, setShowRulesModal] = useState(false);

  return (
    <>
      <header className="no-print sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => onChangeView('teacher')}
              className="cursor-pointer flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 p-0.5 flex items-center justify-center text-emerald-400 font-serif-card font-bold text-lg group-hover:border-emerald-500/50 transition-colors">
                £
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold tracking-tight text-emerald-500 uppercase leading-tight">
                  ESL Credit Reserve
                </h1>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none">
                  Teacher Terminal v1.0 • {settings.schoolName}
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher: Teacher Hub vs. Student View vs Print */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 gap-1">
            <button
              onClick={() => onChangeView('teacher')}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                currentView === 'teacher'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Teacher Hub</span>
            </button>

            <button
              onClick={() => onChangeView('student')}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                currentView === 'student'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Student Portal</span>
            </button>

            <button
              onClick={() => onChangeView('print')}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                currentView === 'print'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Studio</span>
            </button>

            <button
              onClick={() => onChangeView('store')}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                currentView === 'store'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-amber-300/80 hover:text-amber-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Store</span>
            </button>
          </div>

          {/* Right Controls: Student Selector & Tools */}
          <div className="flex items-center gap-2">
            {(currentView === 'student' || currentView === 'store') && (
              <StudentSelectorNav
                students={students}
                selectedStudentId={selectedStudentId}
                onSelectStudent={onSelectStudent}
                label={currentView === 'store' ? 'Shopper' : 'Student'}
                variant="navbar"
                showBalance={true}
                showCreditScore={false}
                showClassFilter={true}
              />
            )}

            {/* Classroom Rules Guide Button */}
            <button
              onClick={() => setShowRulesModal(true)}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded-lg border border-transparent hover:border-slate-800 transition-colors"
              title="Classroom Financial & Didactic Rules"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded-lg border border-transparent hover:border-slate-800 transition-colors"
              title="Classroom Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Export JSON */}
            <button
              onClick={onExportData}
              className="hidden sm:flex p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded-lg border border-transparent hover:border-slate-800 transition-colors"
              title="Export Classroom Data JSON"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Reset Data */}
            <button
              onClick={onResetData}
              className="hidden sm:flex p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg border border-transparent hover:border-slate-800 transition-colors"
              title="Reset to Sample Class Data"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Classroom Didactic Rules Reference Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-2xl shadow-2xl text-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold uppercase tracking-tight text-white">
                  Classroom Credit Card &amp; Didactic Rules
                </h2>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 uppercase font-bold tracking-wider"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              {/* Section 1 */}
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <h3 className="font-bold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  1. Starting Balance &amp; Maintenance Schedule
                </h3>
                <p>
                  Every student receives a didactic credit card with an initial starting balance of <strong className="font-mono text-emerald-300">${settings.startingBalance}</strong>.
                </p>
                <p>
                  Standard monthly payment is <strong className="font-mono text-white">${settings.monthlyPayment}</strong>, with a bimonthly option of <strong className="font-mono text-white">${settings.bimonthlyPayment}</strong> (every two weeks).
                </p>
              </div>

              {/* Section 2 */}
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <h3 className="font-bold text-blue-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  2. Loans &amp; Duration Limits
                </h3>
                <p>
                  Students can request loans starting at <strong className="font-mono text-white">${settings.startingLoanLimit}</strong>. Based on credit history, limits increase up to <strong className="font-mono text-white">${settings.maxLoanCap}</strong>.
                </p>
                <p className="text-amber-300 font-medium">
                  ⚠️ Rule: Exactly one active loan at a time; settlement required before requesting another.
                </p>
                <p>
                  Duration: Maximum <strong>5 days</strong> for Short Loans, and maximum <strong>3 weeks (21 days)</strong> for Big Loans.
                </p>
              </div>

              {/* Section 3 */}
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <h3 className="font-bold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  3. Repayment with English Proficiency Currency
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono">
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-center">
                    <span className="text-emerald-400 font-bold block text-sm">${settings.sentenceValue}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-sans">English sentence</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-center">
                    <span className="text-emerald-400 font-bold block text-sm">${settings.wordValue}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-sans">New book word</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-center">
                    <span className="text-emerald-400 font-bold block text-sm">${settings.phrasalVerbValue}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-sans">Phrasal verb</span>
                  </div>
                </div>
              </div>

              {/* Section 4 */}
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <h3 className="font-bold text-purple-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  4. Interest, Delays &amp; Credit Progression
                </h3>
                <p>
                  Base loan interest is <strong className="font-mono text-white">{settings.baseInterestRate}%</strong>. Delayed payments increase interest by <strong className="font-mono text-amber-300">+{settings.delayPenaltyIncrement}% per delay</strong>.
                </p>
                <p>
                  Punctuality: On-time payments boost credit score by <strong className="font-mono text-emerald-400">+{settings.punctualityScoreBoost} pts</strong>.
                </p>
                <p>
                  Decorated Presentation: Art and illustrations boost credit score by <strong className="font-mono text-emerald-400">+{settings.decoratedPresentationScoreBoost} pts</strong>.
                </p>
                <p className="text-red-400 font-bold">
                  ⛔ Permanent Delisting: Overdue loans that are not paid lead to permanent card decline and delisting.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors"
              >
                Understood &amp; Ready
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
