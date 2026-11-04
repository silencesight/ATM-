import React, { useState } from 'react';
import { Student } from '../types';
import {
  X,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';

interface StudentPasswordModalProps {
  student: Student;
  onChangePassword: (studentId: string, newPassword: string | undefined) => void;
  onClose: () => void;
}

export const StudentPasswordModal: React.FC<StudentPasswordModalProps> = ({
  student,
  onChangePassword,
  onClose,
}) => {
  const [newPassword, setNewPassword] = useState(student.customPassword || '');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const effectivePassword = student.customPassword || student.cvv;

  const handleSaveCustomPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPassword.trim();
    if (!trimmed) {
      onChangePassword(student.id, undefined);
      setSavedNotice(`Password reset to 3-digit Card CVV (${student.cvv})!`);
      return;
    }
    onChangePassword(student.id, trimmed);
    setSavedNotice(`Password updated to "${trimmed}"!`);
  };

  const handleResetToCvv = () => {
    setNewPassword('');
    onChangePassword(student.id, undefined);
    setSavedNotice(`Password reset to default 3-digit Card CVV (${student.cvv})!`);
  };

  const handleCopy = (label: string, val: string) => {
    navigator.clipboard?.writeText(val);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-cyan-950/90 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">
                Account Recovery & Security
              </span>
              <h3 className="text-base font-black text-white">{student.name}</h3>
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

        <div className="p-6 space-y-5">
          {/* Current Login Credentials Box */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Current Student Login Credentials
              </span>
              {student.className && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 font-bold">
                  {student.className}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                    Login Name (Uppercase)
                  </span>
                  <span className="text-sm font-mono font-bold text-white">
                    {student.name.toUpperCase()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('name', student.name.toUpperCase())}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                  title="Copy Name"
                >
                  {copiedField === 'name' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                      Active Password
                    </span>
                    <span className="text-sm font-mono font-black text-emerald-400">
                      {effectivePassword}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('pw', effectivePassword)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                    title="Copy Password"
                  >
                    {copiedField === 'pw' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl px-3.5 py-2.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                    Default Card CVV
                  </span>
                  <span className="text-sm font-mono font-bold text-amber-300">
                    {student.cvv}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <form onSubmit={handleSaveCustomPassword} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Set New Custom Password (unlimited changes)
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setSavedNotice(null);
                }}
                placeholder={`Enter new password or leave blank for CVV (${student.cvv})`}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                Syncs immediately to the Student Web App via Supabase.
              </p>
            </div>

            {savedNotice && (
              <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{savedNotice}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetToCvv}
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to CVV ({student.cvv})
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save Password
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
