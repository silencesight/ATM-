import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Student, Loan } from '../types';

interface DeleteStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  activeLoan?: Loan | null;
  onConfirmDelete: (studentId: string) => void;
}

export const DeleteStudentModal: React.FC<DeleteStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  activeLoan,
  onConfirmDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="glass-panel specular-edge border border-error/40 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-on-surface animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-error/25 bg-error-container/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-error-container/40 text-error border border-error/30">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface font-headline uppercase tracking-wider">
                Erase Student Record
              </h3>
              <p className="text-xs text-error">
                Permanent classroom roster deletion
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl glass-pill text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-white text-base">{student.name}</p>
                <p className="text-xs text-slate-400 font-mono">
                  ID: {student.studentIdNumber} • Card #{student.cardNumber.slice(-4)}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                student.cardStatus === 'delisted'
                  ? 'bg-red-950 text-red-400 border border-red-800'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}>
                {student.cardStatus === 'delisted' ? 'Declined & Delisted' : 'Active Cardholder'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Balance:</span>
                <strong className="text-white">${student.currentBalance}.00</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Credit Score:</span>
                <strong className="text-blue-400">{student.creditScore} pts</strong>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800/60 text-xs text-red-200 space-y-2 font-mono">
            <div className="flex items-center gap-2 text-red-400 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Permanent Deletion Warning</span>
            </div>
            <p className="leading-relaxed text-[11px] text-slate-300">
              Are you sure you want to permanently delete <strong className="text-white">{student.name}</strong>?
              This action will destroy their credit card, delete their account, and purge all associated loan ledgers and statement presentations.
            </p>
            {activeLoan && (
              <p className="text-red-300 text-[11px] font-bold">
                ⚠️ This student currently has an active loan of ${activeLoan.totalDue - activeLoan.amountRepaid}.00 which will also be removed.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors font-mono"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirmDelete(student.id);
                onClose();
              }}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center gap-1.5 font-mono"
            >
              <Trash2 className="w-4 h-4" />
              Permanently Erase
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
