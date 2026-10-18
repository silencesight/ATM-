import React, { useState } from 'react';
import { Wifi, AlertOctagon, RotateCw, Eye, EyeOff } from 'lucide-react';
import { Student, TeacherSettings } from '../types';
import {
  getCreditTier,
  formatCardNumber,
  DEFAULT_TEACHER_SETTINGS,
} from '../utils/creditCalculator';

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

  const themeHoloClass: Record<string, string> = {
    gold: 'from-[#6b440a] via-[#2c1d09] to-[#0b0e17] border-amber-400/50 shadow-amber-500/20',
    sapphire: 'from-[#005577] via-[#1b225e] to-[#0b0e17] border-[#00f0ff]/45 shadow-[#00f0ff]/20',
    emerald: 'from-[#005e43] via-[#0b3831] to-[#0b0e17] border-[#65f2b5]/45 shadow-[#65f2b5]/20',
    obsidian: 'from-[#1f2433] via-[#121521] to-[#07090f] border-white/25 shadow-black/50',
    ruby: 'from-[#6e1227] via-[#360d1c] to-[#0b0e17] border-rose-400/45 shadow-rose-500/20',
  };

  const currentGradient = themeHoloClass[student.cardDesignTheme] || themeHoloClass.sapphire;

  const maskedNumber = showFullNumber
    ? formatCardNumber(student.cardNumber)
    : `${student.cardNumber.slice(0, 4)} •••• •••• ${student.cardNumber.slice(-4)}`;

  return (
    <div
      className={`relative perspective-1000 ${
        compact ? 'w-full max-w-sm' : 'w-full max-w-md'
      } mx-auto select-none`}
    >
      {/* Front / Back Flip & Reveal Controls */}
      {interactive && (
        <div className="flex items-center justify-between mb-2.5 px-1 text-xs">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isDelisted
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-tertiary-container shadow-[0_0_8px_#65f2b5]'
              }`}
            />
            <span className="font-bold text-on-surface">
              {isDelisted ? 'INSTRUMENT REVOKED' : tier.cardLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowFullNumber(!showFullNumber)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full glass-pill hover:border-primary-container/50 text-on-surface font-mono text-[10px] uppercase tracking-wider transition-all"
              title={showFullNumber ? 'Hide full card number' : 'Reveal full card number'}
            >
              {showFullNumber ? (
                <EyeOff className="w-3 h-3 text-primary-container" />
              ) : (
                <Eye className="w-3 h-3 text-primary-container" />
              )}
              <span>{showFullNumber ? 'Mask' : 'Reveal'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full glass-pill hover:border-primary-container/50 text-on-surface font-mono text-[10px] uppercase tracking-wider transition-all"
            >
              <RotateCw className="w-3 h-3 text-primary-container" />
              <span>{isFlipped ? 'Front' : 'Flip 3D'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main 3D Holographic SmartPass Container (85.6mm x 54mm ratio = 1.586) */}
      <div
        data-credit-card-canvas="true"
        className={`credit-card-surface relative w-full aspect-[1.586/1] rounded-2xl p-6 text-white border shadow-2xl transition-all duration-500 overflow-hidden ${
          isDelisted
            ? 'bg-gradient-to-br from-neutral-900 via-neutral-950 to-stone-900 border-red-900/60 shadow-red-950/20'
            : `bg-gradient-to-br ${currentGradient}`
        }`}
        style={{
          boxShadow: isDelisted
            ? '0 10px 30px -5px rgba(220, 38, 38, 0.25)'
            : '0 20px 45px -8px rgba(0, 0, 0, 0.55), inset 0 1px 1px 0 rgba(255, 255, 255, 0.35)',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        {/* Holographic Refractory Foil Overlay */}
        <div className="absolute inset-0 pointer-events-none holo-sheen opacity-80" />
        <div
          className="absolute -top-20 -right-20 w-52 h-52 rounded-full pointer-events-none opacity-35 blur-2xl"
          style={{
            background: 'radial-gradient(circle, rgba(0,240,255,0.6) 0%, transparent 70%)',
          }}
        />

        {!effectiveFlipped ? (
          /* ================= FRONT SIDE ================= */
          <div className="relative h-full flex flex-col justify-between z-10">
            {/* Header: School / Reserve Name & Contactless */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-cyan-200/90 font-mono">
                  {settings.schoolName || 'Oxford English Academy'}
                </p>
                <p className="text-xs font-extrabold text-white tracking-wider font-headline mt-0.5">
                  AERO SMARTPASS • ESL RESERVE
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-cyan-200 rotate-90" />
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/25 backdrop-blur-md">
                  {student.paymentFrequency === 'monthly' ? 'E$482/MO' : 'E$241/BI-WK'}
                </span>
              </div>
            </div>

            {/* Middle: Metallic EMV Chip & Credit Standing */}
            <div className="flex items-center justify-between my-auto pt-1">
              <div className="flex items-center gap-3">
                {/* Metallic Gold/Cyan EMV Chip */}
                <div className="relative w-11 h-8 rounded-md bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-400 border border-amber-600/80 shadow-inner flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 border border-black/20 rounded-md" />
                  <div className="w-full h-[1px] bg-amber-900/40" />
                  <div className="absolute w-[1px] h-full bg-amber-900/40" />
                  <div className="w-4 h-4 rounded-full border border-amber-900/40" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-widest text-cyan-100/75 font-mono">
                    FICO Standing
                  </span>
                  <span className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1 font-mono">
                    {student.creditScore}
                    <span className="text-[10px] text-cyan-100/70 font-normal">/850</span>
                  </span>
                </div>
              </div>

              {/* Tier Pill & Class Badge */}
              <div className="flex flex-col items-end gap-1">
                <div className="px-2.5 py-0.5 rounded-full border border-white/30 bg-white/15 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase font-headline text-white">
                  {tier.name}
                </div>
                {student.className && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-black/40 text-cyan-200 border border-cyan-300/30">
                    {student.className}
                  </span>
                )}
              </div>
            </div>

            {/* Card Number */}
            <div>
              <div className="text-[9px] uppercase tracking-widest text-cyan-100/75 font-mono">
                Eurodollar Account Instrument
              </div>
              <div className="text-lg md:text-xl font-bold tracking-[0.2em] font-mono text-white drop-shadow-md">
                {maskedNumber}
              </div>
            </div>

            {/* Footer: Cardholder Name, Max Loan, Expiry */}
            <div className="flex items-end justify-between pt-1.5 border-t border-white/15">
              <div>
                <p className="text-[8px] uppercase tracking-widest text-cyan-100/70 font-mono">
                  Authorized Cardholder
                </p>
                <p className="text-sm font-bold tracking-wide uppercase font-headline text-white truncate max-w-[185px]">
                  {student.name}
                </p>
                <p className="text-[9px] text-cyan-100/80 font-mono">
                  ID: {student.studentIdNumber} {student.className ? `• ${student.className}` : ''}
                </p>
              </div>

              <div className="flex items-end gap-4">
                <div className="text-right">
                  <p className="text-[8px] uppercase tracking-widest text-cyan-100/70 font-mono">
                    Loan Ceiling
                  </p>
                  <p className="text-xs font-bold text-emerald-300 font-mono">
                    E$ {student.maxLoanLimit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] uppercase tracking-widest text-cyan-100/70 font-mono">
                    Valid Thru
                  </p>
                  <p className="text-xs font-bold font-mono text-white">{student.expiryDate}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= BACK SIDE ================= */
          <div className="relative h-full flex flex-col justify-between -mx-6 -my-6 p-6 z-10">
            {/* Optical Magnetic Strip */}
            <div className="absolute top-4 left-0 right-0 h-11 bg-neutral-950/95 border-y border-white/15 flex items-center px-4">
              <span className="text-[8px] font-mono text-cyan-300/60 tracking-widest uppercase">
                AERO-ECC-256 FINANCIAL NETWORK • NON-NEGOTIABLE EDUCATIONAL INSTRUMENT
              </span>
            </div>

            {/* Signature Strip & CVV */}
            <div className="mt-14 flex items-center gap-3">
              <div className="flex-1 h-9 bg-white/90 rounded text-slate-900 font-headline text-xs flex items-center px-3 italic font-semibold tracking-wide border border-white overflow-hidden select-none">
                {student.name} • Authorized Signature
              </div>
              <div className="bg-cyan-950 text-cyan-200 font-mono font-bold text-xs px-2.5 py-2 rounded border border-cyan-400/40 text-center shadow-inner">
                {student.cvv}
              </div>
            </div>

            {/* Didactic English Rules Text */}
            <div className="text-[9px] text-white/90 space-y-1 bg-black/45 p-2.5 rounded-xl border border-white/15 font-mono backdrop-blur-md">
              <p className="font-bold text-cyan-300">
                REPAYMENT VIA ENGLISH PROFICIENCY (EURODOLLARS):
              </p>
              <div className="grid grid-cols-3 gap-1 text-[8px]">
                <span className="text-emerald-300">1 Sentence = E${settings.sentenceValue}</span>
                <span className="text-cyan-200">1 Word = E${settings.wordValue}</span>
                <span className="text-indigo-200">1 Phrasal = E${settings.phrasalVerbValue}</span>
              </div>
              <p className="text-[8px] text-white/75 pt-0.5 leading-tight">
                Loans: {settings.baseInterestRate}% base interest (+{settings.delayPenaltyIncrement}% per delay). Punctual &amp; decorated notebooks boost score.
              </p>
            </div>

            {/* Card Issuer Footer */}
            <div className="flex items-center justify-between text-[8px] text-white/75 pt-1 font-mono">
              <span>
                {student.className ? `${student.className} • ` : ''}
                {settings.classroomTitle}
              </span>
              <span className="font-bold text-cyan-200">AUTHORIZED FACULTY ISSUE</span>
            </div>
          </div>
        )}

        {/* ================= DELISTED / DECLINED STAMP OVERLAY ================= */}
        {isDelisted && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex items-center justify-center p-4 pointer-events-none z-20">
            <div className="transform -rotate-12 border-4 border-red-500 bg-red-950/90 text-red-100 px-5 py-3 rounded-xl shadow-2xl text-center space-y-1 max-w-[90%]">
              <div className="flex items-center justify-center gap-1.5 text-red-400 font-extrabold tracking-widest text-xs uppercase">
                <AlertOctagon className="w-4 h-4" />
                CARD DECLINED FOREVER
              </div>
              <p className="text-lg font-black tracking-wider uppercase font-headline text-red-200 leading-none">
                DELISTED &amp; REVOKED
              </p>
              <p className="text-[9px] text-red-300 font-mono font-normal leading-tight">
                Unpaid didactic loan exceeded time limit. Account suspended.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3 Metric Glass Rails Under Card */}
      <div className="mt-3 grid grid-cols-3 gap-2.5 text-center text-xs">
        <div className="glass-well rounded-xl p-2.5">
          <p className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider font-bold">
            Credit Line
          </p>
          <p className="font-bold text-tertiary-fixed-dim font-mono text-sm mt-0.5">
            E$ {student.startingBalance}
          </p>
        </div>
        <div className="glass-well rounded-xl p-2.5">
          <p className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider font-bold">
            Loan Ceiling
          </p>
          <p className="font-bold text-primary-container font-mono text-sm mt-0.5">
            E$ {student.maxLoanLimit}
          </p>
        </div>
        <div className="glass-well rounded-xl p-2.5">
          <p className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider font-bold">
            Cadence
          </p>
          <p className="font-bold text-on-surface font-mono text-sm mt-0.5">
            {student.paymentFrequency === 'monthly' ? 'E$482/mo' : 'E$241/bi-wk'}
          </p>
        </div>
      </div>
    </div>
  );
};
