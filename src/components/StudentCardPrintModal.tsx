import React, { useState, useEffect } from 'react';
import {
  Printer,
  Scissors,
  X,
  RotateCw,
  Sparkles,
  Layers,
  Info,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Student, TeacherSettings } from '../types';
import { CreditCardVisual } from './CreditCardVisual';
import { DEFAULT_TEACHER_SETTINGS } from '../utils/creditCalculator';

interface StudentCardPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  settings?: TeacherSettings;
}

export const StudentCardPrintModal: React.FC<StudentCardPrintModalProps> = ({
  isOpen,
  onClose,
  student,
  settings = DEFAULT_TEACHER_SETTINGS,
}) => {
  const [cardSide, setCardSide] = useState<'both' | 'front' | 'back'>('both');
  const [printDensity, setPrintDensity] = useState<'standard' | 'compact'>('standard');
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const handleAfterPrint = () => {
      setIsPrinting(false);
      document.body.classList.remove('is-printing-student-card');
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('is-printing-student-card');
    };
  }, []);

  if (!isOpen) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    document.body.classList.add('is-printing-student-card');
    setTimeout(() => {
      window.focus();
      window.print();
    }, 120);
  };

  const todayStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      {/* Modal Dialog (Hidden on Print) */}
      <div className="no-print bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-950/90 via-slate-900 to-indigo-950/90 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Printer className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 block font-mono">
                Oxford ATM 4.0 • Student Replacement Card
              </span>
              <h3 className="text-base font-black text-white">Print My SmartPass Card</h3>
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

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Lost Card Helper Notice */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-bold text-white">
                Lost your physical card? Print your official replacement here!
              </p>
              <p className="text-[11px] leading-relaxed text-slate-400">
                You can print this card on any home or school printer, or choose &ldquo;Save as PDF&rdquo; on your phone or PC.
                Choose <strong className="text-cyan-300">Both Sides (Fold in Half)</strong> to print the front and back side-by-side with fold and cut guides to fit standard card holders.
              </p>
            </div>
          </div>

          {/* Print Format Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 font-mono">
                Card Sides Layout
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCardSide('both')}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    cardSide === 'both'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Both (Foldable)
                </button>
                <button
                  type="button"
                  onClick={() => setCardSide('front')}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    cardSide === 'front'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Front Only
                </button>
                <button
                  type="button"
                  onClick={() => setCardSide('back')}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    cardSide === 'back'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Back Only
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 font-mono">
                Card Print Scale
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPrintDensity('standard')}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    printDensity === 'standard'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Standard Wallet Size
                </button>
                <button
                  type="button"
                  onClick={() => setPrintDensity('compact')}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    printDensity === 'compact'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Compact (Lanyard)
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Screen Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 px-1">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Paper Print Preview (What will print):
              </span>
              <span className="text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                {cardSide === 'both' ? 'Foldable 2-Sided Sheet' : `${cardSide.toUpperCase()} Side`}
              </span>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 overflow-hidden">
              {/* Outer Cut Border Simulation */}
              <div className="border-2 border-dashed border-slate-600/80 rounded-2xl p-3 sm:p-4 bg-slate-900/60 relative">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 pb-2 mb-2 border-b border-slate-800">
                  <span className="flex items-center gap-1">
                    <Scissors className="w-3.5 h-3.5 text-amber-400" />
                    Cut along dashed rectangle
                  </span>
                  <span>Issued: {todayStr}</span>
                </div>

                {cardSide === 'both' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    {/* Front */}
                    <div className="w-full">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 mb-1 flex items-center gap-1">
                        <span>Card Front</span>
                      </div>
                      <CreditCardVisual
                        student={student}
                        settings={settings}
                        interactive={false}
                        compact={printDensity !== 'standard'}
                        printDensity={printDensity}
                        hideMetricsRail={true}
                        forceSide="front"
                      />
                    </div>

                    {/* Back */}
                    <div className="w-full sm:pl-3 sm:border-l sm:border-dashed sm:border-slate-600">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 mb-1 flex items-center justify-between">
                        <span>Card Back (PIN / CVV)</span>
                        <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] text-slate-400">
                          <Scissors className="w-3 h-3 text-amber-400" />
                          Fold Center
                        </span>
                      </div>
                      <CreditCardVisual
                        student={student}
                        settings={settings}
                        interactive={false}
                        compact={printDensity !== 'standard'}
                        printDensity={printDensity}
                        hideMetricsRail={true}
                        forceSide="back"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="max-w-sm mx-auto">
                    <CreditCardVisual
                      student={student}
                      settings={settings}
                      interactive={false}
                      compact={printDensity !== 'standard'}
                      printDensity={printDensity}
                      hideMetricsRail={true}
                      forceSide={cardSide}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950/80 px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Card / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PURE PRINTABLE SHEET (RENDERED ONLY DURING WINDOW.PRINT)         */}
      {/* ============================================================== */}
      <div className="student-card-print-sheet hidden print:block print:w-full print:m-0 print:p-0 print:bg-white text-black">
        <div
          style={{
            maxWidth: '190mm',
            margin: '0 auto',
            padding: '8mm',
            backgroundColor: '#ffffff',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {/* Institutional Top Dossier Header */}
          <div
            style={{
              borderBottom: '2px solid #0f172a',
              paddingBottom: '4mm',
              marginBottom: '5mm',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '14pt',
                  fontWeight: 900,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: '#0f172a',
                }}
              >
                {settings.schoolName || 'Oxford English Academy'} • ATM 4.0
              </div>
              <div style={{ fontSize: '9pt', color: '#475569', marginTop: '1mm', fontWeight: 600 }}>
                Official SmartPass Debit Card Replacement Instrument
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '8pt', color: '#64748b' }}>
              <div>Cardholder: <strong style={{ color: '#0f172a' }}>{student.name}</strong></div>
              <div>Class: <strong style={{ color: '#0f172a' }}>{student.className || 'Universal'}</strong></div>
              <div>Issued: <strong>{todayStr}</strong></div>
            </div>
          </div>

          {/* Dotted Cut Perimeter Container */}
          <div
            style={{
              border: '1.5px dashed #475569',
              borderRadius: '12px',
              padding: '5mm',
              backgroundColor: '#ffffff',
              position: 'relative',
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
            }}
          >
            {/* Cut Guide Label */}
            <div
              style={{
                fontSize: '8pt',
                fontWeight: 700,
                color: '#64748b',
                marginBottom: '4mm',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px dashed #cbd5e1',
                paddingBottom: '2mm',
              }}
            >
              <span>✂ CUT ALONG OUTER DASHED RECTANGLE</span>
              <span>STANDARD ID-1 SMARTPASS WALLET SIZE</span>
            </div>

            {cardSide === 'both' ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '5mm',
                  alignItems: 'center',
                }}
              >
                {/* Front Side */}
                <div>
                  <div
                    style={{
                      fontSize: '7.5pt',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: '#0f172a',
                      marginBottom: '1.5mm',
                    }}
                  >
                    Front Side
                  </div>
                  <CreditCardVisual
                    student={student}
                    settings={settings}
                    interactive={false}
                    compact={printDensity !== 'standard'}
                    printDensity={printDensity}
                    hideMetricsRail={true}
                    forceSide="front"
                  />
                </div>

                {/* Back Side with Fold Center Line */}
                <div
                  style={{
                    borderLeft: '1.5px dashed #475569',
                    paddingLeft: '5mm',
                  }}
                >
                  <div
                    style={{
                      fontSize: '7.5pt',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: '#0f172a',
                      marginBottom: '1.5mm',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>Back Side (CVV & Rules)</span>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>✂ FOLD CENTER LINE</span>
                  </div>
                  <CreditCardVisual
                    student={student}
                    settings={settings}
                    interactive={false}
                    compact={printDensity !== 'standard'}
                    printDensity={printDensity}
                    hideMetricsRail={true}
                    forceSide="back"
                  />
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: '95mm', margin: '0 auto' }}>
                <CreditCardVisual
                  student={student}
                  settings={settings}
                  interactive={false}
                  compact={printDensity !== 'standard'}
                  printDensity={printDensity}
                  hideMetricsRail={true}
                  forceSide={cardSide}
                />
              </div>
            )}
          </div>

          {/* Folding & Use Instructions */}
          <div
            style={{
              marginTop: '5mm',
              padding: '3mm 4mm',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '8pt',
              color: '#334155',
              lineHeight: 1.45,
            }}
          >
            <strong style={{ color: '#0f172a' }}>Quick Assembly Instructions:</strong>
            <ol style={{ margin: '2mm 0 0 4mm', padding: 0 }}>
              <li>Cut along the outer dashed rectangle using scissors.</li>
              <li>Fold in half along the vertical center dashed line to create an instant 2-sided card.</li>
              <li>Optional: Insert into a standard plastic ID card holder or laminate for extra durability.</li>
              <li>Use the 16-digit card number and 3-digit CVV printed on the back to access your account anytime!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
