import React, { useState } from 'react';
import { Wifi, ShieldCheck, AlertOctagon, RotateCw, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Student, TeacherSettings } from '../types';
import { getCreditTier, formatCardNumber, DEFAULT_TEACHER_SETTINGS } from '../utils/creditCalculator';

interface CreditCardVisualProps {
  student: Student;
  settings?: TeacherSettings;
  interactive?: boolean;
  compact?: boolean;
  forceSide?: 'front' | 'back';
}

export const CreditCardVisual: React.FC<CreditCardVisualProps> = ({
  student,
  settings = DEFAULT_TEACHER_SETTINGS,
  interactive = true,
  compact = false,
  forceSide,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const effectiveFlipped = forceSide !== undefined ? forceSide === 'back' : isFlipped;
  const [showFullNumber, setShowFullNumber] = useState(false);
  const tier = getCreditTier(student.creditScore);
  const isDelisted = student.cardStatus === 'delisted';

  const themeGradients = {
    gold: 'from-amber-700 via-amber-900 to-yellow-950 border-amber-500/50 shadow-amber-900/30',
    sapphire: 'from-blue-800 via-indigo-950 to-slate-950 border-blue-400/50 shadow-blue-900/30',
    emerald: 'from-emerald-800 via-teal-950 to-slate-950 border-emerald-400/50 shadow-emerald-900/30',
    obsidian: 'from-neutral-900 via-zinc-950 to-black border-neutral-600/50 shadow-black/50',
    ruby: 'from-rose-900 via-red-950 to-slate-950 border-rose-500/50 shadow-rose-950/30',
  };

  const currentGradient = themeGradients[student.cardDesignTheme] || themeGradients.sapphire;

  const maskedNumber = showFullNumber
    ? formatCardNumber(student.cardNumber)
    : `${student.cardNumber.slice(0, 4)} •••• •••• ${student.cardNumber.slice(-4)}`;

  return (
    <div className={`relative perspective-1000 ${compact ? 'w-full max-w-sm' : 'w-full max-w-md'} mx-auto select-none`}>
      {/* Front / Back Flip Button */}
      {interactive && (
        <div className="flex items-center justify-between mb-2 px-1 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
            <span className={`inline-block w-2 h-2 rounded-full ${isDelisted ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="font-bold text-slate-300">
              {isDelisted ? 'CARD DELISTED & REVOKED' : tier.cardLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowFullNumber(!showFullNumber)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-mono text-[11px] uppercase tracking-wider transition-colors"
              title={showFullNumber ? 'Hide full number' : 'Show full number'}
            >
              {showFullNumber ? <EyeOff className="w-3 h-3 text-slate-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
              <span>{showFullNumber ? 'Mask' : 'Reveal'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-mono text-[11px] uppercase tracking-wider transition-colors"
            >
              <RotateCw className="w-3 h-3 text-slate-400" />
              <span>{isFlipped ? 'Front' : 'Back'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main 3D Card Container with Aspect Ratio standard 1.586 (85.6mm x 54mm) */}
      <div
        className={`relative w-full aspect-[1.586/1] rounded-2xl p-6 text-white border shadow-2xl transition-all duration-500 overflow-hidden ${
          isDelisted
            ? 'bg-gradient-to-br from-neutral-900 via-neutral-950 to-stone-900 border-red-900/60 shadow-red-950/20 grayscale-30'
            : `bg-gradient-to-br ${currentGradient}`
        }`}
        style={{
          boxShadow: isDelisted
            ? '0 10px 30px -5px rgba(220, 38, 38, 0.25)'
            : '0 15px 35px -5px rgba(0, 0, 0, 0.6), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        {/* Subtle holographic foil shine pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.8), transparent 70%), linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
          }}
        />

        {!effectiveFlipped ? (
          /* ================= FRONT SIDE ================= */
          <div className="relative h-full flex flex-col justify-between">
            {/* Header: Bank / School Name & Contactless */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-300 font-serif-card">
                  {settings.schoolName || 'Oxford English Academy'}
                </p>
                <p className="text-xs font-bold text-amber-200/90 tracking-wide font-serif-card">
                  ESL CLASSROOM RESERVE
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-slate-300 rotate-90" />
                <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">
                  {student.paymentFrequency === 'monthly' ? 'E$482/MO' : 'E$241/BI-WK'}
                </span>
              </div>
            </div>

            {/* Middle: EMV Chip & Tier Watermark */}
            <div className="flex items-center justify-between my-auto pt-1">
              <div className="flex items-center gap-3">
                {/* Metallic Gold Chip */}
                <div className="relative w-11 h-8 rounded-md bg-gradient-to-tr from-yellow-600 via-amber-300 to-yellow-500 border border-yellow-700/80 shadow-inner flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 border border-black/20 rounded-md" />
                  <div className="w-full h-[1px] bg-yellow-900/40" />
                  <div className="absolute w-[1px] h-full bg-yellow-900/40" />
                  <div className="w-4 h-4 rounded-full border border-yellow-900/40" />
                </div>
                {/* Credit Score Pill */}
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono-code">Credit Score</span>
                  <span className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1 font-mono-code">
                    {student.creditScore}
                    <span className="text-[10px] text-slate-400 font-normal">/850</span>
                  </span>
                </div>
              </div>

              {/* Tier Name Pill & Class Badge */}
              <div className="flex flex-col items-end gap-1">
                <div className={`px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase font-serif-card ${tier.badgeBg} ${tier.badgeColor}`}>
                  {tier.name}
                </div>
                {student.className && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono-code font-bold uppercase bg-black/40 text-amber-300 border border-amber-400/30">
                    {student.className}
                  </span>
                )}
              </div>
            </div>

            {/* Card Number */}
            <div>
              <div className="text-[9px] uppercase tracking-widest text-slate-400 font-mono-code">
                Student Card Number (Eurodollar Account)
              </div>
              <div className="text-lg md:text-xl font-bold tracking-[0.2em] font-mono-code text-white drop-shadow-md">
                {maskedNumber}
              </div>
            </div>

            {/* Footer: Cardholder Name, Expiry, Starting Balance */}
            <div className="flex items-end justify-between pt-1 border-t border-white/10">
              <div>
                <p className="text-[8px] uppercase tracking-widest text-slate-400 font-mono-code">Student Cardholder</p>
                <p className="text-sm font-bold tracking-wide uppercase font-serif-card text-white truncate max-w-[180px]">
                  {student.name}
                </p>
                <p className="text-[9px] text-slate-400 font-mono-code">
                  ID: {student.studentIdNumber} {student.className ? `• ${student.className}` : ''}
                </p>
              </div>

              <div className="flex items-end gap-4">
                <div className="text-right">
                  <p className="text-[8px] uppercase tracking-widest text-slate-400 font-mono-code">Max Loan</p>
                  <p className="text-xs font-bold text-amber-300 font-mono-code">
                    E${student.maxLoanLimit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] uppercase tracking-widest text-slate-400 font-mono-code">Expires</p>
                  <p className="text-xs font-bold font-mono-code text-white">{student.expiryDate}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= BACK SIDE ================= */
          <div className="relative h-full flex flex-col justify-between -mx-6 -my-6 p-6">
            {/* Black Magnetic Strip */}
            <div className="absolute top-4 left-0 right-0 h-11 bg-neutral-950 border-y border-neutral-800 flex items-center px-4">
              <span className="text-[8px] font-mono-code text-neutral-600 tracking-widest uppercase">
                ENGLISH DIDACTIC FINANCIAL NETWORK • NON-NEGOTIABLE EDUCATIONAL INSTRUMENT
              </span>
            </div>

            {/* Signature Strip & CVV */}
            <div className="mt-14 flex items-center gap-3">
              <div className="flex-1 h-9 bg-slate-200 rounded text-slate-800 font-serif-card text-xs flex items-center px-3 italic font-semibold tracking-wide border border-slate-300 overflow-hidden select-none">
                {student.name} (Authorized Signature)
              </div>
              <div className="bg-white text-slate-900 font-mono-code font-bold text-xs px-2.5 py-2 rounded border border-slate-300 text-center shadow-inner">
                {student.cvv}
              </div>
            </div>

            {/* Didactic English Rules Text */}
            <div className="text-[9px] text-slate-300 space-y-1 bg-black/30 p-2 rounded-lg border border-white/10 font-mono-code">
              <p className="font-semibold text-amber-200">REPAYMENT VIA ENGLISH PROFICIENCY (EURODOLLARS):</p>
              <div className="grid grid-cols-3 gap-1 text-[8px]">
                <span className="text-emerald-300">1 Sentence = E$25</span>
                <span className="text-cyan-300">1 Word = E$5</span>
                <span className="text-purple-300">1 Phrasal Verb = E$50</span>
              </div>
              <p className="text-[8px] text-slate-400 pt-0.5 leading-tight">
                Loans: 10% base interest (+2% per delay). Punctual & decorated notebooks boost score. Non-payment leads to permanent card delisting.
              </p>
            </div>

            {/* Card Issuer Footer */}
            <div className="flex items-center justify-between text-[8px] text-slate-400 pt-1">
              <span>{student.className ? `${student.className} • ` : ''}{settings.classroomTitle}</span>
              <span className="font-bold text-slate-300">AUTHORIZED TEACHER ISSUE</span>
            </div>
          </div>
        )}

        {/* ================= DELISTED / DECLINED STAMP OVERLAY ================= */}
        {isDelisted && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4 pointer-events-none">
            <div className="transform -rotate-12 border-4 border-red-600 bg-red-950/90 text-red-100 px-5 py-3 rounded-lg shadow-2xl text-center space-y-1 max-w-[90%]">
              <div className="flex items-center justify-center gap-1.5 text-red-400 font-extrabold tracking-widest text-xs uppercase">
                <AlertOctagon className="w-4 h-4" />
                CARD DECLINED FOREVER
              </div>
              <p className="text-lg font-black tracking-wider uppercase font-serif-card text-red-200 leading-none">
                DELISTED & REVOKED
              </p>
              <p className="text-[9px] text-red-300 font-mono-code font-normal leading-tight">
                Unpaid didactic loan exceeded time limit. Account permanently disabled.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Summary Pill Bar Under Card */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
          <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-bold">Credit Line</p>
          <p className="font-bold text-emerald-400 font-mono text-sm mt-0.5">E${student.startingBalance}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
          <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-bold">Max Loan Cap</p>
          <p className="font-bold text-amber-300 font-mono text-sm mt-0.5">E${student.maxLoanLimit}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
          <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-bold">Schedule</p>
          <p className="font-bold text-slate-200 font-mono text-sm mt-0.5">
            {student.paymentFrequency === 'monthly' ? 'E$482/mo' : 'E$241/bi-wk'}
          </p>
        </div>
      </div>
    </div>
  );
};
