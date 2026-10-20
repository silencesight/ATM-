import React, { useState } from 'react';
import { X, BookOpen, Sparkles, CheckCircle2, DollarSign, FileText, Plus, Minus, Info } from 'lucide-react';
import { Student, Loan, TeacherSettings, EnglishSubmission } from '../types';
import { calculateEnglishRepaymentValue } from '../utils/creditCalculator';

interface EnglishSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  loan: Loan;
  settings: TeacherSettings;
  isTeacherReviewer?: boolean;
  onSubmitWork: (submission: Omit<EnglishSubmission, 'id' | 'createdAt'>) => void;
}

export const EnglishSubmissionModal: React.FC<EnglishSubmissionModalProps> = ({
  isOpen,
  onClose,
  student,
  loan,
  settings,
  isTeacherReviewer = false,
  onSubmitWork,
}) => {
  const [phrasalVerbsCount, setPhrasalVerbsCount] = useState<number>(0);
  const [sentencesCount, setSentencesCount] = useState<number>(0);
  const [wordsCount, setWordsCount] = useState<number>(0);
  const [hasDecoratedPresentation, setHasDecoratedPresentation] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const remainingBalance = Math.max(0, loan.totalDue - loan.amountRepaid);

  const { sentencesValue, wordsValue, phrasalVerbsValue, totalValue } =
    calculateEnglishRepaymentValue(
      sentencesCount,
      wordsCount,
      phrasalVerbsCount,
      settings
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalValue <= 0) return;

    onSubmitWork({
      loanId: loan.id,
      studentId: student.id,
      sentencesCount,
      wordsCount,
      phrasalVerbsCount,
      sentences: Array.from({ length: sentencesCount }, (_, i) => ({
        id: `sent_${Date.now()}_${i + 1}`,
        sentence: `In-class physical sentence statement #${i + 1}`,
      })),
      words: Array.from({ length: wordsCount }, (_, i) => ({
        id: `word_${Date.now()}_${i + 1}`,
        word: `In-class vocabulary word #${i + 1}`,
        contextOrMeaning: 'Presented in physical reading book',
      })),
      phrasalVerbs: Array.from({ length: phrasalVerbsCount }, (_, i) => ({
        id: `pv_${Date.now()}_${i + 1}`,
        verb: `In-class phrasal verb #${i + 1}`,
        exampleInNotebook: 'Presented in physical notebook',
      })),
      sentencesCredit: sentencesValue,
      wordsCredit: wordsValue,
      phrasalVerbsCredit: phrasalVerbsValue,
      totalCreditValue: totalValue,
      hasDecoratedPresentation,
      scoreBonusAwarded: hasDecoratedPresentation ? settings.decoratedPresentationScoreBoost : 0,
      status: isTeacherReviewer ? 'approved' : 'pending',
      teacherFeedback: notes.trim() || undefined,
      reviewedAt: isTeacherReviewer ? new Date().toISOString() : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl glass-panel rounded-3xl shadow-2xl p-6 text-on-surface my-8 specular-edge">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-tertiary-container/20 text-tertiary-fixed-dim border border-tertiary-container/40">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wider text-on-surface font-headline flex items-center gap-2">
                In-Class Statement Repayment
                {isTeacherReviewer && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                    Teacher Mode
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Student: <strong className="text-white">{student.name}</strong> • Balance Remaining:{' '}
                <strong className="text-amber-300 font-mono">${remainingBalance}</strong>
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

        {/* Physical Presentation In-Class Notice */}
        <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start gap-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-white uppercase tracking-wider font-mono text-[11px]">In-Class Physical Presentation: </strong>
            Students present their written statements and notebook exercises directly to the teacher in class. Simply dial in the quantity of completed items below.
          </p>
        </div>

        {/* Live Calculation Telemetry Rail */}
        <div className="mt-4 p-3.5 rounded-lg bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="bg-slate-900 p-2.5 rounded-md border border-slate-800">
            <span className="text-[9px] uppercase tracking-widest text-purple-300 font-bold font-mono block">
              Phrasal Verbs
            </span>
            <span className="text-base font-bold text-white font-mono">
              ${phrasalVerbsValue}
            </span>
            <span className="text-[9px] text-slate-500 font-mono block">
              {phrasalVerbsCount} × ${settings.phrasalVerbValue}
            </span>
          </div>

          <div className="bg-slate-900 p-2.5 rounded-md border border-slate-800">
            <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold font-mono block">
              Sentences
            </span>
            <span className="text-base font-bold text-white font-mono">
              ${sentencesValue}
            </span>
            <span className="text-[9px] text-slate-500 font-mono block">
              {sentencesCount} × ${settings.sentenceValue}
            </span>
          </div>

          <div className="bg-slate-900 p-2.5 rounded-md border border-slate-800">
            <span className="text-[9px] uppercase tracking-widest text-amber-300 font-bold font-mono block">
              Book Words
            </span>
            <span className="text-base font-bold text-white font-mono">
              ${wordsValue}
            </span>
            <span className="text-[9px] text-slate-500 font-mono block">
              {wordsCount} × ${settings.wordValue}
            </span>
          </div>

          <div className="bg-slate-900 p-2.5 rounded-md border border-emerald-500/30">
            <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold font-mono block">
              Total Credit
            </span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              ${totalValue}
            </span>
            <span className="text-[9px] text-slate-400 font-mono block">
              {totalValue >= remainingBalance
                ? 'Covers 100% due!'
                : `Rem: $${Math.max(0, remainingBalance - totalValue)}`}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Item 1: Phrasal Verbs in Notebook ($50 each) */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  Phrasal Verbs in Notebook
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Written and demonstrated in student notebook • <strong className="text-purple-300 font-mono">${settings.phrasalVerbValue}.00</strong> credit each
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setPhrasalVerbsCount(Math.max(0, phrasalVerbsCount - 1))}
                className="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center font-mono font-bold transition-colors"
                disabled={phrasalVerbsCount <= 0}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <input
                type="number"
                min="0"
                max="9999"
                value={phrasalVerbsCount}
                onChange={(e) => setPhrasalVerbsCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 h-8 text-center text-sm font-bold bg-slate-900 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-purple-400"
              />

              <button
                type="button"
                onClick={() => setPhrasalVerbsCount(phrasalVerbsCount + 1)}
                className="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center font-mono font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setPhrasalVerbsCount(phrasalVerbsCount + 2)}
                className="px-2 h-8 rounded-md bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/60 text-[10px] font-mono font-bold transition-colors"
              >
                +2
              </button>

              <button
                type="button"
                onClick={() => setPhrasalVerbsCount(phrasalVerbsCount + 10)}
                className="px-2 h-8 rounded-md bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/60 text-[10px] font-mono font-bold transition-colors"
              >
                +10
              </button>
            </div>
          </div>

          {/* Item 2: English Sentences ($25 each) */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  English Sentences
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Complete grammatical statements presented in class • <strong className="text-emerald-400 font-mono">${settings.sentenceValue}.00</strong> credit each
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setSentencesCount(Math.max(0, sentencesCount - 1))}
                className="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center font-mono font-bold transition-colors"
                disabled={sentencesCount <= 0}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <input
                type="number"
                min="0"
                max="9999"
                value={sentencesCount}
                onChange={(e) => setSentencesCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 h-8 text-center text-sm font-bold bg-slate-900 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-emerald-400"
              />

              <button
                type="button"
                onClick={() => setSentencesCount(sentencesCount + 1)}
                className="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center font-mono font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setSentencesCount(sentencesCount + 2)}
                className="px-2 h-8 rounded-md bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 text-[10px] font-mono font-bold transition-colors"
              >
                +2
              </button>

              <button
                type="button"
                onClick={() => setSentencesCount(sentencesCount + 10)}
                className="px-2 h-8 rounded-md bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 text-[10px] font-mono font-bold transition-colors"
              >
                +10
              </button>
            </div>
          </div>

          {/* Item 3: New Words in Book ($5 each) */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  New Words in Book
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                New vocabulary identified in student reading book • <strong className="text-amber-300 font-mono">${settings.wordValue}.00</strong> credit each
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setWordsCount(Math.max(0, wordsCount - 1))}
                className="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center font-mono font-bold transition-colors"
                disabled={wordsCount <= 0}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <input
                type="number"
                min="0"
                max="9999"
                value={wordsCount}
                onChange={(e) => setWordsCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 h-8 text-center text-sm font-bold bg-slate-900 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-amber-400"
              />

              <button
                type="button"
                onClick={() => setWordsCount(wordsCount + 1)}
                className="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center font-mono font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setWordsCount(wordsCount + 5)}
                className="px-2 h-8 rounded-md bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60 text-[10px] font-mono font-bold transition-colors"
              >
                +5
              </button>

              <button
                type="button"
                onClick={() => setWordsCount(wordsCount + 10)}
                className="px-2 h-8 rounded-md bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60 text-[10px] font-mono font-bold transition-colors"
              >
                +10
              </button>
            </div>
          </div>

          {/* Section 4: Notebook Presentation & Decoration Credit Bonus */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasDecoratedPresentation}
                onChange={(e) => setHasDecoratedPresentation(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-400 focus:ring-offset-slate-900"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-200 font-mono">
                    Well-Presented Statements &amp; Notebook Decorations
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold">
                    +{settings.decoratedPresentationScoreBoost} PTS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Rule: &quot;If the statements are well-presented with decorations their credit score could moderately increase, and ask for bigger loans.&quot; Includes colorful highlights, drawings, neat calligraphy, or creative grammar diagrams.
                </p>
              </div>
            </label>
          </div>

          {/* Optional Note / Topic field */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono block mb-1">
              Classroom Notes / Chapter Reference (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Unit 4 Notebook Statements presented in Friday class"
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Overpayment Surplus Notice Banner */}
          {totalValue > remainingBalance && (
            <div className="p-3.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono">
              <div className="flex items-center gap-2 text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Credit (${totalValue}) exceeds loan (${remainingBalance}). Surplus{' '}
                  <strong className="text-white underline decoration-emerald-400">
                    +${totalValue - remainingBalance}.00
                  </strong>{' '}
                  will go directly to {student.name}&apos;s account balance!
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-xs shrink-0 self-start sm:self-auto font-mono shadow">
                +${totalValue - remainingBalance} to Account
              </span>
            </div>
          )}

          {/* Action footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div className="text-xs text-slate-400 font-mono">
              Credit Value: <strong className="text-emerald-400 text-sm">${totalValue}</strong>
              {totalValue > remainingBalance && (
                <span className="text-emerald-300 text-[11px] ml-2">
                  (${remainingBalance} loan + ${totalValue - remainingBalance} account)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={totalValue <= 0}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 font-mono"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isTeacherReviewer
                  ? totalValue > remainingBalance
                    ? `Settle Loan (+ $${totalValue - remainingBalance} to Balance)`
                    : `Verify & Settle (+$${totalValue})`
                  : totalValue > remainingBalance
                  ? `Submit (+$${totalValue - remainingBalance} to Account)`
                  : `Submit Work Record (+$${totalValue})`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
